import type { FC } from "hono/jsx";
import { Layout } from "./Layout";

export const HomePage: FC = () => {
  return (
    <Layout
      title="NodeSeeker"
      description="NodeSeek RSS 文章列表"
      scriptSrc="/js/home.js"
    >
      <div class="home-container">
        {/* 顶部导航栏 */}
        <header class="home-header">
          <a href="/" class="header-logo">
            <span class="logo-icon">📡</span>
            <span class="logo-text">NodeSeeker</span>
          </a>

          <div class="header-center">
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
              </svg>
              <input
                type="text"
                id="searchInput"
                placeholder="搜索标题、作者..."
                class="search-input"
              />
              <button id="clearSearchBtn" class="search-clear" style="display: none;">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="header-actions">
            <button id="themeToggleBtn" class="icon-btn" title="切换主题">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
            </button>
            <div class="dropdown">
              <button id="settingsBtn" class="icon-btn" title="设置">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
                </svg>
              </button>
              <div class="dropdown-menu">
                <button class="dropdown-item" data-drawer="subscriptions">
                  <span>📝</span> 订阅管理
                </button>
                <button class="dropdown-item" data-drawer="rss">
                  <span>📡</span> RSS 配置
                </button>
                <button class="dropdown-item" data-drawer="telegram">
                  <span>🤖</span> Telegram
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item text-danger" id="logoutBtn">
                  <span>🚪</span> 退出登录
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 筛选栏 + 统计 */}
        <div class="filter-bar">
          <div class="filter-left">
            <select id="filterStatus" class="filter-select">
              <option value="">全部分类</option>
              <option value="0">未订阅</option>
              <option value="1">已订阅</option>
            </select>
            <select id="filterCategory" class="filter-select">
              <option value="">全部分类</option>
              <option value="daily">日常</option>
              <option value="tech">技术</option>
              <option value="info">情报</option>
              <option value="review">测评</option>
              <option value="trade">交易</option>
              <option value="carpool">拼车</option>
              <option value="promotion">推广</option>
              <option value="life">生活</option>
              <option value="dev">Dev</option>
              <option value="expose">曝光</option>
              <option value="inside">内版</option>
              <option value="sandbox">沙盒</option>
            </select>
            <input type="text" id="filterCreator" placeholder="作者筛选" class="filter-input" />
          </div>
          <div class="filter-right">
            <span class="stat-item">订阅 <strong id="statSubscriptions">0</strong></span>
            <span class="stat-item">文章 <strong id="statTotalPosts">0</strong></span>
            <span class="stat-item" id="telegramStatusItem" style="display: none;">Bot <strong id="statBotStatus">-</strong></span>
            <div class="filter-actions">
              <button id="refreshBtn" class="btn btn-icon" title="刷新">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
              </button>
              <button id="fetchRssBtn" class="btn btn-primary">
                抓取 RSS
              </button>
            </div>
          </div>
        </div>

        {/* 帖子列表 */}
        <main class="posts-container">
          <div id="postsList" class="posts-list">
            {/* 骨架屏 */}
            <div class="skeleton-wrapper">
              {[1, 2, 3, 4, 5].map(() => (
                <div class="skeleton-card post-skeleton">
                  <div class="skeleton skeleton-title"></div>
                  <div class="skeleton skeleton-line"></div>
                  <div class="skeleton skeleton-line" style={{ width: "60%" }}></div>
                  <div class="skeleton-meta">
                    <div class="skeleton skeleton-badge"></div>
                    <div class="skeleton skeleton-badge"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 空状态 */}
          <div id="emptyState" class="empty-state" style="display: none;">
            <div class="empty-icon">📰</div>
            <div class="empty-title">暂无文章</div>
            <div class="empty-desc">点击右上角"抓取 RSS"按钮获取最新文章</div>
          </div>
        </main>

        {/* 分页 */}
        <div id="pagination" class="pagination-wrapper" style="display: none;">
          <div class="pagination-info">
            <span id="paginationInfo">第 1 页，共 0 条记录</span>
          </div>
          <div class="pagination-controls">
            <button id="prevPageBtn" class="pagination-btn" disabled>
              ← 上一页
            </button>
            <div id="pageNumbers" class="page-numbers"></div>
            <button id="nextPageBtn" class="pagination-btn" disabled>
              下一页 →
            </button>
          </div>
        </div>
      </div>

      {/* 抽屉遮罩 */}
      <div id="drawerOverlay" class="drawer-overlay" style="display: none;"></div>

      {/* 订阅管理抽屉 */}
      <div id="subscriptionsDrawer" class="drawer drawer-large" style="display: none;">
        <div class="drawer-header">
          <h3 class="drawer-title">订阅管理</h3>
          <button class="drawer-close" data-drawer="subscriptions">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="drawer-content">
          {/* 添加订阅表单 */}
          <form id="addSubForm" class="form-card">
            <h4 class="form-section-title">添加订阅</h4>
            <div class="form-row">
              <input type="text" id="keyword1" class="input-field" placeholder="关键词1" />
              <input type="text" id="keyword2" class="input-field" placeholder="关键词2" />
              <input type="text" id="keyword3" class="input-field" placeholder="关键词3" />
            </div>
            <div class="form-row">
              <input type="text" id="subCreator" class="input-field" placeholder="作者筛选" />
              <select id="subCategory" class="input-field">
                <option value="">选择分类</option>
                <option value="daily">日常</option>
                <option value="tech">技术</option>
                <option value="info">情报</option>
                <option value="review">测评</option>
                <option value="trade">交易</option>
                <option value="carpool">拼车</option>
                <option value="promotion">推广</option>
                <option value="life">生活</option>
                <option value="dev">Dev</option>
                <option value="expose">曝光</option>
                <option value="inside">内版</option>
                <option value="sandbox">沙盒</option>
              </select>
              <button type="submit" class="btn btn-success">添加</button>
            </div>
          </form>

          {/* 订阅列表 */}
          <div id="subscriptionsList" class="subscriptions-list">
            <div class="skeleton-wrapper">
              {[1, 2, 3].map(() => (
                <div class="skeleton-list-item">
                  <div class="skeleton skeleton-badge"></div>
                  <div class="skeleton skeleton-line"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RSS 配置抽屉 */}
      <div id="rssDrawer" class="drawer" style="display: none;">
        <div class="drawer-header">
          <h3 class="drawer-title">RSS 配置</h3>
          <button class="drawer-close" data-drawer="rss">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="drawer-content">
          <form id="rssConfigForm" class="form-stack">
            <div class="form-group">
              <label class="form-label">RSS 源地址</label>
              <input type="url" id="rssUrl" class="input-field" placeholder="https://rss.nodeseek.com/" />
              <span class="form-hint">支持标准的 RSS/Atom 格式</span>
            </div>
            <div class="form-group">
              <label class="form-label">抓取间隔（秒）</label>
              <input type="number" id="rssInterval" class="input-field" min="10" max="3600" placeholder="60" />
              <span class="form-hint">最小 10 秒，建议 60 秒以上，避免对源站造成压力</span>
            </div>
            <div class="form-group">
              <label class="form-label">代理地址（可选）</label>
              <input type="text" id="rssProxy" class="input-field" placeholder="http://127.0.0.1:7890 或 http://user:pass@host:port" />
              <span class="form-hint">HTTP/HTTPS 代理，留空则不使用代理</span>
            </div>
            <div class="form-actions">
              <button type="button" id="testRssBtn" class="btn btn-secondary">
                测试连接
              </button>
              <button type="submit" class="btn btn-primary">
                保存配置
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Telegram 配置抽屉 */}
      <div id="telegramDrawer" class="drawer drawer-large" style="display: none;">
        <div class="drawer-header">
          <h3 class="drawer-title">Telegram 配置</h3>
          <button class="drawer-close" data-drawer="telegram">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="drawer-content">
          {/* 推送服务配置 */}
          <div class="form-card">
            <h4 class="form-section-title">🚀 推送服务配置</h4>
            <form id="telegramConfigForm" class="form-stack">
              <div class="form-group">
                <label class="form-label">Bot Token</label>
                <input type="text" id="botToken" class="input-field" placeholder="从 @BotFather 获取，格式: 123456:ABC-DEF..." />
                <span class="form-hint">用于发送消息推送，不需要 Webhook</span>
              </div>
              <div class="form-group">
                <label class="form-label">用户 Chat ID</label>
                <input type="text" id="chatId" class="input-field" placeholder="用户或群组的 Chat ID" />
                <span class="form-hint">可通过交互服务的 /start 命令自动获取</span>
              </div>
              <div class="form-group">
                <label class="checkbox-wrapper">
                  <input type="checkbox" id="stopPush" />
                  <span>停止推送 - 暂停所有 Telegram 消息推送</span>
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-wrapper">
                  <input type="checkbox" id="onlyTitle" />
                  <span>仅匹配标题 - 只在文章标题中搜索关键词</span>
                </label>
              </div>
              <div class="form-actions">
                <button type="button" id="testTelegramBtn" class="btn btn-secondary">
                  测试连接
                </button>
                <button type="submit" class="btn btn-primary">
                  保存配置
                </button>
              </div>
            </form>
          </div>

          {/* 交互服务配置 */}
          <div class="form-card" style={{ marginTop: "24px" }}>
            <h4 class="form-section-title">🔗 交互服务配置（可选）</h4>
            <form id="webhookConfigForm" class="form-stack">
              <div class="form-group">
                <label class="form-label">Webhook URL</label>
                <input type="url" id="webhookUrl" class="input-field" placeholder="https://your-domain.com/telegram/webhook" />
                <span class="form-hint">需要 HTTPS，用于接收 Telegram 命令（如 /start）</span>
              </div>
              <div class="form-hint" style={{ background: "var(--bg-primary)", padding: "12px", borderRadius: "8px" }}>
                <strong>说明：</strong>交互服务允许通过 Telegram Bot 命令管理订阅、查看文章等。
                配置 Webhook 后，向 Bot 发送 /start 可自动获取 Chat ID 并绑定用户。
              </div>
              <div class="form-actions">
                <button type="button" id="testWebhookBtn" class="btn btn-secondary">
                  测试连接
                </button>
                <button type="button" id="clearWebhookBtn" class="btn btn-danger">
                  清除 Webhook
                </button>
                <button type="submit" class="btn btn-primary">
                  设置 Webhook
                </button>
              </div>
            </form>
          </div>

          {/* 状态信息 */}
          <div id="telegramStatusPanel" class="form-card" style={{ marginTop: "24px", display: "none" }}>
            <h4 class="form-section-title">📊 服务状态</h4>
            <div class="info-grid">
              <div class="info-item">
                <strong>Bot 状态:</strong> <span id="telegramBotStatus">-</span>
              </div>
              <div class="info-item">
                <strong>Webhook 状态:</strong> <span id="telegramWebhookStatus">-</span>
              </div>
              <div class="info-item">
                <strong>用户绑定:</strong> <span id="telegramBindingStatus">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast 容器 */}
      <div id="toastContainer" class="toast-container"></div>
    </Layout>
  );
};
