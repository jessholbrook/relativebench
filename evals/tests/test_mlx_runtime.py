import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "evals"))

from relativebench.adapters.mlx import MlxAdapter  # noqa: E402
from relativebench.artifacts import sha256_file, sha256_value  # noqa: E402
from relativebench.mlx_runtime import load_provenance, model_file_hashes  # noqa: E402


class MlxRuntimeTests(unittest.TestCase):
    def test_model_hashes_are_stable_and_exclude_provenance(self):
        with tempfile.TemporaryDirectory() as directory:
            model_dir = Path(directory)
            (model_dir / "config.json").write_text('{"model_type":"qwen"}\n')
            (model_dir / "model.safetensors").write_bytes(b"weights")
            (model_dir / "relativebench-provenance.json").write_text("{}\n")

            first = model_file_hashes(model_dir)
            second = model_file_hashes(model_dir)

        self.assertEqual(first, second)
        self.assertEqual(set(first), {"config.json", "model.safetensors"})

    def test_load_provenance_requires_explicit_file(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, "missing relativebench-provenance"):
                load_provenance(directory)

    def test_adapter_checks_provenance_before_importing_mlx(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, "missing relativebench-provenance"):
                MlxAdapter(directory)

    def test_provenance_can_be_read_without_mlx_runtime(self):
        record = {"source_revision": "a" * 40}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "relativebench-provenance.json"
            path.write_text(json.dumps(record))
            self.assertEqual(load_provenance(directory), record)

    def test_adapter_rejects_tampered_model_before_loading_mlx(self):
        with tempfile.TemporaryDirectory() as directory:
            model_dir = Path(directory)
            (model_dir / "model.safetensors").write_bytes(b"changed")
            (model_dir / "relativebench-provenance.json").write_text(
                json.dumps({"files": {"model.safetensors": "0" * 64}})
            )
            with self.assertRaisesRegex(ValueError, "do not match recorded provenance"):
                MlxAdapter(model_dir)

    def test_published_smoke_artifacts_are_internally_consistent(self):
        execution = ROOT / "data/pilots/qwen2.5-to-qwen3/execution"
        summary = json.loads((execution / "smoke-run-summary.json").read_text())
        for role in ("previous", "new"):
            run_dir = execution / "smoke-runs" / role
            response_path = run_dir / "responses.jsonl"
            manifest = json.loads((run_dir / "run-manifest.json").read_text())
            responses = [json.loads(line) for line in response_path.read_text().splitlines()]

            self.assertEqual(len(responses), 12)
            self.assertTrue(all(item["status"] == "ok" for item in responses))
            self.assertEqual(sha256_file(response_path), manifest["responses_sha256"])
            self.assertEqual(
                sha256_value(sorted(item["artifact_id"] for item in responses)),
                manifest["artifact_set_sha256"],
            )
            self.assertEqual(
                manifest["artifact_set_sha256"],
                summary["models"][role]["independent_rerun_artifact_set_sha256"],
            )

        new_responses = [
            json.loads(line)
            for line in (execution / "smoke-runs/new/responses.jsonl").read_text().splitlines()
        ]
        self.assertFalse(any("<think>" in item["response_text"] for item in new_responses))


if __name__ == "__main__":
    unittest.main()
