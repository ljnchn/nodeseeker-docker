import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { loadEnvConfig, getEnvConfig } from './config/env';
import { DatabaseService } from './services/database';
import { AuthService } from './services/auth';
import { SchedulerService } from './services/scheduler';
import { DatabaseMigrator } from './database/migrate';
import { renderer } from './renderer';
import { logger } from './utils/logger';

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
app.use('/icons/*', serveStatic({ root: './public' }));
app.use('/manifest.json', serveStatic({ path: './public/manifest.json' }));
app.use('/sw.js', serveStatic({ path: './public/sw.js' }));
app.use('/browserconfig.xml', serveStatic({ path: './public/browserconfig.xml' }));

// PWA 调试端点
app.get('/pwa-check', (c) => {
    return c.html(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PWA 状态检查 - NodeSeeker</title>
    <link rel="manifest" href="/manifest.json">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #3b82f6; margin-bottom: 10px; }
        .subtitle { color: #94a3b8; margin-bottom: 30px; }
        .card {
            background: #1e293b;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #334155;
        }
        .card h2 {
            color: #60a5fa;
            font-size: 16px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #334155;
        }
        .status-item:last-child { border-bottom: none; }
        .status-label { color: #cbd5e1; }
        .status-value {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        .status-ok { background: #10b981; color: white; }
        .status-error { background: #ef4444; color: white; }
        .status-warn { background: #f59e0b; color: white; }
        .status-info { background: #3b82f6; color: white; }
        .install-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
            display: none;
        }
        .install-btn:hover { background: #2563eb; }
        .install-btn.visible { display: block; }
        .tips {
            background: #1e293b;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            border-radius: 0 8px 8px 0;
            margin-top: 20px;
        }
        .tips h3 { color: #fbbf24; margin-bottom: 10px; }
        .tips ul { padding-left: 20px; }
        .tips li { margin: 8px 0; color: #cbd5e1; }
        code {
            background: #334155;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📡 PWA 状态检查</h1>
        <p class="subtitle">检查 Progressive Web App 的安装条件</p>

        <div class="card">
            <h2>🔒 安全上下文</h2>
            <div class="status-item">
                <span class="status-label">协议</span>
                <span class="status-value" id="protocol">检查中...</span>
            </div>
            <div class="status-item">
                <span class="status-label">主机名</span>
                <span class="status-value" id="hostname">检查中...</span>
            </div>
        </div>

        <div class="card">
            <h2>📋 Manifest 清单</h2>
            <div class="status-item">
                <span class="status-label">状态</span>
                <span class="status-value" id="manifest-status">检查中...</span>
            </div>
            <div class="status-item">
                <span class="status-label">名称</span>
                <span class="status-value status-info" id="manifest-name">-</span>
            </div>
            <div class="status-item">
                <span class="status-label">图标数量</span>
                <span class="status-value status-info" id="manifest-icons">-</span>
            </div>
        </div>

        <div class="card">
            <h2>⚙️ Service Worker</h2>
            <div class="status-item">
                <span class="status-label">支持状态</span>
                <span class="status-value" id="sw-support">检查中...</span>
            </div>
            <div class="status-item">
                <span class="status-label">注册状态</span>
                <span class="status-value" id="sw-registered">检查中...</span>
            </div>
            <div class="status-item">
                <span class="status-label">激活状态</span>
                <span class="status-value" id="sw-active">检查中...</span>
            </div>
        </div>

        <div class="card">
            <h2>📱 安装状态</h2>
            <div class="status-item">
                <span class="status-label">是否可以安装</span>
                <span class="status-value" id="can-install">检查中...</span>
            </div>
            <div class="status-item">
                <span class="status-label">当前模式</span>
                <span class="status-value status-info" id="display-mode">检查中...</span>
            </div>
            <button class="install-btn" id="install-btn">安装应用</button>
        </div>

        <div class="tips">
            <h3>💡 常见问题</h3>
            <ul>
                <li><strong>没有安装按钮？</strong> 确保使用 <code>http://localhost:3010</code> 访问</li>
                <li><strong>Service Worker 失败？</strong> 按 F12 打开 DevTools 查看 Console 错误</li>
                <li><strong>Manifest 错误？</strong> 检查 <code>/manifest.json</code> 是否能正常访问</li>
                <li><strong>Chrome 不显示安装图标？</strong> 确保使用 HTTPS 或 Localhost</li>
                <li><strong>强制刷新：</strong> 按 <code>Ctrl+Shift+R</code> 清除缓存</li>
            </ul>
        </div>
    </div>

    <script>
        async function checkPWA() {
            // 检查协议和主机
            const isHTTPS = location.protocol === 'https:';
            const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            
            document.getElementById('protocol').textContent = location.protocol;
            document.getElementById('protocol').className = 'status-value ' + (isHTTPS || isLocalhost ? 'status-ok' : 'status-error');
            
            document.getElementById('hostname').textContent = location.hostname;
            document.getElementById('hostname').className = 'status-value ' + (isLocalhost ? 'status-ok' : 'status-info');

            // 检查 Manifest
            try {
                const response = await fetch('/manifest.json');
                if (response.ok) {
                    const manifest = await response.json();
                    document.getElementById('manifest-status').textContent = '正常';
                    document.getElementById('manifest-status').className = 'status-value status-ok';
                    document.getElementById('manifest-name').textContent = manifest.short_name || manifest.name || '-';
                    document.getElementById('manifest-icons').textContent = (manifest.icons?.length || 0) + ' 个';
                } else {
                    document.getElementById('manifest-status').textContent = '错误 ' + response.status;
                    document.getElementById('manifest-status').className = 'status-value status-error';
                }
            } catch (e) {
                document.getElementById('manifest-status').textContent = '无法访问';
                document.getElementById('manifest-status').className = 'status-value status-error';
            }

            // 检查 Service Worker
            const hasSW = 'serviceWorker' in navigator;
            document.getElementById('sw-support').textContent = hasSW ? '支持' : '不支持';
            document.getElementById('sw-support').className = 'status-value ' + (hasSW ? 'status-ok' : 'status-error');

            if (hasSW) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    document.getElementById('sw-registered').textContent = '已注册';
                    document.getElementById('sw-registered').className = 'status-value status-ok';
                    
                    if (registration.active) {
                        document.getElementById('sw-active').textContent = '已激活';
                        document.getElementById('sw-active').className = 'status-value status-ok';
                    } else {
                        document.getElementById('sw-active').textContent = '等待中';
                        document.getElementById('sw-active').className = 'status-value status-warn';
                    }
                } else {
                    document.getElementById('sw-registered').textContent = '未注册';
                    document.getElementById('sw-registered').className = 'status-value status-error';
                    document.getElementById('sw-active').textContent = '-';
                    document.getElementById('sw-active').className = 'status-value status-info';
                }
            }

            // 检查安装状态
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
            document.getElementById('display-mode').textContent = isStandalone ? '独立应用' : '浏览器';

            // 检查是否可以安装
            let deferredPrompt = null;
            
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                document.getElementById('can-install').textContent = '可以安装';
                document.getElementById('can-install').className = 'status-value status-ok';
                document.getElementById('install-btn').classList.add('visible');
            });

            // 如果没有触发 beforeinstallprompt
            setTimeout(() => {
                if (!deferredPrompt && !isStandalone) {
                    document.getElementById('can-install').textContent = '暂不可安装';
                    document.getElementById('can-install').className = 'status-value status-warn';
                }
            }, 1000);

            // 安装按钮
            document.getElementById('install-btn').addEventListener('click', async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.getElementById('can-install').textContent = '已安装';
                    document.getElementById('install-btn').classList.remove('visible');
                }
                deferredPrompt = null;
            });
        }

        checkPWA();
    </script>
</body>
</html>`);
});

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
  logger.db('初始化数据库...');
  const migrator = new DatabaseMigrator();
  try {
    await migrator.runMigrations();
    migrator.close();
    logger.success('数据库初始化完成');
  } catch (error) {
    logger.error('数据库初始化失败:', error);
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
      const updates: { rss_url?: string; rss_interval_seconds?: number; rss_proxy?: string } = {};
      
      if (!config.rss_url) {
        updates.rss_url = DEFAULT_RSS_CONFIG.url;
        logger.rss(`设置默认 RSS URL: ${updates.rss_url}`);
      }
      
      if (!config.rss_interval_seconds) {
        updates.rss_interval_seconds = DEFAULT_RSS_CONFIG.intervalSeconds;
        logger.rss(`设置默认 RSS 间隔: ${updates.rss_interval_seconds} 秒`);
      }
      
      if (config.rss_proxy === undefined) {
        updates.rss_proxy = DEFAULT_RSS_CONFIG.proxy || '';
        logger.rss(`设置默认 RSS 代理: ${updates.rss_proxy || '无'}`);
      }
      
      if (Object.keys(updates).length > 0) {
        dbService.updateBaseConfig(updates);
        logger.success('默认 RSS 配置已写入数据库');
      } else {
        logger.info('RSS 配置已存在，跳过默认设置');
      }
    }
    
    dbService.close();
  } catch (error) {
    logger.error('设置默认 RSS 配置失败:', error);
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
    
    logger.server('NodeSeeker 服务器启动成功');
    logger.stats({
      '地址': `http://${config.HOST}:${config.PORT}`,
      '环境': config.NODE_ENV,
      '数据库': config.DATABASE_PATH,
    });
    
    return config;
  } catch (error) {
    logger.error('服务器启动失败:', error);
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
