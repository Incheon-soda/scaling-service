"""
쿠폰 발급 / 검증 API

★ 핵심: 동시성 처리 ★
1000명 동시 요청 시 쿠폰 remaining_count가 정확히 차감되어야 한다.
PostgreSQL의 SELECT ... FOR UPDATE (비관적 락)을 사용해서 처리.

동시성 처리 전략:
  1. 트랜잭션 시작 (BEGIN)
  2. SELECT ... FOR UPDATE → 해당 row에 배타적 락 획득
     (다른 트랜잭션은 이 락이 해제될 때까지 대기)
  3. remaining_count > 0 확인
  4. remaining_count -= 1, coupons 테이블에 개인 쿠폰 INSERT
  5. COMMIT → 락 해제

이 방식의 장점:
  - 100% 정확한 재고 관리 (oversell 불가)
  - PostgreSQL 네이티브 기능이라 별도 인프라 불필요
  - Supabase PostgreSQL에서도 동작

이 방식의 단점:
  - row-level lock으로 인해 동시 요청이 직렬화됨
  - → CPU 사용량 급등 (Locust 테스트 시나리오의 목표!)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.database import get_pool
from app.auth import get_current_user
from app.schemas import CouponIssueRequest, CouponOut, CouponValidateRequest, CouponValidateResponse

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.post("/issue", response_model=CouponOut)
async def issue_coupon(
    req: CouponIssueRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    쿠폰 발급 (동시성 처리 핵심 API)

    Flow:
      1. 이벤트의 쿠폰 마스터 row를 FOR UPDATE로 잠금
      2. remaining_count > 0 확인
      3. 이미 발급받은 사용자인지 확인
      4. remaining_count 차감 + 개인 쿠폰 INSERT
      5. 트랜잭션 커밋으로 락 해제
    """
    user_id = current_user["id"]
    pool = await get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():

            # ── 풀 쿠폰 방식 (total_count > 1, event_id 무관) ──────────────
            # SOLD-LOAD 같은 선착순 풀 쿠폰: 어느 이벤트 페이지에서도 발급 가능
            coupon_pool = await conn.fetchrow(
                """
                SELECT id, code, event_id, stay_id, discount_rate,
                       total_count, remaining_count
                FROM coupons
                WHERE code = $1 AND total_count > 1
                ORDER BY id
                LIMIT 1
                FOR UPDATE
                """,
                req.coupon_code,
            )

            if coupon_pool:
                if coupon_pool["remaining_count"] <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="쿠폰이 모두 소진되었습니다",
                    )

                # 이미 발급받았는지 확인 (code 기준)
                already = await conn.fetchrow(
                    "SELECT id FROM coupons WHERE code = $1 AND used_by = $2",
                    req.coupon_code, UUID(user_id),
                )
                if already:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="이미 발급받은 쿠폰입니다",
                    )

                # remaining_count 차감 (★ FOR UPDATE 락 핵심 ★)
                await conn.execute(
                    "UPDATE coupons SET remaining_count = remaining_count - 1 WHERE id = $1",
                    coupon_pool["id"],
                )

                # 개인 쿠폰 row INSERT
                new_coupon = await conn.fetchrow(
                    """
                    INSERT INTO coupons (code, event_id, stay_id, discount_rate,
                                        total_count, remaining_count, used_by, is_used)
                    VALUES ($1, $2, $3, $4, 1, 1, $5, FALSE)
                    RETURNING id, code, event_id, stay_id, discount_rate, is_used,
                              remaining_count, total_count
                    """,
                    req.coupon_code,
                    coupon_pool["event_id"],
                    coupon_pool["stay_id"],
                    coupon_pool["discount_rate"],
                    UUID(user_id),
                )

                return CouponOut(
                    id=new_coupon["id"],
                    code=new_coupon["code"],
                    event_id=new_coupon["event_id"],
                    stay_id=new_coupon["stay_id"],
                    discount_rate=new_coupon["discount_rate"],
                    is_used=new_coupon["is_used"],
                    remaining_count=new_coupon["remaining_count"],
                    total_count=new_coupon["total_count"],
                )

            # ── 개별 쿠폰 방식 (total_count = 1, event_id 필요) ──────────────
            coupon_master = await conn.fetchrow(
                """
                SELECT id, code, event_id, stay_id, discount_rate,
                       total_count, remaining_count
                FROM coupons
                WHERE code = $1 AND event_id = $2 AND used_by IS NULL AND is_used = FALSE
                ORDER BY id
                LIMIT 1
                FOR UPDATE
                """,
                req.coupon_code, req.event_id,
            )

            if not coupon_master:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="유효하지 않은 쿠폰 코드입니다",
                )

            already = await conn.fetchrow(
                "SELECT id FROM coupons WHERE code = $1 AND event_id = $2 AND used_by = $3",
                req.coupon_code, req.event_id, UUID(user_id),
            )
            if already:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="이미 발급받은 쿠폰입니다",
                )

            await conn.execute(
                "UPDATE coupons SET used_by = $1 WHERE id = $2",
                UUID(user_id), coupon_master["id"],
            )

            return CouponOut(
                id=coupon_master["id"],
                code=coupon_master["code"],
                event_id=coupon_master["event_id"],
                stay_id=coupon_master["stay_id"],
                discount_rate=coupon_master["discount_rate"],
                is_used=False,
                remaining_count=coupon_master["remaining_count"],
                total_count=coupon_master["total_count"],
            )


@router.get("/me", response_model=list[CouponOut])
async def my_coupons(
    current_user: dict = Depends(get_current_user),
):
    """내 쿠폰 목록"""
    user_id = current_user["id"]
    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT c.id, c.code, c.event_id, c.stay_id,
                   c.discount_rate, c.is_used,
                   c.remaining_count, c.total_count,
                   e.title AS event_title,
                   e.end_date AS valid_until
            FROM coupons c
            LEFT JOIN events e ON e.id = c.event_id
            WHERE c.used_by = $1
            ORDER BY c.created_at DESC
            """,
            UUID(user_id),
        )

    return [
        CouponOut(
            id=r["id"],
            code=r["code"],
            event_id=r["event_id"],
            stay_id=r["stay_id"],
            discount_rate=r["discount_rate"],
            is_used=r["is_used"],
            remaining_count=r["remaining_count"] or 1,
            total_count=r["total_count"] or 1,
        )
        for r in rows
    ]


@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    req: CouponValidateRequest,
    current_user: dict = Depends(get_current_user),
):
    """쿠폰 코드 검증 — 예약 페이지에서 적용 전 확인용"""
    user_id = current_user["id"]
    pool = await get_pool()

    async with pool.acquire() as conn:
        coupon = await conn.fetchrow(
            """
            SELECT id, discount_rate, is_used, used_by, stay_id
            FROM coupons
            WHERE code = $1 AND used_by = $2
            ORDER BY id DESC
            LIMIT 1
            """,
            req.coupon_code, UUID(user_id),
        )

    if not coupon:
        return CouponValidateResponse(valid=False, message="유효하지 않은 쿠폰입니다")

    if coupon["is_used"]:
        return CouponValidateResponse(valid=False, message="이미 사용된 쿠폰입니다")

    # stay 제한 확인
    if coupon["stay_id"] and req.stay_id and coupon["stay_id"] != req.stay_id:
        return CouponValidateResponse(valid=False, message="이 숙소에서 사용할 수 없는 쿠폰입니다")

    return CouponValidateResponse(
        valid=True,
        discount_rate=coupon["discount_rate"],
        message=f"{coupon['discount_rate']}% 할인 쿠폰이 적용됩니다",
        coupon_id=coupon["id"],
    )
