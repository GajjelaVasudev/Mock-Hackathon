"""Recommendation Router for BNHS Activities with MongoDB Integration.
Exposes POST /api/v1/recommend supporting dynamic user_id lookup or direct profile payload.
"""

from fastapi import APIRouter, HTTPException, Query, status
from app.schemas import Recommendation, RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/api/v1", tags=["Recommendations"])
rec_service = RecommendationService()


@router.post(
    "/recommend",
    response_model=RecommendationResponse,
    summary="Get Personalized Activity Recommendations",
    description="Generates top-N ranked and explained BNHS activity recommendations based on MongoDB user_id or direct profile payload.",
)
async def get_recommendations(
    request: RecommendationRequest,
    top_n: int = Query(default=5, ge=1, le=20, description="Number of recommendations to return"),
) -> RecommendationResponse:
    """Computes personalized recommendations using content-based & rule-based weighted scoring."""
    try:
        profile_dict = {k: v for k, v in request.model_dump().items() if v is not None}
        raw_results = rec_service.recommend(profile_dict, top_n=top_n)

        recommendations = []
        for item in raw_results:
            recommendations.append(
                Recommendation(
                    activity_id=item.get("activity_id"),
                    activity=item.get("activity_name") or item.get("activity", "Unknown Activity"),
                    category=item.get("category"),
                    location=item.get("location"),
                    type=item.get("type"),
                    difficulty=item.get("difficulty"),
                    duration=item.get("duration"),
                    distance=item.get("distance"),
                    description=item.get("description"),
                    image=item.get("image"),
                    imageUrl=item.get("imageUrl"),
                    score=item.get("score", 0.0),
                    reasons=item.get("reasons", []),
                )
            )

        return RecommendationResponse(
            user_id=request.user_id,
            recommendations=recommendations,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing recommendations: {str(e)}",
        )
