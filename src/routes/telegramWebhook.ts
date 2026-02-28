import { Hono } from 'hono';
import { z } from 'zod';
import { TelegramWebhookService } from '../services/telegram/webhook';
import { createValidationMiddleware } from '../utils/validation';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers';
import type { ContextVariables } from '../types';
import { logger } from '../utils/logger';

type Variables = ContextVariables;

export const telegramWebhookRoutes = new Hono<{ Variables: Variables }>();

// 验证 schemas
const setupWebhookSchema = z.object({
  webhook_url: z.string().url('无效的 URL 格式').optional(),
  bot_token: z.string().min(1, 'Bot Token 不能为空').optional()
});

const testConnectionSchema = z.object({
  bot_token: z.string().min(1, 'Bot Token 不能为空').optional()
});

const manageBingingSchema = z.object({
  action: z.enum(['unbind']),
  force: z.boolean().optional()
});

const clearSettingsSchema = z.object({
  confirmText: z.string().min(1, '请提供确认文本'),
  clearBot: z.boolean().optional().default(true),
  clearBinding: z.boolean().optional().default(true),
  clearWebhook: z.boolean().optional().default(true)
});

// 获取 Webhook 状态
telegramWebhookRoutes.get('/status', async (c) => {
  try {
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    const status = {
      configured: !!config?.bot_token,
      connected: false,
      webhook_set: false,
      bot_info: null,
      bound: false,
      config: {
        has_chat_id: !!config?.chat_id,
        bound_user_name: config?.bound_user_name,
        bound_user_username: config?.bound_user_username,
        last_check_time: new Date().toISOString()
      }
    };
    
    if (config?.bot_token) {
      try {
        const telegramService = new TelegramWebhookService(dbService, config.bot_token);
        const botInfo = await telegramService.getBotInfo();
        
        if (botInfo) {
          status.connected = true;
          status.bot_info = botInfo;
          status.bound = !!config.chat_id;
          
          // 检查 webhook 是否实际设置
          try {
            const webhookInfo = await telegramService.bot.api.getWebhookInfo();
            status.webhook_set = !!(webhookInfo.url && webhookInfo.url.trim() !== '');
          } catch (webhookError) {
            logger.error('获取 Webhook 信息失败:', webhookError);
            status.webhook_set = false;
          }
        }
      } catch (error) {
        logger.error('检查 Webhook 状态失败:', error);
      }
    }
    
    return c.json(createSuccessResponse(status));
  } catch (error) {
    return c.json(createErrorResponse(`获取 Webhook 状态失败: ${error}`), 500);
  }
});

// 设置 Webhook
telegramWebhookRoutes.post('/setup', createValidationMiddleware(setupWebhookSchema), async (c) => {
  try {
    const { webhook_url, bot_token } = c.get('validatedData');
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    // 使用提供的 bot_token 或配置中的 bot_token
    const useBotToken = bot_token || config?.bot_token;
    if (!useBotToken) {
      return c.json(createErrorResponse('未提供 Bot Token'), 400);
    }
    
    const telegramService = new TelegramWebhookService(dbService, useBotToken);
    
    // 如果提供了新的 bot_token，先验证并保存
    if (bot_token && bot_token !== config?.bot_token) {
      const botInfo = await telegramService.getBotInfo();
      if (!botInfo) {
        return c.json(createErrorResponse('Bot Token 无效或无法连接到 Telegram'), 400);
      }
      
      // 保存新的 bot_token
      dbService.updateBaseConfig({ bot_token });
      
      // 设置 Bot 命令菜单
      await telegramService.setBotCommands();
    }
    
    // 设置 Webhook
    let finalWebhookUrl = '';
    if (webhook_url && webhook_url.trim()) {
      finalWebhookUrl = webhook_url.trim();
    } else {
      // 智能构建 Webhook URL
      const request = c.req;
      const url = new URL(request.url);
      finalWebhookUrl = `${url.protocol}//${url.host}/telegram/webhook`;
    }
    
    const webhookResult = await telegramService.setWebhook(finalWebhookUrl);
    
    if (webhookResult.success) {
      return c.json(createSuccessResponse({
        webhook_url: finalWebhookUrl,
        webhook_set: true
      }, 'Webhook 设置成功'));
    } else {
      return c.json(createErrorResponse('Webhook 设置失败', {
        error: webhookResult.error,
        suggestions: webhookResult.suggestions
      }), 400);
    }
  } catch (error) {
    return c.json(createErrorResponse(`设置 Webhook 失败: ${error}`), 500);
  }
});

// 测试 Bot 连接
telegramWebhookRoutes.post('/test-connection', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { bot_token } = body;
    
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    // 使用提供的 bot_token 或配置中的 bot_token
    const useBotToken = bot_token || config?.bot_token;
    if (!useBotToken) {
      return c.json(createErrorResponse('未提供 Bot Token'), 400);
    }
    
    const telegramService = new TelegramWebhookService(dbService, useBotToken);
    const botInfo = await telegramService.getBotInfo();
    
    if (botInfo) {
      return c.json(createSuccessResponse({
        connected: true,
        bot_info: {
          id: botInfo.id,
          username: botInfo.username,
          first_name: botInfo.first_name
        }
      }, 'Bot 连接测试成功'));
    } else {
      return c.json(createErrorResponse('Bot 连接测试失败'), 400);
    }
  } catch (error) {
    return c.json(createErrorResponse(`测试连接失败: ${error}`), 500);
  }
});

