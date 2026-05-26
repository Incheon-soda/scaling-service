"""
Pydantic 스키마 정의
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional
from uuid import UUID


# ── Auth ──
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: str = Field(..., min_length=10, max_length=20)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Stays ──
class StayOut(BaseModel):
    id: UUID
    name: str
    location: str
    category: str = ""
    tags: list[str] = []
    rating: float
    reviews: int
    price: int
    image_url: Optional[str] = None
    badge: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class StayDetailOut(StayOut):
    description: Optional[str] = None
    max_guests: int = 4
    bedrooms: int = 2
    bathrooms: int = 2
    host_name: Optional[str] = None
    amenities: list[str] = []
    images: list[str] = []


class RoomOut(BaseModel):
    id: UUID
    name: str
    room_count: int
    remaining_count: int
    price: int
    max_guests: int


# ── Events ──
class EventOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    region: Optional[str] = None
    start_date: date
    end_date: date
    total_rooms: int
    remaining_rooms: int
    max_discount: Optional[int] = None
    status: str  # active / ended


class EventDetailOut(EventOut):
    stays: list[dict] = []  # event_stays + stay info + discount_rate


# ── Coupons ──
class CouponIssueRequest(BaseModel):
    event_id: UUID
    coupon_code: str


class CouponOut(BaseModel):
    id: UUID
    code: str
    event_id: Optional[UUID] = None
    stay_id: Optional[UUID] = None
    discount_rate: int
    is_used: bool
    remaining_count: int
    total_count: int


class CouponValidateRequest(BaseModel):
    coupon_code: str
    stay_id: Optional[UUID] = None


class CouponValidateResponse(BaseModel):
    valid: bool
    discount_rate: int = 0
    message: str
    coupon_id: Optional[UUID] = None


# ── Bookings ──
class BookingCreateRequest(BaseModel):
    stay_id: UUID
    room_id: UUID
    check_in: date
    check_out: date
    guests: int = Field(..., ge=1)
    coupon_id: Optional[UUID] = None
    event_id: Optional[UUID] = None


class BookingOut(BaseModel):
    id: UUID
    stay_id: UUID
    stay_name: Optional[str] = None
    room_id: UUID
    room_name: Optional[str] = None
    check_in: date
    check_out: date
    guests: int
    original_price: int
    cleaning_fee: int
    service_fee: int
    discount_amount: int = 0
    total_price: int
    status: str
    created_at: datetime
