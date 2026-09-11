"""Outcome-independent candidate allocation; never a record of recruited people."""

import random
from collections import Counter, defaultdict


def allocate(scenarios, evaluator_ids, seeds=(11, 29, 47), judgments_per_pair=5, seed=20260910):
    if not scenarios or not evaluator_ids or not seeds:
        raise ValueError("Scenarios, evaluator slots, and generation seeds are required.")
    if len({s['id'] for s in scenarios}) != len(scenarios) or len(set(evaluator_ids)) != len(evaluator_ids):
        raise ValueError("Scenario and evaluator identifiers must be unique.")
    if len(set(seeds)) != len(seeds) or type(judgments_per_pair) is not int or judgments_per_pair < 1:
        raise ValueError("Unique seeds and a positive integer judgment target are required.")
    if len(evaluator_ids) < len(seeds) * judgments_per_pair:
        raise ValueError("Not enough evaluator slots to avoid repeated exposure to a scenario.")
    rng = random.Random(seed)
    people = sorted(evaluator_ids)
    rng.shuffle(people)
    ordered = sorted(scenarios, key=lambda item: (item['category'], item['id']))
    rows = []
    cursor = 0
    for scenario_index, scenario in enumerate(ordered):
        # A cyclic deck gives equal total workload (within one assignment),
        # with no evaluator seeing two seeds of the same scenario.
        slots = [people[(cursor + i) % len(people)] for i in range(len(seeds) * judgments_per_pair)]
        rng.shuffle(slots)
        cursor += len(slots)
        for seed_index, generation_seed in enumerate(seeds):
            sides = [(i + scenario_index + seed_index) % 2 == 0 for i in range(judgments_per_pair)]
            rng.shuffle(sides)
            for i in range(judgments_per_pair):
                rows.append({
                    'assignment_id': f"{scenario['id']}:{generation_seed}:{i}",
                    'scenario_id': scenario['id'], 'category': scenario['category'],
                    'generation_seed': generation_seed,
                    'evaluator_id': slots[seed_index * judgments_per_pair + i],
                    'new_on_left': sides[i],
                })
    rng.shuffle(rows)
    return rows


def audit_allocation(rows, scenarios, evaluator_ids, seeds=(11, 29, 47), judgments_per_pair=5):
    expected = {(s['id'], seed) for s in scenarios for seed in seeds}
    categories = {s['id']: s['category'] for s in scenarios}
    counts, exposures, workloads = Counter(), Counter(), Counter()
    left = Counter()
    seen = set()
    errors = []
    by_person_side = defaultdict(Counter)
    for row in rows:
        assignment = row.get('assignment_id')
        key = (row.get('scenario_id'), row.get('generation_seed'))
        person = row.get('evaluator_id')
        if not isinstance(assignment, str) or not assignment or assignment in seen:
            errors.append('Missing or duplicate assignment id.')
        seen.add(assignment)
        if key not in expected or person not in evaluator_ids:
            errors.append('Unknown scenario/seed/evaluator assignment.')
        if row.get('category') != categories.get(row.get('scenario_id')):
            errors.append('Assignment category mismatch.')
        if type(row.get('new_on_left')) is not bool:
            errors.append('Presentation side must be a boolean.')
        counts[key] += 1
        exposures[(row.get('scenario_id'), person)] += 1
        workloads[person] += 1
        left[key] += row.get('new_on_left') is True
        by_person_side[person]['left' if row.get('new_on_left') else 'right'] += 1
    if set(counts) != expected or any(counts[key] != judgments_per_pair for key in expected):
        errors.append('Every scenario/seed must have the exact judgment target.')
    if any(value > 1 for value in exposures.values()):
        errors.append('An evaluator would see a scenario more than once.')
    if any(abs(2 * left[key] - counts[key]) > 1 for key in expected):
        errors.append('Presentation order is not maximally balanced within pair.')
    loads = [workloads[person] for person in evaluator_ids]
    if not loads or max(loads) - min(loads) > 1:
        errors.append('Evaluator workload imbalance exceeds one assignment.')
    return {'valid': not errors, 'errors': sorted(set(errors)), 'assignment_count': len(rows),
            'evaluator_slots': len(evaluator_ids), 'workload_range': [min(loads), max(loads)] if loads else [],
            'presentation_by_evaluator': dict(by_person_side),
            'note': 'Five judgments allow only 2:3 or 3:2 within-pair balance; realized returns must be audited again.'}
