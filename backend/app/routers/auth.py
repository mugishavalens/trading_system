import secrets
import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import TradingMode, User, UserRole
from ..schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from ..security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        experience_level=payload.experience_level,
        risk_profile=payload.risk_profile,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This account has been suspended"
        )
    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wants_autopilot = payload.auto_trade_enabled or (
        payload.trading_mode is not None and payload.trading_mode != TradingMode.manual
    )
    if wants_autopilot and current_user.role == UserRole.admin:
        raise HTTPException(
            status_code=400, detail="Admin accounts don't trade, so autopilot isn't available"
        )

    if payload.experience_level is not None:
        current_user.experience_level = payload.experience_level
    if payload.risk_profile is not None:
        current_user.risk_profile = payload.risk_profile
    if payload.auto_trade_enabled is not None:
        current_user.auto_trade_enabled = payload.auto_trade_enabled
    if payload.trading_mode is not None:
        current_user.trading_mode = payload.trading_mode
        # trading_mode is the source of truth for whether autopilot scans this
        # user at all; manual means "AI only suggests, never acts on its own."
        current_user.auto_trade_enabled = payload.trading_mode != TradingMode.manual

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"status": "updated"}


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return 200 — never reveal whether an email is registered.
    if not user:
        return ForgotPasswordResponse(
            reset_token="",
            message="If that email is registered you will receive a reset token.",
        )

    token = secrets.token_hex(32)  # 64-char hex string
    user.password_reset_token = token
    user.password_reset_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    db.commit()

    # In production you would email `token` to the user here.
    # For this demo we return it in the response body so the flow is usable
    # without a mail server — the frontend will display it to the user.
    return ForgotPasswordResponse(
        reset_token=token,
        message="Reset token generated. Copy it and use it to set a new password.",
    )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.password_reset_token == payload.token)
        .first()
    )
    if not user or user.password_reset_expires is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.datetime.utcnow() > user.password_reset_expires:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.hashed_password = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return {"status": "password updated"}
