#!/bin/bash
# VM4 - JMeter 시나리오 실행 스크립트
# 사용법: ./run.sh <시나리오번호> <API_서버_IP>
# 예시:   ./run.sh 1 192.168.100.10
#         ./run.sh all 192.168.100.10

SCENARIO=$1
API_IP=$2

if [ -z "$SCENARIO" ] || [ -z "$API_IP" ]; then
    echo "사용법: ./run.sh <시나리오번호|all> <API_서버_IP>"
    echo "  ./run.sh 1 192.168.100.10   # 시나리오1만 실행"
    echo "  ./run.sh 3 192.168.100.10   # 시나리오3만 실행"
    echo "  ./run.sh all 192.168.100.10 # 전체 순서대로 실행"
    exit 1
fi

LOADTEST_DIR="$HOME/loadtest"
JMX_DIR="$LOADTEST_DIR/jmeter"
RESULT_DIR="$LOADTEST_DIR/results"

mkdir -p "$RESULT_DIR"

run_scenario() {
    local num=$1
    local name=$2

    echo ""
    echo "================================================"
    echo "  시나리오$num 실행: $name"
    echo "  API 서버: http://$API_IP:8000"
    echo "================================================"

    jmeter -n \
        -t "$JMX_DIR/scenario${num}_${name}.jmx" \
        -JBASE_URL="http://$API_IP" \
        -JAPI_PORT=8000 \
        -l "$RESULT_DIR/scenario${num}_result.jtl" \
        -e -o "$RESULT_DIR/scenario${num}_report" \
        2>&1 | grep -E "summary|ERROR|Started|Finished"

    echo "  결과: $RESULT_DIR/scenario${num}_result.jtl"
}

case $SCENARIO in
    1) run_scenario 1 "coupon_rush" ;;
    2) run_scenario 2 "booking_race" ;;
    3) run_scenario 3 "event_open" ;;
    4) run_scenario 4 "read_flood" ;;
    all)
        echo "전체 시나리오 순서대로 실행 (4 → 1 → 3 → 2)"
        run_scenario 4 "read_flood"
        echo "30초 대기 후 다음 시나리오..."
        sleep 30
        run_scenario 1 "coupon_rush"
        sleep 30
        run_scenario 3 "event_open"
        sleep 30
        run_scenario 2 "booking_race"
        echo ""
        echo "=== 전체 완료 ==="
        echo "결과 위치: $RESULT_DIR"
        ;;
    *)
        echo "시나리오 번호는 1~4 또는 all"
        exit 1
        ;;
esac
