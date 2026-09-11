"""Content/presentation commitment shared with lib/rating-packet-identity.ts."""
from .artifacts import sha256_value


def stimulus_payload(packet):
    # Exclude collection_authorized: authorization is a separate operator gate.
    return {key: packet.get(key) for key in (
        'packet_version', 'packet_id', 'protocol_version', 'session_type', 'condition',
        'form_selector', 'assigned_reviewer_sha256', 'pointwise_scale', 'paired_scale',
        'source_run_commitments', 'key_commitment_sha256', 'pairs', 'forms')}


def stimulus_digest(packet):
    return sha256_value(stimulus_payload(packet))


def packet_receipt(packet):
    """Retain privately at freeze time; never reconstruct from a submitted packet."""
    return {'packet_id': packet['packet_id'], 'stimulus_sha256': stimulus_digest(packet),
            'assignment_ids': [row['assignment_id'] for row in packet['forms'][0]['assignments']]}


def validate_packet_structure(packet):
    errors = []
    pairs, forms = packet.get('pairs'), packet.get('forms')
    if not isinstance(pairs, list) or not pairs or not isinstance(forms, list) or not forms:
        return ['Packet requires nonempty pairs and forms.']
    pair_by_id = {}
    response_ids = set()
    for pair in pairs:
        if not isinstance(pair, dict) or not isinstance(pair.get('pair_id'), str) or not pair['pair_id'] or pair['pair_id'] in pair_by_id:
            return ['Packet pair IDs must be nonempty and unique.']
        pair_by_id[pair['pair_id']] = pair
        responses = pair.get('responses')
        if not isinstance(responses, list) or len(responses) != 2:
            return ['Every pair requires two responses.']
        for row in responses:
            if not isinstance(row, dict) or not isinstance(row.get('response_id'), str) or not row['response_id'] or row['response_id'] in response_ids or not isinstance(row.get('text'), str):
                return ['Packet response IDs must be nonempty and unique with string text.']
            response_ids.add(row['response_id'])
    form_ids = set()
    for form in forms:
        if not isinstance(form, dict) or form.get('form_id') not in ('form-a', 'form-b') or form['form_id'] in form_ids:
            return ['Packet form IDs must be supported and unique.']
        form_ids.add(form['form_id'])
        assignments = form.get('assignments')
        if not isinstance(assignments, list) or not assignments:
            return ['Packet assignments must be nonempty.']
        seen, used_pairs = set(), set()
        for position, row in enumerate(assignments, 1):
            if not isinstance(row, dict) or not isinstance(row.get('assignment_id'), str) or not row['assignment_id'] or row['assignment_id'] in seen:
                return ['Packet assignment IDs must be nonempty and unique.']
            seen.add(row['assignment_id'])
            pair = pair_by_id.get(row.get('pair_id'))
            if pair is None or row['pair_id'] in used_pairs or row.get('position') != position:
                return ['Packet assignment order/pair coverage is invalid.']
            used_pairs.add(row['pair_id'])
            if {row.get('left_response_id'), row.get('right_response_id')} != {r['response_id'] for r in pair['responses']}:
                return ['Packet presentation references are invalid.']
        if used_pairs != set(pair_by_id):
            errors.append('Packet form must cover every pair exactly once.')
    if packet.get('session_type') == 'primary_collection' and form_ids != {'form-a'}:
        errors.append('Primary packet requires exactly one assigned form.')
    return errors
