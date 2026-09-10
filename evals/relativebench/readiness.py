"""Prepare an immutable primary execution plan without downloading or running models."""

import argparse
import json
from pathlib import Path

from .artifacts import sha256_file, sha256_value, write_json
from .design import allocate, audit_allocation
from .runner import _load_execution, _expected_requests


GENERATION_GATES = ('independent_scenario_review', 'bf16_host_and_locked_runtime_verified', 'independent_smoke_replay')


def validate_activation(plan, activation, gates=None):
    if activation.get('plan_sha256') != plan['plan_sha256']:
        raise ValueError('Activation does not match the exact candidate plan.')
    approvals = activation.get('approvals', {})
    for gate in (plan['blocking_gates'] if gates is None else gates):
        item = approvals.get(gate, {})
        if item.get('approved') is not True or not item.get('reviewer') or not item.get('evidence'):
            raise ValueError(f'Unresolved activation gate: {gate}')
    return True


def primary_plan(pilot_path):
    validation, pilot, profile, roles = _load_execution(pilot_path, 'frozen-non-thinking-v1', ('previous', 'new'))
    if validation['scenario_count'] != 120 or profile['seeds'] != [11, 29, 47] or profile['max_new_tokens'] != 1024:
        raise ValueError('Primary plan drift: explicitly revise and review the frozen protocol first.')
    if profile['condition'] != 'frozen' or profile['model_options'].get(pilot['models']['new']['id'], {}).get('enable_thinking') is not False:
        raise ValueError('Primary plan must disable candidate thinking under the frozen condition.')
    people = [f'slot-{i:03}' for i in range(pilot['targets']['minimum_incumbent_evaluators'])]
    scenarios = validation['scenario_manifest']['scenarios']
    allocation = allocate(scenarios, people, profile['seeds'], pilot['targets']['judgments_per_response_pair'])
    audit = audit_allocation(allocation, scenarios, people, profile['seeds'], pilot['targets']['judgments_per_response_pair'])
    if not audit['valid']:
        raise ValueError(audit['errors'])
    expected = _expected_requests(validation, pilot, profile, roles)
    plan = {
        'kind': 'candidate_primary_plan_not_collection', 'plan_version': '0.1.0',
        'pilot_id': pilot['pilot_id'], 'pilot_sha256': sha256_file(pilot_path),
        'scenario_manifest_sha256': sha256_file(validation['scenario_path']),
        'profile': profile, 'models': pilot['models'], 'required_weight_format': 'bfloat16',
        'request_count': len(expected), 'run_plan_sha256': sha256_value(sorted(item['request_sha256'] for item in expected)),
        'request_commitments': [{'scenario_id': item['key'][0], 'role': item['key'][1], 'seed': item['key'][2],
                                 'request_sha256': item['request_sha256']} for item in expected],
        'example_allocation_sha256': sha256_value(allocation), 'allocation_audit': audit,
        'allocation_note': 'Planning fixture only. Create a fresh private allocation with a secret seed before real collection; never publish its side key.',
        'collection_authorized': False,
        'blocking_gates': ['independent_scenario_review', 'approved_consent_and_recruitment',
                           'sample_size_decision_after_simulations', 'bf16_host_and_locked_runtime_verified',
                           'independent_smoke_replay', 'primary_packet_delivery_review'],
    }
    plan['plan_sha256'] = sha256_value(plan)
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pilot', default='data/pilots/qwen2.5-to-qwen3/pilot.json')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    if Path(args.output).exists():
        parser.error('Refusing to overwrite a frozen candidate plan.')
    plan = primary_plan(args.pilot)
    write_json(args.output, plan)
    print(json.dumps({key: plan[key] for key in ('kind', 'plan_sha256', 'request_count', 'blocking_gates')}, indent=2))


if __name__ == '__main__':
    main()
