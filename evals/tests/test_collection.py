import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'evals'))
from relativebench.collection import prepare_collection, audit_critical_tasks
from relativebench.readiness import primary_plan, validate_activation
from relativebench.private_allocation import private_destination


class CollectionTests(unittest.TestCase):
    def setUp(self):
        self.assignments = [{'assignment_id': str(i), 'scenario_id': str(i), 'category': 'a',
                             'evaluator_id': 'e', 'new_on_left': i % 2 == 0} for i in range(2)]
        self.records = [{'assignment_id': str(i), 'evaluator_id': 'e', 'side_preference': 1,
                         'attention_passed': True, 'eligible_incumbent': True, 'duration_ms': 1000} for i in range(2)]

    def test_blinding_then_unblinding_and_complete_bounds(self):
        result = prepare_collection(self.assignments, self.records)
        self.assertEqual([row['rating'] for row in result['analysis_judgments']], [-1, 1])
        self.assertEqual(result['all_planned_rating_bounds']['lower'], 0)
        self.assertEqual(result['all_planned_rating_bounds']['upper'], 0)
        self.assertFalse(result['publication_eligible'])

    def test_missingness_bounds_and_no_imputation_in_estimate(self):
        result = prepare_collection(self.assignments, self.records[:1])
        self.assertEqual(result['included_count'], 1)
        self.assertEqual(result['observed_only']['experience_delta'], -50)
        self.assertEqual(result['all_planned_rating_bounds']['lower'], -75)
        self.assertEqual(result['all_planned_rating_bounds']['upper'], 25)

    def test_duplicate_quarantine_is_order_independent_and_symmetric(self):
        records = self.records + [dict(self.records[0], side_preference=-2)]
        one = prepare_collection(self.assignments, records)
        two = prepare_collection(self.assignments, list(reversed(records)))
        self.assertEqual(one['analysis_judgments'], two['analysis_judgments'])
        self.assertEqual(one['included_count'], 1)
        self.records[0]['attention_passed'] = False
        result = prepare_collection(self.assignments, self.records)
        self.records[0]['side_preference'] = -2
        self.assertEqual(result['decisions'], prepare_collection(self.assignments, self.records)['decisions'])

    def test_fail_closed_and_time_rule(self):
        for bad in [None, True, 3, float('nan')]:
            self.records[0]['side_preference'] = bad
            self.assertEqual(prepare_collection(self.assignments, self.records)['included_count'], 1)
        self.assertEqual(prepare_collection(self.assignments, [], minimum_reading_ms=0)['all_planned_rating_bounds']['lower'], -100)
        with self.assertRaises(ValueError):
            prepare_collection(self.assignments, [], minimum_reading_ms=-1)

    def test_primary_plan_commits_720_requests_without_authorizing_collection(self):
        path = Path(__file__).resolve().parents[2] / 'data/pilots/qwen2.5-to-qwen3/pilot.json'
        result = primary_plan(path)
        self.assertEqual(result['request_count'], 720)
        self.assertTrue(result['allocation_audit']['valid'])
        self.assertFalse(result['collection_authorized'])
        self.assertEqual(result['plan_sha256'], primary_plan(path)['plan_sha256'])
        with self.assertRaises(ValueError):
            validate_activation(result, {})

    def test_critical_regressions_and_missing_scores_block_clearance(self):
        row = {'scenario_id': 's', 'seed': 11, 'previous_pass': True, 'new_pass': False}
        self.assertFalse(audit_critical_tasks([row], ['s'])['clear'])
        self.assertFalse(audit_critical_tasks([], ['s'])['clear'])
        self.assertTrue(audit_critical_tasks([{**row, 'new_pass': True}], ['s'])['clear'])

    def test_private_keys_cannot_target_public_or_tracked_data(self):
        root = Path(__file__).resolve().parents[2]
        for target in ('public/allocation.json', 'data/allocation.json', 'private/../data/allocation.json'):
            with self.assertRaises(ValueError):
                private_destination(root / target)
