import { DatabaseService } from './database';
import { RSSService } from './rss';
import { TelegramPushService } from './telegram/push';
import { MatcherService } from './matcher';
import { getEnvConfig } from '../config/env';

export class SchedulerService {
    private rssIntervalId?: NodeJS.Timeout;
    private dbService: DatabaseService;
    private isRunning: boolean = false;

    constructor(dbService: DatabaseService) {
        this.dbService = dbService;
    }

    /**
     * 获取 RSS 间隔秒数（从数据库）
     */
    private getRSSIntervalSeconds(): number {
        const config = this.dbService.getBaseConfig();
        // 默认 60 秒，最小 10 秒
        const seconds = config?.rss_interval_seconds || 60;
        return Math.max(10, seconds);
    }

    /**
     * 启动所有定时任务
     */
    start(): void {
        const envConfig = getEnvConfig();

        console.log('🕐 启动定时任务服务...');

        // RSS 抓取和推送任务
        if (envConfig.RSS_CHECK_ENABLED) {
            this.startRSSTask();
        }

        console.log('✅ 定时任务服务启动完成');
    }

    /**
     * 停止所有定时任务
     */
    stop(): void {
        console.log('🛑 停止定时任务服务...');

        if (this.rssIntervalId) {
            clearInterval(this.rssIntervalId);
            this.rssIntervalId = undefined;
        }
        this.isRunning = false;

        console.log('✅ 定时任务服务已停止');
    }

    /**
     * 启动 RSS 抓取和推送任务（使用 setInterval 实现秒级间隔）
     */
    private startRSSTask(): void {
        const intervalSeconds = this.getRSSIntervalSeconds();
        console.log(`📡 启动 RSS 任务，执行间隔: ${intervalSeconds} 秒`);

        this.isRunning = true;
        
        // 立即执行一次
        this.executeRSSTask();

        // 设置定时执行
        this.rssIntervalId = setInterval(async () => {
            if (!this.isRunning) return;
            await this.executeRSSTask();
        }, intervalSeconds * 1000);
    }


    /**
     * 执行 RSS 抓取和推送任务
     */
    private async executeRSSTask(): Promise<void> {
        const startTime = Date.now();
        console.log(`🚀 开始执行 RSS 任务 - ${new Date().toISOString()}`);

        try {
            // 检查系统配置
            const config = this.dbService.getBaseConfig();
            if (!config) {
                console.log('⚠️ 系统未配置，跳过 RSS 任务');
                return;
            }

            const rssService = new RSSService(this.dbService);
            // 1. 抓取新的 RSS 数据
            console.log('📡 开始抓取 RSS 数据...');
            const rssResult = await rssService.processNewRSSData();
            console.log(`📊 RSS 抓取完成: 新增 ${rssResult.new} 篇文章，跳过 ${rssResult.skipped} 篇`);

            // 2. 处理待处理的文章（匹配订阅 + 推送 Telegram）
            const unpushedCount = this.dbService.getPostsCountByStatus(0);
            if (unpushedCount > 0) {
                let telegramService: TelegramPushService | null = null;
                if (config.bot_token) {
                    try {
                        telegramService = new TelegramPushService(this.dbService, config.bot_token);
                    } catch (e) {
                        console.warn('Telegram 服务初始化失败，将仅执行匹配');
                    }
                }
                const matcherService = new MatcherService(this.dbService, telegramService);

                console.log(`📤 开始处理 ${unpushedCount} 篇待处理文章...`);
                const pushResult = await matcherService.processUnpushedPosts();
                console.log(`📊 处理完成: 已匹配 ${pushResult.pushed} 篇，未匹配 ${pushResult.skipped} 篇，失败 ${pushResult.failed} 篇`);
            }

            const duration = Date.now() - startTime;
            console.log(`✅ RSS 任务执行完成，耗时: ${duration}ms`);

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ RSS 任务执行失败，耗时: ${duration}ms`, error);
        }
    }


    /**
     * 手动执行 RSS 任务
     */
    async manualRSSTask(): Promise<{ success: boolean; message: string; data?: any }> {
        try {
            console.log('🔧 手动执行 RSS 任务');
            await this.executeRSSTask();
            return {
                success: true,
                message: 'RSS 任务执行成功'
            };
        } catch (error) {
            return {
                success: false,
                message: `RSS 任务执行失败: ${error}`
            };
        }
    }


    /**
     * 获取任务状态
     */
    getStatus(): {
        rssTask: {
            running: boolean;
            intervalSeconds: number;
        };
    } {
        return {
            rssTask: {
                running: this.isRunning,
                intervalSeconds: this.getRSSIntervalSeconds()
            }
        };
    }

    /**
     * 重启 RSS 任务（用于配置更新后）
     */
    restartRSSTask(): void {
        console.log('🔄 正在重启 RSS 任务...');
        
        // 停止现有任务
        if (this.rssIntervalId) {
            clearInterval(this.rssIntervalId);
            this.rssIntervalId = undefined;
        }
        this.isRunning = false;

        // 重新启动
        const envConfig = getEnvConfig();
        if (envConfig.RSS_CHECK_ENABLED) {
            this.startRSSTask();
            const intervalSeconds = this.getRSSIntervalSeconds();
            console.log(`✅ RSS 任务已重启，新间隔: ${intervalSeconds} 秒`);
        }
    }

    /**
     * 更新 RSS 间隔并重启任务
     */
    async updateIntervalAndRestart(newIntervalSeconds: number): Promise<{ success: boolean; message: string }> {
        try {
            // 验证参数
            const validInterval = Math.max(10, newIntervalSeconds);
            
            // 更新数据库
            this.dbService.updateBaseConfig({
                rss_interval_seconds: validInterval
            });

            // 重启任务
            this.restartRSSTask();

            return {
                success: true,
                message: `RSS 抓取间隔已更新为 ${validInterval} 秒`
            };
        } catch (error) {
            return {
                success: false,
                message: `更新间隔失败: ${error}`
            };
        }
    }
}
