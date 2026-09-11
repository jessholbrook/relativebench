import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'evals'))

from relativebench.adapters.base import GenerationRequest
from relativebench.adapters.bf16 import generation_options, verify_snapshot
from relativebench.artifacts import sha256_file


class Bf16ContractTests(unittest.TestCase):
    def test_frozen_sampling_options(self):
        request = GenerationRequest('m', 'r', 'a'*40, 's', 'system', 'prompt', 11, 1024, .7, .8, 20, 0)
        options = generation_options(request)
        self.assertEqual(options['max_new_tokens'], 1024)
        self.assertEqual(options['top_k'], 20)
        self.assertEqual(options['repetition_penalty'], 1)

    def test_snapshot_pins_inventory_and_quantization_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'config.json').write_text('{}')
            (root / 'model.safetensors').write_bytes(b'contract-test-only-not-model-weights')
            expected = {'repository': 'r', 'revision': 'a'*40}
            metadata = {**expected, 'weight_format': 'bfloat16',
                        'files': {name: sha256_file(root / name) for name in ('config.json', 'model.safetensors')}}
            (root / 'relativebench-snapshot.json').write_text(json.dumps(metadata))
            self.assertEqual(verify_snapshot(root, expected), metadata)
            with self.assertRaises(ValueError):
                verify_snapshot(root, {**expected, 'revision': 'b'*40})
            (root / 'model.safetensors').write_bytes(b'changed')
            with self.assertRaises(ValueError):
                verify_snapshot(root, expected)
            (root / 'extra.json').write_text('{}')
            with self.assertRaises(ValueError):
                verify_snapshot(root, expected)
