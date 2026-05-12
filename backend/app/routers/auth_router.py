"""
회원가입 / 로그인 API
"""

from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext

from app.database import get_pool
from app.schemas import SignupRequest, LoginRequest, AuthResponse
from app.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest):
    """회원가입"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", req.email
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 가입된 이메일입니다",
            )

        hashed = pwd_context.hash(req.password)
        row = await conn.fetchrow(
            """
            INSERT INTO users (name, email, password, phone)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, phone
            """,
            req.name, req.email, hashed, req.phone,
        )

    token = create_access_token(str(row["id"]), row["email"])
    return AuthResponse(
        access_token=token,
        user={
            "id": str(row["id"]),
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
        },
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """로그인"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, email, phone, password FROM users WHERE email = $1",
            req.email,
        )

    if not row or not pwd_context.verify(req.password, row["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다",
        )

    token = create_access_token(str(row["id"]), row["email"])
    return AuthResponse(
        access_token=token,
        user={
            "id": str(row["id"]),
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
        },
    )
