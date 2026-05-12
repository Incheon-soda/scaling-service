# VM3 - DB 서버

## 역할
PostgreSQL 16. 쿠폰/객실 재고를 SELECT FOR UPDATE로 관리해 동시성 제어.

## 필요 파일
```
vm3-db/
├── install.sh          ← 설치 스크립트
├── docker-compose.yml  ← 서비스 정의
└── schema.sql          ← 테이블 생성 + 시드 데이터 (자동 실행)
```

## 설치 방법

### 1. Windows에서 파일 복사
```cmd
scp -r deploy\vm3-db\ user@VM3_IP:~/
```

### 2. VM3에 SSH 접속
```bash
ssh user@VM3_IP
```

### 3. 설치 실행 (가장 먼저)
```bash
chmod +x ~/vm3-db/install.sh
~/vm3-db/install.sh
```

## 확인
```bash
# DB 준비 상태
docker exec stays-db pg_isready -U postgres -d stays_db

# 테이블 확인
docker exec -it stays-db psql -U postgres -d stays_db -c "\dt"

# 숙소 데이터 확인
docker exec -it stays-db psql -U postgres -d stays_db -c "SELECT name, region FROM stays;"
```

## 접속 정보
| 항목 | 값 |
|---|---|
| 호스트 | VM3_IP |
| 포트 | 5432 |
| DB명 | stays_db |
| 유저 | postgres |
| 비밀번호 | stays_password |

## 포트
| 포트 | 용도 |
|---|---|
| 22 | SSH |
| 5432 | PostgreSQL |

## 부하테스트 전 DB 초기화
```bash
# VM4에서 실행 (테스트 후 재고 리셋)
python3 ~/loadtest/scripts/reset_db.py --host VM3_IP
```
