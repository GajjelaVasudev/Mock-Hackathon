"""User Profile & Participation History Router (MongoDB users & participation_history).
Exposes CRUD endpoints for dynamic user profiles, activity history tracking, and engagement analytics.
"""

from datetime import datetime, timezone
from typing import List, Optional
import uuid
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status

from app.database.mongodb import get_db, is_mongodb_available
from app.schemas import (
    ParticipationItem,
    ParticipationRequest,
    ParticipationResponse,
    RegistrationResponse,
    UserCreateRequest,
    UserEngagementResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.services.engagement_service import engagement_service

router = APIRouter(prefix="/api/v1/users", tags=["Users & Profiles"])


def _format_user_doc(doc: dict) -> UserResponse:
    """Helper to convert MongoDB document to UserResponse Pydantic schema."""
    user_id = str(doc.get("_id", doc.get("user_id", "")))
    return UserResponse(
        id=user_id,
        username=doc.get("username"),
        name=doc.get("name") or doc.get("username", "BNHS Member"),
        email=doc.get("email"),
        age_group=doc.get("age_group", "adult"),
        location=doc.get("location", "Mumbai"),
        interests=doc.get("interests", []) or [],
        experience_level=doc.get("experience_level", "beginner"),
        preferred_activity_type=doc.get("preferred_activity_type"),
        previous_activities=doc.get("previous_activities", []) or [],
        badges=doc.get("badges", []) or [],
        created_at=str(doc.get("createdAt") or doc.get("created_at", "")),
        updated_at=str(doc.get("updatedAt") or doc.get("updated_at", "")),
    )


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create User Profile",
    description="Creates a new dynamic user profile in MongoDB for personalized activity recommendations.",
)
async def create_user(request: UserCreateRequest) -> UserResponse:
    """Creates a new user profile document in the MongoDB users collection."""
    db = get_db()
    if db is None or not is_mongodb_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB service is currently unavailable.",
        )

    users_coll = db["users"]
    now = datetime.now(timezone.utc)

    user_dict = request.model_dump()
    user_dict["createdAt"] = now
    user_dict["updatedAt"] = now
    user_dict["badges"] = []

    # Ensure unique email to respect MongoDB unique index on email_1
    if not user_dict.get("email"):
        u_name = user_dict.get("username") or f"user_{uuid.uuid4().hex[:6]}"
        user_dict["email"] = f"{u_name}@bnhs.org"

    # Check for existing username if provided
    if request.username:
        existing = users_coll.find_one({"username": request.username})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with username '{request.username}' already exists.",
            )

    result = users_coll.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id

    return _format_user_doc(user_dict)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get User Profile by ID",
    description="Retrieves a user profile from MongoDB by ObjectId, username, or custom user_id.",
)
async def get_user(user_id: str) -> UserResponse:
    """Retrieves user profile document."""
    db = get_db()
    if db is None or not is_mongodb_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB service is currently unavailable.",
        )

    users_coll = db["users"]
    user_doc = None

    if ObjectId.is_valid(user_id):
        user_doc = users_coll.find_one({"_id": ObjectId(user_id)})

    if not user_doc:
        user_doc = users_coll.find_one({
            "$or": [
                {"user_id": user_id},
                {"username": user_id},
            ]
        })

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID or username '{user_id}' not found.",
        )

    return _format_user_doc(user_doc)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update User Profile",
    description="Updates user profile fields (interests, location, experience, etc.) in MongoDB.",
)
async def update_user(user_id: str, request: UserUpdateRequest) -> UserResponse:
    """Updates an existing user profile."""
    db = get_db()
    if db is None or not is_mongodb_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB service is currently unavailable.",
        )

    users_coll = db["users"]
    query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"$or": [{"user_id": user_id}, {"username": user_id}]}

    existing = users_coll.find_one(query)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    update_fields = {k: v for k, v in request.model_dump().items() if v is not None}
    update_fields["updatedAt"] = datetime.now(timezone.utc)

    users_coll.update_one(query, {"$set": update_fields})
    updated_doc = users_coll.find_one(query)

    return _format_user_doc(updated_doc)


