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
from relativebench.runner import run_pilot  # noqa: E402

PILOT = ROOT / "data/pilots/qwen2.5-to-qwen3/pilot.json"


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


if __name__ == "__main__":
    unittest.main()
