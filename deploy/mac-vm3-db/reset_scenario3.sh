#!/bin/bash
# 시나리오3 초기화: 예약 + 쿠폰 + 객실재고 리셋

echo "=== 시나리오3 초기화: 예약 + 쿠폰 + 객실재고 리셋 ==="

# 예약 삭제
sudo docker exec stays-db psql -U postgres -d stays_db -c \
  "DELETE FROM bookings;"

# 발급된 개인 쿠폰 rows 삭제
sudo docker exec stays-db psql -U postgres -d stays_db -c \
  "DELETE FROM coupons WHERE code = 'SOLD-LOAD' AND total_count = 1 AND used_by IS NOT NULL;"

# 마스터 쿠폰 remaining_count 복구
sudo docker exec stays-db psql -U postgres -d stays_db -c \
  "UPDATE coupons SET remaining_count = total_count WHERE code = 'SOLD-LOAD' AND total_count > 1;"

# 객실 재고 초기화 (rooms 테이블)
sudo docker exec stays-db psql -U postgres -d stays_db -c \
  "UPDATE rooms SET remaining_count = room_count;"

# 이벤트 객실 재고 초기화
sudo docker exec stays-db psql -U postgres -d stays_db -c \
  "UPDATE event_stays SET remaining_rooms = 10;"

# 확인
echo "=== 확인 ==="
sudo docker exec stays-db psql -U postgres -d stays_db -c \
  "SELECT '예약' AS 항목, COUNT(*)::text AS 값 FROM bookings
   UNION ALL
   SELECT 'SOLD-LOAD remaining', remaining_count::text FROM coupons WHERE code = 'SOLD-LOAD' AND total_count > 1;"

echo "=== 완료 ==="
