import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "evals"))

from relativebench.metrics import (  # noqa: E402
    classify_transition,
    summarize_experience,
    summarize_flips,
)


class MetricTests(unittest.TestCase):
    def test_experience_delta_range(self):
        self.assertEqual(summarize_experience([{"rating": 2}])["experience_delta"], 100)
        self.assertEqual(summarize_experience([{"rating": -2}])["experience_delta"], -100)

    def test_weighted_experience(self):
        summary = summarize_experience([
            {"rating": 2, "weight": 1},
            {"rating": -1, "weight": 2},
        ])
        self.assertEqual(summary["experience_delta"], 0)
        self.assertAlmostEqual(summary["preference_lift"], -100 / 3)

    def test_flip_rates(self):
        summary = summarize_flips([
            {"previous_passed": True, "new_passed": True},
            {"previous_passed": True, "new_passed": False},
            {"previous_passed": False, "new_passed": True},
            {"previous_passed": False, "new_passed": False},
        ])
        self.assertEqual(summary["negative_flip_rate"], 0.5)
        self.assertEqual(summary["positive_flip_rate"], 0.5)

    def test_classification(self):
        self.assertEqual(classify_transition(6, 16), "upgrade")
        self.assertEqual(classify_transition(-16, -6), "regression")
        self.assertEqual(classify_transition(-4, 4), "sidegrade")
        self.assertEqual(classify_transition(2, 9), "inconclusive")

    def test_example_catalog_references_are_valid(self):
        catalog = json.loads((ROOT / "data/catalog/catalog.json").read_text())
        model_ids = {model["id"] for model in catalog["models"]}
        for transition in catalog["transitions"]:
            self.assertIn(transition["previous_model_id"], model_ids)
            self.assertIn(transition["new_model_id"], model_ids)
            self.assertNotEqual(transition["previous_model_id"], transition["new_model_id"])

    def test_python_calculations_match_shared_cross_language_fixtures(self):
        fixtures = json.loads((ROOT / "data/fixtures/metric-cases.json").read_text())
        for fixture in fixtures["experience"]:
            summary = summarize_experience(fixture["judgments"])
            self.assertEqual(summary["experience_delta"], fixture["expected_delta"], fixture["name"])
            self.assertEqual(summary["preference_lift"], fixture["expected_preference_lift"], fixture["name"])
        for fixture in fixtures["flips"]:
            summary = summarize_flips(fixture["pairs"])
            self.assertEqual(summary["negative_flip_rate"], fixture["expected_negative_flip_rate"], fixture["name"])
            self.assertEqual(summary["positive_flip_rate"], fixture["expected_positive_flip_rate"], fixture["name"])

    def test_snapshot_contract_invariants(self):
        snapshot = json.loads((ROOT / "data/snapshots/example-transition.json").read_text())
        transition_ids = {
            transition["id"]
            for transition in json.loads((ROOT / "data/catalog/catalog.json").read_text())["transitions"]
        }
        self.assertIn(snapshot["transition_id"], transition_ids)
        interval = snapshot["experience"]["confidence_interval"]
        self.assertLessEqual(interval["lower"], snapshot["experience"]["delta"])
        self.assertLessEqual(snapshot["experience"]["delta"], interval["upper"])
        self.assertEqual(sum(snapshot["experience"]["distribution_percent"].values()), 100)

    def test_schema_documents_parse(self):
        for schema_path in (ROOT / "schemas").glob("*.schema.json"):
            schema = json.loads(schema_path.read_text())
            self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
            self.assertIn("title", schema)


if __name__ == "__main__":
    unittest.main()
