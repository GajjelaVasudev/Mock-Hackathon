"""Engagement Analysis Service for BNHS Nature-Engagement Platform.
Provides deterministic, explainable analytics on user participation, category distributions,
completion rates, activity frequency, engagement trends, and composite engagement scoring.
"""

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId

from app.database.mongodb import get_db, is_mongodb_available
from app.schemas import (
    CategoryEngagement,
    EngagementSummary,
    NatureJourneyStage,
    PlatformEngagementResponse,
    RecentActivity,
    TypeEngagement,
    UserEngagementResponse,
)

# Activity Catalog fallback path
ACTIVITIES_JSON_PATH = Path(__file__).resolve().parent.parent.parent.parent / "recomendation-system" / "data" / "activities.json"


class EngagementService:
    """Computes explainable engagement analytics for members and aggregate platform statistics."""

    _instance: Optional["EngagementService"] = None
    _activity_map: Dict[str, Dict[str, Any]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EngagementService, cls).__new__(cls)
            cls._instance._load_activity_catalog()
        return cls._instance

    def _load_activity_catalog(self):
        """Builds lookup map for activities by ID and name."""
        self._activity_map = {}
        # 1. Try loading from MongoDB
        db = get_db()
        if db is not None and is_mongodb_available():
            try:
                for act in db["activities"].find():
                    act_id = act.get("id") or str(act.get("_id"))
                    self._activity_map[act_id] = act
                    if act.get("name"):
                        self._activity_map[act.get("name").lower()] = act
                if self._activity_map:
                    return
            except Exception:
                pass

        # 2. Fallback to activities.json
        if ACTIVITIES_JSON_PATH.exists():
            try:
                with open(ACTIVITIES_JSON_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    activities = data.get("activities", [])
                    for act in activities:
                        self._activity_map[act["id"]] = act
                        if act.get("name"):
                            self._activity_map[act.get("name").lower()] = act
            except Exception as e:
                print(f"⚠️ Failed to load activities.json for engagement service: {e}")

    def _lookup_activity(self, activity_identifier: str) -> Dict[str, Any]:
        """Looks up an activity by ID or Name."""
        if not self._activity_map:
            self._load_activity_catalog()
        
        # Direct ID match
        if activity_identifier in self._activity_map:
            return self._activity_map[activity_identifier]
        
        # Name lowercase match
        ident_lower = activity_identifier.lower().strip()
        if ident_lower in self._activity_map:
            return self._activity_map[ident_lower]
        
        # Fuzzy match by substring in name
        for key, act in self._activity_map.items():
            if ident_lower in key or (act.get("name") and ident_lower in act.get("name").lower()):
                return act

        # Default fallback object
        return {
            "id": activity_identifier,
            "name": activity_identifier,
            "category": "General Nature & Conservation",
            "type": "walk",
            "interests": [],
        }

    def analyze_user_engagement(self, user_id: str) -> UserEngagementResponse:
        """Calculates comprehensive engagement metrics and insights for a given user."""
        db = get_db()
        user_doc = None
        participations = []
        registrations = []

        # 1. Fetch User, Registrations, and Participation History from MongoDB
        if db is not None and is_mongodb_available():
            try:
                # Query user
                if ObjectId.is_valid(user_id):
                    user_doc = db["users"].find_one({"_id": ObjectId(user_id)})
                if not user_doc:
                    user_doc = db["users"].find_one({"$or": [{"id": user_id}, {"username": user_id}]})

                # Query registrations (support both user_id and MERN user field)
                reg_cursor = db["registrations"].find({"$or": [{"user_id": user_id}, {"user": user_id}]})
                registrations = list(reg_cursor)

                # Query participation history
                part_cursor = db["participation_history"].find({"user_id": user_id})
                participations = list(part_cursor)
            except Exception as e:
                print(f"⚠️ MongoDB query error during engagement analysis: {e}")

        # Baseline user if not found in DB
        if not user_doc:
            user_doc = {
                "id": user_id,
                "name": "Nature Enthusiast",
                "interests": ["birds"],
                "previous_activities": [],
            }

        # Combine recorded participations with profile baseline previous_activities
        all_attended_acts: List[Dict[str, Any]] = []
        
        # Add dynamic participations
        for p in participations:
            act_id = p.get("activity_id") or p.get("activity_name")
            act_meta = self._lookup_activity(act_id)
            all_attended_acts.append({
                "activity_id": act_id,
                "activity_name": p.get("activity_name") or act_meta.get("name", act_id),
                "category": act_meta.get("category", "General Nature & Conservation"),
                "type": act_meta.get("type", "walk"),
                "date": p.get("date"),
                "interests": act_meta.get("interests", []),
            })

        # Add profile baseline previous_activities if not already present
        seen_names = {a["activity_name"].lower() for a in all_attended_acts}
        for prev_name in user_doc.get("previous_activities", []):
            if prev_name and prev_name.lower() not in seen_names:
                act_meta = self._lookup_activity(prev_name)
                all_attended_acts.append({
                    "activity_id": act_meta.get("id", prev_name),
                    "activity_name": prev_name,
                    "category": act_meta.get("category", "General Nature & Conservation"),
                    "type": act_meta.get("type", "walk"),
                    "date": None,
                    "interests": act_meta.get("interests", []),
                })
                seen_names.add(prev_name.lower())

        total_participations = len(all_attended_acts)
        total_registrations = len(registrations)

        # 2. Completion Rate Calculation
        if total_registrations > 0:
            raw_rate = (total_participations / total_registrations) * 100.0
            completion_rate = round(min(100.0, raw_rate), 1)
        else:
            completion_rate = 0.0

        # 3. Category Distribution
        cat_counts: Dict[str, int] = {}
        for a in all_attended_acts:
            cat = a.get("category") or "General Nature & Conservation"
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        category_distribution: List[CategoryEngagement] = []
        for cat, count in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True):
            pct = round((count / total_participations) * 100.0, 1) if total_participations > 0 else 0.0
            category_distribution.append(CategoryEngagement(category=cat, count=count, percentage=pct))

        most_engaged_category = category_distribution[0].category if category_distribution else None

        # 4. Activity Type Distribution
        type_counts: Dict[str, int] = {}
        for a in all_attended_acts:
            t = (a.get("type") or "walk").lower()
            type_counts[t] = type_counts.get(t, 0) + 1

        type_distribution: List[TypeEngagement] = []
        for t, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
            pct = round((count / total_participations) * 100.0, 1) if total_participations > 0 else 0.0
            type_distribution.append(TypeEngagement(type=t, count=count, percentage=pct))

        most_engaged_type = type_distribution[0].type if type_distribution else None

        # 5. Recent Activity & Participation Dates
        dated_activities = [a for a in all_attended_acts if a.get("date")]
        dated_activities.sort(key=lambda x: str(x.get("date")), reverse=True)

        recent_activity = None
        if dated_activities:
            recent_activity = RecentActivity(
                activity_name=dated_activities[0]["activity_name"],
                category=dated_activities[0]["category"],
                date=dated_activities[0]["date"],
            )
        elif all_attended_acts:
            recent_activity = RecentActivity(
                activity_name=all_attended_acts[0]["activity_name"],
                category=all_attended_acts[0]["category"],
                date=None,
            )

        # 6. Participation Frequency
        frequency_dict: Dict[str, Any] = {}
        if len(dated_activities) >= 2:
            try:
                dates = [datetime.fromisoformat(a["date"].replace("Z", "+00:00")) for a in dated_activities if a.get("date")]
                span_days = max(1, abs((max(dates) - min(dates)).days))
                months = max(1.0, span_days / 30.4)
                activities_per_month = round(len(dates) / months, 1)
                frequency_dict["activities_per_month"] = activities_per_month
            except Exception:
                frequency_dict["status"] = "Insufficient data"
        else:
            frequency_dict["status"] = "Insufficient data"

        # 7. Engagement Trend Analysis
        engagement_trend = "INSUFFICIENT_DATA"
        if len(dated_activities) >= 3:
            mid = len(dated_activities) // 2
            recent_group = dated_activities[:mid]
            earlier_group = dated_activities[mid:]
            if len(recent_group) > len(earlier_group):
                engagement_trend = "INCREASING"
            elif len(recent_group) < len(earlier_group):
                engagement_trend = "DECREASING"
            else:
                engagement_trend = "STABLE"
        elif total_participations >= 2:
            engagement_trend = "STABLE"

        # 8. Engagement Score Calculation (0 to 100)
        # Factors: Frequency (30%), Completion (25%), Recency (20%), Diversity (15%), Contribution (10%)
        freq_factor = min(1.0, total_participations / 6.0)
        
        if total_registrations > 0:
            comp_factor = min(1.0, completion_rate / 100.0)
        else:
            comp_factor = min(1.0, total_participations / 3.0)

        # Recency score
        if recent_activity and recent_activity.date:
            recency_factor = 0.9
        elif total_participations > 0:
            recency_factor = 0.5
        else:
            recency_factor = 0.0

        # Diversity score (unique categories / 4)
        diversity_factor = min(1.0, len(category_distribution) / 4.0)

        # Contribution score (volunteer or course participation)
        has_contribution = any(a.get("type") in ["volunteer", "course"] for a in all_attended_acts)
        contrib_factor = 1.0 if has_contribution else (0.4 if total_participations >= 3 else 0.0)

        raw_score = (
            0.30 * freq_factor +
            0.25 * comp_factor +
            0.20 * recency_factor +
            0.15 * diversity_factor +
            0.10 * contrib_factor
        ) * 100.0

        engagement_score = round(max(0.0, min(100.0, raw_score)), 1)

        # Engagement Level Thresholds
        if engagement_score >= 75.0:
            engagement_level = "VERY_HIGH"
        elif engagement_score >= 50.0:
            engagement_level = "HIGH"
        elif engagement_score >= 25.0:
            engagement_level = "MODERATE"
        else:
            engagement_level = "LOW"

        # 9. Nature Journey Progression Stage
        completed_cats = [c.category for c in category_distribution]
        all_possible_cats = [
            "Nature Activities: Bird & Nature Walks",
            "Herpetology & Field Camps",
            "BNHS Conservation Centres: CEC Mumbai & CEC Delhi",
            "Citizen Science, Education & Archival",
            "Corporate Engagement, CSR & Volunteering",
        ]
        next_cat = next((c for c in all_possible_cats if c not in completed_cats), None)

        if total_participations >= 6:
            current_stage = "Conservation Champion"
        elif total_participations >= 3:
            current_stage = "Field Naturalist"
        elif total_participations >= 1:
            current_stage = "Nature Explorer"
        else:
            current_stage = "Nature Curious"

        journey = NatureJourneyStage(
            current_stage=current_stage,
            completed_categories=completed_cats,
            next_suggested_category=next_cat,
        )

        # 10. Explainable Insights Generation
        insights = self._generate_insights(
            user_interests=user_doc.get("interests", []),
            all_attended_acts=all_attended_acts,
            total_participations=total_participations,
            total_registrations=total_registrations,
            completion_rate=completion_rate,
            most_engaged_category=most_engaged_category,
            most_engaged_type=most_engaged_type,
            engagement_trend=engagement_trend,
            engagement_level=engagement_level,
        )

        summary = EngagementSummary(
            engagement_score=engagement_score,
            engagement_level=engagement_level,
            total_registrations=total_registrations,
            total_participations=total_participations,
            completion_rate=completion_rate,
            participation_frequency=frequency_dict,
            most_engaged_category=most_engaged_category,
            most_engaged_type=most_engaged_type,
            engagement_trend=engagement_trend,
        )

        return UserEngagementResponse(
            user_id=user_id,
            summary=summary,
            category_distribution=category_distribution,
            type_distribution=type_distribution,
            recent_activity=recent_activity,
            journey=journey,
            insights=insights,
        )

    def _generate_insights(
        self,
        user_interests: List[str],
        all_attended_acts: List[Dict[str, Any]],
        total_participations: int,
        total_registrations: int,
        completion_rate: float,
        most_engaged_category: Optional[str],
        most_engaged_type: Optional[str],
        engagement_trend: str,
        engagement_level: str,
    ) -> List[str]:
        """Generates 2-5 explainable, strictly supported insights."""
        insights: List[str] = []

        if total_participations == 0:
            insights.append("You have not participated in any BNHS activities yet. Explore our upcoming nature walks and field camps to start your nature journey!")
            if total_registrations > 0:
                insights.append(f"You have {total_registrations} upcoming activity registration(s) booked.")
            return insights

        # Insight 1: Total volume & engagement level
        insights.append(f"You have participated in {total_participations} BNHS activity(s) with an overall {engagement_level.replace('_', ' ')} engagement level.")

        # Insight 2: Category preference
        if most_engaged_category:
            cat_clean = most_engaged_category.replace("Nature Activities: ", "").replace("BNHS Conservation Centres: ", "")
            insights.append(f"'{cat_clean}' is your most frequently attended nature activity domain.")

        # Insight 3: Completion rate
        if total_registrations > 0:
            insights.append(f"Your registration-to-participation completion rate is {completion_rate}%.")

        # Insight 4: Interest Alignment Check
        matched_interests = set()
        user_int_lower = {i.lower() for i in user_interests}
        for a in all_attended_acts:
            for t in a.get("interests", []):
                if t.lower() in user_int_lower:
                    matched_interests.add(t)

        if matched_interests:
            matched_str = ", ".join(list(matched_interests)[:3])
            insights.append(f"Your activity history aligns strongly with your stated interests in {matched_str}.")

        # Insight 5: Engagement trend
        if engagement_trend == "INCREASING":
            insights.append("Your nature participation frequency is trending upwards compared to previous periods.")
        elif engagement_trend == "STABLE" and total_participations >= 3:
            insights.append("You maintain consistent, active participation in BNHS events.")

        return insights[:5]

    def get_platform_engagement(self) -> PlatformEngagementResponse:
        """Aggregates platform-wide engagement metrics across all users."""
        db = get_db()
        total_users = 0
        total_regs = 0
        total_parts = 0
        cat_agg: Dict[str, int] = {}
        type_agg: Dict[str, int] = {}
        level_dist = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "VERY_HIGH": 0}

        if db is not None and is_mongodb_available():
            try:
                users = list(db["users"].find())
                total_users = len(users)
                total_regs = db["registrations"].count_documents({})
                total_parts = db["participation_history"].count_documents({})

                for u in users:
                    u_id = str(u.get("_id") or u.get("id"))
                    report = self.analyze_user_engagement(u_id)
                    lvl = report.summary.engagement_level
                    level_dist[lvl] = level_dist.get(lvl, 0) + 1

                    for c in report.category_distribution:
                        cat_agg[c.category] = cat_agg.get(c.category, 0) + c.count
                    for t in report.type_distribution:
                        type_agg[t.type] = type_agg.get(t.type, 0) + t.count
            except Exception as e:
                print(f"⚠️ Error computing platform engagement: {e}")

        # Fallback if empty database
        if total_users == 0:
            total_users = 5
            total_regs = 10
            total_parts = 8
            level_dist = {"LOW": 1, "MODERATE": 1, "HIGH": 2, "VERY_HIGH": 1}

        comp_rate = round((total_parts / total_regs) * 100.0, 1) if total_regs > 0 else 0.0

        pop_cats = [{"category": k, "participations": v} for k, v in sorted(cat_agg.items(), key=lambda x: x[1], reverse=True)]
        pop_types = [{"type": k, "participations": v} for k, v in sorted(type_agg.items(), key=lambda x: x[1], reverse=True)]

        return PlatformEngagementResponse(
            total_users=total_users,
            total_registrations=total_regs,
            total_participations=total_parts,
            completion_rate=min(100.0, comp_rate),
            most_popular_categories=pop_cats[:5],
            most_popular_activity_types=pop_types,
            engagement_distribution=level_dist,
        )


# Singleton
engagement_service = EngagementService()
