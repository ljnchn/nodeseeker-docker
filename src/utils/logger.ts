// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

// 从环境变量读取日志级别
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const currentLevelValue = LOG_LEVELS[currentLevel];

// 颜色配置
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// 标签配置（固定 5 字符宽度，保证对齐）
const TAGS = {
  debug: '[DBG]',
  info:  '[INF]',
  success: '[ OK]',
  warn:  '[WRN]',
  error: '[ERR]',
  rss:   '[RSS]',
  telegram: '[ TG]',
  db:    '[ DB]',
  match: '[MAT]',
  server: '[SRV]',
  scheduler: '[SCH]',
};

// 格式化时间
function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { hour12: false });
}

// 基础日志函数
function log(level: LogLevel, tag: string, message: string, ...args: any[]) {
  if (LOG_LEVELS[level] < currentLevelValue) return;

  const time = `${COLORS.dim}${formatTime()}${COLORS.reset}`;
  const levelColor = {
    debug: COLORS.cyan,
    info: COLORS.blue,
    warn: COLORS.yellow,
    error: COLORS.red,
  }[level] || COLORS.white;

  const tagStr = `${levelColor}${tag}${COLORS.reset}`;
  const levelStr = `${levelColor}${level.toUpperCase().padEnd(5)}${COLORS.reset}`;

  if (args.length > 0) {
    console.log(`${time} ${tagStr} ${levelStr} ${message}`, ...args);
  } else {
    console.log(`${time} ${tagStr} ${levelStr} ${message}`);
  }
}

// 导出日志函数
export const logger = {
  debug: (message: string, ...args: any[]) => log('debug', TAGS.debug, message, ...args),
  info: (message: string, ...args: any[]) => log('info', TAGS.info, message, ...args),
  warn: (message: string, ...args: any[]) => log('warn', TAGS.warn, message, ...args),
  error: (message: string, ...args: any[]) => log('error', TAGS.error, message, ...args),
  success: (message: string, ...args: any[]) => log('info', TAGS.success, message, ...args),

  // 分类日志
  rss: (message: string, ...args: any[]) => log('info', TAGS.rss, message, ...args),
  rssDebug: (message: string, ...args: any[]) => log('debug', TAGS.rss, message, ...args),
  telegram: (message: string, ...args: any[]) => log('info', TAGS.telegram, message, ...args),
  db: (message: string, ...args: any[]) => log('info', TAGS.db, message, ...args),
  match: (message: string, ...args: any[]) => log('info', TAGS.match, message, ...args),
  server: (message: string, ...args: any[]) => log('info', TAGS.server, message, ...args),
  scheduler: (message: string, ...args: any[]) => log('info', TAGS.scheduler, message, ...args),

  // 任务相关（带缩进）
  task: {
    start: (name: string) => log('info', '[>>>]', name),
    end: (name: string, duration?: number) => {
      const timeStr = duration ? ` (${duration}ms)` : '';
      log('info', '[<<<]', `${name}${timeStr}`);
    },
    info: (message: string) => log('info', '[   ]', `  ${message}`),
    warn: (message: string) => log('warn', '[WRN]', `  ${message}`),
    error: (message: string) => log('error', '[ERR]', `  ${message}`),
  },

  // 统计输出
  stats: (data: Record<string, string | number>) => {
    if (currentLevelValue > LOG_LEVELS.info) return;
    const entries = Object.entries(data);
    const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
    entries.forEach(([key, value]) => {
      console.log(`  ${COLORS.dim}${key.padEnd(maxKeyLen)}${COLORS.reset}: ${COLORS.cyan}${value}${COLORS.reset}`);
    });
  },
};

export default logger;
