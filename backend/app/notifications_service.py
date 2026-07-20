"""Tiny helper so every part of the backend that wants to tell a user
something (an order filled, a stop-loss triggered, an alert fired) writes to
the same table the same way. No push/email/websocket transport — the
frontend polls GET /api/notifications, which is enough for a demo of this
size without adding infrastructure."""

from sqlalchemy.orm import Session

from .models import Notification, NotificationType


def notify(db: Session, user_id: int, type_: NotificationType, message: str) -> Notification:
    note = Notification(user_id=user_id, type=type_, message=message)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
