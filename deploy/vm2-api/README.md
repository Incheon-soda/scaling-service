# VM2 - API 서버

## 역할
FastAPI 백엔드. 쿠폰 발급/예약 생성 시 DB 락으로 CPU 급등 유발.

## 필요 파일
```
vm2-api/
├── install.sh          ← 설치 스크립트
└── docker-compose.yml  ← 서비스 정의 (IP 수정 필요)
```

## 설치 방법

### 1. Windows에서 파일 복사
```cmd
scp -r deploy\vm2-api\ user@VM2_IP:~/
```

### 2. VM2에 SSH 접속
```bash
ssh user@VM2_IP
```

### 3. docker-compose.yml IP 수정 (필수)
```bash
sed -i 's/VM3_IP/실제DB서버IP/g' ~/vm2-api/docker-compose.yml
sed -i 's/VM1_IP/실제앱서버IP/g' ~/vm2-api/docker-compose.yml
```

### 4. 설치 실행
```bash
chmod +x ~/vm2-api/install.sh
~/vm2-api/install.sh
```

## 확인
```bash
# 헬스체크
curl http://VM2_IP:8000/health

# 숙소 목록 조회
curl http://VM2_IP:8000/stays
```

## 포트
| 포트 | 용도 |
|---|---|
| 22 | SSH |
| 8000 | FastAPI |

## 주의
- VM3(DB)가 먼저 실행 중이어야 함
- docker-compose.yml의 IP 교체 없이 실행하면 오류 발생