@router.post(
    "/{user_id}/participation",
    response_model=ParticipationItem,
    status_code=status.HTTP_201_CREATED,
    summary="Record Activity Participation",
    description="Records an activity attended by the user in MongoDB, used by the recommendation engine to apply novelty/anti-repeat logic.",
)
async def record_participation(user_id: str, request: ParticipationRequest) -> ParticipationItem:
    """Inserts a participation record in MongoDB participation_history."""
    db = get_db()
    if db is None or not is_mongodb_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB service is currently unavailable.",
        )

    act_name = request.activity_name
    if not act_name:
        act_doc = db["activities"].find_one({"id": request.activity_id})
        act_name = act_doc.get("name") if act_doc else request.activity_id

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    record = {
        "user_id": user_id,
        "activity_id": request.activity_id,
        "activity_name": act_name,
        "date": request.date or now_str,
        "notes": request.notes,
        "createdAt": datetime.now(timezone.utc),
    }

    part_coll = db["participation_history"]
    result = part_coll.insert_one(record)

    # Also append to user's previous_activities if user exists
    users_coll = db["users"]
    user_query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"$or": [{"user_id": user_id}, {"username": user_id}]}
    users_coll.update_one(user_query, {"$addToSet": {"previous_activities": act_name}})

    return ParticipationItem(
        id=str(result.inserted_id),
        user_id=user_id,
        activity_id=request.activity_id,
        activity_name=act_name,
        date=record["date"],
        created_at=str(record["createdAt"]),
    )


@router.get(
    "/{user_id}/participation",
    response_model=ParticipationResponse,
    summary="Get User Participation History",
    description="Retrieves list of past BNHS activities completed by the user.",
)
async def get_user_participation(user_id: str) -> ParticipationResponse:
    """Fetches user participation history."""
    db = get_db()
    if db is None or not is_mongodb_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB service is currently unavailable.",
        )

    part_coll = db["participation_history"]
    records = list(part_coll.find({"user_id": user_id}).sort("createdAt", -1))

    items = [
        ParticipationItem(
            id=str(r.get("_id", "")),
            user_id=r.get("user_id"),
            activity_id=r.get("activity_id"),
            activity_name=r.get("activity_name", ""),
            date=r.get("date"),
            created_at=str(r.get("createdAt", "")),
        )
        for r in records
    ]

    return ParticipationResponse(
        user_id=user_id,
        count=len(items),
        history=items,
    )


@router.get(
    "/{user_id}/registrations",
    response_model=List[RegistrationResponse],
    summary="Get User Registrations",
    description="Retrieves upcoming registrations for a user.",
)
async def get_user_registrations(user_id: str) -> List[RegistrationResponse]:
    """Fetches registrations for a user from MongoDB registrations collection."""
    db = get_db()
    if db is None or not is_mongodb_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB service is currently unavailable.",
        )

    reg_coll = db["registrations"]
    docs = list(reg_coll.find({"user_id": user_id}).sort("createdAt", -1))

    results = []
    for d in docs:
        results.append(
            RegistrationResponse(
                id=str(d.get("_id", "")),
                user_id=d.get("user_id"),
                activity_id=d.get("activity_id"),
                activity_name=d.get("activity_name"),
                status=d.get("status", "registered"),
                created_at=str(d.get("createdAt", "")),
            )
        )

    return results


@router.get(
    "/{user_id}/engagement",
    response_model=UserEngagementResponse,
    summary="Get User Engagement Analysis",
    description="Analyzes completed activities, category distributions, completion rate, engagement score, and generates explainable insights.",
)
async def get_user_engagement(user_id: str) -> UserEngagementResponse:
    """Generates structured engagement report for the user."""
    try:
        report = engagement_service.analyze_user_engagement(user_id)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate user engagement report: {str(e)}",
        )
