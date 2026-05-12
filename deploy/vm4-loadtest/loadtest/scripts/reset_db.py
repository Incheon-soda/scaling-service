"""
부하테스트 전 DB 초기화 스크립트
실행: python reset_db.py --host VM3_IP
"""

import argparse
import psycopg2

RESET_SQL = """
-- 1. 테스트 예약 삭제
DELETE FROM bookings
WHERE created_at > NOW() - INTERVAL '1 day';

-- 2. 테스트 유저 발급 쿠폰 삭제 (used_by 있는 개인 쿠폰)
DELETE FROM coupons
WHERE used_by IS NOT NULL;

-- 3. 쿠폰 마스터 재고 복구
UPDATE coupons
SET remaining_count = total_count,
    is_used = FALSE
WHERE used_by IS NULL;

-- 4. 객실 재고 복구
UPDATE rooms
SET remaining_count = room_count;

-- 5. 테스트 유저 삭제 (testuser_ 로 시작하는 계정)
DELETE FROM users
WHERE email LIKE 'testuser_%@stays.com';
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=5432)
    parser.add_argument("--dbname", default="stays_db")
    parser.add_argument("--user", default="postgres")
    parser.add_argument("--password", default="stays_password")
    args = parser.parse_args()

    print(f"DB 초기화 시작 → {args.host}:{args.port}/{args.dbname}")

    conn = psycopg2.connect(
        host=args.host, port=args.port,
        dbname=args.dbname, user=args.user, password=args.password,
    )
    conn.autocommit = False
    cur = conn.cursor()

    try:
        cur.execute(RESET_SQL)

        cur.execute("SELECT remaining_count, total_count FROM coupons WHERE used_by IS NULL")
        row = cur.fetchone()
        if row:
            print(f"쿠폰 재고 복구: {row[0]}/{row[1]}")

        cur.execute("SELECT COUNT(*), SUM(remaining_count), SUM(room_count) FROM rooms")
        row = cur.fetchone()
        print(f"객실 복구: {row[1]}/{row[2]} (총 {row[0]}개 객실)")

        conn.commit()
        print("DB 초기화 완료 ✅")

    except Exception as e:
        conn.rollback()
        print(f"오류 발생: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
