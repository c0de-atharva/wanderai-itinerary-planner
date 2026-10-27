# ✈️ WanderAI — Personalized Travel Itinerary Planner

> A production-ready full-stack web application that generates customized AI-powered travel itineraries based on your preferences, budget, travel style, and group size.

[![Demo Mode](https://img.shields.io/badge/Demo%20Mode-Works%20Without%20API%20Key-green)](.) [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](.) [![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)](.) [![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-blue)](.)

---

## 🎯 Key Features

- **🤖 AI-Powered Itineraries** — Gemini AI generates geographically-clustered, budget-aware, day-by-day travel plans
- **🎭 Safe Demo Mode** — Runs fully out-of-the-box with a rich Mock AI Engine — no API key required
- **📱 Modern SaaS Dashboard** — Dark glassmorphism UI with sidebar navigation, trip library, and budget analytics
- **🔄 Day Regeneration** — Regenerate any single day's plan without changing the rest of the trip
- **✏️ Inline Editing** — Edit/delete/add activities with real-time cost recalculation
- **💾 Persistent Storage** — Supabase PostgreSQL (when configured) with automatic localStorage fallback
- **👥 Group Cost Splitting** — Per-person cost breakdown for group trips
- **🚀 One-Click Demo Scenarios** — Pre-loaded scenarios for instant testing

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Python FastAPI, Pydantic v2, python-dotenv |
| AI Engine | Google Gemini (`google-genai` SDK) + Mock Engine fallback |
| Database | Supabase (PostgreSQL) + In-Memory/localStorage fallback |
| Auth | Supabase Auth (optional) |

---

## 🚀 Quick Start (Demo Mode — No Keys Needed)

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+

### 1. Clone & Setup Backend

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy example env (no changes needed for demo mode)
cp .env.example .env

# Start the backend
uvicorn main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy example env (no changes needed for demo mode)
cp .env.example .env

# Start the frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 3. Open the App

Navigate to `http://localhost:5173` — you'll see the **"● Demo Mode"** indicator in the sidebar. Click any of the **Quick Load Scenario** buttons to instantly test the app!

---

## 🔑 Enabling Live Gemini AI Mode

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Edit `backend/.env`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Restart the backend — the indicator will switch to **"● Live AI Mode"**

---

## 🗄️ Enabling Supabase Persistence

1. Create a project at [supabase.com](https://supabase.com)
2. Run this SQL in your Supabase SQL editor:
   ```sql
   CREATE TABLE trips (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id TEXT,
     title TEXT,
     destination TEXT,
     trip_data JSONB NOT NULL,
     saved_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
3. Update `backend/.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key
   ```
4. Update `frontend/.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

---

## 🎭 Demo Scenarios

Use the **Quick Load** buttons in the Trip Builder to test these pre-configured scenarios:

### 🎒 Scenario 1: Solo Weekend Getaway
- **Destination:** Goa, India | **Duration:** 2-3 days
- **Budget:** Economy | **Pacing:** Fast
- **Interests:** Street Food, Sightseeing, Offbeat Spots

### 💕 Scenario 2: Couple's Romantic Retreat
- **Destination:** Santorini, Greece | **Duration:** 4-5 days
- **Budget:** Luxury | **Pacing:** Relaxed
- **Interests:** Scenic Views, Fine Dining, Hidden Gems

### 🏕️ Scenario 3: Group Adventure
- **Destination:** Manali, India | **Duration:** 5-7 days
- **Budget:** Moderate | **Group:** 5 friends
- **Interests:** Adventure, Culture, Nightlife

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + mode status |
| `POST` | `/api/itinerary/generate` | Generate full AI itinerary |
| `POST` | `/api/itinerary/regenerate-day` | Regenerate a single day |
| `POST` | `/api/trips/save` | Save a trip |
| `GET` | `/api/trips` | List saved trips |
| `DELETE` | `/api/trips/{id}` | Delete a trip |

Interactive API docs: `http://localhost:8000/docs`

---

## 📁 Project Structure

```
wanderai/
├── .gitignore              ← Root gitignore (blocks all secrets)
├── README.md
├── backend/
│   ├── .gitignore
│   ├── .env.example        ← Safe template (commit this)
│   ├── requirements.txt
│   ├── main.py             ← FastAPI app + routes
│   ├── schemas.py          ← Pydantic request/response models
│   ├── ai_service.py       ← Gemini AI + Mock Engine orchestrator
│   ├── mock_engine.py      ← Rich mock itinerary generator
│   └── database.py         ← Supabase + in-memory fallback
└── frontend/
    ├── .gitignore
    ├── .env.example        ← Safe template (commit this)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── AppContext.jsx
        ├── services/
        │   └── api.js
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── TripBuilder.jsx
        │   ├── ItineraryView.jsx
        │   ├── SavedTrips.jsx
        │   └── BudgetAnalytics.jsx
        └── components/
            ├── layout/
            │   ├── Sidebar.jsx
            │   └── Header.jsx
            └── ui/
                ├── LoadingSpinner.jsx
                ├── ModeIndicator.jsx
                ├── Toast.jsx
                ├── ActivityCard.jsx
                ├── DayTab.jsx
                ├── BudgetBar.jsx
                └── ScenarioCards.jsx
```

---

## 🔒 Security Practices

- ✅ All secrets loaded via environment variables only
- ✅ `.env` files blocked by `.gitignore` at root, backend, and frontend levels
- ✅ Only `.env.example` templates committed (with placeholder values)
- ✅ CORS restricted to localhost origins in development
- ✅ All inputs validated via Pydantic schemas
- ✅ Graceful fallback prevents 500 errors when keys missing
- ✅ No secrets in any `.js`, `.jsx`, `.ts`, `.tsx`, or `.py` source files

---

## 🧑‍💻 Development Notes

- Backend runs on port `8000`, frontend on `5173`
- Vite proxy forwards `/api/*` requests to the backend during development
- The app auto-detects mode on startup via `/api/health` endpoint
- In Demo Mode, a rich built-in Mock Engine generates realistic itineraries instantly
- All saved trips persist to localStorage (and Supabase when configured)

---

*Built with ❤️ using React, FastAPI, and Google Gemini AI*
