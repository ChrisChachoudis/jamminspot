# Jamminspot

Musician discovery, matching and collaboration app — find people to Jam
with based on instruments, genres, goals and location, then chat and
collaborate. AI features (bio builder, icebreakers) via Gemini.

**Live:** https://stalwart-dolphin-f354c2.netlify.app
**API:** https://jamminspot.onrender.com

## Structure

- `backend/` — Node.js + Express API, MongoDB (Mongoose), JWT auth, Gemini AI
- `frontend/` — React + Vite, Tailwind-style CSS
- `tools/` — local MongoDB binaries + dev startup scripts (gitignored)

## Running locally

Easiest way — double-click `tools/start-dev.bat` (or run
`tools/start-dev.ps1` in PowerShell). It starts MongoDB, the backend and
the frontend each in their own window, then opens the app in your browser.

### Manual setup

**MongoDB** — `tools/start-mongo.ps1` (portable local instance, no install
needed), or point `MONGODB_URI` in `backend/.env` at a MongoDB Atlas cluster.

**Backend**
```bash
cd backend
npm install
npm run dev
```
Runs on `http://localhost:5000`. Config in `backend/.env` (copy from
`.env.example` — needs `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`).

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

## Deployment

Auto-deploys from the `master` branch on every push:
- **Frontend** → Netlify (build: `npm run build` in `frontend/`, publishes `frontend/dist`)
- **Backend** → Render (root dir `backend/`, `npm install` / `npm start`)
- **Database** → MongoDB Atlas (free M0 cluster)

To ship a change: commit and `git push` — both services redeploy automatically
within a couple of minutes. No manual dashboard steps needed.

⚠️ Render's free tier has an ephemeral disk — uploaded photos
(`backend/uploads/`) can be lost on redeploy/restart. Fine for testing;
would need external storage (e.g. Cloudinary) for real persistence.

## Core flow implemented so far

- Register / Login (JWT, `jammin_token`)
- Onboarding: Location (country/city autocomplete) → Specialty → Goals →
  Genres → AI-assisted Bio → Media gallery
- Discover: profile card with photo, compatibility score, Skip / Message / Jam
- Jams tab: incoming Jam requests — accept (✓) or reject (✕)
- Friends tab: mutual connections, click through to full profile
- Messaging: 3-pane (conversations / chat / profile), AI icebreaker
  suggestions, Premium-gated DMs to non-friends
- Profile: photo management, pick which photo is your profile picture
- AI features: bio generation and message icebreakers via Gemini

## Not built yet

- Premium billing, credits, donations
- Audio analysis, Build My Band, other advanced AI features from the roadmap
- Real-time messaging (currently poll/fetch, no websockets yet)
- Persistent photo storage on the free hosting tier
