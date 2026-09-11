"""Blinded QC, missingness accounting, and conservative missing-rating bounds.

This prepares analysis inputs; it does not authorize collection or infer consent.
"""

from collections import Counter, defaultdict
from math import isfinite

from .inference import weighted_experience


def audit_critical_tasks(scored_pairs, critical_ids, *, expected_seeds):
    """A zero-tolerance candidate guardrail; never selected from favorable outcomes."""
    if not critical_ids or len(set(critical_ids)) != len(critical_ids):
        raise ValueError('Freeze a nonempty, unique critical-task list before scoring.')
    if not expected_seeds or len(set(expected_seeds)) != len(expected_seeds) or any(type(seed) is not int for seed in expected_seeds):
        raise ValueError('Freeze a nonempty, unique integer seed list before scoring.')
    failures = []
    seen = set()
    errors = []
    for row in scored_pairs:
        key = (row.get('scenario_id'), row.get('seed'))
        if key in seen:
            errors.append('Duplicate scored scenario/seed.')
        seen.add(key)
        if type(row.get('seed')) is not int or row['seed'] not in expected_seeds:
            errors.append('Scored seed is not in the frozen seed list.')
        if type(row.get('previous_pass')) is not bool or type(row.get('new_pass')) is not bool:
            errors.append('Scored outcomes must be booleans, not missing values.')
        elif row.get('scenario_id') in critical_ids and row['previous_pass'] and not row['new_pass']:
            failures.append({'scenario_id': row['scenario_id'], 'seed': row.get('seed')})
    missing = sorted(set(critical_ids) - {row.get('scenario_id') for row in scored_pairs})
    missing_pairs = sorted({(task, seed) for task in critical_ids for seed in expected_seeds} - seen)
    return {'clear': not errors and not failures and not missing_pairs, 'errors': errors,
            'negative_flips': failures, 'missing_critical_tasks': missing,
            'missing_critical_pairs': [{'scenario_id': task, 'seed': seed} for task, seed in missing_pairs],
            'note': 'Must also verify full artifact/seed completeness; a clear guardrail is not publication approval.'}


def prepare_collection(assignments, records, *, minimum_reading_ms=0):
    if type(minimum_reading_ms) is not int or minimum_reading_ms < 0:
        raise ValueError('Reading-time rule must be a nonnegative frozen integer.')
    expected = {row['assignment_id']: row for row in assignments}
    if len(expected) != len(assignments) or not expected:
        raise ValueError('Nonempty allocation must have unique assignment IDs.')
    counts = Counter(row.get('assignment_id') for row in records)
    reasons = Counter()
    accepted = {}
    decisions = []
    for record in records:
        key = record.get('assignment_id')
        planned = expected.get(key)
        rejected = []
        if planned is None:
            rejected.append('unknown_assignment')
        if counts[key] != 1:
            rejected.append('duplicate_assignment_quarantine')
        if planned and record.get('evaluator_id') != planned['evaluator_id']:
            rejected.append('evaluator_mismatch')
        if type(record.get('side_preference')) is not int or record['side_preference'] not in range(-2, 3):
            rejected.append('missing_or_invalid_rating')
        # These flags come from separately verified, blinded eligibility/QC records,
        # never from which side the evaluator preferred.
        if record.get('attention_passed') is not True:
            rejected.append('attention_not_verified')
        if record.get('eligible_incumbent') is not True:
            rejected.append('incumbent_not_verified')
        duration = record.get('duration_ms')
        if isinstance(duration, bool) or not isinstance(duration, (int, float)) or not isfinite(duration) or duration < minimum_reading_ms:
            rejected.append('invalid_or_below_frozen_reading_time')
        reasons.update(rejected)
        decisions.append({'assignment_id': key, 'included': not rejected, 'reasons': rejected})
        if not rejected:
            accepted[key] = record
    missing = [key for key in expected if key not in accepted]
    retained, low, high = [], [], []
    missing_by_category = Counter()
    for key, planned in expected.items():
        base = {field: planned[field] for field in ('scenario_id', 'category', 'evaluator_id')}
        record = accepted.get(key)
        if record:
            if type(planned.get('new_on_left')) is not bool:
                raise ValueError('Private allocation must have an unambiguous model-side key.')
            # Positive side preference means right better; unblind only AFTER QC.
            rating = record['side_preference'] * (-1 if planned['new_on_left'] else 1)
            row = {**base, 'rating': rating}
            retained.append(row)
            low.append(row)
            high.append(row)
        else:
            missing_by_category[base['category']] += 1
            low.append({**base, 'rating': -2})
            high.append({**base, 'rating': 2})
    planned_categories = sorted({row['category'] for row in assignments})
    observed_categories = sorted({row['category'] for row in retained})
    absent_categories = sorted(set(planned_categories) - set(observed_categories))
    return {
        'publication_eligible': False,
        'raw_record_count': len(records), 'planned_judgment_count': len(expected),
        'included_count': len(retained), 'missing_or_excluded_count': len(missing),
        'missing_by_category': dict(missing_by_category), 'exclusion_reason_counts': dict(reasons),
        'decisions': decisions, 'analysis_judgments': retained,
        'observed_only': weighted_experience(retained) if retained and not absent_categories else None,
        'planned_categories': planned_categories, 'observed_categories': observed_categories,
        'unavailable_reason': 'No retained ratings for planned categories: ' + ', '.join(absent_categories) if absent_categories else None,
        'all_planned_rating_bounds': {
            'lower': weighted_experience(low)['experience_delta'],
            'upper': weighted_experience(high)['experience_delta'],
            'interpretation': 'Worst-case sensitivity bounds, NOT an imputation, confidence interval, or repaired estimate.'},
    }
