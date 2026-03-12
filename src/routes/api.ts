import { Hono } from 'hono';
import { z } from 'zod';
import { DatabaseService } from '../services/database';
import { AuthService } from '../services/auth';
import { RSSService } from '../services/rss';
import { TelegramWebhookService } from '../services/telegram/webhook';
import { TelegramPushService } from '../services/telegram/push';
import { MatcherService } from '../services/matcher';
import { createValidationMiddleware, createQueryValidationMiddleware, createParamValidationMiddleware } from '../utils/validation';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers';
import {
    baseConfigUpdateSchema,
    botTokenSchema,
    keywordSubSchema,
    keywordSubUpdateSchema,
    paginationSchema,
    idParamSchema
} from '../utils/validation';
import type { ContextVariables } from '../types';
import { getEnvConfig } from '../config/env';
import { logger } from '../utils/logger';

/**
 * 智能构建 Webhook URL，考虑 CDN 代理情况
 */
function buildWebhookUrl(c: any): string {
    const envConfig = getEnvConfig();
    
    // 优先使用环境变量配置的 Webhook URL
    if (envConfig.TELEGRAM_WEBHOOK_URL) {
        logger.debug('使用环境变量配置的 Webhook URL:', envConfig.TELEGRAM_WEBHOOK_URL);
        return envConfig.TELEGRAM_WEBHOOK_URL;
    }
    
    // 获取各种可能的协议指示器
    const proto = c.req.header('x-forwarded-proto') || 
                  c.req.header('cf-visitor') || 
                  c.req.header('x-forwarded-ssl');
    
    // Cloudflare 特殊处理
    const cfVisitor = c.req.header('cf-visitor');
    let isHttps = false;
    
    if (cfVisitor) {
        try {
            const visitor = JSON.parse(cfVisitor);
            isHttps = visitor.scheme === 'https';
        } catch (e) {
            // 如果解析失败，使用其他方法
            logger.warn('解析 cf-visitor 头失败:', e);
        }
    }
    
    // 多种HTTPS检测方式
    if (!isHttps) {
        isHttps = proto === 'https' ||
                  c.req.header('x-forwarded-ssl') === 'on' ||
                  c.req.header('x-forwarded-port') === '443' ||
                  c.req.url.startsWith('https://');
    }
    
    // 获取主机名
    const host = c.req.header('x-forwarded-host') || 
                 c.req.header('host') || 
                 new URL(c.req.url).host;
    
    // 构建完整URL
    const protocol = isHttps ? 'https' : 'http';
    const webhookUrl = `${protocol}://${host}/telegram/webhook`;
    
    logger.debug('URL构建详情:', {
        'cf-visitor': cfVisitor,
        'x-forwarded-proto': c.req.header('x-forwarded-proto'),
        'x-forwarded-ssl': c.req.header('x-forwarded-ssl'),
        'x-forwarded-port': c.req.header('x-forwarded-port'),
        'x-forwarded-host': c.req.header('x-forwarded-host'),
        'host': host,
        'detected-https': isHttps,
        'final-url': webhookUrl
    });
    
    return webhookUrl;
}

type Variables = ContextVariables & {
    authService: AuthService;
    jwtPayload: any;
}

export const apiRoutes = new Hono<{ Variables: Variables }>();

// 公开路由（无需认证）
apiRoutes.get('/posts', createQueryValidationMiddleware(paginationSchema), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const dbService = c.get('dbService');

        // 解析 pushStatusIn 参数（格式: "1,3"）
        let pushStatusIn: number[] | undefined;
        if (query.pushStatusIn) {
            pushStatusIn = query.pushStatusIn.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n));
        }

        const result = dbService.getPostsWithPagination(
            query.page,
            query.limit,
            {
                pushStatus: query.pushStatus,
                pushStatusIn,
                pushStatusNot: query.pushStatusNot,
                creator: query.creator,
                category: query.category,
                search: query.search,
                subId: query.subId
            }
        );

        return c.json(createSuccessResponse(result));
    } catch (error) {
        return c.json(createErrorResponse(`获取文章列表失败: ${error}`), 500);
    }
});

