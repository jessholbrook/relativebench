import json
from pathlib import Path
import unittest
from relativebench.objective_scoring import score_objective
from relativebench.manifest import validate_pilot

ROOT = Path(__file__).resolve().parents[2]
SCENARIOS = {s['id']: s for s in json.loads((ROOT / 'data/pilots/qwen2.5-to-qwen3/pilot-scenarios-0.3.0.json').read_text())['scenarios']}


class ObjectiveScoringTests(unittest.TestCase):
    def outcome(self, scenario, text):
        return score_objective(SCENARIOS[scenario], text)['outcome']

    def test_all_42_reference_answers_pass_candidate_rules(self):
        rows = [row for row in SCENARIOS.values() if row['scoring_mode'] == 'objective']
        self.assertEqual(len(rows), 42)
        for row in rows:
            with self.subTest(id=row['id']):
                self.assertEqual(score_objective(row, row['reference_answer'])['outcome'], 'pass')
                self.assertEqual(score_objective(row, 'Wrong answer')['outcome'], 'fail')

    def test_semantic_equivalences_without_prose_extraction(self):
        for task, answer in [
            ('reasoning-rate-002', '1.2e2'),
            ('instruction_following-json-001', '{ "status": "ready", "count": 3.0 }'),
            ('instruction_following-json-escape-016', '{"message":"She said \\u0022go\\u0022."}'),
            ('structured_output-csv-001', '"name","score"\r\n"Ada",9\r\nLin,7\r\n'),
            ('structured_output-csv-newline-008', 'id,text\r\n1,"hello\r\nworld"\r\n'),
            ('structured_output-csv-newline-008', '"id","text"\r\n"1","hello\r\nworld"\r\n'),
            ('structured_output-xml-escape-019', '<query>a &#60; b &amp; c > d</query>'),
            ('structured_output-xml-escape-019', '<query><![CDATA[a < b & c > d]]></query>'),
            ('instruction_following-xml-009', '<result ok="&#116;rue">7</result>'),
            ('structured_output-yaml-004', '{status: ready, cached: false}'),
            ('instruction_following-bullets-002', '* apple\n* banana\n* cherry\n'),
            ('instruction_following-table-007', 'Model | Score\n--- | ---\nA | 9\nB | 8'),
        ]:
            with self.subTest(task=task):
                self.assertEqual(self.outcome(task, answer), 'pass')
                self.assertEqual(self.outcome(task, 'Here is the answer: ' + answer), 'fail')

    def test_format_types_key_order_and_duplicates_matter(self):
        for task, answer in [
            ('instruction_following-precision-020', '0.8750\n'),
            ('instruction_following-xml-009', '<result ok="true">7</result>\n'),
            ('instruction_following-xml-009', "<result ok='true'>7</result>"),
            ('instruction_following-xml-009', "<result ok='true'><!-- ok=\"true\" -->7</result>"),
            ('instruction_following-json-001', '{"count":3,"status":"ready"}'),
            ('instruction_following-json-001', '{"status":"ready","count":true}'),
            ('instruction_following-json-001', '{"status":"ready","count":3,"count":3}'),
            ('structured_output-json-types-006', '{"enabled":1,"retries":2,"tags":[]}'),
            ('structured_output-yaml-004', 'status: ready\ncached: "false"'),
            ('structured_output-yaml-004', 'status: ready\ncached: false\ncached: false'),
        ]:
            with self.subTest(task=task):
                self.assertEqual(self.outcome(task, answer), 'fail')

    def test_old_or_changed_scenarios_and_rubric_tasks_are_unscorable(self):
        row = SCENARIOS['reasoning-optimization-020']
        self.assertEqual(score_objective({**row, 'prompt_template': 'old ambiguous prompt'}, '28')['outcome'], 'unscorable')
        self.assertEqual(self.outcome('coding-sql-retention-012', 'SELECT 1'), 'unscorable')

    def test_corrected_candidate_is_valid_and_old_manifest_is_untouched(self):
        result = validate_pilot(ROOT / 'data/pilots/qwen2.5-to-qwen3/primary-candidate.json')
        self.assertTrue(result['valid'], result['errors'])
        self.assertIn('UTC calendar dates', SCENARIOS['coding-sql-retention-012']['prompt_template'])
        self.assertEqual(max(3*s+8*l for s in range(5) for l in range(4) if s+3*l <= 10), 28)
        old = json.loads((ROOT / 'data/pilots/qwen2.5-to-qwen3/pilot-scenarios.json').read_text())
        self.assertIn('at most 10 crates', next(s for s in old['scenarios'] if s['id'] == 'reasoning-optimization-020')['prompt_template'])
