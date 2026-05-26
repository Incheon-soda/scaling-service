# MSA 서비스 설계 문서

> **목표**: 동일한 숙소 예약 앱을 온프레미스 K8s(kubeadm)와 AWS EKS(eksctl)에 각각 배포하여
> 성능 / 비용 / 운영 복잡도를 정량 비교한다.

---

## 팀 구성

| 역할 | 담당 |
|---|---|
| **앱 개발팀** | MSA 서비스 코드 작성 + docker-compose 로컬 검증 |
| **온프레미스팀** | kubeadm 클러스터 구성 + 동일 앱 배포 + 부하테스트 |
| **AWS팀** | EKS 클러스터 구성 + 동일 앱 배포 + 부하테스트 |

- 앱 코드는 **하나**. 두 팀은 동일한 컨테이너 이미지를 각자 환경에 배포한다.
- K8s 매니페스트도 `base/`는 공통, 환경 차이만 `overlay/`로 분리한다.

---

## 아키텍처 개요

```
                        ┌─────────────────────────────────┐
                        │         Nginx Ingress           │
                        │  /auth/*  /stays/*  /events/*   │
                        │  /coupons/*  /bookings/*        │
                        └──┬──────┬──────┬──────┬─────────┘
                           │      │      │      │
               ┌───────────┘  ┌───┘  ┌───┘  ┌───┘
               │              │      │      │
        ┌──────▼──┐  ┌────────▼─┐  ┌─▼──────┐  ┌──────────┐  ┌──────────────┐
        │  auth   │  │  stays   │  │ event  │  │  coupon  │  │   booking    │
        │ :8001   │  │  :8002   │  │ :8003  │  │  :8004   │  │   :8005      │
        └────┬────┘  └────┬─────┘  └───┬────┘  └────┬─────┘  └──────┬───────┘
             │            │            │             │               │
             └────────────┴────────────┴─────────────┴───────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │   PostgreSQL 16 (공유)   │
                          └─────────────────────────┘

                                booking-service
                                      │
                                      │ (예약 완료 후 이벤트 발행)
                                      ▼
                                    Redis
                                      │
                                      ▼
                             notification-service
                                   :8006
```

---

## 서비스 정의

### 1. auth-service (:8001)

| 항목 | 내용 |
|---|---|
| 역할 | 회원가입 / 로그인 / JWT 발급 |
| DB 테이블 | `users` |
| 주요 API | `POST /auth/signup`, `POST /auth/login` |
| 스케일 특성 | 경량, 세션당 1~2회 호출 |
| HPA 필요 | 낮음 |

---

### 2. stays-service (:8002)

| 항목 | 내용 |
|---|---|
| 역할 | 숙소 목록 / 상세 / 객실 / 리뷰 조회 |
| DB 테이블 | `stays`, `rooms`(읽기), `stay_images`, `amenities`, `stay_amenities`, `reviews` |
| 주요 API | `GET /stays`, `GET /stays/:id`, `GET /stays/:id/rooms`, `GET /stays/:id/reviews` |
| 스케일 특성 | 읽기 전용, 트래픽 비례 선형 확장 |
| HPA 필요 | 중간 (브라우징 트래픽 증가 시) |

---

### 3. event-service (:8003)

| 항목 | 내용 |
|---|---|
| 역할 | 이벤트 목록 / 상세 (참여 숙소 포함) 조회 |
| DB 테이블 | `events`, `event_stays` |
| 주요 API | `GET /events`, `GET /events/:id` |
| 스케일 특성 | 읽기 전용, 이벤트 오픈 시 트래픽 급증 |
| HPA 필요 | 중간 |

---

### 4. coupon-service (:8004) ★ HPA 데모 핵심

