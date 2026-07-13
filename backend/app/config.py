from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    jwt_secret: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days, fine for a demo

    anthropic_api_key: str | None = None

    database_url: str = "sqlite:///./trading_demo.db"

    starting_balance: float = 100_000.0

    admin_email: str = "admin@aitradingmentor.demo"
    admin_password: str = "ChangeMe123!"
    admin_full_name: str = "Platform Admin"

    # Comma-separated, e.g. "https://your-site.netlify.app,http://localhost:3000".
    # Kept as a plain string (rather than list[str]) because pydantic-settings
    # expects list-typed env vars to be JSON, which is easy to get wrong when
    # setting it through a host's dashboard UI.
    cors_origins_raw: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        validation_alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


settings = Settings()
