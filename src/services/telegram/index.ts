// Telegram 服务模块导出
export { TelegramBaseService } from './base';
export { TelegramPushService } from './push';
export { TelegramWebhookService } from './webhook';

// 为了保持向后兼容，重新导出原有的完整服务
export { TelegramService } from '../telegram';