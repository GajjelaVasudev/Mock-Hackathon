# BNHS Activity Recommendation Engine (Phase 2)

A content-based and rule-based recommendation system designed to match users with authentic **Bombay Natural History Society (BNHS)** walks, nature camps, hybrid biodiversity courses, and volunteer opportunities.

---

## 1. Architecture & Flow

```
┌────────────────────────────────────────────────────────┐
│                   User Profile                         │
│ (interests, location, experience, type, history)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                BNHS Activity Catalog                   │
│ (20 authentic walks, camps, courses, volunteer tasks)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Candidate Filtering                      │
│ (optional strict filters: location, type, category)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Multi-Factor Match Scoring                  │
│ Interest (40%) + Location (20%) + Type (15%) +         │
│ Difficulty (10%) + Audience (10%) + Novelty (5%)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              Explainability Generation                 │
│ (compile natural language 'Why Recommended' reasons)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Top 5 Personalized Recommendations            │
│ (activity details + match score + transparent reasons) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
recomendation-system/
│
├── data/
│   └── activities.json         # 20 authentic BNHS activities extracted from knowledge base
│
├── src/
│   ├── __init__.py
│   ├── activities_catalog.py   # Activity data model & catalog querying/filtering
│   ├── user_profile.py         # UserProfile data model & 5 curated demo personas
│   ├── scoring.py              # Explainable weighted multi-factor scoring engine
│   ├── recommender.py          # BNHSRecommender orchestrator & JSON API entrypoint
│   └── main.py                 # Interactive CLI & batch demo runner
│
├── tests/
│   └── test_recommender.py     # 11 unit tests covering all matching scenarios
│
├── requirements.txt            # Minimal lightweight dependencies
└── README.md                   # System documentation & presentation guide
```

---

## 3. The Dataset (`data/activities.json`)

All 20 activities are sourced strictly from the official **BNHS Master Knowledge Base**:
- **Bird & Nature Walks**: Vetal Tekdi Bird Walk, SGNP Bird Monitoring, Flamingo Watch at TS Chanakya, Flamingo & Bird Walk at NRI Pond.
- **Tree, Marine & Urban Biodiversity**: Heritage Tree Walk at Kala Ghoda, Marine Walk at Juhu Beach, Marine Drive Tree Walk, Know Your Trees Trail.
- **BNHS Nature Reserve**: Monsoon Walk at CEC Goregaon, Stream Walk & Forest Exploration, Walk in the Woods Member Trails, Butterfly Festival.
- **Field Camps**: Matheran Herpetofauna Camp, Amboli Herpetology Camp.
- **Courses & Education**: Hybrid Certificate Courses in Biodiversity & Ornithology, CEC Delhi Jungle Walk, e-Mammal India Student Citizen Science.
- **Volunteering & CSR**: BNHS-SEVA Volunteer Program, Bird-Ringing AI Digitisation, Corporate CSR Tree Plantation & Bund-Building.

### Schema:
```json
{
  "id": "bnhs_flamingo_watch_chanakya",
  "name": "Flamingo Watch at TS Chanakya",
  "category": "Nature Activities: Bird & Nature Walks",
  "location": "Navi Mumbai",
  "interests": ["birds", "flamingos", "wetlands", "photography", "wildlife observation"],
  "difficulty": "easy",
  "audience": ["birdwatchers", "photographers", "families", "students", "beginners"],
  "duration": "2 hours",
  "distance": "1.5 km",
  "description": "Flamingo and wetland bird observation at TS Chanakya wetlands focusing on flamingo feeding behaviors and wetland ecology.",
  "species": ["Lesser Flamingo", "Greater Flamingo", "wetland birds"],
  "type": "walk"
}
```

---

## 4. Multi-Factor Scoring Formula

The engine computes a normalized composite score from **0 to 100%**:

$$\text{Final Score} = \left( \sum_{k} w_k \times S_k \right) \times 100$$

| Factor ($k$) | Weight ($w_k$) | Description |
|---|:---:|---|
| **Interest Alignment ($S_{\text{interest}}$)** | **40%** | Semantic and keyword overlap against user interests, activity tags, species, and descriptions. |
| **Location Proximity ($S_{\text{location}}$)** | **20%** | Proximity match (direct city match, Mumbai Metropolitan Region compatibility, or remote/online). |
| **Activity Type ($S_{\text{type}}$)** | **15%** | Format alignment (`walk`, `camp`, `course`, `volunteer`). |
| **Experience Compatibility ($S_{\text{diff}}$)** | **10%** | Aligns beginner/intermediate/expert users with suitable difficulty ratings. |
| **Audience Compatibility ($S_{\text{aud}}$)** | **10%** | Tailors programs for students, youth, general public, or corporate members. |
| **Novelty / Anti-Repeat ($S_{\text{nov}}$)** | **5%** | Penalizes previously attended activities to surface fresh recommendations. |

