#!/bin/bash

# Docker 构建和推送脚本
set -e

echo "🐳 开始构建 Docker 镜像..."

# 构建镜像
docker build -t ersichub/nodeseeker:latest -t ersichub/nodeseeker:v0.01 -t ersichub/nodeseeker:0.01 .

echo "✅ 镜像构建完成"

# 检查是否已登录
echo "🔐 检查 Docker Hub 登录状态..."
if ! docker info | grep -q "Username"; then
    echo "需要登录到 Docker Hub..."
    docker login
fi

echo "🚀 开始推送镜像到 Docker Hub..."

# 推送镜像
docker push ersichub/nodeseeker:latest
docker push ersichub/nodeseeker:v0.01
docker push ersichub/nodeseeker:0.01

echo "✅ 所有镜像推送完成！"

# 显示镜像信息
echo "📦 镜像信息："
docker images | grep ersichub/nodeseeker

echo ""
echo "🎉 部署完成！用户现在可以使用以下命令拉取镜像："
echo "docker pull ersichub/nodeseeker:latest"
echo "docker pull ersichub/nodeseeker:v0.01"
echo ""
echo "📋 Docker Hub 地址: https://hub.docker.com/r/ersichub/nodeseeker"