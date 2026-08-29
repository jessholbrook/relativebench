"""Versioned pilot execution with resumable, independently verified artifacts."""

import json
from collections import Counter
from pathlib import Path

from .adapters.base import GenerationRequest
from .artifacts import canonical_json_bytes, sha256_file, sha256_value, write_json, write_jsonl
from .manifest import validate_pilot


def _load_execution(pilot_path, profile_id, model_roles):
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

    selected_roles = tuple(model_roles or ("previous", "new"))
    unknown_roles = set(selected_roles) - {"previous", "new"}
    if unknown_roles:
        raise ValueError(f"Unknown model roles: {', '.join(sorted(unknown_roles))}")
    if not selected_roles:
        raise ValueError("At least one model role is required.")
    if len(selected_roles) != len(set(selected_roles)):
        raise ValueError("Model roles must not be repeated.")
    return validation, pilot, profile, selected_roles


def _expected_requests(validation, pilot, profile, selected_roles):
    expected = []
    for scenario in sorted(validation["scenario_manifest"]["scenarios"], key=lambda item: item["id"]):
        for role in selected_roles:
            model = pilot["models"][role]
            model_options = profile["model_options"].get(model["id"], {})
            for seed in sorted(profile["seeds"]):
                request = GenerationRequest(
                    model_id=model["id"],
                    repository=model["repository"],
                    revision=model["revision"],
                    scenario_id=scenario["id"],
                    system_instruction=profile["system_instruction"],
                    prompt=scenario["prompt_template"],
                    seed=seed,
                    max_new_tokens=profile["max_new_tokens"],
                    temperature=profile["temperature"],
                    top_p=profile["top_p"],
                    top_k=profile["top_k"],
                    min_p=profile["min_p"],
                    model_options=model_options,
                )
                request_payload = {
                    "model_id": request.model_id,
                    "repository": request.repository,
                    "revision": request.revision,
                    "scenario_id": request.scenario_id,
                    "system_instruction": request.system_instruction,
                    "prompt": request.prompt,
                    "seed": request.seed,
                    "max_new_tokens": request.max_new_tokens,
                    "temperature": request.temperature,
                    "top_p": request.top_p,
                    "top_k": request.top_k,
                    "min_p": request.min_p,
                    "model_options": request.model_options,
                }
                expected.append(
                    {
                        "key": (scenario["id"], role, seed),
                        "request": request,
                        "request_sha256": sha256_value(request_payload),
                        "static": {
                            "pilot_id": pilot["pilot_id"],
                            "transition_id": pilot["transition_id"],
                            "profile_id": profile["id"],
                            "condition": profile["condition"],
                            "scenario_id": scenario["id"],
                            "model_role": role,
                            "model_id": model["id"],
                            "model_revision": model["revision"],
                            "seed": seed,
                        },
                    }
                )
    return expected


def _artifact_identity(artifact):
    return {
        key: value
        for key, value in artifact.items()
        if key not in {"artifact_id", "latency_ms", "cost_usd"}
    }


def _read_jsonl(path):
    records = []
    for line_number, line in enumerate(Path(path).read_text().splitlines(), start=1):
        if not line.strip():
            continue
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError as error:
            raise ValueError(f"Invalid JSON in {path} line {line_number}: {error}") from error
    return records


def _run_manifest(validation, pilot, profile, selected_roles, adapter_name, artifacts, status):
    expected = _expected_requests(validation, pilot, profile, selected_roles)
    expected_count = len(expected)
    return {
        "run_manifest_version": "0.3.0",
        "status": status,
        "pilot_id": pilot["pilot_id"],
        "transition_id": pilot["transition_id"],
        "profile_id": profile["id"],
        "adapter": adapter_name,
        "scenario_manifest_sha256": sha256_file(validation["scenario_path"]),
        "run_plan_sha256": sha256_value(
            {
                "profile_id": profile["id"],
                "model_roles": list(selected_roles),
                "request_sha256": sorted(item["request_sha256"] for item in expected),
            }
        ),
        "responses_sha256": None,
        "artifact_set_sha256": sha256_value(sorted(item["artifact_id"] for item in artifacts)),
        "artifact_count": len(artifacts),
        "expected_artifact_count": expected_count,
        "pending_artifact_count": expected_count - len(artifacts),
        "artifacts_by_model_role": dict(sorted(Counter(item["model_role"] for item in artifacts).items())),
        "scenario_count": validation["scenario_count"],
        "seeds": sorted(profile["seeds"]),
        "model_roles": list(selected_roles),
        "artifact_path": "responses.jsonl",
    }


