/**
 * NodeSeeker PWA 注册脚本
 * 处理 Service Worker 注册和 PWA 安装提示
 */

(function () {
    'use strict';

    // PWA 状态管理
    const PWAState = {
        isInstalled: false,
        isOnline: navigator.onLine,
        deferredPrompt: null,
        swRegistration: null
    };

    // 检查 PWA 是否已安装
    function checkInstallation() {
        // 检查是否以独立模式运行
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            PWAState.isInstalled = true;
            document.documentElement.classList.add('pwa-installed');
            console.log('[PWA] 应用以独立模式运行');
        }
    }

    // 注册 Service Worker
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('[PWA] 浏览器不支持 Service Worker');
            return false;
        }

        // 检查是否在安全上下文（HTTPS 或 localhost）
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        const isHTTPS = location.protocol === 'https:';

        if (!isLocalhost && !isHTTPS) {
            console.warn('[PWA] Service Worker 需要 HTTPS 或 Localhost');
            console.warn('[PWA] 当前:', location.protocol, location.hostname);
            return false;
        }

        try {
            console.log('[PWA] 正在注册 Service Worker...');

            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'imports'
            });

            PWAState.swRegistration = registration;
            console.log('[PWA] Service Worker 注册成功:', registration.scope);

            // 详细记录状态
            if (registration.installing) {
                console.log('[PWA] Service Worker 正在安装...');
                registration.installing.addEventListener('statechange', (e) => {
                    console.log('[PWA] Service Worker 状态:', e.target.state);
                });
            }
            if (registration.waiting) {
                console.log('[PWA] Service Worker 等待激活');
            }
            if (registration.active) {
                console.log('[PWA] Service Worker 已激活');
            }

            // 监听 Service Worker 状态变化
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[PWA] 发现新的 Service Worker');

                newWorker.addEventListener('statechange', () => {
                    console.log('[PWA] Service Worker 状态变化:', newWorker.state);
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // 新版本可用
                        showUpdateNotification(newWorker);
                    }
                });
            });

            // 检查更新
            await checkForUpdate();

            return true;
        } catch (error) {
            console.error('[PWA] Service Worker 注册失败:', error);
            console.error('[PWA] 错误详情:', error.message);

            // 常见错误提示
            if (error.message.includes('MIME type')) {
                console.error('[PWA] 提示: sw.js 必须以 JavaScript MIME type (application/javascript) 提供');
            } else if (error.message.includes('path')) {
                console.error('[PWA] 提示: Service Worker 路径必须是绝对路径 /sw.js');
            }

            return false;
        }
    }

    // 检查更新
    async function checkForUpdate() {
        if (!PWAState.swRegistration) return;

        try {
            await PWAState.swRegistration.update();
            console.log('[PWA] 已检查 Service Worker 更新');
        } catch (error) {
            console.error('[PWA] 检查更新失败:', error);
        }
    }

    // 显示更新通知
    function showUpdateNotification(worker) {
        // 创建更新提示
        const updateToast = document.createElement('div');
        updateToast.className = 'pwa-update-toast';
        updateToast.innerHTML = `
            <div class="pwa-update-content">
                <span>📡 发现新版本</span>
                <button id="pwa-update-btn" class="btn btn-primary btn-sm">更新</button>
            </div>
        `;

        // 添加样式
        updateToast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: #e2e8f0;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(updateToast);

        // 更新按钮点击事件
        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            worker.postMessage({ action: 'skipWaiting' });
            updateToast.remove();
        });

        // 监听 Service Worker 更新完成
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    // 请求通知权限
    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('[PWA] 浏览器不支持通知');
            return false;
        }

        const permission = await Notification.requestPermission();
        console.log('[PWA] 通知权限:', permission);
        return permission === 'granted';
    }

    // 订阅推送通知
    async function subscribeToPush() {
        if (!PWAState.swRegistration) {
            console.log('[PWA] Service Worker 未注册');
            return null;
        }

        try {
            const subscription = await PWAState.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    // 这里需要替换为实际的 VAPID 公钥
                    'BEl62iMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                )
            });

            console.log('[PWA] 推送订阅成功:', subscription);
            return subscription;
        } catch (error) {
            console.error('[PWA] 推送订阅失败:', error);
            return null;
        }
    }

    // Base64 URL 安全解码
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // 监听网络状态变化
    function setupNetworkListeners() {
        window.addEventListener('online', () => {
            PWAState.isOnline = true;
            document.documentElement.classList.remove('offline');
            document.documentElement.classList.add('online');
            showNetworkStatus('online');
            console.log('[PWA] 网络已连接');
        });

        window.addEventListener('offline', () => {
            PWAState.isOnline = false;
            document.documentElement.classList.remove('online');
            document.documentElement.classList.add('offline');
            showNetworkStatus('offline');
            console.log('[PWA] 网络已断开');
        });

        // 初始状态
        if (!navigator.onLine) {
            document.documentElement.classList.add('offline');
        }
    }

    // 显示网络状态提示
    function showNetworkStatus(status) {
        // 移除旧的状态提示
        const existingToast = document.querySelector('.pwa-network-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'pwa-network-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        `;

        if (status === 'online') {
            toast.style.background = '#10b981';
            toast.style.color = '#fff';
            toast.innerHTML = '🟢 已连接到网络';
        } else {
            toast.style.background = '#ef4444';
            toast.style.color = '#fff';
            toast.innerHTML = '🔴 已切换到离线模式';
        }

        document.body.appendChild(toast);

        // 3秒后自动隐藏
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 监听安装提示
    function setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // 阻止默认提示
            e.preventDefault();
            PWAState.deferredPrompt = e;
            console.log('[PWA] 安装提示已保存');
        });

        window.addEventListener('appinstalled', () => {
            PWAState.isInstalled = true;
            PWAState.deferredPrompt = null;
            document.documentElement.classList.add('pwa-installed');
            console.log('[PWA] 应用已安装');
        });
    }

    // 后台同步
    async function sync(tag) {
        if (!('sync' in registration)) {
            console.log('[PWA] 浏览器不支持后台同步');
            return false;
        }

        try {
            await PWAState.swRegistration.sync.register(tag);
            console.log('[PWA] 后台同步已注册:', tag);
            return true;
        } catch (error) {
            console.error('[PWA] 后台同步注册失败:', error);
            return false;
        }
    }

    // 初始化 PWA
    async function init() {
        console.log('[PWA] 初始化 PWA...');

        checkInstallation();
        setupNetworkListeners();
        setupInstallPrompt();

        const swRegistered = await registerServiceWorker();

        if (swRegistered) {
            // 注册成功后请求通知权限
            await requestNotificationPermission();
        }

        // 暴露 PWA API 到全局
        window.NodeSeekerPWA = {
            state: PWAState,
            checkForUpdate,
            requestNotificationPermission,
            subscribeToPush,
            sync,
            install: () => {
                if (PWAState.deferredPrompt) {
                    PWAState.deferredPrompt.prompt();
                }
            }
        };

        console.log('[PWA] PWA 初始化完成');
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
