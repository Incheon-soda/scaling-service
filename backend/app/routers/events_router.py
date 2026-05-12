"""
이벤트 목록 / 상세 API
"""

from fastapi import APIRouter, HTTPException, status
from uuid import UUID

from app.database import get_pool
from app.schemas import EventOut, EventDetailOut

router = APIRouter(prefix="/events", tags=["events"])

_STATUS_SQL = """
    CASE
        WHEN end_date < CURRENT_DATE THEN 'ended'
        WHEN start_date > CURRENT_DATE THEN 'upcoming'
        ELSE 'active'
    END
"""


@router.get("", response_model=list[EventOut])
async def list_events():
    """이벤트 목록"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT id, title, description, type, region,
                   start_date, end_date, total_rooms, remaining_rooms,
                   discount_rate AS max_discount,
                   {_STATUS_SQL} AS status
            FROM events
            ORDER BY start_date DESC
            """
        )

    return [
        EventOut(
            id=r["id"],
            title=r["title"],
            description=r["description"],
            type=r["type"],
            region=r["region"],
            start_date=r["start_date"],
            end_date=r["end_date"],
            total_rooms=r["total_rooms"],
            remaining_rooms=r["remaining_rooms"],
            max_discount=r["max_discount"],
            status=r["status"],
        )
        for r in rows
    ]


@router.get("/{event_id}", response_model=EventDetailOut)
async def get_event(event_id: UUID):
    """이벤트 상세 (참여 숙소 포함)"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        event = await conn.fetchrow(
            f"""
            SELECT id, title, description, type, region,
                   start_date, end_date, total_rooms, remaining_rooms,
                   discount_rate AS max_discount,
                   {_STATUS_SQL} AS status
            FROM events WHERE id = $1
            """,
            event_id,
        )

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="이벤트를 찾을 수 없습니다",
            )

        event_stays = await conn.fetch(
            """
            SELECT es.discount_rate, es.remaining_rooms,
                   s.id AS stay_id, s.name,
                   s.region AS location,
                   s.rating, s.review_count AS reviews,
                   s.price_per_night AS price,
                   (SELECT url FROM stay_images si
                    WHERE si.stay_id = s.id AND si.is_main = TRUE
                    LIMIT 1) AS image_url
            FROM event_stays es
            JOIN stays s ON s.id = es.stay_id
            WHERE es.event_id = $1
            ORDER BY es.discount_rate DESC
            """,
            event_id,
        )

    stays_list = [
        {
            "stay_id": str(es["stay_id"]),
            "name": es["name"],
            "location": es["location"],
            "category": "",
            "rating": float(es["rating"]) if es["rating"] else 0.0,
            "reviews": es["reviews"] or 0,
            "price": es["price"],
            "image_url": es["image_url"],
            "discount_rate": es["discount_rate"],
            "remaining_rooms": es["remaining_rooms"],
        }
        for es in event_stays
    ]

    return EventDetailOut(
        id=event["id"],
        title=event["title"],
        description=event["description"],
        type=event["type"],
        region=event["region"],
        start_date=event["start_date"],
        end_date=event["end_date"],
        total_rooms=event["total_rooms"],
        remaining_rooms=event["remaining_rooms"],
        max_discount=event["max_discount"],
        status=event["status"],
        stays=stays_list,
    )
