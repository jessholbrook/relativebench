import sys
import unittest
import json
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'evals'))

from relativebench.primary_packets import assigned_packet
from relativebench.rating import verify_primary_session, verify_internal_session


class PrimaryPacketTests(unittest.TestCase):
    def setUp(self):
        self.assignments = [{'assignment_id': 'a', 'scenario_id': 's', 'generation_seed': 11,
                             'evaluator_id': 'slot', 'new_on_left': True}]
        self.scenarios = {'s': {'id': 's', 'category': 'reasoning', 'difficulty': 'easy',
                               'scoring_mode': 'rubric', 'prompt_template': 'p', 'reference_answer': 'r'}}
        self.artifacts = {('s', 11, role): {'artifact_id': role, 'response_text': f'answer {index}', 'status': 'ok',
                          'adapter': 'transformers-bf16', 'adapter_metadata': {'weight_format': 'bfloat16'}}
                          for index, role in enumerate(('previous', 'new'))}

    def test_fixed_assignment_and_private_binding(self):
        packet = assigned_packet(self.assignments, self.scenarios, self.artifacts, 'test-code-not-human', 'nonce')
        self.assertFalse(packet['collection_authorized'])
        self.assertEqual(packet['form_selector'], 'assigned-slot-v1')
        assignment = packet['forms'][0]['assignments'][0]
        left = next(row for row in packet['pairs'][0]['responses'] if row['response_id'] == assignment['left_response_id'])
        self.assertEqual(left['text'], 'answer 1')
        self.assertEqual(packet, assigned_packet(self.assignments, self.scenarios, self.artifacts, 'test-code-not-human', 'nonce'))

    def test_rehearsal_artifacts_cannot_be_relabelled(self):
        self.artifacts[('s', 11, 'new')]['adapter'] = 'mlx-lm-4bit'
        with self.assertRaises(ValueError):
            assigned_packet(self.assignments, self.scenarios, self.artifacts, 'code', 'nonce')

    def test_export_binding_and_activation_are_verified_independently(self):
        packet = assigned_packet(self.assignments, self.scenarios, self.artifacts, 'code', 'nonce')
        row = packet['forms'][0]['assignments'][0]
        session = {'session_type': 'primary_collection', 'packet_id': packet['packet_id'],
                   'reviewer_code_sha256': packet['assigned_reviewer_sha256'], 'form_id': 'form-a',
                   'completed_assignment_count': 1, 'judgments': [{
                       'assignment_id': row['assignment_id'], 'pair_id': row['pair_id'], 'scenario_id': 's',
                       'category': 'reasoning', 'pointwise_left': 'meets', 'pointwise_right': 'meets',
                       'side_preference': 0, 'reason_tags': [], 'duration_ms': 1000}]}
        with tempfile.TemporaryDirectory() as directory:
            p, s = Path(directory) / 'packet.json', Path(directory) / 'session.json'
            p.write_text(json.dumps(packet)); s.write_text(json.dumps(session))
            self.assertFalse(verify_primary_session(p, s, True)['valid'])
            packet['collection_authorized'] = True  # Isolated test fixture only.
            p.write_text(json.dumps(packet))
            self.assertTrue(verify_primary_session(p, s, True)['valid'])
            self.assertFalse(verify_internal_session(p, s, True)['valid'])
            session['reviewer_code_sha256'] = '0'*64
            s.write_text(json.dumps(session))
            self.assertFalse(verify_primary_session(p, s, True)['valid'])