| 항목 | 내용 |
|---|---|
| 역할 | 쿠폰 발급 / 내 쿠폰 조회 / 쿠폰 검증 |
| DB 테이블 | `coupons` |
| 주요 API | `POST /coupons/issue`, `GET /coupons/me`, `POST /coupons/validate` |
| 스케일 특성 | **쓰기 + DB FOR UPDATE 락 + 동시성 경합 → CPU 스파이크** |
| HPA 필요 | **높음** — 이 서비스의 pod 증가가 주요 시연 포인트 |

> **동시성 처리 전략**: `SELECT ... FOR UPDATE` (비관적 락)
> 동시 100명 쿠폰 발급 요청 → DB 락 경합 → CPU 급등 → HPA 트리거

---

### 5. booking-service (:8005)

| 항목 | 내용 |
|---|---|
| 역할 | 예약 생성 / 내 예약 조회 / 예약 상세 |
| DB 테이블 | `bookings` + `rooms`(쓰기) + `coupons`(쓰기) 직접 접근 |
| 주요 API | `POST /bookings`, `GET /bookings/me`, `GET /bookings/:id` |
| 스케일 특성 | DB 락으로 인해 pod 증가 효과 제한적 — **스케일 한계 시연 포인트** |
| HPA 필요 | 중간 |

> **공유 DB 특이사항**: 예약 생성 시 `rooms.remaining_count`와 `coupons.is_used`를
> 하나의 트랜잭션에서 처리. 공유 DB 전략으로 크로스 서비스 트랜잭션 문제 없음.

---

### 6. notification-service (:8006)

| 항목 | 내용 |
|---|---|
| 역할 | 예약 완료 알림 저장 / 조회 |
| DB 테이블 | `notifications` (신규) |
| 메시지 소비 | Redis Pub/Sub 구독 (`booking.confirmed` 채널) |
| 주요 API | `GET /notifications/me` |
| 스케일 특성 | 경량, 비동기 소비 |
| HPA 필요 | 낮음 |

> **비동기 패턴 시연**: booking-service가 예약 완료 후 Redis에 이벤트 발행.
> notification-service가 구독하여 처리. notification-service 장애 시 예약은 영향 없음.

---

## 인프라 컴포넌트

| 컴포넌트 | 역할 | K8s 구성 |
|---|---|---|
| PostgreSQL 16 | 공유 DB (전 서비스) | StatefulSet, PVC |
| Redis 7 | notification 메시지 브로커 | StatefulSet |
| Nginx | API Gateway / Ingress | Deployment or Ingress Controller |

---

## 기술 스택 버전 (확정)

### 프론트엔드

| 항목 | 버전 | 용도 |
|---|---|---|
| Node.js | **20** | 런타임 / Base 이미지: `node:20-alpine` |
| TypeScript | **5.8.3** | 언어 |
| React | **18.3.1** | UI 프레임워크 |
| Vite | **5.4.19** | 빌드 도구 |
| React Router DOM | **6.30.1** | 클라이언트 라우팅 |
| TanStack Query | **5.83.0** | 서버 상태 관리 (API 캐싱) |
| React Hook Form | **7.61.1** | 폼 상태 관리 |
| Zod | **3.25.76** | 스키마 유효성 검사 |
| Tailwind CSS | **3.4.17** | 스타일링 |
| shadcn/ui (Radix UI) | 최신 | UI 컴포넌트 라이브러리 |
| Leaflet | **1.9.4** | 지도 |
| Recharts | **2.15.4** | 차트 |
| Sonner | **1.7.4** | 토스트 알림 |
| Vitest | **3.2.4** | 테스트 |

### 백엔드 (서비스 공통)

