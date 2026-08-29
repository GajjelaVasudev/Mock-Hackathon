"""BNHS Recommendation Scoring and Explanation Engine.
Implements a weighted, transparent multi-factor scoring formula with explainable reasons.
"""

from dataclasses import dataclass
from typing import Dict, List, Set, Tuple

from src.activities_catalog import Activity
from src.user_profile import UserProfile


@dataclass
class ScoringWeights:
    """Configurable weights for the multi-factor recommendation formula (sum to 1.0)."""
    interest_weight: float = 0.40
    location_weight: float = 0.20
    activity_type_weight: float = 0.15
    difficulty_weight: float = 0.10
    audience_weight: float = 0.10
    novelty_weight: float = 0.05


DEFAULT_WEIGHTS = ScoringWeights()


def normalize_term(term: str) -> str:
    """Normalizes string tokens for robust fuzzy matching."""
    return term.strip().lower()


def compute_interest_score(
    user_interests: List[str],
    activity_interests: List[str],
    activity_description: str,
    activity_species: List[str],
) -> Tuple[float, List[str]]:
    """Calculates interest alignment score (0.0 to 1.0) and lists matching topics."""
    if not user_interests:
        return 0.5, ["General nature interest"]

    user_terms = {normalize_term(i) for i in user_interests if i.strip()}
    act_terms = {normalize_term(i) for i in activity_interests if i.strip()}
    species_terms = {normalize_term(s) for s in activity_species if s.strip()}
    desc_lower = activity_description.lower()

    matched_topics: Set[str] = set()

    # Exact term overlap
    for u in user_terms:
        # Check against activity interests
        for a in act_terms:
            if u in a or a in u:
                matched_topics.add(u)
        # Check against species
        for s in species_terms:
            if u in s or s in u:
                matched_topics.add(u)
        # Check against description
        if u in desc_lower:
            matched_topics.add(u)

    if not matched_topics:
        return 0.0, []

    # Score based on proportion of user interests covered
    coverage = len(matched_topics) / len(user_terms)
    # Give a small boost if multiple specific tags match
    score = min(1.0, coverage * 0.8 + (len(matched_topics) * 0.1))

    matched_list = sorted(list(matched_topics))
    return score, matched_list


def compute_location_score(user_location: str, activity_location: str) -> Tuple[float, str]:
    """Calculates location match score (0.0 to 1.0) and returns descriptive reason."""
    u_loc = normalize_term(user_location)
    a_loc = normalize_term(activity_location)

    # Exact or substring match
    if u_loc == a_loc or u_loc in a_loc or a_loc in u_loc:
        return 1.0, f"Located in {activity_location} (direct match with your location)"

    # Greater Mumbai / MMR cross-compatibility
    mmr_locations = {"mumbai", "navi mumbai", "goregaon", "thane", "panvel"}
    if u_loc in mmr_locations and a_loc in mmr_locations:
        return 0.9, f"Located in {activity_location} (within the Mumbai Metropolitan Region)"

    # Maharashtra regional proximity (camps)
    maharashtra_locs = {"mumbai", "navi mumbai", "pune", "matheran", "amboli", "maharashtra"}
    if u_loc in maharashtra_locs and a_loc in maharashtra_locs:
        return 0.7, f"Regional destination in {activity_location} (accessible weekend trip)"

    # Multi-city or online
    if "online" in a_loc or "multi" in a_loc or "remote" in a_loc:
        return 0.8, f"Available remotely / online across cities"

    return 0.3, f"Located in {activity_location}"


def compute_activity_type_score(preferred_type: str, actual_type: str) -> Tuple[float, str]:
    """Calculates activity type preference match score (0.0 to 1.0)."""
    if not preferred_type or preferred_type.lower() in ("any", "all"):
        return 0.8, "Open to all activity formats"

    p_type = normalize_term(preferred_type)
    a_type = normalize_term(actual_type)

    if p_type == a_type:
        return 1.0, f"Matches your preferred activity format ({actual_type})"

    # Partial compatibility
    if p_type == "walk" and a_type == "camp":
        return 0.5, "Overnight field camp alternative to day walks"
    elif p_type == "camp" and a_type == "walk":
        return 0.5, "Shorter day walk alternative to overnight camps"
    elif p_type == "volunteer" and a_type in ("course", "walk"):
        return 0.6, "Educational/participatory activity aligned with volunteering"

    return 0.3, f"Activity format is {actual_type}"


