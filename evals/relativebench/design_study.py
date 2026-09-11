"""Prospective design screening, never participant data or an activated protocol.

Expanded scenarios are independent hypothetical slots, NOT duplicated real tasks.
The frozen manifest and production estimator are not modified.
"""

import argparse
import json
import math
import platform
import time
from pathlib import Path

import numpy as np

from .artifacts import sha256_file, sha256_value, write_json
from .design import allocate, audit_allocation
from .manifest import validate_pilot
from .simulation import interval, matrix_estimates, summarize_trials, true_delta, wilson


DESIGNS = [
    {'name': 's120_e40', 'scenarios': 120, 'evaluators': 40},
    {'name': 's120_e160', 'scenarios': 120, 'evaluators': 160},
    {'name': 's240_e160', 'scenarios': 240, 'evaluators': 160},
    {'name': 's480_e320', 'scenarios': 480, 'evaluators': 320},
    {'name': 's480_e640', 'scenarios': 480, 'evaluators': 640},
]
CONDITIONS = [
    {'name': 'clustered_null', 'target_delta': 0, 'scenario_sd': .65,
     'evaluator_sd': .5, 'generation_sd': .35, 'missing': 'none'},
    {'name': 'clustered_gain10', 'target_delta': 10, 'scenario_sd': .65,
     'evaluator_sd': .5, 'generation_sd': .35, 'missing': 'none'},
    {'name': 'strong_evaluator_null', 'target_delta': 0, 'scenario_sd': .65,
     'evaluator_sd': 1, 'generation_sd': .35, 'missing': 'none'},
    {'name': 'random_dropout_null', 'target_delta': 0, 'scenario_sd': .65,
     'evaluator_sd': .5, 'generation_sd': .35, 'missing': 'mcar25'},
]


