import type { FC } from 'hono/jsx';
import { Layout } from './Layout';

export const InitPage: FC = () => {
  return (
    <Layout 
      title="NodeSeek RSS 监控 - 初始化"
      description="NodeSeek RSS 监控系统初始化设置页面"
      scriptSrc="/js/init.js"
    >
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px;">
        <div style="width: 100%; max-width: 400px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px; color: #1976d2;">
              🚀 NodeSeek RSS 监控系统
            </h1>
            <p style="color: #666; font-size: 16px;">
              首次使用需要初始化系统
            </p>
          </div>
          
          <form id="initForm" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label for="username" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">用户名</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                required 
                placeholder="请输入用户名（3-20个字符）"
                style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
              />
            </div>
            
            <div>
              <label for="password" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">密码</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                placeholder="请输入密码（至少6个字符）"
                style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
              />
            </div>
            
            <div>
              <label for="confirmPassword" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">确认密码</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                required 
                placeholder="请再次输入密码"
                style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
              />
            </div>
            
            <button type="submit" style="width: 100%; padding: 12px; background: #1976d2; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer; margin-top: 8px;">
              初始化系统
            </button>
          </form>
          
          <div id="message" style="margin-top: 16px; padding: 12px; border-radius: 6px; display: none;"></div>
        </div>
      </div>
    </Layout>
  );
};