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
                <button class="dropdown-item" data-drawer="stats">
                  <span>📊</span> 统计信息
                </button>
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

        {/* 主内容区 - 统一宽度 */}
        <div class="content-wrapper">
          {/* 搜索框 居中 */}
          <div class="search-area">
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

          {/* 工具栏 */}
          <div class="toolbar">
            <div class="toolbar-left">
              <div class="toggle-chip" id="subscribedOnlyChip" role="button" tabindex={0}>
                <span class="toggle-chip-label">只看订阅</span>
              </div>
              <button id="filterToggleBtn" class="filter-toggle-btn" title="更多筛选">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
                </svg>
                <span>筛选</span>
              </button>
            </div>
            <div class="toolbar-right">
              <button id="refreshBtn" class="btn btn-icon" title="刷新">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 可折叠筛选面板 */}
          <div id="filterPanel" class="filter-panel" style="display: none;">
            <div class="filter-panel-inner">
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
              <select id="filterSubscription" class="filter-select">
                <option value="">全部订阅</option>
              </select>
              <input type="text" id="filterCreator" placeholder="作者筛选" class="filter-input" />
              <button id="clearFiltersBtn" class="btn btn-text">清除筛选</button>
            </div>
          </div>

          {/* 帖子列表 */}
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
          <form id="addSubForm" class="sub-form">
            {/* 第一行：关键词 */}
            <div class="sub-form-row">
              <div class="sub-keywords-inputs">
                <input type="text" id="keyword1" class="input-field" placeholder="关键词1" />
                <input type="text" id="keyword2" class="input-field" placeholder="关键词2" />
                <input type="text" id="keyword3" class="input-field" placeholder="关键词3" />
              </div>
            </div>
            {/* 第二行：作者和分类 */}
            <div class="sub-form-row">
              <div class="sub-form-group">
                <label class="sub-form-label">作者</label>
                <input type="text" id="subCreator" class="input-field" placeholder="作者名" />
              </div>
              <div class="sub-form-group">
                <label class="sub-form-label">分类</label>
                <select id="subCategory" class="input-field">
                  <option value="">全部</option>
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
              </div>
            </div>
            {/* 第三行：添加按钮 */}
            <div class="sub-form-row sub-form-row-action">
              <button type="submit" class="btn btn-success">添加订阅</button>
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
              <label for="rssUrl" class="form-label">RSS 源地址</label>
              <input type="url" id="rssUrl" class="input-field" placeholder="https://rss.nodeseek.com/" />
              <span class="form-hint">支持标准的 RSS/Atom 格式</span>
            </div>
            <div class="form-group">
              <label for="rssInterval" class="form-label">抓取间隔（秒）</label>
              <input type="number" id="rssInterval" class="input-field" min="10" max="3600" placeholder="60" />
              <span class="form-hint">最小 10 秒，建议 60 秒以上</span>
            </div>
            <div class="form-group">
              <label for="rssProxy" class="form-label">代理地址（可选）</label>
              <input type="text" id="rssProxy" class="input-field" placeholder="http://127.0.0.1:7890" />
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
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-light);">
            <button id="fetchRssBtn" class="btn btn-primary" style="width: 100%;">
              立即抓取 RSS
            </button>
          </div>
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
                <label for="botToken" class="form-label">Bot Token</label>
                <input type="text" id="botToken" class="input-field" placeholder="从 @BotFather 获取" />
                <span class="form-hint">格式: 123456:ABC-DEF...</span>
              </div>
              <div class="form-group">
                <label for="chatId" class="form-label">用户 Chat ID</label>
                <input type="text" id="chatId" class="input-field" placeholder="用户或群组的 Chat ID" />
                <span class="form-hint">可通过 /start 命令自动获取</span>
              </div>
              <div class="form-group">
                <div class="checkbox-wrapper">
                  <input type="checkbox" id="stopPush" />
                  <div class="checkbox-content">
                    <div class="checkbox-label">停止推送</div>
                    <div class="checkbox-description">暂停所有 Telegram 消息推送</div>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <div class="checkbox-wrapper">
                  <input type="checkbox" id="onlyTitle" />
                  <div class="checkbox-content">
                    <div class="checkbox-label">仅匹配标题</div>
                    <div class="checkbox-description">只在文章标题中搜索关键词</div>
                  </div>
                </div>
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
                <label for="webhookUrl" class="form-label">Webhook URL</label>
                <input type="url" id="webhookUrl" class="input-field" placeholder="https://your-domain.com/telegram/webhook" />
                <span class="form-hint">需要 HTTPS，用于接收 Telegram 命令</span>
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

      {/* 统计信息抽屉 */}
      <div id="statsDrawer" class="drawer" style="display: none;">
        <div class="drawer-header">
          <h3 class="drawer-title">统计信息</h3>
          <button class="drawer-close" data-drawer="stats">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="drawer-content">
          <div class="stats-grid-simple">
            <div class="stat-card-simple">
              <span class="stat-value" id="drawerStatSubscriptions">0</span>
              <span class="stat-label">关键词订阅</span>
            </div>
            <div class="stat-card-simple">
              <span class="stat-value" id="drawerStatTodayPushed">0</span>
              <span class="stat-label">今日匹配</span>
            </div>
            <div class="stat-card-simple">
              <span class="stat-value" id="drawerStatTotalPosts">0</span>
              <span class="stat-label">帖子总数</span>
            </div>
            <div class="stat-card-simple">
              <span class="stat-value" id="drawerStatPushed">0</span>
              <span class="stat-label">累计匹配</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast 容器 */}
      <div id="toastContainer" class="toast-container"></div>
    </Layout>
  );
};
