#!/bin/bash
# VM3 - DB 서버 설치 스크립트
# Ubuntu 24.04 최소 설치 기준
# 실행: chmod +x install.sh && ./install.sh

set -e

echo "=== VM3 DB 서버 설치 시작 ==="

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

# 3. schema.sql 확인
if [ ! -f schema.sql ]; then
    echo "⚠️  schema.sql 파일이 없습니다. 같은 폴더에 schema.sql을 넣어주세요."
    exit 1
fi

# 4. 방화벽 설정
echo "--- 방화벽 설정 ---"
sudo ufw allow 22
sudo ufw allow 5432
sudo ufw --force enable

# 5. DB 서비스 실행
echo "--- DB 시작 ---"
docker compose up -d

# 6. DB 준비 대기
echo "--- DB 준비 대기 중 ---"
until docker exec stays-db pg_isready -U postgres -d stays_db 2>/dev/null; do
    echo "  대기 중..."
    sleep 3
done

# Node Exporter 설치 (시스템 메트릭)
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

# postgres_exporter 설치 (DB 메트릭)
echo "--- postgres_exporter 설치 ---"
wget -q https://github.com/prometheus-community/postgres_exporter/releases/download/v0.15.0/postgres_exporter-0.15.0.linux-amd64.tar.gz -O /tmp/pg_exporter.tar.gz
tar -xzf /tmp/pg_exporter.tar.gz -C /tmp/
sudo mv /tmp/postgres_exporter-0.15.0.linux-amd64/postgres_exporter /usr/local/bin/

sudo tee /etc/systemd/system/postgres_exporter.service > /dev/null << 'SVCEOF'
[Unit]
Description=Prometheus PostgreSQL Exporter
After=network.target
[Service]
Environment=DATA_SOURCE_NAME=postgresql://postgres:stays_password@localhost:5432/stays_db?sslmode=disable
ExecStart=/usr/local/bin/postgres_exporter
Restart=always
[Install]
WantedBy=multi-user.target
SVCEOF

sudo systemctl daemon-reload
sudo systemctl enable --now postgres_exporter
sudo ufw allow 9187

echo "=== VM3 설치 완료 ==="
echo "DB 주소: $(hostname -I | awk '{print $1}'):5432"
echo "Node Exporter: http://$(hostname -I | awk '{print $1}'):9100/metrics"
echo "PG Exporter:   http://$(hostname -I | awk '{print $1}'):9187/metrics"
EOF
