import type { FC } from 'hono/jsx';
import { Layout } from './Layout';

interface ErrorPageProps {
  message: string;
}

export const ErrorPage: FC<ErrorPageProps> = ({ message }) => {
  return (
    <Layout 
      title="错误 -NodeSeeker"
      description="NodeSeeker错误页面"
    >
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 20px;">
        <div style="width: 100%; max-width: 500px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 32px; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 16px;">❌</h1>
          <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #d32f2f;">
            出现错误
          </h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 24px; line-height: 1.5;">
            {message}
          </p>
          <a 
            href="/" 
            style="display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; transition: background-color 0.2s;"
          >
            返回首页
          </a>
        </div>
      </div>
    </Layout>
  );
};