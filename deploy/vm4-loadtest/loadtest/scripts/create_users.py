"""
테스트 유저 생성 스크립트
실행: python create_users.py --url http://VM2_IP:8000 --count 2000
결과: scripts/users.csv 생성
"""

import argparse
import csv
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

PASSWORD = "Test1234!"


def create_user(url: str, index: int) -> dict | None:
    email = f"testuser_{index:04d}@stays.com"
    payload = {
        "name": f"테스트유저{index:04d}",
        "email": email,
        "password": PASSWORD,
        "phone": f"010-{index//10000:04d}-{index%10000:04d}",
    }
    try:
        res = requests.post(f"{url}/auth/signup", json=payload, timeout=10)
        if res.status_code in (200, 201):
            print(f"[OK] {email}")
            return {"email": email, "password": PASSWORD}
        elif res.status_code == 409:
            print(f"[SKIP] {email} 이미 존재")
            return {"email": email, "password": PASSWORD}
        else:
            print(f"[FAIL] {email} → {res.status_code} {res.text[:80]}")
            return None
    except Exception as e:
        print(f"[ERROR] {email} → {e}")
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000")
    parser.add_argument("--count", type=int, default=2000)
    parser.add_argument("--workers", type=int, default=20)
    args = parser.parse_args()

    print(f"유저 {args.count}명 생성 시작 → {args.url}")

    results = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(create_user, args.url, i): i
            for i in range(1, args.count + 1)
        }
        for future in as_completed(futures):
            result = future.result()
            if result:
                results.append(result)

    output_path = os.path.join(os.path.dirname(__file__), "users.csv")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "password"])
        writer.writeheader()
        writer.writerows(sorted(results, key=lambda x: x["email"]))

    print(f"\n완료: {len(results)}명 생성 → {output_path}")


if __name__ == "__main__":
    main()
