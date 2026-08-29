"""Small JSONL utility for checking protocol metrics before the pilot runner exists."""

import argparse
import json
from pathlib import Path

from .adapters import DryRunAdapter
from .inference import bootstrap_experience
from .manifest import validate_pilot
from .metrics import summarize_experience, summarize_flips
from .runner import run_pilot, verify_run


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
    dry_run.add_argument("--resume", action="store_true")

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
    mlx_run.add_argument("--resume", action="store_true")
    mlx_run.add_argument("--checkpoint-every", type=int, default=1)
    mlx_run.add_argument("--progress-every", type=int, default=5)

    verify = subparsers.add_parser(
        "verify-run", help="Independently recompute hashes and completeness for response artifacts."
    )
    verify.add_argument("pilot")
    verify.add_argument("--profile", required=True)
    verify.add_argument("--model-role", action="append", choices=("previous", "new"))
    verify.add_argument("--output", required=True)
    verify.add_argument("--allow-incomplete", action="store_true")

    create_rating = subparsers.add_parser(
        "create-rating-packet",
        help="Create mirrored blinded rating forms and a separately retained private role key.",
    )
    create_rating.add_argument("pilot")
    create_rating.add_argument("--profile", required=True)
    create_rating.add_argument("--execution-dir", required=True)
    create_rating.add_argument("--output", required=True)
    create_rating.add_argument("--key-output", required=True)
    create_rating.add_argument("--public-output")
    create_rating.add_argument("--schedule-seed", type=int, default=20260829)

    verify_rating = subparsers.add_parser(
        "verify-rating-packet", help="Audit a public rating packet and optional private role key."
    )
    verify_rating.add_argument("packet")
    verify_rating.add_argument("--key")

    verify_session = subparsers.add_parser(
        "verify-rating-session",
        help="Validate a blinded internal session without unblinding or aggregating preference.",
    )
    verify_session.add_argument("packet")
    verify_session.add_argument("session")
    verify_session.add_argument("--require-complete", action="store_true")

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
        result = run_pilot(
            arguments.pilot,
            arguments.profile,
            arguments.output,
            DryRunAdapter(),
            resume=arguments.resume,
        )
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

        if arguments.progress_every < 1:
            parser.error("--progress-every must be at least 1")

        def report_progress(completed, expected):
            if completed % arguments.progress_every == 0 or completed == expected:
                print(f"progress {completed}/{expected}", flush=True)

        result = run_pilot(
            arguments.pilot,
            arguments.profile,
            arguments.output,
            MlxAdapter(arguments.model_dir),
            model_roles=(arguments.model_role,),
            resume=arguments.resume,
            checkpoint_every=arguments.checkpoint_every,
            progress_callback=report_progress,
        )
    elif arguments.command == "verify-run":
        result = verify_run(
            arguments.pilot,
            arguments.profile,
            arguments.output,
            model_roles=arguments.model_role,
            require_complete=not arguments.allow_incomplete,
        )
    elif arguments.command == "create-rating-packet":
        from .rating import create_rating_packet

        result = create_rating_packet(
            arguments.pilot,
            arguments.profile,
            arguments.execution_dir,
            arguments.output,
            arguments.key_output,
            schedule_seed=arguments.schedule_seed,
            public_output_path=arguments.public_output,
        )
    elif arguments.command == "verify-rating-packet":
        from .rating import verify_rating_packet

        result = verify_rating_packet(arguments.packet, arguments.key)
    elif arguments.command == "verify-rating-session":
        from .rating import verify_internal_session

        result = verify_internal_session(
            arguments.packet,
            arguments.session,
            require_complete=arguments.require_complete,
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
