# NodeSeeker Docker - RSS 监控系统

[![Docker Build](https://github.com/ljnchn/NodeSeeker-docker/actions/workflows/docker-build.yml/badge.svg)](https://github.com/ljnchn/NodeSeeker-docker/actions/workflows/docker-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Image](https://img.shields.io/docker/v/ljnchn/nodeseeker-docker?label=Docker)](https://github.com/ljnchn/NodeSeeker-docker/pkgs/container/nodeseeker-docker)
[![Bun](https://img.shields.io/badge/Bun-1.0+-ff69b4.svg)](https://bun.sh/)

基于 Bun + Hono.js + SQLite 的高性能 NodeSeek RSS 监控和 Telegram 推送系统。

## ✨ 功能特性

- 🔄 **自动 RSS 抓取** - 定时抓取 NodeSeek 社区 RSS 数据
- 🎯 **智能关键词匹配** - 支持多关键词组合匹配，按创建者和分类过滤
- 📱 **Telegram Bot 推送** - 实时推送匹配文章到 Telegram
- 🌐 **RESTful API** - 完整的 API 接口支持
- ⚡ **高性能架构** - 基于 Bun 运行时的极致性能
- 🗄️ **SQLite 数据库** - 稳定可靠的本地数据库
- 🔐 **安全认证** - JWT 认证和密码加密存储
- 📊 **实时统计** - 详细的推送统计和系统监控

## 🚀 Docker 部署（推荐）

### 快速启动

```bash
# 1. 拉取镜像
docker pull ghcr.io/ljnchn/nodeseeker-docker:latest

# 2. 运行容器
docker run -d \
  --name nodeseeker \
  -p 3010:3010 \
  -v nodeseeker_data:/usr/src/app/data \
  -e JWT_SECRET=your-very-secure-jwt-secret-key-at-least-32-characters-long \
  ghcr.io/ljnchn/nodeseeker-docker:latest
```

### Docker Compose 部署

```bash
# 1. 克隆项目
git clone https://github.com/ljnchn/NodeSeeker-docker.git
cd NodeSeeker-docker

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，重要：修改 JWT_SECRET

# 3. 启动服务
docker-compose up -d

# 4. 检查状态
docker-compose logs -f nodeseeker
```

### 生产环境部署

```bash
# 使用生产配置
docker-compose -f docker-compose.prod.yml up -d

# 检查健康状态
curl http://localhost:3010/health
```

## 📋 环境变量配置

### 必需配置

```bash
# JWT 密钥（生产环境必须修改为至少32字符）
JWT_SECRET=your-very-secure-jwt-secret-key-at-least-32-characters-long

# 数据库路径（Docker 环境建议保持默认）
DATABASE_PATH=/usr/src/app/data/nodeseeker.db
```

### 可选配置

```bash
# 服务器配置
PORT=3010
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3010,https://your-domain.com

# RSS 配置
RSS_URL=https://rss.nodeseek.com/
RSS_CRON_EXPRESSION=*/1 * * * *  # 每分钟检查

# Telegram Bot（可通过 Web 界面配置）
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

## 🔧 系统初始化

1. **访问应用**: http://localhost:3010
2. **创建管理员账户**: 首次访问时设置用户名和密码
3. **配置 Telegram Bot**:
   - 在 Telegram 中找到 @BotFather
   - 发送 `/newbot` 创建新的 Bot
   - 获取 Bot Token 并在系统中配置
   - 向 Bot 发送 `/start` 完成绑定

## 🤖 Telegram Bot 命令

- `/start` - 绑定账户并查看欢迎信息
- `/list` - 查看订阅列表
- `/add 关键词1 关键词2` - 添加订阅（最多3个关键词）
- `/del 订阅ID` - 删除订阅
- `/post` - 查看最近文章
- `/stop` / `/resume` - 停止/恢复推送

## 🔌 API 接口

### 认证接口
- `GET /auth/status` - 检查系统状态
- `POST /auth/login` - 用户登录
- `GET /auth/verify` - 验证 Token

### 订阅管理
- `GET /api/subscriptions` - 获取订阅列表
- `POST /api/subscriptions` - 添加订阅
- `PUT /api/subscriptions/:id` - 更新订阅
- `DELETE /api/subscriptions/:id` - 删除订阅

### 文章管理
- `GET /api/posts` - 获取文章列表
- `POST /api/rss/fetch` - 手动抓取 RSS

### 系统管理
- `GET /api/stats` - 获取统计信息
- `GET /health` - 健康检查

## 🛠️ 本地开发

### 环境要求
- [Bun](https://bun.sh/) 1.0+
- Node.js 18+ （可选）

### 开发步骤

```bash
# 1. 克隆项目
git clone https://github.com/ljnchn/NodeSeeker-docker.git
cd NodeSeeker-docker

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 初始化数据库
bun run db:migrate

# 5. 启动开发服务器
bun run dev
```

### 开发命令

```bash
bun run dev          # 开发模式（热重载）
bun run build        # 构建项目
bun run start        # 生产模式
bun run db:migrate   # 数据库迁移
bun test            # 运行测试
```

## 📁 项目结构

```
src/
├── config/          # 配置文件
├── database/        # 数据库迁移
├── routes/          # API 路由
├── services/        # 业务逻辑服务
├── components/      # React 组件
├── types/           # TypeScript 类型
└── utils/           # 工具函数
```

## 🔧 故障排除

### 常见问题

1. **端口冲突** - 修改 `.env` 中的 `PORT` 配置
2. **数据库权限** - 确保 data 目录有写权限
3. **Telegram Bot 无响应** - 检查 Token 并发送 `/start` 绑定
4. **RSS 抓取失败** - 检查网络连接和 RSS 源可用性

### 诊断命令

```bash
# Docker 环境
docker-compose logs nodeseeker
docker-compose ps
curl http://localhost:3010/health

# 本地开发
bun run src/test-db.ts  # 测试数据库连接
```

## 📊 监控和维护

### 健康检查
```bash
curl http://localhost:3010/health
```

### 日志查看
```bash
# Docker 日志
docker-compose logs -f nodeseeker

# 容器内日志
docker exec -it nodeseeker-app ls /usr/src/app/logs/
```

### 数据备份
```bash
# 备份数据卷
docker run --rm -v nodeseeker_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
```

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 🙏 技术栈

- [Bun](https://bun.sh/) - 高性能 JavaScript 运行时
- [Hono.js](https://hono.dev/) - 轻量级 Web 框架  
- [SQLite](https://sqlite.org/) - 本地数据库
- [grammY](https://grammy.dev/) - Telegram Bot 框架
