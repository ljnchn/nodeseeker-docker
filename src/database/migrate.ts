import { createDatabaseConnection } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Database } from 'bun:sqlite';

export class DatabaseMigrator {
  private db: Database;

  constructor() {
    this.db = createDatabaseConnection();
  }

  async runMigrations(): Promise<void> {
    console.log('开始数据库迁移...');

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
      const migrationFiles = ['001_initial.sql'];

      for (const filename of migrationFiles) {
        if (executedMigrations.includes(filename)) {
          console.log(`跳过已执行的迁移: ${filename}`);
          continue;
        }

        console.log(`执行迁移: ${filename}`);
        
        const migrationPath = join(__dirname, 'migrations', filename);
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        // 执行迁移
        this.db.exec(migrationSQL);

        // 记录迁移
        this.db.query(`
          INSERT INTO migrations (filename) VALUES (?)
        `).run(filename);

        console.log(`迁移完成: ${filename}`);
      }

      console.log('所有数据库迁移完成');
    } catch (error) {
      console.error('数据库迁移失败:', error);
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}

// DatabaseMigrator 类已经在上面导出了