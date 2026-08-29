# Bombay Natural History Society (BNHS) — FastAPI Backend Service with MongoDB, Conversational RAG & Engagement Analytics

A production-ready **FastAPI Backend Integration** unifying:
1. **Conversational RAG Pipeline**: Multi-turn chat memory, query contextualization / pronoun resolution (`it`, `they`, `these`), ChromaDB vector store, and grounded OpenRouter generation with citations.
2. **Personalized Recommendation Engine**: Content-based & rule-based weighted matching with explainable reasons.
3. **Engagement Analysis Module (Phase 5)**: Explainable member participation metrics, completion rates, category distributions, composite engagement scoring (0-100), engagement levels, participation trends, and aggregate platform statistics.
4. **MongoDB Dynamic Persistence**: Users, Activities, Participation History (novelty penalty), Registrations, and Conversation History.

---

## 1. System Architecture

```
                    ┌─────────────────────────────┐
                    │    React Frontend (Vite)    │
                    │   (Port 5173 / Mobile-Ready)│
                    └──────────────┬──────────────┘
                                   │ (HTTP / REST API)
                                   ▼
                    ┌─────────────────────────────┐
                    │     FastAPI Backend API     │
                    │     (Port 8000 /docs)       │
                    └──────┬───────────────┬──────┘
                           │               │
            ┌──────────────┘               └──────────────┐
            ▼                                             ▼
  ┌─────────────────────────┐                   ┌─────────────────────────┐
  │   Conversational RAG    │                   │   Engagement Service    │
  │ ├── Session Memory Store│                   │ ├── User Participation  │
  │ ├── LLM Query Rewriter  │                   │ ├── Completion Rate %   │
  │ └── ChromaDB + Citations│                   │ ├── Category & Format   │
  └─────────────────────────┘                   │ ├── Composite Score     │
                                                │ └── Nature Journey Tier │
                                                └────────────┬────────────┘
                                                             │
                                                             ▼
                                                ┌─────────────────────────┐
                                                │   MongoDB Atlas (BNHS)  │
                                                │ ├── users               │
                                                │ ├── activities (20 acts)│
                                                │ ├── participation_hist  │
                                                │ ├── registrations       │
                                                │ └── conversations       │
                                                └─────────────────────────┘
```

---

## 2. Engagement Analysis Metrics & Formula

### Difference Between Recommendation & Engagement
- **Recommendation Engine**: *"Which activity should the user participate in next?"* (predictive matching)
- **Engagement Analysis**: *"How has the user interacted with BNHS so far?"* (historical & explainable analytics)

### Composite Engagement Score Formula (0–100)
The Engagement Score is a deterministic composite index evaluating 5 normalized factors:

$$\text{Engagement Score} = \left( 0.30 \times F + 0.25 \times C + 0.20 \times R + 0.15 \times D + 0.10 \times V \right) \times 100$$

1. **Participation Volume / Frequency ($F$, 30%)**: $\min(1.0, \frac{\text{total\_participations}}{6.0})$
2. **Registration-to-Participation Completion Rate ($C$, 25%)**: $\frac{\text{completion\_rate}}{100.0}$
3. **Recency ($R$, 20%)**: Based on latest recorded activity date (0.9 if recent, 0.5 if historical, 0.0 if none).
4. **Category Diversity ($D$, 15%)**: $\min(1.0, \frac{\text{unique\_categories}}{4.0})$
5. **Contribution / Volunteering ($V$, 10%)**: 1.0 if completed volunteer or course activities, else 0.4 if $\ge 3$ activities.

### Engagement Level Thresholds
- **`75 – 100`**: `VERY_HIGH`
- **`50 – 74`**: `HIGH`
- **`25 – 49`**: `MODERATE`
- **`0 – 24`**: `LOW`

### Nature Journey Milestones
- **`0 activities`**: *Nature Curious*
- **`1 – 2 activities`**: *Nature Explorer*
- **`3 – 5 activities`**: *Field Naturalist*
- **`6+ activities`**: *Conservation Champion*

---

