#!/usr/bin/env bun
import { loadEnvConfig } from './config/env';
import { DatabaseService } from './services/database';

async function testDatabase() {
  try {
    // 加载环境配置
    await loadEnvConfig();
    
    console.log('🧪 开始测试数据库服务...');
    
    // 创建数据库服务实例
    const dbService = DatabaseService.create();
    
    // 测试1: 检查初始化状态
    console.log('1. 检查数据库初始化状态...');
    const isInitialized = dbService.isInitialized();
    console.log(`   初始化状态: ${isInitialized ? '已初始化' : '未初始化'}`);
    
    // 测试2: 获取统计信息
    console.log('2. 获取数据库统计信息...');
    const stats = dbService.getComprehensiveStats();
    console.log('   统计信息:', JSON.stringify(stats, null, 2));
    
    // 测试3: 获取基础配置
    console.log('3. 获取基础配置...');
    const config = dbService.getBaseConfig();
    console.log(`   配置存在: ${config !== null}`);
    if (config) {
      console.log(`   用户名: ${config.username}`);
      console.log(`   Chat ID: ${config.chat_id}`);
    }
    
    // 测试4: 获取关键词订阅
    console.log('4. 获取关键词订阅...');
    const subscriptions = dbService.getAllKeywordSubs();
    console.log(`   订阅数量: ${subscriptions.length}`);
    
    // 测试5: 获取最近文章
    console.log('5. 获取最近文章...');
    const recentPosts = dbService.getRecentPosts(5);
    console.log(`   最近文章数量: ${recentPosts.length}`);
    
    console.log('✅ 数据库服务测试完成');
    
    // 关闭数据库连接
    dbService.close();
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testDatabase();