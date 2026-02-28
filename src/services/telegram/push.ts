import { TelegramBaseService } from './base';
import type { Post, KeywordSub } from '../../types';
import { logger } from '../../utils/logger';

export class TelegramPushService extends TelegramBaseService {
  /**
   * 发送消息到 Telegram
   */
  async sendMessage(chatId: string | number, text: string): Promise<boolean> {
    try {
      await this.bot.api.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      return true;
    } catch (error) {
      logger.error('发送 Telegram 消息时出错:', error);
      return false;
    }
  }

  /**
   * 推送文章到 Telegram
   */
  async pushPost(post: Post, matchedSub: KeywordSub): Promise<boolean> {
    try {
      const config = this.dbService.getBaseConfig();
      if (!config || config.stop_push === 1) {
        return false;
      }

      // 构建关键词字符串，用markdown格式的标签包裹
      const keywords = [matchedSub.keyword1, matchedSub.keyword2, matchedSub.keyword3]
        .filter(k => k && k.trim().length > 0)
        .join(' ');

      const keywordsStr = keywords ? `🎯 ${keywords}` : '';

      const creator = matchedSub.creator ? `👤 ${matchedSub.creator}` : '';
      const category = matchedSub.category ? `🗂️ ${this.getCategoryName(matchedSub.category)}` : '';

      // 构建帖子链接
      const postUrl = `https://www.nodeseek.com/post-${post.post_id}-1`;

      // 去除 post.title 会影响markdown链接的符号
      const title = post.title
        .replace(/\[/g, "「")
        .replace(/\]/g, "」")
        .replace(/\(/g, "（")
        .replace(/\)/g, "）");

      const text = `
**${keywordsStr} ${creator} ${category}**

**[${title}](${postUrl})**
      `;

      const success = await this.sendMessage(config.chat_id, text);

      if (success) {
        // 更新推送状态为 3（已匹配且已推送成功）
        this.dbService.updatePostPushStatus(
          post.post_id,
          3, // 已匹配且已推送成功
          matchedSub.id,
          new Date().toISOString()
        );
        return true;
      }

      return false;
    } catch (error) {
      logger.error('推送文章失败:', error);
      return false;
    }
  }

  /**
   * 测试发送消息（简化版，仅用于测试连通性）
   */
  async testSendMessage(chatId: string | number, message?: string): Promise<boolean> {
    const testMessage = message || '🧪 这是一条测试消息，表明 Bot 推送功能正常工作。';
    return await this.sendMessage(chatId, testMessage);
  }
}