from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ContactMessage
from ..schemas import ContactMessageCreate

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", status_code=201)
def submit_contact_message(payload: ContactMessageCreate, db: Session = Depends(get_db)):
    message = ContactMessage(
        name=payload.name, email=payload.email, message=payload.message
    )
    db.add(message)
    db.commit()
    return {"status": "received"}
