import { Hono } from 'hono';
import { DatabaseService } from '../services/database';
import { AuthService } from '../services/auth';
import { InitPage, LoginPage, DashboardPage, HomePage, ErrorPage } from '../components';
import type { ContextVariables } from '../types';

type Variables = ContextVariables & {
  authService: AuthService;
}

export const pageRoutes = new Hono<{ Variables: Variables }>();

// 首页 - 已登录用户显示帖子列表，未登录会由前端重定向
pageRoutes.get('/', async (c) => {
  try {
    return c.html(<HomePage />);
  } catch (error) {
    return c.html(<ErrorPage message={`加载页面失败: ${error}`} />);
  }
});

// 初始化页面
pageRoutes.get('/init', async (c) => {
  try {
    const authService = c.get('authService');
    const initStatus = authService.checkInitialization();
    
    if (initStatus.initialized) {
      return c.redirect('/');
    }
    
    return c.html(<InitPage />);
  } catch (error) {
    return c.html(<ErrorPage message={`加载初始化页面失败: ${error}`} />);
  }
});

// 登录页面
pageRoutes.get('/login', async (c) => {
  return c.html(<LoginPage />);
});

// 兼容旧版控制台路由（重定向到首页）
pageRoutes.get('/dashboard', async (c) => {
  return c.redirect('/');
});
