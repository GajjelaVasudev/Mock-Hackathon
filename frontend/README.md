# Bombay Natural History Society (BNHS) — Nature-Engagement Platform Frontend (Phase 4)

A modern, responsive **React + TypeScript + Vite** web application connecting directly to the **FastAPI Backend (Port 8000)** for Grounded RAG AI Assistant, Personalized Activity Recommendations, Structured Catalog Discovery, User Profiles, Registrations, and Participation Tracking.

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
  │   RAG Service Wrapper   │                   │  Recommendation Engine  │
  │    (ChromaDB + OpenRTR) │                   │  (MongoDB Dynamic Data) │
  └─────────────────────────┘                   └─────────────────────────┘
```

---

## 2. Pages & Features

| Route | Page | Purpose | FastAPI Endpoints Consumed |
|---|---|---|---|
| `/` | **Home** | Hero section, conservation highlights, featured activities, and AI assistant CTA | `GET /api/v1/activities`, `GET /api/v1/health` |
| `/activities` | **Explore** | Searchable & filterable 20-activity catalog with format/location/difficulty filters | `GET /api/v1/activities?type=...` |
| `/activities/:id` | **Activity Details** | Full wildlife metadata, trail length, focal species, and 1-click registration | `GET /api/v1/activities`, `POST /api/v1/registrations` |
| `/recommendations` | **Recommendations** | Multi-factor content & rule-based matches with match percentage & reasons | `POST /api/v1/recommend` |
| `/assistant` | **AI Assistant** | Grounded chatbot with suggested quick questions & exact page citations | `POST /api/v1/chat/query` |
| `/profile` | **Profile & Interests** | Manage location, experience level, and toggle nature interest tags in MongoDB | `GET/POST/PUT /api/v1/users` |
| `/dashboard` | **Member Dashboard** | Overview of upcoming bookings, completed activities, and recommendations | `POST /api/v1/recommend`, `GET /api/v1/users/...` |
| `/my-activities` | **My Activities** | View bookings, completed history, and log new participation (anti-repeat) | `POST /api/v1/users/.../participation` |
| `/volunteer` | **BNHS-SEVA** | Information on volunteering, AI bird-ringing digitisation, and archives | Documented knowledge from Page 13 |

---

## 3. Getting Started

### 1. Start the FastAPI Backend
Ensure the FastAPI backend is running on port 8000:
```bash
cd backend-api
uvicorn app.main:app --reload --port 8000
```

### 2. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 4. Demo Personas for Evaluation

In the top navigation bar, use the persona dropdown to instantly test personalized scoring across different nature enthusiasts:

1. 🦅 **Aarav Sharma** (Student, Mumbai) — Interested in birding, wetlands, photography. Ranks TS Chanakya and NRI Flamingo walks highest.
2. 🌳 **Priya Iyer** (Senior, Mumbai) — Interested in botany and avenue trees. Ranks Marine Drive Tree Walk and CEC Monsoon Trails highest.
3. 🦎 **Rohan Deshmukh** (Youth, Maharashtra) — Interested in reptiles and herpetology. Ranks Matheran and Amboli field camps highest.
4. 🤝 **Siddharth Mehta** (Student, Mumbai) — Interested in citizen science and volunteering. Ranks AI Bird-Ringing Digitisation and BNHS-SEVA highest.
5. 🦋 **Neha Verma** (Adult, Delhi) — Located in Delhi. Ranks CEC Delhi Asola Bhatti butterfly walks and e-Mammal citizen science highest.
