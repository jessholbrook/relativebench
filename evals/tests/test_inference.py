import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "evals"))

from relativebench.inference import bootstrap_experience, weighted_experience  # noqa: E402


class InferenceTests(unittest.TestCase):
    def test_protocol_weights_prevent_dense_scenarios_from_dominating(self):
        judgments = [
            {
                "category": "reasoning",
                "scenario_id": "dense",
                "evaluator_id": f"evaluator-{index}",
                "rating": 2,
            }
            for index in range(10)
        ]
        judgments.append(
            {
                "category": "reasoning",
                "scenario_id": "sparse",
                "evaluator_id": "evaluator-0",
                "rating": -2,
            }
        )

        summary = weighted_experience(judgments)
        self.assertAlmostEqual(summary["experience_delta"], 0)

    def test_equal_category_weighting(self):
        judgments = [
            {"category": "reasoning", "scenario_id": "r1", "evaluator_id": "e1", "rating": 2},
            {"category": "coding", "scenario_id": "c1", "evaluator_id": "e1", "rating": -2},
            {"category": "coding", "scenario_id": "c2", "evaluator_id": "e2", "rating": -2},
        ]
        self.assertAlmostEqual(weighted_experience(judgments)["experience_delta"], 0)

    def test_cluster_bootstrap_is_reproducible(self):
        judgments = []
        for category in ("reasoning", "coding"):
            for scenario in ("one", "two"):
                for evaluator in ("a", "b", "c"):
                    judgments.append(
                        {
                            "category": category,
                            "scenario_id": f"{category}-{scenario}",
                            "evaluator_id": evaluator,
                            "rating": 1,
                        }
                    )

        first = bootstrap_experience(judgments, replicates=200, seed=17)
        second = bootstrap_experience(judgments, replicates=200, seed=17)
        self.assertEqual(first, second)
        self.assertEqual(first["experience_delta"], 50)
        self.assertEqual(first["confidence_interval"]["lower"], 50)
        self.assertEqual(first["confidence_interval"]["upper"], 50)
        self.assertEqual(first["bootstrap"]["scenario_clusters"], 4)
        self.assertEqual(first["bootstrap"]["evaluator_clusters"], 3)

    def test_bootstrap_rejects_too_few_replicates(self):
        judgments = [
            {"category": "reasoning", "scenario_id": "r1", "evaluator_id": "e1", "rating": 0}
        ]
        with self.assertRaisesRegex(ValueError, "At least 100"):
            bootstrap_experience(judgments, replicates=99)


if __name__ == "__main__":
    unittest.main()
