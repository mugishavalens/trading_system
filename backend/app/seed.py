from .config import settings
from .database import SessionLocal
from .models import RiskProfile, User, UserRole
from .security import hash_password


def seed_admin_user() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == UserRole.admin).first()
        if existing:
            return

        admin = db.query(User).filter(User.email == settings.admin_email).first()
        if admin:
            admin.role = UserRole.admin
        else:
            admin = User(
                email=settings.admin_email,
                full_name=settings.admin_full_name,
                hashed_password=hash_password(settings.admin_password),
                risk_profile=RiskProfile.moderate,
                role=UserRole.admin,
                cash_balance=settings.starting_balance,
            )
            db.add(admin)
        db.commit()
    finally:
        db.close()
