# NodeSeeker 样式规范

## 概述

NodeSeeker 采用统一的 Apple 风格设计系统，包含一致的配色、圆角、阴影和交互效果。

## 设计原则

- **简洁**: 去除多余装饰，保持界面清爽
- **一致**: 所有组件遵循统一的设计语言
- **层次**: 通过阴影和色彩建立视觉层次
- **反馈**: 交互状态有明确的视觉反馈

## CSS 变量

### 颜色系统

```css
:root {
  /* 主色调 */
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #60a5fa;
  --primary-alpha: rgba(59, 130, 246, 0.1);
  
  /* 功能色 */
  --success: #10b981;
  --success-alpha: rgba(16, 185, 129, 0.1);
  --warning: #f59e0b;
  --warning-alpha: rgba(245, 158, 11, 0.1);
  --danger: #ef4444;
  --danger-alpha: rgba(239, 68, 68, 0.1);
  
  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: rgba(255, 255, 255, 0.8);
  --bg-card: #f8f9fa;
  --bg-hover: #f3f4f6;
  --bg-elevated: #ffffff;
  
  /* 文字色 */
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;
  
  /* 边框 */
  --border-color: #e5e7eb;
  --border-light: rgba(0, 0, 0, 0.06);
  --border-hover: #d1d5db;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  --shadow-hover: 0 20px 40px rgba(0, 0, 0, 0.1);
  
  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;
  
  /* 其他 */
  --ring-color: rgba(59, 130, 246, 0.2);
}

/* 暗色主题 */
[data-theme="dark"] {
  --bg-primary: #0d1117;
  --bg-secondary: rgba(13, 17, 23, 0.8);
  --bg-card: #161b22;
  --bg-hover: #1f242c;
  --bg-elevated: #21262d;
  
  --text-primary: #f0f6fc;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  
  --border-color: #30363d;
  --border-light: rgba(255, 255, 255, 0.1);
  --border-hover: #3d444d;
}
```

## 组件规范

### 按钮 (Button)

#### 基础按钮 `.btn`
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
```

#### 按钮变体
- `.btn-primary` - 主按钮（蓝色）
- `.btn-success` - 成功按钮（绿色）
- `.btn-danger` - 危险按钮（红色）
- `.btn-secondary` - 次要按钮（灰色背景）
- `.btn-ghost` - 幽灵按钮（透明背景）

#### 按钮尺寸
- `.btn-sm` - 小尺寸
- `.btn-lg` - 大尺寸
- `.btn-block` - 块级（宽度100%）

#### 图标按钮 `.icon-btn`
```css
.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}
```

### 输入框 (Input)

```css
.input-field {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.15s;
  width: 100%;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring-color);
}

.input-field::placeholder {
  color: var(--text-muted);
}
```

### 卡片 (Card)

```css
.form-card {
  padding: 18px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: var(--shadow-sm);
}
```

### 抽屉 (Drawer)

```css
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 440px;
  height: 100dvh;
  background: var(--bg-primary);
  z-index: 201;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.08);
}

.drawer.drawer-open {
  transform: translateX(0);
}

.drawer.drawer-large {
  max-width: 520px;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-light);
}

.drawer-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.drawer-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--bg-hover);
  color: var(--text-muted);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 遮罩层 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 200;
  opacity: 0;
  transition: opacity 0.25s;
  backdrop-filter: blur(4px);
}

.drawer-overlay.overlay-visible {
  opacity: 1;
}
```

### 表单布局

#### 堆叠表单 `.form-stack`
```css
.form-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
```

### 分页 (Pagination)

```css
.pagination-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 0 32px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--border-color);
  color: var(--primary);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-btn.icon-only {
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-numbers {
  display: flex;
  gap: 2px;
}

.page-number {
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.page-number:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.page-number.active {
  background: var(--primary);
  color: white;
  font-weight: 600;
}

.pagination-info {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}
```

## 页面布局规范

### 首页容器

```css
.home-container {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  width: 100%;
}

.content-wrapper {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
  box-sizing: border-box;
}
```

### 顶部导航栏

```css
.home-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-secondary);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--border-light);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
```

## 响应式断点

```css
/* 移动端 */
@media (max-width: 480px) {
  .content-wrapper {
    padding: 0 16px;
  }
  
  .home-header {
    padding: 12px 16px;
  }
  
  .drawer {
    max-width: 100%;
  }
}

/* 平板端 */
@media (max-width: 768px) {
  .pagination-controls {
    gap: 4px;
  }
}
```

## 动画规范

### 过渡时间
- 快速反馈: `0.15s` (按钮、输入框)
- 标准过渡: `0.2s` (下拉菜单、工具提示)
- 复杂动画: `0.3s` (抽屉、弹窗)

### 缓动函数
- 标准: `ease`
- 流畅: `cubic-bezier(0.32, 0.72, 0, 1)` (抽屉展开)

### 常用动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入 */
@keyframes slideIn {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* 抽屉动画 */
.drawer {
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer.drawer-open {
  transform: translateX(0);
}
```

## 文件组织

```
public/css/
├── style.css        # 基础样式重置
├── theme.css        # CSS 变量定义
├── buttons.css      # 按钮组件
├── home.css         # 首页样式（含抽屉、分页等）
├── form-enhance.css # 表单增强
├── auth.css         # 登录/初始化页面（可选）
├── tabs.css         # 标签页
├── table-enhance.css# 表格增强
├── toast.css        # Toast 通知
├── skeleton.css     # 骨架屏
└── dashboard.css    # 仪表盘
```

## 命名规范

- **类名**: 使用 kebab-case (短横线连接)
- **组件前缀**: 使用组件名作为前缀 (如 `.drawer-*`, `.pagination-*`)
- **状态类**: 使用形容词 (如 `.active`, `.disabled`, `.open`)
- **工具类**: 使用简洁命名 (如 `.text-center`, `.hidden`)

## 最佳实践

1. **优先使用 CSS 变量**，便于主题切换
2. **使用 flexbox 布局**，确保响应式
3. **添加适当的过渡动画**，提升交互体验
4. **保持一致的间距**，使用 4px 或 8px 倍数
5. **测试暗色主题**，确保颜色对比度足够