// 管理用户绑定
telegramWebhookRoutes.post('/manage-binding', createValidationMiddleware(manageBingingSchema), async (c) => {
  try {
    const { action, force } = c.get('validatedData');
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    if (!config) {
      return c.json(createErrorResponse('系统未初始化'), 400);
    }
    
    if (action === 'unbind') {
      // 检查是否有绑定的用户
      if (!config.chat_id && !force) {
        return c.json(createErrorResponse('当前没有绑定的用户'), 400);
      }
      
      // 解除绑定
      dbService.updateBaseConfig({
        chat_id: '',
        bound_user_name: undefined,
        bound_user_username: undefined
      });
      
      return c.json(createSuccessResponse({
        unbound: true,
        previous_user: {
          name: config.bound_user_name,
          username: config.bound_user_username,
          chat_id: config.chat_id
        }
      }, '用户绑定已解除'));
    }
    
    return c.json(createErrorResponse('不支持的操作'), 400);
  } catch (error) {
    return c.json(createErrorResponse(`管理绑定失败: ${error}`), 500);
  }
});

// 发送管理消息（用于管理员发送通知等）
telegramWebhookRoutes.post('/send-admin-message', async (c) => {
  try {
    const body = await c.req.json();
    const { message, chat_id } = body;
    
    if (!message) {
      return c.json(createErrorResponse('请提供消息内容'), 400);
    }
    
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    if (!config?.bot_token) {
      return c.json(createErrorResponse('未配置 Bot Token'), 400);
    }
    
    // 使用提供的 chat_id 或配置中的 chat_id
    const targetChatId = chat_id || config.chat_id;
    if (!targetChatId) {
      return c.json(createErrorResponse('未指定目标聊天'), 400);
    }
    
    const telegramService = new TelegramWebhookService(dbService, config.bot_token);
    const adminMessage = `🔧 **管理员消息**\n\n${message}\n\n⏰ ${new Date().toLocaleString('zh-CN')}`;
    
    const success = await telegramService.sendMessage(targetChatId, adminMessage);
    
    if (success) {
      return c.json(createSuccessResponse({ sent: true }, '管理员消息发送成功'));
    } else {
      return c.json(createErrorResponse('管理员消息发送失败'), 500);
    }
  } catch (error) {
    return c.json(createErrorResponse(`发送管理员消息失败: ${error}`), 500);
  }
});

// 清除 Webhook
telegramWebhookRoutes.post('/clear-webhook', async (c) => {
  try {
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    if (!config?.bot_token) {
      return c.json(createErrorResponse('未配置 Bot Token'), 400);
    }
    
    const telegramService = new TelegramWebhookService(dbService, config.bot_token);
    const result = await telegramService.clearWebhook();
    
    if (result.success) {
      return c.json(createSuccessResponse({
        webhook_cleared: true
      }, 'Webhook 清除成功'));
    } else {
      return c.json(createErrorResponse(`Webhook 清除失败: ${result.error}`), 500);
    }
  } catch (error) {
    return c.json(createErrorResponse(`清除 Webhook 失败: ${error}`), 500);
  }
});

// 清空所有 Bot 设置
telegramWebhookRoutes.post('/clear-settings', createValidationMiddleware(clearSettingsSchema), async (c) => {
  try {
    const { confirmText, clearBot, clearBinding, clearWebhook } = c.get('validatedData');
    
    // 验证确认文本
    if (confirmText !== 'CLEAR BOT SETTINGS') {
      return c.json(createErrorResponse('确认文本错误，请输入 "CLEAR BOT SETTINGS"'), 400);
    }
    
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    if (!config) {
      return c.json(createErrorResponse('系统未初始化'), 400);
    }
    
    const results = {
      bot_cleared: false,
      binding_cleared: false,
      webhook_cleared: false,
      errors: [] as string[]
    };
    
    // 清空 Webhook（如果有 Bot Token 的话）
    if (clearWebhook && config.bot_token) {
      try {
        const telegramService = new TelegramWebhookService(dbService, config.bot_token);
        const webhookResult = await telegramService.clearWebhook();
        if (webhookResult.success) {
          results.webhook_cleared = true;
        } else {
          results.errors.push(`Webhook 清空失败: ${webhookResult.error}`);
        }
      } catch (error) {
        results.errors.push(`Webhook 清空失败: ${error}`);
      }
    }
    
    // 构建需要清空的配置
    const updateData: any = {};
    
    // 清空 Bot Token 和相关设置
    if (clearBot) {
      updateData.bot_token = '';
      results.bot_cleared = true;
    }
    
    // 清空用户绑定
    if (clearBinding) {
      updateData.chat_id = '';
      updateData.bound_user_name = undefined;
      updateData.bound_user_username = undefined;
      results.binding_cleared = true;
    }
    
    // 执行配置更新
    if (Object.keys(updateData).length > 0) {
      dbService.updateBaseConfig(updateData);
    }
    
    const successCount = [results.bot_cleared, results.binding_cleared, results.webhook_cleared].filter(Boolean).length;
    const totalCount = [clearBot, clearBinding, clearWebhook].filter(Boolean).length;
    
    return c.json(createSuccessResponse({
      cleared: results,
      summary: `成功清空 ${successCount}/${totalCount} 项设置`,
      details: {
        bot_token_cleared: results.bot_cleared,
        user_binding_cleared: results.binding_cleared,
        webhook_cleared: results.webhook_cleared,
        has_errors: results.errors.length > 0,
        errors: results.errors
      }
    }, `Bot 设置清空完成`));
    
  } catch (error) {
    return c.json(createErrorResponse(`清空设置失败: ${error}`), 500);
  }
});