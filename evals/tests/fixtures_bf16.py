"""Explicitly fake execution metadata for software tests; never model evidence."""
from relativebench.artifacts import sha256_value


def fingerprint(repository='r', revision='a' * 40):
    return {'version': 'bf16-execution-v1', 'weight_format': 'bfloat16',
            'adapter_code_sha256': 'f' * 64,
            'runtime': dict.fromkeys(('torch', 'transformers', 'tokenizers', 'safetensors', 'huggingface-hub'), 'fixture'),
            'snapshot': {'repository': repository, 'revision': revision, 'files': {'fixture.safetensors': '0' * 64}},
            'context_limit': 32768, 'attention_implementation': 'eager',
            'environment': dict.fromkeys(('python', 'platform', 'cuda', 'driver', 'gpu', 'cublas_workspace_config'), 'fixture')}


def metadata(value):
    return {'weight_format': 'bfloat16', 'execution_fingerprint': value,
            'execution_fingerprint_sha256': sha256_value(value)}
