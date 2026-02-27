# TODO

## 多渠道推送

当前只支持 Telegram 推送，需要重构为多渠道架构。

### Phase 1：抽象层 + 数据库迁移

- [ ] 新建 `src/services/push/channel.ts`，定义 `PushChannel` 接口
- [ ] 新建 `src/services/push/manager.ts`，实现 `PushManager` 统一调度（加载渠道、并发推送、记录结果）
- [ ] 新建数据库迁移 `003_add_push_channels.sql`，创建 `push_channels` 表：
  ```sql
  CREATE TABLE push_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,        -- 'telegram'|'bark'|'webhook'|'serverchan'|'email'
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    config TEXT NOT NULL,       -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] 将现有 Telegram 逻辑迁移到 `src/services/push/telegram.ts`，实现 `PushChannel` 接口
- [ ] `MatcherService` 改为依赖 `PushManager` 而非 `TelegramPushService`
- [ ] 数据迁移：把 `base_config` 中的 `bot_token`/`chat_id` 写入 `push_channels` 表

### Phase 2：新增 Bark + Webhook + Server酱

- [ ] `src/services/push/bark.ts` — Bark 推送（iOS），config: `{ server_url, device_key }`
- [ ] `src/services/push/webhook.ts` — 自定义 Webhook，config: `{ url, method, headers, body_template }`，覆盖 Slack/Discord/飞书/钉钉
- [ ] `src/services/push/serverchan.ts` — Server酱（微信推送），config: `{ send_key }`
- [ ] 新增 API 路由：
  - `GET /api/push/channels`
  - `POST /api/push/channels`
  - `PUT /api/push/channels/:id`
  - `DELETE /api/push/channels/:id`
  - `POST /api/push/channels/:id/test`

### Phase 3：邮件 + 前端 UI

- [ ] `src/services/push/email.ts` — SMTP 邮件推送，config: `{ smtp_host, smtp_port, smtp_user, smtp_pass, to }`
- [ ] 前端推送渠道管理 UI：渠道列表卡片 + 添加渠道表单 + 类型选择 + 测试连接
- [ ] Telegram 交互服务（Webhook/Bot 命令）保持独立，不纳入通用推送渠道