| 항목 | 버전 | 용도 |
|---|---|---|
| Python | **3.11.9** | 언어 / Base 이미지: `python:3.11.9-slim` |
| FastAPI | **0.115.6** | 웹 프레임워크 |
| uvicorn | **0.34.0** | ASGI 서버 |
| asyncpg | **0.30.0** | PostgreSQL 비동기 드라이버 |
| pydantic | **2.10.4** | 데이터 유효성 검사 / 직렬화 |
| pydantic-settings | **2.7.1** | 환경변수 설정 관리 |
| python-jose | **3.3.0** | JWT 생성 / 검증 |
| passlib + bcrypt | **1.7.4 / 4.0.1** | 비밀번호 해싱 (auth-service 전용) |
| redis (aioredis) | **최신** | Redis Pub/Sub (notification-service 전용) |

### 인프라

| 항목 | 버전 | 비고 |
|---|---|---|
| PostgreSQL | **16** | K8s StatefulSet, 양쪽 환경 동일 |
| PostgreSQL | **16** | 공유 DB / Base 이미지: `postgres:16` |
| Redis | **7.x** | K8s StatefulSet |
| Kubernetes | **v1.30** | 온프레미스 / EKS 동일 버전 |
| Container Runtime | **containerd 1.7** | |
| Docker | **최신** | 로컬 개발 + 이미지 빌드 |
| Nginx | **1.27** | API Gateway (로컬) / Ingress Controller (K8s) |

---

## 환경별 구성

### A. 온프레미스 K8s

| 항목 | 내용 |
|---|---|
| 설치 도구 | **kubeadm** |
| OS | Ubuntu 22.04 LTS |
| VM 구성 | master 1대 + worker 2대 (UTM) |
| VM 사양 | 각 2C / 4GB RAM |
| 네트워크 플러그인 | Flannel (or Calico) |
| Ingress Controller | Nginx Ingress Controller |
| 로드밸런서 | MetalLB |
| 스토리지 | Local PV (hostPath) |
| 모니터링 | Prometheus + Grafana (클러스터 내 배포) |
| 이미지 레지스트리 | ECR (공통) |

```
kubeadm 설치 순서:
  1. 모든 VM: containerd, kubeadm, kubelet, kubectl 설치
  2. master: kubeadm init
  3. master: Flannel CNI 설치
  4. worker × 2: kubeadm join
  5. master: MetalLB, Nginx Ingress Controller 설치
  6. 앱 배포
```

### B. AWS EKS

| 항목 | 내용 |
|---|---|
| 설치 도구 | **eksctl** |
| OS | Amazon Linux 2023 |
| 노드 타입 | t3.medium × 2~3 |
| Auto Scaling | EKS Managed Node Group |
| Ingress Controller | AWS Load Balancer Controller (ALB) |
| 스토리지 | EBS CSI Driver |
| 모니터링 | CloudWatch Container Insights + Prometheus |
| 이미지 레지스트리 | ECR (공통) |
| DB | PostgreSQL StatefulSet on EKS (RDS 미사용 — 비교 공정성) |

```
eksctl 설치 순서:
  1. eksctl create cluster (클러스터 + 노드 그룹 생성)
  2. AWS Load Balancer Controller 설치
  3. EBS CSI Driver 설치
  4. ECR 접근 권한 설정
  5. 앱 배포 (온프레미스와 동일 매니페스트 + overlay)
```

---

## 개발 순서 (앱 개발팀)

서비스를 **하나씩** 만들고 docker-compose로 검증한 후 다음 서비스로 진행한다.
문제가 생기면 방금 추가한 서비스가 원인임을 바로 알 수 있다.

```
Step 1   postgres 단독 실행
         → DB 연결 확인

Step 2   + auth-service          ← 이미 완성
         → POST /auth/signup, POST /auth/login 확인

Step 3   + stays-service
         → GET /stays, GET /stays/:id 확인

Step 4   + event-service
         → GET /events, GET /events/:id 확인

Step 5   + coupon-service
         → POST /coupons/issue (동시성 테스트 포함)

Step 6   + booking-service
         → POST /bookings (쿠폰 적용, 객실 차감 확인)

Step 7   + redis + notification-service
         → 예약 후 알림 수신 확인

Step 8   + nginx (api-gateway)
         → 전체 경로 통합 테스트

Step 9   JMeter 시나리오 실행 (로컬 docker-compose 대상)
         → K8s 배포 전 동작 최종 확인
```

