"""Pydantic Schemas for BNHS FastAPI Backend with MongoDB Integration, Conversational RAG & Engagement Analytics.
Provides robust data validation, type hints, and rich OpenAPI Swagger documentation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


# ==============================================================================
# Chat / Conversational RAG Schemas
# ==============================================================================

class ChatRequest(BaseModel):
    """Request payload for BNHS conversational RAG knowledge query."""
    query: str = Field(
        ...,
        min_length=1,
        description="Natural language question about BNHS, activities, conservation, or membership.",
        examples=["What is BNHS-SEVA?", "When was it formed?"]
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session ID for conversational memory and multi-turn reference resolution.",
        examples=["demo-session-001"]
    )


class Source(BaseModel):
    """Source attribution citation linking back to the BNHS master knowledge base."""
    document: str = Field(..., description="Document filename", examples=["BNHS_Master_Clean_RAG_Knowledge_Base_25_Pages.pdf"])
    page: Union[int, str] = Field(..., description="Page number where the fact is documented", examples=[13])
    section: str = Field(..., description="Section / topic header", examples=["BNHS-SEVA & Volunteering"])


class ChatResponse(BaseModel):
    """Grounded answer from the BNHS RAG knowledge base."""
    session_id: Optional[str] = Field(None, description="Active session ID")
    query: Optional[str] = Field(None, description="Original user question")
    rewritten_query: Optional[str] = Field(None, description="Contextualized standalone query if rewritten")
    answer: str = Field(
        ...,
        description="Factual, grounded response answering the query based solely on retrieved context.",
        examples=["BNHS-SEVA is a structured volunteer programme intended to increase member involvement in conservation and research..."]
    )
    sources: List[Source] = Field(
        default_factory=list,
        description="List of document citations and page numbers supporting the answer."
    )


class ChatHistoryMessage(BaseModel):
    """Individual message in conversation history."""
    role: str = Field(..., description="Role: user or assistant", examples=["user", "assistant"])
    content: str = Field(..., description="Message text")
    rewritten_query: Optional[str] = None
    timestamp: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    """Full message history for a chat session."""
    session_id: str
    messages: List[ChatHistoryMessage]


class ChatClearResponse(BaseModel):
    """Response confirming session deletion."""
    session_id: str
    message: str


# ==============================================================================
# User Profile Schemas (MongoDB users collection)
# ==============================================================================

class UserCreateRequest(BaseModel):
    """Payload to register or create a new user profile."""
    username: Optional[str] = Field(None, description="Unique username (MERN compatible)", examples=["abhiram"])
    name: str = Field(..., description="Full user display name", examples=["Abhiram Sharma"])
    email: Optional[str] = Field(None, description="Contact email", examples=["abhiram@example.com"])
    age_group: str = Field(default="adult", description="Age category (student, youth, adult, senior, all)", examples=["student", "adult"])
    location: str = Field(default="Mumbai", description="User's city or base location", examples=["Mumbai", "Navi Mumbai", "Pune"])
    interests: List[str] = Field(default_factory=list, description="Nature interests / tags", examples=[["birds", "photography", "wetlands"]])
    experience_level: str = Field(default="beginner", description="Experience level (beginner, intermediate, expert)", examples=["beginner"])
    preferred_activity_type: Optional[str] = Field(default=None, description="Preferred format (walk, camp, course, volunteer)", examples=["walk"])
    previous_activities: List[str] = Field(default_factory=list, description="Previously attended activity names or IDs")


class UserUpdateRequest(BaseModel):
    """Payload to update an existing user profile."""
    name: Optional[str] = Field(None, description="Updated display name")
    email: Optional[str] = Field(None, description="Updated email")
    age_group: Optional[str] = Field(None, description="Updated age group")
    location: Optional[str] = Field(None, description="Updated location")
    interests: Optional[List[str]] = Field(None, description="Updated interests list")
    experience_level: Optional[str] = Field(None, description="Updated experience level")
    preferred_activity_type: Optional[str] = Field(None, description="Updated preferred activity format")
    previous_activities: Optional[List[str]] = Field(None, description="Updated list of attended activities")


class UserResponse(BaseModel):
    """Full user profile response from MongoDB."""
    id: str = Field(..., description="User ID / MongoDB ObjectId", examples=["66d01234567890abcdef1234"])
    username: Optional[str] = Field(None, description="Username")
    name: str = Field(..., description="Full display name")
    email: Optional[str] = Field(None, description="Email address")
    age_group: str = Field(default="adult")
    location: str = Field(default="Mumbai")
    interests: List[str] = Field(default_factory=list)
    experience_level: str = Field(default="beginner")
    preferred_activity_type: Optional[str] = None
    previous_activities: List[str] = Field(default_factory=list)
    badges: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ==============================================================================
# Participation History Schemas (MongoDB participation_history collection)
# ==============================================================================

class ParticipationRequest(BaseModel):
    """Payload to record activity participation."""
    activity_id: str = Field(..., description="ID of the completed activity", examples=["bnhs_flamingo_watch_chanakya"])
    activity_name: Optional[str] = Field(None, description="Name of the activity", examples=["Flamingo Watch at TS Chanakya"])
    date: Optional[str] = Field(None, description="Date of participation (YYYY-MM-DD)", examples=["2026-08-25"])
    notes: Optional[str] = Field(None, description="Optional member notes or feedback")


class ParticipationItem(BaseModel):
    """Recorded participation entry."""
    id: Optional[str] = None
    user_id: str
    activity_id: str
    activity_name: str
    date: Optional[str] = None
    created_at: Optional[str] = None


class ParticipationResponse(BaseModel):
    """List of user's recorded participation history."""
    user_id: str
    count: int
    history: List[ParticipationItem]


