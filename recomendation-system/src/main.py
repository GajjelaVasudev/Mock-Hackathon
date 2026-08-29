"""BNHS Activity Recommendation CLI.
Interactive interface to demonstrate personalized activity recommendations
for demo profiles and custom user inputs.
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.activities_catalog import ActivitiesCatalog
from src.recommender import BNHSRecommender, RecommendationResult
from src.user_profile import DEMO_PROFILES, UserProfile

# ANSI Colors for terminal output
GREEN = "\033[92m"
BLUE = "\033[94m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    banner = f"""
{CYAN}{BOLD}╔══════════════════════════════════════════════════════════════════════╗
║               BOMBAY NATURAL HISTORY SOCIETY (BNHS)                  ║
║                  Activity Recommendation Engine                      ║
║                     Personalized Discovery                           ║
╚══════════════════════════════════════════════════════════════════════╝{RESET}
"""
    print(banner)


def display_recommendations(user: UserProfile, results: list[RecommendationResult]):
    print(f"\n{YELLOW}{BOLD}────────────────────────────────────────────────────────────────────────{RESET}")
    print(f"{BOLD}User Profile:{RESET} {CYAN}{user.name}{RESET}")
    print(f" • {BOLD}Age Group:{RESET} {user.age_group} | {BOLD}Location:{RESET} {user.location} | {BOLD}Experience:{RESET} {user.experience_level}")
    print(f" • {BOLD}Interests:{RESET} {', '.join(user.interests) if user.interests else 'General'}")
    print(f" • {BOLD}Preferred Type:{RESET} {user.preferred_activity_type or 'Any'}")
    if user.previous_activities:
        print(f" • {BOLD}Previous Activities:{RESET} {', '.join(user.previous_activities)}")
    print(f"{YELLOW}{BOLD}────────────────────────────────────────────────────────────────────────{RESET}")
    print(f"\n{GREEN}{BOLD}Top {len(results)} Recommended Activities for You:{RESET}\n")

    for idx, r in enumerate(results, 1):
        score_color = GREEN if r.score >= 80 else YELLOW
        print(f"{BOLD}{idx}. {r.activity.name}{RESET} — {score_color}{BOLD}{r.score}% Match{RESET}")
        print(f"   {BLUE}Category:{RESET} {r.activity.category} | {BLUE}Location:{RESET} {r.activity.location} | {BLUE}Type:{RESET} {r.activity.type.title()}")
        if r.activity.duration:
            print(f"   {BLUE}Duration:{RESET} {r.activity.duration} {f'| Distance: {r.activity.distance}' if r.activity.distance else ''}")
        print(f"   {BOLD}Why it's recommended:{RESET}")
        for reason in r.reasons:
            print(f"    ✓ {reason}")
        print()


def run_all_demos(recommender: BNHSRecommender, top_n: int = 5):
    print_banner()
    print(f"{BOLD}Running All 5 Curated Demo Profiles...{RESET}\n")

    for key, profile in DEMO_PROFILES.items():
        print(f"\n{CYAN}{BOLD}[Demo Profile {key}]{RESET}")
        results = recommender.recommend(profile, top_n=top_n)
        display_recommendations(profile, results)


def run_interactive(recommender: BNHSRecommender, top_n: int = 5):
    print_banner()
    print("Select a demo profile or create a custom one:")
    print(" 1. [Profile A] Beginner Birdwatcher from Mumbai")
    print(" 2. [Profile B] Wildlife Photographer")
    print(" 3. [Profile C] Student interested in Reptiles/Amphibians")
    print(" 4. [Profile D] Nature & Tree Enthusiast")
    print(" 5. [Profile E] Conservation Volunteer")
    print(" 6. [Custom] Create your own user profile")
    print(" 7. Run all demo profiles")
    print(" 0. Exit\n")

    choice = input(f"{BOLD}{CYAN}Select option (0-7): {RESET}").strip()

    if choice in ("1", "A", "a"):
        user = DEMO_PROFILES["A"]
    elif choice in ("2", "B", "b"):
        user = DEMO_PROFILES["B"]
    elif choice in ("3", "C", "c"):
        user = DEMO_PROFILES["C"]
    elif choice in ("4", "D", "d"):
        user = DEMO_PROFILES["D"]
    elif choice in ("5", "E", "e"):
        user = DEMO_PROFILES["E"]
    elif choice == "7":
        run_all_demos(recommender, top_n=top_n)
        return
    elif choice == "0":
        print("Goodbye!")
        return
    elif choice == "6":
        print(f"\n{YELLOW}{BOLD}Create Custom Profile:{RESET}")
        name = input("Enter your name: ").strip() or "Nature Enthusiast"
        age = input("Age group (student/youth/adult/senior) [adult]: ").strip() or "adult"
        location = input("Location (Mumbai/Navi Mumbai/Pune/Delhi) [Mumbai]: ").strip() or "Mumbai"
        interests_raw = input("Interests separated by comma (e.g. birds, photography, trees): ").strip()
        interests = [i.strip() for i in interests_raw.split(",") if i.strip()] or ["birds"]
        experience = input("Experience level (beginner/intermediate/expert) [beginner]: ").strip() or "beginner"
        act_type = input("Preferred activity type (walk/camp/course/volunteer/any) [walk]: ").strip() or "walk"
        prev_raw = input("Previous activities attended separated by comma (optional): ").strip()
        prev = [p.strip() for p in prev_raw.split(",") if p.strip()]

        user = UserProfile(
            name=name,
            age_group=age,
            location=location,
            interests=interests,
            experience_level=experience,
            preferred_activity_type=act_type if act_type != "any" else None,
            previous_activities=prev,
        )
    else:
        print("Invalid choice, defaulting to Demo Profile A.")
        user = DEMO_PROFILES["A"]

    results = recommender.recommend(user, top_n=top_n)
    display_recommendations(user, results)


def main():
    parser = argparse.ArgumentParser(description="BNHS Activity Recommendation CLI")
    parser.add_argument("--demo", type=str, choices=["A", "B", "C", "D", "E"], help="Run specific demo profile")
    parser.add_argument("--all-demos", action="store_true", help="Run all 5 demo profiles")
    parser.add_argument("--top-n", type=int, default=5, help="Number of recommendations to display (default: 5)")
    args = parser.parse_args()

    recommender = BNHSRecommender()

    if args.all_demos:
        run_all_demos(recommender, top_n=args.top_n)
    elif args.demo:
        profile = DEMO_PROFILES[args.demo.upper()]
        results = recommender.recommend(profile, top_n=args.top_n)
        display_recommendations(profile, results)
    else:
        run_interactive(recommender, top_n=args.top_n)


if __name__ == "__main__":
    main()
