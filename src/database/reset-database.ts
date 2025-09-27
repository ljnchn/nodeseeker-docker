#!/usr/bin/env bun
import { createDatabaseConnection, getDatabaseConfig } from '../config/database';
import { DatabaseMigrator } from './migrate';
import { unlinkSync, existsSync } from 'fs';

async function resetDatabase() {
  console.log('开始重置数据库...');

  try {
    const config = getDatabaseConfig();
    const dbPath = config.path;

    // 检查数据库文件是否存在
    if (existsSync(dbPath)) {
      console.log(`删除现有数据库文件: ${dbPath}`);
      unlinkSync(dbPath);
    }

    // 删除 WAL 和 SHM 文件（如果存在）
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;

    if (existsSync(walPath)) {
      console.log(`删除 WAL 文件: ${walPath}`);
      unlinkSync(walPath);
    }

    if (existsSync(shmPath)) {
      console.log(`删除 SHM 文件: ${shmPath}`);
      unlinkSync(shmPath);
    }

    console.log('数据库文件已删除');

    // 重新创建数据库并运行迁移
    console.log('重新创建数据库并运行迁移...');
    const migrator = new DatabaseMigrator();
    await migrator.runMigrations();
    migrator.close();

    console.log('数据库重置完成！');
    process.exit(0);

  } catch (error) {
    console.error('重置数据库失败:', error);
    process.exit(1);
  }
}

// 执行数据库重置
resetDatabase();