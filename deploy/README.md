# Stays 서비스 배포 가이드

## 전체 구성

```
[VM1] 앱 서버      Nginx + React        :80
[VM2] API 서버     FastAPI              :8000
[VM3] DB 서버      PostgreSQL           :5432
[VM4] 부하 서버    JMeter               -
```

---

## VM 사양 (VMware Workstation on Windows)

**호스트 PC**: AMD Ryzen 9 6900HX (8코어 16스레드) / RAM 32GB

| VM | 역할 | vCPU | RAM | 디스크 | 비고 |
|---|---|---|---|---|---|
| VM1 | 앱 서버 (Nginx+React) | 2코어 | 2GB | 20GB | 정적 파일 서빙 → 경량 |
| VM2 | API 서버 (FastAPI) | 2코어 | 4GB | 20GB | CPU 급등 유발 대상 → 코어 적게 |
| VM3 | DB 서버 (PostgreSQL) | 2코어 | 4GB | 30GB | DB 버퍼 캐시 위해 RAM 확보 |
| VM4 | 부하 서버 (JMeter) | 2코어 | 6GB | 20GB | 1000스레드 JVM 힙 대응 |
| **합계** | | **8코어** | **16GB** | **90GB** | |

**자원 배분 요약**

```
호스트 전체:       16스레드 / 32GB RAM
VM 합계 사용:       8vCPU  / 16GB RAM
Windows 예약:       ~3코어  /  6GB RAM
여유:               ~6코어  / 10GB RAM  ← 넉넉한 여유
```

**VM2를 2코어만 주는 이유**
JMeter 부하 시 CPU가 빠르게 80%에 도달해야 AWS 자동 확장 트리거가 작동함.
코어가 많으면 부하를 잘 버텨서 CPU가 안 올라감.

**VM4 RAM을 6GB 주는 이유**
JMeter 1000스레드 실행 시 JVM이 3~4GB 소비.
최소 6GB 확보해야 OOM 없이 안정적으로 부하 가능.

---

## 배포 전 준비사항

### 1. Docker Hub 이미지 푸시 (Windows에서)
프로젝트 루트에서 실행:
```bash
# VM2 IP를 미리 알고 있어야 함
VITE_API_URL=http://VM2_IP:8000 \
VITE_KAKAO_MAP_KEY=발급받은키 \
./build-push.sh
```

### 2. 각 VM IP 확인
각 VM에서 실행:
```bash
ip addr show | grep "inet " | grep -v 127
```

### 3. VM2 docker-compose.yml IP 수정
```bash
sed -i 's/VM3_IP/실제DB서버IP/g' vm2-api/docker-compose.yml
sed -i 's/VM1_IP/실제앱서버IP/g' vm2-api/docker-compose.yml
```

---

## 파일 복사 (Windows → 각 VM)

```cmd
# VM1
scp -r deploy\vm1-app\ user@VM1_IP:~/

# VM2
scp -r deploy\vm2-api\ user@VM2_IP:~/

# VM3
scp -r deploy\vm3-db\ user@VM3_IP:~/

# VM4
scp -r deploy\vm4-loadtest\ user@VM4_IP:~/
scp -r loadtest\ user@VM4_IP:~/
```

---

## 설치 및 실행 순서

### ① VM3 (DB 서버) — 가장 먼저
```bash
ssh user@VM3_IP
chmod +x ~/vm3-db/install.sh
~/vm3-db/install.sh
```

### ② VM2 (API 서버) — VM3 완료 후
```bash
ssh user@VM2_IP
chmod +x ~/vm2-api/install.sh
~/vm2-api/install.sh
```

### ③ VM1 (앱 서버)
```bash
ssh user@VM1_IP
chmod +x ~/vm1-app/install.sh
~/vm1-app/install.sh
```

### ④ VM4 (부하 서버) — 마지막
```bash
ssh user@VM4_IP
chmod +x ~/vm4-loadtest/install.sh
~/vm4-loadtest/install.sh

# 유저 생성
python3 ~/loadtest/scripts/create_users.py --url http://VM2_IP:8000 --count 2000

# 부하 테스트 실행
chmod +x ~/vm4-loadtest/run.sh
~/vm4-loadtest/run.sh all VM2_IP
```

---

## 모니터링 (Prometheus + Grafana)

VM4에서 실행. 각 VM의 Node Exporter 메트릭을 수집해 Grafana로 시각화.

| 서버 | 포트 | Exporter |
|---|---|---|
| VM1, VM2, VM3, VM4 | 9100 | Node Exporter (시스템 메트릭) |
| VM3 | 9187 | postgres_exporter (DB 메트릭) |
| VM4 | 9090 | Prometheus |
| VM4 | 3000 | Grafana |

### Grafana 대시보드 Import ID

**Dashboards → New → Import → ID 입력 → Load → Prometheus 선택 → Import**

| 대상 | Dashboard ID | Job 선택 |
|---|---|---|
| VM1 앱 서버 | **1860** (Node Exporter Full) | vm1-app |
| VM2 API 서버 ★ | **1860** (Node Exporter Full) | vm2-api |
| VM3 DB 시스템 | **1860** (Node Exporter Full) | vm3-db-system |
| VM3 PostgreSQL | **9628** (PostgreSQL Database) | vm3-db-postgres |
| VM4 부하 서버 | **1860** (Node Exporter Full) | vm4-loadtest |

> ★ VM2가 핵심 — 부하테스트 시 CPU 80% 급등 여기서 확인

### 9628 주요 지표 (부하테스트 시)
- **Locks** — DB 락 대기 ← FOR UPDATE 경합 시 급등
- **Active Connections** — 동시 접속 수
- **Transactions/sec** — 초당 트랜잭션

자세한 설정은 `vm4-loadtest/README.md` 참고.

---

## 정상 동작 확인

| 확인 항목 | 명령어 |
|---|---|
| DB 상태 | `docker exec stays-db pg_isready -U postgres` |
| API 헬스체크 | `curl http://VM2_IP:8000/health` |
| 프론트엔드 | 브라우저에서 `http://VM1_IP` 접속 |
| JMeter 설치 | `jmeter --version` |

---

## 문제 해결

**Docker 권한 오류**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**포트 접근 불가**
```bash
sudo ufw status         # 방화벽 상태 확인
sudo ufw allow 포트번호  # 포트 열기
```

**DB 연결 실패**
```bash
# VM3에서 확인
docker logs stays-db
docker exec stays-db pg_isready -U postgres -d stays_db
```
