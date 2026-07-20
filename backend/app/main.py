import asyncio
import datetime
import traceback
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .autopilot import autopilot_loop
from .config import settings
from .monitor import monitor_loop
from .routers import (
    admin,
    ai,
    alerts,
    assistant,
    auth,
    contact,
    market,
    news,
    notifications,
    orders,
    portfolio,
    trading,
    watchlist,
)
from .seed import seed_admin_user, seed_ai_config

BACKEND_DIR = Path(__file__).resolve().parent.parent

START_TIME = datetime.datetime.utcnow()


def _log(msg: str) -> None:
    # Explicit flush: if the process is killed abruptly (OOM, etc.), buffered
    # stdout can be lost entirely, hiding exactly where startup got to.
    print(msg, flush=True)


def run_migrations() -> None:
    alembic_cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        _log("[startup] running migrations...")
        run_migrations()
        _log("[startup] migrations complete")
        seed_admin_user()
        _log("[startup] admin user seeded")
        seed_ai_config()
        _log("[startup] ai config seeded")
        task = asyncio.create_task(autopilot_loop())
        monitor_task = asyncio.create_task(monitor_loop())
        _log("[startup] autopilot + monitor tasks started, startup complete")
    except Exception:
        _log("[startup] FAILED:\n" + traceback.format_exc())
        raise
    try:
        yield
    finally:
        task.cancel()
        monitor_task.cancel()


app = FastAPI(title="AI Trading Mentor (Demo)", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(market.router)
app.include_router(ai.router)
app.include_router(trading.router)
app.include_router(orders.router)
app.include_router(watchlist.router)
app.include_router(alerts.router)
app.include_router(notifications.router)
app.include_router(portfolio.router)
app.include_router(assistant.router)
app.include_router(news.router)
app.include_router(contact.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "uptime_seconds": int((datetime.datetime.utcnow() - START_TIME).total_seconds()),
    }
