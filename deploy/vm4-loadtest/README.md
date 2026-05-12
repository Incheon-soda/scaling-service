# VM4 - 부하 테스트 서버

## 역할
JMeter로 1000명 동시 접속 시뮬레이션. VM2(API 서버)에 부하를 주어 CPU 급등 유발.

## 필요 파일
```
vm4-loadtest/
├── install.sh   ← Java + JMeter + Python 설치
└── run.sh       ← 시나리오별 실행 스크립트

# 별도 복사 필요
loadtest/
├── jmeter/
│   ├── scenario1_coupon_rush.jmx
│   ├── scenario2_booking_race.jmx
│   ├── scenario3_event_open.jmx
│   └── scenario4_read_flood.jmx
├── scripts/
│   ├── create_users.py
│   └── reset_db.py
└── results/
```

## 설치 방법

### 1. Windows에서 파일 복사
```cmd
scp -r deploy\vm4-loadtest\ user@VM4_IP:~/
scp -r loadtest\ user@VM4_IP:~/
```

### 2. VM4에 SSH 접속
```bash
ssh user@VM4_IP
```

### 3. 설치 실행
```bash
chmod +x ~/vm4-loadtest/install.sh
~/vm4-loadtest/install.sh
```

## 부하 테스트 실행 순서

### Step 1. 테스트 유저 생성 (최초 1회)
```bash
python3 ~/loadtest/scripts/create_users.py \
    --url http://VM2_IP:8000 \
    --count 2000
```

### Step 2. 부하 테스트 실행
```bash
chmod +x ~/vm4-loadtest/run.sh

# 시나리오별 단독 실행
~/vm4-loadtest/run.sh 1 VM2_IP   # 쿠폰 선착순 폭발 (1000명)
~/vm4-loadtest/run.sh 2 VM2_IP   # 예약 경쟁 (500명)
~/vm4-loadtest/run.sh 3 VM2_IP   # 복합 플로우 (800명) ← 시연 메인
~/vm4-loadtest/run.sh 4 VM2_IP   # 조회 폭주 (2000명)

# 전체 순서대로 실행 (시연용)
~/vm4-loadtest/run.sh all VM2_IP
```

### Step 3. 재테스트 전 DB 초기화
```bash
python3 ~/loadtest/scripts/reset_db.py --host VM3_IP
```

## 시나리오별 설명
| 번호 | 이름 | 유저 수 | Ramp-up | 핵심 |
|---|---|---|---|---|
| 1 | 쿠폰 선착순 | 1,000명 | 10초 | 쿠폰 발급 DB 락 |
| 2 | 예약 경쟁 | 500명 | 5초 | 객실 예약 DB 락 |
| 3 | 복합 플로우 | 800명 | 30초 | 쿠폰+예약 2단계 락 |
| 4 | 조회 폭주 | 2,000명 | 60초 | 읽기 부하 (비교용) |

## 결과 확인
```bash
ls ~/loadtest/results/

# HTML 리포트 확인 (Windows로 복사 후 브라우저 열기)
scp -r user@VM4_IP:~/loadtest/results/ .
```

## 모니터링 (Prometheus + Grafana)

### 실행
```bash
# prometheus.yml IP 교체
sed -i 's/VM1_IP/실제앱IP/g'  ~/deploy/vm4-loadtest/prometheus.yml
sed -i 's/VM2_IP/실제APIIP/g' ~/deploy/vm4-loadtest/prometheus.yml
sed -i 's/VM3_IP/실제DBIP/g'  ~/deploy/vm4-loadtest/prometheus.yml

# 실행
cd ~/deploy/vm4-loadtest
docker compose -f docker-compose.monitoring.yml up -d
```

### Grafana 접속
```
URL:  http://VM4_IP:3000
ID:   admin
PW:   admin1234
```

### Data Source 추가
```
Connections → Data sources → Add → Prometheus
URL: http://prometheus:9090
→ Save & test
```

### 대시보드 Import

**Dashboards → New → Import → ID 입력 → Load → Prometheus 선택 → Import**

| 서버 | Exporter | Dashboard ID | Job 선택 |
|---|---|---|---|
| VM1 앱 서버 | Node Exporter | **1860** | vm1-app |
| VM2 API 서버 ★ | Node Exporter | **1860** | vm2-api |
| VM3 DB 시스템 | Node Exporter | **1860** | vm3-db-system |
| VM3 DB PostgreSQL | postgres_exporter | **9628** | vm3-db-postgres |
| VM4 부하 서버 | Node Exporter | **1860** | vm4-loadtest |

> ★ VM2가 핵심 — 부하테스트 시 CPU 80% 급등 여기서 확인

### 9628 주요 지표 (부하테스트 시 확인)
- **Active Connections** — 동시 접속 수
- **Locks** — DB 락 대기 ← FOR UPDATE 경합 시 급등
- **Transactions/sec** — 초당 트랜잭션 수

## 포트
| 포트 | 용도 |
|---|---|
| 22 | SSH |
| 9090 | Prometheus |
| 3000 | Grafana |
