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
  rule-based AI decision engine (BUY/SELL/HOLD + confidence + reasons), an
  optional Claude-powered plain-English explainer and chat tutor (both fall
  back to templates/FAQ if no API key is set), paper-trading + portfolio
  endpoints with equity history snapshots, and an admin router (user
  management, platform stats, AI performance by symbol).
- **frontend/** — Next.js (App Router) + TypeScript + Tailwind, dark
  navy/amber theme:
  - Landing page, multi-step register, login.
  - **Dashboard** — live candlestick chart, AI recommendation card ("Explain
    Decision" / "Let AI Execute"), manual buy/sell, positions, trade history.
  - **Markets** — all symbols with live sparklines; click through to trade.
  - **Portfolio** — equity curve, allocation breakdown, full trade history.
  - **AI Assistant** — chat tutor for trading concepts.
  - **Learn** — short lessons with quizzes; progress tracked in
    `localStorage`.
  - **Admin Panel** (`/admin`, role-gated) — platform-wide stats, AI
    performance by symbol, user management (suspend/reactivate, promote to
    admin, delete).

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

## Not built yet

Deliberately out of scope for now: the strategy library, news/sentiment
ingestion, and backtesting (the sidebar shows News/Settings as disabled
placeholders). Add them incrementally on top of this base.
