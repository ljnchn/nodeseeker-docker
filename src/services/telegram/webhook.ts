import { Context } from 'grammy';
import { TelegramBaseService } from './base';
import type { Post } from '../../types';
import { logger } from '../../utils/logger';

export class TelegramWebhookService extends TelegramBaseService {
  private isPolling: boolean = false;


  /**
   * 发送消息到 Telegram（基础版本，用于测试连接等）
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
   * 初始化并设置命令处理器
   */
  async initializeWithHandlers(): Promise<boolean> {
    const initResult = await this.initialize();
    if (initResult) {
      this.setupHandlers();
    }
    return initResult;
  }

  /**
   * 验证用户权限
   */
  private checkUserPermission(ctx: Context): boolean {
    const config = this.dbService.getBaseConfig();
    if (!config) {
      return false;
    }

    const currentChatId = ctx.chat?.id?.toString();
    // 检查是否是绑定的聊天
    return !!(config.chat_id && config.chat_id === currentChatId);
  }

  /**
   * 设置命令处理器
   */
  private setupHandlers(): void {
    // 处理 /start 命令（特殊处理，不需要权限验证）
    this.bot.command('start', async (ctx) => {
      await this.handleStartCommand(ctx);
    });

    // 处理 /stop 命令
    this.bot.command('stop', async (ctx) => {
      if (!this.checkUserPermission(ctx)) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleStopCommand(ctx);
    });

    // 处理 /resume 命令
    this.bot.command('resume', async (ctx) => {
      if (!this.checkUserPermission(ctx)) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleResumeCommand(ctx);
    });

    // 处理 /list 命令
    this.bot.command('list', async (ctx) => {
      if (!this.checkUserPermission(ctx)) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleListCommand(ctx);
    });

    // 处理 /add 命令
    this.bot.command('add', async (ctx) => {
      if (!this.checkUserPermission(ctx)) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleAddCommand(ctx);
    });

    // 处理 /del 命令
    this.bot.command('del', async (ctx) => {
      if (!this.checkUserPermission(ctx)) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleDeleteCommand(ctx);
    });

    // 处理 /post 命令
    this.bot.command('post', async (ctx) => {
      if (!this.checkUserPermission(ctx)) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handlePostCommand(ctx);
    });

    // 处理 /help 命令（允许所有人查看）
    this.bot.command('help', async (ctx) => {
      await this.handleHelpCommand(ctx);
    });

    // 处理 /getme 命令（允许所有人查看）
    this.bot.command('getme', async (ctx) => {
      await this.handleGetMeCommand(ctx);
    });

    // 处理 /unbind 命令
    this.bot.command('unbind', async (ctx) => {
      if (!this.checkUserPermission(ctx)) {
        await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。');
        return;
      }
      await this.handleUnbindCommand(ctx);
    });

    // 处理其他消息
    this.bot.on('message:text', async (ctx) => {
      if (!ctx.message.text.startsWith('/')) {
        if (!this.checkUserPermission(ctx)) {
          await ctx.reply('❌ 您没有权限使用此功能。请先发送 /start 进行绑定。\n\n发送 /help 查看可用命令。');
          return;
        }
        await ctx.reply('请使用命令与我交互。发送 /help 查看可用命令。');
      }
    });
  }

  /**
   * 获取 webhook 回调（适配 Bun 环境）
   */
  getWebhookCallback() {
    return async (request: Request) => {
      try {
        // 确保 Bot 已初始化
        if (!this.initialized) {
          const initResult = await this.initializeWithHandlers();
          if (!initResult) {
            logger.error('Bot 初始化失败，无法处理 webhook');
            return new Response('Bot initialization failed', { status: 500 });
          }
        }

        const body = await request.json() as any;
        await this.bot.handleUpdate(body);
        return new Response('OK');
      } catch (error) {
        logger.error('处理 Telegram webhook 失败:', error);
        return new Response('Error', { status: 500 });
      }
    };
  }

