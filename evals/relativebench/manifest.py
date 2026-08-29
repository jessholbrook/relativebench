"""Loading and cross-file validation for versioned pilot manifests."""

import json
from collections import Counter
from pathlib import Path

REQUIRED_CATEGORIES = {
    "reasoning",
    "coding",
    "instruction_following",
    "structured_output",
    "factual_synthesis",
    "safety",
}


def load_json(path):
    return json.loads(Path(path).read_text())


def project_root():
    return Path(__file__).resolve().parents[2]


def validate_pilot(pilot_path):
    """Validate references and invariants that JSON Schema cannot express."""
    pilot_path = Path(pilot_path).resolve()
    pilot = load_json(pilot_path)
    catalog = load_json(project_root() / "data/catalog/catalog.json")
    transition_by_id = {item["id"]: item for item in catalog["transitions"]}
    model_by_id = {item["id"]: item for item in catalog["models"]}
    errors = []
    warnings = []

    transition = transition_by_id.get(pilot.get("transition_id"))
    if transition is None:
        errors.append("Pilot transition_id is absent from the catalog.")
    else:
        expected = {
            "previous": transition["previous_model_id"],
            "new": transition["new_model_id"],
        }
        for role, expected_id in expected.items():
            configured = pilot["models"][role]
            if configured["id"] != expected_id:
                errors.append(f"Configured {role} model does not match the transition edge.")
            catalog_model = model_by_id.get(configured["id"])
            if catalog_model is None:
                errors.append(f"Configured {role} model is absent from the catalog.")
            elif catalog_model.get("revision") != configured["revision"]:
                errors.append(f"Configured {role} revision does not match the catalog pin.")

    scenario_path = pilot_path.parent / pilot["scenario_manifest"]
    if not scenario_path.is_file():
        errors.append(f"Scenario manifest does not exist: {scenario_path}")
        scenario_manifest = {"scenarios": []}
    else:
        scenario_manifest = load_json(scenario_path)

    scenarios = scenario_manifest.get("scenarios", [])
    scenario_ids = [scenario.get("id") for scenario in scenarios]
    duplicates = [item for item, count in Counter(scenario_ids).items() if count > 1]
    if duplicates:
        errors.append(f"Duplicate scenario ids: {', '.join(sorted(duplicates))}")

    categories = Counter(scenario.get("category") for scenario in scenarios)
    missing_categories = REQUIRED_CATEGORIES - set(categories)
    if missing_categories:
        errors.append(f"Missing required categories: {', '.join(sorted(missing_categories))}")

    for scenario in scenarios:
        if scenario.get("manifest_version") != scenario_manifest.get("manifest_version"):
            errors.append(f"Scenario {scenario.get('id')} has a mismatched manifest_version.")

    profile_ids = [profile["id"] for profile in pilot.get("execution_profiles", [])]
    if len(profile_ids) != len(set(profile_ids)):
        errors.append("Execution profile ids must be unique.")

    target_per_category = pilot["targets"]["scenarios_per_category"]
    below_target = {
        category: categories.get(category, 0)
        for category in sorted(REQUIRED_CATEGORIES)
        if categories.get(category, 0) < target_per_category
    }
    if below_target:
        summary = ", ".join(f"{category}={count}" for category, count in below_target.items())
        warnings.append(
            f"Scenario manifest is below the active-pilot target of {target_per_category} per category: {summary}."
        )

    return {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "pilot": pilot,
        "scenario_manifest": scenario_manifest,
        "scenario_path": scenario_path,
        "scenario_count": len(scenarios),
        "category_counts": dict(sorted(categories.items())),
    }
