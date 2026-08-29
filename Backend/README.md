# BNHS Nature-Engagement Platform — MERN Backend & Python AI Integration

The **MERN Backend (Node.js + Express + Mongoose)** acts as the API Gateway and orchestration layer connecting the React Frontend with the **Python FastAPI AI Microservice (Port 8000)** and **MongoDB Atlas**.

---

## 1. System Architecture

```
                    ┌─────────────────────────────┐
                    │    React Frontend (Vite)    │
                    │   (Port 5173 / Mobile-Ready)│
                    └──────────────┬──────────────┘
                                   │ (REST API /api/ai)
                                   ▼
                    ┌─────────────────────────────┐
                    │   MERN Express Gateway      │
                    │   (Backend/src/app.js)      │
                    └──────────────┬──────────────┘
                                   │ (Internal HTTP + Timeout)
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

## 2. Express AI Gateway Endpoints (`/api/ai`)

| Method | Express Route | Forwarded FastAPI Route | Description |
|---|---|---|---|
| `GET` | **`/api/ai/health`** | `GET /api/v1/health` | Real-time status of RAG, Recommender, and MongoDB |
| `POST` | **`/api/ai/chat/query`** | `POST /api/v1/chat/query` | Conversational RAG with multi-turn pronoun resolution |
| `GET` | **`/api/ai/chat/:sessionId/history`** | `GET /api/v1/chat/{session_id}/history` | Retrieves message history for a session |
| `DELETE` | **`/api/ai/chat/:sessionId`** | `DELETE /api/v1/chat/{session_id}` | Clears conversation memory for a session |
| `POST` | **`/api/ai/recommend`** | `POST /api/v1/recommend` | Top-5 activity recommendations with match reasons |
| `GET` | **`/api/ai/users/:userId/engagement`** | `GET /api/v1/users/{user_id}/engagement` | Member engagement score, completion %, and trends |
| `GET` | **`/api/ai/analytics/engagement`** | `GET /api/v1/analytics/engagement` | Aggregate platform statistics across all members |
| `GET` | **`/api/ai/activities`** | `GET /api/v1/activities` | 20 authentic activities with category & difficulty filters |

---

## 3. Environment Configuration

Create a `.env` file in `Backend/` based on `.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/BNHS
JWT_SECRET=your_jwt_secret_here

# Python FastAPI Microservice Gateway URL
PYTHON_API_URL=http://localhost:8000
AI_SERVICE_TIMEOUT_MS=15000
```

---

## 4. Running the MERN Backend

```bash
cd Backend
npm install
npm start
# or for development:
node server.js
```
