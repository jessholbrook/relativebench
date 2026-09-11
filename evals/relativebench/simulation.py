"""Reproducible design diagnostics. Generated ratings are NOT participant data.

Optional NumPy accelerates the same category/scenario/evaluator ratio estimator.
Fixed-multiplicity tests compare this engine with the production reference.
"""

import argparse
import json
import math
import platform
from pathlib import Path

import numpy as np

from .artifacts import sha256_file, sha256_value, write_json
from .design import allocate, audit_allocation
from .manifest import validate_pilot


def matrix_estimates(values, observed, categories, scenario_counts, evaluator_counts):
    """One row per draw. Missing cells have zero numerator AND denominator."""
    numerator = evaluator_counts @ values.T
    denominator = evaluator_counts @ observed.T
    supported = denominator > 0
    means = np.divide(numerator, denominator, out=np.zeros_like(numerator), where=supported)
    weights = scenario_counts * supported
    estimates = np.zeros(len(scenario_counts))
    valid = np.ones(len(scenario_counts), dtype=bool)
    for category in np.unique(categories):
        mask = categories == category
        mass = weights[:, mask].sum(axis=1)
        valid &= mass > 0
        estimates += np.divide((means[:, mask] * weights[:, mask]).sum(axis=1), mass,
                               out=np.zeros(len(mass)), where=mass > 0)
    return estimates * (50 / len(np.unique(categories))), valid


def interval(values, observed, categories, replicates, rng):
    # Match production: resample observed scenario/evaluator clusters, not empty
    # planned clusters. Still require every planned category to be represented.
    active_scenarios = observed.sum(axis=1) > 0
    active_people = observed.sum(axis=0) > 0
    if set(categories[active_scenarios]) != set(categories):
        raise ValueError('No support in a planned category.')
    values = values[active_scenarios][:, active_people]
    observed = observed[active_scenarios][:, active_people]
    categories = categories[active_scenarios]
    estimates = []
    attempts = 0
    rejected = 0
    n_scenarios, n_people = values.shape
    while sum(len(x) for x in estimates) < replicates and attempts < replicates * 10:
        batch = min(256, replicates - sum(len(x) for x in estimates))
        sc = np.zeros((batch, n_scenarios))
        for category in np.unique(categories):
            indices = np.flatnonzero(categories == category)
            sc[:, indices] = rng.multinomial(len(indices), np.full(len(indices), 1 / len(indices)), size=batch)
        ec = rng.multinomial(n_people, np.full(n_people, 1 / n_people), size=batch).astype(float)
        result, valid = matrix_estimates(values, observed, categories, sc, ec)
        estimates.append(result[valid])
        attempts += batch
        rejected += int((~valid).sum())
    draws = np.concatenate(estimates)
    if len(draws) != replicates:
        raise ValueError('Could not produce enough supported bootstrap draws.')
    return np.quantile(draws, [.025, .975]).tolist(), rejected, attempts


def true_delta(shift, scenario_sd, evaluator_sd, noise_sd):
    # Ordinal cutpoints -1.5,-0.5,0.5,1.5; E[Y] = -2 + sum P(Z > cut).
    sd = math.sqrt(scenario_sd ** 2 + evaluator_sd ** 2 + noise_sd ** 2)
    return 50 * (-2 + sum(.5 * math.erfc((cut - shift) / (sd * math.sqrt(2)))
                          for cut in (-1.5, -.5, .5, 1.5)))


def summarize_trials(trials, truth):
    total = len(trials)
    successful = [row for row in trials if 'lower' in row]
    if not total:
        raise ValueError('At least one attempted trial is required.')
    n = len(successful)
    covered = sum(row['lower'] <= truth <= row['upper'] for row in successful)
    coverage = covered / n if n else None
    upgrade = sum(row['lower'] > 5 for row in successful) / total
    regression = sum(row['upper'] < -5 for row in successful) / total
    widths = [row['upper'] - row['lower'] for row in successful]
    return {
        'trials': total, 'successful_trials': len(successful), 'failed_trials': total - len(successful),
        'coverage': coverage, 'coverage_denominator': n,
        'coverage_interpretation': 'Conditional on successful intervals; failures are reported separately.',
        'coverage_mcse': math.sqrt(coverage * (1 - coverage) / n) if n else None,
        'coverage_wilson_95': wilson(covered, n),
        'bias': float(np.mean([row['estimate'] - truth for row in successful])) if n else None,
        'mean_width': float(np.mean(widths)) if n else None, 'width_p90': float(np.quantile(widths, .9)) if n else None,
        'upgrade_rate_at_provisional_5': upgrade, 'regression_rate_at_provisional_minus5': regression,
        'decision_rate_denominator': total,
        'upgrade_mcse': math.sqrt(upgrade * (1 - upgrade) / total),
        'sidegrade_rate': sum(row['lower'] >= -5 and row['upper'] <= 5 for row in successful) / total,
        'rejected_draws': sum(row.get('rejected_draws', 0) for row in successful),
    }


def wilson(successes, n):
    if n == 0:
        return None
    z = 1.959963984540054
    p = successes / n
    center = (p + z*z/(2*n)) / (1 + z*z/n)
    half = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / (1 + z*z/n)
    return [center - half, center + half]


