# Icons 目录

PWA 和网站图标目录。

## 目录结构

```
public/icons/
├── favicon.ico                 # 主 favicon
├── og-image.png               # Open Graph 图片 (1200x630)
├── pwa-icon-512x512.png       # PWA 启动画面图标 (512x512)
├── favicons/                  # 浏览器 favicon
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   └── favicon-48x48.png
└── apple-touch-icon/          # Apple 设备图标 + PWA 图标
    ├── apple-touch-icon-57x57.png
    ├── apple-touch-icon-60x60.png
    ├── apple-touch-icon-72x72.png
    ├── apple-touch-icon-76x76.png
    ├── apple-touch-icon-114x114.png
    ├── apple-touch-icon-120x120.png
    ├── apple-touch-icon-144x144.png
    ├── apple-touch-icon-152x152.png
    ├── apple-touch-icon-180x180.png
    └── apple-touch-icon-192x192.png   # PWA 必需
```

## 图标用途

| 路径 | 用途 |
|------|------|
| `favicon.ico` | 浏览器标签页图标 |
| `favicons/*.png` | 各种尺寸的浏览器图标 |
| `apple-touch-icon/*.png` | iOS 主屏幕图标 |
| `apple-touch-icon-192x192.png` | **PWA 安装图标 (必需)** |
| `pwa-icon-512x512.png` | **PWA 启动画面 (推荐)** |
| `og-image.png` | 社交媒体分享预览图 |

## PWA 必需图标

为了 PWA 安装提示正常工作，你需要这两个文件：

1. **`apple-touch-icon/apple-touch-icon-192x192.png`** (必需)
   - 用于 PWA 安装图标
   - 如果没有，复制 180x180 并重命名

2. **`pwa-icon-512x512.png`** (推荐)
   - 用于 PWA 启动画面
   - 如果没有，可以将 192x192 放大或重新导出

## 快速修复

如果没有 192x192 和 512x512：

```bash
# 复制 180x180 作为 192x192 (临时方案)
cp apple-touch-icon/apple-touch-icon-180x180.png apple-touch-icon/apple-touch-icon-192x192.png

# 复制 192x192 作为 512x512 (临时方案)
cp apple-touch-icon/apple-touch-icon-192x192.png pwa-icon-512x512.png
```

> 建议后期重新导出清晰的 192x192 和 512x512 图标。
