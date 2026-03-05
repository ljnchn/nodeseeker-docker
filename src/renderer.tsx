import { jsxRenderer } from 'hono/jsx-renderer';

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="background-color" content="#0f172a" />
        <meta name="color-scheme" content="dark light" />
        <meta name="description" content="NodeSeek 社区 RSS 监控和 Telegram 推送通知系统" />
        <meta name="keywords" content="NodeSeek, RSS, 监控, Telegram, 推送" />
        <meta name="author" content="NodeSeeker" />
        <meta name="robots" content="index, follow" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* Apple PWA Config */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NodeSeeker" />
        
        {/* Microsoft PWA Config */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="NodeSeeker RSS 监控" />
        <meta property="og:description" content="NodeSeek 社区 RSS 监控和 Telegram 推送通知系统" />
        <meta property="og:image" content="/icons/icon-512x512.png" />
        <meta property="og:locale" content="zh_CN" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NodeSeeker RSS 监控" />
        <meta name="twitter:description" content="NodeSeek 社区 RSS 监控和 Telegram 推送通知系统" />
        <meta name="twitter:image" content="/icons/icon-512x512.png" />
        
        <title>NodeSeek RSS 监控</title>
        <link href="/css/style.css" rel="stylesheet" />
        
        {/* PWA Register Script */}
        <script src="/js/pwa-register.js" defer></script>
        <script src="/js/pwa-debug.js" defer></script>
        
        {/* CSS Animations */}
        <style>{`
          @keyframes slideUp {
            from { transform: translate(-50%, 100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          .offline-indicator {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ef4444;
            color: #fff;
            text-align: center;
            padding: 8px;
            font-size: 14px;
            z-index: 10000;
            display: none;
          }
          html.offline .offline-indicator {
            display: block;
          }
        `}</style>
      </head>
      <body>
        <div class="offline-indicator">
          🔴 您当前处于离线模式，部分功能可能不可用
        </div>
        {children}
      </body>
    </html>
  );
});