---

## 5. Curated Demo Personas

The system includes 5 predefined personas for live hackathon demonstrations:

1. **Profile A — Beginner Birdwatcher (Aarav Sharma)**
   - *Location*: Mumbai | *Interests*: Birds, Birdwatching, Wetlands | *Type*: Walk | *Level*: Beginner
2. **Profile B — Wildlife Photographer (Priya Nair)**
   - *Location*: Mumbai | *Interests*: Photography, Reptiles, Amphibians, Butterflies | *Type*: Camp | *Level*: Intermediate
3. **Profile C — Student Herpetology Enthusiast (Rohan Deshmukh)**
   - *Location*: Maharashtra | *Interests*: Reptiles, Amphibians, Herpetology, Night Trails | *Type*: Camp | *Level*: Intermediate
4. **Profile D — Nature & Tree Enthusiast (Meera Kulkarni)**
   - *Location*: Mumbai | *Interests*: Trees, Botany, Urban Biodiversity, City Heritage | *Type*: Walk | *Level*: Beginner
5. **Profile E — Conservation Volunteer (Siddharth Mehta)**
   - *Location*: Mumbai | *Interests*: Volunteering, Conservation, Citizen Science, AI Digitisation | *Type*: Volunteer | *Level*: Beginner

---

## 6. How to Run

Navigate to `recomendation-system/`:
```bash
cd recomendation-system
```

### 1. Interactive CLI Mode
```bash
python3 src/main.py
```
*Choose any of the 5 demo profiles or input your own custom user preferences.*

### 2. Run All 5 Demo Profiles in Batch
```bash
python3 src/main.py --all-demos
```

### 3. Run a Specific Demo Profile
```bash
python3 src/main.py --demo A
python3 src/main.py --demo C
```

### 4. Run the Unit Test Suite
```bash
PYTHONPATH=. python3 -m unittest discover -s tests -p "test_*.py" -v
```

---

## 7. Example Output with Transparent Explanations

```text
User Profile: Aarav Sharma (Beginner Birdwatcher)
 • Age Group: adult | Location: Mumbai | Experience: beginner
 • Interests: birds, birdwatching, wetlands, nature walks
 • Preferred Type: walk
 • Previous Activities: BNHS Awareness Bird Walk at Vetal Tekdi

Top 5 Recommended Activities for You:

1. Flamingo Watch at TS Chanakya — 94.0% Match
   Category: Nature Activities: Bird & Nature Walks | Location: Navi Mumbai | Type: Walk
   Duration: 2 hours | Distance: 1.5 km
   Why it's recommended:
    ✓ Matches your interest in birds, birdwatching, wetlands
    ✓ Located in Navi Mumbai (within the Mumbai Metropolitan Region)
    ✓ Matches your preferred activity format (walk)
    ✓ Beginner-friendly and easy-paced

2. Flamingo & Bird Walk at NRI Pond — 94.0% Match
   Category: Nature Activities: Bird & Nature Walks | Location: Navi Mumbai | Type: Walk
   Duration: 2 hours | Distance: 2 km
   Why it's recommended:
    ✓ Matches your interest in birds, birdwatching, wetlands
    ✓ Located in Navi Mumbai (within the Mumbai Metropolitan Region)
    ✓ Matches your preferred activity format (walk)
    ✓ Beginner-friendly and easy-paced

3. Walk in the Woods Monthly Member Trails — 86.0% Match
   Category: Member Walks & Nature Exploration | Location: Mumbai | Type: Walk
   Duration: 2 hours | Distance: 2 km
   Why it's recommended:
    ✓ Matches your interest in birds, nature walks
    ✓ Located in Mumbai (direct match with your location)
    ✓ Matches your preferred activity format (walk)
    ✓ Beginner-friendly and easy-paced
```

---

## 8. Extensibility & Future API Integration

The recommendation engine is built around a single functional entry point for future **FastAPI** / **Express** backend integration:

```python
from src.recommender import recommend

# JSON request from Frontend -> FastAPI -> recommend()
results = recommend({
    "name": "Jane Doe",
    "location": "Mumbai",
    "interests": ["reptiles", "photography"],
    "experience_level": "intermediate",
    "preferred_activity_type": "camp"
}, top_n=5)
```

### Roadmap to Next Phases:
- **Phase 3 (FastAPI Layer)**: Expose `/api/v1/recommend` alongside `/api/v1/rag/query`.
- **Phase 4 (MERN Frontend)**: Render interactive recommendation cards with filters, direct walk booking links, and AI chat explanation modals.