def _write_manifest(output_dir, manifest):
    artifact_path = Path(output_dir) / "responses.jsonl"
    if artifact_path.is_file():
        manifest["responses_sha256"] = sha256_file(artifact_path)
    manifest_path = Path(output_dir) / "run-manifest.json"
    temporary_path = manifest_path.with_suffix(".json.tmp")
    write_json(temporary_path, manifest)
    temporary_path.replace(manifest_path)


def verify_run(pilot_path, profile_id, output_dir, model_roles=None, require_complete=True):
    """Recompute request, response, artifact, and set hashes without invoking a model."""
    validation, pilot, profile, selected_roles = _load_execution(pilot_path, profile_id, model_roles)
    expected = _expected_requests(validation, pilot, profile, selected_roles)
    expected_by_key = {item["key"]: item for item in expected}
    output_dir = Path(output_dir)
    artifact_path = output_dir / "responses.jsonl"
    errors = []
    warnings = []
    if not artifact_path.is_file():
        return {
            "valid": False,
            "complete": False,
            "errors": [f"Missing response artifact file: {artifact_path}"],
            "warnings": [],
            "artifact_count": 0,
            "expected_artifact_count": len(expected),
        }

    try:
        artifacts = _read_jsonl(artifact_path)
    except ValueError as error:
        return {
            "valid": False,
            "complete": False,
            "errors": [str(error)],
            "warnings": [],
            "artifact_count": 0,
            "expected_artifact_count": len(expected),
        }

    seen = set()
    adapters = set()
    for index, artifact in enumerate(artifacts, start=1):
        key = (artifact.get("scenario_id"), artifact.get("model_role"), artifact.get("seed"))
        label = f"artifact {index} ({key[0]}/{key[1]}/seed={key[2]})"
        if key in seen:
            errors.append(f"Duplicate {label}.")
            continue
        seen.add(key)
        expected_item = expected_by_key.get(key)
        if expected_item is None:
            errors.append(f"Unexpected {label}.")
            continue
        for field, value in expected_item["static"].items():
            if artifact.get(field) != value:
                errors.append(f"{label} has mismatched {field}.")
        if artifact.get("request_sha256") != expected_item["request_sha256"]:
            errors.append(f"{label} has a mismatched request hash.")
        if artifact.get("response_sha256") != sha256_value({"text": artifact.get("response_text")}):
            errors.append(f"{label} has a mismatched response hash.")
        if artifact.get("artifact_id") != sha256_value(_artifact_identity(artifact)):
            errors.append(f"{label} has a mismatched artifact identity.")
        if artifact.get("status") != "ok":
            errors.append(f"{label} has non-ok status {artifact.get('status')}.")
        if artifact.get("adapter"):
            adapters.add(artifact["adapter"])

    missing = sorted(set(expected_by_key) - seen)
    complete = not missing and len(artifacts) == len(expected)
    if missing:
        message = f"Run is missing {len(missing)} of {len(expected)} expected artifacts."
        (errors if require_complete else warnings).append(message)
    if len(adapters) > 1:
        errors.append("Run contains artifacts from multiple adapters.")

    manifest_path = output_dir / "run-manifest.json"
    manifest = None
    if manifest_path.is_file():
        try:
            manifest = json.loads(manifest_path.read_text())
        except json.JSONDecodeError as error:
            errors.append(f"Invalid run manifest JSON: {error}")
    artifact_ids = [item.get("artifact_id") for item in artifacts]
    if any(not isinstance(item, str) for item in artifact_ids):
        errors.append("One or more artifacts are missing a string artifact_id.")
        artifact_ids = [item for item in artifact_ids if isinstance(item, str)]
    artifact_set_sha256 = sha256_value(sorted(artifact_ids))
    artifact_roles = [item.get("model_role") for item in artifacts]
    if any(not isinstance(item, str) for item in artifact_roles):
        errors.append("One or more artifacts are missing a string model_role.")
    artifacts_by_model_role = dict(
        sorted(Counter(item for item in artifact_roles if isinstance(item, str)).items())
    )
    responses_sha256 = sha256_file(artifact_path)
    if manifest is None:
        warnings.append("Run manifest is missing.")
    elif manifest.get("status") == "complete" or require_complete:
        checks = {
            "pilot_id": pilot["pilot_id"],
            "transition_id": pilot["transition_id"],
            "profile_id": profile["id"],
            "scenario_manifest_sha256": sha256_file(validation["scenario_path"]),
            "run_plan_sha256": sha256_value(
                {
                    "profile_id": profile["id"],
                    "model_roles": list(selected_roles),
                    "request_sha256": sorted(item["request_sha256"] for item in expected),
                }
            ),
            "responses_sha256": responses_sha256,
            "artifact_set_sha256": artifact_set_sha256,
            "artifact_count": len(artifacts),
            "expected_artifact_count": len(expected),
            "pending_artifact_count": 0,
            "artifacts_by_model_role": artifacts_by_model_role,
            "scenario_count": validation["scenario_count"],
            "seeds": sorted(profile["seeds"]),
            "model_roles": list(selected_roles),
        }
        for field, value in checks.items():
            if manifest.get(field) != value:
                errors.append(f"Run manifest has mismatched {field}.")
        if manifest.get("status") != "complete" and require_complete:
            errors.append("Run manifest is not marked complete.")
        if adapters and manifest.get("adapter") not in adapters:
            errors.append("Run manifest adapter does not match response artifacts.")

    return {
        "verification_version": "0.1.0",
        "valid": not errors,
        "complete": complete,
        "errors": errors,
        "warnings": warnings,
        "artifact_count": len(artifacts),
        "expected_artifact_count": len(expected),
        "artifacts_by_model_role": artifacts_by_model_role,
        "responses_sha256": responses_sha256,
        "artifact_set_sha256": artifact_set_sha256,
        "adapters": sorted(adapters),
    }


