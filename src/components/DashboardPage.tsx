import type { FC } from "hono/jsx";
import { Layout } from "./Layout";

export const DashboardPage: FC = () => {
  return (
    <Layout
      title="NodeSeek RSS 监控 - 控制台"
      description="NodeSeeker管理控制台"
      scriptSrc="/js/dashboard.js"
    >
      <div class="dashboard-container">
        <div class="dashboard-wrapper">
          {/* 页面头部 */}
          <header class="dashboard-header">
            <div class="header-brand">
              <h1>📡 NodeSeeker控制台</h1>
              <p>智能文章监控与推送系统</p>
            </div>
            <div class="header-actions">
              <button id="themeToggle" class="theme-toggle" title="切换主题">
                🌓
              </button>
              <span class="user-status">管理员已登录</span>
              <button id="logoutBtn" class="btn btn-danger btn-sm">
                退出登录
              </button>
            </div>
          </header>

          {/* 消息提示区域 */}
          <div id="message" class="message" style="display: none;"></div>

          {/* 状态卡片 */}
          <div class="stats-grid">
            <div class="stat-card stat-card-green">
              <div class="stat-header">
                <span class="stat-title">Bot 状态</span>
                <span class="stat-icon">🤖</span>
              </div>
              <div class="stat-value" id="botStatus">
                检查中...
              </div>
              <p class="stat-desc">Telegram Bot 连接状态</p>
            </div>

            <div class="stat-card stat-card-blue">
              <div class="stat-header">
                <span class="stat-title">活跃订阅</span>
                <span class="stat-icon">📝</span>
              </div>
              <div class="stat-value" id="activeSubscriptions">
                0
              </div>
              <p class="stat-desc">正在监控的关键词订阅</p>
            </div>

            <div class="stat-card stat-card-orange">
              <div class="stat-header">
                <span class="stat-title">24小时推送</span>
                <span class="stat-icon">📬</span>
              </div>
              <div class="stat-value" id="todayMessages">
                0
              </div>
              <p class="stat-desc">最近24小时发送的消息数量</p>
            </div>

            <div class="stat-card stat-card-purple">
              <div class="stat-header">
                <span class="stat-title">总文章数</span>
                <span class="stat-icon">📰</span>
              </div>
              <div class="stat-value" id="totalPosts">
                0
              </div>
              <p class="stat-desc">系统中的文章总数</p>
            </div>
          </div>

          {/* 标签页导航 */}
          <div class="tabs-container">
            <nav class="tabs-header">
              <button class="tab-item active" data-tab="config">
                <span class="tab-icon">⚙️</span>
                <span class="tab-text">基础设置</span>
              </button>
              <button class="tab-item" data-tab="subscriptions">
                <span class="tab-icon">📝</span>
                <span class="tab-text">订阅管理</span>
              </button>
              <button class="tab-item" data-tab="posts">
                <span class="tab-icon">📰</span>
                <span class="tab-text">文章列表</span>
              </button>
              <button class="tab-item" data-tab="stats">
                <span class="tab-icon">📊</span>
                <span class="tab-text">统计信息</span>
              </button>
            </nav>

            <div class="tabs-content">
              {/* 基础设置内容 */}
              <div id="config" class="tab-panel active">
                <h2 class="section-title">📡 RSS 源配置</h2>

                {/* RSS 源配置 */}
                <section class="config-section">
                  <h3 class="config-section-title">
                    📡 RSS 抓取设置
                    <span class="status-badge active" id="rssServiceStatus">
                      运行中
                    </span>
                  </h3>

                  <form id="rssConfigForm" class="form-stack">
                    <div class="form-group">
                      <label for="rssUrl" class="form-label">
                        RSS 源地址
                      </label>
                      <div class="input-group">
                        <input
                          type="url"
                          id="rssUrl"
                          name="rssUrl"
                          placeholder="https://rss.nodeseek.com/"
                          class="input-field"
                        />
                        <button
                          type="button"
                          id="testRssConnectionBtn"
                          class="btn btn-secondary"
                        >
                          🔗 测试连接
                        </button>
                      </div>
                      <p class="help-text">
                        💡 支持标准的 RSS/Atom 格式，默认使用 NodeSeek 官方 RSS
                      </p>
                    </div>

                    <div class="form-group">
                      <label for="rssInterval" class="form-label">
                        抓取间隔（秒）
                      </label>
                      <input
                        type="number"
                        id="rssInterval"
                        name="rssInterval"
                        min="10"
                        max="3600"
                        placeholder="60"
                        class="input-field"
                        style={{ width: "200px" }}
                      />
                      <p class="help-text">
                        💡 最小 10 秒，建议 60 秒以上，避免对源站造成压力
                      </p>
                    </div>

                    <div class="form-group">
                      <label for="rssProxy" class="form-label">
                        代理地址（可选）
                      </label>
                      <input
                        type="text"
                        id="rssProxy"
                        name="rssProxy"
                        placeholder="http://127.0.0.1:7890 或 http://user:pass@host:port"
                        class="input-field"
                      />
                      <p class="help-text">
                        💡 如需代理访问 RSS 源，请填写 HTTP/HTTPS 代理地址，留空则不使用代理
                      </p>
                    </div>

                    <div class="action-bar">
                      <button type="submit" class="btn btn-primary">
                        💾 保存配置
                      </button>
                      <button
                        type="button"
                        id="restartRssTaskBtn"
                        class="btn btn-warning"
                      >
                        🔄 重启任务
                      </button>
                    </div>
                  </form>

                  {/* RSS 状态信息 */}
                  <div id="rssStatusInfo" class="info-panel" style="display: none;">
                    <h4
                      style={{
                        fontSize: "14px",
                        marginBottom: "12px",
                        color: "var(--text-primary)",
                      }}
                    >
                      RSS 服务状态
                    </h4>
                    <div class="info-grid">
                      <div class="info-item">
                        <strong>当前 URL:</strong>{" "}
                        <span id="currentRssUrl">-</span>
                      </div>
                      <div class="info-item">
                        <strong>抓取间隔:</strong>{" "}
                        <span id="currentRssInterval">-</span> 秒
                      </div>
                      <div class="info-item">
                        <strong>代理状态:</strong>{" "}
                        <span id="currentRssProxy">-</span>
                      </div>
                      <div class="info-item">
                        <strong>任务状态:</strong>{" "}
                        <span id="rssTaskRunning">运行中</span>
                      </div>
                    </div>
                  </div>
                </section>

                <h2 class="section-title">🤖 Telegram Bot 设置</h2>

                {/* 推送服务配置 */}
                <section class="config-section">
                  <h3 class="config-section-title">
                    🚀 推送服务配置
                    <span class="status-badge inactive" id="pushServiceStatus">
                      未配置
                    </span>
                  </h3>

                  <form id="pushServiceForm" class="form-stack">
                    <div class="form-group">
                      <label for="botToken" class="form-label">
                        Bot Token
                      </label>
                      <div class="input-group">
                        <input
                          type="text"
                          id="botToken"
                          name="botToken"
                          placeholder="请输入从 @BotFather 获取的 Bot Token"
                          class="input-field"
                        />
                        <button type="submit" class="btn btn-primary">
                          💾 保存并验证
                        </button>
                      </div>
                    </div>

                    {/* 推送服务信息显示区域 */}
                    <div
                      id="pushServiceInfo"
                      class="info-panel"
                      style="display: none;"
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          marginBottom: "12px",
                          color: "var(--text-primary)",
                        }}
                      >
                        推送服务状态
                      </h4>
                      <div class="info-grid">
                        <div class="info-item">
                          <strong>Bot ID:</strong> <span id="pushBotId">-</span>
                        </div>
                        <div class="info-item">
                          <strong>用户名:</strong>{" "}
                          <span id="pushBotUsername">-</span>
                        </div>
                        <div class="info-item">
                          <strong>名称:</strong> <span id="pushBotName">-</span>
                        </div>
                        <div class="info-item">
                          <strong>Chat ID:</strong>{" "}
                          <span id="pushChatId">-</span>
                        </div>
                      </div>

                      <div class="action-bar">
                        <button
                          id="refreshPushStatusBtn"
                          class="btn btn-warning btn-sm"
                        >
                          🔄 刷新状态
                        </button>
                        <button id="testPushBtn" class="btn btn-success btn-sm">
                          📤 测试推送
                        </button>
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="userChatId" class="form-label">
                        设置用户 Chat ID
                      </label>
                      <div class="input-group">
                        <input
                          type="text"
                          id="userChatId"
                          name="userChatId"
                          placeholder="手动输入 Chat ID 或通过交互服务自动获取"
                          class="input-field"
                        />
                        <button
                          type="button"
                          id="setChatIdBtn"
                          class="btn btn-primary"
                        >
                          ⚙️ 设置并测试
                        </button>
                      </div>
                      <p class="help-text">
                        💡
                        设置后将自动发送测试消息验证推送功能。可以手动设置或通过下方交互服务的
                        /start 命令自动获取
                      </p>
                    </div>

                    <p class="help-text">
                      💡 推送服务用于发送文章通知，不需要设置 Webhook
                    </p>
                  </form>
                </section>

                {/* 交互服务配置 */}
                <section class="config-section">
                  <h3 class="config-section-title">
                    🔗 交互服务配置
                    <span
                      class="status-badge inactive"
                      id="webhookServiceStatus"
                    >
                      未启用
                    </span>
                  </h3>

                  <form id="webhookServiceForm" class="form-stack">
                    <div class="form-group">
                      <label for="webhookUrl" class="form-label">
                        Webhook URL
                      </label>
                      <div class="input-group">
                        <input
                          type="text"
                          id="webhookUrl"
                          name="webhookUrl"
                          placeholder="自动检测或手动输入 Webhook URL"
                          class="input-field"
                        />
                        <button type="submit" class="btn btn-primary">
                          🔗 设置 Webhook
                        </button>
                      </div>
                      <p class="help-text">
                        💡 Telegram 需要 HTTPS URL。留空则自动检测当前域名
                      </p>
                    </div>

                    <div class="info-panel">
                      <p class="help-text" style={{ margin: 0 }}>
                        ⚠️ <strong>前提条件：</strong>{" "}
                        必须先配置上方的推送服务（Bot Token）
                        <br />
                        💡 <strong>功能说明：</strong> 交互服务允许用户通过
                        Telegram 命令管理订阅、查看文章等
                      </p>
                    </div>
                  </form>

                  {/* 交互服务信息显示区域 */}
                  <div
                    id="webhookServiceInfo"
                    class="info-panel"
                    style="display: none;"
                  >
                    <h4
                      style={{
                        fontSize: "14px",
                        marginBottom: "12px",
                        color: "var(--text-primary)",
                      }}
                    >
                      交互服务状态
                    </h4>
                    <div class="info-grid">
                      <div class="info-item">
                        <strong>Webhook 状态:</strong>{" "}
                        <span id="webhookStatus">-</span>
                      </div>
                      <div class="info-item">
                        <strong>用户绑定:</strong>{" "}
                        <span id="userBindingStatus">-</span>
                      </div>
                      <div class="info-item">
                        <strong>绑定用户:</strong>{" "}
                        <span id="boundUserInfo">-</span>
                      </div>
                      <div class="info-item">
                        <strong>绑定时间:</strong>{" "}
                        <span id="bindingTime2">-</span>
                      </div>
                    </div>

                    <div class="action-bar">
                      <button
                        id="testWebhookBtn"
                        class="btn btn-primary btn-sm"
                      >
                        🧪 测试连接
                      </button>
                      <button
                        id="clearWebhookBtn"
                        class="btn btn-danger btn-sm"
                      >
                        🗑️ 清除 Webhook
                      </button>
                      <button
                        id="unbindUserBtn2"
                        class="btn btn-warning btn-sm"
                      >
                        🚫 解除绑定
                      </button>
                    </div>
                  </div>

                  {/* 用户绑定说明 */}
                  <div id="bindingInstructions2" class="info-panel">
                    <h4
                      style={{
                        fontSize: "14px",
                        marginBottom: "12px",
                        color: "var(--text-primary)",
                      }}
                    >
                      🔗 如何绑定用户
                    </h4>
                    <ol
                      style={{
                        margin: 0,
                        paddingLeft: "20px",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <li>确保已配置推送服务（Bot Token）</li>
                      <li>设置上方的 Webhook URL</li>
                      <li>在 Telegram 中搜索您的 Bot</li>
                      <li>
                        向 Bot 发送 <code>/start</code> 命令
                      </li>
                      <li>
                        Bot 会自动绑定您的账户，同时 Chat ID
                        也会自动设置到推送服务
                      </li>
                    </ol>
                  </div>
                </section>

                {/* 统一操作 */}
                <section class="config-section">
                  <h3 class="config-section-title">🛠️ 统一操作</h3>
                  <div class="action-bar">
                    <button id="clearAllSettingsBtn" class="btn btn-danger">
                      🗑️ 清空所有设置
                    </button>
                    <button id="refreshAllStatusBtn" class="btn btn-warning">
                      🔄 刷新所有状态
                    </button>
                  </div>
                  <p class="help-text">
                    💡 清空所有设置将同时清除推送服务和交互服务的所有配置
                  </p>
                </section>

                {/* 推送设置 */}
                <section class="config-section">
                  <h3 class="config-section-title">📬 推送设置</h3>

                  <form id="pushSettingsForm" class="form-stack">
                    <div class="checkbox-wrapper">
                      <input type="checkbox" id="stopPush" name="stopPush" />
                      <div>
                        <div class="checkbox-label">停止推送</div>
                        <div class="checkbox-description">
                          勾选后将暂停所有 Telegram 消息推送
                        </div>
                      </div>
                    </div>

                    <div class="checkbox-wrapper">
                      <input type="checkbox" id="onlyTitle" name="onlyTitle" />
                      <div>
                        <div class="checkbox-label">只匹配标题</div>
                        <div class="checkbox-description">
                          勾选后仅在文章标题中搜索关键词，不搜索内容
                        </div>
                      </div>
                    </div>

                    <button type="submit" class="btn btn-purple">
                      💾 保存推送设置
                    </button>
                  </form>
                </section>
              </div>

              {/* 订阅管理内容 */}
              <div id="subscriptions" class="tab-panel">
                <h2 class="section-title">📝 订阅管理</h2>

                <form id="addSubForm" class="form-card">
                  <h3
                    style={{
                      fontSize: "15px",
                      marginBottom: "16px",
                      color: "var(--text-primary)",
                    }}
                  >
                    添加新订阅
                  </h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="keyword1" class="form-label">
                        关键词1
                      </label>
                      <input
                        type="text"
                        id="keyword1"
                        name="keyword1"
                        placeholder="输入关键词"
                        class="input-field"
                      />
                    </div>
                    <div class="form-group">
                      <label for="keyword2" class="form-label">
                        关键词2
                      </label>
                      <input
                        type="text"
                        id="keyword2"
                        name="keyword2"
                        placeholder="输入关键词"
                        class="input-field"
                      />
                    </div>
                    <div class="form-group">
                      <label for="keyword3" class="form-label">
                        关键词3
                      </label>
                      <input
                        type="text"
                        id="keyword3"
                        name="keyword3"
                        placeholder="输入关键词"
                        class="input-field"
                      />
                    </div>
                    <div class="form-group">
                      <label for="creator" class="form-label">
                        作者
                      </label>
                      <input
                        type="text"
                        id="creator"
                        name="creator"
                        placeholder="输入作者名"
                        class="input-field"
                      />
                    </div>
                    <div class="form-group">
                      <label for="category" class="form-label">
                        分类
                      </label>
                      <select id="category" name="category" class="input-field">
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
                    </div>
                  </div>
                  <button
                    type="submit"
                    class="btn btn-success btn-sm"
                    style={{ marginTop: "16px" }}
                  >
                    ➕ 添加订阅
                  </button>
                </form>

                {/* 订阅列表 */}
                <div id="subscriptionsList">
                  <div class="skeleton-wrapper">
                    <div class="skeleton-list">
                      {[1, 2, 3].map(() => (
                        <div class="skeleton-list-item">
                          <div class="skeleton skeleton-list-icon"></div>
                          <div class="skeleton-list-content">
                            <div
                              class="skeleton skeleton-title"
                              style={{ width: "40%", marginBottom: "8px" }}
                            ></div>
                            <div
                              class="skeleton skeleton-line"
                              style={{ width: "60%" }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 文章列表内容 */}
              <div id="posts" class="tab-panel">
                <div class="panel-header">
                  <h2 class="section-title">📰 文章列表</h2>
                  <div class="btn-group">
                    <button id="refreshPostsBtn" class="btn btn-primary btn-sm">
                      🔄 刷新
                    </button>
                    <button id="updateRssBtn" class="btn btn-warning btn-sm">
                      📡 更新RSS
                    </button>
                  </div>
                </div>

                {/* 搜索和过滤器 */}
                <div class="filter-section">
                  <h3>🔍 搜索和筛选</h3>
                  <form id="postsFilterForm" class="form-grid">
                    <div class="form-group">
                      <label for="searchTitle" class="form-label">
                        标题搜索
                      </label>
                      <input
                        type="text"
                        id="searchTitle"
                        name="searchTitle"
                        placeholder="输入标题关键字..."
                        class="input-field"
                      />
                    </div>
                    <div class="form-group">
                      <label for="filterCreator" class="form-label">
                        作者筛选
                      </label>
                      <input
                        type="text"
                        id="filterCreator"
                        name="filterCreator"
                        placeholder="输入作者名..."
                        class="input-field"
                      />
                    </div>
                    <div class="form-group">
                      <label for="filterStatus" class="form-label">
                        推送状态
                      </label>
                      <select
                        id="filterStatus"
                        name="filterStatus"
                        class="input-field"
                      >
                        <option value="">全部状态</option>
                        <option value="0">未推送</option>
                        <option value="1">已推送</option>
                        <option value="2">无需推送</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="filterCategory" class="form-label">
                        分类筛选
                      </label>
                      <select
                        id="filterCategory"
                        name="filterCategory"
                        class="input-field"
                      >
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
                    </div>
                    <div class="form-group form-group-actions">
                      <button type="submit" class="btn btn-success btn-sm">
                        搜索
                      </button>
                      <button
                        type="button"
                        id="clearFiltersBtn"
                        class="btn btn-secondary btn-sm"
                      >
                        清空
                      </button>
                    </div>
                  </form>
                </div>

                {/* 统计信息 */}
                <div
                  id="postsStats"
                  style={{
                    display: "none",
                    background: "rgba(33, 150, 243, 0.1)",
                    padding: "12px 16px",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: "var(--primary)",
                  }}
                >
                  <span id="postsStatsText">正在加载...</span>
                </div>

                {/* 文章列表 */}
                <div id="postsList">
                  <div class="skeleton-wrapper">
                    <div class="skeleton-list">
                      {[1, 2, 3, 4, 5].map(() => (
                        <div class="skeleton-card">
                          <div class="skeleton skeleton-title"></div>
                          <div class="skeleton skeleton-line"></div>
                          <div
                            class="skeleton skeleton-line"
                            style={{ width: "60%" }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 分页控件 */}
                <div id="pagination" class="pagination" style="display: none;">
                  <div class="pagination-info">
                    <span id="paginationInfo">第 1 页，共 0 条记录</span>
                  </div>
                  <div class="pagination-controls">
                    <button
                      id="prevPageBtn"
                      class="pagination-btn prev"
                      disabled
                    >
                      上一页
                    </button>
                    <div
                      id="pageNumbers"
                      style={{ display: "flex", gap: "4px" }}
                    ></div>
                    <button
                      id="nextPageBtn"
                      class="pagination-btn next"
                      disabled
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>

              {/* 统计信息内容 */}
              <div id="stats" class="tab-panel">
                <h2 class="section-title">📊 统计信息</h2>

                <div class="stats-grid" id="statsContent">
                  <div class="stat-card stat-card-green">
                    <div class="stat-header">
                      <span class="stat-title">总文章数</span>
                    </div>
                    <div class="stat-value" id="statTotalPosts">
                      0
                    </div>
                  </div>

                  <div class="stat-card stat-card-blue">
                    <div class="stat-header">
                      <span class="stat-title">已推送</span>
                    </div>
                    <div class="stat-value" id="statPushedPosts">
                      0
                    </div>
                  </div>

                  <div class="stat-card stat-card-orange">
                    <div class="stat-header">
                      <span class="stat-title">未推送</span>
                    </div>
                    <div class="stat-value" id="statUnpushedPosts">
                      0
                    </div>
                  </div>

                  <div class="stat-card stat-card-purple">
                    <div class="stat-header">
                      <span class="stat-title">订阅数量</span>
                    </div>
                    <div class="stat-value" id="statSubscriptions">
                      0
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 悬浮主题切换按钮（移动端） */}
      <button class="fab-theme" id="mobileThemeToggle" title="切换主题">
        🌓
      </button>
    </Layout>
  );
};
