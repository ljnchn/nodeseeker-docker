// ============================================
// 首页 JavaScript - 帖子列表与抽屉设置
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const sessionId = localStorage.getItem("sessionId");
  const isLoggedIn = !!sessionId;

  // 根据登录状态显示/隐藏元素
  const loginBtn = document.getElementById("loginBtn");
  const settingsDropdown = document.getElementById("settingsDropdown");
  const subscribedOnlyChip = document.getElementById("subscribedOnlyChip");
  const filterSubscription = document.getElementById("filterSubscription");
  
  if (isLoggedIn) {
    // 已登录：显示设置菜单和订阅相关功能，隐藏登录按钮
    if (loginBtn) loginBtn.style.display = "none";
    if (settingsDropdown) settingsDropdown.style.display = "block";
    if (subscribedOnlyChip) subscribedOnlyChip.style.display = "inline-flex";
    if (filterSubscription) filterSubscription.style.display = "block";
  } else {
    // 未登录：显示登录按钮，隐藏设置菜单和订阅相关功能
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (settingsDropdown) settingsDropdown.style.display = "none";
    if (subscribedOnlyChip) subscribedOnlyChip.style.display = "none";
    if (filterSubscription) filterSubscription.style.display = "none";
  }

  // ============================================
  // Toast 通知系统
  // ============================================
  const Toast = {
    container: null,

    init() {
      if (!this.container) {
        this.container = document.getElementById("toastContainer");
      }
    },

    show(message, type = "info", duration = 3000) {
      this.init();
      if (!this.container) return;

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
      `;

      this.container.appendChild(toast);

      toast.querySelector(".toast-close").addEventListener("click", () => {
        this.hide(toast);
      });

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
  // API 请求封装
  // ============================================
  async function apiRequest(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (sessionId) {
      headers.Authorization = `Bearer ${sessionId}`;
    }

    const defaultOptions = { headers };

    try {
      const response = await fetch(url, { ...options, ...defaultOptions });
      const result = await response.json();

      if (response.status === 401) {
        if (sessionId) {
          localStorage.removeItem("sessionId");
          window.location.href = "/login";
        }
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
  // 主题切换
  // ============================================
  function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      Toast.info(`已切换到${newTheme === "dark" ? "暗色" : "浅色"}模式`);
    });
  }

  // ============================================
  // 抽屉系统
  // ============================================
  const Drawer = {
    overlay: document.getElementById("drawerOverlay"),
    activeDrawer: null,

    init() {
      // 关闭按钮事件
      document.querySelectorAll(".drawer-close").forEach((btn) => {
        btn.addEventListener("click", () => {
          const drawerName = btn.dataset.drawer;
          this.close(drawerName);
        });
      });

      // 遮罩点击关闭
      this.overlay?.addEventListener("click", () => {
        this.closeAll();
      });

      // ESC 键关闭
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeAll();
        }
      });
    },

    open(name) {
      const drawer = document.getElementById(`${name}Drawer`);
      if (!drawer) return;

      this.closeAll();
      this.activeDrawer = name;

      drawer.style.display = "block";
      this.overlay.style.display = "block";

      // 触发重绘以启动动画
      requestAnimationFrame(() => {
        drawer.classList.add("drawer-open");
        this.overlay.classList.add("overlay-visible");
      });

      document.body.style.overflow = "hidden";
    },

    close(name) {
      const drawer = document.getElementById(`${name}Drawer`);
      if (!drawer) return;

      drawer.classList.remove("drawer-open");

      setTimeout(() => {
        drawer.style.display = "none";
        if (this.activeDrawer === name) {
          this.activeDrawer = null;
          this.overlay.style.display = "none";
          this.overlay.classList.remove("overlay-visible");
          document.body.style.overflow = "";
        }
      }, 300);
    },

    closeAll() {
      if (this.activeDrawer) {
        this.close(this.activeDrawer);
      }
    },
  };

  // ============================================
  // 帖子列表管理
  // ============================================
  let currentPage = 1;
  let currentFilters = {};
  let isLoading = false;

  async function loadPosts(page = 1, filters = {}) {
    if (isLoading) return;
    isLoading = true;

    currentPage = page;
    currentFilters = filters;

    const postsList = document.getElementById("postsList");
    const emptyState = document.getElementById("emptyState");
    const pagination = document.getElementById("pagination");

    // 显示加载状态
    if (page === 1) {
      postsList.innerHTML = `
        <div class="skeleton-wrapper">
          ${[1, 2, 3, 4, 5].map(() => `
            <div class="skeleton-card post-skeleton">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-line"></div>
              <div class="skeleton skeleton-line" style="width: 60%"></div>
              <div class="skeleton-meta">
                <div class="skeleton skeleton-badge"></div>
                <div class="skeleton skeleton-badge"></div>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "" && v !== undefined)
      ),
    });

    const result = await apiRequest(`/api/posts?${params}`);

    isLoading = false;

    if (!result?.success) {
      Toast.error("加载文章失败");
      return;
    }

    const { posts, total, page: currentPageNum, totalPages } = result.data;

    // 更新统计
    updateStats();

    if (posts.length === 0 && page === 1) {
      postsList.style.display = "none";
      emptyState.style.display = "block";
      pagination.style.display = "none";
      return;
    }

    postsList.style.display = "block";
    emptyState.style.display = "none";

    // 清空列表并显示当前页数据
    postsList.innerHTML = "";

    posts.forEach((post) => {
      const postEl = createPostElement(post);
      postsList.appendChild(postEl);
    });

    // 更新分页
    updatePagination(currentPageNum, totalPages, total);
  }

  function createPostElement(post) {
    // push_status: 0=待处理, 1=已匹配但未推送, 2=未匹配, 3=已匹配且已推送成功
    const isMatchedNotPushed = post.push_status === 1;
    const isPushed = post.push_status === 3;
    const showStatus = isMatchedNotPushed || isPushed;
    const statusClass = isPushed ? "matched" : isMatchedNotPushed ? "matched-not-pushed" : "";

    // 判断分类和作者是否匹配
    const isCategoryMatched = post.sub_category && post.sub_category === post.category;
    const isCreatorMatched = post.sub_creator && post.sub_creator === post.creator;

    // 构建关键词标签
    let keywordTagsHtml = "";
    if (showStatus && post.sub_id) {
      const parts = [];
      [post.sub_keyword1, post.sub_keyword2, post.sub_keyword3]
        .filter((k) => k)
        .forEach((k) => parts.push(`<span class="tag tag-blue">${escapeHtml(k)}</span>`));
      if (parts.length > 0) {
        keywordTagsHtml = `<span class="post-sub-tags">${parts.join("")}</span>`;
      }
    }

    const el = document.createElement("div");
    el.className = `post-card ${statusClass}`;
    el.innerHTML = `
      <div class="post-header">
        <h3 class="post-title">
          <a href="https://www.nodeseek.com/post-${post.post_id}-1" target="_blank" rel="noopener">
            ${escapeHtml(post.title)}
          </a>
        </h3>
        <span class="post-category ${isCategoryMatched ? 'highlight' : ''}">${escapeHtml(getCategoryName(post.category))}</span>
      </div>
      <p class="post-memo">${escapeHtml(post.memo)}</p>
      <div class="post-meta">
        <div class="post-meta-left">
          <span class="post-creator ${isCreatorMatched ? 'highlight' : ''}">${escapeHtml(post.creator)}</span>
          <span class="post-date">${new Date(post.pub_date).toLocaleString()}</span>
        </div>
        <div class="post-meta-right">
          ${keywordTagsHtml}
        </div>
      </div>
    `;
    return el;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 分类映射：英文 key -> 中文标题
  const categoryMap = {
    daily: "日常",
    tech: "技术",
    info: "情报",
    review: "测评",
    trade: "交易",
    carpool: "拼车",
    promotion: "推广",
    life: "生活",
    dev: "Dev",
    expose: "曝光",
    inside: "内版",
    sandbox: "沙盒",
  };

  function getCategoryName(key) {
    return categoryMap[key] || key;
  }

  function updatePagination(currentPageNum, totalPages, total) {
    const pagination = document.getElementById("pagination");
    const paginationInfo = document.getElementById("paginationInfo");
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const pageNumbers = document.getElementById("pageNumbers");

    if (totalPages <= 1) {
      pagination.style.display = "none";
      return;
    }

    pagination.style.display = "flex";
    paginationInfo.textContent = `第 ${currentPageNum} 页，共 ${total} 条记录`;
    prevBtn.disabled = currentPageNum <= 1;
    nextBtn.disabled = currentPageNum >= totalPages;

    // 渲染页码
    pageNumbers.innerHTML = "";
    const maxVisible = 5;
    let start = Math.max(1, currentPageNum - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement("button");
      btn.className = `page-number ${i === currentPageNum ? "active" : ""}`;
      btn.textContent = i;
      btn.addEventListener("click", () => loadPosts(i, currentFilters));
      pageNumbers.appendChild(btn);
    }
  }

  // ============================================
  // 筛选和搜索
  // ============================================
  function initFilters() {
    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const subscribedOnlyChip = document.getElementById("subscribedOnlyChip");
    const filterToggleBtn = document.getElementById("filterToggleBtn");
    const filterPanel = document.getElementById("filterPanel");
    const filterCategory = document.getElementById("filterCategory");
    const filterSubscription = document.getElementById("filterSubscription");
    const filterCreator = document.getElementById("filterCreator");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

    let searchTimeout;

    // 搜索防抖
    searchInput?.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const value = e.target.value.trim();

      clearSearchBtn.style.display = value ? "block" : "none";

      searchTimeout = setTimeout(() => {
        currentFilters.search = value;
        loadPosts(1, currentFilters);
      }, 500);
    });

    clearSearchBtn?.addEventListener("click", () => {
      searchInput.value = "";
      clearSearchBtn.style.display = "none";
      delete currentFilters.search;
      loadPosts(1, currentFilters);
    });

    // 只看订阅 toggle（查询状态 1=已匹配但未推送 和 3=已匹配且已推送成功）
    subscribedOnlyChip?.addEventListener("click", () => {
      const isActive = subscribedOnlyChip.classList.toggle("active");

      if (isActive) {
        // 同时查询状态 1 和 3（所有已匹配的文章）
        currentFilters.pushStatusIn = "1,3";
        delete currentFilters.pushStatus;
        delete currentFilters.pushStatusNot;
      } else {
        delete currentFilters.pushStatusIn;
        delete currentFilters.pushStatus;
        delete currentFilters.pushStatusNot;
      }
      loadPosts(1, currentFilters);
    });

    // 筛选面板展开/收起
    filterToggleBtn?.addEventListener("click", () => {
      const isOpen = filterPanel.style.display !== "none";
      filterPanel.style.display = isOpen ? "none" : "block";
      filterToggleBtn.classList.toggle("active", !isOpen);
    });

    // 分类筛选
    filterCategory?.addEventListener("change", (e) => {
      currentFilters.category = e.target.value;
      loadPosts(1, currentFilters);
    });

    // 订阅筛选
    filterSubscription?.addEventListener("change", (e) => {
      const value = e.target.value;
      if (value) {
        currentFilters.subId = value;
      } else {
        delete currentFilters.subId;
      }
      loadPosts(1, currentFilters);
    });

    // 作者筛选
    filterCreator?.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.creator = e.target.value.trim();
        loadPosts(1, currentFilters);
      }, 500);
    });

    // 清除筛选
    clearFiltersBtn?.addEventListener("click", () => {
      filterCategory.value = "";
      if (filterSubscription) filterSubscription.value = "";
      filterCreator.value = "";
      delete currentFilters.category;
      delete currentFilters.subId;
      delete currentFilters.creator;
      loadPosts(1, currentFilters);
    });

    // 刷新按钮
    document.getElementById("refreshBtn")?.addEventListener("click", () => {
      Toast.info("正在刷新...");
      loadPosts(currentPage, currentFilters);
    });

    // 抓取 RSS
    document.getElementById("fetchRssBtn")?.addEventListener("click", async () => {
      Toast.info("正在抓取 RSS...");
      const result = await apiRequest("/api/rss/fetch", { method: "POST" });
      if (result?.success) {
        Toast.success(`抓取成功，新增 ${result.data.new} 篇文章`);
        loadPosts(1, currentFilters);
      } else {
        Toast.error(result?.message || "抓取失败");
      }
    });

    // 分页按钮
    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
      if (currentPage > 1) {
        loadPosts(currentPage - 1, currentFilters);
      }
    });

    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
      loadPosts(currentPage + 1, currentFilters);
    });
  }

  // ============================================
  // 统计数据
  // ============================================
  async function updateStats() {
    if (!isLoggedIn) return;
    const result = await apiRequest("/api/stats");
    if (result?.success) {
      const data = result.data;
      // 统计抽屉
      const el = (id) => document.getElementById(id);
      if (el("drawerStatTodayPushed")) el("drawerStatTodayPushed").textContent = data.today_pushed || 0;
      if (el("drawerStatTodayPosts")) el("drawerStatTodayPosts").textContent = data.today_posts || 0;
      if (el("drawerStatPushed")) el("drawerStatPushed").textContent = data.pushed_posts || 0;
      if (el("drawerStatTotalPosts")) el("drawerStatTotalPosts").textContent = data.total_posts || 0;
    }
  }

  // ============================================
  // RSS 配置
  // ============================================
  async function loadRssConfig() {
    const result = await apiRequest("/api/rss/config");
    if (result?.success) {
      document.getElementById("rssUrl").value = result.data.rss_url || "";
      document.getElementById("rssInterval").value = result.data.rss_interval_seconds || 60;
      document.getElementById("rssProxy").value = result.data.rss_proxy || "";
    }
  }

  function initRssConfig() {
    // 保存配置
    document.getElementById("rssConfigForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        rss_url: document.getElementById("rssUrl").value.trim(),
        rss_interval_seconds: parseInt(document.getElementById("rssInterval").value, 10),
        rss_proxy: document.getElementById("rssProxy").value.trim(),
      };

      const result = await apiRequest("/api/rss/config", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (result?.success) {
        Toast.success("RSS 配置已保存");
        if (data.rss_interval_seconds) {
          await apiRequest("/api/rss/restart", { method: "POST" });
        }
      } else {
        Toast.error(result?.message || "保存失败");
      }
    });

    // 测试连接
    document.getElementById("testRssBtn")?.addEventListener("click", async () => {
      const rssUrl = document.getElementById("rssUrl").value.trim();
      Toast.info("正在测试连接...");

      const result = await apiRequest("/api/rss/test-connection", {
        method: "POST",
        body: JSON.stringify({ rss_url: rssUrl }),
      });

      if (result?.success) {
        if (result.data.accessible) {
          Toast.success("RSS 源连接正常");
        } else {
          Toast.error("连接失败：" + result.data.message);
        }
      }
    });
  }

  // ============================================
  // Telegram 配置
  // ============================================
  async function loadTelegramConfig() {
    const result = await apiRequest("/api/config");
    if (result?.success) {
      document.getElementById("botToken").value = result.data.bot_token || "";
      document.getElementById("chatId").value = result.data.chat_id || "";
      document.getElementById("stopPush").checked = result.data.stop_push === 1;
      document.getElementById("onlyTitle").checked = result.data.only_title === 1;
    }
  }

  function initTelegramConfig() {
    document.getElementById("telegramConfigForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        bot_token: document.getElementById("botToken").value.trim(),
        chat_id: document.getElementById("chatId").value.trim(),
        stop_push: document.getElementById("stopPush").checked ? 1 : 0,
        only_title: document.getElementById("onlyTitle").checked ? 1 : 0,
      };

      const result = await apiRequest("/api/config", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (result?.success) {
        Toast.success("Telegram 配置已保存");
      } else {
        Toast.error(result?.message || "保存失败");
      }
    });

    document.getElementById("testTelegramBtn")?.addEventListener("click", async () => {
      Toast.info("正在测试连接...");

      // 1. 先测试 Bot 连接
      const result = await apiRequest("/api/webhook/test-connection", { method: "POST" });
      if (!result?.success) {
        Toast.error(result?.message || "连接测试失败");
        return;
      }

      // 2. 如果 Chat ID 已配置，发送测试消息
      const chatId = document.getElementById("chatId").value.trim();
      if (chatId) {
        Toast.info("连接成功，正在发送测试消息...");
        const testResult = await apiRequest("/api/push/test-send", {
          method: "POST",
          body: JSON.stringify({ message: "📡 NodeSeeker 推送测试" }),
        });
        if (testResult?.success) {
          Toast.success("连接测试成功，测试消息已发送");
        } else {
          Toast.warning("连接成功，但测试消息发送失败：" + (testResult?.message || "未知错误"));
        }
      } else {
        Toast.success("Bot 连接测试成功（未配置 Chat ID，跳过消息测试）");
      }
    });
  }

  // ============================================
  // 筛选面板订阅下拉框
  // ============================================
  async function loadFilterSubscriptions() {
    if (!isLoggedIn) return;
    const filterSubscription = document.getElementById("filterSubscription");
    if (!filterSubscription) return;

    const result = await apiRequest("/api/subscriptions");
    if (!result?.success) return;

    const subs = result.data;
    const currentValue = filterSubscription.value;

    filterSubscription.innerHTML = '<option value="">全部订阅</option>';
    subs.forEach((sub) => {
      const keywords = [sub.keyword1, sub.keyword2, sub.keyword3].filter(Boolean).join(", ");
      const extra = [
        sub.creator ? `👤${sub.creator}` : "",
        sub.category ? `📂${getCategoryName(sub.category)}` : "",
      ].filter(Boolean).join(" ");
      const label = [keywords, extra].filter(Boolean).join(" ") || `订阅 #${sub.id}`;

      const option = document.createElement("option");
      option.value = sub.id;
      option.textContent = label;
      filterSubscription.appendChild(option);
    });

    if (currentValue) filterSubscription.value = currentValue;
  }

  // ============================================
  // 订阅管理
  // ============================================
  async function loadSubscriptions() {
    const result = await apiRequest("/api/subscriptions");
    const container = document.getElementById("subscriptionsList");

    if (!result?.success) {
      container.innerHTML = "<p>加载失败</p>";
      return;
    }

    const subs = result.data;
    if (subs.length === 0) {
      container.innerHTML = `
        <div class="empty-state-small">
          <div class="empty-icon">📝</div>
          <div class="empty-title">暂无订阅</div>
        </div>
      `;
      return;
    }

    container.innerHTML = subs.map((sub) => `
      <div class="subscription-item" data-id="${sub.id}">
        <div class="subscription-keywords">
          ${[sub.keyword1, sub.keyword2, sub.keyword3]
            .filter((k) => k)
            .map((k) => `<span class="tag tag-blue">${escapeHtml(k)}</span>`)
            .join("")}
        </div>
        <div class="subscription-filters">
          ${sub.creator ? `<span class="tag">👤 ${escapeHtml(sub.creator)}</span>` : ""}
          ${sub.category ? `<span class="tag">📂 ${getCategoryName(sub.category)}</span>` : ""}
        </div>
        <button class="btn btn-danger btn-xs delete-sub-btn" data-id="${sub.id}">
          删除
        </button>
      </div>
    `).join("");

    // 绑定删除事件
    container.querySelectorAll(".delete-sub-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("确定要删除这个订阅吗？")) return;

        const id = btn.dataset.id;
        const result = await apiRequest(`/api/subscriptions/${id}`, {
          method: "DELETE",
        });

        if (result?.success) {
          Toast.success("订阅已删除");
          loadSubscriptions();
          loadFilterSubscriptions();
        }
      });
    });
  }

  function initSubscriptions() {
    // 添加订阅
    document.getElementById("addSubForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        keyword1: document.getElementById("keyword1").value.trim() || undefined,
        keyword2: document.getElementById("keyword2").value.trim() || undefined,
        keyword3: document.getElementById("keyword3").value.trim() || undefined,
        creator: document.getElementById("subCreator").value.trim() || undefined,
        category: document.getElementById("subCategory").value || undefined,
      };

      if (!data.keyword1 && !data.keyword2 && !data.keyword3 && !data.creator && !data.category) {
        Toast.warning("请至少填写一个条件");
        return;
      }

      const result = await apiRequest("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (result?.success) {
        Toast.success("订阅已添加");
        document.getElementById("addSubForm").reset();
        loadSubscriptions();
        loadFilterSubscriptions();
        updateStats();
      } else {
        Toast.error(result?.message || "添加失败");
      }
    });
  }

  // ============================================
  // 下拉菜单和设置抽屉
  // ============================================
  function initSettingsDropdown() {
    const settingsBtn = document.getElementById("settingsBtn");
    const dropdown = settingsBtn?.closest(".dropdown");
    const menu = dropdown?.querySelector(".dropdown-menu");
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)")
      .matches;
    let closeTimeout;
    let isTouchDevice = false;

    if (!settingsBtn || !dropdown || !menu) return;

    // 检测是否为触摸设备
    const detectTouch = () => {
      isTouchDevice = true;
    };
    settingsBtn.addEventListener("touchstart", detectTouch, { passive: true, once: true });

    // 显示菜单
    const openMenu = () => {
      clearTimeout(closeTimeout);
      dropdown.classList.add("open");
    };

    const closeMenu = () => {
      clearTimeout(closeTimeout);
      dropdown.classList.remove("open");
    };

    // 延迟关闭菜单（用于桌面 hover）
    const closeMenuWithDelay = () => {
      closeTimeout = setTimeout(() => {
        closeMenu();
      }, 150);
    };

    if (supportsHover) {
      // 桌面端：鼠标悬停显示（仅非触摸设备）
      settingsBtn.addEventListener("mouseenter", () => {
        if (!isTouchDevice) openMenu();
      });
      menu.addEventListener("mouseenter", () => {
        if (!isTouchDevice) openMenu();
      });

      // 桌面端：鼠标移出延迟关闭
      settingsBtn.addEventListener("mouseleave", () => {
        if (!isTouchDevice) closeMenuWithDelay();
      });
      menu.addEventListener("mouseleave", () => {
        if (!isTouchDevice) closeMenuWithDelay();
      });
    }

    // 触屏/桌面通用：点击按钮切换菜单
    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const isOpen = dropdown.classList.contains("open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // 菜单内部点击不触发外部关闭
    menu.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // 点击外部关闭
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        closeMenu();
      }
    });

    // 触摸设备：点击遮罩关闭
    document.addEventListener("touchstart", (e) => {
      if (!dropdown.contains(e.target)) {
        closeMenu();
      }
    }, { passive: true });

    // ESC 快捷关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    });

    // 下拉菜单项点击
    dropdown.querySelectorAll(".dropdown-item[data-drawer]").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const drawerName = item.dataset.drawer;
        closeMenu();

        // 加载对应数据并打开抽屉
        if (drawerName === "subscriptions") {
          loadSubscriptions();
        } else if (drawerName === "rss") {
          loadRssConfig();
        } else if (drawerName === "telegram") {
          loadTelegramConfig();
        }
        Drawer.open(drawerName);
      });
    });
  }

  // ============================================
  // 退出登录
  // ============================================
  function initLogout() {
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      if (confirm("确定要退出登录吗？")) {
        apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });
        localStorage.removeItem("sessionId");
        window.location.href = "/login";
      }
    });
  }

  // ============================================
  // 初始化
  // ============================================
  function init() {
    initTheme();
    Drawer.init();
    initFilters();
    initRssConfig();
    initTelegramConfig();
    initSubscriptions();
    initSettingsDropdown();
    initLogout();

    // 加载初始数据
    loadPosts();
    updateStats();
    loadFilterSubscriptions();
  }

  init();
});
