# Stays 서비스 배포 가이드

## 전체 구성

```
[VM1] 앱 서버      Nginx + React        :80
[VM2] API 서버     FastAPI              :8000
[VM3] DB 서버      PostgreSQL           :5432
[VM4] 부하 서버    JMeter               -
```

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
