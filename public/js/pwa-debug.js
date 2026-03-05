/**
 * PWA 调试工具
 * 在控制台运行 window.checkPWA() 查看 PWA 状态
 */

(function() {
    'use strict';

    window.checkPWA = async function() {
        console.log('%c=== PWA 状态检查 ===', 'color: #3b82f6; font-size: 16px; font-weight: bold');
        
        const results = {
            https: location.protocol === 'https:',
            localhost: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
            serviceWorker: 'serviceWorker' in navigator,
            manifest: false,
            swRegistered: false,
            swActivated: false,
            installable: false,
            errors: []
        };

        // 检查 HTTPS/localhost
        console.log('%c1. 安全上下文检查', 'color: #60a5fa; font-weight: bold');
        if (results.https) {
            console.log('  ✅ HTTPS');
        } else if (results.localhost) {
            console.log('  ✅ Localhost (开发环境)');
        } else {
            console.log('  ❌ 需要 HTTPS 或 Localhost');
            results.errors.push('必须使用 HTTPS 或 Localhost');
        }

        // 检查 Service Worker 支持
        console.log('%c2. Service Worker 支持', 'color: #60a5fa; font-weight: bold');
        if (results.serviceWorker) {
            console.log('  ✅ 浏览器支持 Service Worker');
        } else {
            console.log('  ❌ 浏览器不支持 Service Worker');
            results.errors.push('浏览器不支持 Service Worker');
        }

        // 检查 Manifest
        console.log('%c3. Manifest 检查', 'color: #60a5fa; font-weight: bold');
        try {
            const manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                console.log('  📋 Manifest URL:', manifestLink.href);
                const response = await fetch(manifestLink.href);
                if (response.ok) {
                    const manifest = await response.json();
                    results.manifest = true;
                    console.log('  ✅ Manifest 可访问');
                    console.log('     - Name:', manifest.name);
                    console.log('     - Short Name:', manifest.short_name);
                    console.log('     - Start URL:', manifest.start_url);
                    console.log('     - Display:', manifest.display);
                    console.log('     - Icons:', manifest.icons?.length || 0, '个图标');
                    
                    // 检查图标
                    if (manifest.icons && manifest.icons.length > 0) {
                        const has192 = manifest.icons.some(i => i.sizes?.includes('192') || i.sizes === 'any');
                        const has512 = manifest.icons.some(i => i.sizes?.includes('512') || i.sizes === 'any');
                        if (has192) console.log('  ✅ 包含 192x192 图标');
                        else console.log('  ⚠️  缺少 192x192 图标');
                        if (has512) console.log('  ✅ 包含 512x512 图标');
                        else console.log('  ⚠️  缺少 512x512 图标');
                    }
                } else {
                    console.log('  ❌ Manifest 返回错误:', response.status);
                    results.errors.push(`Manifest 返回 ${response.status}`);
                }
            } else {
                console.log('  ❌ 未找到 manifest 链接');
                results.errors.push('未找到 manifest 链接');
            }
        } catch (error) {
            console.log('  ❌ Manifest 检查失败:', error.message);
            results.errors.push(`Manifest 检查失败: ${error.message}`);
        }

        // 检查 Service Worker 状态
        console.log('%c4. Service Worker 状态', 'color: #60a5fa; font-weight: bold');
        if (results.serviceWorker) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    results.swRegistered = true;
                    console.log('  ✅ Service Worker 已注册');
                    console.log('     - Scope:', registration.scope);
                    console.log('     - State:', registration.active ? 'activated' : (registration.installing ? 'installing' : 'waiting'));
                    
                    if (registration.active) {
                        results.swActivated = true;
                        console.log('  ✅ Service Worker 已激活');
                    } else {
                        console.log('  ⏳ Service Worker 未激活');
                        results.errors.push('Service Worker 未激活，请刷新页面');
                    }
                } else {
                    console.log('  ❌ Service Worker 未注册');
                    results.errors.push('Service Worker 未注册');
                }
            } catch (error) {
                console.log('  ❌ 检查 Service Worker 失败:', error.message);
                results.errors.push(`检查 SW 失败: ${error.message}`);
            }
        }

        // 检查是否已安装
        console.log('%c5. 安装状态', 'color: #60a5fa; font-weight: bold');
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (isStandalone) {
            console.log('  ℹ️  应用已在独立模式下运行');
        } else {
            console.log('  ℹ️  应用尚未安装');
        }

        // 综合判断
        console.log('%c6. 安装条件检查', 'color: #60a5fa; font-weight: bold');
        const canInstall = (results.https || results.localhost) && 
                          results.manifest && 
                          results.swActivated;
        
        if (canInstall && !isStandalone) {
            results.installable = true;
            console.log('  ✅ 满足所有安装条件！');
            console.log('%c  提示: Chrome 地址栏右侧应该出现安装图标 (➕)', 'color: #10b981; font-weight: bold');
        } else {
            console.log('  ❌ 不满足安装条件');
            if (results.errors.length > 0) {
                console.log('%c  问题列表:', 'color: #ef4444');
                results.errors.forEach((err, i) => console.log(`    ${i+1}. ${err}`));
            }
        }

        // 显示解决方法
        if (results.errors.length > 0) {
            console.log('%c7. 解决方法', 'color: #fbbf24; font-weight: bold');
            console.log('  1. 确保使用 http://localhost:3010 访问');
            console.log('  2. 检查浏览器控制台是否有红色错误');
            console.log('  3. 尝试清除缓存并硬刷新 (Ctrl+Shift+R)');
            console.log('  4. 检查 Application 标签中的 Manifest 和 Service Workers');
        }

        console.log('%c=====================', 'color: #3b82f6; font-size: 16px; font-weight: bold');
        
        return results;
    };

    // 自动检查
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(window.checkPWA, 2000);
        });
    } else {
        setTimeout(window.checkPWA, 2000);
    }

    console.log('%c[PWA] 调试工具已加载，运行 checkPWA() 查看详细状态', 'color: #3b82f6');
})();
