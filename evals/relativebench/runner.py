"""Versioned pilot execution with deterministic artifact manifests."""

from collections import Counter
from pathlib import Path

from .adapters.base import GenerationRequest
from .artifacts import sha256_file, sha256_value, write_json, write_jsonl
from .manifest import validate_pilot


def run_pilot(pilot_path, profile_id, output_dir, adapter):
    validation = validate_pilot(pilot_path)
    if not validation["valid"]:
        raise ValueError("Invalid pilot configuration: " + "; ".join(validation["errors"]))

    pilot = validation["pilot"]
    profile = next(
        (item for item in pilot["execution_profiles"] if item["id"] == profile_id),
        None,
    )
    if profile is None:
        raise ValueError(f"Unknown execution profile: {profile_id}")

    artifacts = []
    for scenario in sorted(validation["scenario_manifest"]["scenarios"], key=lambda item: item["id"]):
        for role in ("previous", "new"):
            model = pilot["models"][role]
            model_options = profile["model_options"].get(model["id"], {})
            for seed in sorted(profile["seeds"]):
                request = GenerationRequest(
                    model_id=model["id"],
                    repository=model["repository"],
                    revision=model["revision"],
                    scenario_id=scenario["id"],
                    prompt=scenario["prompt_template"],
                    seed=seed,
                    max_new_tokens=profile["max_new_tokens"],
                    temperature=profile["temperature"],
                    top_p=profile["top_p"],
                    model_options=model_options,
                )
                request_payload = {
                    "model_id": request.model_id,
                    "repository": request.repository,
                    "revision": request.revision,
                    "scenario_id": request.scenario_id,
                    "prompt": request.prompt,
                    "seed": request.seed,
                    "max_new_tokens": request.max_new_tokens,
                    "temperature": request.temperature,
                    "top_p": request.top_p,
                    "model_options": request.model_options,
                }
                result = adapter.generate(request)
                artifact = {
                    "artifact_version": "0.1.0",
                    "pilot_id": pilot["pilot_id"],
                    "transition_id": pilot["transition_id"],
                    "profile_id": profile["id"],
                    "condition": profile["condition"],
                    "scenario_id": scenario["id"],
                    "model_role": role,
                    "model_id": model["id"],
                    "model_revision": model["revision"],
                    "seed": seed,
                    "request_sha256": sha256_value(request_payload),
                    "response_sha256": sha256_value({"text": result.text}),
                    "response_text": result.text,
                    "status": result.status,
                    "latency_ms": result.latency_ms,
                    "input_tokens": result.input_tokens,
                    "output_tokens": result.output_tokens,
                    "cost_usd": result.cost_usd,
                    "adapter": adapter.name,
                }
                artifact["artifact_id"] = sha256_value(artifact)
                artifacts.append(artifact)

    output_dir = Path(output_dir)
    artifact_path = output_dir / "responses.jsonl"
    write_jsonl(artifact_path, artifacts)
    manifest = {
        "run_manifest_version": "0.1.0",
        "pilot_id": pilot["pilot_id"],
        "transition_id": pilot["transition_id"],
        "profile_id": profile["id"],
        "adapter": adapter.name,
        "scenario_manifest_sha256": sha256_file(validation["scenario_path"]),
        "responses_sha256": sha256_file(artifact_path),
        "artifact_count": len(artifacts),
        "artifacts_by_model_role": dict(sorted(Counter(item["model_role"] for item in artifacts).items())),
        "scenario_count": validation["scenario_count"],
        "seeds": sorted(profile["seeds"]),
    }
    write_json(output_dir / "run-manifest.json", manifest)
    return manifest
