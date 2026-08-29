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

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Activity":
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            category=data.get("category", "General"),
            location=data.get("location", "Mumbai"),
            interests=data.get("interests", []) or [],
            difficulty=data.get("difficulty"),
            audience=data.get("audience", []) or [],
            duration=data.get("duration"),
            distance=data.get("distance"),
            description=data.get("description", ""),
            species=data.get("species", []) or [],
            type=data.get("type", "walk"),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "location": self.location,
            "interests": self.interests,
            "difficulty": self.difficulty,
            "audience": self.audience,
            "duration": self.duration,
            "distance": self.distance,
            "description": self.description,
            "species": self.species,
            "type": self.type,
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
            results = [
                a for a in results
                if loc_lower in a.location.lower()
                or (loc_lower in ("mumbai", "navi mumbai") and a.location.lower() in ("mumbai", "navi mumbai"))
            ]

        if activity_type:
            type_lower = activity_type.lower()
            results = [a for a in results if a.type.lower() == type_lower]

        if difficulty:
            diff_lower = difficulty.lower()
            results = [a for a in results if a.difficulty and a.difficulty.lower() == diff_lower]

        if category:
            cat_lower = category.lower()
            results = [a for a in results if cat_lower in a.category.lower()]

        return results

    def __len__(self) -> int:
        return len(self.activities)