# ==============================================================================
# Registration Schemas (MongoDB registrations collection)
# ==============================================================================

class RegistrationRequest(BaseModel):
    """Payload to register a user for an upcoming activity."""
    user_id: str = Field(..., description="User ID registering for activity", examples=["66d01234567890abcdef1234"])
    activity_id: str = Field(..., description="Activity ID to register for", examples=["bnhs_matheran_herpetofauna_camp"])
    status: str = Field(default="registered", description="Registration status", examples=["registered"])


class RegistrationResponse(BaseModel):
    """Registration confirmation details."""
    id: str
    user_id: str
    activity_id: str
    activity_name: Optional[str] = None
    status: str = "registered"
    created_at: Optional[str] = None


# ==============================================================================
# Recommendation Schemas
# ==============================================================================

class RecommendationRequest(BaseModel):
    """User profile preferences or user_id for personalized BNHS activity recommendations."""
    user_id: Optional[str] = Field(
        default=None,
        description="Optional MongoDB user_id. If provided, user profile and history are dynamically retrieved from MongoDB.",
        examples=["66d01234567890abcdef1234"]
    )
    name: Optional[str] = Field(
        default="Nature Enthusiast",
        description="User's full or display name.",
        examples=["Demo User", "Aarav Sharma"]
    )
    age_group: Optional[str] = Field(
        default="adult",
        description="Age category (student, youth, adult, senior, all).",
        examples=["student", "adult"]
    )
    location: Optional[str] = Field(
        default="Mumbai",
        description="User's primary city or region.",
        examples=["Mumbai", "Navi Mumbai", "Pune", "Delhi"]
    )
    interests: Optional[List[str]] = Field(
        default_factory=lambda: ["birds"],
        description="List of nature topics, species, or themes the user is interested in.",
        examples=[["birds", "photography", "wetlands"]]
    )
    experience_level: Optional[str] = Field(
        default="beginner",
        description="User's experience level (beginner, intermediate, expert).",
        examples=["beginner", "intermediate"]
    )
    preferred_activity_type: Optional[str] = Field(
        default=None,
        description="Format preference (walk, camp, course, volunteer, or null for any).",
        examples=["walk", "camp", "volunteer"]
    )
    previous_activities: Optional[List[str]] = Field(
        default_factory=list,
        description="Names or IDs of BNHS activities previously attended (to apply novelty prioritization).",
        examples=[["BNHS Awareness Bird Walk at Vetal Tekdi"]]
    )


class ActivityImage(BaseModel):
    """Event photography metadata - three resolution tiers for optimal loading."""
    url: str = Field(..., description="Full-resolution image URL (1280px wide) - used on detail page")
    mediumUrl: Optional[str] = Field(None, description="Medium-resolution image URL (700px wide) - used on activity cards")
    smallUrl: Optional[str] = Field(None, description="Thumbnail URL (400px wide) - used for small viewports")
    source: Optional[str] = Field("pexels", description="Photo source (pexels or unsplash)")
    photographer: Optional[str] = Field("Contributor", description="Photographer attribution")
    attributionUrl: Optional[str] = Field("", description="URL to photo source")
    alt: Optional[str] = Field("BNHS Nature Activity", description="Descriptive alt text")


