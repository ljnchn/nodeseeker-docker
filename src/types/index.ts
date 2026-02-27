// 基础配置接口
export interface BaseConfig {
  id?: number;
  username: string;
  password: string;
  bot_token?: string;
  chat_id: string;
  bound_user_name?: string;
  bound_user_username?: string;
  stop_push: number;
  only_title: number;
  rss_url?: string;
  rss_interval_seconds?: number;
  rss_proxy?: string;
  created_at?: string;
  updated_at?: string;
}

// 文章接口
export interface Post {
  id?: number;
  post_id: number;
  title: string;
  memo: string;
  category: string;
  creator: string;
  push_status: number; // 0 未推送 1 已推送 2 无需推送
  sub_id?: number;
  pub_date: string;
  push_date?: string;
  created_at?: string;
}

// 关键词订阅接口
export interface KeywordSub {
  id?: number;
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  creator?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

// RSS 项目接口
export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  category: string;
  contentSnippet: string;
  content: string;
  guid: string;
}

// 解析后的文章接口
export interface ParsedPost {
  post_id: number;
  title: string;
  memo: string;
  category: string;
  creator: string;
  pub_date: string;
}

// API 响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Session 数据接口
export interface SessionData {
  sessionId: string;
  userId: number;
  username: string;
  createdAt: string;
  lastAccessedAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Session 验证结果接口
export interface SessionVerification {
  valid: boolean;
  sessionData?: SessionData;
  message?: string;
}

// JWT 载荷接口（保留用于向后兼容）
export interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

// 认证验证结果接口
export interface AuthVerification {
  valid: boolean;
  payload?: JWTPayload;
  sessionData?: SessionData;
  message?: string;
}

// Telegram 用户接口
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// 推送结果接口
export interface PushResult {
  pushed: number;
  failed: number;
  skipped: number;
}

// RSS 处理结果接口
export interface RSSProcessResult {
  new: number;
  updated: number;
  skipped: number;
}

// 数据清理结果接口
export interface CleanupResult {
  deletedCount: number;
  errors: string[];
}

// 分页查询参数接口
export interface PaginationParams {
  page?: number;
  limit?: number;
  pushStatus?: number;
  creator?: string;
  category?: string;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// 统计信息接口
export interface DatabaseStats {
  total_posts: number;
  unpushed_posts: number;
  pushed_posts: number;
  skipped_posts: number;
  total_subscriptions: number;
  today_posts: number;
  today_messages: number;
  last_update: string | null;
}

// Telegram Bot 配置接口
export interface TelegramBotConfig {
  token: string;
  webhookUrl?: string;
  chatId?: string;
}

// 匹配规则接口
export interface MatchRule {
  keywords: string[];
  creator?: string;
  category?: string;
  onlyTitle: boolean;
}

// 推送消息接口
export interface PushMessage {
  postId: number;
  title: string;
  content: string;
  url: string;
  creator: string;
  category: string;
  pubDate: string;
  matchedRule?: MatchRule;
}

// 服务器配置接口
export interface ServerConfig {
  port: number;
  host: string;
  environment: 'development' | 'production' | 'test';
  corsOrigins: string[];
  jwtSecret: string;
}

// 作业配置接口
export interface JobConfig {
  rssCheck: {
    enabled: boolean;
    cronExpression: string;
  };
  dataCleanup: {
    enabled: boolean;
    cronExpression: string;
    retentionDays: number;
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

// 错误响应接口
export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
}

// 成功响应接口
export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

// 联合响应类型
export type ApiResponseType<T = any> = SuccessResponse<T> | ErrorResponse;

// 中间件上下文变量类型
export interface ContextVariables {
  dbService: any; // DatabaseService 类型
  authService?: any; // AuthService 类型
  jwtPayload?: JWTPayload;
  validatedData?: any; // 验证后的请求体数据
  validatedQuery?: any; // 验证后的查询参数
  validatedParams?: any; // 验证后的路径参数
}

// Hono 应用类型
export type HonoApp = any; // 具体的 Hono 应用类型

// 环境变量类型
export interface EnvVars {
  PORT: number;
  HOST: string;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_PATH: string;
  RSS_TIMEOUT: number;
  RSS_CHECK_ENABLED: boolean;
  TELEGRAM_WEBHOOK_URL?: string;
  CORS_ORIGINS: string;
}