// 获取图表统计数据（公开接口，无需认证）
apiRoutes.get('/stats/charts', async (c) => {
    try {
        const daysStr = c.req.query('days');
        const days = daysStr !== undefined ? parseInt(daysStr, 10) : 7;
        const validDays = isNaN(days) ? 7 : Math.max(-1, Math.min(365, days));

        const dbService = c.get('dbService');
        const last24hStats = dbService.getLast24HoursPostStats();
        const categoryStats = dbService.getCategoryDistribution(validDays);

        return c.json(createSuccessResponse({ hourly: last24hStats, category: categoryStats }));
    } catch (error) {
        return c.json(createErrorResponse(`获取图表数据失败: ${error}`), 500);
    }
});

// Session 中间件
const sessionMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json(createErrorResponse('请提供有效的认证token'), 401);
    }

    const sessionId = authHeader.substring(7);
    const authService = c.get('authService');

    // 获取客户端IP地址用于验证
    const ipAddress = c.req.header('x-forwarded-for') ||
                     c.req.header('x-real-ip') ||
                     c.env?.CF_CONNECTING_IP ||
                     '127.0.0.1';

    const verification = await authService.verifySession(sessionId, ipAddress);
    if (!verification.valid) {
        return c.json(createErrorResponse(verification.message || 'Session无效'), 401);
    }

    // 设置session数据和向后兼容的payload
    c.set('sessionData', verification.sessionData);
    c.set('jwtPayload', verification.payload);
    await next();
};

// 应用Session中间件到所有后续API路由
apiRoutes.use('*', sessionMiddleware);

// 获取基础配置
apiRoutes.get('/config', async (c) => {
    try {
        const dbService = c.get('dbService');
        const config = dbService.getBaseConfig();

        if (!config) {
            return c.json(createErrorResponse('配置不存在'), 404);
        }

        // 不返回密码
        const { password, ...safeConfig } = config;

        return c.json(createSuccessResponse(safeConfig));
    } catch (error) {
        return c.json(createErrorResponse(`获取配置失败: ${error}`), 500);
    }
});

// 更新基础配置
apiRoutes.put('/config', createValidationMiddleware(baseConfigUpdateSchema), async (c) => {
    try {
        const validatedData = c.get('validatedData');
        const dbService = c.get('dbService');

        const config = dbService.updateBaseConfig(validatedData);

        if (!config) {
            return c.json(createErrorResponse('更新配置失败'), 500);
        }

        // 不返回密码
        const { password, ...safeConfig } = config;

        return c.json(createSuccessResponse(safeConfig, '配置更新成功'));
    } catch (error) {
        return c.json(createErrorResponse(`更新配置失败: ${error}`), 500);
    }
});

// 设置 Bot Token
apiRoutes.post('/bot-token', createValidationMiddleware(botTokenSchema), async (c) => {
    try {
        const { bot_token, webhook_url } = c.get('validatedData');
        const dbService = c.get('dbService');

        // 创建 Telegram 服务实例来验证 token
        const telegramService = new TelegramWebhookService(dbService, bot_token);

        // 验证 Bot Token
        const botInfo = await telegramService.getBotInfo();
        if (!botInfo) {
            return c.json(createErrorResponse('Bot Token 无效或无法连接到 Telegram'), 400);
        }

        // 设置 Bot 命令菜单
        await telegramService.setBotCommands();

        // 设置 Webhook
        let webhookResult = { success: true, error: '', suggestions: [] };
        let finalWebhookUrl = '';
        
        try {
            if (webhook_url && webhook_url.trim()) {
                // 使用用户提供的 webhook URL
                finalWebhookUrl = webhook_url.trim();
                logger.debug('使用用户提供的 Webhook URL:', finalWebhookUrl);
            } else {
                // 智能构建 Webhook URL
                finalWebhookUrl = buildWebhookUrl(c);
                logger.debug('自动构建的 Webhook URL:', finalWebhookUrl);
            }
            
            webhookResult = await telegramService.setWebhook(finalWebhookUrl);
            
            if (!webhookResult.success) {
                logger.error('Webhook 设置失败:', webhookResult.error);
            }
        } catch (error) {
            logger.error('Webhook 设置异常:', error);
            webhookResult = { 
                success: false, 
                error: `Webhook 设置异常: ${error}`,
                suggestions: ['检查网络连接和服务器状态', '尝试稍后重试']
            };
        }

        // 更新配置
        const config = dbService.updateBaseConfig({ bot_token });

        if (!config) {
            return c.json(createErrorResponse('保存 Bot Token 失败'), 500);
        }

        // 构建响应消息
        let message = 'Bot Token 设置成功，命令菜单已更新';
        if (webhookResult.success) {
            message += '，Webhook 已设置';
        } else {
            message += '，但 Webhook 设置失败';
        }

        return c.json(createSuccessResponse({
            bot_info: botInfo,
            webhook_url: finalWebhookUrl || null,
            webhook_set: webhookResult.success,
            webhook_error: webhookResult.error,
            webhook_suggestions: webhookResult.suggestions,
            message: message
        }));
    } catch (error) {
        return c.json(createErrorResponse(`设置 Bot Token 失败: ${error}`), 500);
    }
});

