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

    prepare_mlx = subparsers.add_parser(
        "prepare-mlx", help="Convert one exact model revision to a provenance-checked 4-bit MLX directory."
    )
    prepare_mlx.add_argument("pilot")
    prepare_mlx.add_argument("--model-role", required=True, choices=("previous", "new"))
    prepare_mlx.add_argument("--output", required=True)
    prepare_mlx.add_argument("--bits", type=int, default=4)
    prepare_mlx.add_argument("--group-size", type=int, default=64)

    mlx_run = subparsers.add_parser(
        "mlx-run", help="Run one model role from a provenance-checked local MLX directory."
    )
    mlx_run.add_argument("pilot")
    mlx_run.add_argument("--profile", required=True)
    mlx_run.add_argument("--model-role", required=True, choices=("previous", "new"))
    mlx_run.add_argument("--model-dir", required=True)
    mlx_run.add_argument("--output", required=True)

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
    elif arguments.command == "prepare-mlx":
        from .mlx_runtime import prepare_quantized_model

        result = prepare_quantized_model(
            arguments.pilot,
            arguments.model_role,
            arguments.output,
            bits=arguments.bits,
            group_size=arguments.group_size,
        )
    elif arguments.command == "mlx-run":
        from .adapters.mlx import MlxAdapter

        result = run_pilot(
            arguments.pilot,
            arguments.profile,
            arguments.output,
            MlxAdapter(arguments.model_dir),
            model_roles=(arguments.model_role,),
        )
    else:
        records = read_jsonl(arguments.input)
        if arguments.command == "experience":
            result = summarize_experience(records)
        elif arguments.command == "flips":
            result = summarize_flips(records)
        else:
            result = bootstrap_experience(records, replicates=arguments.replicates, seed=arguments.seed)
    print(json.dumps(result, indent=2, sort_keys=True))
