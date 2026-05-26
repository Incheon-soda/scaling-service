#!/bin/bash
# 부하테스트 재실행 전 DB 초기화 (users 테이블 제외)

echo "=== DB 초기화 시작 (users 제외) ==="

sudo docker exec stays-db psql -U postgres -d stays_db << 'SQL'

-- 1. 예약 전체 삭제
DELETE FROM bookings;

-- 2. SOLD-LOAD 개인 쿠폰 삭제 (발급된 total_count=1 rows)
--    기존 UPDATE 방식은 used_by=NULL 좀비 쿠폰을 남겨 중복 발급을 유발
DELETE FROM coupons WHERE code = 'SOLD-LOAD' AND total_count = 1;

-- 3. 마스터 쿠폰 복구 (없으면 생성, 있으면 재고만 초기화)
INSERT INTO coupons (id, code, event_id, discount_rate, total_count, remaining_count, is_used)
SELECT '00000000-0000-4000-8000-000000000000'::uuid,
       'SOLD-LOAD',
       e.id,
       30, 1000, 1000, FALSE
FROM events e
LIMIT 1
ON CONFLICT (id) DO UPDATE
    SET remaining_count = 1000,
        used_by         = NULL,
        is_used         = FALSE;

-- 4. 이벤트 객실 재고 초기화
UPDATE event_stays SET remaining_rooms = 10;

-- 5. rooms 재고 초기화
UPDATE rooms SET remaining_count = room_count;

-- 확인
SELECT '== bookings ==' AS label, COUNT(*) FROM bookings
UNION ALL
SELECT '== SOLD-LOAD master (total_count>1)', COUNT(*)
  FROM coupons WHERE code = 'SOLD-LOAD' AND total_count > 1
UNION ALL
SELECT '== SOLD-LOAD master remaining_count', remaining_count::bigint
  FROM coupons WHERE code = 'SOLD-LOAD' AND total_count > 1
LIMIT 1;

SQL

echo "=== 초기화 완료 ==="
