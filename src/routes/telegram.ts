import { Hono } from 'hono';
import { TelegramWebhookService } from '../services/telegram/webhook';
import { TelegramPushService } from '../services/telegram/push';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers';
import type { ContextVariables } from '../types';

type Variables = ContextVariables;

export const telegramRoutes = new Hono<{ Variables: Variables }>();

// Telegram Webhook 处理
telegramRoutes.post('/webhook', async (c) => {
  try {
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    if (!config?.bot_token) {
      console.error('未配置 Telegram Bot Token');
      return c.json(createErrorResponse('未配置 Bot Token'), 400);
    }
    
    // 创建 Telegram 服务实例
    const telegramService = new TelegramWebhookService(dbService, config.bot_token);
    
    // 获取 webhook 处理器并处理请求
    const webhookHandler = telegramService.getWebhookCallback();
    return await webhookHandler(c.req.raw);
    
  } catch (error) {
    console.error('处理 Telegram webhook 失败:', error);
    return c.json(createErrorResponse(`处理 webhook 失败: ${error}`), 500);
  }
});

// 设置 Webhook URL
telegramRoutes.post('/set-webhook', async (c) => {
  try {
    const body = await c.req.json();
    const { webhookUrl } = body;
    
    if (!webhookUrl) {
      return c.json(createErrorResponse('请提供 webhook URL'), 400);
    }
    
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    if (!config?.bot_token) {
      return c.json(createErrorResponse('未配置 Bot Token'), 400);
    }
    
    const telegramService = new TelegramWebhookService(dbService, config.bot_token);
    const success = await telegramService.setWebhook(webhookUrl);
    
    if (success) {
      return c.json(createSuccessResponse(null, 'Webhook 设置成功'));
    } else {
      return c.json(createErrorResponse('Webhook 设置失败'), 500);
    }
  } catch (error) {
    return c.json(createErrorResponse(`设置 Webhook 失败: ${error}`), 500);
  }
});

// 获取 Bot 信息
telegramRoutes.get('/bot-info', async (c) => {
  try {
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    if (!config?.bot_token) {
      return c.json(createErrorResponse('未配置 Bot Token'), 400);
    }
    
    const telegramService = new TelegramWebhookService(dbService, config.bot_token);
    const botInfo = await telegramService.getBotInfo();
    
    if (botInfo) {
      return c.json(createSuccessResponse(botInfo));
    } else {
      return c.json(createErrorResponse('获取 Bot 信息失败'), 500);
    }
  } catch (error) {
    return c.json(createErrorResponse(`获取 Bot 信息失败: ${error}`), 500);
  }
});

// 发送测试消息
telegramRoutes.post('/test-message', async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;
    
    if (!message) {
      return c.json(createErrorResponse('请提供测试消息内容'), 400);
    }
    
    const dbService = c.get('dbService');
    const config = dbService.getBaseConfig();
    
    if (!config?.bot_token || !config?.chat_id) {
      return c.json(createErrorResponse('未配置 Bot Token 或 Chat ID'), 400);
    }
    
    const telegramService = new TelegramWebhookService(dbService, config.bot_token);
    const success = await telegramService.sendMessage(config.chat_id, message);
    
    if (success) {
      return c.json(createSuccessResponse(null, '测试消息发送成功'));
    } else {
      return c.json(createErrorResponse('测试消息发送失败'), 500);
    }
  } catch (error) {
    return c.json(createErrorResponse(`发送测试消息失败: ${error}`), 500);
  }
});