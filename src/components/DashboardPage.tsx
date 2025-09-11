import type { FC } from 'hono/jsx';
import { Layout } from './Layout';

export const DashboardPage: FC = () => {
  return (
    <Layout 
      title="NodeSeek RSS 监控 - 控制台"
      description="NodeSeek RSS 监控系统管理控制台"
      scriptSrc="/js/dashboard.js"
    >
      <style>
        {`
        .tab-btn {
          transition: all 0.2s ease;
        }
        .tab-btn.active {
          background: #2196f3 !important;
          color: white !important;
        }
        .tab-btn:not(.active) {
          background: #f5f5f5 !important;
          color: #666 !important;
        }
        .tab-btn:hover:not(.active) {
          background: #e8e8e8 !important;
          color: #333 !important;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block !important;
        }
        .subscription-item, .post-item {
          background: white;
          padding: 14px;
          margin-bottom: 10px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 3px solid #2196f3;
        }
        .config-section {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #2196f3;
        }
        .message {
          line-height: 1.5;
        }
        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .message.warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .message.info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 10px !important;
          }
          .page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 16px !important;
          }
          .status-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .tab-nav {
            overflow-x: auto !important;
          }
          .tab-buttons {
            display: flex !important;
            min-width: max-content !important;
          }
          .tab-btn {
            padding: 12px 16px !important;
            font-size: 13px !important;
            min-width: 100px !important;
            white-space: nowrap !important;
          }
        }
        `}
      </style>
      
      <div style="min-height: 100vh; background: #f5f5f5; padding: 20px;" class="dashboard-container">
        <div style="max-width: 1200px; margin: 0 auto;">
          {/* 页面头部 */}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="page-header">
            <div>
              <h1 style="font-size: 28px; font-weight: bold; color: #333; margin-bottom: 8px;">
                📡 NodeSeek RSS 监控控制台
              </h1>
              <p style="color: #666; font-size: 16px;">
                智能文章监控与推送系统
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;" class="header-actions">
              <span style="color: #666; font-size: 14px;">管理员已登录</span>
              <button id="logoutBtn" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                退出登录
              </button>
            </div>
          </div>

          {/* 消息提示区域 */}
          <div id="message" style="display: none; margin-bottom: 20px; padding: 12px; border-radius: 6px;"></div>

          {/* 状态卡片 */}
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;" class="status-grid">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #4caf50;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 14px; color: #666; margin: 0;">Bot 状态</h3>
                <span style="font-size: 24px;">🤖</span>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: #4caf50;" id="botStatus">检查中...</div>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">Telegram Bot 连接状态</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #2196f3;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 14px; color: #666; margin: 0;">活跃订阅</h3>
                <span style="font-size: 24px;">📝</span>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: #333;" id="activeSubscriptions">0</div>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">正在监控的关键词订阅</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #ff9800;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 14px; color: #666; margin: 0;">24小时推送</h3>
                <span style="font-size: 24px;">📬</span>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: #333;" id="todayMessages">0</div>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">最近24小时发送的消息数量</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #9c27b0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 14px; color: #666; margin: 0;">总文章数</h3>
                <span style="font-size: 24px;">📰</span>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: #333;" id="totalPosts">0</div>
              <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">系统中的文章总数</p>
            </div>
          </div>

          {/* 标签页导航 */}
          <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;" class="tab-nav">
            <div style="display: flex; border-bottom: 1px solid #eee;" class="tab-buttons">
              <button class="tab-btn active" data-tab="config" style="padding: 16px 24px; border: none; background: #2196f3; color: white; cursor: pointer; font-size: 14px;">
                ⚙️ 基础设置
              </button>
              <button class="tab-btn" data-tab="subscriptions" style="padding: 16px 24px; border: none; background: #f5f5f5; color: #666; cursor: pointer; font-size: 14px;">
                📝 订阅管理
              </button>
              <button class="tab-btn" data-tab="posts" style="padding: 16px 24px; border: none; background: #f5f5f5; color: #666; cursor: pointer; font-size: 14px;">
                📰 文章列表
              </button>
              <button class="tab-btn" data-tab="stats" style="padding: 16px 24px; border: none; background: #f5f5f5; color: #666; cursor: pointer; font-size: 14px;">
                📊 统计信息
              </button>
            </div>

            {/* 基础设置内容 */}
            <div id="config" class="tab-content active" style="padding: 30px;">
              <h2 style="font-size: 20px; margin-bottom: 30px; color: #333;">🤖 Telegram Bot 设置</h2>
              
              {/* Bot Token 设置区域 */}
              <div class="config-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333; display: flex; align-items: center; gap: 8px;">
                  🔑 Bot Token 配置
                  <span id="botTokenStatus" style="font-size: 12px; padding: 4px 8px; border-radius: 12px; background: #dc3545; color: white;">未配置</span>
                </h3>
                
                <form id="botTokenForm" style="display: flex; flex-direction: column; gap: 16px;">
                  <div>
                    <label for="botToken" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Bot Token</label>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                      <input 
                        type="text" 
                        id="botToken" 
                        name="botToken" 
                        placeholder="请输入从 @BotFather 获取的 Bot Token"
                        style="flex: 1; min-width: 300px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
                      />
                      <button type="submit" style="padding: 12px 24px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">
                        💾 保存并验证
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label for="webhookUrl" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Webhook URL</label>
                    <input 
                      type="text" 
                      id="webhookUrl" 
                      name="webhookUrl" 
                      placeholder="自动检测或手动输入 Webhook URL"
                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
                    />
                    <p style="font-size: 12px; color: #666; margin-top: 4px;">
                      💡 Telegram 需要 HTTPS URL。留空则自动检测当前域名
                    </p>
                  </div>
                  
                  <p style="font-size: 12px; color: #666; margin: 0;">
                    💡 保存后将自动验证 Token 有效性、设置命令菜单和 Webhook
                  </p>
                </form>

                {/* Bot 信息显示区域 */}
                <div id="botInfoDisplay" style="display: none; margin-top: 20px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                  <h4 style="font-size: 14px; margin-bottom: 12px; color: #333;">Bot 信息</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 14px;">
                    <div><strong>Bot ID:</strong> <span id="botId">-</span></div>
                    <div><strong>用户名:</strong> <span id="botUsername">-</span></div>
                    <div><strong>名称:</strong> <span id="botName">-</span></div>
                    <div><strong>状态:</strong> <span style="color: #4caf50;">✅ 已配置</span></div>
                  </div>
                  
                  <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="testBotBtn" style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                      🧪 测试连接
                    </button>
                    <button id="refreshBotStatusBtn" style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                      🔄 刷新状态
                    </button>
                  </div>
                </div>
              </div>

              {/* 用户绑定管理区域 */}
              <div class="config-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333; display: flex; align-items: center; gap: 8px;">
                  👤 用户绑定管理
                  <span id="bindingStatus" style="font-size: 12px; padding: 4px 8px; border-radius: 12px; background: #dc3545; color: white;">未绑定</span>
                </h3>
                
                <div id="bindingInfo" style="display: none; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 16px;">
                  <h4 style="font-size: 14px; margin-bottom: 12px; color: #333;">当前绑定信息</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 14px;">
                    <div><strong>姓名:</strong> <span id="boundUserName">-</span></div>
                    <div><strong>用户名:</strong> <span id="boundUsername">-</span></div>
                    <div><strong>Chat ID:</strong> <span id="boundChatId">-</span></div>
                    <div><strong>绑定时间:</strong> <span id="bindingTime">-</span></div>
                  </div>
                  
                  <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="sendTestMsgBtn" style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                      📤 发送测试消息
                    </button>
                    <button id="unbindUserBtn" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                      🚫 解除绑定
                    </button>
                  </div>
                </div>
                
                <div id="bindingInstructions" style="padding: 16px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e0e0e0;">
                  <h4 style="font-size: 14px; margin-bottom: 12px; color: #333;">🔗 如何绑定用户</h4>
                  <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                    <li>确保已配置并验证 Bot Token</li>
                    <li>在 Telegram 中搜索您的 Bot（使用上面显示的用户名）</li>
                    <li>向 Bot 发送 <code style="background: #e1e1e1; padding: 2px 4px; border-radius: 3px;">/start</code> 命令</li>
                    <li>Bot 会自动绑定您的账户并显示欢迎信息</li>
                    <li>绑定成功后，这里会显示您的用户信息</li>
                  </ol>
                  <p style="margin: 12px 0 0 0; font-size: 12px; color: #666;">
                    💡 每次只能绑定一个用户，如需更换请先解除当前绑定
                  </p>
                </div>
              </div>

              {/* 推送设置区域 */}
              <div class="config-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">📬 推送设置</h3>
                
                <form id="pushSettingsForm" style="display: flex; flex-direction: column; gap: 20px;">
                  <div style="display: flex; flex-direction: column; gap: 16px;">
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                      <input type="checkbox" id="stopPush" name="stopPush" style="width: 18px; height: 18px; cursor: pointer; margin: 0;" />
                      <div>
                        <div style="font-weight: 500; color: #333;">停止推送</div>
                        <div style="font-size: 12px; color: #666;">勾选后将暂停所有 Telegram 消息推送</div>
                      </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                      <input type="checkbox" id="onlyTitle" name="onlyTitle" style="width: 18px; height: 18px; cursor: pointer; margin: 0;" />
                      <div>
                        <div style="font-weight: 500; color: #333;">只匹配标题</div>
                        <div style="font-size: 12px; color: #666;">勾选后仅在文章标题中搜索关键词，不搜索内容</div>
                      </div>
                    </label>
                  </div>
                  
                  <button type="submit" style="padding: 12px 24px; background: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; align-self: flex-start;">
                    💾 保存推送设置
                  </button>
                </form>
              </div>
            </div>

            {/* 订阅管理内容 */}
            <div id="subscriptions" class="tab-content" style="padding: 30px; display: none;">
              <h2 style="font-size: 20px; color: #333; margin-bottom: 20px;">📝 订阅管理</h2>
              
              <form id="addSubForm" style="margin-bottom: 30px;" class="config-section">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">添加新订阅</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                  <div>
                    <label for="keyword1" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">关键词1</label>
                    <input type="text" id="keyword1" name="keyword1" placeholder="输入关键词" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  <div>
                    <label for="keyword2" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">关键词2</label>
                    <input type="text" id="keyword2" name="keyword2" placeholder="输入关键词" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  <div>
                    <label for="keyword3" style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">关键词3</label>
                    <input type="text" id="keyword3" name="keyword3" placeholder="输入关键词" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                </div>
                <button type="submit" style="margin-top: 16px; padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  ➕ 添加订阅
                </button>
              </form>
              
              <div id="subscriptionsList" style="min-height: 200px;">
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                  加载中...
                </div>
              </div>
            </div>

            {/* 文章列表内容 */}
            <div id="posts" class="tab-content" style="padding: 30px; display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                <h2 style="font-size: 20px; color: #333; margin: 0;">📰 文章列表</h2>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                  <button id="refreshPostsBtn" style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 刷新
                  </button>
                  <button id="updateRssBtn" style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    📡 更新RSS
                  </button>
                </div>
              </div>
              
              {/* 搜索和过滤器 */}
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
                <h3 style="font-size: 16px; margin-bottom: 16px; color: #333;">🔍 搜索和筛选</h3>
                <form id="postsFilterForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; align-items: end;">
                  <div>
                    <label for="searchTitle" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px;">标题搜索</label>
                    <input type="text" id="searchTitle" placeholder="输入标题关键字..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                  </div>
                  <div>
                    <label for="filterStatus" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px;">推送状态</label>
                    <select id="filterStatus" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                      <option value="">全部状态</option>
                      <option value="0">未推送</option>
                      <option value="1">已推送</option>
                      <option value="2">无需推送</option>
                    </select>
                  </div>
                  <div>
                    <label for="filterCreator" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px;">作者筛选</label>
                    <input type="text" id="filterCreator" placeholder="输入作者名..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                  </div>
                  <div>
                    <label for="filterCategory" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px;">分类筛选</label>
                    <input type="text" id="filterCategory" placeholder="输入分类名..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button type="submit" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                      搜索
                    </button>
                    <button type="button" id="clearFiltersBtn" style="padding: 10px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                      清空
                    </button>
                  </div>
                </form>
              </div>
              
              {/* 统计信息 */}
              <div id="postsStats" style="background: #e3f2fd; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px; font-size: 14px; color: #1976d2; display: none;">
                <span id="postsStatsText">正在加载...</span>
              </div>
              
              <div id="postsList" style="min-height: 200px;">
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                  加载中...
                </div>
              </div>
              
              {/* 分页控件 */}
              <div id="pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; flex-wrap: wrap; gap: 16px; display: none;">
                <div style="font-size: 14px; color: #666;">
                  <span id="paginationInfo">第 1 页，共 0 条记录</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <button id="prevPageBtn" style="padding: 8px 12px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 14px;" disabled>
                    上一页
                  </button>
                  <div id="pageNumbers" style="display: flex; gap: 4px;">
                    <!-- 页码按钮将在这里动态生成 -->
                  </div>
                  <button id="nextPageBtn" style="padding: 8px 12px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 14px;" disabled>
                    下一页
                  </button>
                </div>
              </div>
            </div>

            {/* 统计信息内容 */}
            <div id="stats" class="tab-content" style="padding: 30px; display: none;">
              <h2 style="font-size: 20px; color: #333; margin-bottom: 20px;">📊 统计信息</h2>
              
              <div id="statsContent" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #4caf50;">
                  <h3 style="font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500;">总文章数</h3>
                  <div style="font-size: 28px; font-weight: bold; color: #333;" id="statTotalPosts">0</div>
                </div>
                
                <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #2196f3;">
                  <h3 style="font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500;">已推送</h3>
                  <div style="font-size: 28px; font-weight: bold; color: #333;" id="statPushedPosts">0</div>
                </div>
                
                <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #ff9800;">
                  <h3 style="font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500;">未推送</h3>
                  <div style="font-size: 28px; font-weight: bold; color: #333;" id="statUnpushedPosts">0</div>
                </div>
                
                <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #9c27b0;">
                  <h3 style="font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500;">订阅数量</h3>
                  <div style="font-size: 28px; font-weight: bold; color: #333;" id="statSubscriptions">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};