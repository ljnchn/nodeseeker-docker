#!/usr/bin/env bun
import { createDatabaseConnection } from '../config/database';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const SALT_ROUNDS = 10;

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function resetUser() {
  console.log('=====================================');
  console.log('      NodeSeeker 用户重置工具       ');
  console.log('=====================================\n');

  const db = createDatabaseConnection();

  try {
    // 检查是否存在用户配置
    const configRow = db.query('SELECT id, username FROM base_config LIMIT 1').get() as { id: number; username: string } | null;
    
    if (!configRow) {
      console.log('❌ 未找到用户配置，请先初始化系统');
      process.exit(1);
    }

    console.log(`当前用户: ${configRow.username || '(未设置)'}\n`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const newUsername = await question(rl, '请输入新用户名 (直接回车清空用户): ');
    
    if (!newUsername) {
      // 留空 - 清除用户数据
      console.log('\n⚠️  警告: 这将清除所有用户数据包括登录会话！');
      const confirm = await question(rl, '确认清除? 输入 "yes" 继续: ');
      
      if (confirm.toLowerCase() !== 'yes') {
        console.log('\n❌ 操作已取消');
        rl.close();
        process.exit(0);
      }

      // 清除所有 sessions
      db.query('DELETE FROM sessions').run();
      console.log('✅ 已清除所有登录会话');

      // 重置 base_config 中的用户数据（保留其他配置如 bot_token 等）
      db.query(`
        UPDATE base_config 
        SET username = '', 
            password = '', 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(configRow.id);
      
      console.log('✅ 已清空用户账号信息');
      console.log('\n💡 系统需要重新初始化才能使用');
      
    } else {
      // 重置用户名和密码
      const newPassword = await question(rl, '请输入新密码: ');
      
      if (!newPassword) {
        console.log('\n❌ 密码不能为空');
        rl.close();
        process.exit(1);
      }

      const confirmPassword = await question(rl, '请再次输入新密码: ');
      
      if (newPassword !== confirmPassword) {
        console.log('\n❌ 两次输入的密码不一致');
        rl.close();
        process.exit(1);
      }

      if (newPassword.length < 6) {
        console.log('\n❌ 密码长度至少6个字符');
        rl.close();
        process.exit(1);
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // 清除所有 sessions（强制重新登录）
      db.query('DELETE FROM sessions').run();
      console.log('\n✅ 已清除所有登录会话');

      // 更新用户数据
      db.query(`
        UPDATE base_config 
        SET username = ?, 
            password = ?, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(newUsername, hashedPassword, configRow.id);

      console.log('✅ 用户名和密码已重置');
      console.log(`\n💡 新用户名: ${newUsername}`);
      console.log('💡 请使用新密码登录');
    }

    rl.close();
    db.close();
    console.log('\n=====================================');
    console.log('           操作完成！               ');
    console.log('=====================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 重置用户失败:', error);
    db.close();
    process.exit(1);
  }
}

// 执行重置
resetUser();
