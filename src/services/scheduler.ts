import * as cron from 'node-cron';
import { DatabaseService } from './database';
import { RSSService } from './rss';
import { TelegramPushService } from './telegram/push';
import { MatcherService } from './matcher';
import { getEnvConfig } from '../config/env';

export class SchedulerService {
    private rssTask?: cron.ScheduledTask;
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

            if (!config.bot_token) {
                console.log('⚠️ 未配置 Bot Token，跳过任务');
                return;
            }

            // 创建服务实例
            const telegramService = new TelegramPushService(this.dbService, config.bot_token);
            const matcherService = new MatcherService(this.dbService, telegramService);


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
        };
    } {
        return {
            rssTask: {
                running: this.rssTask ? true : false
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

}