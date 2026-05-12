#!/bin/bash
# Mac M3 UTM - VM1 앱 서버 설치
set -e

echo "=== VM1 앱 서버 설치 (ARM64) ==="

sudo apt-get update -y
sudo apt-get install -y curl wget git net-tools ufw ca-certificates gnupg openssh-server

echo "--- Docker 설치 ---"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker << 'EOF'

# Node Exporter
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

sudo systemctl daemon-reload
sudo systemctl enable --now node_exporter

sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 9100
sudo ufw --force enable

docker compose up -d

echo "=== VM1 완료 ==="
echo "프론트엔드: http://$(hostname -I | awk '{print $1}')"
EOF
