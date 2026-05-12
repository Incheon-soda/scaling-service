# Mac M3 UTM Ubuntu VM 4대 설치 가이드

## 주의사항

Mac M3는 ARM64 아키텍처야. 우리 Docker 이미지는 `linux/amd64`로 빌드됐기 때문에
**ARM64용으로 재빌드가 필요해.** 가이드 마지막에 설명.

---

## 사전 준비

### 1. UTM 다운로드
```
https://mac.getutm.app → Download 클릭 → UTM.dmg 설치
```

### 2. Ubuntu Server 24.04 ARM64 ISO 다운로드
```
https://ubuntu.com/download/server/arm
→ Ubuntu Server 24.04 LTS (ARM) 다운로드
→ 파일명: ubuntu-24.04.x-live-server-arm64.iso
```

---

## VM 사양 (M3 Mac 기준)

| VM | 역할 | CPU | RAM | 디스크 |
|---|---|---|---|---|
| VM1 | 앱 서버 (Nginx) | 2코어 | 1GB | 20GB |
| VM2 | API 서버 (FastAPI) | 2코어 | 2GB | 20GB |
| VM3 | DB 서버 (PostgreSQL) | 2코어 | 2GB | 30GB |
| VM4 | 부하 서버 (JMeter) | 2코어 | 4GB | 20GB |
| **합계** | | **8코어** | **9GB** | **90GB** |

> Mac 총 RAM에 따라 조절. macOS 최소 4GB 필요.

---

## VM 생성 방법 (4개 동일한 방법)

### VM1 생성 예시 (나머지도 동일)

**1. UTM 실행 → 상단 + 버튼 클릭**

**2. "Virtualize" 선택**
```
Virtualize  ← 이거 선택 (ARM64 네이티브, 빠름)
Emulate     ← 이건 느림, 선택 안 함
```

**3. "Linux" 선택**

**4. Boot ISO Image**
```
Browse 클릭 → 다운받은 ubuntu-24.04-live-server-arm64.iso 선택
→ Continue
```

**5. Hardware 설정**
```
Memory: 1024 MB  (VM1 기준, VM별로 다르게)
CPU Cores: 2
→ Continue
```

**6. Storage 설정**
```
Size: 20 GB  (VM1 기준)
→ Continue
```

**7. Shared Directory**
```
Skip 클릭 (필요 없음)
→ Continue
```

**8. Summary**
```
Name: VM1-App
→ Save
```

---

## Ubuntu 설치 (4개 VM 동일)

**1. VM 더블클릭 → 부팅**

**2. 언어 선택**
```
English → Enter
```

**3. 설치 유형**
```
Ubuntu Server (minimized) 선택 → Done
```

**4. 네트워크**
```
자동으로 IP 할당됨 → Done
```

**5. Mirror**
```
Done (기본값)
```

**6. Storage**
```
Use an entire disk → Done → Continue
```

**7. 계정 설정**
```
Your name:    user
Server name:  vm1-app  (vm2-api, vm3-db, vm4-loadtest)
Username:     user
Password:     원하는 비밀번호
```

**8. SSH 설정**
```
Install OpenSSH server ← 체크 (스페이스바)
→ Done
```

**9. Featured Snaps**
```
Done (아무것도 선택 안 함)
```

**10. 설치 완료 후**
```
Reboot Now → ISO 꺼지면 Enter
```

---

## 설치 후 IP 확인

각 VM 부팅 후 로그인:
```bash
ip addr show | grep "inet " | grep -v 127
```

UTM 네트워크는 `192.168.64.x` 대역이야.

예시:
```
VM1: 192.168.64.2
VM2: 192.168.64.3
VM3: 192.168.64.4
VM4: 192.168.64.5
```

---

## 배포 파일 복사 (Mac → 각 VM)

터미널에서:
```bash
# VM3 (DB 먼저)
scp -r deploy/vm3-db/ user@192.168.64.4:~/

# VM2
scp -r deploy/vm2-api/ user@192.168.64.3:~/

# VM1
scp -r deploy/vm1-app/ user@192.168.64.2:~/

# VM4
scp -r deploy/vm4-loadtest/ user@192.168.64.5:~/
scp -r loadtest/ user@192.168.64.5:~/
```

---

## install.sh 실행 순서

### VM3 먼저
```bash
ssh user@192.168.64.4
chmod +x ~/vm3-db/install.sh
~/vm3-db/install.sh
```

### VM2 (VM3 완료 후)
```bash
ssh user@192.168.64.3

# IP 교체
sed -i 's/10.0.2.137/192.168.64.4/g' ~/vm2-api/docker-compose.yml
sed -i 's/10.0.2.139/192.168.64.2/g' ~/vm2-api/docker-compose.yml

chmod +x ~/vm2-api/install.sh
~/vm2-api/install.sh
```

### VM1
```bash
ssh user@192.168.64.2
chmod +x ~/vm1-app/install.sh
~/vm1-app/install.sh
```

### VM4
```bash
ssh user@192.168.64.5
chmod +x ~/vm4-loadtest/install.sh
~/vm4-loadtest/install.sh

# prometheus.yml IP 교체
sed -i 's/10.0.2.139/192.168.64.2/g' ~/vm4-loadtest/prometheus.yml
sed -i 's/10.0.2.138/192.168.64.3/g' ~/vm4-loadtest/prometheus.yml
sed -i 's/10.0.2.137/192.168.64.4/g' ~/vm4-loadtest/prometheus.yml

cd ~/vm4-loadtest
sudo docker compose -f docker-compose.monitoring.yml up -d
```

---

## ⚠️ 중요: ARM64용 이미지 재빌드

Mac M3에서 실행하는 Ubuntu VM은 ARM64야.
현재 Docker Hub 이미지는 `linux/amd64`라 바로 실행이 안 돼.

### 재빌드 방법

`deploy/build-push.sh` 에서 플랫폼 수정:
```bash
# 기존
--platform linux/amd64

# ARM64용으로 변경
--platform linux/arm64

# 또는 둘 다 (멀티플랫폼)
--platform linux/amd64,linux/arm64
```

멀티플랫폼으로 빌드하면 Windows(amd64)와 Mac M3(arm64) 둘 다 사용 가능.

```bash
# build-push.sh 수정 후
bash deploy/build-push.sh
```

> 멀티플랫폼 빌드는 시간이 더 걸림 (10~15분)

---

## 접속 주소 (IP는 실제값으로 교체)

| 서비스 | 주소 |
|---|---|
| 프론트엔드 | http://192.168.64.2 |
| API | http://192.168.64.3:8000 |
| Grafana | http://192.168.64.5:3000 |
| Prometheus | http://192.168.64.5:9090 |

---

## 부하테스트

```bash
ssh user@192.168.64.5
cd ~/loadtest
python3 scripts/create_users.py --url http://192.168.64.3:8000 --count 2000
cd ~/vm4-loadtest
./run.sh 1 192.168.64.3
```
