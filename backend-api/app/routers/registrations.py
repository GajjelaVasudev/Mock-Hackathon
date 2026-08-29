"""Registrations Router (MongoDB registrations collection).
Exposes endpoints for booking and managing BNHS activity registrations.
Compatible with team's MERN schema (user, activity).
"""

from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status

from app.database.mongodb import get_db, is_mongodb_available
from app.schemas import RegistrationRequest, RegistrationResponse

router = APIRouter(prefix="/api/v1/registrations", tags=["Registrations"])


@router.post(
    "",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for Activity",
    description="Registers a user for an upcoming BNHS walk, camp, or event.",
)
async def register_activity(request: RegistrationRequest) -> RegistrationResponse:
    """Creates a new registration record in MongoDB."""
    db = get_db()
    if db is None or not is_mongodb_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB service is currently unavailable.",
        )

    # Lookup activity name if available
    act_doc = db["activities"].find_one({"id": request.activity_id})
    act_name = act_doc.get("name") if act_doc else request.activity_id

    # Format user reference (compatible with MERN user_1_activity_1 index)
    user_ref = ObjectId(request.user_id) if ObjectId.is_valid(request.user_id) else request.user_id
    act_ref = request.activity_id

    reg_doc = {
        "user": user_ref,
        "activity": act_ref,
        "user_id": request.user_id,
        "activity_id": request.activity_id,
        "activity_name": act_name,
        "status": request.status,
        "createdAt": datetime.now(timezone.utc),
    }

    reg_coll = db["registrations"]
    
    # Use update_one upsert to handle re-registration idempotently
    result = reg_coll.update_one(
        {"user": user_ref, "activity": act_ref},
        {"$set": reg_doc},
        upsert=True,
    )
    
    # Retrieve doc ID
    doc_id = str(result.upserted_id) if result.upserted_id else str(reg_coll.find_one({"user": user_ref, "activity": act_ref})["_id"])

    return RegistrationResponse(
        id=doc_id,
        user_id=request.user_id,
        activity_id=request.activity_id,
        activity_name=act_name,
        status=request.status,
        created_at=str(reg_doc["createdAt"]),
    )
