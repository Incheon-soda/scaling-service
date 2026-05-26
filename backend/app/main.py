"""
FastAPI 메인 앱
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_pool, close_pool, seed_pool_coupon
from app.routers import auth_router, stays_router, events_router, coupons_router, bookings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 DB 커넥션 풀 관리"""
    await init_pool()
    await seed_pool_coupon()
    yield
    await close_pool()


app = FastAPI(
    title="Stays Booking API",
    description="숙박예약 테스트 서비스 — 트래픽 분산 데모",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정 — 데모 환경: 전체 허용
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router.router)
app.include_router(stays_router.router)
app.include_router(events_router.router)
app.include_router(coupons_router.router)
app.include_router(bookings_router.router)


@app.get("/health")
async def health_check():
    """헬스체크 — ALB/Locust 등에서 사용"""
    return {"status": "ok"}
