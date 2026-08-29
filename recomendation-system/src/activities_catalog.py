"""BNHS Activities Catalog Module.
Defines the Activity data model and handles dataset loading, querying, and filtering.
"""

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "activities.json"


@dataclass
class Activity:
    """Data model representing an authentic BNHS activity."""
    id: str
    name: str
    category: str
    location: str
    interests: List[str] = field(default_factory=list)
    difficulty: Optional[str] = None
    audience: List[str] = field(default_factory=list)
    duration: Optional[str] = None
    distance: Optional[str] = None
    description: str = ""
    species: List[str] = field(default_factory=list)
    type: str = "walk"  # "walk", "camp", "course", "volunteer"
    title: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    image: Optional[Dict[str, Any]] = None
    imageUrl: Optional[str] = None
    date: Optional[str] = None
    capacity: Optional[int] = None
    registered_count: Optional[int] = None
    status: Optional[str] = "upcoming"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Activity":
        raw_image = data.get("image")
        image_dict = None
        if isinstance(raw_image, dict) and raw_image.get("url"):
            image_dict = {
                "url": raw_image.get("url"),
                "mediumUrl": raw_image.get("mediumUrl") or raw_image.get("url"),
                "smallUrl": raw_image.get("smallUrl") or raw_image.get("url"),
                "source": raw_image.get("source", "pexels"),
                "photographer": raw_image.get("photographer", "Contributor"),
                "attributionUrl": raw_image.get("attributionUrl", ""),
                "alt": raw_image.get("alt") or data.get("name") or data.get("title") or "BNHS Nature Activity",
            }
        elif data.get("imageUrl"):
            image_dict = {
                "url": data.get("imageUrl"),
                "mediumUrl": data.get("imageUrl"),
                "smallUrl": data.get("imageUrl"),
                "source": "custom",
                "photographer": "BNHS",
                "attributionUrl": "",
                "alt": data.get("name") or data.get("title") or "BNHS Nature Activity",
            }

        name_val = data.get("name") or data.get("title") or ""
        title_val = data.get("title") or name_val

        return cls(
            id=str(data.get("id") or data.get("_id") or ""),
            name=name_val,
            title=title_val,
            category=data.get("category", "General"),
            location=data.get("location", "Mumbai"),
            interests=data.get("interests") or data.get("tags") or [],
            tags=data.get("tags") or data.get("interests") or [],
            difficulty=data.get("difficulty"),
            audience=data.get("audience") or [],
            duration=data.get("duration"),
            distance=data.get("distance"),
            description=data.get("description", ""),
            species=data.get("species") or [],
            type=data.get("type", "walk"),
            image=image_dict,
            imageUrl=data.get("imageUrl") or (image_dict.get("url") if image_dict else None),
            date=str(data.get("date")) if data.get("date") else None,
            capacity=data.get("capacity"),
            registered_count=data.get("registeredCount") or data.get("registered_count"),
            status=data.get("status", "upcoming"),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "title": self.title or self.name,
            "category": self.category,
            "location": self.location,
            "interests": self.interests,
            "tags": self.tags,
            "difficulty": self.difficulty,
            "audience": self.audience,
            "duration": self.duration,
            "distance": self.distance,
            "description": self.description,
            "species": self.species,
            "type": self.type,
            "image": self.image,
            "imageUrl": self.imageUrl,
            "date": self.date,
            "capacity": self.capacity,
            "registeredCount": self.registered_count,
            "status": self.status,
        }


class ActivitiesCatalog:
    """Catalog manager for loading and querying BNHS activities."""

    def __init__(self, data_path: Optional[Union[Path, str]] = None):
        self.data_path = Path(data_path) if data_path else DATA_FILE
        self.activities: List[Activity] = []
        self._load_data()

    def _load_data(self):
        if not self.data_path.exists():
            raise FileNotFoundError(f"Activities data file not found at '{self.data_path}'")

        with open(self.data_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        self.activities = [Activity.from_dict(item) for item in raw_data]

    def __len__(self) -> int:
        return len(self.activities)

    def get_all(self) -> List[Activity]:
        """Returns all loaded activities."""
        return list(self.activities)

    def get_by_id(self, activity_id: str) -> Optional[Activity]:
        """Returns a single activity by its ID."""
        for a in self.activities:
            if a.id == activity_id or a.name.lower() == activity_id.lower():
                return a
        return None

    def filter(
        self,
        location: Optional[str] = None,
        activity_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[Activity]:
        """Filters activities based on matching criteria."""
        results = self.activities

        if location:
            loc_lower = location.lower()
            results = [a for a in results if loc_lower in a.location.lower()]

        if activity_type:
            type_lower = activity_type.lower()
            results = [a for a in results if a.type.lower() == type_lower]

        if difficulty:
            diff_lower = difficulty.lower()
            results = [
                a for a in results
                if a.difficulty and a.difficulty.lower() == diff_lower
            ]

        if category:
            cat_lower = category.lower()
            results = [a for a in results if cat_lower in a.category.lower()]

        return results
