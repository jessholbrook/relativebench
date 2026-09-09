import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'evals'))
from relativebench.inference import (  # noqa: E402
    EmptyResample, bootstrap_experience, protocol_weighted_judgments, weighted_experience,
)
from relativebench.metrics import summarize_experience


def judgment(scenario, evaluator, rating, category='reasoning', **extra):
    return dict(category=category, scenario_id=scenario, evaluator_id=evaluator, rating=rating, **extra)


class InferenceSafeguards(unittest.TestCase):
    def test_unsampled_scenarios_and_evaluators_are_absent(self):
        rows = [judgment('s1', 'e1', 2), judgment('s1', 'e2', -2), judgment('s2', 'e1', -2)]
        weighted = protocol_weighted_judgments(rows, {'s1': 2}, {'e1': 2})
        self.assertEqual(weighted, [{'rating': 2, 'weight': 1}])
        with self.assertRaises(EmptyResample):
            protocol_weighted_judgments(rows, {}, {'e1': 2})

    def test_sparse_draw_reweights_surviving_scenarios_without_reweighting_categories(self):
        rows = [judgment('r1', 'a', 2), judgment('r2', 'b', -2), judgment('c1', 'a', -2, 'coding')]
        weighted = protocol_weighted_judgments(rows, {'r1': 1, 'r2': 1, 'c1': 1}, {'a': 2})
        self.assertAlmostEqual(sum(row['weight'] for row in weighted), 1)
        self.assertAlmostEqual(summarize_experience(weighted)['experience_delta'], 0)
        with self.assertRaises(EmptyResample):
            protocol_weighted_judgments(rows, {'r2': 2, 'c1': 1}, {'a': 2})

    def test_resample_multiplicity_is_applied(self):
        rows = [judgment('a', 'one', 2), judgment('b', 'one', -2)]
        weighted = protocol_weighted_judgments(rows, {'a': 3, 'b': 1})
        self.assertEqual(summarize_experience(weighted)['experience_delta'], 50)

    def test_invalid_raw_data_fails_before_bootstrap(self):
        for extra in ({'weight': -1}, {'weight': 0}, {'weight': float('nan')},
                      {'weight': float('inf')}, {'rating': True}, {'rating': 0.5},
                      {'evaluator_id': ''}, {'category': 1}):
            row = judgment('s', 'e', 1)
            row.update(extra)
            with self.subTest(extra=extra), self.assertRaises(ValueError):
                bootstrap_experience([row], replicates=100)
        with self.assertRaisesRegex(ValueError, 'multiple categories'):
            weighted_experience([judgment('s', 'a', 1), judgment('s', 'b', 1, 'coding')])

    def test_nonconstant_bootstrap_and_order_invariance(self):
        rows = [judgment(s, e, rating) for s, rating in [('a', -2), ('b', 2)] for e in ['x', 'y']]
        result = bootstrap_experience(rows, replicates=500, seed=23)
        self.assertEqual(result, bootstrap_experience(list(reversed(rows)), replicates=500, seed=23))
        self.assertEqual(result['experience_delta'], 0)
        self.assertEqual(result['confidence_interval']['lower'], -100)
        self.assertEqual(result['confidence_interval']['upper'], 100)
        self.assertEqual(result['bootstrap']['rejected_draws'], 0)

    def test_sparse_draw_diagnostics_and_degeneracy_are_visible(self):
        rows = [judgment('r', 'a', 1), judgment('c', 'b', -1, 'coding')]
        result = bootstrap_experience(rows, replicates=100, seed=2)
        self.assertGreater(result['bootstrap']['rejected_draws'], 0)
        self.assertEqual(result['bootstrap']['attempts'], 100 + result['bootstrap']['rejected_draws'])
        self.assertTrue(any('conditional' in warning for warning in result['warnings']))
        self.assertTrue(any('Degenerate' in warning for warning in result['warnings']))

    def test_repeated_judgments_do_not_change_scenario_weight(self):
        rows = [judgment('a', 'x', 2), judgment('b', 'x', -2)]
        duplicated = rows + [rows[0]] * 9
        self.assertAlmostEqual(weighted_experience(rows)['experience_delta'], weighted_experience(duplicated)['experience_delta'])
