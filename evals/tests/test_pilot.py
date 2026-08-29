import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "evals"))

from relativebench.adapters import DryRunAdapter  # noqa: E402
from relativebench.adapters.base import GenerationResult  # noqa: E402
from relativebench.manifest import validate_pilot  # noqa: E402
from relativebench.runner import run_pilot, verify_run  # noqa: E402

PILOT = ROOT / "data/pilots/qwen2.5-to-qwen3/pilot.json"
SMOKE_PILOT = ROOT / "data/pilots/qwen2.5-to-qwen3/smoke-pilot.json"


class PilotTests(unittest.TestCase):
    def test_selected_pilot_has_reviewed_balanced_manifest(self):
        validation = validate_pilot(PILOT)
        self.assertTrue(validation["valid"], validation["errors"])
        self.assertEqual(validation["scenario_count"], 120)
        self.assertEqual(set(validation["category_counts"].values()), {20})
        self.assertEqual(validation["warnings"], [])

    def test_pilot_uses_pinned_catalog_revisions(self):
        validation = validate_pilot(PILOT)
        models = validation["pilot"]["models"]
        self.assertEqual(models["previous"]["revision"], "a09a35458c702b33eeacc393d103063234e8bc28")
        self.assertEqual(models["new"]["revision"], "b968826d9c46dd6066d109eabc6255188de91218")

    def test_dry_run_is_complete_and_byte_reproducible(self):
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first = run_pilot(PILOT, "frozen-non-thinking-v1", first_dir, DryRunAdapter())
            second = run_pilot(PILOT, "frozen-non-thinking-v1", second_dir, DryRunAdapter())

            self.assertEqual(first, second)
            self.assertEqual(first["artifact_count"], 720)
            self.assertEqual(first["artifacts_by_model_role"], {"new": 360, "previous": 360})
            self.assertEqual(first["scenario_count"], 120)

            records = [
                json.loads(line)
                for line in (Path(first_dir) / "responses.jsonl").read_text().splitlines()
            ]
            self.assertEqual(len({record["artifact_id"] for record in records}), 720)
            self.assertTrue(all(record["adapter"] == "dry-run" for record in records))

    def test_unknown_profile_fails_closed(self):
        with tempfile.TemporaryDirectory() as output_dir:
            with self.assertRaisesRegex(ValueError, "Unknown execution profile"):
                run_pilot(PILOT, "missing", output_dir, DryRunAdapter())

    def test_runner_can_execute_one_model_role_for_sequential_hardware(self):
        with tempfile.TemporaryDirectory() as output_dir:
            result = run_pilot(
                PILOT,
                "frozen-non-thinking-v1",
                output_dir,
                DryRunAdapter(),
                model_roles=("previous",),
            )
        self.assertEqual(result["artifact_count"], 360)
        self.assertEqual(result["artifacts_by_model_role"], {"previous": 360})
        self.assertEqual(result["model_roles"], ["previous"])

    def test_runner_rejects_unknown_model_role(self):
        with tempfile.TemporaryDirectory() as output_dir:
            with self.assertRaisesRegex(ValueError, "Unknown model roles"):
                run_pilot(
                    PILOT,
                    "frozen-non-thinking-v1",
                    output_dir,
                    DryRunAdapter(),
                    model_roles=("candidate",),
                )

    def test_artifact_set_identity_excludes_latency_telemetry(self):
        class TimedAdapter:
            name = "timed-test"

            def __init__(self, latency_ms):
                self.latency_ms = latency_ms

            def generate(self, request):
                return GenerationResult(text="stable", latency_ms=self.latency_ms)

        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first = run_pilot(
                PILOT,
                "frozen-non-thinking-v1",
                first_dir,
                TimedAdapter(10),
                model_roles=("previous",),
            )
            second = run_pilot(
                PILOT,
                "frozen-non-thinking-v1",
                second_dir,
                TimedAdapter(20),
                model_roles=("previous",),
            )

        self.assertNotEqual(first["responses_sha256"], second["responses_sha256"])
        self.assertEqual(first["artifact_set_sha256"], second["artifact_set_sha256"])

    def test_interrupted_run_resumes_without_duplicate_artifacts(self):
        class InterruptibleAdapter:
            name = "interruptible-test"

            def __init__(self, fail_after=None):
                self.fail_after = fail_after
                self.calls = 0

            def generate(self, request):
                self.calls += 1
                if self.fail_after is not None and self.calls > self.fail_after:
                    raise RuntimeError("simulated interruption")
                return GenerationResult(text=f"stable::{request.scenario_id}::{request.seed}")

        with tempfile.TemporaryDirectory() as output_dir:
            with self.assertRaisesRegex(RuntimeError, "simulated interruption"):
                run_pilot(
                    SMOKE_PILOT,
                    "mlx-4bit-non-thinking-smoke-v1",
                    output_dir,
                    InterruptibleAdapter(fail_after=5),
                    model_roles=("previous",),
                )

            partial = verify_run(
                SMOKE_PILOT,
                "mlx-4bit-non-thinking-smoke-v1",
                output_dir,
                model_roles=("previous",),
                require_complete=False,
            )
            self.assertTrue(partial["valid"], partial["errors"])
            self.assertFalse(partial["complete"])
            self.assertEqual(partial["artifact_count"], 5)

            completed = run_pilot(
                SMOKE_PILOT,
                "mlx-4bit-non-thinking-smoke-v1",
                output_dir,
                InterruptibleAdapter(),
                model_roles=("previous",),
                resume=True,
            )
            self.assertEqual(completed["artifact_count"], 12)
            records = [
                json.loads(line)
                for line in (Path(output_dir) / "responses.jsonl").read_text().splitlines()
            ]
            self.assertEqual(len({record["artifact_id"] for record in records}), 12)

    def test_independent_verifier_rejects_response_tampering(self):
        with tempfile.TemporaryDirectory() as output_dir:
            run_pilot(
                SMOKE_PILOT,
                "mlx-4bit-non-thinking-smoke-v1",
                output_dir,
                DryRunAdapter(),
                model_roles=("new",),
            )
            response_path = Path(output_dir) / "responses.jsonl"
            records = [json.loads(line) for line in response_path.read_text().splitlines()]
            records[0]["response_text"] = "tampered"
            response_path.write_text("\n".join(json.dumps(item) for item in records) + "\n")

            report = verify_run(
                SMOKE_PILOT,
                "mlx-4bit-non-thinking-smoke-v1",
                output_dir,
                model_roles=("new",),
            )

        self.assertFalse(report["valid"])
        self.assertTrue(any("response hash" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
