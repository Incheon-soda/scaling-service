#!/bin/bash
# Mac M3 (ARM64) 전용 빌드 + Docker Hub 푸시

set -e

REGISTRY="soldesk1184"
API_URL="${VITE_API_URL:-http://192.168.64.3:8000}"
KAKAO_KEY="${VITE_KAKAO_MAP_KEY:-7f8b9c6ef339ead8af4c274471dd0382}"

echo "=== Docker Hub 로그인 ==="
docker login

echo "=== 백엔드 이미지 빌드 (linux/arm64) ==="
docker buildx build \
  --platform linux/arm64 \
  -t $REGISTRY/mac-stays-backend:latest \
  --push \
  ./backend

echo "=== 프론트엔드 이미지 빌드 (linux/arm64) ==="
docker buildx build \
  --platform linux/arm64 \
  --build-arg VITE_API_URL=$API_URL \
  --build-arg VITE_KAKAO_MAP_KEY=$KAKAO_KEY \
  -t $REGISTRY/mac-stays-frontend:latest \
  --push \
  -f Dockerfile.frontend .

echo "=== 완료 ==="
echo "백엔드: docker.io/$REGISTRY/mac-stays-backend:latest"
echo "프론트: docker.io/$REGISTRY/mac-stays-frontend:latest"
