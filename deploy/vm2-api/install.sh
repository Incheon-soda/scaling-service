#!/bin/bash
# VM2 - API 서버 설치 스크립트
# Ubuntu 24.04 최소 설치 기준
# 실행 전: docker-compose.yml의 VM3_IP, VM1_IP를 실제 IP로 수정할 것
# 실행: chmod +x install.sh && ./install.sh

set -e

echo "=== VM2 API 서버 설치 시작 ==="

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
sudo ufw allow 8000
sudo ufw --force enable

# 5. IP 설정 확인
if grep -q "VM3_IP\|VM1_IP" docker-compose.yml; then
    echo ""
    echo "⚠️  docker-compose.yml에 IP가 아직 설정되지 않았습니다."
    echo "    아래 명령어로 실제 IP를 입력 후 다시 실행하세요:"
    echo ""
    echo "    sed -i 's/VM3_IP/DB서버IP/g' docker-compose.yml"
    echo "    sed -i 's/VM1_IP/앱서버IP/g' docker-compose.yml"
    echo ""
    exit 1
fi

# 6. 서비스 실행
echo "--- API 서버 시작 ---"
docker compose up -d

# Node Exporter 설치 (Prometheus 모니터링용)
echo "--- Node Exporter 설치 ---"
wget -q https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz -O /tmp/node_exporter.tar.gz
tar -xzf /tmp/node_exporter.tar.gz -C /tmp/
sudo mv /tmp/node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/

sudo tee /etc/systemd/system/node_exporter.service > /dev/null << 'SVCEOF'
[Unit]
Description=Prometheus Node Exporter
After=network.target
[Service]
ExecStart=/usr/local/bin/node_exporter
Restart=always
[Install]
WantedBy=multi-user.target
SVCEOF

sudo systemctl daemon-reload
sudo systemctl enable --now node_exporter
sudo ufw allow 9100

echo "=== VM2 설치 완료 ==="
echo "API 서버: http://$(hostname -I | awk '{print $1}'):8000"
echo "헬스체크: http://$(hostname -I | awk '{print $1}'):8000/health"
echo "Node Exporter: http://$(hostname -I | awk '{print $1}'):9100/metrics"
EOF
