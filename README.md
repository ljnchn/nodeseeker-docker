# NodeSeeker Docker - RSS 监控系统

基于 Bun + Hono.js + SQLite 的 NodeSeek RSS 监控和 Telegram 推送系统，从 Cloudflare Workers 版本移植而来。

## ✨ 功能特性

- 🔄 **自动 RSS 抓取**：定时抓取 NodeSeek 社区 RSS 数据，确保信息不遗漏
- 🎯 **智能关键词匹配**：支持多关键词组合匹配，可按创建者和分类进行精准过滤
- 📱 **Telegram Bot 推送**：实时将匹配的文章推送到您的 Telegram，随时随地掌握动态
- 🌐 **RESTful API**：提供完整的 API 接口，支持所有功能的程序化访问
- ⚡ **高性能架构**：基于 Bun 运行时，享受极致的性能和低内存占用
- 🗄️ **SQLite 数据库**：使用 SQLite 本地数据库，稳定可靠，无需额外配置
- 🔐 **安全认证**：内置 JWT 认证和密码加密存储，保障您的账户安全
- 📊 **实时统计**：提供详细的推送统计和系统状态监控
- 🕐 **定时任务**：使用 node-cron 实现可靠的定时任务调度

## 🚀 快速开始

### 1. 安装依赖
```sh
bun install
```

### 2. 配置环境变量
```sh
cp .env.example .env
# 编辑 .env 文件，设置必要的配置
```

**重要：** 请务必修改 `JWT_SECRET` 为一个至少32字符的随机字符串！

### 3. 初始化数据库
```sh
bun run db:migrate
```

### 4. 启动服务器
```sh
# 开发模式（热重载）
bun run dev

# 生产模式
bun run start
```

### 5. 初始化系统
1. 访问 http://localhost:3001
2. 首次访问会提示创建管理员账户
3. 设置用户名和密码完成初始化

### 6. 配置 Telegram Bot
1. 在 Telegram 中找到 @BotFather
2. 发送 `/newbot` 创建新的 Bot
3. 获取 Bot Token
4. 在系统中配置 Bot Token
5. 在 Telegram 中向您的 Bot 发送 `/start` 完成绑定

## 📋 环境变量说明

### 必需配置
- `JWT_SECRET`: JWT 密钥（至少32字符，生产环境必须修改）
- `DATABASE_PATH`: SQLite 数据库文件路径

### 服务器配置
- `PORT`: 服务器端口（默认: 3001）
- `HOST`: 服务器主机（默认: 0.0.0.0）
- `NODE_ENV`: 运行环境（development/production）
- `CORS_ORIGINS`: 允许的跨域源

### RSS 配置
- `RSS_URL`: RSS 源地址（默认: https://rss.nodeseek.com/）
- `RSS_TIMEOUT`: RSS 请求超时时间（毫秒）
- `RSS_USER_AGENT`: RSS 请求的 User-Agent
- `RSS_CHECK_ENABLED`: 是否启用 RSS 检查（默认: true）
- `RSS_CRON_EXPRESSION`: RSS 检查频率（默认: 每分钟）

### 数据清理配置
- `DATA_CLEANUP_ENABLED`: 是否启用数据清理（默认: true）
- `CLEANUP_CRON_EXPRESSION`: 清理任务频率（默认: 每天凌晨2点）
- `DATA_RETENTION_DAYS`: 数据保留天数（默认: 30天）

### Telegram 配置（可选）
- `TELEGRAM_BOT_TOKEN`: Telegram Bot Token（也可通过 API 设置）
- `TELEGRAM_WEBHOOK_URL`: Webhook URL（用于生产环境）

## 🛠️ 开发命令

```sh
# 开发
bun run dev          # 启动开发服务器（热重载）
bun run build        # 构建项目
bun run start        # 启动生产服务器

# 数据库
bun run db:migrate   # 运行数据库迁移

# 测试
bun test            # 运行测试
bun run src/test-db.ts  # 测试数据库连接
```

## 📁 项目结构

```
src/
├── config/          # 配置文件
│   ├── database.ts  # 数据库配置
│   ├── env.ts       # 环境变量配置
│   ├── jobs.ts      # 定时任务配置
│   └── server.ts    # 服务器配置
├── database/        # 数据库相关
│   ├── migrations/  # 数据库迁移文件
│   └── migrate.ts   # 迁移执行器
├── routes/          # API 路由
│   ├── api.ts       # 主要 API 路由
│   ├── auth.ts      # 认证路由
│   └── telegram.ts  # Telegram 相关路由
├── services/        # 业务逻辑服务
│   ├── auth.ts      # 认证服务
│   ├── database.ts  # 数据库服务
│   ├── matcher.ts   # 匹配服务
│   ├── rss.ts       # RSS 服务
│   ├── scheduler.ts # 定时任务服务
│   └── telegram.ts  # Telegram 服务
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
│   ├── helpers.ts   # 通用工具函数
│   └── validation.ts # 数据验证工具
├── index.ts         # 应用入口
└── server.ts        # 服务器启动文件
```

