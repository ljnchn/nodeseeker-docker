#!/usr/bin/env bun
import { app, initializeApp, startServer } from './index';
import { DatabaseService } from './services/database';
import { SchedulerService } from './services/scheduler';

let schedulerService: SchedulerService | null = null;

// 启动服务器
async function main() {
    try {
        // 初始化应用和数据库
        const config = await startServer();

        // 创建定时任务服务
        const dbService = DatabaseService.create();
        schedulerService = new SchedulerService(dbService);

        // 启动定时任务
        schedulerService.start();

        // 启动 Bun 服务器
        const server = Bun.serve({
            port: config!.PORT,
            hostname: config!.HOST,
            fetch: app.fetch,
        });

        console.log(`🌐 服务器运行在: http://${server.hostname}:${server.port}`);

        // 优雅关闭处理
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);

    } catch (error) {
        console.error('启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
function gracefulShutdown() {
    console.log('\n🛑 收到关闭信号，正在优雅关闭...');

    if (schedulerService) {
        schedulerService.stop();
    }

    console.log('✅ 服务器已关闭');
    process.exit(0);
}

// 运行主函数
main();