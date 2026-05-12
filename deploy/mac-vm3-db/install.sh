#!/bin/bash
# Mac M3 UTM - VM3 DB 서버 설치
set -e

echo "=== VM3 DB 서버 설치 ==="

sudo apt-get update -y
sudo apt-get install -y curl wget git net-tools ufw ca-certificates gnupg openssh-server

echo "--- Docker 설치 ---"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker << 'EOF'

# Node Exporter (ARM64)
wget -q https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-arm64.tar.gz -O /tmp/ne.tar.gz
tar -xzf /tmp/ne.tar.gz -C /tmp/
sudo mv /tmp/node_exporter-1.7.0.linux-arm64/node_exporter /usr/local/bin/

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

# postgres_exporter (ARM64)
wget -q https://github.com/prometheus-community/postgres_exporter/releases/download/v0.15.0/postgres_exporter-0.15.0.linux-arm64.tar.gz -O /tmp/pg.tar.gz
tar -xzf /tmp/pg.tar.gz -C /tmp/
sudo mv /tmp/postgres_exporter-0.15.0.linux-arm64/postgres_exporter /usr/local/bin/

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
sudo systemctl enable --now node_exporter

sudo ufw allow 22
sudo ufw allow 5432
sudo ufw allow 9100
sudo ufw allow 9187
sudo ufw --force enable

if [ ! -f schema.sql ]; then
  echo "⚠️  schema.sql 없음. 같은 폴더에 넣어주세요."
  exit 1
fi

docker compose up -d

until docker exec stays-db pg_isready -U postgres -d stays_db 2>/dev/null; do
  echo "DB 대기 중..."
  sleep 3
done

sudo systemctl enable --now postgres_exporter

echo "=== VM3 완료 ==="
echo "DB: $(hostname -I | awk '{print $1}'):5432"
EOF
