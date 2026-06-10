# Aurora AI Health Companion

A production-quality, full-stack AI-powered health tracking platform built with React, Node.js, Express, PostgreSQL, and Groq/Gemini AI.

![Aurora Health](frontend/public/favicon.svg)

## Features

- **Smart Dashboard** — Health score, AI insights, weekly trends, achievements
- **Hydration Tracking** — Animated water bottle, quick-add, weekly reports
- **Sleep Tracking** — Logging, consistency score, weekly/monthly analytics
- **Habit Tracking** — Create/edit habits, streaks, daily completion
- **Nutrition Tracking** — Meal logging, macros, calorie dashboard
- **AI Health Companion** — Chat with voice input/output, function-calling actions
- **Premium Onboarding** — 8-step flow collecting profile, lifestyle, goals, and notification prefs
- **Health Data Setup** — Goals, first habit, and tracking method (Manual, Fitbit, Apple Health, Garmin, Health Connect)
- **Health Memory System** — Auto-stores hydration, sleep, habit, and nutrition behavior patterns in PostgreSQL
- **Aurora Knows You** — Personalized AI insights page with glassmorphism cards and charts
- **Analytics** — Beautiful charts, PDF export
- **Achievements & Notifications** — Badges, milestones, reminders
- **PWA Support** — Installable progressive web app
- **Dark/Light Mode** — Premium glassmorphism UI

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts, React Query, Zustand, Axios |
| Backend | Node.js, Express, JWT, Prisma ORM |
| Database | PostgreSQL |
| AI | Groq (Llama 3.3) / Google Gemini |

## Project Structure

```
Project Aurora/
├── backend/
│   ├── prisma/schema.prisma    # Database schema
│   ├── src/
│   │   ├── config/             # App & DB config
│   │   ├── middleware/         # Auth, error handling
│   │   ├── routes/             # REST API routes
│   │   ├── services/           # Business logic & AI
│   │   └── server.js           # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route pages
│   │   ├── layouts/            # Dashboard layout
│   │   ├── services/           # API client
│   │   └── store/              # Zustand state
│   └── package.json
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **Groq API Key** (free at [console.groq.com](https://console.groq.com)) or **Gemini API Key** (free at [aistudio.google.com](https://aistudio.google.com))

## Installation

### 1. Clone and install dependencies

```bash
cd "Project Aurora"

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/aurora_health?schema=public"
JWT_SECRET=your-super-secret-jwt-key
GROQ_API_KEY=your-groq-api-key
AI_PROVIDER=groq
FRONTEND_URL=http://localhost:5173
```

### 3. Set up the database

```bash
# Create PostgreSQL database
createdb aurora_health

# Push schema & generate client
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Start development servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Email signup |
| POST | `/api/auth/login` | Email login |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/forgot-password` | Password reset |
| GET | `/api/dashboard` | Dashboard data |
| POST | `/api/water` | Log water |
| POST | `/api/sleep` | Log sleep |
| CRUD | `/api/habits` | Habit management |
| POST | `/api/nutrition` | Log meal |
| POST | `/api/ai/chat` | AI chat with actions |
| GET | `/api/analytics` | Analytics data |
| GET | `/api/analytics/report/pdf` | Export PDF report |
| GET | `/api/onboarding/status` | Onboarding & profile completion status |
| POST | `/api/onboarding/complete` | Save onboarding data |
| POST | `/api/onboarding/health-setup` | Health data setup |
| GET | `/api/health-memory/insights` | Personalized health memories |
| POST | `/api/health-memory/refresh` | Regenerate behavior patterns |

## AI Function Calling

Aurora AI automatically executes actions from natural language:

| User says | AI action |
|-----------|-----------|
| "I drank 500ml water" | Logs hydration |
| "I slept 7 hours" | Logs sleep |
| "Create a habit to meditate" | Creates habit |
| "I had a 500 cal lunch" | Logs nutrition |

## Deployment

### Backend (Railway / Render / Fly.io)

1. Set environment variables from `.env.example`
2. Run `npm run db:push && npm start`
3. Ensure PostgreSQL addon is connected

### Frontend (Vercel / Netlify)

1. Build: `npm run build`
2. Set `VITE_API_URL` or configure proxy to backend
3. Deploy `dist/` folder

### Database

Use managed PostgreSQL (Supabase, Neon, Railway) and update `DATABASE_URL`.

## Google OAuth (Optional)

1. Create project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Sign-In API
3. Add `GOOGLE_CLIENT_ID` to backend `.env`
4. Add Google Sign-In button to frontend login page

## Deployment
Frontend: https://aurora-ai-health-companion.vercel.app/
Backend: https://aurora-backend-lkgd.onrender.com
Database: https://console.neon.tech/

## License

MIT
