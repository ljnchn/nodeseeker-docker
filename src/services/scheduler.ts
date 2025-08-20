import * as cron from 'node-cron';
import { DatabaseService } from './database';
import { RSSService } from './rss';
import { TelegramService } from './telegram';
import { MatcherService } from './matcher';
import { getEnvConfig } from '../config/env';

export class SchedulerService {
    private rssTask?: cron.ScheduledTask;
    private cleanupTask?: cron.ScheduledTask;
    private dbService: DatabaseService;

    constructor(dbService: DatabaseService) {
        this.dbService = dbService;
    }

    /**
     * 启动所有定时任务
     */
    start(): void {
        const config = getEnvConfig();

        console.log('🕐 启动定时任务服务...');

        // RSS 抓取和推送任务
        if (config.RSS_CHECK_ENABLED) {
            this.startRSSTask(config.RSS_CRON_EXPRESSION);
        }

        // 数据清理任务
        if (config.DATA_CLEANUP_ENABLED) {
            this.startCleanupTask(config.CLEANUP_CRON_EXPRESSION);
        }

        console.log('✅ 定时任务服务启动完成');
    }

    /**
     * 停止所有定时任务
     */
    stop(): void {
        console.log('🛑 停止定时任务服务...');

        if (this.rssTask) {
            this.rssTask.stop();
            this.rssTask = undefined;
        }

        if (this.cleanupTask) {
            this.cleanupTask.stop();
            this.cleanupTask = undefined;
        }

        console.log('✅ 定时任务服务已停止');
    }

    /**
     * 启动 RSS 抓取和推送任务
     */
    private startRSSTask(cronExpression: string): void {
        console.log(`📡 启动 RSS 任务，执行频率: ${cronExpression}`);

        this.rssTask = cron.schedule(cronExpression, async () => {
            await this.executeRSSTask();
        }, {
            timezone: 'Asia/Shanghai'
        });
    }

    /**
     * 启动数据清理任务
     */
    private startCleanupTask(cronExpression: string): void {
        console.log(`🧹 启动数据清理任务，执行频率: ${cronExpression}`);

        this.cleanupTask = cron.schedule(cronExpression, async () => {
            await this.executeCleanupTask();
        }, {
            timezone: 'Asia/Shanghai'
        });
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

            // 创建服务实例
            const rssService = new RSSService(this.dbService);
            const telegramService = new TelegramService(this.dbService, config.bot_token);
            const matcherService = new MatcherService(this.dbService, telegramService);

            // 1. 抓取新的 RSS 数据
            console.log('📡 开始抓取 RSS 数据...');
            const rssResult = await rssService.processNewRSSData();
            console.log(`📊 RSS 抓取完成: 新增 ${rssResult.new} 篇文章，跳过 ${rssResult.skipped} 篇`);

            // 2. 处理未推送的文章
            if (rssResult.new > 0) {
                console.log('📤 开始处理推送...');
                const pushResult = await matcherService.processUnpushedPosts();
                console.log(`📊 推送完成: 推送 ${pushResult.pushed} 篇，跳过 ${pushResult.skipped} 篇，失败 ${pushResult.failed} 篇`);
            } else {
                console.log('📝 没有新文章，跳过推送处理');
            }

            const duration = Date.now() - startTime;
            console.log(`✅ RSS 任务执行完成，耗时: ${duration}ms`);

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ RSS 任务执行失败，耗时: ${duration}ms`, error);
        }
    }

    /**
     * 执行数据清理任务
     */
    private async executeCleanupTask(): Promise<void> {
        const startTime = Date.now();
        console.log(`🧹 开始执行数据清理任务 - ${new Date().toISOString()}`);

        try {
            const result = this.dbService.cleanupOldPosts();

            const duration = Date.now() - startTime;
            console.log(`✅ 数据清理任务完成，删除了 ${result.deletedCount} 条记录，耗时: ${duration}ms`);

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ 数据清理任务失败，耗时: ${duration}ms`, error);
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
     * 手动执行清理任务
     */
    async manualCleanupTask(): Promise<{ success: boolean; message: string; data?: any }> {
        try {
            console.log('🔧 手动执行数据清理任务');
            await this.executeCleanupTask();
            return {
                success: true,
                message: '数据清理任务执行成功'
            };
        } catch (error) {
            return {
                success: false,
                message: `数据清理任务执行失败: ${error}`
            };
        }
    }

    /**
     * 获取任务状态
     */
    getStatus(): {
        rssTask: {
            running: boolean;
        };
        cleanupTask: {
            running: boolean;
        };
    } {
        return {
            rssTask: {
                running: this.rssTask ? true : false
            },
            cleanupTask: {
                running: this.cleanupTask ? true : false
            }
        };
    }

    /**
     * 重启 RSS 任务
     */
    restartRSSTask(): void {
        if (this.rssTask) {
            this.rssTask.stop();
        }

        const config = getEnvConfig();
        if (config.RSS_CHECK_ENABLED) {
            this.startRSSTask(config.RSS_CRON_EXPRESSION);
            console.log('🔄 RSS 任务已重启');
        }
    }

    /**
     * 重启清理任务
     */
    restartCleanupTask(): void {
        if (this.cleanupTask) {
            this.cleanupTask.stop();
        }

        const config = getEnvConfig();
        if (config.DATA_CLEANUP_ENABLED) {
            this.startCleanupTask(config.CLEANUP_CRON_EXPRESSION);
            console.log('🔄 数据清理任务已重启');
        }
    }
}