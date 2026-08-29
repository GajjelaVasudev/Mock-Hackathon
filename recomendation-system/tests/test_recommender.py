"""Unit Test Suite for BNHS Recommendation Engine.
Validates dataset loading, profile models, scoring logic, ranking, explanations,
and previous participation penalties.
"""

import unittest
from pathlib import Path
import sys

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.activities_catalog import ActivitiesCatalog, Activity
from src.recommender import BNHSRecommender, RecommendationResult, recommend
from src.scoring import ScoringWeights, calculate_match_score
from src.user_profile import DEMO_PROFILES, UserProfile


class TestBNHSRecommender(unittest.TestCase):
    """Test suite covering all components of the BNHS recommendation system."""

    def setUp(self):
        self.catalog = ActivitiesCatalog()
        self.recommender = BNHSRecommender(catalog=self.catalog)

    def test_activity_loading(self):
        """Validates that activities are loaded properly from JSON with valid fields."""
        activities = self.catalog.get_all()
        self.assertGreaterEqual(len(activities), 15, "Catalog should have at least 15 BNHS activities.")

        for act in activities:
            self.assertTrue(act.id, "Activity must have a valid ID")
            self.assertTrue(act.name, "Activity must have a name")
            self.assertTrue(act.location, "Activity must have a location")
            self.assertIn(act.type, ["walk", "camp", "course", "volunteer"], "Activity type must be valid")
            self.assertIsInstance(act.interests, list, "Interests must be a list")

    def test_user_profile_creation(self):
        """Validates UserProfile serialization and deserialization."""
        user_dict = {
            "name": "Test User",
            "age_group": "student",
            "location": "Mumbai",
            "interests": ["birds", "photography"],
            "experience_level": "beginner",
            "preferred_activity_type": "walk",
            "previous_activities": [],
        }
        profile = UserProfile.from_dict(user_dict)
        self.assertEqual(profile.name, "Test User")
        self.assertEqual(profile.interests, ["birds", "photography"])
        self.assertEqual(profile.to_dict()["location"], "Mumbai")

    def test_all_demo_profiles_exist(self):
        """Ensures all 5 demo profiles (A through E) are properly defined."""
        for key in ["A", "B", "C", "D", "E"]:
            self.assertIn(key, DEMO_PROFILES)
            profile = DEMO_PROFILES[key]
            self.assertIsInstance(profile, UserProfile)
            self.assertTrue(len(profile.interests) > 0)

    def test_interest_matching(self):
        """Ensures birdwatcher profile ranks bird activities higher than tree/herpetology walks."""
        bird_user = UserProfile(
            name="Bird Lover",
            location="Mumbai",
            interests=["birds", "birdwatching", "flamingos"],
            preferred_activity_type="walk",
        )
        results = self.recommender.recommend(bird_user, top_n=5)
        top_activity = results[0].activity

        # Top activity should be bird or flamingo related
        self.assertTrue(
            any(k in top_activity.name.lower() or k in [i.lower() for i in top_activity.interests]
                for k in ["bird", "flamingo", "wetland"]),
            f"Expected bird activity at top, got {top_activity.name}"
        )
        self.assertGreaterEqual(results[0].score, 70.0)

    def test_location_matching(self):
        """Ensures Delhi user gets Delhi activities prioritized."""
        delhi_user = UserProfile(
            name="Delhi Explorer",
            location="Delhi",
            interests=["butterflies", "birds", "nature walks"],
            preferred_activity_type="walk",
        )
        results = self.recommender.recommend(delhi_user, top_n=3)
        top_activity = results[0].activity

        self.assertEqual(top_activity.location, "Delhi")
        self.assertIn("Delhi", results[0].reasons[1] if len(results[0].reasons) > 1 else results[0].reasons[0])

    def test_activity_type_preference(self):
        """Ensures camp preference prioritizes field camps."""
        camp_user = UserProfile(
            name="Camp Enthusiast",
            location="Maharashtra",
            interests=["reptiles", "amphibians", "herpetology"],
            preferred_activity_type="camp",
        )
        results = self.recommender.recommend(camp_user, top_n=3)
        top_act = results[0].activity

        self.assertEqual(top_act.type, "camp")
        self.assertIn("camp", top_act.name.lower())

    def test_ranking_and_top_5_output(self):
        """Verifies that results are sorted in descending order of score and capped at 5."""
        user = DEMO_PROFILES["A"]
        results = self.recommender.recommend(user, top_n=5)

        self.assertEqual(len(results), 5)
        for i in range(len(results) - 1):
            self.assertGreaterEqual(results[i].score, results[i + 1].score, "Results must be strictly sorted by score")

    def test_explanation_generation(self):
        """Ensures all recommendations include explainable reasons."""
        user = DEMO_PROFILES["B"]
        results = self.recommender.recommend(user, top_n=5)

        for res in results:
            self.assertIsInstance(res.reasons, list)
            self.assertGreater(len(res.reasons), 0, "Must provide at least one explanation reason")
            # Should have reasons containing keywords like matches, located, suitable, etc.
            all_reasons_str = " ".join(res.reasons).lower()
            self.assertTrue(any(w in all_reasons_str for w in ["match", "located", "level", "format", "ideal", "fresh"]))

    def test_previous_participation_penalty(self):
        """Ensures an activity previously attended receives a penalty and ranks below fresh alternatives."""
        profile_without_history = UserProfile(
            name="Aarav Fresh",
            location="Navi Mumbai",
            interests=["birds", "flamingos", "wetlands"],
            preferred_activity_type="walk",
            previous_activities=[],
        )
        profile_with_history = UserProfile(
            name="Aarav Returnee",
            location="Navi Mumbai",
            interests=["birds", "flamingos", "wetlands"],
            preferred_activity_type="walk",
            previous_activities=["Flamingo Watch at TS Chanakya"],
        )

        results_fresh = self.recommender.recommend(profile_without_history, top_n=5)
        results_repeat = self.recommender.recommend(profile_with_history, top_n=5)

        # In fresh results, TS Chanakya should have higher novelty score
        score_fresh = next(r.score for r in results_fresh if "Chanakya" in r.activity.name)
        score_repeat = next(r.score for r in results_repeat if "Chanakya" in r.activity.name)

        self.assertGreater(score_fresh, score_repeat, "Fresh activity must score higher than repeated activity")

    def test_empty_interests_fallback(self):
        """Ensures engine gracefully handles empty interest list without crashing."""
        blank_user = UserProfile(
            name="Blank Profile",
            location="Mumbai",
            interests=[],
            experience_level="beginner",
        )
        results = self.recommender.recommend(blank_user, top_n=5)
        self.assertEqual(len(results), 5)
        self.assertGreater(results[0].score, 0)

    def test_master_recommend_function(self):
        """Verifies the standalone recommend() functional entrypoint."""
        profile_dict = {
            "name": "API User",
            "age_group": "student",
            "location": "Mumbai",
            "interests": ["trees", "botany"],
            "experience_level": "beginner",
            "preferred_activity_type": "walk",
        }
        res = recommend(profile_dict, top_n=3)
        self.assertEqual(len(res), 3)
        self.assertIn("activity_id", res[0])
        self.assertIn("score", res[0])
        self.assertIn("reasons", res[0])


if __name__ == "__main__":
    unittest.main()
