export interface JobsConfig {
  rssCheck: {
    enabled: boolean;
    cronExpression: string;
  };
  telegram: {
    botToken?: string;
    webhookUrl?: string;
  };
  rss: {
    url: string;
    timeout: number;
    userAgent: string;
  };
}

export const getJobsConfig = (): JobsConfig => {
  return {
    rssCheck: {
      enabled: process.env.RSS_CHECK_ENABLED !== 'false',
      cronExpression: process.env.RSS_CRON_EXPRESSION || '*/1 * * * *', // 每分钟
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    },
    rss: {
      url: process.env.RSS_URL || 'https://rss.nodeseek.com/',
      timeout: parseInt(process.env.RSS_TIMEOUT || '30000'), // 增加到30秒
      userAgent: process.env.RSS_USER_AGENT || 'NodeSeeker-Bot/1.0',
    }
  };
};