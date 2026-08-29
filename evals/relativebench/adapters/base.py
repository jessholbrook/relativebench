"""Stable request and result contracts for inference adapters."""

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class GenerationRequest:
    model_id: str
    repository: str
    revision: str
    scenario_id: str
    prompt: str
    seed: int
    max_new_tokens: int
    temperature: float
    top_p: float
    model_options: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class GenerationResult:
    text: str
    status: str = "ok"
    latency_ms: Optional[float] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    cost_usd: Optional[float] = None
