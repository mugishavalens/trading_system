# AI Trading Mentor — Demo

A demo-scoped slice of the platform described in the project spec: register →
dashboard → AI recommendation → explain → paper trade → portfolio, plus
markets, portfolio analytics, an AI tutor, lessons, and an admin panel.
Everything uses virtual funds and synthetic market data — no real money, no
external API keys required.

## What's here

- **backend/** — FastAPI + SQLAlchemy, migrated with Alembic (SQLite by
  default). JWT auth with roles (`user`/`admin`) and account suspension, a
  synthetic OHLCV market data generator (BTC/USD, ETH/USD, SOL/USD, AAPL,
  TSLA), a technical-indicator engine (RSI/MACD/EMA/SMA/Bollinger/ATR), a
  rule-based AI decision engine with **live-tunable weights/thresholds**
  (BUY/SELL/HOLD + confidence + reasons), an optional Claude-powered
  plain-English explainer and chat tutor (both fall back to templates/FAQ if
  no API key is set), paper-trading + portfolio endpoints with equity history
  snapshots, a synthetic news feed with sentiment/impact scoring, a public
  contact endpoint, and an **AI Autopilot background loop** — an in-process
  asyncio task (started from the FastAPI lifespan) that trades on behalf of
  any user who's opted in.
- **frontend/** — Next.js (App Router) + TypeScript + Tailwind, dark
  navy/amber theme:
  - Landing page (with About and Contact), multi-step register, login —
    admins and regular users are routed to entirely separate areas on login.
  - **Dashboard** — live candlestick chart, AI recommendation card ("Explain
    Decision" / "Let AI Execute"), manual buy/sell, positions, trade history,
    and an AI Autopilot status banner.
  - **Markets** — all symbols with live sparklines; click through to trade.
  - **Portfolio** — equity curve, allocation breakdown, full trade history.
  - **AI Assistant** — chat tutor for trading concepts.
  - **Learn** — lessons grouped into Fundamentals/Indicators/Strategies tabs
    with quizzes; progress tracked in `localStorage`.
  - **News** — synthetic sentiment-scored headlines per symbol.
  - **Settings** — profile/risk-profile editing, password change, and the
    **AI Autopilot toggle** (with a plain-English explanation of exactly what
    it does).
  - **Admin Panel** (`/admin`, role-gated, no trading UI at all) — platform
    stats, AI performance by symbol, user management (suspend/reactivate,
    promote, delete), **AI Settings** (tune the indicator weights and
    autopilot confidence floor live), **Activity Log** (every trade,
    platform-wide), and **Messages** (Contact Us submissions).

Admin accounts are strictly for platform management: they hold no demo cash,
can't place trades (enforced server-side, not just hidden in the UI), and are
redirected away from the trading dashboard entirely. If you want to trade,
log in with (or register) a regular user account instead.

## Running it

**Backend**

```bash
cd backend
python -m venv venv
./venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
./venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
```

Migrations run automatically on startup (`alembic upgrade head`), and a super
admin account is seeded automatically if none exists yet.

Copy `.env.example` to `.env` if you want to set `ANTHROPIC_API_KEY` (enables
live Claude-generated trade explanations and open-ended AI Assistant chat —
optional; both fall back to deterministic templates/FAQ without it), or to
change the seeded admin credentials before first run.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. The frontend expects the API at
`http://127.0.0.1:8000` (see `frontend/.env.local`).

## Super admin credentials

Seeded automatically on first backend startup (see `backend/app/seed.py` /
`.env.example`):

```
email:    admin@aitradingmentor.demo
password: ChangeMe123!
```

**Change the password** (via `ADMIN_PASSWORD` in `backend/.env` before first
run, or by editing the account after) before this ever runs anywhere beyond
your own machine. Log in with these credentials and an "Admin Panel" link
appears in the sidebar.

## Deploying (for a stakeholder demo)

The backend needs a host that runs a persistent Python process — Netlify only
serves static sites/serverless functions, so it can host the frontend but not
FastAPI. Fastest free path:

**1. Backend → Render**

1. Go to [render.com](https://dashboard.render.com), sign in with GitHub, and
   pick **New → Blueprint**, selecting this repo. Render reads `render.yaml`
   at the repo root and creates the service automatically.
2. It'll prompt you for the two secrets marked `sync: false`: set
   `ADMIN_PASSWORD` to something you control, and leave `ANTHROPIC_API_KEY`
   blank unless you have one (the app works fine without it).
3. Deploy. Once live, copy the service URL Render gives you, e.g.
   `https://ai-trading-mentor-backend.onrender.com`.
4. In Render's dashboard → your service → **Environment**, update
   `CORS_ORIGINS` to include your Netlify URL once you have it (comma
   separated, no spaces), e.g.
   `https://your-site.netlify.app,http://localhost:3000`.

Free tier notes: the service spins down after inactivity, so the first
request after idling takes ~30-50s to wake up — normal for a demo, just don't
be alarmed by it live. The SQLite database also resets on redeploy (fine for
a demo; swap `DATABASE_URL` for a real Postgres instance later if you need
data to persist).

**2. Frontend → Netlify**

1. In Netlify, **Add new site → Import an existing project**, pick this repo.
   `netlify.toml` at the repo root already tells Netlify to build from
   `frontend/` — you shouldn't need to touch the build settings.
2. Before the first deploy (or after, then redeploy), go to **Site
   configuration → Environment variables** and add:
   `NEXT_PUBLIC_API_URL = https://ai-trading-mentor-backend.onrender.com`
   (your actual Render URL from step 1).
3. Deploy. Once you have the Netlify URL, go back to Render and finish step 4
   above so the backend accepts requests from it (otherwise you'll see CORS
   errors in the browser console on login/register).

That's the whole loop: Render URL → Netlify env var → Netlify URL → Render
env var. Once both sides know about each other, register a fresh account and
walk through the dashboard live.

## Not built yet

Deliberately out of scope for now: the strategy library and backtesting.
Add them incrementally on top of this base.
