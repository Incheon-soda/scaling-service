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
echo ""
echo "=== VM4 설치 완료 ==="
jmeter --version 2>&1 | head -2
python3 --version
echo ""
echo "다음 단계:"
echo "  1. Windows에서 loadtest 폴더 복사:"
echo "     scp -r loadtest/ $(whoami)@$(hostname -I | awk '{print $1}'):~/"
echo ""
echo "  2. 테스트 유저 생성:"
echo "     python3 ~/loadtest/scripts/create_users.py --url http://VM2_IP:8000 --count 2000"
echo ""
echo "  3. 부하 테스트 실행:"
echo "     chmod +x ~/deploy/vm4-loadtest/run.sh"
echo "     ~/deploy/vm4-loadtest/run.sh all VM2_IP"
