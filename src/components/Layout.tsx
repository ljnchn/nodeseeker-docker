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
    <html>
      <head>
        <title>{title}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {description && <meta name="description" content={description} />}

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" type="image/x-icon" href="/favicon.ico" />

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