def compute_difficulty_score(experience_level: str, activity_difficulty: str) -> Tuple[float, str]:
    """Calculates experience vs difficulty compatibility (0.0 to 1.0)."""
    exp = normalize_term(experience_level)
    diff = normalize_term(activity_difficulty) if activity_difficulty else "easy"

    if exp == "beginner":
        if diff == "easy":
            return 1.0, "Beginner-friendly and easy-paced"
        elif diff == "intermediate" or diff == "moderate":
            return 0.6, "Moderate level (suitable with guide assistance)"
        else:
            return 0.3, "Challenging level"

    elif exp == "intermediate":
        if diff in ("intermediate", "moderate"):
            return 1.0, "Well-suited for intermediate experience"
        elif diff == "easy":
            return 0.8, "Relaxed pace"
        else:
            return 0.7, "Advanced level"

    else:  # expert / advanced
        if diff in ("intermediate", "moderate", "advanced"):
            return 1.0, "Matches advanced experience level"
        return 0.7, "Accessible for all experience levels"


def compute_audience_score(age_group: str, audience_list: List[str]) -> Tuple[float, str]:
    """Calculates age group / audience suitability score (0.0 to 1.0)."""
    age = normalize_term(age_group)
    aud_lower = [normalize_term(a) for a in audience_list]

    if not aud_lower:
        return 0.7, "Open to all audiences"

    for aud in aud_lower:
        if age in aud or aud in age or "general" in aud or "public" in aud or "all" in aud or "enthusiast" in aud:
            return 1.0, f"Ideal for {age_group} audience"

    if age == "student" and any(k in " ".join(aud_lower) for k in ("student", "school", "youth", "academic")):
        return 1.0, "Specially designed for students and youth"

    return 0.6, "General admission"


def compute_novelty_score(previous_activities: List[str], activity_name: str, activity_id: str) -> Tuple[float, str]:
    """Applies a novelty adjustment: lowers score if already attended, boosts fresh alternatives."""
    if not previous_activities:
        return 1.0, "Fresh activity discovery"

    act_norm = normalize_term(activity_name)
    id_norm = normalize_term(activity_id)

    for prev in previous_activities:
        p_norm = normalize_term(prev)
        if p_norm == act_norm or p_norm == id_norm or (len(p_norm) > 4 and p_norm in act_norm):
            # Significant penalty for repeat activities so alternatives surface
            return 0.1, "Previously attended (alternative recommendations prioritized)"

    return 1.0, "New activity not previously attended"


def calculate_match_score(
    activity: Activity,
    user_profile: UserProfile,
    weights: ScoringWeights = DEFAULT_WEIGHTS,
) -> Tuple[float, List[str]]:
    """Calculates the composite match score (0-100) and compiles structured reasons.
    
    Formula:
        Score = (
            w_interest * S_interest +
            w_location * S_location +
            w_type * S_type +
            w_difficulty * S_difficulty +
            w_audience * S_audience +
            w_novelty * S_novelty
        ) * 100
    """
    reasons: List[str] = []

    # 1. Interest Match
    s_interest, matched_topics = compute_interest_score(
        user_profile.interests,
        activity.interests,
        activity.description,
        activity.species,
    )
    if matched_topics and matched_topics != ["General nature interest"]:
        reasons.append(f"Matches your interest in {', '.join(matched_topics)}")

    # 2. Location Match
    s_loc, loc_reason = compute_location_score(user_profile.location, activity.location)
    if s_loc >= 0.7:
        reasons.append(loc_reason)

    # 3. Activity Type Preference
    s_type, type_reason = compute_activity_type_score(user_profile.preferred_activity_type or "", activity.type)
    if s_type >= 0.7:
        reasons.append(type_reason)

    # 4. Difficulty / Experience
    s_diff, diff_reason = compute_difficulty_score(user_profile.experience_level, activity.difficulty or "easy")
    if s_diff >= 0.8:
        reasons.append(diff_reason)

    # 5. Audience / Age Group
    s_aud, aud_reason = compute_audience_score(user_profile.age_group, activity.audience)
    if s_aud >= 0.9 and "Ideal" in aud_reason:
        reasons.append(aud_reason)

    # 6. Novelty / Previous Participation
    s_nov, nov_reason = compute_novelty_score(user_profile.previous_activities, activity.name, activity.id)
    if s_nov < 0.5:
        reasons.append(f"⚠️ {nov_reason}")

    # Weighted Sum
    raw_score = (
        weights.interest_weight * s_interest +
        weights.location_weight * s_loc +
        weights.activity_type_weight * s_type +
        weights.difficulty_weight * s_diff +
        weights.audience_weight * s_aud +
        weights.novelty_weight * s_nov
    )

    # Normalize to 0 - 100 percentage scale
    final_score = round(raw_score * 100, 1)

    if not reasons:
        reasons.append("General alignment with BNHS nature activities")

    return final_score, reasons
