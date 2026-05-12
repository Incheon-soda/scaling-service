"""
애플리케이션 설정 — 환경변수에서 로드
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Supabase PostgreSQL 직접 연결 ──
    DATABASE_URL: str

    # ── JWT ──
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24시간

    # ── CORS ──
    FRONTEND_URL: str = "http://localhost:5173"

    # ── DB Pool ──
    DB_MIN_POOL: int = 5
    DB_MAX_POOL: int = 20

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
