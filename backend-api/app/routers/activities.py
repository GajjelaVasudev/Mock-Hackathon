"""Activities Router for BNHS Activity Catalog.
Exposes GET /api/v1/activities backed by MongoDB with local fallback.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas import ActivitiesResponse, Activity
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/api/v1", tags=["Activities Catalog"])
rec_service = RecommendationService()


@router.get(
    "/activities",
    response_model=ActivitiesResponse,
    summary="Get BNHS Activities Catalog",
    description="Retrieves the structured BNHS activity catalog from MongoDB (or local fallback) with optional filtering by category, location, difficulty, and type.",
)
async def list_activities(
    category: Optional[str] = Query(default=None, description="Filter by category substring (e.g. 'bird', 'tree', 'camp')"),
    location: Optional[str] = Query(default=None, description="Filter by location (e.g. 'Mumbai', 'Navi Mumbai', 'Pune', 'Delhi')"),
    difficulty: Optional[str] = Query(default=None, description="Filter by difficulty (e.g. 'easy', 'intermediate', 'moderate')"),
    type: Optional[str] = Query(default=None, description="Filter by activity type ('walk', 'camp', 'course', 'volunteer')"),
) -> ActivitiesResponse:
    """Returns the list of authentic BNHS activities matching the filter criteria."""
    try:
        catalog_result = rec_service.get_activities(
            category=category,
            location=location,
            difficulty=difficulty,
            activity_type=type,
        )

        activities = [Activity(**a) for a in catalog_result.get("activities", [])]

        return ActivitiesResponse(
            count=len(activities),
            source=catalog_result.get("source", "mongodb"),
            activities=activities,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching activities: {str(e)}",
        )


@router.get(
    "/activities/{activity_id}",
    response_model=Activity,
    summary="Get BNHS Activity by ID",
    description="Retrieves full structured details for an activity by its slug ID or MongoDB identifier.",
)
async def get_activity_detail(activity_id: str) -> Activity:
    """Returns single activity matching the provided identifier."""
    activity_dict = rec_service.get_activity_by_id(activity_id)
    if not activity_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activity with ID '{activity_id}' not found.",
        )
    return Activity(**activity_dict)
