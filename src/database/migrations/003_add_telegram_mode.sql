-- 添加 Telegram 交互模式配置字段到 base_config 表
-- 可选值: 'disabled' (默认), 'webhook', 'polling'
ALTER TABLE base_config ADD COLUMN telegram_mode TEXT DEFAULT 'disabled';
