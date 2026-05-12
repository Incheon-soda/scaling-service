# VM1 - 앱 서버

## 역할
Nginx로 React 빌드 결과물을 서빙하는 프론트엔드 서버.

## 필요 파일
```
vm1-app/
├── install.sh          ← 설치 스크립트
└── docker-compose.yml  ← 서비스 정의
```

## 설치 방법

### 1. Windows에서 파일 복사
```cmd
scp -r deploy\vm1-app\ user@VM1_IP:~/
```

### 2. VM1에 SSH 접속
```bash
ssh user@VM1_IP
```

### 3. 설치 실행
```bash
chmod +x ~/vm1-app/install.sh
~/vm1-app/install.sh
```

## 확인
```bash
# 컨테이너 상태
docker ps

# 브라우저에서 접속
http://VM1_IP
```

## 포트
| 포트 | 용도 |
|---|---|
| 22 | SSH |
| 80 | HTTP (프론트엔드) |