class Recommendation(BaseModel):
    """A single recommended activity with match score and explainable reasons."""
    activity_id: Optional[str] = Field(None, description="Unique activity identifier", examples=["bnhs_flamingo_watch_chanakya"])
    activity: str = Field(..., description="Activity title", examples=["Flamingo Watch at TS Chanakya"])
    category: Optional[str] = Field(None, description="Knowledge / activity domain", examples=["Nature Activities: Bird & Nature Walks"])
    location: Optional[str] = Field(None, description="Activity venue / location", examples=["Navi Mumbai"])
    type: Optional[str] = Field(None, description="Activity format (walk, camp, course, volunteer)", examples=["walk"])
    difficulty: Optional[str] = Field(None, description="Physical / technical difficulty", examples=["easy"])
    duration: Optional[str] = Field(None, description="Expected time commitment", examples=["2 hours"])
    distance: Optional[str] = Field(None, description="Trail distance", examples=["1.5 km"])
    description: Optional[str] = Field(None, description="Summary of activity content")
    image: Optional[ActivityImage] = Field(None, description="Event photo image metadata")
    imageUrl: Optional[str] = Field(None, description="Direct URL to event photograph")
    score: float = Field(..., description="Match percentage score between 0 and 100", examples=[94.0])
    reasons: List[str] = Field(..., description="Explainable reasons why this activity was recommended", examples=[["Matches your interest in birds", "Located in Navi Mumbai", "Suitable for beginners"]])


class RecommendationResponse(BaseModel):
    """Ranked list of top recommendations for the user."""
    user_id: Optional[str] = Field(None, description="User ID if recommendation was based on MongoDB user")
    recommendations: List[Recommendation] = Field(
        ...,
        description="Top-N recommended activities sorted descending by match score."
    )


# ==============================================================================
# Activity Catalog Schemas
# ==============================================================================

class Activity(BaseModel):
    """Structured BNHS Activity."""
    id: str = Field(..., description="Unique ID", examples=["bnhs_matheran_herpetofauna_camp"])
    name: str = Field(..., description="Activity Name", examples=["Matheran Herpetofauna Camp"])
    title: Optional[str] = Field(None, description="Activity Title")
    category: str = Field(..., description="Category / Domain", examples=["Herpetology & Field Camps"])
    location: str = Field(..., description="City or region", examples=["Matheran"])
    interests: List[str] = Field(default_factory=list, description="Associated interest tags")
    tags: Optional[List[str]] = Field(default_factory=list, description="Associated tags")
    difficulty: Optional[str] = Field(None, description="Difficulty level (easy, intermediate, moderate)")
    audience: List[str] = Field(default_factory=list, description="Target audiences")
    duration: Optional[str] = Field(None, description="Duration")
    distance: Optional[str] = Field(None, description="Distance if walking trail")
    description: str = Field(default="", description="Detailed activity description")
    species: List[str] = Field(default_factory=list, description="Focal species or wildlife observed")
    type: str = Field(default="walk", description="Type: walk, camp, course, volunteer")
    image: Optional[ActivityImage] = Field(None, description="Event photo image metadata")
    imageUrl: Optional[str] = Field(None, description="Direct URL to event photograph")
    date: Optional[str] = Field(None, description="Event date")
    capacity: Optional[int] = Field(None, description="Max participant capacity")
    registeredCount: Optional[int] = Field(None, description="Registered participant count")
    status: Optional[str] = Field(default="upcoming", description="Activity status")


class ActivitiesResponse(BaseModel):
    """Catalog query response containing matching activities."""
    count: int = Field(..., description="Number of activities returned", examples=[20])
    source: str = Field(default="mongodb", description="Data source: mongodb or local_fallback", examples=["mongodb"])
    activities: List[Activity] = Field(..., description="List of BNHS activities")


# ==============================================================================
# Engagement Analysis Schemas (Phase 5)
# ==============================================================================

