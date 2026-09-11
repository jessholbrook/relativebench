"""Create assigned, blinded packets privately; never enables collection or hosting."""

import argparse
import json
import secrets
from collections import defaultdict
from hashlib import sha256
from pathlib import Path

from .artifacts import sha256_value, write_json
from .design import audit_allocation
from .manifest import validate_pilot
from .private_allocation import private_destination
from .rating import FORBIDDEN_PUBLIC_FIELDS, _walk_field_names
from .runner import verify_run


def assigned_packet(assignments, scenarios, artifacts, reviewer_code, nonce):
    if not assignments or len({row['evaluator_id'] for row in assignments}) != 1:
        raise ValueError('A packet must belong to exactly one evaluator slot.')
    packet_id = sha256_value({'assignments': assignments, 'nonce': nonce})
    pairs, public_assignments = [], []
    for position, assignment in enumerate(assignments, 1):
        scenario = scenarios[assignment['scenario_id']]
        key = (assignment['scenario_id'], assignment['generation_seed'])
        pair_id = sha256_value({'packet': packet_id, 'assignment': assignment['assignment_id']})
        responses = {}
        for role in ('previous', 'new'):
            artifact = artifacts[(*key, role)]
            if artifact.get('adapter') != 'transformers-bf16' or artifact.get('adapter_metadata', {}).get('weight_format') != 'bfloat16' or artifact.get('status') != 'ok':
                raise ValueError('Primary packets require verified BF16 artifacts, never rehearsal outputs.')
            response_id = sha256_value({'packet': packet_id, 'pair': pair_id, 'artifact': artifact['artifact_id']})
            responses[role] = {'response_id': response_id, 'text': artifact['response_text']}
        left, right = ('new', 'previous') if assignment['new_on_left'] else ('previous', 'new')
        pairs.append({'pair_id': pair_id, 'scenario_id': scenario['id'], 'category': scenario['category'],
                      'difficulty': scenario['difficulty'], 'scoring_mode': scenario['scoring_mode'],
                      'prompt': scenario['prompt_template'], 'rubric': scenario['reference_answer'],
                      'responses': sorted(responses.values(), key=lambda row: row['response_id'])})
        public_assignments.append({'assignment_id': assignment['assignment_id'], 'position': position,
                                   'pair_id': pair_id, 'left_response_id': responses[left]['response_id'],
                                   'right_response_id': responses[right]['response_id']})
    packet = {'packet_version': '0.2.0', 'packet_id': packet_id, 'session_type': 'primary_collection',
              'protocol_version': '0.1.0', 'condition': 'frozen', 'form_selector': 'assigned-slot-v1',
              'assigned_reviewer_sha256': sha256(reviewer_code.encode()).hexdigest(),
              'collection_authorized': False, 'blinding': 'Private role key omitted; response text still requires independent review.',
              'pointwise_scale': ['fails', 'partially_meets', 'meets'],
              'paired_scale': {'-2': 'left much better', '-1': 'left slightly better', '0': 'meaningfully indistinguishable',
                               '1': 'right slightly better', '2': 'right much better'},
              'source_run_commitments': [], 'key_commitment_sha256': sha256_value({'assignments': assignments, 'nonce': nonce}),
              'pairs': pairs, 'forms': [{'form_id': 'form-a', 'assignments': public_assignments}]}
    if set(_walk_field_names(packet)) & FORBIDDEN_PUBLIC_FIELDS:
        raise ValueError('Primary packet contains forbidden role/identity fields.')
    return packet


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pilot', default='data/pilots/qwen2.5-to-qwen3/pilot.json')
    parser.add_argument('--allocation', required=True)
    parser.add_argument('--execution-dir', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    destination = private_destination(args.output)
    validation = validate_pilot(args.pilot)
    if not validation['valid']:
        parser.error(str(validation['errors']))
    private = json.loads(Path(args.allocation).read_text())
    assignments = private['allocation']
    if sha256_value(assignments) != private.get('allocation_sha256'):
        parser.error('Private allocation hash mismatch.')
    people = sorted({row['evaluator_id'] for row in assignments})
    scenarios = validation['scenario_manifest']['scenarios']
    audit = audit_allocation(assignments, scenarios, people)
    if not audit['valid']:
        parser.error(str(audit['errors']))
    artifacts, commitments = {}, []
    for role in ('previous', 'new'):
        directory = Path(args.execution_dir) / role
        report = verify_run(args.pilot, 'frozen-non-thinking-v1', directory, model_roles=(role,))
        if not report['valid'] or not report['complete']:
            parser.error(f'Unverified primary artifacts for {role}.')
        commitments.append(report['artifact_set_sha256'])
        for line in (directory / 'responses.jsonl').read_text().splitlines():
            row = json.loads(line)
            artifacts[(row['scenario_id'], row['seed'], role)] = row
    by_person = defaultdict(list)
    for row in assignments:
        by_person[row['evaluator_id']].append(row)
    # Prepare all packets first; validation failure must not leave a partial bundle.
    bundle = []
    for person, rows in sorted(by_person.items()):
        code = secrets.token_urlsafe(24)
        nonce = secrets.token_hex(32)
        packet = assigned_packet(rows, {row['id']: row for row in scenarios}, artifacts, code, nonce)
        packet['source_run_commitments'] = commitments
        bundle.append((person, code, nonce, packet))
    destination.mkdir(parents=True, mode=0o700)
    invitations = []
    for index, (person, code, nonce, packet) in enumerate(bundle):
        filename = f'packet-{index:03}.json'
        write_json(destination / filename, packet)
        invitations.append({'slot': person, 'private_reviewer_code': code, 'commitment_nonce': nonce, 'packet_file': filename})
    write_json(destination / 'private-invitation-map.json', invitations)
    print(json.dumps({'prepared_packets': len(bundle), 'collection_authorized': False,
                      'note': 'Files remain private and blocked pending review; no invitations sent.'}))


if __name__ == '__main__':
    main()
