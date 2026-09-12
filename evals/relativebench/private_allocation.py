"""Prepare an outcome-blind allocation under an ignored private/ directory only."""

import argparse
import json
import os
import secrets
from pathlib import Path

from .artifacts import sha256_value
from .design import allocate, audit_allocation
from .manifest import project_root, validate_pilot


def private_destination(path):
    resolved = Path(path).resolve()
    if not resolved.is_relative_to(project_root() / 'private'):
        raise ValueError('Real allocation keys must stay under the repository ignored private/ directory.')
    if resolved.exists():
        raise ValueError('Refusing to overwrite an existing allocation.')
    return resolved


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pilot', default='data/pilots/qwen2.5-to-qwen3/primary-candidate.json')
    parser.add_argument('--evaluator-slots', type=int, default=40)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    destination = private_destination(args.output)
    validated = validate_pilot(args.pilot)
    if not validated['valid']:
        parser.error(str(validated['errors']))
    scenarios = validated['scenario_manifest']['scenarios']
    people = [f'slot-{i:03}' for i in range(args.evaluator_slots)]
    seed = secrets.randbits(128)
    rows = allocate(scenarios, people, seed=seed)
    audit = audit_allocation(rows, scenarios, people)
    if not audit['valid']:
        parser.error(str(audit['errors']))
    payload = {'kind': 'private_candidate_allocation', 'collection_authorized': False,
               'secret_schedule_seed': seed, 'allocation': rows, 'audit': audit,
               'allocation_sha256': sha256_value(rows)}
    destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with os.fdopen(os.open(destination, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'w') as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
    print(json.dumps({'saved_privately': True, 'assignment_count': len(rows),
                      'allocation_sha256': payload['allocation_sha256']}))


if __name__ == '__main__':
    main()
