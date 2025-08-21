# NodeSeeker Docker 部署指南

本指南将帮助你使用 Docker 部署 NodeSeeker 应用。

## 文件说明

- `Dockerfile` - Docker 镜像构建文件
- `docker-compose.yml` - 开发环境 Docker Compose 配置
- `docker-compose.prod.yml` - 生产环境 Docker Compose 配置
- `.dockerignore` - Docker 构建忽略文件
- `deploy.sh` - 部署脚本（Linux/macOS）

## 快速开始

### 开发环境

1. 确保已安装 Docker 和 Docker Compose
2. 克隆项目到本地
3. 运行以下命令：

```bash
# 构建并启动服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f nodeseeker
```

应用将在 http://localhost:3000 启动。

### 生产环境

1. 设置环境变量：

```bash
export JWT_SECRET="your-super-secret-jwt-key"
export TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
export TELEGRAM_WEBHOOK_URL="https://your-domain.com/telegram/webhook"
```

2. 部署应用：

```bash
# 使用生产配置启动
docker-compose -f docker-compose.prod.yml up --build -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

## 使用部署脚本（Linux/macOS）

部署脚本提供了便捷的部署和管理功能：

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 部署开发环境
./deploy.sh deploy dev

# 部署生产环境
./deploy.sh deploy prod

# 查看日志
./deploy.sh logs prod

# 停止服务
./deploy.sh stop prod

# 重启服务
./deploy.sh restart prod

# 清理未使用的资源
./deploy.sh clean
```

## Windows 部署

在 Windows 上，你可以直接使用 Docker Compose 命令：

```powershell
# 开发环境
docker-compose up --build -d

# 生产环境
docker-compose -f docker-compose.prod.yml up --build -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 配置说明

### 环境变量

生产环境需要设置以下环境变量：

- `JWT_SECRET` - JWT 密钥（必需）
- `TELEGRAM_BOT_TOKEN` - Telegram 机器人令牌（可选）
- `TELEGRAM_WEBHOOK_URL` - Telegram Webhook URL（可选）

### 数据持久化

- 开发环境：数据存储在 Docker 卷中
- 生产环境：数据存储在 `/opt/nodeseeker/data` 目录


## 监控和日志

### 查看日志

```bash
# 查看应用日志
docker-compose logs -f nodeseeker

# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看所有服务日志
docker-compose logs -f
```

### 健康检查

应用包含健康检查端点 `/health`，Docker 会自动监控服务状态。

### 自动更新（生产环境）

生产配置包含 Watchtower 服务，可以自动更新容器镜像。

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   # 或者修改 docker-compose.yml 中的端口映射
   ```

2. **权限问题**
   ```bash
   # 确保数据目录权限正确
   sudo chown -R $USER:$USER /opt/nodeseeker/data
   ```

3. **容器无法启动**
   ```bash
   # 查看详细错误信息
   docker-compose logs nodeseeker
   ```

### 重置环境

```bash
# 停止并删除所有容器、网络、卷
docker-compose down -v

# 清理未使用的资源
docker system prune -a
```

## 备份和恢复

### 备份数据

```bash
# 备份数据库
docker cp nodeseeker-app:/usr/src/app/data/nodeseeker.db ./backup/

# 或者直接备份数据卷
docker run --rm -v nodeseeker_data:/data -v $(pwd):/backup alpine tar czf /backup/nodeseeker-backup.tar.gz -C /data .
```

### 恢复数据

```bash
# 恢复数据库
docker cp ./backup/nodeseeker.db nodeseeker-app:/usr/src/app/data/

# 或者恢复整个数据卷
docker run --rm -v nodeseeker_data:/data -v $(pwd):/backup alpine tar xzf /backup/nodeseeker-backup.tar.gz -C /data
```

## 性能优化

1. **资源限制**：在 docker-compose.yml 中添加内存和 CPU 限制
2. **日志轮转**：配置日志轮转以防止日志文件过大

## 安全建议

1. 使用强密码和密钥
2. 定期更新 Docker 镜像
3. 配置防火墙规则
4. 启用 HTTPS
5. 定期备份数据
6. 监控系统资源使用情况