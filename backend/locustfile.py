"""
Locust 부하 테스트 시나리오

핵심 시나리오:
  1. 이벤트 상세 페이지 조회 (GET)
  2. 쿠폰 발급 요청 (POST) → remaining_count 차감 → DB 락 → CPU 급등
  3. 숙소 상세 조회 (GET)
  4. 예약 생성 (POST) → rooms remaining_count 차감

실행 방법:
  pip install locust
  locust -f locustfile.py --host=http://localhost:8000

  또는 headless 모드:
  locust -f locustfile.py --host=http://localhost:8000 --headless -u 1000 -r 50 --run-time 5m
"""

import random
import string
from locust import HttpUser, task, between, events


class StayBookingUser(HttpUser):
    """숙박 예약 사용자 시뮬레이션"""
    wait_time = between(1, 3)

    def on_start(self):
        """사용자 시작 시 회원가입 + 로그인"""
        # 랜덤 사용자 생성
        suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
        self.email = f"user_{suffix}@test.com"
        self.password = "test1234!@"
        self.name = f"테스트유저_{suffix}"
        self.token = None
        self.event_id = None
        self.stay_id = None
        self.room_id = None

        # 회원가입
        resp = self.client.post("/auth/signup", json={
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "phone": "010-0000-0000",
        })
        if resp.status_code == 201:
            data = resp.json()
            self.token = data["access_token"]
        elif resp.status_code == 409:
            # 이미 가입된 경우 로그인
            resp = self.client.post("/auth/login", json={
                "email": self.email,
                "password": self.password,
            })
            if resp.status_code == 200:
                self.token = resp.json()["access_token"]

    @property
    def auth_headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    @task(3)
    def view_events(self):
        """1단계: 이벤트 목록 조회"""
        resp = self.client.get("/events")
        if resp.status_code == 200:
            events_list = resp.json()
            if events_list:
                self.event_id = events_list[0]["id"]

    @task(5)
    def view_event_detail(self):
        """1단계: 이벤트 상세 페이지 조회"""
        if not self.event_id:
            return
        resp = self.client.get(f"/events/{self.event_id}")
        if resp.status_code == 200:
            data = resp.json()
            stays = data.get("stays", [])
            if stays:
                picked = random.choice(stays)
                self.stay_id = picked["stay_id"]

    @task(10)
    def issue_coupon(self):
        """2단계: 쿠폰 발급 (동시성 처리 핵심 — CPU 급등 포인트!)"""
        if not self.event_id or not self.token:
            return
        self.client.post(
            "/coupons/issue",
            json={
                "event_id": self.event_id,
                "coupon_code": "SOLD-2026",
            },
            headers=self.auth_headers,
        )

    @task(4)
    def view_stay_detail(self):
        """3단계: 숙소 상세 조회"""
        if not self.stay_id:
            return
        resp = self.client.get(f"/stays/{self.stay_id}")
        if resp.status_code == 200:
            # 객실 목록도 조회
            rooms_resp = self.client.get(f"/stays/{self.stay_id}/rooms")
            if rooms_resp.status_code == 200:
                rooms = rooms_resp.json()
                if rooms:
                    self.room_id = rooms[0]["id"]

    @task(3)
    def view_stays_list(self):
        """숙소 목록 조회"""
        self.client.get("/stays")

    @task(2)
    def create_booking(self):
        """4단계: 예약 생성 (DB 락 → CPU 부하)"""
        if not self.stay_id or not self.room_id or not self.token:
            return
        self.client.post(
            "/bookings",
            json={
                "stay_id": self.stay_id,
                "room_id": self.room_id,
                "check_in": "2026-05-15",
                "check_out": "2026-05-18",
                "guests": 2,
            },
            headers=self.auth_headers,
        )

    @task(1)
    def view_my_bookings(self):
        """내 예약 조회"""
        if not self.token:
            return
        self.client.get("/bookings/me", headers=self.auth_headers)
