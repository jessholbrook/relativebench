import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'evals'))
from relativebench.design import allocate, audit_allocation


class DesignTests(unittest.TestCase):
    def setUp(self):
        self.scenarios = [{'id': f's{i}', 'category': f'c{i // 20}'} for i in range(120)]
        self.people = [f'e{i}' for i in range(40)]

    def test_balance_uniqueness_and_replay(self):
        rows = allocate(self.scenarios, self.people)
        report = audit_allocation(rows, self.scenarios, self.people)
        self.assertTrue(report['valid'], report)
        self.assertEqual(report['assignment_count'], 1800)
        self.assertEqual(report['workload_range'], [45, 45])
        self.assertEqual(rows, allocate(list(reversed(self.scenarios)), list(reversed(self.people))))

    def test_tampering_and_insufficient_people(self):
        rows = allocate(self.scenarios, self.people)
        rows[0] = dict(rows[1])
        self.assertFalse(audit_allocation(rows, self.scenarios, self.people)['valid'])
        with self.assertRaises(ValueError):
            allocate(self.scenarios, self.people[:10])
