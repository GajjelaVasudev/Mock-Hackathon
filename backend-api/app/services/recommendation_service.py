"""Recommendation Service Wrapper for BNHS Activities with MongoDB Integration.
Fetches dynamic user profiles and activities from MongoDB Atlas, with seamless local fallback.
"""

from datetime import datetime
import sys
import types
from pathlib import Path
from typing import Any, Dict, List, Optional
from bson import ObjectId

# Locate project directories
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_DIR.parent
RAG_DIR = WORKSPACE_ROOT / "bnhs-rag"
REC_DIR = WORKSPACE_ROOT / "recomendation-system"

rag_src = str(RAG_DIR / "src")
rec_src = str(REC_DIR / "src")

# Configure unified src namespace
if "src" not in sys.modules:
    src_mod = types.ModuleType("src")
    src_mod.__path__ = [rag_src, rec_src]
    sys.modules["src"] = src_mod
else:
    src_paths = getattr(sys.modules["src"], "__path__", [])
    if rag_src not in src_paths:
        src_paths.append(rag_src)
    if rec_src not in src_paths:
        src_paths.append(rec_src)
    sys.modules["src"].__path__ = src_paths

from src.activities_catalog import ActivitiesCatalog, Activity
from src.recommender import BNHSRecommender
from src.user_profile import UserProfile
from app.database.mongodb import get_db, is_mongodb_available


class RecommendationService:
    """Service wrapper for generating personalized activity recommendations backed by MongoDB."""

    _instance: Optional["RecommendationService"] = None
    _catalog: Optional[ActivitiesCatalog] = None
    _recommender: Optional[BNHSRecommender] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RecommendationService, cls).__new__(cls)
            cls._instance._initialize_engine()
        return cls._instance

    def _initialize_engine(self):
        """Initializes the existing BNHSRecommender and ActivitiesCatalog fallback."""
        try:
            data_path = REC_DIR / "data" / "activities.json"
            self._catalog = ActivitiesCatalog(data_path=data_path)
            self._recommender = BNHSRecommender(catalog=self._catalog)
            print(f" RecommendationService initialized with local fallback catalog ({len(self._catalog)} activities).")
        except Exception as e:
            print(f"⚠️ Failed to initialize Recommendation Engine fallback: {e}")
            self._catalog = None
            self._recommender = None

    def _get_dynamic_activities(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        difficulty: Optional[str] = None,
        activity_type: Optional[str] = None,
    ) -> List[Activity]:
        """Loads activities from MongoDB if available, otherwise falls back to activities.json."""
        db = get_db()
        if db is not None and is_mongodb_available():
            try:
                coll = db["activities"]
                query: Dict[str, Any] = {}

                if activity_type:
                    query["type"] = activity_type.lower()
                if difficulty:
                    query["difficulty"] = difficulty.lower()
                if location:
                    query["location"] = {"$regex": location, "$options": "i"}
                if category:
                    query["category"] = {"$regex": category, "$options": "i"}

                cursor = coll.find(query)
                mongo_docs = list(cursor)

                if mongo_docs:
                    activities = []
                    for doc in mongo_docs:
                        doc.pop("_id", None)
                        activities.append(Activity.from_dict(doc))
                    return activities
            except Exception as e:
                print(f"⚠️ MongoDB activities fetch error ({e}). Falling back to local catalog.")

        # Fallback to local catalog
        if not self._catalog:
            self._initialize_engine()
        if not self._catalog:
            raise RuntimeError("Activities data source is unavailable.")

        return self._catalog.filter(
            location=location,
            activity_type=activity_type,
            difficulty=difficulty,
            category=category,
        )

    def get_activities(
        self,
        category: Optional[str] = None,
        location: Optional[str] = None,
        difficulty: Optional[str] = None,
        activity_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Queries activities catalog returning activity list and data source."""
        is_mongo = is_mongodb_available()
        activities = self._get_dynamic_activities(
            category=category,
            location=location,
            difficulty=difficulty,
            activity_type=activity_type,
        )
        return {
            "source": "mongodb" if is_mongo else "local_fallback",
            "activities": [a.to_dict() for a in activities],
        }

    def _get_user_profile_from_db(self, user_id: str) -> Optional[UserProfile]:
        """Retrieves a user profile from MongoDB by user_id or _id, including participation history."""
        db = get_db()
        if db is None or not is_mongodb_available():
            return None

        users_coll = db["users"]
        user_doc = None

        # Try matching by ObjectId if valid
        if ObjectId.is_valid(user_id):
            user_doc = users_coll.find_one({"_id": ObjectId(user_id)})

        # Try matching by custom user_id, username, or string _id
        if not user_doc:
            user_doc = users_coll.find_one({
                "$or": [
                    {"user_id": user_id},
                    {"username": user_id},
                    {"id": user_id},
                ]
            })

        if not user_doc:
            return None

        # Fetch participation history for this user
        part_coll = db["participation_history"]
        history_docs = list(part_coll.find({
            "$or": [
                {"user_id": str(user_doc.get("_id"))},
                {"user_id": user_id},
            ]
        }))

        previous_activities = list(user_doc.get("previous_activities", []))
        for h in history_docs:
            act_name = h.get("activity_name") or h.get("activity_id")
            if act_name and act_name not in previous_activities:
                previous_activities.append(act_name)

        return UserProfile(
            name=user_doc.get("name") or user_doc.get("username", "BNHS Member"),
            age_group=user_doc.get("age_group", "adult"),
            location=user_doc.get("location", "Mumbai"),
            interests=user_doc.get("interests", []) or [],
            experience_level=user_doc.get("experience_level", "beginner"),
            preferred_activity_type=user_doc.get("preferred_activity_type"),
            previous_activities=previous_activities,
        )

    def recommend(
        self,
        profile_data: Dict[str, Any],
        top_n: int = 5,
    ) -> List[Dict[str, Any]]:
        """Generates recommendations for a profile dict or MongoDB user_id."""
        user_id = profile_data.get("user_id")
        user_profile = None

        if user_id:
            user_profile = self._get_user_profile_from_db(user_id)
            if not user_profile:
                print(f"ℹ️ User ID '{user_id}' not found in MongoDB. Using provided profile payload.")

        if not user_profile:
            user_profile = UserProfile.from_dict(profile_data)

        # Retrieve dynamic candidates from MongoDB / fallback
        candidate_activities = self._get_dynamic_activities()
        
        # Build dynamic catalog
        dynamic_catalog = ActivitiesCatalog.__new__(ActivitiesCatalog)
        dynamic_catalog.activities = candidate_activities
        dynamic_catalog.data_path = Path()

        # Run existing recommendation engine and scoring formulas
        recommender = BNHSRecommender(catalog=dynamic_catalog)
        results = recommender.recommend(user_profile, top_n=top_n)

        return [r.to_dict() for r in results]

    def is_healthy(self) -> bool:
        """Checks if recommendation engine is operational."""
        return self._catalog is not None and self._recommender is not None
