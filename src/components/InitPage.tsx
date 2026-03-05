import type { FC } from "hono/jsx";
import { Layout } from "./Layout";

export const InitPage: FC = () => {
  return (
    <Layout
      title="NodeSeeker - 初始化"
      description="NodeSeeker初始化设置页面"
      scriptSrc="/js/init.js"
    >
      <div class="home-container">
        {/* 顶部导航栏 */}
        <header class="home-header">
          <a href="/" class="header-logo">
            <span class="logo-icon">📡</span>
            <span class="logo-text">NodeSeeker</span>
          </a>
        </header>

        {/* 初始化卡片 */}
        <div class="content-wrapper" style="padding-top: 40px;">
          <div class="form-card" style={{ maxWidth: "400px", margin: "0 auto" }}>
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 48px; margin-bottom: 12px;">📡</div>
              <h2 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">
                欢迎使用 NodeSeeker
              </h2>
              <p style="font-size: 14px; color: var(--text-muted);">
                首次使用需要创建管理员账号
              </p>
            </div>

            <form id="initForm" class="form-stack">
              <div class="form-group">
                <label for="username" class="form-label" style="color: var(--text-primary); font-weight: 600;">
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
                <label for="password" class="form-label" style="color: var(--text-primary); font-weight: 600;">
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
                <label for="confirmPassword" class="form-label" style="color: var(--text-primary); font-weight: 600;">
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

              <div id="initMessage" class="login-message" style="display: none;"></div>

              <button type="submit" class="btn btn-primary" style="width: 100%;">
                初始化系统
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};