// 获取订阅列表
apiRoutes.get('/subscriptions', createQueryValidationMiddleware(paginationSchema), async (c) => {
    try {
        const dbService = c.get('dbService');
        const subscriptions = dbService.getAllKeywordSubs();

        return c.json(createSuccessResponse(subscriptions));
    } catch (error) {
        return c.json(createErrorResponse(`获取订阅列表失败: ${error}`), 500);
    }
});

// 添加订阅
apiRoutes.post('/subscriptions', createValidationMiddleware(keywordSubSchema), async (c) => {
    try {
        const validatedData = c.get('validatedData');
        const dbService = c.get('dbService');

        const subscription = dbService.createKeywordSub(validatedData);

        return c.json(createSuccessResponse(subscription, '订阅添加成功'), 201);
    } catch (error) {
        return c.json(createErrorResponse(`添加订阅失败: ${error}`), 500);
    }
});

// 更新订阅
apiRoutes.put('/subscriptions/:id',
    createParamValidationMiddleware(idParamSchema),
    createValidationMiddleware(keywordSubUpdateSchema),
    async (c) => {
        try {
            const { id } = c.get('validatedParams');
            const validatedData = c.get('validatedData');
            const dbService = c.get('dbService');

            const subscription = dbService.updateKeywordSub(id, validatedData);

            if (!subscription) {
                return c.json(createErrorResponse('订阅不存在'), 404);
            }

            return c.json(createSuccessResponse(subscription, '订阅更新成功'));
        } catch (error) {
            return c.json(createErrorResponse(`更新订阅失败: ${error}`), 500);
        }
    }
);

// 删除订阅
apiRoutes.delete('/subscriptions/:id', createParamValidationMiddleware(idParamSchema), async (c) => {
    try {
        const { id } = c.get('validatedParams');
        const dbService = c.get('dbService');

        const success = dbService.deleteKeywordSub(id);

        if (!success) {
            return c.json(createErrorResponse('订阅不存在'), 404);
        }

        return c.json(createSuccessResponse(null, '订阅删除成功'));
    } catch (error) {
        return c.json(createErrorResponse(`删除订阅失败: ${error}`), 500);
    }
});

// 手动抓取 RSS
apiRoutes.post('/rss/fetch', async (c) => {
    try {
        const dbService = c.get('dbService');
        const rssService = new RSSService(dbService);

        const result = await rssService.manualUpdate();

        if (result.success) {
            return c.json(createSuccessResponse(result.data, result.message));
        } else {
            return c.json(createErrorResponse(result.message), 500);
        }
    } catch (error) {
        return c.json(createErrorResponse(`RSS 抓取失败: ${error}`), 500);
    }
});

// 手动推送文章
apiRoutes.post('/posts/:postId/push/:subId',
    createParamValidationMiddleware(z.object({
        postId: z.coerce.number().int().positive(),
        subId: z.coerce.number().int().positive()
    })),
    async (c) => {
        try {
            const { postId, subId } = c.get('validatedParams');
            const dbService = c.get('dbService');
            const config = dbService.getBaseConfig();

            if (!config?.bot_token) {
                return c.json(createErrorResponse('未配置 Telegram Bot Token'), 400);
            }

            const telegramService = new TelegramPushService(dbService, config.bot_token);
            const matcherService = new MatcherService(dbService, telegramService);

            const result = await matcherService.manualPushPost(postId, subId);

            if (result.success) {
                return c.json(createSuccessResponse(null, result.message));
            } else {
                return c.json(createErrorResponse(result.message), 400);
            }
        } catch (error) {
            return c.json(createErrorResponse(`手动推送失败: ${error}`), 500);
        }
    }
);

// 获取统计信息
apiRoutes.get('/stats', async (c) => {
    try {
        const dbService = c.get('dbService');
        const stats = dbService.getComprehensiveStats();

        return c.json(createSuccessResponse(stats));
    } catch (error) {
        return c.json(createErrorResponse(`获取统计信息失败: ${error}`), 500);
    }
});


