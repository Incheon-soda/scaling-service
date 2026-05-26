# JMeter 부하테스트 결과 보기 가이드

---

## 1. JMeter GUI 기본 Listener

테스트 실행 중/후 왼쪽 트리에서 클릭하면 실시간으로 확인 가능.

### Summary Report (요약 보고서)
가장 기본. 테스트 전체 요약을 테이블로 보여줌.

| 컬럼 | 의미 |
|---|---|
| # Samples | 총 요청 수 |
| Average | 평균 응답시간 (ms) |
| Min / Max | 최소/최대 응답시간 |
| Std. Dev. | 응답시간 표준편차 (낮을수록 안정적) |
| Error % | 실패율 (0% 목표) |
| Throughput | 초당 처리량 (req/s) |
| Received KB/s | 초당 수신 데이터량 |

**쿠폰 선착순 시나리오 기준 정상 범위:**
- Error % → 쿠폰 소진 후 실패 증가 = 정상 (재고 소진 의미)
- Throughput → 낮아지면 서버 병목 발생 중

---

### View Results Tree (결과 트리)
요청/응답 개별 확인. 실패한 요청 원인 디버깅할 때 사용.

- 초록색 = 성공 / 빨간색 = 실패
- 클릭하면 Request Body, Response Data 확인 가능
- **1000명 테스트할 땐 켜지 말 것** → 메모리 폭발

---

### Aggregate Report (집계 보고서)
Summary Report와 유사하지만 **Median(중앙값), 90th/95th/99th percentile** 추가.

| 컬럼 | 의미 |
|---|---|
| Median | 응답시간 중앙값 |
| 90% Line | 90%의 요청이 이 시간 안에 완료 |
| 99% Line | 99%의 요청이 이 시간 안에 완료 (최악 케이스) |

---

### Active Threads Over Time
시간별 동시 접속자 수 그래프. 기본 JMeter에는 없고 **jp@gc 플러그인** 필요.

---

## 2. 테스트 실행 방법

### GUI 모드 (확인용)
```
JMeter 상단 초록 실행 버튼 (▶) 클릭
→ 왼쪽 트리에서 Summary Report 클릭해서 실시간 확인
```

### CLI 모드 (실제 부하용, 권장)
```bash
cd ~/vm4-loadtest
./apache-jmeter-*/bin/jmeter -n \
  -t loadtest/jmeter/scenario1_coupon_rush.jmx \
  -l results/scenario1_result.jtl \
  -e -o results/scenario1_html
```

| 옵션 | 의미 |
|---|---|
| `-n` | non-GUI 모드 |
| `-t` | 테스트 계획 파일 (.jmx) |
| `-l` | 결과 저장 파일 (.jtl) |
| `-e -o` | HTML 리포트 자동 생성 |

---

## 3. CLI 실행 중 실시간 모니터링

터미널에 이런 출력이 나옴:
```
summary +    500 in 00:00:05 =  100.0/s Err:     0 (0.00%)
summary +    500 in 00:00:05 =  100.0/s Err:   432 (86.40%)
```

| 항목 | 의미 |
|---|---|
| 500 in 00:00:05 | 5초 동안 500건 처리 |
| 100.0/s | 초당 100건 처리 |
| Err: 432 (86.40%) | 쿠폰 소진으로 실패 급증 → CPU 스파이크 트리거 |

---

## 4. HTML 리포트 보기

CLI 실행 후 자동 생성:
```bash
# VM4 브라우저에서
firefox results/scenario1_html/index.html
```

또는 Mac으로 복사:
```bash
scp -r user@10.0.2.136:~/vm4-loadtest/results/scenario1_html/ ~/Desktop/
```

---

## 5. Grafana와 함께 보기 (권장)

JMeter와 Grafana를 **동시에** 띄우면 임팩트 최대.

| 화면 | 확인 내용 |
|---|---|
| JMeter Summary Report | 요청 수, 에러율, Throughput |
| Grafana - Node Exporter (VM2) | CPU 급등 시각화 |
| Grafana - PostgreSQL Exporter | DB 락 대기, 쿼리 시간 |

**Grafana 주소:** `http://10.0.2.136:3000`

---

## 6. users.csv 준비 (테스트 전 필수)

```bash
# VM2에서 유저 2000명 생성
ssh user@10.0.2.138
cd ~/loadtest
python3 scripts/create_users.py --url http://10.0.2.138:8000 --count 2000

# users.csv 위치 확인
ls ~/loadtest/scripts/users.csv
wc -l ~/loadtest/scripts/users.csv  # 2001줄이어야 함 (헤더 포함)
```

---

## 7. 시나리오별 실행 순서

```bash
# 시나리오 1: 쿠폰 선착순 폭발 (CPU 스파이크 핵심)
./apache-jmeter-*/bin/jmeter -n -t loadtest/jmeter/scenario1_coupon_rush.jmx -l results/s1.jtl

# 시나리오 3: 이벤트 오픈 동시 접속
./apache-jmeter-*/bin/jmeter -n -t loadtest/jmeter/scenario3_event_open.jmx -l results/s3.jtl
```

> 시나리오 1 실행 후 쿠폰이 소진됨. 재실행 전 DB에서 쿠폰 재고 초기화 필요.