def scenario_slots(count, categories):
    if count < len(categories) or count % len(categories):
        raise ValueError('Scenario count must be a positive multiple of categories.')
    return [{'id': f'hypothetical-{category}-{i:03}', 'category': category}
            for category in categories for i in range(count // len(categories))]


def shift_for_delta(target, scenario_sd, evaluator_sd, generation_sd):
    if not -100 < target < 100:
        raise ValueError('Target must be inside the ordinal scale.')
    noise = math.hypot(.85, generation_sd)
    low, high = -20., 20.
    for _ in range(100):
        middle = (low + high) / 2
        if true_delta(middle, scenario_sd, evaluator_sd, noise) < target:
            low = middle
        else:
            high = middle
    return (low + high) / 2


def precision_summary(rows, truth):
    result = summarize_trials(rows, truth)
    successful = [row for row in rows if 'lower' in row]
    widths = [row['upper'] - row['lower'] for row in successful]
    hits = sum(width <= 10 for width in widths)
    result.update({
        'mean_half_width': float(np.mean(widths) / 2),
        'half_width_p90': float(np.quantile(widths, .9) / 2),
        'width_at_most_10_rate': hits / len(successful),
        'width_at_most_10_wilson95': wilson(hits, len(successful)),
        'upgrade_wilson95': wilson(sum(row['lower'] > 5 for row in successful), len(successful)),
        'interpretation': 'Screening only; width success does not establish coverage, power, or lack of bias.',
    })
    return result


def run_design(design, condition, categories, trials, replicates, seed):
    scenarios = scenario_slots(design['scenarios'], categories)
    people = [f'hypothetical-slot-{i:04}' for i in range(design['evaluators'])]
    allocation = allocate(scenarios, people, seed=seed)
    audit = audit_allocation(allocation, scenarios, people)
    if not audit['valid']:
        raise ValueError(audit['errors'])
    si_map = {row['id']: i for i, row in enumerate(scenarios)}
    ei_map = {person: i for i, person in enumerate(people)}
    si = np.array([si_map[row['scenario_id']] for row in allocation])
    ei = np.array([ei_map[row['evaluator_id']] for row in allocation])
    gi = np.array([3 * si_map[row['scenario_id']] + (11, 29, 47).index(row['generation_seed'])
                   for row in allocation])
    cat = np.array([row['category'] for row in scenarios])
    shift = shift_for_delta(condition['target_delta'], condition['scenario_sd'],
                            condition['evaluator_sd'], condition['generation_sd'])
    truth = true_delta(shift, condition['scenario_sd'], condition['evaluator_sd'],
                       math.hypot(.85, condition['generation_sd']))
    rows = []
    for trial in range(trials):
        # Repeated trials independent; common seeds across conditions/designs.
        rng = np.random.default_rng(np.random.SeedSequence([seed, trial]))
        latent = (shift + rng.normal(0, condition['scenario_sd'], len(scenarios))[si]
                  + rng.normal(0, condition['evaluator_sd'], len(people))[ei]
                  + rng.normal(0, condition['generation_sd'], len(scenarios) * 3)[gi]
                  + rng.normal(0, .85, len(allocation)))
        ratings = np.digitize(latent, [-1.5, -.5, .5, 1.5]) - 2
        keep = rng.random(len(ratings)) >= .25 if condition['missing'] == 'mcar25' else np.ones(len(ratings), dtype=bool)
        values = np.zeros((len(scenarios), len(people)))
        observed = np.zeros_like(values)
        values[si[keep], ei[keep]] = ratings[keep]
        observed[si[keep], ei[keep]] = 1
        estimate, valid = matrix_estimates(values, observed, cat, np.ones((1, len(scenarios))), np.ones((1, len(people))))
        try:
            if not valid[0]:
                raise ValueError('No category support.')
            bounds, rejected, attempts = interval(values, observed, cat, replicates, rng)
            rows.append({'trial': trial, 'estimate': float(estimate[0]), 'lower': bounds[0], 'upper': bounds[1],
                         'observed_judgments': int(keep.sum()), 'rejected_draws': rejected, 'attempts': attempts})
        except ValueError as error:
            rows.append({'trial': trial, 'error': str(error)})
        if (trial + 1) % 20 == 0:
            print(json.dumps({'design': design['name'], 'condition': condition['name'], 'completed_trials': trial + 1}), flush=True)
    return {'design': design, 'condition': condition, 'latent_shift': shift, 'truth': truth,
            'allocation_sha256': sha256_value(allocation), 'allocation_audit': audit,
            'summary': precision_summary(rows, truth), 'trial_results': rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--trials', type=int, default=100)
    parser.add_argument('--replicates', type=int, default=10000)
    parser.add_argument('--seed', type=int, default=20260911)
    parser.add_argument('--design', action='append', choices=[row['name'] for row in DESIGNS])
    parser.add_argument('--condition', action='append', choices=[row['name'] for row in CONDITIONS])
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    if args.trials < 2 or args.replicates < 100:
        parser.error('At least two trials and 100 replicates; small runs are software checks only.')
    output = Path(args.output)
    if output.exists() or output.with_suffix('.partial.json').exists():
        parser.error('Choose a new output path; previous evidence must be preserved.')
    pilot = validate_pilot('data/pilots/qwen2.5-to-qwen3/pilot.json')
    if not pilot['valid']:
        parser.error(str(pilot['errors']))
    categories = sorted({row['category'] for row in pilot['scenario_manifest']['scenarios']})
    started = time.monotonic()
    result = {'kind': 'prospective_design_simulation_not_human_results', 'seed': args.seed,
              'trials': args.trials, 'replicates': args.replicates, 'python': platform.python_version(),
              'numpy': np.__version__, 'code_sha256': sha256_file(__file__),
              'engine_sha256': sha256_file(Path(__file__).with_name('simulation.py')),
              'allocation_code_sha256': sha256_file(Path(__file__).with_name('design.py')),
              'source_manifest_sha256': sha256_file(pilot['scenario_path']),
              'scenarios_are_hypothetical': True, 'category_names': categories, 'cases': []}
    for design in DESIGNS:
        if args.design and design['name'] not in args.design:
            continue
        for condition in CONDITIONS:
            if args.condition and condition['name'] not in args.condition:
                continue
            case = run_design(design, condition, categories, args.trials, args.replicates, args.seed)
            result['cases'].append(case)
            print(json.dumps({'design': design['name'], 'condition': condition['name'], **case['summary']}), flush=True)
            write_json(output.with_suffix('.partial.json'), result)
    result.update({'complete': True, 'publication_eligible': False, 'collection_authorized': False,
                   'elapsed_seconds': time.monotonic() - started})
    write_json(output, result)


if __name__ == '__main__':
    main()
