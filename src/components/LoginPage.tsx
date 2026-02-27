import type { FC } from "hono/jsx";
import { Layout } from "./Layout";

export const LoginPage: FC = () => {
  return (
    <Layout
      title="NodeSeek RSS 监控 - 登录"
      description="NodeSeeker用户登录页面"
      scriptSrc="/js/login.js"
    >
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">🔐</div>
            <h1 class="auth-title">用户登录</h1>
            <p class="auth-subtitle">NodeSeeker</p>
          </div>

          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <label for="username" class="form-label form-label-required">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="请输入用户名"
                required
                class="input-field"
              />
            </div>

            <div class="form-group">
              <label for="password" class="form-label form-label-required">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="请输入密码"
                required
                class="input-field"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block">
              登录
            </button>
          </form>

          <div
            id="message"
            class="message"
            style="display: none; margin-top: 16px;"
          ></div>
        </div>
      </div>
    </Layout>
  );
};
