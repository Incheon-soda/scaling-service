#!/bin/bash
# VM4 - 부하 테스트 서버 설치 스크립트
# Ubuntu 24.04 최소 설치 기준
# 실행: chmod +x install.sh && ./install.sh

set -e

JMETER_VERSION="5.6.3"

echo "=== VM4 부하 테스트 서버 설치 시작 ==="

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
    openssh-server \
    unzip \
    python3 \
    python3-pip \
    python3-venv

# 2. Java 17 설치 (JMeter 필수)
echo "--- Java 17 설치 ---"
sudo apt-get install -y openjdk-17-jdk
java -version

# 3. JMeter 설치
echo "--- JMeter ${JMETER_VERSION} 설치 ---"
cd /tmp
wget -q "https://downloads.apache.org/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz"
tar -xzf "apache-jmeter-${JMETER_VERSION}.tgz"
sudo mv "apache-jmeter-${JMETER_VERSION}" /opt/jmeter
sudo ln -sf /opt/jmeter/bin/jmeter /usr/local/bin/jmeter
cd ~

# 4. JMeter 힙 메모리 설정 (1000+ 스레드 대응)
echo "--- JMeter 메모리 설정 (4GB) ---"
sudo sed -i 's/#HEAP=.*/HEAP="-Xms2g -Xmx4g"/' /opt/jmeter/bin/jmeter
echo 'HEAP="-Xms2g -Xmx4g"' | sudo tee -a /opt/jmeter/bin/jmeter.sh > /dev/null

# 5. Python 패키지 설치
echo "--- Python 패키지 설치 ---"
pip3 install requests psycopg2-binary --break-system-packages

# 6. 방화벽 설정
echo "--- 방화벽 설정 ---"
sudo ufw allow 22
sudo ufw --force enable

# 7. 설치 확인
# Node Exporter 설치 (자기 자신도 모니터링)
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

# Docker 설치 (Prometheus + Grafana용)
echo "--- Docker 설치 ---"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

echo ""
echo "=== VM4 설치 완료 ==="
jmeter --version 2>&1 | head -2
python3 --version
echo ""
echo "다음 단계:"
echo "  1. prometheus.yml에서 실제 IP로 교체:"
echo "     sed -i 's/VM1_IP/실제앱IP/g'     ~/deploy/vm4-loadtest/prometheus.yml"
echo "     sed -i 's/VM2_IP/실제APIIP/g'    ~/deploy/vm4-loadtest/prometheus.yml"
echo "     sed -i 's/VM3_IP/실제DBIP/g'     ~/deploy/vm4-loadtest/prometheus.yml"
echo ""
echo "  2. Prometheus + Grafana 실행:"
echo "     cd ~/deploy/vm4-loadtest"
echo "     docker compose -f docker-compose.monitoring.yml up -d"
echo ""
echo "  3. Grafana 접속: http://$(hostname -I | awk '{print $1}'):3000"
echo "     ID: admin  /  PW: admin1234"
echo "     Connections → Data sources → Add → Prometheus"
echo "     URL: http://prometheus:9090  →  Save & test"
echo ""
echo "  4. 테스트 유저 생성:"
echo "     python3 ~/loadtest/scripts/create_users.py --url http://VM2_IP:8000 --count 2000"
echo ""
echo "  5. 부하 테스트 실행:"
echo "     chmod +x ~/deploy/vm4-loadtest/run.sh"
echo "     ~/deploy/vm4-loadtest/run.sh all VM2_IP"
