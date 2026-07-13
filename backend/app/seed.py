from .ai_config_service import get_ai_config
from .config import settings
from .database import SessionLocal
from .models import RiskProfile, User, UserRole
from .security import hash_password


def seed_admin_user() -> None:
    db = SessionLocal()
    try:
        existing_admins = db.query(User).filter(User.role == UserRole.admin).all()
        if existing_admins:
            # Enforce the "admins don't trade" policy even for admins that
            # existed before that rule did.
            for admin in existing_admins:
                admin.cash_balance = 0.0
                admin.auto_trade_enabled = False
            db.commit()
            return

        admin = db.query(User).filter(User.email == settings.admin_email).first()
        if admin:
            admin.role = UserRole.admin
            admin.cash_balance = 0.0
        else:
            # Admins manage the platform; they don't trade, so no demo cash.
            admin = User(
                email=settings.admin_email,
                full_name=settings.admin_full_name,
                hashed_password=hash_password(settings.admin_password),
                risk_profile=RiskProfile.moderate,
                role=UserRole.admin,
                cash_balance=0.0,
            )
            db.add(admin)
        db.commit()
    finally:
        db.close()


def seed_ai_config() -> None:
    db = SessionLocal()
    try:
        get_ai_config(db)  # creates the default row if it doesn't exist yet
    finally:
        db.close()
