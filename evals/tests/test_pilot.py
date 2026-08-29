import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "evals"))

from relativebench.adapters import DryRunAdapter  # noqa: E402
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


if __name__ == "__main__":
    unittest.main()