class CategoryEngagement(BaseModel):
    """Activity participation breakdown by category."""
    category: str = Field(..., description="Category name", examples=["Nature Activities: Bird & Nature Walks"])
    count: int = Field(..., description="Number of activities completed in category", examples=[4])
    percentage: float = Field(..., description="Percentage of total participation", examples=[50.0])


class TypeEngagement(BaseModel):
    """Activity participation breakdown by format type."""
    type: str = Field(..., description="Format: walk, camp, course, volunteer", examples=["walk"])
    count: int = Field(..., description="Number of activities completed of this type", examples=[5])
    percentage: float = Field(..., description="Percentage of total participation", examples=[62.5])


class RecentActivity(BaseModel):
    """Most recent activity attended by the user."""
    activity_name: Optional[str] = Field(None, description="Activity name", examples=["Flamingo Watch at TS Chanakya"])
    category: Optional[str] = Field(None, description="Category", examples=["Nature Activities: Bird & Nature Walks"])
    date: Optional[str] = Field(None, description="Date attended", examples=["2026-08-25"])


class NatureJourneyStage(BaseModel):
    """Nature Journey progression stage and milestones."""
    current_stage: str = Field(..., description="Journey milestone tier", examples=["Nature Explorer"])
    completed_categories: List[str] = Field(default_factory=list, description="Categories with at least one completed activity")
    next_suggested_category: Optional[str] = Field(None, description="Suggested next category to explore")


class EngagementSummary(BaseModel):
    """Consolidated engagement metrics summary."""
    engagement_score: float = Field(..., description="Composite score 0-100", examples=[82.0])
    engagement_level: str = Field(..., description="Tier: LOW, MODERATE, HIGH, VERY_HIGH", examples=["VERY_HIGH"])
    total_registrations: int = Field(..., description="Total activities booked", examples=[10])
    total_participations: int = Field(..., description="Total completed activities", examples=[8])
    completion_rate: float = Field(..., description="Percentage of registered activities completed", examples=[80.0])
    participation_frequency: Dict[str, Any] = Field(
        default_factory=dict,
        description="Frequency metrics (e.g. activities_per_month)",
        examples=[{"activities_per_month": 2.0}]
    )
    most_engaged_category: Optional[str] = Field(None, description="Dominant category", examples=["Nature Activities: Bird & Nature Walks"])
    most_engaged_type: Optional[str] = Field(None, description="Dominant format", examples=["walk"])
    engagement_trend: str = Field(..., description="Trend: INCREASING, STABLE, DECREASING, INSUFFICIENT_DATA", examples=["INCREASING"])


class UserEngagementResponse(BaseModel):
    """Full user engagement analysis report."""
    user_id: str = Field(..., description="User ID", examples=["66d01234567890abcdef1234"])
    summary: EngagementSummary
    category_distribution: List[CategoryEngagement]
    type_distribution: List[TypeEngagement]
    recent_activity: Optional[RecentActivity] = None
    journey: NatureJourneyStage
    insights: List[str] = Field(default_factory=list, description="Explainable deterministic insights")


class PlatformEngagementResponse(BaseModel):
    """Aggregate platform-wide engagement statistics."""
    total_users: int = Field(..., description="Total registered members", examples=[120])
    total_registrations: int = Field(..., description="Total platform bookings", examples=[350])
    total_participations: int = Field(..., description="Total completed activities across all users", examples=[280])
    completion_rate: float = Field(..., description="Overall completion rate percentage", examples=[80.0])
    most_popular_categories: List[Dict[str, Any]]
    most_popular_activity_types: List[Dict[str, Any]]
    engagement_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of users in each engagement tier (LOW, MODERATE, HIGH, VERY_HIGH)",
        examples=[{"LOW": 10, "MODERATE": 30, "HIGH": 50, "VERY_HIGH": 30}]
    )


# ==============================================================================
# System & Health Schemas
# ==============================================================================

class HealthResponse(BaseModel):
    """API service health status."""
    status: str = Field(default="healthy", examples=["healthy"])
    services: Dict[str, str] = Field(
        default_factory=dict,
        examples=[{"rag": "available", "recommendation": "available", "mongodb": "available"}]
    )


class ErrorResponse(BaseModel):
    """Standardized error response model."""
    detail: str = Field(..., description="Human-readable error explanation", examples=["User not found."])
