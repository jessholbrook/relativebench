import copy
import json
from pathlib import Path
import tempfile
import unittest

from relativebench.adapters.base import GenerationResult
from relativebench.artifacts import sha256_value, write_jsonl
from relativebench.runner import run_pilot, verify_run, _artifact_identity
from relativebench.rating_history import validate_assessment
from fixtures_bf16 import fingerprint, metadata

ROOT = Path(__file__).resolve().parents[2]
PILOT = ROOT / 'data/pilots/qwen2.5-to-qwen3/pilot.json'
MODEL = json.loads(PILOT.read_text())['models']['previous']


class FakeBf16:
    name = 'transformers-bf16'

    def __init__(self, limit=None):
        self.execution_fingerprint = fingerprint(MODEL['repository'], MODEL['revision'])
        self.limit = limit
        self.calls = 0

    def generate(self, request):
        if self.limit is not None and self.calls >= self.limit:
            raise RuntimeError('test interruption')
        self.calls += 1
        return GenerationResult(text='fixture only', metadata=metadata(self.execution_fingerprint))


class ReviewRegressionTests(unittest.TestCase):
    def test_coherent_bf16_artifacts_resume_before_first_manifest_checkpoint(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(RuntimeError):
                run_pilot(PILOT, 'frozen-non-thinking-v1', directory, FakeBf16(1), model_roles=('previous',), checkpoint_every=2)
            self.assertFalse((Path(directory) / 'run-manifest.json').exists())
            result = run_pilot(PILOT, 'frozen-non-thinking-v1', directory, FakeBf16(), model_roles=('previous',), resume=True)
            self.assertEqual(result['artifact_count'], 360)

    def test_resume_refuses_snapshot_runtime_or_host_changes(self):
        for field in ('snapshot', 'runtime', 'environment'):
            with self.subTest(field=field), tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(RuntimeError):
                    run_pilot(PILOT, 'frozen-non-thinking-v1', directory, FakeBf16(1), model_roles=('previous',))
                changed = FakeBf16()
                changed.execution_fingerprint[field]['changed'] = 'different'
                with self.assertRaisesRegex(ValueError, 'changed execution fingerprint'):
                    run_pilot(PILOT, 'frozen-non-thinking-v1', directory, changed, model_roles=('previous',), resume=True)
                self.assertEqual(changed.calls, 0)

    def test_independent_verifier_rejects_mixed_fingerprints_even_with_rehashed_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(RuntimeError):
                run_pilot(PILOT, 'frozen-non-thinking-v1', directory, FakeBf16(2), model_roles=('previous',))
            path = Path(directory) / 'responses.jsonl'
            rows = [json.loads(line) for line in path.read_text().splitlines()]
            changed = copy.deepcopy(rows[1]['adapter_metadata']['execution_fingerprint'])
            changed['environment']['driver'] = 'other'
            rows[1]['adapter_metadata'] = metadata(changed)
            rows[1]['artifact_id'] = sha256_value(_artifact_identity(rows[1]))
            write_jsonl(path, rows)
            report = verify_run(PILOT, 'frozen-non-thinking-v1', directory, model_roles=('previous',), require_complete=False)
            self.assertFalse(report['valid'])
            self.assertTrue(any('mixes execution fingerprints' in error for error in report['errors']))

    def test_original_scores_and_revision_chain_are_verifiable(self):
        history = {'left': 'fails', 'right': 'meets', 'final_left': 'meets', 'final_right': 'meets',
                   'revisions': [{'side': 'left', 'from': 'fails', 'to': 'meets', 'exposure': 'pair_seen'}]}
        self.assertTrue(validate_assessment(history, True))
        self.assertFalse(validate_assessment({**history, 'left': 'meets'}, True))
