import { Database } from 'bun:sqlite';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface DatabaseConfig {
  path: string;
  options: {
    create?: boolean;
    readwrite?: boolean;
    strict?: boolean;
  };
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'nodeseeker.db');

  return {
    path: dbPath,
    options: {
      create: true,
      readwrite: true,
      strict: true,
    }
  };
};

export const createDatabaseConnection = (): Database => {
  const config = getDatabaseConfig();

  // 确保数据目录存在
  const dbDir = path.dirname(config.path);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(config.path, config.options);

  // 启用 WAL 模式以提高并发性能
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA cache_size = 1000000');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA temp_store = MEMORY');

  return db;
};