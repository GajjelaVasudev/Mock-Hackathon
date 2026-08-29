"""Test Suite for BNHS Engagement Analysis Module (Phase 5).
Tests all metrics: Participation volume, completion rate, category/type distributions,
frequency, recency, trend analysis, composite scoring, level thresholds, and platform analytics.
"""

import unittest
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.services.engagement_service import EngagementService


class TestBNHSEngagementAnalysis(unittest.TestCase):
    """Integration and unit tests for EngagementService and FastAPI endpoints."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.service = EngagementService()

    def test_user_with_no_activity(self):
        """Validates that a new user with zero activities returns clean 0.0 scores without crashing."""
        user_id = f"test_zero_user_{uuid.uuid4().hex[:6]}"
        report = self.service.analyze_user_engagement(user_id)

        self.assertEqual(report.user_id, user_id)
        self.assertEqual(report.summary.total_participations, 0)
        self.assertEqual(report.summary.total_registrations, 0)
        self.assertEqual(report.summary.completion_rate, 0.0)
        self.assertEqual(report.summary.engagement_score, 0.0)
        self.assertEqual(report.summary.engagement_level, "LOW")
        self.assertEqual(report.journey.current_stage, "Nature Curious")
        self.assertGreaterEqual(len(report.insights), 1)

    def test_user_with_single_participation(self):
        """Validates engagement analysis for a user with one recorded activity."""
        user_id = f"test_single_user_{uuid.uuid4().hex[:6]}"
        
        # Create user
        self.client.post("/api/v1/users", json={
            "username": user_id,
            "name": "Kiran Kumar",
            "interests": ["birds"],
        })

        # Record 1 participation
        self.client.post(f"/api/v1/users/{user_id}/participation", json={
            "activity_id": "bnhs_flamingo_watch_chanakya",
            "activity_name": "Flamingo Watch at TS Chanakya",
            "date": "2026-08-10",
        })

        # Get engagement via API endpoint
        response = self.client.get(f"/api/v1/users/{user_id}/engagement")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["summary"]["total_participations"], 1)
        self.assertEqual(data["journey"]["current_stage"], "Nature Explorer")
        self.assertGreater(data["summary"]["engagement_score"], 0.0)
        self.assertEqual(len(data["category_distribution"]), 1)
        self.assertEqual(data["category_distribution"][0]["percentage"], 100.0)

    def test_user_with_multiple_participations_and_completion_rate(self):
        """Validates complex multi-category history, completion rate, and high engagement score."""
        user_id = f"test_multi_user_{uuid.uuid4().hex[:6]}"
        
        # 1. Create User
        self.client.post("/api/v1/users", json={
            "username": user_id,
            "name": "Sunita Rao",
            "interests": ["birds", "herpetology", "botany", "volunteering"],
        })

        # 2. Register for 4 events
        for act_id in [
            "bnhs_flamingo_watch_chanakya",
            "bnhs_matheran_herpetofauna_camp",
            "bnhs_cec_monsoon_flora_walk",
            "bnhs_bird_ringing_digitisation",
        ]:
            self.client.post("/api/v1/registrations", json={"user_id": user_id, "activity_id": act_id})

        # 3. Record participation in 3 of them
        dates = ["2026-06-01", "2026-07-15", "2026-08-20"]
        acts = [
            ("bnhs_flamingo_watch_chanakya", "Flamingo Watch at TS Chanakya"),
            ("bnhs_matheran_herpetofauna_camp", "Matheran Herpetofauna Camp"),
            ("bnhs_bird_ringing_digitisation", "AI Bird-Ringing Digitisation"),
        ]
        for i in range(3):
            self.client.post(f"/api/v1/users/{user_id}/participation", json={
                "activity_id": acts[i][0],
                "activity_name": acts[i][1],
                "date": dates[i],
            })

        # 4. Fetch Engagement Report
        res = self.client.get(f"/api/v1/users/{user_id}/engagement")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Check metrics
        summary = data["summary"]
        self.assertEqual(summary["total_registrations"], 4)
        self.assertEqual(summary["total_participations"], 3)
        self.assertEqual(summary["completion_rate"], 75.0)  # 3/4 * 100
        self.assertIn(summary["engagement_level"], ["HIGH", "VERY_HIGH"])
        self.assertEqual(data["journey"]["current_stage"], "Field Naturalist")

        # Check type distribution includes walk, camp, volunteer
        types = {t["type"] for t in data["type_distribution"]}
        self.assertTrue("camp" in types or "volunteer" in types or "walk" in types)

        # Check recency
        self.assertIsNotNone(data["recent_activity"])
        self.assertEqual(data["recent_activity"]["date"], "2026-08-20")

        # Check insights contain interest alignment & completion
        insights_text = " ".join(data["insights"])
        self.assertIn("75.0%", insights_text)

    def test_platform_engagement_endpoint(self):
        """Validates GET /api/v1/analytics/engagement returns aggregate platform statistics."""
        response = self.client.get("/api/v1/analytics/engagement")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("total_users", data)
        self.assertIn("total_registrations", data)
        self.assertIn("total_participations", data)
        self.assertIn("completion_rate", data)
        self.assertIn("most_popular_categories", data)
        self.assertIn("most_popular_activity_types", data)
        self.assertIn("engagement_distribution", data)

        # Validate tier keys
        dist = data["engagement_distribution"]
        for tier in ["LOW", "MODERATE", "HIGH", "VERY_HIGH"]:
            self.assertIn(tier, dist)


if __name__ == "__main__":
    unittest.main()
