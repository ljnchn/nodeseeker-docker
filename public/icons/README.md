# PWA Icons

PWA 图标已基于 `favicon.svg` (📡) 生成。

## 图标列表

### PNG 图标（推荐）

| 文件名 | 尺寸 | 用途 |
|--------|------|------|
| icon-72x72.png | 72x72 | Android 启动图标 |
| icon-96x96.png | 96x96 | Android 启动图标 |
| icon-128x128.png | 128x128 | Chrome Web Store |
| icon-144x144.png | 144x144 | Microsoft 磁贴 |
| icon-152x152.png | 152x152 | iPad 主屏幕 |
| icon-192x192.png | 192x192 | Android 主屏幕 |
| icon-384x384.png | 384x384 | Android 启动画面 |
| icon-512x512.png | 512x512 | Android 启动画面 |
| maskable-icon.png | 512x512 | Android 自适应图标 |

### 源文件

- **favicon.svg** - 主图标源文件（位于 `public/favicon.svg`）
- **maskable-icon.svg** - 自适应图标源文件

## 重新生成图标

如果修改了 `favicon.svg`，可以重新生成 PNG 图标：

```bash
python scripts/generate-favicon-png.py
```

要求：
- Python 3.x
- Pillow (`pip install Pillow`)

或使用 CairoSVG（效果更好）：
```bash
pip install cairosvg
python scripts/generate-favicon-png.py
```

## 图标设计

图标基于 favicon.svg 中的 📡 (卫星天线 emoji)，使用：
- 背景色：`#0f172a`（深蓝 slate）
- 圆角矩形背景
- 蓝色信号塔图形
