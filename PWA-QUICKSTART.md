# PWA 快速入门指南

## 安装步骤

### 1. 启动应用

```bash
bun run dev
```

应用将在 http://localhost:3010 启动

### 2. 安装 PWA

#### Chrome / Edge 桌面版
1. 打开 http://localhost:3010
2. 点击地址栏右侧的 ➕ 图标（或菜单 → 安装 NodeSeeker）
3. 点击"安装"

#### Chrome Android
1. 打开应用网址
2. 点击菜单 → "添加到主屏幕"
3. 点击"添加"

#### Safari iOS
1. 打开应用网址
2. 点击分享按钮
3. 选择"添加到主屏幕"

### 3. 验证 PWA 功能

打开 Chrome DevTools → Application 标签：

- **Manifest** - 应显示应用信息
- **Service Workers** - 应显示已激活的 SW
- **Cache Storage** - 应显示缓存内容

## 生产环境准备

### 生成 PNG 图标

```bash
# 方法1: HTML 工具（推荐）
# 用浏览器打开 scripts/generate-png-html.html
# 生成并保存所有图标

# 方法2: 如果安装了 sharp
bun run pwa:icons:png
```

### HTTPS 要求

PWA 功能（Service Worker、推送通知）需要 HTTPS：

```bash
# 使用 Docker 部署（自带 HTTPS 支持）
docker-compose up -d

# 或使用反向代理 (nginx/caddy)
```

### 配置推送通知（可选）

```bash
# 生成 VAPID 密钥
npx web-push generate-vapid-keys

# 添加到 .env 文件
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 没有安装提示 | 确保使用 HTTPS 或 localhost |
| Service Worker 未注册 | 检查浏览器控制台错误 |
| 图标不显示 | 运行 `bun run pwa:icons` 生成图标 |
| 离线功能不工作 | 首次访问需要网络连接才能缓存 |

## 测试离线模式

1. 打开应用并等待加载完成
2. 打开 DevTools → Network → 勾选 Offline
3. 刷新页面，应用应能正常显示

## 文件结构

```
public/
├── manifest.json      # PWA 配置
├── sw.js              # Service Worker
├── browserconfig.xml  # Microsoft 配置
├── icons/             # 应用图标
└── js/
    └── pwa-register.js  # PWA 注册脚本
```

## 更新 PWA

修改 Service Worker 后：

1. 修改 `sw.js` 中的 `CACHE_NAME` 版本号
2. 重新部署
3. 客户端会自动检测更新

## 更多信息

- 完整文档: [PWA.md](./PWA.md)
- 图标说明: [public/icons/README.md](./public/icons/README.md)
