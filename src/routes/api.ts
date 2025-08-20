import { Hono } from 'hono';
import { z } from 'zod';
import { DatabaseService } from '../services/database';
import { AuthService } from '../services/auth';
import { RSSService } from '../services/rss';
import { TelegramService } from '../services/telegram';
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

type Variables = ContextVariables & {
    authService: AuthService;
    jwtPayload: any;
}

export const apiRoutes = new Hono<{ Variables: Variables }>();

// JWT 中间件
const jwtMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json(createErrorResponse('请提供有效的认证token'), 401);
    }

    const token = authHeader.substring(7);
    const authService = c.get('authService');

    const verification = await authService.verifyToken(token);
    if (!verification.valid) {
        return c.json(createErrorResponse(verification.message || 'Token无效'), 401);
    }

    c.set('jwtPayload', verification.payload);
    await next();
};

// 应用JWT中间件到所有API路由
apiRoutes.use('*', jwtMiddleware);

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
        const { bot_token } = c.get('validatedData');
        const dbService = c.get('dbService');

        // 创建 Telegram 服务实例来验证 token
        const telegramService = new TelegramService(dbService, bot_token);

        // 验证 Bot Token
        const botInfo = await telegramService.getBotInfo();
        if (!botInfo) {
            return c.json(createErrorResponse('Bot Token 无效或无法连接到 Telegram'), 400);
        }

        // 设置 Bot 命令菜单
        await telegramService.setBotCommands();

        // 更新配置
        const config = dbService.updateBaseConfig({ bot_token });

        if (!config) {
            return c.json(createErrorResponse('保存 Bot Token 失败'), 500);
        }

        return c.json(createSuccessResponse({
            bot_info: botInfo,
            message: 'Bot Token 设置成功，命令菜单已更新'
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

// 获取文章列表
apiRoutes.get('/posts', createQueryValidationMiddleware(paginationSchema), async (c) => {
    try {
        const query = c.get('validatedQuery');
        const dbService = c.get('dbService');

        const result = dbService.getPostsWithPagination(
            query.page,
            query.limit,
            {
                pushStatus: query.pushStatus,
                creator: query.creator,
                category: query.category
            }
        );

        return c.json(createSuccessResponse(result));
    } catch (error) {
        return c.json(createErrorResponse(`获取文章列表失败: ${error}`), 500);
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

            const telegramService = new TelegramService(dbService, config.bot_token);
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

// 数据清理
apiRoutes.post('/cleanup', async (c) => {
    try {
        const dbService = c.get('dbService');
        const result = dbService.cleanupOldPosts();

        return c.json(createSuccessResponse(result, `清理完成，删除了 ${result.deletedCount} 条记录`));
    } catch (error) {
        return c.json(createErrorResponse(`数据清理失败: ${error}`), 500);
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

        const telegramService = new TelegramService(dbService, config.bot_token);
        const matcherService = new MatcherService(dbService, telegramService);

        const stats = matcherService.getMatchStats();

        return c.json(createSuccessResponse(stats));
    } catch (error) {
        return c.json(createErrorResponse(`获取匹配统计失败: ${error}`), 500);
    }
});