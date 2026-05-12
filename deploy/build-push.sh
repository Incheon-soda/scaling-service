#!/bin/bash
# Mac에서 실행 — 이미지 빌드 후 Docker Hub에 푸시

set -e

REGISTRY="dk12dl"
API_URL="${VITE_API_URL:-http://VM1_IP:8000}"
KAKAO_KEY="${VITE_KAKAO_MAP_KEY:-}"

echo "=== Docker Hub 로그인 ==="
docker login

echo "=== 백엔드 이미지 빌드 ==="
docker build -t $REGISTRY/stays-backend:latest ./backend

echo "=== 프론트엔드 이미지 빌드 ==="
docker build \
  --build-arg VITE_API_URL=$API_URL \
  --build-arg VITE_KAKAO_MAP_KEY=$KAKAO_KEY \
  -t $REGISTRY/stays-frontend:latest \
  -f Dockerfile.frontend .

echo "=== Docker Hub 푸시 ==="
docker push $REGISTRY/stays-backend:latest
docker push $REGISTRY/stays-frontend:latest

echo "=== 완료 ==="
echo "백엔드: docker.io/$REGISTRY/stays-backend:latest"
echo "프론트: docker.io/$REGISTRY/stays-frontend:latest"