## 🔌 API 接口

### 认证接口
- `GET /auth/status` - 检查系统初始化状态
- `POST /auth/init` - 系统初始化
- `POST /auth/login` - 用户登录
- `POST /auth/refresh` - 刷新 Token
- `GET /auth/verify` - 验证 Token

### 配置管理
- `GET /api/config` - 获取系统配置
- `PUT /api/config` - 更新系统配置
- `POST /api/bot-token` - 设置 Telegram Bot Token

### 订阅管理
- `GET /api/subscriptions` - 获取订阅列表
- `POST /api/subscriptions` - 添加订阅
- `PUT /api/subscriptions/:id` - 更新订阅
- `DELETE /api/subscriptions/:id` - 删除订阅

### 文章管理
- `GET /api/posts` - 获取文章列表（支持分页和过滤）
- `POST /api/rss/fetch` - 手动抓取 RSS
- `POST /api/posts/:postId/push/:subId` - 手动推送文章

### 统计信息
- `GET /api/stats` - 获取系统统计信息
- `GET /api/match-stats` - 获取匹配统计信息

### 系统管理
- `POST /api/cleanup` - 手动执行数据清理
- `GET /api/rss/validate` - 验证 RSS 源可用性
- `GET /api/scheduler/status` - 获取定时任务状态
- `POST /api/scheduler/rss/run` - 手动执行 RSS 任务

### Telegram 集成
- `POST /telegram/webhook` - Telegram Webhook 处理
- `POST /telegram/set-webhook` - 设置 Webhook URL
- `GET /telegram/bot-info` - 获取 Bot 信息
- `POST /telegram/test-message` - 发送测试消息

## 🤖 Telegram Bot 命令

绑定成功后，您可以在 Telegram 中使用以下命令：

- `/start` - 绑定账户并查看欢迎信息
- `/help` - 查看帮助信息
- `/getme` - 查看 Bot 和绑定状态信息
- `/list` - 查看订阅列表
- `/add 关键词1 关键词2` - 添加订阅（最多3个关键词）
- `/del 订阅ID` - 删除订阅
- `/post` - 查看最近文章
- `/stop` - 停止推送
- `/resume` - 恢复推送
- `/unbind` - 解除用户绑定

## 🔄 从 Cloudflare Workers 迁移

本项目完全兼容原 Cloudflare Workers 版本的数据结构和 API 设计，主要差异：

### 技术栈变化
- **运行时**: Cloudflare Workers → Bun
- **数据库**: Cloudflare D1 → SQLite (better-sqlite3)
- **定时任务**: Cloudflare Cron Triggers → node-cron
- **部署**: Cloudflare → 自托管

### 功能增强
- ✅ 更好的错误处理和日志记录
- ✅ 完整的数据验证和类型安全
- ✅ 优化的数据库查询和缓存
- ✅ 灵活的配置管理
- ✅ 完整的 API 文档

### 迁移步骤
1. 导出 Cloudflare D1 数据库数据
2. 运行本项目的数据库迁移
3. 导入数据到 SQLite
4. 配置环境变量
5. 启动服务

## 🚀 部署指南

### Docker 部署（推荐）
```sh
# 构建镜像
docker build -t nodeseeker .

# 运行容器
docker run -d \
  --name nodeseeker \
  -p 3001:3001 \
  -v ./data:/app/data \
  -e JWT_SECRET=your-secret-key \
  nodeseeker
```

### 直接部署
```sh
# 安装依赖
bun install

# 运行数据库迁移
bun run db:migrate

# 启动服务
bun run start
```

### PM2 部署
```sh
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
   - 修改 `.env` 文件中的 `PORT` 配置

2. **数据库连接失败**
   - 检查 `DATABASE_PATH` 配置
   - 确保数据目录有写权限

3. **Telegram Bot 无响应**
   - 检查 Bot Token 是否正确
   - 确保已发送 `/start` 命令绑定

4. **RSS 抓取失败**
   - 检查网络连接
   - 验证 RSS 源是否可访问

### 日志查看
```sh
# 查看实时日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

## 📝 开发指南

### 添加新的 API 端点
1. 在 `src/routes/` 中添加路由定义
2. 在 `src/services/` 中实现业务逻辑
3. 在 `src/utils/validation.ts` 中添加数据验证
4. 更新类型定义

### 添加新的定时任务
1. 在 `src/services/scheduler.ts` 中添加任务定义
2. 配置 cron 表达式
3. 实现任务逻辑

### 数据库迁移
1. 在 `src/database/migrations/` 中创建新的 SQL 文件
2. 更新 `src/database/migrate.ts` 中的文件列表
3. 运行 `bun run db:migrate`

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

- 原项目：[NodeSeeker](https://github.com/ljnchn/NodeSeeker)
- 技术栈：[Bun](https://bun.sh/) + [Hono.js](https://hono.dev/) + [SQLite](https://sqlite.org/)
- Telegram Bot：[grammY](https://grammy.dev/)
