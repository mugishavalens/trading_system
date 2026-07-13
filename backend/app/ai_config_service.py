from sqlalchemy.orm import Session

from .models import AIEngineConfig

CONFIG_ID = 1


def get_ai_config(db: Session) -> AIEngineConfig:
    config = db.get(AIEngineConfig, CONFIG_ID)
    if config is None:
        config = AIEngineConfig(id=CONFIG_ID)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config
