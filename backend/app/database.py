"""
asyncpg 커넥션 풀 관리
Supabase PostgreSQL에 직접 연결
"""

import asyncpg
from uuid import UUID
from app.config import get_settings

pool: asyncpg.Pool | None = None

SOLD_LOAD_ID = UUID("00000000-0000-4000-8000-000000000000")


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


async def seed_pool_coupon() -> None:
    """SOLD-LOAD 마스터 쿠폰이 없으면 자동 생성.

    dump.sql 등 구버전 스키마로 초기화된 DB에 대응.
    이미 존재하면 아무 작업도 하지 않는다.
    """
    async with pool.acquire() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM coupons WHERE code = 'SOLD-LOAD' AND total_count > 1"
        )
        if exists:
            return

        event_id = await conn.fetchval("SELECT id FROM events LIMIT 1")
        if not event_id:
            return

        await conn.execute(
            """
            INSERT INTO coupons
                (id, code, event_id, discount_rate, total_count, remaining_count, is_used)
            VALUES ($1, 'SOLD-LOAD', $2, 30, 1000, 1000, FALSE)
            ON CONFLICT (id) DO NOTHING
            """,
            SOLD_LOAD_ID,
            event_id,
        )


async def close_pool() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None
