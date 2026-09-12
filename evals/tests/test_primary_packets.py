import sys
import unittest
import json
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'evals'))

from relativebench.primary_packets import assigned_packet
from relativebench.rating import verify_primary_session, verify_internal_session
from relativebench.rating import verify_rating_packet
from relativebench.packet_identity import packet_receipt, stimulus_digest
from fixtures_bf16 import fingerprint, metadata


class PrimaryPacketTests(unittest.TestCase):
    def setUp(self):
        self.assignments = [{'assignment_id': 'a', 'scenario_id': 's', 'generation_seed': 11,
                             'evaluator_id': 'slot', 'new_on_left': True}]
        self.scenarios = {'s': {'id': 's', 'category': 'reasoning', 'difficulty': 'easy',
                               'scoring_mode': 'rubric', 'prompt_template': 'p', 'reference_answer': 'r'}}
        self.artifacts = {('s', 11, role): {'artifact_id': role, 'response_text': f'answer {index}', 'status': 'ok',
                          'model_revision': 'a' * 40,
                          'adapter': 'transformers-bf16', 'adapter_metadata': metadata(fingerprint())}
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
        session = {'session_version': '0.2.0', 'stimulus_sha256': stimulus_digest(packet),
                   'session_type': 'primary_collection', 'packet_id': packet['packet_id'],
                   'reviewer_code_sha256': packet['assigned_reviewer_sha256'], 'form_id': 'form-a',
                   'completed_assignment_count': 1, 'judgments': [{
                       'assignment_id': row['assignment_id'], 'pair_id': row['pair_id'], 'scenario_id': 's',
                       'category': 'reasoning', 'pointwise_left': 'meets', 'pointwise_right': 'meets',
                       'left_response_id': row['left_response_id'], 'right_response_id': row['right_response_id'],
                       'assessment_history': {'left': 'meets', 'right': 'meets', 'final_left': 'meets', 'final_right': 'meets', 'revisions': []},
                       'side_preference': 0, 'reason_tags': [], 'duration_ms': 1000}]}
        session['assessment_history'] = {row['assignment_id']: session['judgments'][0]['assessment_history']}
        with tempfile.TemporaryDirectory() as directory:
            p, s = Path(directory) / 'packet.json', Path(directory) / 'session.json'
            receipt = Path(directory) / 'receipt.json'
            receipt.write_text(json.dumps(packet_receipt(packet)))
            p.write_text(json.dumps(packet)); s.write_text(json.dumps(session))
            self.assertFalse(verify_primary_session(p, s, True)['valid'])
            packet['collection_authorized'] = True  # Isolated test fixture only.
            p.write_text(json.dumps(packet))
            self.assertTrue(verify_primary_session(p, s, True, receipt_path=receipt)['valid'])
            self.assertFalse(verify_primary_session(p, s, True)['valid'])
            packet['pairs'][0]['prompt'] = 'Changed prompt'
            packet['stimulus_sha256'] = stimulus_digest(packet)
            p.write_text(json.dumps(packet))
            self.assertFalse(verify_primary_session(p, s, True, receipt_path=receipt)['valid'])
            session['stimulus_sha256'] = packet['stimulus_sha256']
            s.write_text(json.dumps(session))
            report = verify_primary_session(p, s, True, receipt_path=receipt)
            self.assertTrue(any('freeze-time receipt' in error for error in report['errors']))
            self.assertFalse(verify_internal_session(p, s, True)['valid'])
            session['reviewer_code_sha256'] = '0'*64
            s.write_text(json.dumps(session))
            self.assertFalse(verify_primary_session(p, s, True)['valid'])

    def test_changed_stimuli_order_and_empty_packets_fail_closed(self):
        from copy import deepcopy
        packet = assigned_packet(self.assignments, self.scenarios, self.artifacts, 'code', 'nonce')
        digest = stimulus_digest(packet)
        for mutation in ('prompt', 'rubric', 'text', 'swap'):
            changed = deepcopy(packet)
            if mutation in ('prompt', 'rubric'):
                changed['pairs'][0][mutation] += ' changed'
            elif mutation == 'text':
                changed['pairs'][0]['responses'][0]['text'] += ' changed'
            else:
                row = changed['forms'][0]['assignments'][0]
                row['left_response_id'], row['right_response_id'] = row['right_response_id'], row['left_response_id']
            self.assertNotEqual(stimulus_digest(changed), digest)
        with tempfile.TemporaryDirectory() as directory:
            p, s = Path(directory) / 'packet.json', Path(directory) / 'session.json'
            packet['pairs'] = []; packet['forms'][0]['assignments'] = []
            p.write_text(json.dumps(packet)); s.write_text('{}')
            report = verify_primary_session(p, s, True)
            self.assertFalse(report['valid']); self.assertFalse(report['complete'])

    def test_packet_auditor_rejects_empty_and_duplicate_forms(self):
        from unittest.mock import patch
        from relativebench.cli import main
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'packet.json'
            for forms in ([{'form_id': 'form-a', 'assignments': []}, {'form_id': 'form-b', 'assignments': []}],
                          [{'form_id': 'form-a', 'assignments': []}] * 3):
                path.write_text(json.dumps({'pairs': [], 'forms': forms}))
                self.assertFalse(verify_rating_packet(path)['valid'])
                with patch('sys.argv', ['relativebench', 'verify-rating-packet', str(path)]), patch('builtins.print'), self.assertRaises(SystemExit) as raised:
                    main()
                self.assertEqual(raised.exception.code, 1)
