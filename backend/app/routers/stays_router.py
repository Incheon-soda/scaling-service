"""
숙소 목록 / 상세 API
"""

from fastapi import APIRouter, Query
from typing import Optional
from uuid import UUID

from app.database import get_pool
from app.schemas import StayOut, StayDetailOut, RoomOut

router = APIRouter(prefix="/stays", tags=["stays"])


@router.get("", response_model=list[StayOut])
async def list_stays(
    category: Optional[str] = Query(None, description="카테고리 필터 (현재 미지원, 무시됨)"),
    region: Optional[str] = Query(None, description="지역 필터"),
    search: Optional[str] = Query(None, description="검색어"),
    sort: Optional[str] = Query("rating", description="정렬: rating, price_asc, price_desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """숙소 목록 / 검색"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        conditions = []
        params = []
        idx = 1

        if region:
            conditions.append(f"s.region ILIKE ${idx}")
            params.append(f"%{region}%")
            idx += 1

        if search:
            conditions.append(f"(s.name ILIKE ${idx} OR s.region ILIKE ${idx})")
            params.append(f"%{search}%")
            idx += 1

        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        order_map = {
            "rating": "s.rating DESC",
            "price_asc": "s.price_per_night ASC",
            "price_desc": "s.price_per_night DESC",
        }
        order = order_map.get(sort, "s.rating DESC")

        query = f"""
            SELECT s.id, s.name,
                   s.region AS location,
                   '' AS category,
                   ARRAY[]::text[] AS tags,
                   s.rating,
                   s.review_count AS reviews,
                   s.price_per_night AS price,
                   (SELECT url FROM stay_images si
                    WHERE si.stay_id = s.id AND si.is_main = TRUE
                    LIMIT 1) AS image_url,
                   NULL::text AS badge,
                   s.lat AS latitude,
                   s.lng AS longitude,
                   s.address
            FROM stays s
            {where}
            ORDER BY {order}
            LIMIT ${idx} OFFSET ${idx + 1}
        """
        params.extend([limit, offset])
        rows = await conn.fetch(query, *params)

    return [
        StayOut(
            id=r["id"],
            name=r["name"],
            location=r["location"],
            category=r["category"],
            tags=r["tags"] or [],
            rating=float(r["rating"]) if r["rating"] else 0.0,
            reviews=r["reviews"] or 0,
            price=r["price"],
            image_url=r["image_url"],
            badge=r["badge"],
            latitude=float(r["latitude"]) if r["latitude"] else None,
            longitude=float(r["longitude"]) if r["longitude"] else None,
            address=r["address"],
        )
        for r in rows
    ]


@router.get("/{stay_id}", response_model=StayDetailOut)
async def get_stay(stay_id: UUID):
    """숙소 상세"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        stay = await conn.fetchrow(
            """
            SELECT s.id, s.name, s.description,
                   s.region AS location,
                   s.rating, s.review_count AS reviews,
                   s.price_per_night AS price,
                   s.max_guests, s.address,
                   s.lat AS latitude, s.lng AS longitude,
                   u.name AS host_name,
                   (SELECT url FROM stay_images si
                    WHERE si.stay_id = s.id AND si.is_main = TRUE
                    LIMIT 1) AS main_image
            FROM stays s
            LEFT JOIN users u ON u.id = s.host_id
            WHERE s.id = $1
            """,
            stay_id,
        )

        if not stay:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="숙소를 찾을 수 없습니다")

        images = await conn.fetch(
            "SELECT url FROM stay_images WHERE stay_id = $1 ORDER BY is_main DESC",
            stay_id,
        )

        amenities = await conn.fetch(
            """
            SELECT a.name FROM amenities a
            JOIN stay_amenities sa ON sa.amenity_id = a.id
            WHERE sa.stay_id = $1
            """,
            stay_id,
        )

    return StayDetailOut(
        id=stay["id"],
        name=stay["name"],
        location=stay["location"],
        category="",
        tags=[],
        rating=float(stay["rating"]) if stay["rating"] else 0.0,
        reviews=stay["reviews"] or 0,
        price=stay["price"],
        image_url=stay["main_image"],
        badge=None,
        latitude=float(stay["latitude"]) if stay["latitude"] else None,
        longitude=float(stay["longitude"]) if stay["longitude"] else None,
        address=stay["address"],
        description=stay["description"],
        max_guests=stay["max_guests"] or 4,
        bedrooms=2,
        bathrooms=1,
        host_name=stay["host_name"],
        amenities=[a["name"] for a in amenities],
        images=[img["url"] for img in images],
    )


@router.get("/{stay_id}/reviews")
async def get_reviews(stay_id: UUID, limit: int = 10):
    """숙소 리뷰 목록"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT r.id, r.rating, r.content, r.created_at,
                   u.name AS user_name
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.stay_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2
            """,
            stay_id, limit,
        )
    return [
        {
            "id": str(r["id"]),
            "rating": r["rating"],
            "content": r["content"],
            "created_at": str(r["created_at"])[:10],
            "user_name": r["user_name"],
        }
        for r in rows
    ]


@router.get("/{stay_id}/rooms", response_model=list[RoomOut])
async def get_rooms(stay_id: UUID):
    """숙소의 객실 목록"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, name, room_count, remaining_count,
                   price_per_night AS price, max_guests
            FROM rooms WHERE stay_id = $1
            ORDER BY price_per_night ASC
            """,
            stay_id,
        )
    return [
        RoomOut(
            id=r["id"],
            name=r["name"],
            room_count=r["room_count"],
            remaining_count=r["remaining_count"],
            price=r["price"],
            max_guests=r["max_guests"],
        )
        for r in rows
    ]
