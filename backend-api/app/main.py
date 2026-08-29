"""BNHS Nature-Engagement Platform — FastAPI Backend Application with MongoDB Integration.
Provides unified REST APIs for RAG Knowledge Base Queries, Personalized Activity Recommendations,
Activity Catalog, User Profiles, Participation History, Event Registrations, and Engagement Analytics.
"""

from contextlib import asynccontextmanager
from typing import Dict
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database.mongodb import db_manager, is_mongodb_available
from app.routers import (
    activities_router,
    analytics_router,
    chat_router,
    recommendation_router,
    registrations_router,
    users_router,
)
from app.schemas import ErrorResponse, HealthResponse
from app.services import RAGService, RecommendationService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler to initialize connections and services upon startup."""
    print("🚀 Starting BNHS FastAPI Backend Service (with MongoDB & Engagement Analytics)...")
    rag = RAGService()
    rec = RecommendationService()
    mongo_ok = is_mongodb_available()
    print(f"✅ Services active — RAG: {'OK' if rag.is_healthy() else 'Error'}, Recommender: {'OK' if rec.is_healthy() else 'Error'}, MongoDB: {'OK' if mongo_ok else 'Unavailable'}")
    yield
    print("🛑 Shutting down BNHS FastAPI Backend Service...")
    db_manager.close()


app = FastAPI(
    title="Bombay Natural History Society (BNHS) API",
    description="""
## BNHS Nature-Engagement Platform Backend API

This production-ready FastAPI backend exposes the full platform capabilities:
1. **Conversational RAG Knowledge Base Assistant**: Grounded question-answering with multi-turn pronoun resolution and exact document/page citations.
2. **Activity Recommendation Engine**: Personalized, content-based & rule-based activity discovery backed by MongoDB with transparent matching reasons.
3. **Structured Activity Catalog**: Complete inventory of authentic BNHS walks, camps, courses, and volunteer opportunities.
4. **User Profiles & History**: Dynamic user profiles with participation history tracking for anti-repeat logic.
5. **Event Registrations**: Lightweight registration & booking management for BNHS nature events.
6. **Engagement Analytics Module**: Explainable member participation metrics, completion rates, category distributions, engagement scoring, and platform-wide statistics.
    """,
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ==============================================================================
# CORS Middleware Configuration
# ==============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "*",  # Permissive development default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# Global Exception Handlers
# ==============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensures unhandled internal errors return clean JSON without leaking stack traces."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An internal server error occurred: {str(exc)}"},
    )


# ==============================================================================
# Health Check Endpoint
# ==============================================================================
@app.get(
    "/api/v1/health",
    response_model=HealthResponse,
    tags=["System & Health"],
    summary="Service Health Check",
    description="Returns real-time operational status of RAG, Recommendation Engine, and MongoDB.",
)
async def health_check() -> HealthResponse:
    """Checks the health of all integrated subsystem services."""
    rag = RAGService()
    rec = RecommendationService()
    mongo_ok = is_mongodb_available()

    rag_status = "available" if rag.is_healthy() else "unavailable"
    rec_status = "available" if rec.is_healthy() else "unavailable"
    mongo_status = "available" if mongo_ok else "unavailable"

    overall = "healthy" if (rag_status == "available" and rec_status == "available" and mongo_status == "available") else "degraded"

    return HealthResponse(
        status=overall,
        services={
            "rag": rag_status,
            "recommendation": rec_status,
            "mongodb": mongo_status,
        },
    )


# ==============================================================================
# Root Welcome Route
# ==============================================================================
@app.get("/", tags=["System & Health"], include_in_schema=False)
async def root():
    """Root redirect with helpful links to Swagger documentation."""
    return {
        "message": "Welcome to the Bombay Natural History Society (BNHS) Backend API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/v1/health",
        "version": "1.2.0",
    }


# ==============================================================================
# Register Application Routers
# ==============================================================================
app.include_router(chat_router)
app.include_router(recommendation_router)
app.include_router(activities_router)
app.include_router(users_router)
app.include_router(registrations_router)
app.include_router(analytics_router)
