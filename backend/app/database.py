"""
asyncpg 커넥션 풀 관리
Supabase PostgreSQL에 직접 연결
"""

import asyncpg
from app.config import get_settings

pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global pool
    if pool is None:
        raise RuntimeError("DB pool not initialized. Call init_pool() first.")
    return pool


async def init_pool() -> None:
    global pool
    settings = get_settings()
    pool = await asyncpg.create_pool(
        dsn=settings.DATABASE_URL,
        min_size=settings.DB_MIN_POOL,
        max_size=settings.DB_MAX_POOL,
    )


async def close_pool() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None
