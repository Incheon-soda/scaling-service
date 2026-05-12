#!/bin/bash
# Mac M3 UTM - VM4 부하 서버 설치
set -e

JMETER_VERSION="5.6.3"

echo "=== VM4 부하 서버 설치 (ARM64) ==="

sudo apt-get update -y
sudo apt-get install -y curl wget git net-tools ufw ca-certificates gnupg openssh-server unzip python3 python3-pip python3-venv openjdk-17-jdk

# JMeter
cd /tmp
wget -q "https://downloads.apache.org/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz"
tar -xzf "apache-jmeter-${JMETER_VERSION}.tgz"
sudo mv "apache-jmeter-${JMETER_VERSION}" /opt/jmeter
sudo ln -sf /opt/jmeter/bin/jmeter /usr/local/bin/jmeter
cd ~

pip3 install requests psycopg2-binary --break-system-packages

echo "--- Docker 설치 (Prometheus/Grafana용) ---"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

sudo ufw allow 22
sudo ufw allow 3000
sudo ufw allow 9090
sudo ufw --force enable

echo ""
echo "=== VM4 완료 ==="
jmeter --version 2>&1 | head -2
echo ""
echo "다음 단계:"
echo "  1. Monitoring 실행:"
echo "     cd ~/mac-vm4-loadtest"
echo "     docker compose -f docker-compose.monitoring.yml up -d"
echo ""
echo "  2. 유저 생성:"
echo "     python3 ~/loadtest/scripts/create_users.py --url http://192.168.64.3:8000 --count 2000"
echo ""
echo "  3. 부하 실행:"
echo "     chmod +x ~/mac-vm4-loadtest/run.sh"
echo "     ~/mac-vm4-loadtest/run.sh all 192.168.64.3"
