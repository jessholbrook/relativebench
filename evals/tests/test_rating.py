import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "evals"))

from relativebench.rating import (  # noqa: E402
    create_rating_packet,
    verify_internal_session,
    verify_rating_packet,
)

PILOT = ROOT / "data/pilots/qwen2.5-to-qwen3/rehearsal-pilot.json"
EXECUTION = ROOT / "data/pilots/qwen2.5-to-qwen3/execution/full-corpus-rehearsal"
PACKET = ROOT / "data/pilots/qwen2.5-to-qwen3/rating/internal-rating-packet.json"
PUBLIC_PACKET = ROOT / "public/rating/internal-rating-packet.json"
PROFILE = "mlx-4bit-non-thinking-full-corpus-rehearsal-v1"


class RatingPacketTests(unittest.TestCase):
    def test_published_packet_is_blinded_complete_and_mirrored(self):
        report = verify_rating_packet(PACKET)

        self.assertTrue(report["valid"], report["errors"])
        self.assertEqual(report["pair_count"], 120)
        self.assertEqual(report["assignments_per_form"], {"form-a": 120, "form-b": 120})
        self.assertEqual(report["model_placement_balance"], {})
        self.assertEqual(PACKET.read_bytes(), PUBLIC_PACKET.read_bytes())

    def test_packet_generation_is_byte_reproducible_and_balanced(self):
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first_packet = Path(first_dir) / "packet.json"
            first_key = Path(first_dir) / "key.json"
            second_packet = Path(second_dir) / "packet.json"
            second_key = Path(second_dir) / "key.json"

            first = create_rating_packet(
                PILOT,
                PROFILE,
                EXECUTION,
                first_packet,
                first_key,
            )
            second = create_rating_packet(
                PILOT,
                PROFILE,
                EXECUTION,
                second_packet,
                second_key,
            )

            self.assertEqual(first_packet.read_bytes(), second_packet.read_bytes())
            self.assertEqual(first_key.read_bytes(), second_key.read_bytes())

        self.assertTrue(first["valid"], first["errors"])
        self.assertEqual(first, second)
        self.assertEqual(
            first["model_placement_balance"],
            {
                "form-a": {"new_on_left": 60, "previous_on_left": 60},
                "form-b": {"new_on_left": 60, "previous_on_left": 60},
            },
        )

    def test_public_packet_rejects_identity_fields(self):
        packet = json.loads(PACKET.read_text())
        packet["pairs"][0]["model_role"] = "new"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "tampered.json"
            path.write_text(json.dumps(packet))
            report = verify_rating_packet(path)

        self.assertFalse(report["valid"])
        self.assertTrue(any("forbidden fields" in error for error in report["errors"]))

    def test_complete_blinded_session_validates_without_aggregation(self):
        packet = json.loads(PACKET.read_text())
        pair_by_id = {item["pair_id"]: item for item in packet["pairs"]}
        form = next(item for item in packet["forms"] if item["form_id"] == "form-a")
        judgments = []
        for assignment in form["assignments"]:
            pair = pair_by_id[assignment["pair_id"]]
            judgments.append(
                {
                    "assignment_id": assignment["assignment_id"],
                    "pair_id": pair["pair_id"],
                    "scenario_id": pair["scenario_id"],
                    "category": pair["category"],
                    "pointwise_left": "meets",
                    "pointwise_right": "meets",
                    "side_preference": 0,
                    "reason_tags": [],
                    "duration_ms": 1,
                }
            )
        session = {
            "session_version": "0.1.0",
            "session_type": "internal_interface_pilot",
            "packet_id": packet["packet_id"],
            "form_id": "form-a",
            "reviewer_code_sha256": "a" * 64,
            "started_at": "2026-08-29T00:00:00Z",
            "exported_at": "2026-08-29T01:00:00Z",
            "completed_assignment_count": len(judgments),
            "judgments": judgments,
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "session.json"
            path.write_text(json.dumps(session))
            report = verify_internal_session(PACKET, path, require_complete=True)

        self.assertTrue(report["valid"], report["errors"])
        self.assertTrue(report["complete"])
        self.assertFalse(report["aggregate_preference_calculated"])


if __name__ == "__main__":
    unittest.main()
