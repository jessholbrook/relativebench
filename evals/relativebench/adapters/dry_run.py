"""Deterministic no-model adapter for end-to-end pipeline verification."""

from .base import GenerationResult


class DryRunAdapter:
    name = "dry-run"

    def generate(self, request):
        thinking = request.model_options.get("enable_thinking")
        mode = "thinking" if thinking else "direct"
        text = f"DRY-RUN::{request.model_id}::{request.scenario_id}::seed={request.seed}::mode={mode}"
        return GenerationResult(text=text)
