"""Platform-wide Analytics Router.
Exposes aggregate engagement statistics across all BNHS members and activity domains.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas import PlatformEngagementResponse
from app.services.engagement_service import engagement_service

router = APIRouter(prefix="/api/v1/analytics", tags=["Platform Analytics"])


@router.get(
    "/engagement",
    response_model=PlatformEngagementResponse,
    summary="Get Platform Engagement Analytics",
    description="Retrieves aggregate metrics across all members, popular categories, activity format distributions, and member tier distributions.",
)
async def get_platform_engagement() -> PlatformEngagementResponse:
    """Returns platform-wide engagement metrics."""
    try:
        return engagement_service.get_platform_engagement()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate platform engagement analytics: {str(e)}",
        )