// 验证 RSS 源
apiRoutes.get('/rss/validate', async (c) => {
    try {
        const dbService = c.get('dbService');
        const rssService = new RSSService(dbService);

        const result = await rssService.validateRSSSource();

        return c.json(createSuccessResponse(result));
    } catch (error) {
        return c.json(createErrorResponse(`验证 RSS 源失败: ${error}`), 500);
    }
});

// 获取匹配统计
apiRoutes.get('/match-stats', async (c) => {
    try {
        const dbService = c.get('dbService');
        const config = dbService.getBaseConfig();

        if (!config?.bot_token) {
            return c.json(createErrorResponse('未配置 Telegram Bot Token'), 400);
        }

        const telegramService = new TelegramPushService(dbService, config.bot_token);
        const matcherService = new MatcherService(dbService, telegramService);

        const stats = matcherService.getMatchStats();

        return c.json(createSuccessResponse(stats));
    } catch (error) {
        return c.json(createErrorResponse(`获取匹配统计失败: ${error}`), 500);
    }
});

// 获取 Telegram Bot 状态
apiRoutes.get('/telegram/status', async (c) => {
    try {
        const dbService = c.get('dbService');
        const config = dbService.getBaseConfig();

        const statusData = {
            configured: !!config?.bot_token,
            connected: false,
            bound: !!config?.chat_id,
            bot_info: null,
            config: {
                has_bot_token: !!config?.bot_token,
                has_chat_id: !!config?.chat_id,
                bound_user_name: config?.bound_user_name || null,
                bound_user_username: config?.bound_user_username || null,
                stop_push: config?.stop_push === 1,
                last_check_time: new Date().toISOString()
            }
        };

        if (!config?.bot_token) {
            return c.json(createSuccessResponse(statusData, 'Bot Token 未配置'));
        }

        try {
            const telegramService = new TelegramWebhookService(dbService, config.bot_token);
            const botInfo = await telegramService.getBotInfo();
            
            if (botInfo) {
                statusData.connected = true;
                // 这里需要类型断言，确保类型兼容
                statusData.bot_info = botInfo as any;
                return c.json(createSuccessResponse(statusData, 'Bot 状态正常'));
            } else {
                return c.json(createSuccessResponse(statusData, 'Bot Token 无效或连接失败'));
            }
        } catch (error) {
            return c.json(createSuccessResponse(statusData, `Bot 连接失败: ${error}`));
        }
    } catch (error) {
        return c.json(createErrorResponse(`获取 Bot 状态失败: ${error}`), 500);
    }
});

// 测试 Telegram 连接
apiRoutes.post('/telegram/test', async (c) => {
    try {
        const dbService = c.get('dbService');
        const config = dbService.getBaseConfig();

        if (!config?.bot_token) {
            return c.json(createErrorResponse('Bot Token 未配置'), 400);
        }

        const telegramService = new TelegramWebhookService(dbService, config.bot_token);
        
        // 获取 Bot 信息
        const botInfo = await telegramService.getBotInfo();
        if (!botInfo) {
            return c.json(createErrorResponse('Bot 连接失败，Token 可能无效'), 400);
        }

        // 如果有绑定的 chat_id，发送测试消息
        if (config.chat_id) {
            const testMessage = `🤖 **NodeSeek RSS Bot 测试消息**\n\n⏰ **时间:** ${new Date().toLocaleString('zh-CN')}\n✅ Bot 连接正常`;
            const sendResult = await telegramService.sendMessage(config.chat_id, testMessage);
            
            return c.json(createSuccessResponse({
                bot_info: botInfo,
                message_sent: sendResult
            }, sendResult ? 'Telegram 连接测试成功，消息已发送' : 'Bot 连接正常，但消息发送失败'));
        } else {
            return c.json(createSuccessResponse({
                bot_info: botInfo,
                message_sent: false
            }, 'Bot 连接正常，但未绑定用户'));
        }
    } catch (error) {
        return c.json(createErrorResponse(`测试连接失败: ${error}`), 500);
    }
});

