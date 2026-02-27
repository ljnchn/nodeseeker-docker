import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { loadEnvConfig, getEnvConfig } from './config/env';
import { DatabaseService } from './services/database';
import { AuthService } from './services/auth';
import { SchedulerService } from './services/scheduler';
import { DatabaseMigrator } from './database/migrate';
import { renderer } from './renderer';

// 导入路由
import { authRoutes } from './routes/auth';
import { apiRoutes } from './routes/api';
import { telegramRoutes } from './routes/telegram';
import { telegramPushRoutes } from './routes/telegramPush';
import { telegramWebhookRoutes } from './routes/telegramWebhook';
import { pageRoutes } from './routes/pages';

// 类型定义
type Bindings = {}

type Variables = {
  dbService: DatabaseService;
  authService: AuthService;
  schedulerService: SchedulerService;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 渲染器中间件
app.use(renderer);

// 静态文件服务
app.use('/css/*', serveStatic({ root: './public' }));
app.use('/js/*', serveStatic({ root: './public' }));
app.use('/images/*', serveStatic({ root: './public' }));

// 全局服务中间件
app.use('*', async (c, next) => {
  if (!c.get('dbService')) {
    const dbService = DatabaseService.create();
    c.set('dbService', dbService);
  }
  
  if (!c.get('authService')) {
    const dbService = c.get('dbService');
    const authService = new AuthService(dbService);
    c.set('authService', authService);
  }
  
  await next();
});


// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 数据库状态检查端点
app.get('/api/db/status', (c) => {
  try {
    const dbService = c.get('dbService');
    const tablesExist = dbService.checkTablesExist();
    const isInitialized = dbService.isInitialized();
    const stats = isInitialized ? dbService.getComprehensiveStats() : null;
    
    return c.json({
      success: true,
      data: {
        tablesExist,
        initialized: isInitialized,
        stats
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: `数据库状态检查失败: ${error}`
    }, 500);
  }
});

// 数据库初始化端点
app.post('/api/db/init', async (c) => {
  try {
    const dbService = c.get('dbService');
    
    // 检查是否已经初始化
    if (dbService.isInitialized()) {
      return c.json({
        success: false,
        message: '数据库已经初始化'
      }, 400);
    }
    
    // 运行数据库迁移
    const migrator = new DatabaseMigrator();
    await migrator.runMigrations();
    migrator.close();
    
    return c.json({
      success: true,
      message: '数据库初始化成功'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: `数据库初始化失败: ${error}`
    }, 500);
  }
});

// 定时任务状态端点
app.get('/api/scheduler/status', (c) => {
  try {
    const schedulerService = c.get('schedulerService');
    if (!schedulerService) {
      return c.json({
        success: false,
        message: '定时任务服务未启动'
      }, 503);
    }
    
    const status = schedulerService.getStatus();
    return c.json({
      success: true,
      data: status
    });
  } catch (error) {
    return c.json({
      success: false,
      message: `获取定时任务状态失败: ${error}`
    }, 500);
  }
});

// 手动执行 RSS 任务端点
app.post('/api/scheduler/rss/run', async (c) => {
  try {
    const schedulerService = c.get('schedulerService');
    if (!schedulerService) {
      return c.json({
        success: false,
        message: '定时任务服务未启动'
      }, 503);
    }
    
    const result = await schedulerService.manualRSSTask();
    return c.json(result);
  } catch (error) {
    return c.json({
      success: false,
      message: `执行 RSS 任务失败: ${error}`
    }, 500);
  }
});

// 路由注册
app.route('/auth', authRoutes);
app.route('/api', apiRoutes);
app.route('/telegram', telegramRoutes);
app.route('/api/push', telegramPushRoutes);
app.route('/api/webhook', telegramWebhookRoutes);
app.route('/', pageRoutes);

// 默认 RSS 配置
const DEFAULT_RSS_CONFIG = {
  url: 'https://rss.nodeseek.com/',
  intervalSeconds: 60,
  proxy: null as string | null,
};

// 初始化数据库
async function initializeDatabase() {
  console.log('初始化数据库...');
  const migrator = new DatabaseMigrator();
  try {
    await migrator.runMigrations();
    migrator.close();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 设置默认 RSS 配置到数据库
async function setupDefaultRssConfig() {
  try {
    const dbService = DatabaseService.create();
    
    // 获取当前配置
    const config = dbService.getBaseConfig();
    
    if (config) {
      // 如果数据库中没有 RSS 配置，则设置默认值
      const updates: { rss_url?: string; rss_interval_seconds?: number; rss_proxy?: string | null } = {};
      
      if (!config.rss_url) {
        updates.rss_url = DEFAULT_RSS_CONFIG.url;
        console.log(`设置默认 RSS URL: ${updates.rss_url}`);
      }
      
      if (!config.rss_interval_seconds) {
        updates.rss_interval_seconds = DEFAULT_RSS_CONFIG.intervalSeconds;
        console.log(`设置默认 RSS 间隔: ${updates.rss_interval_seconds} 秒`);
      }
      
      if (config.rss_proxy === undefined) {
        updates.rss_proxy = DEFAULT_RSS_CONFIG.proxy;
        console.log(`设置默认 RSS 代理: ${updates.rss_proxy || '无'}`);
      }
      
      if (Object.keys(updates).length > 0) {
        dbService.updateBaseConfig(updates);
        console.log('✅ 默认 RSS 配置已写入数据库');
      } else {
        console.log('RSS 配置已存在，跳过默认设置');
      }
    }
    
    dbService.close();
  } catch (error) {
    console.error('设置默认 RSS 配置失败:', error);
  }
}

// 启动服务器
async function startServer() {
  try {
    // 加载环境配置
    const config = await loadEnvConfig();
    
    // 设置 CORS 中间件
    app.use('*', cors({
      origin: config.CORS_ORIGINS.split(','),
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }));
    
    // 初始化数据库
    await initializeDatabase();
    
    // 设置默认 RSS 配置到数据库
    await setupDefaultRssConfig();
    
    console.log(`NodeSeeker 服务器启动成功`);
    console.log(`📍 地址: http://${config.HOST}:${config.PORT}`);
    console.log(`🌍 环境: ${config.NODE_ENV}`);
    console.log(`💾 数据库: ${config.DATABASE_PATH}`);
    
    return config;
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 初始化应用
async function initializeApp() {
  // 加载环境配置
  const config = await loadEnvConfig();
  
  // 设置 CORS 中间件
  app.use('*', cors({
    origin: config.CORS_ORIGINS.split(','),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));
  
  return config;
}

// 导出应用和配置
export { app, initializeApp, startServer };
