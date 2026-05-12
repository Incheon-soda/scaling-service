#!/bin/bash
# Mac에서 실행 — 이미지 빌드 후 Docker Hub에 푸시

set -e

REGISTRY="soldesk1184"
API_URL="${VITE_API_URL:-http://10.0.2.139:8000}"
KAKAO_KEY="${VITE_KAKAO_MAP_KEY:-7f8b9c6ef339ead8af4c274471dd0382}"

echo "=== Docker Hub 로그인 ==="
docker login

echo "=== 백엔드 이미지 빌드 (linux/amd64) ==="
docker buildx build \
  --platform linux/amd64 \
  -t $REGISTRY/stays-backend:latest \
  --push \
  ./backend

echo "=== 프론트엔드 이미지 빌드 (linux/amd64) ==="
docker buildx build \
  --platform linux/amd64 \
  --build-arg VITE_API_URL=$API_URL \
  --build-arg VITE_KAKAO_MAP_KEY=$KAKAO_KEY \
  -t $REGISTRY/stays-frontend:latest \
  --push \
  -f Dockerfile.frontend .

echo "=== 푸시 완료 (buildx --push로 이미 업로드됨) ==="

echo "=== 완료 ==="
echo "백엔드: docker.io/$REGISTRY/stays-backend:latest"
echo "프론트: docker.io/$REGISTRY/stays-frontend:latest"