// 解除用户绑定
apiRoutes.post('/telegram/unbind', async (c) => {
    try {
        const dbService = c.get('dbService');
        
        const config = dbService.updateBaseConfig({
            chat_id: '',
            bound_user_name: undefined,
            bound_user_username: undefined
        });

        if (!config) {
            return c.json(createErrorResponse('解除绑定失败'), 500);
        }

        return c.json(createSuccessResponse(null, '用户绑定已解除'));
    } catch (error) {
        return c.json(createErrorResponse(`解除绑定失败: ${error}`), 500);
    }
});

// 发送测试消息
apiRoutes.post('/telegram/send-test', createValidationMiddleware(z.object({
    message: z.string().optional()
})), async (c) => {
    try {
        const { message } = c.get('validatedData');
        const dbService = c.get('dbService');
        const config = dbService.getBaseConfig();

        if (!config?.bot_token) {
            return c.json(createErrorResponse('Bot Token 未配置'), 400);
        }

        if (!config.chat_id) {
            return c.json(createErrorResponse('用户未绑定'), 400);
        }

        const telegramService = new TelegramPushService(dbService, config.bot_token);
        
        const testMessage = message || `🧪 **测试消息**\n\n⏰ **时间:** ${new Date().toLocaleString('zh-CN')}`;
        const result = await telegramService.sendMessage(config.chat_id, testMessage);

        if (result) {
            return c.json(createSuccessResponse(null, '测试消息发送成功'));
        } else {
            return c.json(createErrorResponse('消息发送失败'), 400);
        }
    } catch (error) {
        return c.json(createErrorResponse(`发送测试消息失败: ${error}`), 500);
    }
});

// ==================== RSS 配置接口 ====================

// 获取 RSS 配置
apiRoutes.get('/rss/config', async (c) => {
    try {
        const dbService = c.get('dbService');
        const config = dbService.getBaseConfig();

        if (!config) {
            return c.json(createErrorResponse('配置不存在'), 404);
        }

        return c.json(createSuccessResponse({
            rss_url: config.rss_url || 'https://rss.nodeseek.com/',
            rss_interval_seconds: config.rss_interval_seconds || 60,
            rss_proxy: config.rss_proxy || '',
        }));
    } catch (error) {
        return c.json(createErrorResponse(`获取 RSS 配置失败: ${error}`), 500);
    }
});

// 更新 RSS 配置
apiRoutes.put('/rss/config', createValidationMiddleware(z.object({
    rss_url: z.string().url().optional(),
    rss_interval_seconds: z.number().int().min(10).max(3600).optional(),
    rss_proxy: z.string().optional(),
})), async (c) => {
    try {
        const validatedData = c.get('validatedData');
        const dbService = c.get('dbService');

        // 更新数据库配置
        const config = dbService.updateBaseConfig(validatedData);

        if (!config) {
            return c.json(createErrorResponse('更新 RSS 配置失败'), 500);
        }

        return c.json(createSuccessResponse({
            rss_url: config.rss_url,
            rss_interval_seconds: config.rss_interval_seconds,
            rss_proxy: config.rss_proxy,
        }, 'RSS 配置更新成功'));
    } catch (error) {
        return c.json(createErrorResponse(`更新 RSS 配置失败: ${error}`), 500);
    }
});

// 重启 RSS 任务（在配置更新后调用）
apiRoutes.post('/rss/restart', async (c) => {
    try {
        const { schedulerService } = await import('../server');
        if (schedulerService) {
            schedulerService.restartRSSTask();
            return c.json(createSuccessResponse(null, 'RSS 任务已重启'));
        } else {
            return c.json(createErrorResponse('调度服务未启动'), 500);
        }
    } catch (error) {
        return c.json(createErrorResponse(`重启 RSS 任务失败: ${error}`), 500);
    }
});

// 测试 RSS 连接
apiRoutes.post('/rss/test-connection', createValidationMiddleware(z.object({
    rss_url: z.string().url().optional(),
})), async (c) => {
    try {
        const { rss_url } = c.get('validatedData');
        const dbService = c.get('dbService');
        const rssService = new RSSService(dbService);

        // 如果传入了 url 则测试指定 url，否则测试当前配置
        const testUrl = rss_url;
        const result = testUrl 
            ? await rssService.validateRSSUrl(testUrl)
            : await rssService.validateRSSSource();

        return c.json(createSuccessResponse(result, result.accessible ? 'RSS 源连接测试成功' : 'RSS 源连接测试失败'));
    } catch (error) {
        return c.json(createErrorResponse(`RSS 连接测试失败: ${error}`), 500);
    }
});