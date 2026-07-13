from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    jwt_secret: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days, fine for a demo

    anthropic_api_key: str | None = None

    database_url: str = "sqlite:///./trading_demo.db"

    starting_balance: float = 100_000.0

    admin_email: str = "admin@aitradingmentor.demo"
    admin_password: str = "ChangeMe123!"
    admin_full_name: str = "Platform Admin"

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


settings = Settings()
