#!/bin/bash
# 시나리오1 초기화: SOLD-LOAD 쿠폰 리셋

echo "=== 시나리오1 초기화: 쿠폰 재고 리셋 ==="

sudo docker exec stays-db psql -U postgres -d stays_db << 'SQL'

-- 발급된 개인 쿠폰 rows 전체 삭제 (used_by 여부 무관)
-- 기존 코드는 used_by IS NOT NULL만 삭제해 좀비 쿠폰이 잔류했음
DELETE FROM coupons WHERE code = 'SOLD-LOAD' AND total_count = 1;

-- 마스터 쿠폰 remaining_count 복구 (없으면 생성)
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

-- 확인
SELECT remaining_count, total_count
FROM coupons
WHERE code = 'SOLD-LOAD' AND total_count > 1;

SQL

echo "=== 완료 ==="
