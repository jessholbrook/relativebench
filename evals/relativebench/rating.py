"""Blinded, counterbalanced rating packets for internal interface rehearsal."""

import json
import random
import re
from collections import Counter
from math import isfinite
from pathlib import Path

from .artifacts import sha256_file, sha256_value, write_json
from .manifest import validate_pilot
from .runner import verify_run

FORBIDDEN_PUBLIC_FIELDS = {
    "artifact_id",
    "model_id",
    "model_revision",
    "model_role",
    "presented_new_on_left",
    "repository",
    "revision",
    "source_revision",
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


def _walk_field_names(value):
    if isinstance(value, dict):
        for key, child in value.items():
            yield key
            yield from _walk_field_names(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_field_names(child)


def _execution_profile(pilot, profile_id):
    profile = next(
        (item for item in pilot["execution_profiles"] if item["id"] == profile_id),
        None,
    )
    if profile is None:
        raise ValueError(f"Unknown execution profile: {profile_id}")
    return profile


def create_rating_packet(
    pilot_path,
    profile_id,
    execution_dir,
    output_path,
    key_output_path,
    schedule_seed=20260829,
    public_output_path=None,
):
    """Create two mirrored public forms plus a separately retained private role key."""
    validation = validate_pilot(pilot_path)
    if not validation["valid"]:
        raise ValueError("Invalid pilot configuration: " + "; ".join(validation["errors"]))
    pilot = validation["pilot"]
    profile = _execution_profile(pilot, profile_id)
    if profile["condition"] != "frozen":
        raise ValueError("The internal blind-rating rehearsal requires a frozen profile.")

    execution_dir = Path(execution_dir)
    role_records = {}
    run_commitments = []
    for role in ("previous", "new"):
        role_dir = execution_dir / role
        report = verify_run(
            pilot_path,
            profile_id,
            role_dir,
            model_roles=(role,),
        )
        if not report["valid"] or not report["complete"]:
            raise ValueError(f"Cannot rate unverified {role} artifacts: {report['errors']}")
        records = _read_jsonl(role_dir / "responses.jsonl")
        role_records[role] = {
            (item["scenario_id"], item["seed"]): item
            for item in records
        }
        run_commitments.append(report["artifact_set_sha256"])

    previous_keys = set(role_records["previous"])
    new_keys = set(role_records["new"])
    if previous_keys != new_keys:
        raise ValueError("Previous and new response sets do not contain identical scenario/seed pairs.")
    if not previous_keys:
        raise ValueError("No response pairs are available for rating.")

    scenario_by_id = {
        item["id"]: item for item in validation["scenario_manifest"]["scenarios"]
    }
    packet_id = sha256_value(
        {
            "packet_version": "0.1.0",
            "pilot_id": pilot["pilot_id"],
            "profile_id": profile_id,
            "scenario_manifest_sha256": sha256_file(validation["scenario_path"]),
            "run_commitments": sorted(run_commitments),
            "schedule_seed": schedule_seed,
        }
    )

    generator = random.Random(schedule_seed)
    pair_keys = sorted(previous_keys)
    generator.shuffle(pair_keys)
    new_on_left_schedule = [index < len(pair_keys) / 2 for index in range(len(pair_keys))]
    generator.shuffle(new_on_left_schedule)

    public_pairs = []
    private_pairs = []
    form_assignments = {"form-a": [], "form-b": []}
    for position, ((scenario_id, seed), new_on_left_form_a) in enumerate(
        zip(pair_keys, new_on_left_schedule),
        start=1,
    ):
        scenario = scenario_by_id[scenario_id]
        pair_id = sha256_value(
            {"packet_id": packet_id, "scenario_id": scenario_id, "seed": seed}
        )
        role_order = ["previous", "new"]
        generator.shuffle(role_order)
        public_responses = []
        response_role_by_id = {}
        private_responses = []
        for slot, role in zip(("a", "b"), role_order):
            artifact = role_records[role][(scenario_id, seed)]
            response_id = sha256_value(
                {
                    "packet_id": packet_id,
                    "pair_id": pair_id,
                    "slot": slot,
                    "response_sha256": artifact["response_sha256"],
                }
            )
            public_responses.append({"response_id": response_id, "text": artifact["response_text"]})
            response_role_by_id[response_id] = role
            private_responses.append(
                {
                    "response_id": response_id,
                    "model_role": role,
                    "artifact_id": artifact["artifact_id"],
                    "response_sha256": artifact["response_sha256"],
                }
            )

        public_pairs.append(
            {
                "pair_id": pair_id,
                "scenario_id": scenario_id,
                "category": scenario["category"],
                "difficulty": scenario["difficulty"],
                "scoring_mode": scenario["scoring_mode"],
                "prompt": scenario["prompt_template"],
                "rubric": scenario["reference_answer"],
                "responses": public_responses,
            }
        )
        private_pairs.append(
            {
                "pair_id": pair_id,
                "scenario_id": scenario_id,
                "seed": seed,
                "responses": private_responses,
            }
        )

        new_response_id = next(
            response_id
            for response_id, role in response_role_by_id.items()
            if role == "new"
        )
        previous_response_id = next(
            response_id
            for response_id, role in response_role_by_id.items()
            if role == "previous"
        )
        for form_id, new_on_left in (
            ("form-a", new_on_left_form_a),
            ("form-b", not new_on_left_form_a),
        ):
            left_response_id = new_response_id if new_on_left else previous_response_id
            right_response_id = previous_response_id if new_on_left else new_response_id
            form_assignments[form_id].append(
                {
                    "assignment_id": sha256_value(
                        {"packet_id": packet_id, "form_id": form_id, "pair_id": pair_id}
                    ),
                    "position": position,
                    "pair_id": pair_id,
                    "left_response_id": left_response_id,
                    "right_response_id": right_response_id,
                }
            )

    private_key = {
        "key_version": "0.1.0",
        "packet_id": packet_id,
        "pilot_id": pilot["pilot_id"],
        "transition_id": pilot["transition_id"],
        "profile_id": profile_id,
        "schedule_seed": schedule_seed,
        "pairs": private_pairs,
    }
    write_json(key_output_path, private_key)
    key_commitment_sha256 = sha256_file(key_output_path)

    packet = {
        "packet_version": "0.1.0",
        "packet_id": packet_id,
        "session_type": "internal_interface_pilot",
        "protocol_version": pilot["protocol_version"],
        "condition": profile["condition"],
        "blinding": "model identity and role omitted; private role key retained separately",
        "pointwise_scale": ["fails", "partially_meets", "meets"],
        "paired_scale": {
            "-2": "left much better",
            "-1": "left slightly better",
            "0": "meaningfully indistinguishable",
            "1": "right slightly better",
            "2": "right much better",
        },
        "form_selector": "sha256-reviewer-code-first-byte-parity-v1",
        "source_run_commitments": sorted(run_commitments),
        "key_commitment_sha256": key_commitment_sha256,
        "pairs": public_pairs,
        "forms": [
            {"form_id": form_id, "assignments": assignments}
            for form_id, assignments in form_assignments.items()
        ],
    }
    forbidden = sorted(set(_walk_field_names(packet)) & FORBIDDEN_PUBLIC_FIELDS)
    if forbidden:
        raise ValueError("Public packet contains forbidden fields: " + ", ".join(forbidden))
    write_json(output_path, packet)
    if public_output_path is not None:
        write_json(public_output_path, packet)
    return verify_rating_packet(output_path, key_output_path)


def verify_rating_packet(packet_path, key_path=None):
    """Audit packet blinding, schedule coverage, mirroring, and optional private-key balance."""
    packet_path = Path(packet_path)
    packet = json.loads(packet_path.read_text())
    errors = []
    warnings = []
    forbidden = sorted(set(_walk_field_names(packet)) & FORBIDDEN_PUBLIC_FIELDS)
    if forbidden:
        errors.append("Public packet contains forbidden fields: " + ", ".join(forbidden))

    pairs = packet.get("pairs", [])
    pair_by_id = {item.get("pair_id"): item for item in pairs}
    if len(pair_by_id) != len(pairs):
        errors.append("Packet pair ids must be unique.")
    response_ids = []
    for pair in pairs:
        responses = pair.get("responses", [])
        if len(responses) != 2:
            errors.append(f"Pair {pair.get('pair_id')} must contain exactly two responses.")
        for response in responses:
            response_ids.append(response.get("response_id"))
            if not response.get("text"):
                errors.append(f"Pair {pair.get('pair_id')} contains an empty response.")
    if len(response_ids) != len(set(response_ids)):
        errors.append("Public response ids must be unique.")

    forms = packet.get("forms", [])
    if {item.get("form_id") for item in forms} != {"form-a", "form-b"}:
        errors.append("Packet must contain form-a and form-b.")
    assignments_by_form = {}
    for form in forms:
        assignments = form.get("assignments", [])
        assignments_by_form[form.get("form_id")] = {
            item.get("pair_id"): item for item in assignments
        }
        if len(assignments) != len(pairs):
            errors.append(f"{form.get('form_id')} must assign every pair exactly once.")
        if set(assignments_by_form[form.get("form_id")]) != set(pair_by_id):
            errors.append(f"{form.get('form_id')} pair coverage does not match the packet.")
        for assignment in assignments:
            pair = pair_by_id.get(assignment.get("pair_id"), {})
            expected_ids = {item.get("response_id") for item in pair.get("responses", [])}
            shown_ids = {
                assignment.get("left_response_id"),
                assignment.get("right_response_id"),
            }
            if shown_ids != expected_ids:
                errors.append(f"Assignment {assignment.get('assignment_id')} has invalid response ids.")

    if set(assignments_by_form) == {"form-a", "form-b"}:
        for pair_id in pair_by_id:
            first = assignments_by_form["form-a"].get(pair_id, {})
            second = assignments_by_form["form-b"].get(pair_id, {})
            if first.get("left_response_id") != second.get("right_response_id"):
                errors.append(f"Pair {pair_id} is not mirrored across forms.")
            if first.get("right_response_id") != second.get("left_response_id"):
                errors.append(f"Pair {pair_id} is not mirrored across forms.")

    balance = {}
    if key_path is not None:
        key_path = Path(key_path)
        if sha256_file(key_path) != packet.get("key_commitment_sha256"):
            errors.append("Private key does not match the packet key commitment.")
        key = json.loads(key_path.read_text())
        if key.get("packet_id") != packet.get("packet_id"):
            errors.append("Private key packet_id does not match the public packet.")
        role_by_response = {
            response["response_id"]: response["model_role"]
            for pair in key.get("pairs", [])
            for response in pair.get("responses", [])
        }
        for form_id, assignments in assignments_by_form.items():
            counts = Counter(
                role_by_response.get(item.get("left_response_id"))
                for item in assignments.values()
            )
            balance[form_id] = {
                "new_on_left": counts.get("new", 0),
                "previous_on_left": counts.get("previous", 0),
            }
            if abs(counts.get("new", 0) - counts.get("previous", 0)) > 1:
                errors.append(f"{form_id} left/right model placement is not balanced.")
    else:
        warnings.append("Private role key was not supplied; model-placement balance was not rechecked.")

    return {
        "verification_version": "0.1.0",
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "packet_id": packet.get("packet_id"),
        "packet_sha256": sha256_file(packet_path),
        "key_commitment_sha256": packet.get("key_commitment_sha256"),
        "pair_count": len(pairs),
        "form_count": len(forms),
        "assignments_per_form": {
            form_id: len(assignments) for form_id, assignments in assignments_by_form.items()
        },
        "model_placement_balance": balance,
    }


def verify_internal_session(packet_path, session_path, require_complete=False):
    return _verify_session(packet_path, session_path, require_complete, primary=False)


def verify_primary_session(packet_path, session_path, require_complete=False):
    return _verify_session(packet_path, session_path, require_complete, primary=True)


def _verify_session(packet_path, session_path, require_complete=False, primary=False):
    """Validate a blinded session export without unblinding or aggregating preferences."""
    packet = json.loads(Path(packet_path).read_text())
    session_path = Path(session_path)
    session = json.loads(session_path.read_text())
    errors = []
    warnings = []
    forbidden = sorted(set(_walk_field_names(session)) & FORBIDDEN_PUBLIC_FIELDS)
    if forbidden:
        errors.append("Session contains forbidden identity fields: " + ", ".join(forbidden))
    expected_type = 'primary_collection' if primary else 'internal_interface_pilot'
    if session.get('session_type') != expected_type or packet.get('session_type') != expected_type:
        errors.append(f'Session and packet type must be {expected_type}.')
    if session.get("packet_id") != packet.get("packet_id"):
        errors.append("Session packet_id does not match the rating packet.")
    reviewer_hash = session.get("reviewer_code_sha256")
    if not isinstance(reviewer_hash, str) or not re.fullmatch('[0-9a-f]{64}', reviewer_hash):
        errors.append("Session reviewer_code_sha256 must be a 64-character hash.")
    if primary:
        if packet.get('collection_authorized') is not True:
            errors.append('Primary packet has not been authorized for collection.')
        if packet.get('form_selector') != 'assigned-slot-v1' or session.get('form_id') != 'form-a':
            errors.append('Primary sessions must retain their fixed assigned form.')
        if reviewer_hash != packet.get('assigned_reviewer_sha256'):
            errors.append('Primary reviewer binding does not match the packet.')

    form = next(
        (item for item in packet.get("forms", []) if item.get("form_id") == session.get("form_id")),
        None,
    )
    if form is None:
        errors.append("Session form_id is absent from the rating packet.")
        assignments = {}
    else:
        assignments = {
            item["assignment_id"]: item for item in form.get("assignments", [])
        }
    pair_by_id = {item["pair_id"]: item for item in packet.get("pairs", [])}

    judgments = session.get("judgments")
    if not isinstance(judgments, list):
        errors.append("Session judgments must be an array.")
        judgments = []
    seen = set()
    valid_pointwise = {"fails", "partially_meets", "meets"}
    for index, judgment in enumerate(judgments, start=1):
        assignment_id = judgment.get("assignment_id")
        label = f"judgment {index}"
        if assignment_id in seen:
            errors.append(f"Duplicate assignment in {label}.")
            continue
        seen.add(assignment_id)
        assignment = assignments.get(assignment_id)
        if assignment is None:
            errors.append(f"Unexpected assignment in {label}.")
            continue
        pair = pair_by_id.get(assignment["pair_id"], {})
        expected = {
            "pair_id": assignment["pair_id"],
            "scenario_id": pair.get("scenario_id"),
            "category": pair.get("category"),
        }
        for field, value in expected.items():
            if judgment.get(field) != value:
                errors.append(f"{label} has mismatched {field}.")
        for field in ("pointwise_left", "pointwise_right"):
            if judgment.get(field) not in valid_pointwise:
                errors.append(f"{label} has invalid {field}.")
        preference = judgment.get("side_preference")
        if type(preference) is not int or preference not in {-2, -1, 0, 1, 2}:
            errors.append(f"{label} has invalid side_preference.")
        tags = judgment.get("reason_tags")
        if not isinstance(tags, list) or len(tags) != len(set(tags)):
            errors.append(f"{label} has invalid reason_tags.")
        duration = judgment.get("duration_ms")
        if isinstance(duration, bool) or not isinstance(duration, (int, float)) or not isfinite(duration) or duration < 0:
            errors.append(f"{label} has invalid duration_ms.")

    if session.get("completed_assignment_count") != len(judgments):
        errors.append("completed_assignment_count does not match the judgment array length.")
    missing_count = len(assignments) - len(seen & set(assignments))
    if missing_count:
        message = f"Session is missing {missing_count} of {len(assignments)} assignments."
        (errors if require_complete else warnings).append(message)

    return {
        "verification_version": "0.1.0",
        "valid": not errors,
        "complete": missing_count == 0 and len(judgments) == len(assignments),
        "errors": errors,
        "warnings": warnings,
        "packet_id": packet.get("packet_id"),
        "form_id": session.get("form_id"),
        "completed_assignment_count": len(judgments),
        "expected_assignment_count": len(assignments),
        "session_sha256": sha256_file(session_path),
        "aggregate_preference_calculated": False,
    }
