/**
 * NodeSeeker PWA Service Worker
 * 提供离线缓存和后台同步功能
 */

const CACHE_NAME = 'nodeseeker-v1';
const STATIC_CACHE = 'nodeseeker-static-v1';
const DYNAMIC_CACHE = 'nodeseeker-dynamic-v1';

// 预缓存的核心静态资源
const STATIC_ASSETS = [
    '/',
    '/login',
    '/css/style.css',
    '/css/theme.css',
    '/css/auth.css',
    '/css/buttons.css',
    '/css/dashboard.css',
    '/css/form-enhance.css',
    '/css/skeleton.css',
    '/css/table-enhance.css',
    '/css/tabs.css',
    '/css/toast.css',
    '/js/init.js',
    '/js/login.js',
    '/js/home.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/favicon.svg'
];

// 安装事件：预缓存静态资源
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker 安装中...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] 预缓存静态资源');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] 静态资源缓存完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] 预缓存失败:', error);
            })
    );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 删除不属于当前版本的缓存
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('[SW] 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker 已激活');
                return self.clients.claim();
            })
    );
});

// 网络优先策略（适用于 API 请求）
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // 缓存成功的 GET 请求
        if (request.method === 'GET' && networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] 网络请求失败，尝试从缓存获取:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 如果是 API 请求，返回离线友好的错误响应
        if (request.url.includes('/api/')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '当前处于离线状态，请检查网络连接',
                    offline: true
                }),
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        throw error;
    }
}

// 缓存优先策略（适用于静态资源）
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // 后台更新缓存
        fetch(request)
            .then((networkResponse) => {
                if (networkResponse.ok) {
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, networkResponse);
                    });
                }
            })
            .catch(() => {
                // 忽略后台更新失败
            });
        
        return cachedResponse;
    }
    
    // 缓存未命中，从网络获取
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

// 仅网络策略（适用于非 GET 请求）
async function networkOnly(request) {
    return fetch(request);
}

// 获取请求策略
function getStrategy(request) {
    const url = new URL(request.url);
    
    // API 请求使用网络优先
    if (url.pathname.startsWith('/api/')) {
        return networkFirst;
    }
    
    // 静态资源使用缓存优先
    if (
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        request.destination === 'font' ||
        url.pathname.startsWith('/css/') ||
        url.pathname.startsWith('/js/') ||
        url.pathname.startsWith('/icons/')
    ) {
        return cacheFirst;
    }
    
    // 非 GET 请求仅使用网络
    if (request.method !== 'GET') {
        return networkOnly;
    }
    
    // 默认使用网络优先
    return networkFirst;
}

// 获取事件
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // 跳过非 HTTP 请求（如 chrome-extension）
    if (!request.url.startsWith('http')) {
        return;
    }
    
    const strategy = getStrategy(request);
    
    event.respondWith(
        strategy(request).catch((error) => {
            console.error('[SW] 请求处理失败:', error);
            
            // 返回离线页面（如果是页面导航）
            if (request.mode === 'navigate') {
                return caches.match('/')
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        // 如果没有缓存首页，返回简单的离线消息
                        return new Response(
                            '<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;background:#0f172a;color:#e2e8f0;"><div style="text-align:center;"><h1>📡 NodeSeeker</h1><p>当前处于离线状态</p><p>请检查网络连接后重试</p></div></body></html>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
            }
            
            throw error;
        })
    );
});

// 后台同步事件
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-rss-check') {
        console.log('[SW] 执行后台 RSS 检查同步');
        event.waitUntil(
            fetch('/api/scheduler/rss/run')
                .then((response) => response.json())
                .then((data) => {
                    console.log('[SW] 后台 RSS 检查完成:', data);
                })
                .catch((error) => {
                    console.error('[SW] 后台 RSS 检查失败:', error);
                })
        );
    }
});

// 推送通知事件
self.addEventListener('push', (event) => {
    console.log('[SW] 收到推送通知');
    
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: 'NodeSeeker 通知', body: event.data ? event.data.text() : '' };
    }
    
    const title = data.title || 'NodeSeeker';
    const options = {
        body: data.body || '您有新的 RSS 更新',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: data.tag || 'nodeseeker-notification',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [
            { action: 'open', title: '查看' },
            { action: 'dismiss', title: '忽略' }
        ],
        data: data.data || { url: '/' }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 通知被点击:', event.action);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    const url = notificationData.url || '/';
    
    if (event.action === 'dismiss') {
        return;
    }
    
    // 打开或聚焦到应用页面
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // 查找已打开的窗口
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // 如果没有打开的窗口，打开新窗口
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// 定期后台同步（如果支持）
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'periodic-rss-check') {
        console.log('[SW] 执行定期后台 RSS 检查');
        event.waitUntil(
            fetch('/api/scheduler/rss/run')
                .then((response) => response.json())
                .then((data) => {
                    console.log('[SW] 定期 RSS 检查完成:', data);
                })
                .catch((error) => {
                    console.error('[SW] 定期 RSS 检查失败:', error);
                })
        );
    }
});

console.log('[SW] Service Worker 已加载');
