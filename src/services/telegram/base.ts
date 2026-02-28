import { Bot } from 'grammy';
import { DatabaseService } from '../database';
import { logger } from '../../utils/logger';

export abstract class TelegramBaseService {
  protected bot: Bot;
  protected initialized: boolean = false;

  constructor(
    protected dbService: DatabaseService,
    protected botToken: string
  ) {
    this.bot = new Bot(botToken);
  }

  /**
   * 基础初始化 Bot
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      const botInfo = await this.bot.api.getMe();
      if (botInfo) {
        this.bot.botInfo = botInfo;
        this.initialized = true;
        logger.telegram(`Bot 初始化成功: ${botInfo.username} (${botInfo.id})`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Bot 初始化失败:', error);
      return false;
    }
  }

  /**
   * 获取分类对应的图标
   */
  protected getCategoryIcon(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'daily': '📅',
      'tech': '💻',
      'info': 'ℹ️',
      'review': '⭐',
      'trade': '💰',
      'carpool': '🚗',
      'promotion': '📢',
      'life': '🏠',
      'dev': '⚡',
      'photo': '📷',
      'expose': '🚨',
      'sandbox': '🏖️'
    };
    return categoryMap[category] || '📂';
  }

  /**
   * 获取分类名称
   */
  protected getCategoryName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'daily': '日常',
      'tech': '技术',
      'info': '情报',
      'review': '测评',
      'trade': '交易',
      'carpool': '拼车',
      'promotion': '推广',
      'life': '生活',
      'dev': 'Dev',
      'photo': '贴图',
      'expose': '曝光',
      'sandbox': '沙盒'
    };
    return categoryMap[category] || category;
  }

  /**
   * 获取 Bot 信息
   */
  async getBotInfo() {
    try {
      const botInfo = await this.bot.api.getMe();
      // 同时进行初始化，设置 botInfo 到实例中
      if (botInfo && !this.initialized) {
        this.bot.botInfo = botInfo;
        this.initialized = true;
        logger.telegram(`Bot 初始化成功: ${botInfo.username} (${botInfo.id})`);
      }
      return botInfo;
    } catch (error) {
      logger.error('获取 Bot 信息失败:', error);
      return null;
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}