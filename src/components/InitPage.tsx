import type { FC } from "hono/jsx";
import { Layout } from "./Layout";

export const InitPage: FC = () => {
  return (
    <Layout
      title="NodeSeek RSS 监控 - 初始化"
      description="NodeSeeker初始化设置页面"
      scriptSrc="/js/init.js"
    >
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">🚀</div>
            <h1 class="auth-title">NodeSeeker</h1>
            <p class="auth-subtitle">首次使用需要初始化系统</p>
          </div>

          <form id="initForm" class="auth-form">
            <div class="form-group">
              <label for="username" class="form-label form-label-required">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="请输入用户名（3-20个字符）"
                class="input-field"
              />
            </div>

            <div class="form-group">
              <label for="password" class="form-label form-label-required">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="请输入密码（至少6个字符）"
                class="input-field"
              />
            </div>

            <div class="form-group">
              <label
                for="confirmPassword"
                class="form-label form-label-required"
              >
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                placeholder="请再次输入密码"
                class="input-field"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block">
              初始化系统
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
