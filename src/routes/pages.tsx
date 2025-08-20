import { Hono } from 'hono';
import { DatabaseService } from '../services/database';
import { AuthService } from '../services/auth';
import { InitPage, LoginPage, DashboardPage, ErrorPage } from '../components';
import type { ContextVariables } from '../types';

type Variables = ContextVariables & {
  authService: AuthService;
}

export const pageRoutes = new Hono<{ Variables: Variables }>();

// 首页 - 根据初始化状态重定向
pageRoutes.get('/', async (c) => {
  try {
    const authService = c.get('authService');
    const initStatus = authService.checkInitialization();
    
    if (initStatus.initialized) {
      return c.html(<LoginPage />);
    } else {
      return c.html(<InitPage />);
    }
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

// 主页面
pageRoutes.get('/dashboard', async (c) => {
  return c.html(<DashboardPage />);
});