/**
 * API 클라이언트 — FastAPI 백엔드 통신
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── 토큰 관리 ──
export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("access_token");
}

// ── 공통 fetch wrapper ──
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "요청 실패" }));
    throw new ApiError(res.status, body.detail || "요청 실패");
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ── Auth API ──
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export async function signup(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Stays API ──
export interface StayItem {
  id: string;
  name: string;
  location: string;
  category: string;
  tags: string[];
  rating: number;
  reviews: number;
  price: number;
  image_url: string | null;
  badge: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface StayDetail extends StayItem {
  description: string | null;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  host_name: string | null;
  amenities: string[];
  images: string[];
}

export interface RoomItem {
  id: string;
  name: string;
  room_count: number;
  remaining_count: number;
  price: number;
  max_guests: number;
}

export async function getStays(params?: {
  category?: string;
  region?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<StayItem[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "전체") query.set("category", params.category);
  if (params?.region) query.set("region", params.region);
  if (params?.search) query.set("search", params.search);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return request<StayItem[]>(`/stays${qs ? `?${qs}` : ""}`);
}

export async function getStay(id: string): Promise<StayDetail> {
  return request<StayDetail>(`/stays/${id}`);
}

export async function getStayRooms(stayId: string): Promise<RoomItem[]> {
  return request<RoomItem[]>(`/stays/${stayId}/rooms`);
}

export interface ReviewItem {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  user_name: string;
}

export async function getStayReviews(stayId: string, limit = 10): Promise<ReviewItem[]> {
  return request<ReviewItem[]>(`/stays/${stayId}/reviews?limit=${limit}`);
}

// ── Events API ──
export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  region: string | null;
  start_date: string;
  end_date: string;
  total_rooms: number;
  remaining_rooms: number;
  max_discount: number | null;
  status: string;
}

export interface EventStayItem {
  stay_id: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  reviews: number;
  price: number;
  image_url: string | null;
  discount_rate: number;
  remaining_rooms: number;
}

export interface EventDetail extends EventItem {
  stays: EventStayItem[];
}

export async function getEvents(): Promise<EventItem[]> {
  return request<EventItem[]>("/events");
}

export async function getEvent(id: string): Promise<EventDetail> {
  return request<EventDetail>(`/events/${id}`);
}

// ── Coupons API ──
export interface CouponResult {
  id: string;
  code: string;
  event_id: string | null;
  stay_id: string | null;
  discount_rate: number;
  is_used: boolean;
  remaining_count: number;
  total_count: number;
}

export interface CouponValidateResult {
  valid: boolean;
  discount_rate: number;
  message: string;
  coupon_id?: string;
}

export async function issueCoupon(data: {
  event_id: string;
  coupon_code: string;
}): Promise<CouponResult> {
  return request<CouponResult>("/coupons/issue", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyCoupons(): Promise<CouponResult[]> {
  return request<CouponResult[]>("/coupons/me");
}

export async function validateCoupon(data: {
  coupon_code: string;
  stay_id?: string;
}): Promise<CouponValidateResult> {
  return request<CouponValidateResult>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Bookings API ──
export interface BookingResult {
  id: string;
  stay_id: string;
  stay_name: string | null;
  room_id: string;
  room_name: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  original_price: number;
  cleaning_fee: number;
  service_fee: number;
  discount_amount: number;
  total_price: number;
  status: string;
  created_at: string;
}

export async function createBooking(data: {
  stay_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  coupon_id?: string;
  event_id?: string;
}): Promise<BookingResult> {
  return request<BookingResult>("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyBookings(): Promise<BookingResult[]> {
  return request<BookingResult[]>("/bookings/me");
}

export async function getBooking(id: string): Promise<BookingResult> {
  return request<BookingResult>(`/bookings/${id}`);
}