CASES = [
    {'name': 'independent_null_40', 'evaluators': 40, 'shift': 0, 'scenario_sd': 0, 'evaluator_sd': 0, 'missing': 'none'},
    {'name': 'crossed_null_40', 'evaluators': 40, 'shift': 0, 'scenario_sd': .65, 'evaluator_sd': .5, 'missing': 'none'},
    {'name': 'crossed_gain_40', 'evaluators': 40, 'shift': .3, 'scenario_sd': .65, 'evaluator_sd': .5, 'missing': 'none'},
    {'name': 'crossed_gain_80', 'evaluators': 80, 'shift': .3, 'scenario_sd': .65, 'evaluator_sd': .5, 'missing': 'none'},
    {'name': 'crossed_loss_40', 'evaluators': 40, 'shift': -.3, 'scenario_sd': .65, 'evaluator_sd': .5, 'missing': 'none'},
    {'name': 'random_dropout_40', 'evaluators': 40, 'shift': 0, 'scenario_sd': .65, 'evaluator_sd': .5, 'missing': 'mcar'},
    {'name': 'outcome_dropout_40', 'evaluators': 40, 'shift': 0, 'scenario_sd': .65, 'evaluator_sd': .5, 'missing': 'mnar'},
    {'name': 'strong_evaluator_null_40', 'evaluators': 40, 'shift': 0, 'scenario_sd': .25, 'evaluator_sd': 1, 'missing': 'none'},
]


def run_case(case, scenarios, trials, replicates, seed):
    people = [f'slot-{i:03}' for i in range(case['evaluators'])]
    allocation = allocate(scenarios, people, seed=seed)
    audit = audit_allocation(allocation, scenarios, people)
    if not audit['valid']:
        raise ValueError(audit['errors'])
    scenario_index = {row['id']: i for i, row in enumerate(scenarios)}
    person_index = {person: i for i, person in enumerate(people)}
    si = np.array([scenario_index[row['scenario_id']] for row in allocation])
    ei = np.array([person_index[row['evaluator_id']] for row in allocation])
    categories = np.array([row['category'] for row in scenarios])
    rows = []
    truth = true_delta(case['shift'], case['scenario_sd'], case['evaluator_sd'], .85)
    for trial in range(trials):
        rng = np.random.default_rng(np.random.SeedSequence([seed, trial]))
        latent = (case['shift'] + rng.normal(0, case['scenario_sd'], len(scenarios))[si]
                  + rng.normal(0, case['evaluator_sd'], len(people))[ei]
                  + rng.normal(0, .85, len(allocation)))
        ratings = np.digitize(latent, [-1.5, -.5, .5, 1.5]) - 2
        keep = np.ones(len(ratings), dtype=bool)
        if case['missing'] == 'mcar':
            keep = rng.random(len(ratings)) >= .25
        elif case['missing'] == 'mnar':
            keep = rng.random(len(ratings)) >= np.where(ratings < 0, .65, .05)
        values = np.zeros((len(scenarios), len(people)))
        observed = np.zeros_like(values)
        values[si[keep], ei[keep]] = ratings[keep]
        observed[si[keep], ei[keep]] = 1
        point, supported = matrix_estimates(values, observed, categories, np.ones((1, len(scenarios))), np.ones((1, len(people))))
        try:
            if not supported[0]:
                raise ValueError('No support in a category.')
            bounds, rejected, attempts = interval(values, observed, categories, replicates, rng)
            rows.append({'trial': trial, 'estimate': float(point[0]), 'lower': bounds[0], 'upper': bounds[1],
                         'observed_judgments': int(keep.sum()), 'rejected_draws': rejected, 'attempts': attempts})
        except ValueError as error:
            rows.append({'trial': trial, 'error': str(error)})
    return {'case': case, 'truth': truth, 'allocation_sha256': sha256_value(allocation),
            'allocation_audit': audit, 'summary': summarize_trials(rows, truth), 'trial_results': rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pilot', default='data/pilots/qwen2.5-to-qwen3/pilot.json')
    parser.add_argument('--trials', type=int, default=200)
    parser.add_argument('--replicates', type=int, default=10000)
    parser.add_argument('--seed', type=int, default=20260910)
    parser.add_argument('--case', action='append', choices=[row['name'] for row in CASES])
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    if args.trials < 2 or args.replicates < 100:
        parser.error('At least two trials and 100 replicates are required (small runs are smoke tests only).')
    output = Path(args.output)
    if output.exists():
        parser.error('Output already exists; choose a new path to retain evidence.')
    validated = validate_pilot(args.pilot)
    if not validated['valid']:
        parser.error(str(validated['errors']))
    result = {'kind': 'simulation_not_human_results', 'engine': 'numpy-ratio-bootstrap-v1',
              'reference_implementation': '0.1.1', 'seed': args.seed, 'trials': args.trials,
              'replicates': args.replicates, 'python': platform.python_version(), 'numpy': np.__version__,
              'manifest_sha256': sha256_file(validated['scenario_path']),
              'code_sha256': sha256_file(__file__), 'cases': []}
    for case in CASES:
        if args.case and case['name'] not in args.case:
            continue
        result['cases'].append(run_case(case, validated['scenario_manifest']['scenarios'], args.trials, args.replicates, args.seed))
        print(json.dumps({'case': case['name'], **result['cases'][-1]['summary']}), flush=True)
        write_json(output.with_suffix('.partial.json'), result)
    result['complete'] = True
    result['publication_eligible'] = False
    write_json(output, result)


if __name__ == '__main__':
    main()