## 3. Engagement & Platform API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | **`/api/v1/users/{user_id}/engagement`** | User engagement report (metrics, score, completion %, category distribution, trend, insights) |
| `GET` | **`/api/v1/analytics/engagement`** | Platform-wide aggregate statistics, popular categories, and member tier distributions |
| `POST` | **`/api/v1/chat/query`** | Conversational Q&A (accepts `session_id` & `query`, returns `rewritten_query`, `answer`, `sources`) |
| `GET` | **`/api/v1/chat/{session_id}/history`** | Retrieves message history for the session |
| `DELETE` | **`/api/v1/chat/{session_id}`** | Clears conversation history for the session |
| `GET` | **`/api/v1/health`** | Real-time health status of RAG, Recommender, and MongoDB |
| `POST` | **`/api/v1/recommend`** | Top-5 personalized recommendations by `user_id` or profile payload |
| `GET` | **`/api/v1/activities`** | 20 authentic activities from MongoDB with filters |
| `POST` | **`/api/v1/users`** | Create dynamic user profile in MongoDB |
| `GET` | **`/api/v1/users/{user_id}`** | Retrieve user profile |
| `PUT` | **`/api/v1/users/{user_id}`** | Update user profile |
| `POST` | **`/api/v1/users/{user_id}/participation`** | Record completed activity (triggers anti-repeat scoring) |
| `GET` | **`/api/v1/users/{user_id}/participation`** | Get user's completed activity history |
| `POST` | **`/api/v1/registrations`** | Register user for an upcoming activity |
| `GET` | **`/api/v1/users/{user_id}/registrations`** | Get user's registrations |

---

## 4. Example User Engagement Response

```json
{
  "user_id": "66d01234567890abcdef1234",
  "summary": {
    "engagement_score": 82.0,
    "engagement_level": "VERY_HIGH",
    "total_registrations": 4,
    "total_participations": 3,
    "completion_rate": 75.0,
    "participation_frequency": {
      "activities_per_month": 1.1
    },
    "most_engaged_category": "Herpetology & Field Camps",
    "most_engaged_type": "camp",
    "engagement_trend": "INCREASING"
  },
  "category_distribution": [
    {
      "category": "Herpetology & Field Camps",
      "count": 1,
      "percentage": 33.3
    },
    {
      "category": "Nature Activities: Bird & Nature Walks",
      "count": 1,
      "percentage": 33.3
    },
    {
      "category": "Corporate Engagement, CSR & Volunteering",
      "count": 1,
      "percentage": 33.3
    }
  ],
  "type_distribution": [
    {"type": "camp", "count": 1, "percentage": 33.3},
    {"type": "walk", "count": 1, "percentage": 33.3},
    {"type": "volunteer", "count": 1, "percentage": 33.3}
  ],
  "recent_activity": {
    "activity_name": "Matheran Herpetofauna Camp",
    "category": "Herpetology & Field Camps",
    "date": "2026-08-25"
  },
  "journey": {
    "current_stage": "Field Naturalist",
    "completed_categories": [
      "Herpetology & Field Camps",
      "Nature Activities: Bird & Nature Walks",
      "Corporate Engagement, CSR & Volunteering"
    ],
    "next_suggested_category": "BNHS Conservation Centres: CEC Mumbai & CEC Delhi"
  },
  "insights": [
    "You have participated in 3 BNHS activity(s) with an overall VERY HIGH engagement level.",
    "'Herpetology & Field Camps' is your most frequently attended nature activity domain.",
    "Your registration-to-participation completion rate is 75.0%.",
    "Your activity history aligns strongly with your stated interests in reptiles, amphibians.",
    "Your nature participation frequency is trending upwards compared to previous periods."
  ]
}
```

---

## 5. Running Automated Tests

```bash
cd backend-api
PYTHONPATH=. python3 -m unittest discover -s tests -p "test_*.py" -v
```

*All 15 unit and integration tests pass with 100% success:*
- Engagement analysis with zero activities, single activity, and multi-category histories
- Completion rate calculation and division-by-zero resilience
- Category and Activity type breakdowns
- Date frequency and trend calculations
- Conversational RAG multi-turn pronoun resolution & session isolation
- MongoDB user lifecycle, participation history, and registrations
