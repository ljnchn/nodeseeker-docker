# NodeSeeker 项目分析报告

## 项目概述

NodeSeeker 是一个基于 Cloudflare Workers 的智能 RSS 监控和 Telegram 推送系统，专门用于监控 NodeSeek 社区的最新动态。

## 核心功能

1. **RSS 监控**: 定时抓取 NodeSeek 社区 RSS 数据
2. **智能匹配**: 支持多关键词组合匹配，按创建者和分类过滤
3. **Telegram 推送**: 实时推送匹配文章到 Telegram
4. **Web 管理界面**: 提供管理订阅规则和系统配置的界面
5. **用户认证**: JWT 认证和密码加密存储
6. **定时任务**: 使用 Cloudflare Workers 的 cron triggers

## 技术架构

### 当前技术栈 (Cloudflare Worker)
- **平台**: Cloudflare Workers + Hono.js + Vite
- **数据库**: Cloudflare D1 (SQLite)
- **前端**: 原生 HTML/CSS/JavaScript (TSX)
- **认证**: JWT + BCrypt
- **推送**: Telegram Bot API (grammy)
- **RSS 解析**: 自定义 XML 解析器

### 目标技术栈 (Bun + Hono.js)
- **运行时**: Bun
- **框架**: Hono.js
- **数据库**: SQLite (better-sqlite3)
- **定时任务**: node-cron
- **其他**: 保持现有的业务逻辑和 API 设计

## 数据库结构

### 表结构
1. **base_config**: 系统基础配置
   - 用户认证信息 (username, password)
   - Telegram Bot 配置 (bot_token, chat_id)
   - 推送设置 (stop_push, only_title)

2. **posts**: RSS 文章数据
   - 文章信息 (post_id, title, memo, category, creator)
   - 推送状态 (push_status: 0未推送, 1已推送, 2无需推送)
   - 时间信息 (pub_date, push_date)

3. **keywords_sub**: 关键词订阅
   - 关键词匹配 (keyword1, keyword2, keyword3)
   - 过滤条件 (creator, category)

## 核心服务分析

### 1. DatabaseService
- 数据库操作封装
- 查询缓存机制
- 数据清理功能

### 2. RSSService
- RSS 数据抓取 (https://rss.nodeseek.com/)
- 自定义 XML 解析
- 文章去重和存储

### 3. TelegramService
- Telegram Bot API 集成
- 消息推送功能
- 用户绑定管理

### 4. MatcherService
- 关键词匹配逻辑
- 推送规则处理
- 批量推送管理

### 5. AuthService
- JWT 认证
- 密码加密验证
- 会话管理

## API 端点

### 认证相关
- `POST /auth/login` - 用户登录
- `POST /auth/init` - 系统初始化

### 配置管理
- `GET /api/config` - 获取配置
- `PUT /api/config` - 更新配置
- `POST /api/bot-token` - 设置 Bot Token

### 订阅管理
- `GET /api/subscriptions` - 获取订阅列表
- `POST /api/subscriptions` - 添加订阅
- `DELETE /api/subscriptions/:id` - 删除订阅

### 文章管理
- `GET /api/posts` - 获取文章列表
- `POST /api/rss/fetch` - 手动抓取 RSS

### Telegram 集成
- `POST /telegram/webhook` - Telegram Webhook

## 定时任务

使用 Cloudflare Workers 的 cron triggers (每分钟执行):
1. RSS 数据抓取
2. 文章匹配和推送
3. 数据清理

## 移植要点

### 需要适配的部分
1. **数据库**: Cloudflare D1 → SQLite (better-sqlite3)
2. **定时任务**: Cloudflare cron triggers → node-cron
3. **环境变量**: Cloudflare bindings → Node.js env
4. **部署配置**: wrangler.jsonc → package.json scripts

### 可以复用的部分
1. **业务逻辑**: 所有 service 层代码
2. **API 设计**: Hono.js 路由和中间件
3. **数据模型**: TypeScript 接口定义
4. **前端界面**: TSX 组件和样式

### 主要差异
1. **运行环境**: Worker Runtime → Node.js/Bun Runtime
2. **数据库连接**: D1 bindings → SQLite 文件连接
3. **定时任务**: 内置 cron → 外部 cron 库
4. **静态资源**: Cloudflare Assets → 本地文件服务

## 移植策略

1. **保持 API 兼容性**: 确保前端无需修改
2. **渐进式移植**: 按服务模块逐步移植
3. **配置适配**: 环境变量和配置文件转换
4. **测试验证**: 确保功能完整性