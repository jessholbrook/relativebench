"""First-pass rubric scores are immutable; post-exposure corrections stay separate."""

SCORES = {'fails', 'partially_meets', 'meets'}


def validate_assessment(value, complete=False):
    if not isinstance(value, dict) or not isinstance(value.get('revisions'), list):
        return False
    for side in ('left', 'right'):
        if value.get(side) not in SCORES and (complete or value.get(side) is not None):
            return False
    if value.get('right') is not None and value.get('left') is None:
        return False
    final = {side: value.get(side) for side in ('left', 'right')}
    for row in value['revisions']:
        if not isinstance(row, dict) or row.get('side') not in final:
            return False
        side = row['side']
        if row.get('from') != final[side] or final[side] is None or row.get('to') not in SCORES:
            return False
        if row.get('exposure') not in ('right_seen', 'pair_seen'):
            return False
        final[side] = row['to']
    return all(value.get('final_' + side) == final[side] for side in final)
