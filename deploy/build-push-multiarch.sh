#!/bin/bash
# ARM64 + AMD64 멀티아치 빌드 → Docker Hub 푸시
# Mac에서 실행

set -e

REGISTRY="soldesk1184"
PLATFORM="linux/amd64,linux/arm64"
KAKAO_KEY="${VITE_KAKAO_MAP_KEY:-7f8b9c6ef339ead8af4c274471dd0382}"
API_URL="${VITE_API_URL:-http://192.168.64.3:8000}"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "================================================"
echo " 멀티아치 빌드 시작 (amd64 + arm64)"
echo " API URL: $API_URL"
echo " Registry: $REGISTRY"
echo "================================================"
echo ""

# buildx builder 확인 및 생성
if ! docker buildx inspect multiarch-builder &>/dev/null; then
  echo "=== buildx builder 생성 ==="
  docker buildx create --name multiarch-builder --use
  docker buildx inspect --bootstrap
else
  docker buildx use multiarch-builder
fi

echo ""
echo "=== Docker Hub 로그인 ==="
docker login

echo ""
echo "=== [1/4] stays-api (FastAPI 백엔드) ==="
docker buildx build \
  --platform $PLATFORM \
  -t $REGISTRY/stays-api:latest \
  --push \
  $PROJECT_ROOT/backend

echo ""
echo "=== [2/4] stays-app (React 프론트엔드) ==="
docker buildx build \
  --platform $PLATFORM \
  --build-arg VITE_API_URL=$API_URL \
  --build-arg VITE_KAKAO_MAP_KEY=$KAKAO_KEY \
  -t $REGISTRY/stays-app:latest \
  --push \
  -f $PROJECT_ROOT/Dockerfile.frontend \
  $PROJECT_ROOT

echo ""
echo "=== [3/4] stays-db (PostgreSQL 16 + schema) ==="
docker buildx build \
  --platform $PLATFORM \
  -t $REGISTRY/stays-db:latest \
  --push \
  -f $PROJECT_ROOT/deploy/Dockerfile.db \
  $PROJECT_ROOT/deploy/mac-vm3-db

echo ""
echo "=== [4/4] stays-loadtest (JMeter 5.6.3) ==="
docker buildx build \
  --platform $PLATFORM \
  -t $REGISTRY/stays-loadtest:latest \
  --push \
  -f $PROJECT_ROOT/deploy/Dockerfile.loadtest \
  $PROJECT_ROOT/deploy/mac-vm4-loadtest/loadtest

echo ""
echo "================================================"
echo " 완료"
echo "================================================"
echo " stays-api:      docker.io/$REGISTRY/stays-api:latest"
echo " stays-app:      docker.io/$REGISTRY/stays-app:latest"
echo " stays-db:       docker.io/$REGISTRY/stays-db:latest"
echo " stays-loadtest: docker.io/$REGISTRY/stays-loadtest:latest"
echo "================================================"
echo ""
echo "사용법:"
echo "  VITE_API_URL=http://<vm-ip>:8000 ./build-push-multiarch.sh"