  /**
   * 清空 Webhook 设置
   */
  async clearWebhook(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      logger.telegram('正在清空 Webhook 设置...');
      await this.bot.api.deleteWebhook();
      logger.telegram('Webhook 清空成功');
      return { success: true };
    } catch (error: any) {
      logger.error('清空 Webhook 失败:', error);
      
      let errorMessage = 'Webhook 清空失败';
      if (error && error.description) {
        errorMessage = error.description;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 启动 Long Polling 模式
   * 注意：Polling 和 Webhook 互斥，启动 Polling 前会自动清除 Webhook
   */
  async startPolling(): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (this.isPolling) {
      return { success: true };
    }

    try {
      // 确保 Bot 已初始化并注册命令处理器
      const initResult = await this.initializeWithHandlers();
      if (!initResult) {
        return { success: false, error: 'Bot 初始化失败' };
      }

      // 清除已有的 Webhook（Polling 和 Webhook 互斥）
      await this.bot.api.deleteWebhook();
      logger.telegram('已清除 Webhook，准备启动 Polling...');

      // 启动 Long Polling
      this.bot.start({
        onStart: () => {
          logger.telegram('Long Polling 已启动');
        },
      });

      this.isPolling = true;
      return { success: true };
    } catch (error: any) {
      logger.error('启动 Polling 失败:', error);
      this.isPolling = false;

      let errorMessage = 'Polling 启动失败';
      if (error && error.description) {
        errorMessage = error.description;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * 停止 Long Polling
   */
  async stopPolling(): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.isPolling) {
      return { success: true };
    }

    try {
      await this.bot.stop();
      this.isPolling = false;
      logger.telegram('Long Polling 已停止');
      return { success: true };
    } catch (error: any) {
      logger.error('停止 Polling 失败:', error);

      let errorMessage = 'Polling 停止失败';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * 获取 Polling 状态
   */
  getPollingStatus(): boolean {
    return this.isPolling;
  }

  /**
   * 获取 Webhook 信息（公开方法）
   */
  async getWebhookInfo() {
    try {
      return await this.bot.api.getWebhookInfo();
    } catch (error) {
      logger.error('获取 Webhook 信息失败:', error);
      return null;
    }
  }

  /**
   * 设置 Webhook
   */
  async setWebhook(webhookUrl: string): Promise<{
    success: boolean;
    error?: string;
    errorCode?: number;
    suggestions?: string[];
  }> {
    try {
      logger.telegram('正在设置 Webhook: ' + webhookUrl);
      await this.bot.api.setWebhook(webhookUrl);
      logger.telegram('Webhook 设置成功: ' + webhookUrl);
      return { success: true };
    } catch (error: any) {
      logger.error('设置 Webhook 失败:', error);
      logger.error('Webhook URL:', webhookUrl);

      // 解析 Grammy 错误
      let errorMessage = 'Webhook 设置失败';
      let errorCode = 0;
      let suggestions: string[] = [];

      if (error && error.error_code && error.description) {
        errorCode = error.error_code;
        errorMessage = error.description;

        // 根据不同错误类型提供建议
        if (error.description.includes('Failed to resolve host')) {
          suggestions = [
            '域名无法解析，请检查：',
            '1. 域名DNS记录是否正确配置',
            '2. 域名是否已完成DNS传播（可能需要等待几分钟到几小时）',
            '3. 尝试使用 dig 或 nslookup 命令验证DNS解析',
            '4. 确认域名拼写正确且可以从外网访问'
          ];
        } else if (error.description.includes('SSL')) {
          suggestions = [
            'SSL证书问题，请检查：',
            '1. 确保使用HTTPS协议',
            '2. SSL证书是否有效且未过期',
            '3. 证书链是否完整',
            '4. 证书是否被信任的CA签发'
          ];
        } else if (error.description.includes('Connection')) {
          suggestions = [
            '网络连接问题，请检查：',
            '1. 服务器防火墙设置',
            '2. 端口是否正确开放（通常是443）',
            '3. CDN或代理服务配置',
            '4. 网络连通性'
          ];
        } else if (error.description.includes('timeout')) {
          suggestions = [
            '连接超时，请检查：',
            '1. 服务器响应时间',
            '2. 网络延迟问题',
            '3. 服务器负载状况',
            '4. CDN配置是否正确'
          ];
        } else {
          suggestions = [
            '请检查以下项目：',
            '1. URL格式是否正确（必须是HTTPS）',
            '2. 域名是否可以从外网访问',
            '3. 端口和路径配置是否正确',
            '4. 服务器是否正常运行'
          ];
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        errorCode,
        suggestions
      };
    }
  }

  /**
   * 设置 Bot 命令菜单
   */
  async setBotCommands(): Promise<boolean> {
    try {
      const commands = [
        { command: 'start', description: '开始使用并绑定账户' },
        { command: 'help', description: '查看帮助信息' },
        { command: 'getme', description: '查看Bot和绑定状态' },
        { command: 'list', description: '查看订阅列表' },
        { command: 'add', description: '添加订阅 (用法: /add 关键词1 关键词2)' },
        { command: 'del', description: '删除订阅 (用法: /del 订阅ID)' },
        { command: 'post', description: '查看最近文章' },
        { command: 'stop', description: '停止推送' },
        { command: 'resume', description: '恢复推送' },
        { command: 'unbind', description: '解除用户绑定' }
      ];

      await this.bot.api.setMyCommands(commands);
      logger.telegram('Bot 命令菜单设置成功');
      return true;
    } catch (error) {
      logger.error('设置 Bot 命令菜单失败:', error);
      return false;
    }
  }

  /**
   * 处理 /start 命令
   */
  private async handleStartCommand(ctx: Context): Promise<void> {
    const config = this.dbService.getBaseConfig();

    if (!config) {
      await ctx.reply('系统尚未初始化，请先在网页端完成初始化设置。');
      return;
    }

    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // 获取用户信息
    const user = ctx.from;
    const userFullName = `${user?.first_name || ''}${user?.last_name ? ' ' + user.last_name : ''}`.trim();
    const username = user?.username || '';

    // 检查是否已经有绑定的用户
    if (config.chat_id && config.chat_id.trim() !== '') {
      // 如果是已绑定的用户，显示欢迎信息
      if (config.chat_id === chatId.toString()) {
        const welcomeText = `
🎉 **欢迎回来！**

👤 **用户信息：** ${userFullName || '未知用户'}${username ? ` (@${username})` : ''}
🆔 **Chat ID：** ${chatId}

✅ 您已经绑定到此系统，可以正常使用所有功能。

📋 **可用命令：**
/help - 查看帮助
/list - 查看订阅列表
/add - 添加订阅
/del - 删除订阅
/post - 查看最近文章
/stop - 停止推送
/resume - 恢复推送
        `;
        await ctx.reply(welcomeText, { parse_mode: 'Markdown' });
        return;
      } else {
        // 如果是其他用户尝试绑定，拒绝
        await ctx.reply(`❌ **绑定失败**

此系统已绑定到其他用户：

如需更换绑定用户，请：
1. 使用已绑定的账号发送 /unbind 命令解除绑定
2. 或联系管理员在网页端解除当前绑定

📋 **当前可用命令：**
/help - 查看帮助
/getme - 查看绑定状态`, { parse_mode: 'Markdown' });
        return;
      }
    }

    // 如果没有绑定用户，进行绑定
    this.dbService.updateBaseConfig({
      chat_id: chatId.toString(),
      bound_user_name: userFullName,
      bound_user_username: username
    });

    const userInfo = userFullName || '未知用户';
    const welcomeText = `
🎉 **欢迎使用NodeSeeker机器人！**

👤 **用户信息：** ${userInfo}${username ? ` (@${username})` : ''}
🆔 **Chat ID：** ${chatId}

✅ 已保存您的 Chat ID 和用户信息，现在可以接收推送消息了。

📋 **可用命令：**
/help - 查看帮助
/list - 查看订阅列表
/add - 添加订阅
/del - 删除订阅
/post - 查看最近文章
/stop - 停止推送
/resume - 恢复推送
    `;

    await ctx.reply(welcomeText, { parse_mode: 'Markdown' });
  }

  /**
   * 处理 /stop 命令
   */
  private async handleStopCommand(ctx: Context): Promise<void> {
    this.dbService.updateBaseConfig({ stop_push: 1 });
    await ctx.reply('✅ 已停止推送。发送 /resume 可恢复推送。');
  }

  /**
   * 处理 /resume 命令
   */
  private async handleResumeCommand(ctx: Context): Promise<void> {
    this.dbService.updateBaseConfig({ stop_push: 0 });
    await ctx.reply('✅ 已恢复推送。');
  }

  /**
   * 处理 /list 命令
   */
  private async handleListCommand(ctx: Context): Promise<void> {
    const subscriptions = this.dbService.getAllKeywordSubs();

    if (subscriptions.length === 0) {
      await ctx.reply('📝 暂无订阅记录。使用 /add 添加订阅。');
      return;
    }

    let text = '📋 当前订阅列表\n\n';
    subscriptions.forEach((sub, index) => {
      const keywords = [sub.keyword1, sub.keyword2, sub.keyword3]
        .filter(k => k && k.trim().length > 0);

      text += `${index + 1}. ID:${sub.id}\n`;

      if (keywords.length > 0) {
        text += `🔍 ${keywords.join(' + ')}\n`;
      }

      if (sub.creator) {
        text += `👤 ${sub.creator}\n`;
      }

      if (sub.category) {
        text += `${this.getCategoryIcon(sub.category)} ${this.getCategoryName(sub.category)}\n`;
      }

    });

    text += '💡 使用 /del 订阅ID 删除订阅';

    await ctx.reply(text, { parse_mode: 'Markdown' });
  }

  /**
   * 处理 /add 命令
   */
  private async handleAddCommand(ctx: Context): Promise<void> {
    const args = ctx.message?.text?.split(' ').slice(1) || [];

    if (args.length === 0) {
      await ctx.reply('❌ 请提供关键词。\n**用法：** /add 关键词1 关键词2 关键词3', { parse_mode: 'Markdown' });
      return;
    }

    const keywords = args.slice(0, 3); // 最多3个关键词

    try {
      const sub = this.dbService.createKeywordSub({
        keyword1: keywords[0],
        keyword2: keywords[1] || undefined,
        keyword3: keywords[2] || undefined
      });

      let text = `✅ **订阅添加成功！**\n\n**ID:** ${sub.id}\n**关键词：** ${sub.keyword1}`;
      if (sub.keyword2) text += ` \\+ ${sub.keyword2}`;
      if (sub.keyword3) text += ` \\+ ${sub.keyword3}`;

      await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply(`❌ 添加订阅失败：${error}`);
    }
  }

  /**
   * 处理 /del 命令
   */
  private async handleDeleteCommand(ctx: Context): Promise<void> {
    const args = ctx.message?.text?.split(' ').slice(1) || [];

    if (args.length === 0) {
      await ctx.reply('❌ 请提供订阅 ID。\n**用法：** /del 订阅ID', { parse_mode: 'Markdown' });
      return;
    }

    const id = parseInt(args[0]);
    if (isNaN(id)) {
      await ctx.reply('❌ 订阅 ID 必须是数字。');
      return;
    }

    try {
      const success = this.dbService.deleteKeywordSub(id);
      if (success) {
        await ctx.reply(`✅ 订阅 ${id} 删除成功。`);
      } else {
        await ctx.reply(`❌ 订阅 ${id} 不存在。`);
      }
    } catch (error) {
      await ctx.reply(`❌ 删除订阅失败：${error}`);
    }
  }

  /**
   * 处理 /post 命令
   */
  private async handlePostCommand(ctx: Context): Promise<void> {
    const posts = this.dbService.getRecentPosts(10);

    if (posts.length === 0) {
      await ctx.reply('📝 暂无文章数据。');
      return;
    }

    let text = '📰 最近10条文章\n\n';
    posts.forEach((post, index) => {
      text += `${index + 1}. [${post.title}](https://www.nodeseek.com/post-${post.post_id}-1)\n`;
    });

    await ctx.reply(text, { parse_mode: 'Markdown' });
  }

  /**
   * 处理 /help 命令
   */
  private async handleHelpCommand(ctx: Context): Promise<void> {
    const helpText = `
🤖 **NodeSeek RSS 监控机器人**

📋 **可用命令：**

/start \\- 开始使用并保存用户信息
/getme \\- 查看 Bot 信息和绑定状态
/unbind \\- 解除用户绑定
/stop \\- 停止推送
/resume \\- 恢复推送
/list \\- 列出所有订阅
/add 关键词1 关键词2 关键词3 \\- 添加订阅（最多3个关键词）
/del 订阅ID \\- 根据订阅ID删除订阅
/post \\- 查看最近10条文章及推送状态
/help \\- 显示此帮助信息

💡 **使用说明：**
\\- 添加订阅后，系统会自动匹配包含关键词的文章
\\- 可以设置多个关键词，文章需要包含所有关键词才会推送
\\- 使用 /list 查看订阅ID，然后用 /del 删除不需要的订阅
\\- 使用 /getme 查看当前绑定状态和 Bot 详细信息
    `;

    await ctx.reply(helpText, { parse_mode: 'Markdown' });
  }

  /**
   * 处理 /getme 命令
   */
  private async handleGetMeCommand(ctx: Context): Promise<void> {
    try {
      const botInfo = await this.getBotInfo();
      const config = this.dbService.getBaseConfig();

      if (!botInfo) {
        await ctx.reply('❌ 无法获取 Bot 信息');
        return;
      }

      const currentUser = ctx.from;
      const currentUserName = `${currentUser?.first_name || ''}${currentUser?.last_name ? ' ' + currentUser.last_name : ''}`.trim();
      const currentUsername = currentUser?.username || '';

      let userBindingStatus = '';
      if (config?.chat_id && config.chat_id.trim() !== '') {
        if (config.chat_id === ctx.chat?.id?.toString()) {
          userBindingStatus = `✅ **绑定状态：** 已绑定\n👤 **绑定用户：** ${config.bound_user_name || '未知'}${config.bound_user_username ? ` (@${config.bound_user_username})` : ''}\n💬 **绑定Chat ID：** ${config.chat_id}`;
        } else {
          userBindingStatus = `⚠️ **绑定状态：** 已绑定到其他用户`;
        }
      } else {
        userBindingStatus = '❌ **绑定状态：** 未绑定（发送 /start 进行绑定）';
      }

      const text = `
🤖 **NodeSeek RSS 监控机器人信息**

**当前用户：**
👤 **您的名称：** ${currentUserName || '未知'}${currentUsername ? ` (@${currentUsername})` : ''}
🆔 **您的 Chat ID：** ${ctx.chat?.id}

**绑定信息：**
${userBindingStatus}

💡 **提示：** 使用 /help 查看所有可用命令
      `;

      await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('处理 /getme 命令失败:', error);
      await ctx.reply('❌ 获取信息时发生错误');
    }
  }

  /**
   * 处理 /unbind 命令
   */
  private async handleUnbindCommand(ctx: Context): Promise<void> {
    const currentChatId = ctx.chat?.id?.toString();
    const config = this.dbService.getBaseConfig();

    // 检查是否是当前绑定的用户
    if (!config || config.chat_id !== currentChatId) {
      await ctx.reply('❌ 您当前未绑定到此系统。');
      return;
    }

    // 解除绑定
    this.dbService.updateBaseConfig({
      chat_id: '',
      bound_user_name: undefined,
      bound_user_username: undefined
    });

    await ctx.reply('✅ **绑定已解除**\n\n您将不再接收推送消息。如需重新绑定，请发送 /start 命令。', { parse_mode: 'Markdown' });
  }
}