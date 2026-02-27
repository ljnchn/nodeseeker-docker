-- 添加 RSS 配置字段到 base_config 表
ALTER TABLE base_config ADD COLUMN rss_url TEXT DEFAULT 'https://rss.nodeseek.com/';
ALTER TABLE base_config ADD COLUMN rss_interval_seconds INTEGER DEFAULT 60;
ALTER TABLE base_config ADD COLUMN rss_proxy TEXT DEFAULT NULL;

-- 更新索引（如果需要）
-- 注意：SQLite 不支持直接修改列，如需更改默认值需要重建表
