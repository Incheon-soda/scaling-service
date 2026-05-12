#!/bin/bash
# VM1 - 앱 서버 설치 스크립트
# Ubuntu 24.04 최소 설치 기준
# 실행: chmod +x install.sh && ./install.sh

set -e

echo "=== VM1 앱 서버 설치 시작 ==="

# 1. 기본 패키지 설치
echo "--- 기본 패키지 설치 ---"
sudo apt-get update -y
sudo apt-get install -y \
    curl \
    wget \
    git \
    net-tools \
    ufw \
    ca-certificates \
    gnupg \
    lsb-release \
    apt-transport-https \
    software-properties-common \
    openssh-server

# 2. Docker 설치
echo "--- Docker 설치 ---"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker << 'EOF'

# 3. Docker Compose 확인
docker compose version

# 4. 방화벽 설정
echo "--- 방화벽 설정 ---"
sudo ufw allow 22
sudo ufw allow 80
sudo ufw --force enable

# 5. 서비스 실행
echo "--- 서비스 시작 ---"
docker compose up -d

echo "=== VM1 설치 완료 ==="
echo "프론트엔드: http://$(hostname -I | awk '{print $1}')"
EOF
