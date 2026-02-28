import { createDatabaseConnection } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Database } from 'bun:sqlite';
import { logger } from '../utils/logger';

export class DatabaseMigrator {
  private db: Database;

  constructor() {
    this.db = createDatabaseConnection();
  }

  async runMigrations(): Promise<void> {
    logger.task.start('数据库迁移');

    try {
      // 创建迁移记录表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL UNIQUE,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 获取已执行的迁移
      const executedMigrations = this.db.query(`
        SELECT filename FROM migrations ORDER BY id
      `).all().map((row: any) => row.filename);

      // 读取迁移文件
      const migrationFiles = ['001_initial.sql', '002_add_rss_config.sql'];

      for (const filename of migrationFiles) {
        if (executedMigrations.includes(filename)) {
          logger.task.info(`跳过已执行的迁移: ${filename}`);
          continue;
        }

        logger.task.info(`执行迁移: ${filename}`);

        const migrationPath = join(__dirname, 'migrations', filename);
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        // 执行迁移
        this.db.exec(migrationSQL);

        // 记录迁移
        this.db.query(`
          INSERT INTO migrations (filename) VALUES (?)
        `).run(filename);

        logger.task.info(`迁移完成: ${filename}`);
      }

      logger.task.end('数据库迁移');
    } catch (error) {
      logger.error('数据库迁移失败:', error);
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}

// DatabaseMigrator 类已经在上面导出了
