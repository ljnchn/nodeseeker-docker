// 控制台页面 JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const sessionId = localStorage.getItem('sessionId');
  
  // 检查登录状态
  if (!sessionId) {
    window.location.href = '/login';
    return;
  }

  // API 请求封装
  async function apiRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, { ...options, ...defaultOptions });
      const result = await response.json();
      
      if (response.status === 401) {
        localStorage.removeItem('sessionId');
        window.location.href = '/login';
        return null;
      }
      
      return result;
    } catch (error) {
      console.error('API 请求错误:', error);
      showMessage('网络错误，请重试', 'error');
      return null;
    }
  }

  // 显示消息
  function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }

  // 标签页切换
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // 更新按钮状态
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // 更新内容显示
        tabContents.forEach(content => {
          content.classList.remove('active');
          content.style.display = 'none';
        });
        
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
          targetContent.style.display = 'block';
        }
        
        // 加载对应标签页的数据
        loadTabData(targetTab);
      });
    });
  }

  // 加载标签页数据
  async function loadTabData(tab) {
    switch (tab) {
      case 'config':
        await loadConfig();
        break;
      case 'subscriptions':
        await loadSubscriptions();
        break;
      case 'posts':
        await loadPosts();
        break;
      case 'stats':
        await loadStats();
        break;
    }
  }

  // 加载配置
  async function loadConfig() {
    const result = await apiRequest('/api/config');
    if (result && result.success) {
      const config = result.data;
      
      // 更新 Bot Token 状态
      const botTokenStatus = document.getElementById('botTokenStatus');
      if (config.bot_token) {
        botTokenStatus.textContent = '已配置';
        botTokenStatus.style.background = '#4caf50';
        
        // 显示 Bot 信息
        const botInfoDisplay = document.getElementById('botInfoDisplay');
        if (botInfoDisplay) {
          botInfoDisplay.style.display = 'block';
        }
      } else {
        botTokenStatus.textContent = '未配置';
        botTokenStatus.style.background = '#dc3545';
      }
      
      // 更新推送设置
      const stopPushCheckbox = document.getElementById('stopPush');
      const onlyTitleCheckbox = document.getElementById('onlyTitle');
      if (stopPushCheckbox) stopPushCheckbox.checked = config.stop_push === 1;
      if (onlyTitleCheckbox) onlyTitleCheckbox.checked = config.only_title === 1;
    }
  }

  // 加载订阅列表
  async function loadSubscriptions() {
    const result = await apiRequest('/api/subscriptions');
    if (result && result.success) {
      const subscriptions = result.data;
      const subscriptionsList = document.getElementById('subscriptionsList');
      
      if (subscriptions.length === 0) {
        subscriptionsList.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #999;">
            📝 暂无订阅记录<br>
            <small>使用上方表单添加新的关键词订阅</small>
          </div>
        `;
      } else {
        subscriptionsList.innerHTML = subscriptions.map(sub => `
          <div class="subscription-item">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <h4 style="margin: 0; flex: 1; color: #333; font-size: 15px;">
                订阅 #${sub.id}
              </h4>
              <button onclick="deleteSubscription(${sub.id})" style="padding: 4px 8px; font-size: 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                删除
              </button>
            </div>
            ${sub.keyword1 || sub.keyword2 || sub.keyword3 ? `
              <div style="background: #e3f2fd; padding: 4px 8px; border-radius: 3px; font-size: 12px; color: #1976d2; margin-bottom: 6px;">
                🔍 ${[sub.keyword1, sub.keyword2, sub.keyword3].filter(k => k).join(' + ')}
              </div>
            ` : ''}
            ${sub.creator ? `<div style="font-size: 11px; color: #666;">👤 创建者: ${sub.creator}</div>` : ''}
            ${sub.category ? `<div style="font-size: 11px; color: #666;">📂 分类: ${sub.category}</div>` : ''}
          </div>
        `).join('');
      }
    }
  }

  // 加载文章列表
  async function loadPosts() {
    const result = await apiRequest('/api/posts?limit=20');
    if (result && result.success) {
      const posts = result.data.posts;
      const postsList = document.getElementById('postsList');
      
      if (posts.length === 0) {
        postsList.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #999;">
            📰 暂无文章数据<br>
            <small>点击"更新RSS"按钮获取最新文章</small>
          </div>
        `;
      } else {
        postsList.innerHTML = posts.map(post => {
          const statusText = post.push_status === 0 ? '未推送' : post.push_status === 1 ? '已推送' : '无需推送';
          const statusColor = post.push_status === 0 ? '#ff9800' : post.push_status === 1 ? '#4caf50' : '#999';
          
          return `
            <div class="post-item">
              <h4 style="margin-bottom: 8px; color: #333; font-size: 15px;">
                <a href="https://www.nodeseek.com/post-${post.post_id}-1" target="_blank" style="color: #1976d2; text-decoration: none;">
                  ${post.title}
                </a>
              </h4>
              <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                👤 ${post.creator} | 📂 ${post.category} | 📅 ${new Date(post.pub_date).toLocaleString()}
              </div>
              <div style="font-size: 12px; color: ${statusColor}; font-weight: 500;">
                状态: ${statusText}
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // 加载统计信息
  async function loadStats() {
    const result = await apiRequest('/api/stats');
    if (result && result.success) {
      const stats = result.data;
      
      // 更新统计数字
      document.getElementById('statTotalPosts').textContent = stats.total_posts;
      document.getElementById('statPushedPosts').textContent = stats.pushed_posts;
      document.getElementById('statUnpushedPosts').textContent = stats.unpushed_posts;
      document.getElementById('statSubscriptions').textContent = stats.total_subscriptions;
    }
  }

  // 更新状态卡片
  async function updateStatusCards() {
    const result = await apiRequest('/api/stats');
    if (result && result.success) {
      const stats = result.data;
      
      document.getElementById('activeSubscriptions').textContent = stats.total_subscriptions;
      document.getElementById('todayMessages').textContent = stats.today_messages;
      document.getElementById('totalPosts').textContent = stats.total_posts;
    }
  }

  // Bot Token 表单提交
  const botTokenForm = document.getElementById('botTokenForm');
  if (botTokenForm) {
    botTokenForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(botTokenForm);
      const botToken = formData.get('botToken');
      
      if (!botToken) {
        showMessage('请输入 Bot Token', 'error');
        return;
      }
      
      const result = await apiRequest('/api/bot-token', {
        method: 'POST',
        body: JSON.stringify({ bot_token: botToken })
      });
      
      if (result && result.success) {
        showMessage('Bot Token 设置成功', 'success');
        await loadConfig();
      } else {
        showMessage(result?.message || 'Bot Token 设置失败', 'error');
      }
    });
  }

  // 推送设置表单提交
  const pushSettingsForm = document.getElementById('pushSettingsForm');
  if (pushSettingsForm) {
    pushSettingsForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(pushSettingsForm);
      const data = {
        stop_push: formData.get('stopPush') === 'on' ? 1 : 0,
        only_title: formData.get('onlyTitle') === 'on' ? 1 : 0
      };
      
      const result = await apiRequest('/api/config', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (result && result.success) {
        showMessage('推送设置保存成功', 'success');
      } else {
        showMessage(result?.message || '推送设置保存失败', 'error');
      }
    });
  }

  // 添加订阅表单提交
  const addSubForm = document.getElementById('addSubForm');
  if (addSubForm) {
    addSubForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(addSubForm);
      const data = {
        keyword1: formData.get('keyword1') || undefined,
        keyword2: formData.get('keyword2') || undefined,
        keyword3: formData.get('keyword3') || undefined,
        creator: formData.get('creator') || undefined,
        category: formData.get('category') || undefined
      };
      
      // 检查是否至少有一个条件
      if (!data.keyword1 && !data.keyword2 && !data.keyword3 && !data.creator && !data.category) {
        showMessage('请至少填写一个关键词或选择创建者/分类', 'error');
        return;
      }
      
      const result = await apiRequest('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (result && result.success) {
        showMessage('订阅添加成功', 'success');
        addSubForm.reset();
        await loadSubscriptions();
        await updateStatusCards();
      } else {
        showMessage(result?.message || '订阅添加失败', 'error');
      }
    });
  }

  // 删除订阅
  window.deleteSubscription = async function(id) {
    if (!confirm('确定要删除这个订阅吗？')) {
      return;
    }
    
    const result = await apiRequest(`/api/subscriptions/${id}`, {
      method: 'DELETE'
    });
    
    if (result && result.success) {
      showMessage('订阅删除成功', 'success');
      await loadSubscriptions();
      await updateStatusCards();
    } else {
      showMessage(result?.message || '订阅删除失败', 'error');
    }
  };

  // 刷新文章按钮
  const refreshPostsBtn = document.getElementById('refreshPostsBtn');
  if (refreshPostsBtn) {
    refreshPostsBtn.addEventListener('click', async function() {
      await loadPosts();
      showMessage('文章列表已刷新', 'success');
    });
  }

  // 更新RSS按钮
  const updateRssBtn = document.getElementById('updateRssBtn');
  if (updateRssBtn) {
    updateRssBtn.addEventListener('click', async function() {
      showMessage('正在更新RSS...', 'info');
      
      const result = await apiRequest('/api/rss/fetch', {
        method: 'POST'
      });
      
      if (result && result.success) {
        showMessage(`RSS更新成功，新增 ${result.data.new} 篇文章`, 'success');
        await loadPosts();
        await updateStatusCards();
      } else {
        showMessage(result?.message || 'RSS更新失败', 'error');
      }
    });
  }

  // 退出登录按钮
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });
  }

  // 初始化
  initTabs();
  updateStatusCards();
  loadConfig();
});