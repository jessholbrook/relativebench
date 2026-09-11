"""Offline BF16 Transformers adapter. Real GPU execution remains an activation gate."""

import json
import os
import platform
import subprocess
import time
from importlib.metadata import version
from pathlib import Path

from .base import GenerationResult
from ..artifacts import sha256_file
from ..execution_identity import validate_fingerprint


RUNTIME_PACKAGES = ('torch', 'transformers', 'tokenizers', 'safetensors', 'huggingface-hub')


def generation_options(request):
    if request.temperature <= 0:
        raise ValueError('This primary adapter requires the frozen stochastic profile.')
    return {'do_sample': True, 'max_new_tokens': request.max_new_tokens,
            'temperature': request.temperature, 'top_p': request.top_p,
            'top_k': request.top_k, 'min_p': request.min_p,
            'num_beams': 1, 'num_return_sequences': 1, 'repetition_penalty': 1.0,
            'use_cache': True}


def verify_snapshot(directory, expected):
    directory = Path(directory).resolve()
    metadata = json.loads((directory / 'relativebench-snapshot.json').read_text())
    for field in ('repository', 'revision'):
        if metadata.get(field) != expected[field]:
            raise ValueError(f'Snapshot {field} does not match the pinned model.')
    if metadata.get('weight_format') != 'bfloat16':
        raise ValueError('Quantized or unverified weights cannot enter the primary adapter.')
    files = metadata.get('files', {})
    actual = {str(path.relative_to(directory)) for path in directory.rglob('*')
              if path.is_file() and not str(path.relative_to(directory)).startswith('.cache/')
              and path.name != 'relativebench-snapshot.json'}
    if not files or set(files) != actual or 'config.json' not in files or not any(name.endswith('.safetensors') for name in files):
        raise ValueError('Snapshot inventory is incomplete or changed.')
    for name, digest in files.items():
        path = (directory / name).resolve()
        if not path.is_relative_to(directory) or sha256_file(path) != digest:
            raise ValueError(f'Snapshot file failed integrity verification: {name}')
    config = json.loads((directory / 'config.json').read_text())
    if config.get('quantization_config'):
        raise ValueError('Quantization configuration is forbidden for primary execution.')
    return metadata


class Bf16Adapter:
    name = 'transformers-bf16'

    def __init__(self, directory, model, runtime_lock, context_limit=32768):
        self.metadata = verify_snapshot(directory, model)
        self.expected_model = model
        self.context_limit = context_limit
        self.runtime = {package: version(package) for package in RUNTIME_PACKAGES}
        if json.loads(Path(runtime_lock).read_text()) != self.runtime:
            raise ValueError('Runtime package versions do not match the frozen runtime lock.')
        os.environ.setdefault('CUBLAS_WORKSPACE_CONFIG', ':4096:8')
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, GenerationConfig
        if not torch.cuda.is_available() or not torch.cuda.is_bf16_supported():
            raise ValueError('A BF16-capable CUDA host is required; no CPU/quantized fallback.')
        if torch.cuda.get_device_properties(0).total_memory < 32 * 1024**3:
            raise ValueError('Primary host needs at least 32 GiB GPU memory; profile peak usage before collection.')
        torch.use_deterministic_algorithms(True)
        driver = subprocess.run(['nvidia-smi', '--query-gpu=driver_version', '--format=csv,noheader'],
                                check=True, capture_output=True, text=True).stdout.strip()
        self.execution_fingerprint = {
            'version': 'bf16-execution-v1', 'weight_format': 'bfloat16',
            'adapter_code_sha256': sha256_file(__file__),
            'runtime': self.runtime, 'snapshot': self.metadata,
            'context_limit': context_limit, 'attention_implementation': 'eager',
            'environment': {'python': platform.python_version(), 'platform': platform.platform(),
                            'cuda': torch.version.cuda, 'driver': driver,
                            'gpu': torch.cuda.get_device_name(0),
                            'gpu_memory': torch.cuda.get_device_properties(0).total_memory,
                            'gpu_capability': list(torch.cuda.get_device_capability(0)),
                            'cublas_workspace_config': os.environ['CUBLAS_WORKSPACE_CONFIG'],
                            'deterministic_algorithms': torch.are_deterministic_algorithms_enabled(),
                            'matmul_allow_tf32': torch.backends.cuda.matmul.allow_tf32,
                            'cudnn_allow_tf32': torch.backends.cudnn.allow_tf32,
                            'cudnn_benchmark': torch.backends.cudnn.benchmark},
        }
        self.execution_fingerprint_sha256 = validate_fingerprint(self.execution_fingerprint)
        self.torch = torch
        self.tokenizer = AutoTokenizer.from_pretrained(directory, local_files_only=True, trust_remote_code=False)
        self.model = AutoModelForCausalLM.from_pretrained(
            directory, local_files_only=True, trust_remote_code=False,
            dtype=torch.bfloat16, attn_implementation='eager',
        ).to('cuda').eval()
        if any(parameter.is_floating_point() and parameter.dtype != torch.bfloat16 for parameter in self.model.parameters()):
            raise ValueError('Loaded model is not entirely BF16; refusing silent precision changes.')
        self.generation_config = GenerationConfig.from_model_config(self.model.config)
        # Retain the pinned checkpoint's token-level stopping contract, but not
        # its unfrozen sampling/repetition defaults.
        for name in ('eos_token_id', 'bos_token_id', 'pad_token_id'):
            setattr(self.generation_config, name, getattr(self.model.generation_config, name))

    def generate(self, request):
        if request.repository != self.expected_model['repository'] or request.revision != self.expected_model['revision']:
            raise ValueError('Request does not match the loaded pinned model.')
        if request.model_options.get('enable_thinking', False) is not False:
            raise ValueError('The primary adapter cannot pool adapted thinking mode.')
        messages = [{'role': 'system', 'content': request.system_instruction}, {'role': 'user', 'content': request.prompt}]
        rendered = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True,
                                                      **request.model_options)
        inputs = self.tokenizer(rendered, return_tensors='pt', add_special_tokens=False).to('cuda')
        input_tokens = inputs['input_ids'].shape[-1]
        if input_tokens + request.max_new_tokens > self.context_limit:
            raise ValueError('Request exceeds the frozen context envelope; do not truncate silently.')
        self.torch.manual_seed(request.seed)
        self.torch.cuda.manual_seed_all(request.seed)
        self.torch.cuda.synchronize()
        started = time.perf_counter()
        with self.torch.inference_mode():
            result = self.model.generate(**inputs, generation_config=self.generation_config, **generation_options(request))
        self.torch.cuda.synchronize()
        tokens = result[0, input_tokens:]
        return GenerationResult(text=self.tokenizer.decode(tokens, skip_special_tokens=True),
                                input_tokens=input_tokens, output_tokens=len(tokens),
                                latency_ms=(time.perf_counter() - started) * 1000,
                                metadata={'weight_format': 'bfloat16', 'runtime': self.runtime,
                                          'execution_fingerprint': self.execution_fingerprint,
                                          'execution_fingerprint_sha256': self.execution_fingerprint_sha256,
                                          'snapshot_sha256': self.metadata['files'],
                                          'attention_implementation': 'eager',
                                          'finish_reason': 'length' if len(tokens) == request.max_new_tokens else 'stop'})
