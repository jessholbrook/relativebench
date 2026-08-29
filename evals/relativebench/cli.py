"""Small JSONL utility for checking protocol metrics before the pilot runner exists."""

import argparse
import json
from pathlib import Path

from .metrics import summarize_experience, summarize_flips


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

    arguments = parser.parse_args()
    records = read_jsonl(arguments.input)
    result = summarize_experience(records) if arguments.command == "experience" else summarize_flips(records)
    print(json.dumps(result, indent=2, sort_keys=True))
