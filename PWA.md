# NodeSeeker PWA 功能文档

本文档介绍 NodeSeeker 的渐进式 Web 应用 (PWA) 功能。

## 功能特性

### ✅ 已实现

- **Web App Manifest** - 应用配置和元数据
- **Service Worker** - 离线缓存和后台同步
- **安装提示** - 支持添加到主屏幕
- **离线访问** - 核心功能离线可用
- **后台同步** - RSS 检查任务后台执行
- **推送通知** - 支持 Web Push API
- **主题适配** - 自动适配系统和应用主题

### 📱 PWA 支持

| 功能 | 状态 | 说明 |
|------|------|------|
| 离线缓存 | ✅ | 静态资源和 API 数据 |
| 后台同步 | ✅ | RSS 定时检查 |
| 推送通知 | ✅ | 需要配置 VAPID 密钥 |
| 安装提示 | ✅ | 自动显示安装按钮 |
| 主题色 | ✅ | 蓝色主题 (#3b82f6) |
| 快捷方式 | ✅ | 仪表盘/关键词/设置 |

## 文件结构

```
public/
├── manifest.json          # PWA 配置清单
├── sw.js                  # Service Worker
├── browserconfig.xml      # Microsoft 配置
├── icons/                 # 应用图标
│   ├── icon-72x72.svg     # SVG 图标源文件
│   ├── icon-96x96.svg
│   ├── ...
│   ├── icon-512x512.svg
│   └── maskable-icon.svg  # 自适应图标
└── js/
    └── pwa-register.js    # PWA 注册脚本

src/
├── renderer.tsx           # 包含 PWA meta 标签
└── index.ts               # 包含静态文件路由
```

## 快速开始

### 1. 生成 PNG 图标（生产环境推荐）

虽然现代浏览器支持 SVG 图标，但为了最佳兼容性，建议生成 PNG 版本：

**方法 A: HTML 工具（最简单）**
```bash
# 在浏览器中打开
open scripts/generate-png-html.html

# 点击"生成图标"按钮，右键保存每个图标为 PNG
```

**方法 B: Python 脚本**
```bash
pip install cairosvg Pillow
python scripts/generate_png_icons.py
```

**方法 C: Node.js**
```bash
npm install sharp
node scripts/convert-svg-to-png.js
```

### 2. 配置推送通知（可选）

如需启用推送通知功能，需要在环境变量中添加 VAPID 密钥：

```bash
# .env 文件
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

生成 VAPID 密钥：
```bash
npx web-push generate-vapid-keys
```

### 3. 构建和部署

```bash
# 开发模式
bun run dev

# 生产构建
bun run build
bun run start
```

## PWA 配置

### Manifest 配置

`public/manifest.json` 包含以下关键配置：

- **name**: NodeSeeker RSS 监控
- **short_name**: NodeSeeker
- **theme_color**: #3b82f6 (蓝色)
- **background_color**: #0f172a (深蓝)
- **display**: standalone
- **scope**: /
- **start_url**: /

### Service Worker 缓存策略

| 资源类型 | 策略 | 说明 |
|----------|------|------|
| 静态资源 (CSS/JS/图片) | Cache First | 优先使用缓存，后台更新 |
| API 请求 | Network First | 优先网络，失败回退缓存 |
| 页面导航 | Network First | 支持离线访问首页 |

### 缓存版本管理

Service Worker 使用版本号管理缓存：
- `STATIC_CACHE`: 静态资源缓存
- `DYNAMIC_CACHE`: 动态 API 数据缓存

更新缓存版本号 (`sw.js` 中的 `CACHE_NAME`) 可强制客户端更新。

## 浏览器支持

| 浏览器 | 支持程度 | 说明 |
|--------|----------|------|
| Chrome | ✅ 完全支持 | 最佳体验 |
| Edge | ✅ 完全支持 | 基于 Chromium |
| Firefox | ✅ 完全支持 | 部分功能需要权限 |
| Safari | ⚠️ 基本支持 | iOS 需要手动添加到主屏幕 |
| Samsung Internet | ✅ 完全支持 | 基于 Chromium |

## 离线功能

### 离线可用页面

- ✅ 首页 (/)
- ✅ 登录页 (/login)
- ✅ 仪表盘 (/dashboard) - 缓存数据
- ⚠️ 其他页面 - 回退到首页

### 离线行为

1. 首次访问时自动缓存核心资源
2. 离线时显示离线状态提示
3. API 请求返回友好的离线错误信息
4. 重新联网时自动同步数据

## 开发调试

### Chrome DevTools

1. 打开 DevTools (F12)
2. 切换到 **Application** 标签
3. 查看:
   - **Manifest** - PWA 配置
   - **Service Workers** - SW 状态
   - **Cache Storage** - 缓存内容
   - **Push** - 推送测试

### 测试离线模式

```javascript
// 在 Console 中模拟离线
window.NodeSeekerPWA.state.isOnline = false;

// 触发网络状态变化
dispatchEvent(new Event('offline'));
```

### 手动更新 Service Worker

```javascript
// 检查更新
window.NodeSeekerPWA.checkForUpdate();

// 查看当前状态
console.log(window.NodeSeekerPWA.state);
```

## 故障排除

### 问题: Service Worker 未注册

**解决方案:**
1. 确保使用 HTTPS 或 localhost
2. 检查 `sw.js` 路径是否正确
3. 查看浏览器控制台错误信息

### 问题: 图标不显示

**解决方案:**
1. 检查 `public/icons/` 目录是否存在
2. 确认 manifest.json 中的图标路径正确
3. 尝试生成 PNG 版本图标

### 问题: 离线模式不工作

**解决方案:**
1. 确保首次访问时网络正常（才能缓存资源）
2. 检查 Service Worker 是否激活
3. 清除缓存后重新加载页面

### 问题: 推送通知不工作

**解决方案:**
1. 检查通知权限是否已授予
2. 确认 VAPID 密钥配置正确
3. 查看 Service Worker 日志

## 性能优化

### 缓存策略优化

根据资源类型选择合适的缓存策略：

```javascript
// 静态资源 - 长期缓存
const STATIC_ASSETS = [
    '/css/style.css',
    '/js/app.js',
    '/icons/icon-192x192.png'
];

// API 数据 - 短期缓存
const API_CACHE_DURATION = 5 * 60 * 1000; // 5分钟
```

### 懒加载

```javascript
// 动态导入大型组件
const HeavyComponent = () => import('./HeavyComponent.js');
```

### 预加载关键资源

```html
<link rel="preload" href="/css/style.css" as="style">
<link rel="preload" href="/js/app.js" as="script">
```

## 参考资源

- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA 检查清单](https://web.dev/pwa-checklist/)
- [Workbox](https://developers.google.com/web/tools/workbox)

## 更新日志

### 2024-03-05
- 初始 PWA 实现
- 添加 Service Worker 离线缓存
- 实现安装提示功能
- 添加推送通知支持
