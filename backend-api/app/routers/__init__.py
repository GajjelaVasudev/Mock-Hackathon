"""Backend API Routers Package"""
from .chat import router as chat_router
from .recommendation import router as recommendation_router
from .activities import router as activities_router
from .users import router as users_router
from .registrations import router as registrations_router
from .analytics import router as analytics_router

__all__ = [
    "chat_router",
    "recommendation_router",
    "activities_router",
    "users_router",
    "registrations_router",
    "analytics_router",
]
