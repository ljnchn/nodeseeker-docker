// ============================================
// Dashboard 页面 JavaScript - 优化版
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const sessionId = localStorage.getItem("sessionId");

  // 检查登录状态
  if (!sessionId) {
    window.location.href = "/login";
    return;
  }

  // ============================================
  // Toast 通知系统
  // ============================================
  const Toast = {
    container: null,

    init() {
      if (!this.container) {
        this.container = document.createElement("div");
        this.container.className = "toast-container";
        document.body.appendChild(this.container);
      }
    },

    show(message, type = "info", duration = 3000) {
      this.init();

      const toast = document.createElement("div");
      toast.className = `toast ${type}`;

      const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️",
      };

      toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <div class="toast-content">
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">×</button>
        <div class="toast-progress"></div>
      `;

      this.container.appendChild(toast);

      // 关闭按钮事件
      toast.querySelector(".toast-close").addEventListener("click", () => {
        this.hide(toast);
      });

      // 自动隐藏
      if (duration > 0) {
        setTimeout(() => this.hide(toast), duration);
      }

      return toast;
    },

    hide(toast) {
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 300);
    },

    success(message, duration) {
      return this.show(message, "success", duration);
    },

    error(message, duration) {
      return this.show(message, "error", duration);
    },

    warning(message, duration) {
      return this.show(message, "warning", duration);
    },

    info(message, duration) {
      return this.show(message, "info", duration);
    },
  };

  // ============================================
  // 主题切换
  // ============================================
  const Theme = {
    current: "light",

    init() {
      // 读取保存的主题
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        this.set(savedTheme);
      } else if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        this.set("dark");
      }

      // 绑定切换按钮
      document
        .getElementById("themeToggle")
        ?.addEventListener("click", () => this.toggle());
      document
        .getElementById("mobileThemeToggle")
        ?.addEventListener("click", () => this.toggle());
    },

    toggle() {
      const newTheme = this.current === "light" ? "dark" : "light";
      this.set(newTheme);
      Toast.info(`已切换到${newTheme === "dark" ? "暗色" : "浅色"}模式`);
    },

    set(theme) {
      this.current = theme;
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    },
  };

  // ============================================
  // API 请求封装
  // ============================================
  async function apiRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        Authorization: `Bearer ${sessionId}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...options, ...defaultOptions });
      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("sessionId");
        window.location.href = "/login";
        return null;
      }

      return result;
    } catch (error) {
      console.error("API 请求错误:", error);
      Toast.error("网络错误，请重试");
      return null;
    }
  }

  // ============================================
  // 兼容性：旧版消息显示（保留以兼容旧代码）
  // ============================================
  function showMessage(message, type = "info") {
    const messageDiv = document.getElementById("message");
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `message ${type}`;
      messageDiv.style.display = "block";

      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 3000);
    }
    // 同时显示 Toast
    Toast.show(message, type);
  }

  function showDetailedMessage(title, details, type = "info") {
    const messageDiv = document.getElementById("message");

    let content = `<strong>${title}</strong>`;
    if (details && Array.isArray(details) && details.length > 0) {
      content += "<br><br>详细信息：";
      details.forEach((detail) => {
        content += `<br>• ${detail}`;
      });
    } else if (details) {
      content += `<br><br>${details}`;
    }

    if (messageDiv) {
      messageDiv.innerHTML = content;
      messageDiv.className = `message ${type}`;
      messageDiv.style.display = "block";

      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 10000);
    }

    // 同时显示 Toast（简化版）
    Toast.show(title, type, 5000);
  }

  // ============================================
  // 标签页切换（适配新的 CSS 类名）
  // ============================================
  function initTabs() {
    const tabItems = document.querySelectorAll(".tab-item");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabItems.forEach((item) => {
      item.addEventListener("click", () => {
        const targetTab = item.getAttribute("data-tab");

        // 更新按钮状态
        tabItems.forEach((btn) => btn.classList.remove("active"));
        item.classList.add("active");

        // 更新内容显示
        tabPanels.forEach((panel) => {
          panel.classList.remove("active");
        });

        const targetPanel = document.getElementById(targetTab);
        if (targetPanel) {
          targetPanel.classList.add("active");
        }

        // 加载对应标签页的数据
        loadTabData(targetTab);
      });
    });
  }

  // ============================================
  // 数据加载函数
  // ============================================
  async function loadTabData(tab) {
    switch (tab) {
      case "config":
        await loadConfig();
        break;
      case "subscriptions":
        await loadSubscriptions();
        break;
      case "posts":
        await loadPosts();
        break;
      case "stats":
        await loadStats();
        break;
    }
  }

  // 加载配置
  async function loadConfig() {
    const result = await apiRequest("/api/config");
    if (result?.success) {
      const config = result.data;

      const botToken = document.getElementById("botToken");
      const userChatId = document.getElementById("userChatId");

      if (config.bot_token && botToken) {
        botToken.value = config.bot_token;
      }

      if (config.chat_id && userChatId) {
        userChatId.value = config.chat_id;
      }

      const stopPushCheckbox = document.getElementById("stopPush");
      const onlyTitleCheckbox = document.getElementById("onlyTitle");
      if (stopPushCheckbox) stopPushCheckbox.checked = config.stop_push === 1;
      if (onlyTitleCheckbox)
        onlyTitleCheckbox.checked = config.only_title === 1;

      await loadTelegramStatus();
    }
  }

  // 加载 Telegram 状态
  async function loadTelegramStatus() {
    const [pushResult, webhookResult] = await Promise.allSettled([
      apiRequest("/api/push/status"),
      apiRequest("/api/webhook/status"),
    ]);

    let pushStatus = {
      configured: false,
      connected: false,
      bot_info: null,
      can_send: false,
    };
    if (pushResult.status === "fulfilled" && pushResult.value?.success) {
      pushStatus = pushResult.value.data;
    }

    let webhookStatus = {
      configured: false,
      connected: false,
      bot_info: null,
      bound: false,
      config: {},
    };
    if (webhookResult.status === "fulfilled" && webhookResult.value?.success) {
      webhookStatus = webhookResult.value.data;
    }

    // 更新推送服务状态
    const pushServiceStatus = document.getElementById("pushServiceStatus");
    if (pushServiceStatus) {
      if (pushStatus.configured && pushStatus.connected) {
        pushServiceStatus.textContent = "正常运行";
        pushServiceStatus.className = "status-badge active";
      } else if (pushStatus.configured) {
        pushServiceStatus.textContent = "Token无效";
        pushServiceStatus.className = "status-badge inactive";
      } else {
        pushServiceStatus.textContent = "未配置";
        pushServiceStatus.className = "status-badge inactive";
      }
    }

    // 更新交互服务状态
    const webhookServiceStatus = document.getElementById(
      "webhookServiceStatus",
    );
    if (webhookServiceStatus) {
      if (
        webhookStatus.configured &&
        webhookStatus.connected &&
        webhookStatus.webhook_set
      ) {
        webhookServiceStatus.textContent = "正常运行";
        webhookServiceStatus.className = "status-badge active";
      } else if (
        webhookStatus.configured &&
        webhookStatus.connected &&
        !webhookStatus.webhook_set
      ) {
        webhookServiceStatus.textContent = "未设置Webhook";
        webhookServiceStatus.className = "status-badge inactive";
      } else if (webhookStatus.configured) {
        webhookServiceStatus.textContent = "连接异常";
        webhookServiceStatus.className = "status-badge inactive";
      } else {
        webhookServiceStatus.textContent = "未启用";
        webhookServiceStatus.className = "status-badge inactive";
      }
    }

    // 更新推送服务信息显示
    const pushServiceInfo = document.getElementById("pushServiceInfo");
    if (pushServiceInfo && pushStatus.configured && pushStatus.bot_info) {
      pushServiceInfo.style.display = "block";

      document.getElementById("pushBotId").textContent = pushStatus.bot_info.id;
      document.getElementById("pushBotUsername").textContent =
        "@" + pushStatus.bot_info.username;
      document.getElementById("pushBotName").textContent =
        pushStatus.bot_info.first_name;
      document.getElementById("pushChatId").textContent = pushStatus.config
        ?.has_chat_id
        ? "已设置"
        : "未设置";
    } else if (pushServiceInfo) {
      pushServiceInfo.style.display = "none";
    }

    // 更新交互服务信息显示
    const webhookServiceInfo = document.getElementById("webhookServiceInfo");
    if (webhookServiceInfo && webhookStatus.configured) {
      webhookServiceInfo.style.display = "block";

      document.getElementById("webhookStatus").textContent =
        webhookStatus.webhook_set ? "已设置" : "未设置";
      document.getElementById("userBindingStatus").textContent =
        webhookStatus.bound ? "已绑定" : "未绑定";

      if (webhookStatus.bound && webhookStatus.config?.bound_user_name) {
        document.getElementById("boundUserInfo").textContent =
          `${webhookStatus.config.bound_user_name}${webhookStatus.config.bound_user_username ? " (@" + webhookStatus.config.bound_user_username + ")" : ""}`;
      } else {
        document.getElementById("boundUserInfo").textContent = "无";
      }

      document.getElementById("bindingTime2").textContent = webhookStatus.config
        ?.last_check_time
        ? new Date(webhookStatus.config.last_check_time).toLocaleString()
        : "未知";
    } else if (webhookServiceInfo) {
      webhookServiceInfo.style.display = "none";
    }

    // 更新 Bot 状态显示
    const botStatus = document.getElementById("botStatus");
    if (botStatus) {
      const bothConfigured = pushStatus.configured && webhookStatus.configured;
      const bothConnected = pushStatus.connected && webhookStatus.connected;

      if (bothConfigured && bothConnected) {
        botStatus.textContent = "正常运行";
        botStatus.style.color = "var(--success)";
      } else if (
        bothConfigured &&
        (pushStatus.connected || webhookStatus.connected)
      ) {
        botStatus.textContent = "部分正常";
        botStatus.style.color = "var(--warning)";
      } else if (pushStatus.configured || webhookStatus.configured) {
        botStatus.textContent = "Token无效";
        botStatus.style.color = "var(--danger)";
      } else {
        botStatus.textContent = "未配置";
        botStatus.style.color = "var(--text-muted)";
      }
    }
  }

  // 加载订阅列表
  async function loadSubscriptions() {
    const result = await apiRequest("/api/subscriptions");
    const subscriptionsList = document.getElementById("subscriptionsList");
    if (!subscriptionsList) return;

    if (result?.success) {
      const subscriptions = result.data;

      if (subscriptions.length === 0) {
        subscriptionsList.innerHTML = `
          <div class="table-empty">
            <div class="table-empty-icon">📝</div>
            <div class="table-empty-title">暂无订阅记录</div>
            <div class="table-empty-desc">使用上方表单添加新的关键词订阅</div>
          </div>
        `;
      } else {
        subscriptionsList.innerHTML = subscriptions
          .map(
            (sub) => `
          <div class="subscription-item">
            <div class="subscription-content">
              <div class="subscription-keywords">
                ${[sub.keyword1, sub.keyword2, sub.keyword3]
                  .filter((k) => k)
                  .map((k) => `<span class="tag tag-blue">${k}</span>`)
                  .join("")}
              </div>
              <div class="subscription-meta">
                ${sub.creator ? `<span>👤 ${sub.creator}</span>` : ""}
                ${sub.category ? `<span>📂 ${sub.category}</span>` : ""}
              </div>
            </div>
            <div class="subscription-actions">
              <button onclick="deleteSubscription(${sub.id})" class="btn btn-danger btn-sm">
                删除
              </button>
            </div>
          </div>
        `,
          )
          .join("");
      }
    }
  }

  // 加载文章列表
  let currentPage = 1;
  let currentFilters = {};

  async function loadPosts(page = 1, filters = {}) {
    currentPage = page;
    currentFilters = filters;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "" && v !== undefined),
      ),
    });

    const result = await apiRequest(`/api/posts?${params}`);
    if (result?.success) {
      const { posts, total, page: currentPageNum, totalPages } = result.data;
      const postsList = document.getElementById("postsList");

      const postsStats = document.getElementById("postsStats");
      const postsStatsText = document.getElementById("postsStatsText");
      if (postsStatsText) {
        postsStatsText.textContent = `找到 ${total} 条记录，当前显示第 ${currentPageNum} 页，共 ${totalPages} 页`;
      }
      if (postsStats) postsStats.style.display = "block";

      if (posts.length === 0) {
        postsList.innerHTML = `
          <div class="table-empty">
            <div class="table-empty-icon">📰</div>
            <div class="table-empty-title">${Object.keys(filters).length > 0 ? "没有找到符合条件的文章" : "暂无文章数据"}</div>
            <div class="table-empty-desc">${Object.keys(filters).length > 0 ? "试试调整搜索条件" : '点击"更新RSS"按钮获取最新文章'}</div>
          </div>
        `;
        document.getElementById("pagination").style.display = "none";
      } else {
        postsList.innerHTML = posts
          .map((post) => {
            const statusClass =
              post.push_status === 0
                ? "unpushed"
                : post.push_status === 1
                  ? "pushed"
                  : "skipped";
            const statusText =
              post.push_status === 0
                ? "未推送"
                : post.push_status === 1
                  ? "已推送"
                  : "无需推送";

            return `
            <div class="post-item ${statusClass}">
              <h4 class="post-title">
                <a href="https://www.nodeseek.com/post-${post.post_id}-1" target="_blank">
                  ${post.title}
                </a>
              </h4>
              <div class="post-meta">
                <span>👤 ${post.creator}</span>
                <span>📂 ${post.category}</span>
                <span>📅 ${new Date(post.pub_date).toLocaleString()}</span>
                <span class="tag ${post.push_status === 1 ? "tag-green" : post.push_status === 0 ? "tag-orange" : "tag-gray"}">
                  ${statusText}
                </span>
              </div>
            </div>
          `;
          })
          .join("");

        updatePagination(currentPageNum, totalPages, total);
      }
    }
  }

  // 更新分页
  function updatePagination(currentPageNum, totalPages, total) {
    const pagination = document.getElementById("pagination");
    const paginationInfo = document.getElementById("paginationInfo");
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const pageNumbers = document.getElementById("pageNumbers");

    if (paginationInfo)
      paginationInfo.textContent = `第 ${currentPageNum} 页，共 ${total} 条记录`;
    if (prevBtn) prevBtn.disabled = currentPageNum <= 1;
    if (nextBtn) nextBtn.disabled = currentPageNum >= totalPages;

    if (pageNumbers) {
      pageNumbers.innerHTML = "";
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.appendChild(createPageButton(i, i === currentPageNum));
        }
      } else {
        pageNumbers.appendChild(createPageButton(1, currentPageNum === 1));

        if (currentPageNum > 3) {
          pageNumbers.appendChild(createEllipsis());
        }

        const start = Math.max(2, currentPageNum - 1);
        const end = Math.min(totalPages - 1, currentPageNum + 1);

        for (let i = start; i <= end; i++) {
          pageNumbers.appendChild(createPageButton(i, i === currentPageNum));
        }

        if (currentPageNum < totalPages - 2) {
          pageNumbers.appendChild(createEllipsis());
        }

        if (totalPages > 1) {
          pageNumbers.appendChild(
            createPageButton(totalPages, currentPageNum === totalPages),
          );
        }
      }
    }

    if (pagination) pagination.style.display = "flex";
  }

  function createPageButton(pageNum, isActive) {
    const button = document.createElement("button");
    button.textContent = pageNum;
    button.className = isActive ? "pagination-btn active" : "pagination-btn";
    if (!isActive) {
      button.addEventListener("click", () =>
        loadPosts(pageNum, currentFilters),
      );
    }
    return button;
  }

  function createEllipsis() {
    const span = document.createElement("span");
    span.textContent = "...";
    span.style.cssText =
      "padding: 8px 4px; color: var(--text-muted); font-size: 14px;";
    return span;
  }

  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 加载统计信息
  async function loadStats() {
    const result = await apiRequest("/api/stats");
    if (result?.success) {
      document.getElementById("statTotalPosts").textContent =
        result.data.total_posts;
      document.getElementById("statPushedPosts").textContent =
        result.data.pushed_posts;
      document.getElementById("statUnpushedPosts").textContent =
        result.data.unpushed_posts;
      document.getElementById("statSubscriptions").textContent =
        result.data.total_subscriptions;
    }
  }

  // 更新状态卡片
  async function updateStatusCards() {
    const result = await apiRequest("/api/stats");
    if (result?.success) {
      const stats = result.data;
      document.getElementById("activeSubscriptions").textContent =
        stats.total_subscriptions;
      document.getElementById("todayMessages").textContent =
        stats.today_messages;
      document.getElementById("totalPosts").textContent = stats.total_posts;
    }
  }

  // ============================================
  // 事件处理器
  // ============================================

  // 推送服务表单
  document
    .getElementById("pushServiceForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      const botToken = document.getElementById("botToken").value.trim();
      if (!botToken) {
        Toast.error("请输入 Bot Token");
        return;
      }

      Toast.info("正在设置推送服务...");

      const result = await apiRequest("/api/push/setup", {
        method: "POST",
        body: JSON.stringify({ bot_token: botToken }),
      });

      if (result?.success) {
        Toast.success("推送服务设置成功");
        await loadConfig();
        await loadTelegramStatus();
      } else {
        Toast.error(result?.message || "推送服务设置失败");
      }
    });

  // Chat ID 设置按钮
  document
    .getElementById("setChatIdBtn")
    ?.addEventListener("click", async function () {
      const userChatId = document.getElementById("userChatId").value.trim();

      if (!userChatId) {
        Toast.error("请输入 Chat ID");
        return;
      }

      Toast.info("正在设置 Chat ID...");

      const result = await apiRequest("/api/push/set-chat-id", {
        method: "POST",
        body: JSON.stringify({ chat_id: userChatId }),
      });

      if (result?.success) {
        Toast.success("Chat ID 设置成功");
        await loadTelegramStatus();

        const testResult = await apiRequest("/api/push/test-send", {
          method: "POST",
          body: JSON.stringify({
            message: "🎉 Chat ID 设置成功！这是一条测试消息。",
          }),
        });

        if (testResult?.success) {
          Toast.success("测试消息已发送");
        } else {
          Toast.warning(
            "测试消息发送失败：" + (testResult?.message || "未知错误"),
          );
        }
      } else {
        Toast.error(result?.message || "Chat ID 设置失败");
      }
    });

  // 交互服务表单
  document
    .getElementById("webhookServiceForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      const webhookUrl = document.getElementById("webhookUrl").value.trim();
      if (!webhookUrl) {
        Toast.error("请输入 Webhook URL");
        return;
      }

      Toast.info("正在设置交互服务...");

      const result = await apiRequest("/api/webhook/setup", {
        method: "POST",
        body: JSON.stringify({ webhook_url: webhookUrl }),
      });

      if (result?.success) {
        Toast.success("交互服务设置成功");
        await loadTelegramStatus();
      } else {
        Toast.error(result?.message || "交互服务设置失败");
      }
    });

  // Telegram 相关按钮
  function setupTelegramButtons() {
    document
      .getElementById("testPushBtn")
      ?.addEventListener("click", async function () {
        Toast.info("正在发送测试推送...");

        const result = await apiRequest("/api/push/test-send", {
          method: "POST",
          body: JSON.stringify({ message: "这是一条测试推送消息" }),
        });

        if (result?.success) {
          Toast.success("测试推送发送成功");
        } else {
          Toast.error(result?.message || "测试推送发送失败");
        }
      });

    document
      .getElementById("refreshPushStatusBtn")
      ?.addEventListener("click", async function () {
        Toast.info("正在刷新推送服务状态...");
        await loadTelegramStatus();
        Toast.success("推送服务状态已刷新");
      });

    document
      .getElementById("testWebhookBtn")
      ?.addEventListener("click", async function () {
        Toast.info("正在测试交互服务连接...");

        const result = await apiRequest("/api/webhook/test-connection", {
          method: "POST",
        });

        if (result?.success) {
          Toast.success("交互服务连接测试成功");
        } else {
          Toast.error(result?.message || "交互服务连接测试失败");
        }
      });

    document
      .getElementById("clearWebhookBtn")
      ?.addEventListener("click", async function () {
        if (!confirm("确定要清除 Webhook 设置吗？这将禁用交互服务功能。"))
          return;

        Toast.info("正在清除 Webhook...");

        const result = await apiRequest("/api/webhook/clear-webhook", {
          method: "POST",
        });

        if (result?.success) {
          Toast.success("Webhook 清除成功");
          await loadTelegramStatus();
        } else {
          Toast.error(result?.message || "Webhook 清除失败");
        }
      });

    document
      .getElementById("unbindUserBtn2")
      ?.addEventListener("click", async function () {
        if (!confirm("确定要解除用户绑定吗？")) return;

        const result = await apiRequest("/api/webhook/manage-binding", {
          method: "POST",
          body: JSON.stringify({ action: "unbind" }),
        });

        if (result?.success) {
          Toast.success("用户绑定已解除");
          await loadTelegramStatus();
        } else {
          Toast.error(result?.message || "解除绑定失败");
        }
      });

    document
      .getElementById("clearAllSettingsBtn")
      ?.addEventListener("click", async function () {
        if (!confirm("⚠️ 警告：此操作将清空所有 Bot 设置，确定要继续吗？"))
          return;

        const confirmText = prompt('请输入 "CLEAR BOT SETTINGS" 以确认：');
        if (confirmText !== "CLEAR BOT SETTINGS") {
          Toast.error("确认文本不正确，操作已取消");
          return;
        }

        if (!confirm("🚨 最后确认：此操作不可撤销，确定要执行吗？")) return;

        Toast.info("正在清空所有 Bot 设置...");

        const result = await apiRequest("/api/webhook/clear-settings", {
          method: "POST",
          body: JSON.stringify({
            confirmText: "CLEAR BOT SETTINGS",
            clearBot: true,
            clearBinding: true,
            clearWebhook: true,
          }),
        });

        if (result?.success) {
          Toast.success("Bot 设置清空成功");
          await loadConfig();
          await loadTelegramStatus();
          document.getElementById("botToken").value = "";
          document.getElementById("userChatId").value = "";
          document.getElementById("webhookUrl").value = "";
        } else {
          Toast.error(result?.message || "Bot 设置清空失败");
        }
      });

    document
      .getElementById("refreshAllStatusBtn")
      ?.addEventListener("click", async function () {
        Toast.info("正在刷新所有状态...");
        await loadConfig();
        await loadTelegramStatus();
        await updateStatusCards();
        Toast.success("所有状态已刷新");
      });
  }

  // 推送设置表单
  document
    .getElementById("pushSettingsForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      const data = {
        stop_push: document.getElementById("stopPush").checked ? 1 : 0,
        only_title: document.getElementById("onlyTitle").checked ? 1 : 0,
      };

      const result = await apiRequest("/api/config", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (result?.success) {
        Toast.success("推送设置保存成功");
      } else {
        Toast.error(result?.message || "推送设置保存失败");
      }
    });

  // 添加订阅表单
  document
    .getElementById("addSubForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      const data = {
        keyword1: document.getElementById("keyword1").value.trim() || undefined,
        keyword2: document.getElementById("keyword2").value.trim() || undefined,
        keyword3: document.getElementById("keyword3").value.trim() || undefined,
        creator: document.getElementById("creator").value.trim() || undefined,
        category: document.getElementById("category").value || undefined,
      };

      if (
        !data.keyword1 &&
        !data.keyword2 &&
        !data.keyword3 &&
        !data.creator &&
        !data.category
      ) {
        Toast.error("请至少填写一个关键词或选择创建者/分类");
        return;
      }

      const result = await apiRequest("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (result?.success) {
        Toast.success("订阅添加成功");
        document.getElementById("addSubForm").reset();
        await loadSubscriptions();
        await updateStatusCards();
      } else {
        Toast.error(result?.message || "订阅添加失败");
      }
    });

  // 删除订阅
  window.deleteSubscription = async function (id) {
    if (!confirm("确定要删除这个订阅吗？")) return;

    const result = await apiRequest(`/api/subscriptions/${id}`, {
      method: "DELETE",
    });

    if (result?.success) {
      Toast.success("订阅删除成功");
      await loadSubscriptions();
      await updateStatusCards();
    } else {
      Toast.error(result?.message || "订阅删除失败");
    }
  };

  // 刷新文章
  document
    .getElementById("refreshPostsBtn")
    ?.addEventListener("click", async function () {
      await loadPosts();
      Toast.success("文章列表已刷新");
    });

  // 更新 RSS
  document
    .getElementById("updateRssBtn")
    ?.addEventListener("click", async function () {
      Toast.info("正在更新RSS...");

      const result = await apiRequest("/api/rss/fetch", { method: "POST" });

      if (result?.success) {
        Toast.success(`RSS更新成功，新增 ${result.data.new} 篇文章`);
        await loadPosts();
        await updateStatusCards();
      } else {
        Toast.error(result?.message || "RSS更新失败");
      }
    });

  // 退出登录
  document
    .getElementById("logoutBtn")
    ?.addEventListener("click", async function () {
      if (!confirm("确定要退出登录吗？")) return;

      try {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.error("注销API调用失败:", error);
      } finally {
        localStorage.removeItem("sessionId");
        window.location.href = "/login";
      }
    });

  // 搜索表单
  const postsFilterForm = document.getElementById("postsFilterForm");
  if (postsFilterForm) {
    const debouncedSearch = debounce(performSearch, 500);

    postsFilterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      performSearch();
    });

    postsFilterForm.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("input", debouncedSearch);
    });

    function performSearch() {
      const filters = {
        search: document.getElementById("searchTitle")?.value.trim() || "",
        pushStatus: document.getElementById("filterStatus")?.value || "",
        creator: document.getElementById("filterCreator")?.value.trim() || "",
        category: document.getElementById("filterCategory")?.value || "",
      };

      Object.keys(filters).forEach((key) => {
        if (filters[key] === "") delete filters[key];
      });

      loadPosts(1, filters);
    }
  }

  // 清空筛选
  document
    .getElementById("clearFiltersBtn")
    ?.addEventListener("click", function () {
      document.getElementById("searchTitle").value = "";
      document.getElementById("filterStatus").value = "";
      document.getElementById("filterCreator").value = "";
      document.getElementById("filterCategory").value = "";
      loadPosts(1, {});
    });

  // 分页按钮
  document
    .getElementById("prevPageBtn")
    ?.addEventListener("click", function () {
      if (currentPage > 1) loadPosts(currentPage - 1, currentFilters);
    });

  document
    .getElementById("nextPageBtn")
    ?.addEventListener("click", function () {
      loadPosts(currentPage + 1, currentFilters);
    });

  // ============================================
  // 初始化
  // ============================================
  Theme.init();
  initTabs();
  updateStatusCards();
  loadConfig();
  setTimeout(setupTelegramButtons, 500);

  // 自动填充 webhook URL
  const webhookUrlInput = document.getElementById("webhookUrl");
  if (webhookUrlInput && !webhookUrlInput.value) {
    const currentUrl = new URL(window.location.href);
    webhookUrlInput.value = `${currentUrl.protocol}//${currentUrl.host}/telegram/webhook`;
  }
});
