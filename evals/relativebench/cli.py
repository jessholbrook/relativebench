"""Small JSONL utility for checking protocol metrics before the pilot runner exists."""

import argparse
import json
from pathlib import Path

from .adapters import DryRunAdapter
from .inference import bootstrap_experience
from .manifest import validate_pilot
from .metrics import summarize_experience, summarize_flips
from .runner import run_pilot


def read_jsonl(path):
    records = []
    for line_number, line in enumerate(Path(path).read_text().splitlines(), start=1):
        if not line.strip():
            continue
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError as error:
            raise SystemExit(f"Invalid JSON on line {line_number}: {error}") from error
    return records


def main():
    parser = argparse.ArgumentParser(description="Calculate RelativeBench Protocol v0.1 point estimates.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    experience = subparsers.add_parser("experience", help="Summarize judgment JSONL.")
    experience.add_argument("input")

    flips = subparsers.add_parser("flips", help="Summarize scored-pair JSONL.")
    flips.add_argument("input")

    analyze = subparsers.add_parser("analyze", help="Calculate protocol weighting and clustered uncertainty.")
    analyze.add_argument("input")
    analyze.add_argument("--replicates", type=int, default=10000)
    analyze.add_argument("--seed", type=int, default=20260828)

    validate = subparsers.add_parser("validate-pilot", help="Validate a pilot and its referenced manifests.")
    validate.add_argument("pilot")

    dry_run = subparsers.add_parser("dry-run", help="Run the complete artifact pipeline without loading models.")
    dry_run.add_argument("pilot")
    dry_run.add_argument("--profile", required=True)
    dry_run.add_argument("--output", required=True)

    arguments = parser.parse_args()
    if arguments.command == "validate-pilot":
        validation = validate_pilot(arguments.pilot)
        result = {
            "valid": validation["valid"],
            "errors": validation["errors"],
            "warnings": validation["warnings"],
            "scenario_count": validation["scenario_count"],
            "category_counts": validation["category_counts"],
        }
    elif arguments.command == "dry-run":
        result = run_pilot(arguments.pilot, arguments.profile, arguments.output, DryRunAdapter())
    else:
        records = read_jsonl(arguments.input)
        if arguments.command == "experience":
            result = summarize_experience(records)
        elif arguments.command == "flips":
            result = summarize_flips(records)
        else:
            result = bootstrap_experience(records, replicates=arguments.replicates, seed=arguments.seed)
    print(json.dumps(result, indent=2, sort_keys=True))
