import type { FC, PropsWithChildren } from "hono/jsx";

interface LayoutProps {
  title?: string;
  description?: string;
  scriptSrc?: string;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({
  title = "NodeSeek RSS 监控",
  description,
  scriptSrc,
  children,
}) => {
  return (
    <html lang="zh-CN">
      <head>
        <title>{title}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {description && <meta name="description" content={description} />}

        {/* PWA Config */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="dark light" />
        <link rel="manifest" href="/manifest.json" />

        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/icons/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicons/favicon-48x48.png" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-touch-icon/apple-touch-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-touch-icon/apple-touch-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-touch-icon/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-touch-icon/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-touch-icon/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon/apple-touch-icon-180x180.png" />

        {/* Microsoft */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-TileImage" content="/icons/apple-touch-icon/apple-touch-icon-144x144.png" />

        {/* Inter 字体 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* 基础样式 */}
        <link href="/css/style.css" rel="stylesheet" />

        {/* 主题系统 */}
        <link href="/css/theme.css" rel="stylesheet" />

        {/* 组件样式 */}
        <link href="/css/buttons.css" rel="stylesheet" />
        <link href="/css/form-enhance.css" rel="stylesheet" />
        <link href="/css/tabs.css" rel="stylesheet" />
        <link href="/css/table-enhance.css" rel="stylesheet" />
        <link href="/css/toast.css" rel="stylesheet" />
        <link href="/css/skeleton.css" rel="stylesheet" />
        <link href="/css/dashboard.css" rel="stylesheet" />
        <link href="/css/auth.css" rel="stylesheet" />
        <link href="/css/home.css" rel="stylesheet" />

        {/* 主题初始化脚本 - 防止闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              const savedTheme = localStorage.getItem('theme');
              if (savedTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
              } else if (savedTheme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
              } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            })();
          `,
          }}
        />
      </head>
      <body>
        {children}
        {/* PWA Scripts */}
        <script src="/js/pwa-register.js" defer></script>
        <script src="/js/pwa-debug.js" defer></script>
        {scriptSrc && <script src={scriptSrc}></script>}
      </body>
    </html>
  );
};

// 专门的页面布局组件
export const PageLayout: FC<
  PropsWithChildren<LayoutProps & { containerClass?: string }>
> = ({
  title,
  description,
  scriptSrc,
  containerClass = "container",
  children,
}) => {
  return (
    <Layout title={title} description={description} scriptSrc={scriptSrc}>
      <div class={containerClass}>{children}</div>
    </Layout>
  );
};
