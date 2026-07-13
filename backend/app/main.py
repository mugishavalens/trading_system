import asyncio
import datetime
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .autopilot import autopilot_loop
from .config import settings
from .routers import admin, ai, assistant, auth, contact, market, news, portfolio, trading
from .seed import seed_admin_user, seed_ai_config

BACKEND_DIR = Path(__file__).resolve().parent.parent

START_TIME = datetime.datetime.utcnow()


def run_migrations() -> None:
    alembic_cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    seed_admin_user()
    seed_ai_config()
    task = asyncio.create_task(autopilot_loop())
    try:
        yield
    finally:
        task.cancel()


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
