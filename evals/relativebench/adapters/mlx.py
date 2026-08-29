"""MLX-LM adapter for locally converted, provenance-checked model revisions."""

import time
from pathlib import Path

from .base import GenerationResult
from ..mlx_runtime import load_provenance, model_file_hashes, runtime_versions


class MlxAdapter:
    name = "mlx-lm-4bit"

    def __init__(self, model_dir):
        self.model_dir = Path(model_dir).resolve()
        self.provenance = load_provenance(self.model_dir)
        if model_file_hashes(self.model_dir) != self.provenance.get("files"):
            raise ValueError("MLX model files do not match recorded provenance hashes.")
        if runtime_versions() != self.provenance.get("runtime"):
            raise ValueError("Installed MLX runtime does not match model conversion provenance.")

        import mlx.core as mx
        from mlx_lm import load, stream_generate
        from mlx_lm.sample_utils import make_sampler

        self.mx = mx
        self.stream_generate = stream_generate
        self.make_sampler = make_sampler
        self.model, self.tokenizer = load(str(self.model_dir))

    def _verify_request(self, request):
        expected = {
            "model_id": request.model_id,
            "source_repository": request.repository,
            "source_revision": request.revision,
        }
        mismatches = [
            key
            for key, value in expected.items()
            if self.provenance.get(key) != value
        ]
        if mismatches:
            raise ValueError(
                "MLX model provenance does not match request: " + ", ".join(mismatches)
            )

    def generate(self, request):
        self._verify_request(request)
        messages = [
            {"role": "system", "content": request.system_instruction},
            {"role": "user", "content": request.prompt},
        ]
        template_options = {}
        if "enable_thinking" in request.model_options:
            template_options["enable_thinking"] = request.model_options["enable_thinking"]
        prompt = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
            **template_options,
        )
        input_tokens = len(self.tokenizer.encode(prompt))
        self.mx.random.seed(request.seed)
        sampler = self.make_sampler(
            temp=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k,
            min_p=request.min_p,
        )

        started = time.perf_counter()
        chunks = []
        last_response = None
        for response in self.stream_generate(
            self.model,
            self.tokenizer,
            prompt=prompt,
            max_tokens=request.max_new_tokens,
            sampler=sampler,
        ):
            chunks.append(response.text)
            last_response = response
        text = "".join(chunks)
        latency_ms = (time.perf_counter() - started) * 1000
        output_tokens = (
            last_response.generation_tokens
            if last_response is not None
            else len(self.tokenizer.encode(text))
        )
        finish_reason = (
            last_response.finish_reason if last_response is not None else "empty_generation"
        )
        transformation = self.provenance["transformation"]
        return GenerationResult(
            text=text,
            latency_ms=latency_ms,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            metadata={
                "source_repository": self.provenance["source_repository"],
                "source_revision": self.provenance["source_revision"],
                "weight_format": transformation["format"],
                "quantization_mode": transformation["quantization_mode"],
                "quantization_bits": transformation["bits"],
                "quantization_group_size": transformation["group_size"],
                "finish_reason": finish_reason,
                "runtime": runtime_versions(),
            },
        )
