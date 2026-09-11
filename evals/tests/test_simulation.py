import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'evals'))
from collections import Counter

try:
    import numpy as np
except ImportError:
    np = None

from relativebench.inference import EmptyResample, protocol_weighted_judgments
from relativebench.metrics import summarize_experience


@unittest.skipIf(np is None, 'Install requirements-validation.txt for simulation tests.')
class SimulationTests(unittest.TestCase):
    def test_vectorized_engine_matches_reference_with_sparse_multiplicities(self):
        from relativebench.simulation import matrix_estimates
        values = np.array([[2., -1, 0], [0, 0, 1], [-2, 0, 2], [1, -2, 0]])
        observed = np.array([[1., 1, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]])
        categories = np.array(['a', 'a', 'b', 'b'])
        judgments = [{'category': categories[i], 'scenario_id': str(i), 'evaluator_id': str(j), 'rating': int(values[i,j])}
                     for i in range(4) for j in range(3) if observed[i,j]]
        rng = np.random.default_rng(128)
        sc = np.concatenate([rng.multinomial(2, [.5, .5], 100), rng.multinomial(2, [.5, .5], 100)], axis=1)
        ec = rng.multinomial(3, [1/3]*3, 100)
        estimates, valid = matrix_estimates(values, observed, categories, sc, ec)
        for i in range(100):
            try:
                rows = protocol_weighted_judgments(judgments, Counter({str(j): int(sc[i,j]) for j in range(4)}),
                                                  Counter({str(j): int(ec[i,j]) for j in range(3)}))
            except EmptyResample:
                self.assertFalse(valid[i])
            else:
                self.assertTrue(valid[i])
                self.assertAlmostEqual(estimates[i], summarize_experience(rows)['experience_delta'], places=10)

    def test_truth_symmetry_and_deterministic_simulation(self):
        from relativebench.simulation import true_delta, run_case, CASES
        self.assertAlmostEqual(true_delta(0, .65, .5, .85), 0)
        self.assertAlmostEqual(true_delta(.3, .65, .5, .85), -true_delta(-.3, .65, .5, .85))
        scenarios = [{'id': f's{i}', 'category': str(i // 2)} for i in range(12)]
        first = run_case(CASES[1], scenarios, 2, 100, 55)
        self.assertEqual(first, run_case(CASES[1], scenarios, 2, 100, 55))
