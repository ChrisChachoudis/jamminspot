# Jamminspot

Musician discovery, matching and collaboration app. Tinder-style Discover
+ compatibility scoring + Jams + messaging, with room for AI features
layered on top (see `docs/architecture.md`).

## Structure

- `backend/` — Node.js + Express API, MongoDB (Mongoose), JWT auth
- `frontend/` — React + Vite + Tailwind CSS

## Running locally

### 1. MongoDB

You need a MongoDB instance. Easiest option with Docker:

```bash
docker run -d --name jamminspot-mongo -p 27017:27017 mongo:7
```

Or point `MONGODB_URI` in `backend/.env` at a MongoDB Atlas cluster.

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:5000`. Config lives in `backend/.env` (copied
from `.env.example`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Core flow implemented so far

- Register / Login (JWT, `jammin_token`)
- Onboarding: Instruments/Specialty → Goals → Genres → Gallery
- Discover: profile card, Like / Skip / Jam / Message / Rewind
- Compatibility score ("Jam Match %") — plain scoring engine, no AI yet
- Jams board (mutual likes)
- Messaging: 3-pane (conversations / active chat / profile context),
  weekly free-tier limit on new direct messages to unmatched users

## Not built yet (see the product brief for full roadmap)

- Media/gallery uploads, Spotify/YouTube links
- Premium billing, credits, donations
- AI features (profile builder, icebreakers, audio analysis, Build My
  Band, etc.) — planned as a separate service layer, not baked into core
  request paths
- Real-time messaging (currently poll/fetch, no websockets yet)
