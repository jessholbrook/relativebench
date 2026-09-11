import math
import unittest

try:
    import numpy
except ImportError:
    numpy = None


@unittest.skipIf(numpy is None, 'Install requirements-validation.txt for simulation tests.')
class DesignStudyTests(unittest.TestCase):
    def test_slots_are_unique_balanced_and_not_real_prompts(self):
        from relativebench.design_study import scenario_slots
        slots = scenario_slots(480, ['a', 'b', 'c', 'd', 'e', 'f'])
        self.assertEqual(len({row['id'] for row in slots}), 480)
        self.assertEqual(sum(row['category'] == 'a' for row in slots), 80)
        self.assertTrue(all(set(row) == {'id', 'category'} for row in slots))
        with self.assertRaises(ValueError):
            scenario_slots(121, ['a', 'b'])

    def test_known_truth_and_replay(self):
        from relativebench.design_study import shift_for_delta, run_design, CONDITIONS
        from relativebench.simulation import true_delta
        for target in [-10, 0, 10]:
            shift = shift_for_delta(target, .65, .5, .35)
            self.assertAlmostEqual(true_delta(shift, .65, .5, math.hypot(.85, .35)), target)
        design = {'name': 'test', 'scenarios': 12, 'evaluators': 40}
        first = run_design(design, CONDITIONS[0], ['a', 'b'], 2, 100, 17)
        self.assertEqual(first, run_design(design, CONDITIONS[0], ['a', 'b'], 2, 100, 17))
        self.assertEqual(first['allocation_audit']['assignment_count'], 180)
        self.assertAlmostEqual(first['truth'], 0)

    def test_width_success_is_not_upgrade_or_coverage(self):
        from relativebench.design_study import precision_summary
        rows = [{'estimate': 0, 'lower': -4, 'upper': 4},
                {'estimate': 10, 'lower': 8, 'upper': 12}]
        result = precision_summary(rows, 0)
        self.assertEqual(result['width_at_most_10_rate'], 1)
        self.assertEqual(result['coverage'], .5)
        self.assertEqual(result['upgrade_rate_at_provisional_5'], .5)
