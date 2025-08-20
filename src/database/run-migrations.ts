#!/usr/bin/env bun
import { DatabaseMigrator } from './migrate';

// 运行数据库迁移
async function runMigrations() {
  const migrator = new DatabaseMigrator();
  try {
    await migrator.runMigrations();
    migrator.close();
    console.log('迁移完成，程序退出');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    migrator.close();
    process.exit(1);
  }
}

// 执行迁移
runMigrations();