def run_pilot(
    pilot_path,
    profile_id,
    output_dir,
    adapter,
    model_roles=None,
    resume=False,
    checkpoint_every=1,
    progress_callback=None,
):
    validation, pilot, profile, selected_roles = _load_execution(pilot_path, profile_id, model_roles)
    expected = _expected_requests(validation, pilot, profile, selected_roles)
    output_dir = Path(output_dir)
    artifact_path = output_dir / "responses.jsonl"
    manifest_path = output_dir / "run-manifest.json"

    if checkpoint_every < 1:
        raise ValueError("checkpoint_every must be at least 1.")
    if (artifact_path.exists() or manifest_path.exists()) and not resume:
        raise ValueError(f"Output already exists; pass resume=True to continue: {output_dir}")

    artifacts = []
    if resume and artifact_path.is_file():
        report = verify_run(
            pilot_path,
            profile_id,
            output_dir,
            model_roles=selected_roles,
            require_complete=False,
        )
        if not report["valid"]:
            raise ValueError("Cannot resume invalid artifacts: " + "; ".join(report["errors"]))
        if report["adapters"] and report["adapters"] != [adapter.name]:
            raise ValueError(
                "Cannot resume artifacts from a different adapter: "
                + ", ".join(report["adapters"])
            )
        artifacts = _read_jsonl(artifact_path)

    completed_keys = {
        (item["scenario_id"], item["model_role"], item["seed"])
        for item in artifacts
    }
    pending = [item for item in expected if item["key"] not in completed_keys]
    output_dir.mkdir(parents=True, exist_ok=True)
    if not artifact_path.exists():
        write_jsonl(artifact_path, [])

    if pending:
        with artifact_path.open("a", encoding="utf-8") as handle:
            for pending_index, item in enumerate(pending, start=1):
                result = adapter.generate(item["request"])
                artifact = {
                    "artifact_version": "0.3.0",
                    **item["static"],
                    "request_sha256": item["request_sha256"],
                    "response_sha256": sha256_value({"text": result.text}),
                    "response_text": result.text,
                    "status": result.status,
                    "latency_ms": result.latency_ms,
                    "input_tokens": result.input_tokens,
                    "output_tokens": result.output_tokens,
                    "cost_usd": result.cost_usd,
                    "adapter": adapter.name,
                    "adapter_metadata": result.metadata,
                }
                artifact["artifact_id"] = sha256_value(_artifact_identity(artifact))
                handle.write(canonical_json_bytes(artifact).decode("utf-8") + "\n")
                handle.flush()
                artifacts.append(artifact)
                completed = len(artifacts)
                if pending_index % checkpoint_every == 0 or pending_index == len(pending):
                    _write_manifest(
                        output_dir,
                        _run_manifest(
                            validation,
                            pilot,
                            profile,
                            selected_roles,
                            adapter.name,
                            artifacts,
                            "in_progress",
                        ),
                    )
                if progress_callback is not None:
                    progress_callback(completed, len(expected))

    manifest = _run_manifest(
        validation,
        pilot,
        profile,
        selected_roles,
        adapter.name,
        artifacts,
        "complete",
    )
    _write_manifest(output_dir, manifest)
    report = verify_run(
        pilot_path,
        profile_id,
        output_dir,
        model_roles=selected_roles,
        require_complete=True,
    )
    if not report["valid"]:
        raise ValueError("Completed run failed verification: " + "; ".join(report["errors"]))
    return manifest
