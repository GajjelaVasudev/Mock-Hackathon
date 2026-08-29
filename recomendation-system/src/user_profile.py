"""BNHS User Profile Module.
Defines the UserProfile data model and provides curated demo profiles.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class UserProfile:
    """Represents a BNHS platform user profile."""
    name: str = "Anonymous Nature Enthusiast"
    age_group: str = "adult"  # "student", "youth", "adult", "senior", "all"
    location: str = "Mumbai"
    interests: List[str] = field(default_factory=list)
    experience_level: str = "beginner"  # "beginner", "intermediate", "expert"
    preferred_activity_type: Optional[str] = None  # "walk", "camp", "course", "volunteer", "any"
    previous_activities: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserProfile":
        return cls(
            name=data.get("name", "Anonymous Nature Enthusiast"),
            age_group=data.get("age_group", "adult"),
            location=data.get("location", "Mumbai"),
            interests=data.get("interests", []) or [],
            experience_level=data.get("experience_level", "beginner"),
            preferred_activity_type=data.get("preferred_activity_type"),
            previous_activities=data.get("previous_activities", []) or [],
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "age_group": self.age_group,
            "location": self.location,
            "interests": self.interests,
            "experience_level": self.experience_level,
            "preferred_activity_type": self.preferred_activity_type,
            "previous_activities": self.previous_activities,
        }


# Curated Demo Profiles for Presentation & Testing
DEMO_PROFILES = {
    "A": UserProfile(
        name="Aarav Sharma (Beginner Birdwatcher)",
        age_group="adult",
        location="Mumbai",
        interests=["birds", "birdwatching", "wetlands", "nature walks"],
        experience_level="beginner",
        preferred_activity_type="walk",
        previous_activities=["BNHS Awareness Bird Walk at Vetal Tekdi"],
    ),
    "B": UserProfile(
        name="Priya Nair (Wildlife Photographer)",
        age_group="adult",
        location="Mumbai",
        interests=["photography", "reptiles", "amphibians", "flamingos", "butterflies"],
        experience_level="intermediate",
        preferred_activity_type="camp",
        previous_activities=[],
    ),
    "C": UserProfile(
        name="Rohan Deshmukh (Student Herpetology Enthusiast)",
        age_group="student",
        location="Maharashtra",
        interests=["reptiles", "amphibians", "herpetology", "field research", "night trails"],
        experience_level="intermediate",
        preferred_activity_type="camp",
        previous_activities=[],
    ),
    "D": UserProfile(
        name="Meera Kulkarni (Nature & Tree Enthusiast)",
        age_group="adult",
        location="Mumbai",
        interests=["trees", "botany", "urban biodiversity", "city heritage", "nature walks"],
        experience_level="beginner",
        preferred_activity_type="walk",
        previous_activities=[],
    ),
    "E": UserProfile(
        name="Siddharth Mehta (Conservation Volunteer)",
        age_group="student",
        location="Mumbai",
        interests=["volunteering", "conservation", "citizen science", "AI digitisation", "bird-ringing"],
        experience_level="beginner",
        preferred_activity_type="volunteer",
        previous_activities=["BNHS-SEVA Volunteer Program"],
    ),
}
