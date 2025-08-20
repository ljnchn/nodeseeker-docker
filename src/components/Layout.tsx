import type { FC, PropsWithChildren } from 'hono/jsx';

interface LayoutProps {
  title?: string;
  description?: string;
  scriptSrc?: string;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ 
  title = 'NodeSeek RSS 监控', 
  description,
  scriptSrc,
  children 
}) => {
  return (
    <html>
      <head>
        <title>{title}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {description && <meta name="description" content={description} />}
        <link href="/css/style.css" rel="stylesheet" />
      </head>
      <body>
        {children}
        {scriptSrc && <script src={scriptSrc}></script>}
      </body>
    </html>
  );
};

// 专门的页面布局组件
export const PageLayout: FC<PropsWithChildren<LayoutProps & { containerClass?: string }>> = ({
  title,
  description,
  scriptSrc,
  containerClass = 'container',
  children
}) => {
  return (
    <Layout title={title} description={description} scriptSrc={scriptSrc}>
      <div class={containerClass}>
        {children}
      </div>
    </Layout>
  );
};