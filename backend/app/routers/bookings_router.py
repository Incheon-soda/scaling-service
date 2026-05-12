"""
예약 생성 / 내 예약 목록 API

예약 시에도 rooms.remaining_count를 FOR UPDATE로 잠가서
동시 예약 시 overbooking을 방지한다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.database import get_pool
from app.auth import get_current_user
from app.schemas import BookingCreateRequest, BookingOut

router = APIRouter(prefix="/bookings", tags=["bookings"])

CLEANING_FEE = 30000
SERVICE_FEE_RATE = 0.05


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    req: BookingCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    예약 생성

    동시성 처리:
      1. rooms.remaining_count를 FOR UPDATE로 잠금
      2. remaining_count > 0 확인
      3. remaining_count 차감
      4. bookings INSERT
      5. 쿠폰 사용 처리 (있는 경우)
    """
    user_id = current_user["id"]
    pool = await get_pool()

    nights = (req.check_out - req.check_in).days
    if nights <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="체크아웃은 체크인보다 이후여야 합니다",
        )

    async with pool.acquire() as conn:
        async with conn.transaction():
            # ① 객실 잠금 (FOR UPDATE)
            room = await conn.fetchrow(
                """
                SELECT id, name, price_per_night AS price, remaining_count, max_guests
                FROM rooms
                WHERE id = $1 AND stay_id = $2
                FOR UPDATE
                """,
                req.room_id, req.stay_id,
            )

            if not room:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="객실을 찾을 수 없습니다",
                )

            if room["remaining_count"] <= 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="남은 객실이 없습니다",
                )

            if req.guests > room["max_guests"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"최대 {room['max_guests']}명까지 가능합니다",
                )

            # ② 객실 remaining_count 차감
            await conn.execute(
                "UPDATE rooms SET remaining_count = remaining_count - 1 WHERE id = $1",
                req.room_id,
            )

            # ③ 가격 계산
            original_price = room["price"] * nights
            cleaning_fee = CLEANING_FEE
            service_fee = int(original_price * SERVICE_FEE_RATE)
            discount_amount = 0

            # ④ 쿠폰 할인 처리
            if req.coupon_id:
                coupon = await conn.fetchrow(
                    """
                    SELECT id, discount_rate, is_used
                    FROM coupons
                    WHERE id = $1 AND used_by = $2
                    FOR UPDATE
                    """,
                    req.coupon_id, UUID(user_id),
                )
                if coupon and not coupon["is_used"]:
                    discount_amount = int(original_price * coupon["discount_rate"] / 100)
                    await conn.execute(
                        "UPDATE coupons SET is_used = TRUE WHERE id = $1",
                        coupon["id"],
                    )

            total_price = original_price + cleaning_fee + service_fee - discount_amount

            # ⑤ 예약 INSERT
            booking = await conn.fetchrow(
                """
                INSERT INTO bookings (
                    user_id, stay_id, room_id,
                    check_in, check_out, guests,
                    original_price, cleaning_fee, service_fee,
                    event_id, coupon_id,
                    total_price, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'confirmed')
                RETURNING id, stay_id, room_id, check_in, check_out, guests,
                          original_price, cleaning_fee, service_fee,
                          total_price, status, created_at
                """,
                UUID(user_id), req.stay_id, req.room_id,
                req.check_in, req.check_out, req.guests,
                original_price, cleaning_fee, service_fee,
                req.event_id, req.coupon_id,
                total_price,
            )

            stay_name = await conn.fetchval(
                "SELECT name FROM stays WHERE id = $1", req.stay_id
            )
            room_name = room["name"]

    return BookingOut(
        id=booking["id"],
        stay_id=booking["stay_id"],
        stay_name=stay_name,
        room_id=booking["room_id"],
        room_name=room_name,
        check_in=booking["check_in"],
        check_out=booking["check_out"],
        guests=booking["guests"],
        original_price=booking["original_price"],
        cleaning_fee=booking["cleaning_fee"],
        service_fee=booking["service_fee"],
        discount_amount=discount_amount,
        total_price=booking["total_price"],
        status=booking["status"],
        created_at=booking["created_at"],
    )


# ── /me는 반드시 /{booking_id} 앞에 등록해야 함 ──

@router.get("/me", response_model=list[BookingOut])
async def my_bookings(
    current_user: dict = Depends(get_current_user),
):
    """내 예약 목록"""
    user_id = current_user["id"]
    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT b.id, b.stay_id, s.name as stay_name,
                   b.room_id, r.name as room_name,
                   b.check_in, b.check_out, b.guests,
                   b.original_price, b.cleaning_fee, b.service_fee,
                   b.total_price, b.status, b.created_at,
                   COALESCE(c.discount_rate, 0) as discount_rate
            FROM bookings b
            JOIN stays s ON s.id = b.stay_id
            JOIN rooms r ON r.id = b.room_id
            LEFT JOIN coupons c ON c.id = b.coupon_id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
            """,
            UUID(user_id),
        )

    return [
        BookingOut(
            id=r["id"],
            stay_id=r["stay_id"],
            stay_name=r["stay_name"],
            room_id=r["room_id"],
            room_name=r["room_name"],
            check_in=r["check_in"],
            check_out=r["check_out"],
            guests=r["guests"],
            original_price=r["original_price"],
            cleaning_fee=r["cleaning_fee"],
            service_fee=r["service_fee"],
            discount_amount=int(r["original_price"] * r["discount_rate"] / 100) if r["discount_rate"] else 0,
            total_price=r["total_price"],
            status=r["status"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    """예약 상세 조회"""
    user_id = current_user["id"]
    pool = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT b.id, b.stay_id, s.name as stay_name,
                   b.room_id, r.name as room_name,
                   b.check_in, b.check_out, b.guests,
                   b.original_price, b.cleaning_fee, b.service_fee,
                   b.total_price, b.status, b.created_at,
                   COALESCE(c.discount_rate, 0) as discount_rate
            FROM bookings b
            JOIN stays s ON s.id = b.stay_id
            JOIN rooms r ON r.id = b.room_id
            LEFT JOIN coupons c ON c.id = b.coupon_id
            WHERE b.id = $1 AND b.user_id = $2
            """,
            booking_id, UUID(user_id),
        )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다",
        )

    return BookingOut(
        id=row["id"],
        stay_id=row["stay_id"],
        stay_name=row["stay_name"],
        room_id=row["room_id"],
        room_name=row["room_name"],
        check_in=row["check_in"],
        check_out=row["check_out"],
        guests=row["guests"],
        original_price=row["original_price"],
        cleaning_fee=row["cleaning_fee"],
        service_fee=row["service_fee"],
        discount_amount=int(row["original_price"] * row["discount_rate"] / 100) if row["discount_rate"] else 0,
        total_price=row["total_price"],
        status=row["status"],
        created_at=row["created_at"],
    )
