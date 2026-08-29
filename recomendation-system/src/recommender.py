"""BNHS Recommendation Engine Module.
Orchestrates candidate filtering, multi-factor scoring, ranking, and top-N recommendations.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

from src.activities_catalog import ActivitiesCatalog, Activity
from src.scoring import DEFAULT_WEIGHTS, ScoringWeights, calculate_match_score
from src.user_profile import UserProfile


@dataclass
class RecommendationResult:
    """Represents a scored and explained recommendation item."""
    activity: Activity
    score: float
    reasons: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "activity_id": self.activity.id,
            "activity_name": self.activity.name,
            "category": self.activity.category,
            "location": self.activity.location,
            "type": self.activity.type,
            "difficulty": self.activity.difficulty,
            "duration": self.activity.duration,
            "distance": self.activity.distance,
            "description": self.activity.description,
            "score": self.score,
            "reasons": self.reasons,
        }


class BNHSRecommender:
    """Core Recommendation Engine for BNHS activities."""

    def __init__(
        self,
        catalog: Optional[ActivitiesCatalog] = None,
        weights: ScoringWeights = DEFAULT_WEIGHTS,
    ):
        self.catalog = catalog or ActivitiesCatalog()
        self.weights = weights

    def recommend(
        self,
        user_profile: UserProfile,
        top_n: int = 5,
        location_filter: Optional[str] = None,
        type_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
    ) -> List[RecommendationResult]:
        """Generates ranked and explained recommendations for a user profile.
        
        Args:
            user_profile: Target user profile.
            top_n: Number of top recommendations to return (default 5).
            location_filter: Optional strict filter by location.
            type_filter: Optional strict filter by activity type.
            category_filter: Optional strict filter by category.
            
        Returns:
            List of RecommendationResult objects sorted descending by score.
        """
        # Step 1: Candidate retrieval (with optional pre-filtering)
        candidates = self.catalog.get_all()

        if location_filter:
            loc_f = location_filter.lower()
            candidates = [c for c in candidates if loc_f in c.location.lower()]

        if type_filter:
            t_f = type_filter.lower()
            candidates = [c for c in candidates if c.type.lower() == t_f]

        if category_filter:
            c_f = category_filter.lower()
            candidates = [c for c in candidates if c_f in c.category.lower()]

        # If strict filtering produced empty results, fall back to full catalog
        if not candidates:
            candidates = self.catalog.get_all()

        # Step 2: Scoring and explanation generation
        scored_results: List[RecommendationResult] = []

        for activity in candidates:
            score, reasons = calculate_match_score(
                activity=activity,
                user_profile=user_profile,
                weights=self.weights,
            )
            scored_results.append(
                RecommendationResult(
                    activity=activity,
                    score=score,
                    reasons=reasons,
                )
            )

        # Step 3: Ranking (descending score)
        scored_results.sort(key=lambda r: r.score, reverse=True)

        # Step 4: Top-N return
        return scored_results[:top_n]

    def recommend_for_dict(
        self,
        profile_data: Dict[str, Any],
        top_n: int = 5,
    ) -> List[Dict[str, Any]]:
        """Convenience method for FastAPI and JSON API compatibility."""
        profile = UserProfile.from_dict(profile_data)
        results = self.recommend(profile, top_n=top_n)
        return [r.to_dict() for r in results]


def recommend(
    user_profile: Union[UserProfile, Dict[str, Any]],
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """Master functional entry point for future FastAPI / REST service integration."""
    recommender = BNHSRecommender()
    if isinstance(user_profile, dict):
        return recommender.recommend_for_dict(user_profile, top_n=top_n)
    else:
        results = recommender.recommend(user_profile, top_n=top_n)
        return [r.to_dict() for r in results]
