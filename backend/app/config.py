from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database - PostgreSQL
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 5432
    MYSQL_USER: str = "postgres"
    MYSQL_PASSWORD: str = ""
    MYSQL_DB: str = "demo_2_sma_panel"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

    # JWT
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