---

## 폴더 구조

```
Test_server/
│
├── services/                         ← MSA 서비스 코드 (이 폴더)
│   ├── README.md                     ← 이 문서
│   ├── auth-service/                 ✅ 완성
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   ├── auth.py
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── stays-service/                🔲 미완성
│   ├── event-service/                🔲 미완성
│   ├── coupon-service/               🔲 미완성
│   ├── booking-service/              🔲 미완성
│   ├── notification-service/         🔲 미완성 (신규)
│   └── api-gateway/                  🔲 미완성 (nginx.conf)
│
├── k8s/                              ← K8s 매니페스트
│   ├── base/                         ← 공통 (양 팀 공유)
│   │   ├── postgres.yaml
│   │   ├── redis.yaml
│   │   ├── auth-service.yaml
│   │   ├── stays-service.yaml
│   │   ├── event-service.yaml
│   │   ├── coupon-service.yaml
│   │   ├── booking-service.yaml
│   │   ├── notification-service.yaml
│   │   └── hpa.yaml
│   ├── onprem/                       ← 온프레미스 오버레이
│   │   ├── kustomization.yaml
│   │   └── storage.yaml              (Local PV)
│   └── eks/                          ← EKS 오버레이
│       ├── kustomization.yaml
│       └── storage.yaml              (EBS CSI)
│
├── infra/
│   ├── onprem/
│   │   └── kubeadm-setup.sh          ← kubeadm 설치 스크립트
│   └── eks/
│       └── eksctl-config.yaml        ← EKS 클러스터 설정
│
├── loadtest/
│   └── jmeter/
│       ├── scenario1_coupon_rush.jmx  ← 양쪽 동일 스크립트 사용
│       └── scenario3_event_open.jmx
│
├── monitoring/
│   ├── prometheus/
│   └── grafana/
│
├── docker-compose.yml                ← 로컬 전체 통합 테스트용
└── backend/                          ← 기존 모놀리식 (참조용, 수정 안 함)
```

---

## 부하테스트 시나리오 (JMeter, 양 환경 동일 조건)

| 시나리오 | 내용 | 주요 측정 지표 |
|---|---|---|
| S1: 정상 트래픽 | 동시 유저 10명, 숙소 조회 + 예약 | 응답시간(p95), TPS |
| S2: 쿠폰 러시 | 동시 100명 POST /coupons/issue | 오류율, p99 응답시간, coupon-service CPU |
| S3: HPA 스케일 아웃 | 트래픽 단계적 증가 → HPA 동작 | 스케일 시작 시간, pod 수 변화, 안정화 시간 |
| S4: 장애 주입 | notification-service pod 강제 종료 | 예약 영향 여부, 복구 시간(MTTR) |

---

## 비교 관점

| 관점 | 온프레미스 K8s | AWS EKS |
|---|---|---|
| 초기 구축 시간 | 길다 (kubeadm 단계별 수동) | 짧다 (eksctl 자동화) |
| Control Plane 관리 | 직접 관리 (etcd, apiserver) | AWS 관리형 |
| 스케일 아웃 속도 | VM 자원 한계 내에서 pod 증가 | 노드 자동 추가 가능 |
| HPA pod 확장 | 빠름 (기존 노드 내) | 빠름 (기존 노드 내) |
| 노드 부족 시 | 불가 (VM 고정) | EC2 자동 추가 |
| 비용 | 학원 장비 전기세 | 실제 AWS 과금 |
| 모니터링 구성 | Prometheus + Grafana 직접 설치 | CloudWatch 기본 제공 |
| 네트워크 | 학원 내부망 | VPC 완전 제어 |
| 운영 복잡도 | 높음 | 낮음 |
