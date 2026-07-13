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
FastAPI. Current setup: **Railway** for the backend, **Netlify** for the
frontend.

**1. Backend → Railway**

1. Go to [railway.app](https://railway.app), sign in with GitHub, **New
   Project → Deploy from GitHub repo**, pick this repo
   (`mugishavalens/trading_system`).
2. Open the new service → **Settings** → set **Root Directory** to `backend`.
   Leave the build settings alone — Railway auto-detects Python via
   `requirements.txt` and reads `backend/.python-version` (pinned to 3.11.9)
   automatically.
3. Still in **Settings**, set **Start Command** to:
   `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Go to the **Variables** tab and add:
   ```
   JWT_SECRET=<any random string, e.g. generate one with `openssl rand -hex 32`>
   DATABASE_URL=sqlite:///./trading_demo.db
   ADMIN_EMAIL=admin@aitradingmentor.demo
   ADMIN_PASSWORD=<pick something you control>
   ADMIN_FULL_NAME=Platform Admin
   CORS_ORIGINS=https://trade-with-ai.netlify.app,http://localhost:3000
   ```
   (Leave `ANTHROPIC_API_KEY` unset — it's optional.)
5. Deploy. Once it's running, go to **Settings → Networking → Public
   Networking** and click **Generate Domain** — Railway doesn't assign a
   public URL automatically. You'll get something like
   `https://ai-trading-mentor-backend-production.up.railway.app`.
6. Verify it's actually up: `curl https://<your-railway-url>/api/health`
   should return `{"status":"ok",...}`.

The SQLite database resets on redeploy (fine for a demo; swap `DATABASE_URL`
for a real Postgres instance later if you need data to persist).

**2. Frontend → Netlify**

1. In Netlify, **Add new site → Import an existing project**, pick this repo.
   `netlify.toml` at the repo root already tells Netlify to build from
   `frontend/` — you shouldn't need to touch the build settings.
2. **Site configuration → Environment variables** → add
   `NEXT_PUBLIC_API_URL = https://<your-railway-url>` (from step 1.6 above).
3. **Deploys → Trigger deploy → Deploy site** (env var changes need a
   redeploy to take effect on existing sites).

Once both sides know about each other (Railway's `CORS_ORIGINS` includes the
Netlify URL, Netlify's `NEXT_PUBLIC_API_URL` points at Railway), register a
fresh account and walk through the dashboard live.

<details>
<summary>Render (previous attempt, kept for reference)</summary>

`render.yaml` at the repo root still exists from an earlier attempt at
deploying the backend on Render. That path hit a couple of
platform-specific issues along the way (Render defaulting to an
incompatible Python version, then a startup crash that was still being
diagnosed when the Railway path was chosen instead). It's not the
currently recommended path, but the config is left in place in case it's
worth revisiting later.

</details>

## Not built yet

Deliberately out of scope for now: the strategy library and backtesting.
Add them incrementally on top of this base.
