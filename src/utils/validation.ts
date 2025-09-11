import { z } from 'zod';

// 基础配置验证 Schema
export const baseConfigSchema = z.object({
    username: z.string().min(1, '用户名不能为空').max(50, '用户名不能超过50个字符'),
    password: z.string().min(6, '密码至少6个字符').max(100, '密码不能超过100个字符'),
    bot_token: z.string().optional(),
    chat_id: z.string().min(1, 'Chat ID不能为空'),
    bound_user_name: z.string().optional(),
    bound_user_username: z.string().optional(),
    stop_push: z.number().int().min(0).max(1).default(0),
    only_title: z.number().int().min(0).max(1).default(0),
});

// 基础配置更新验证 Schema
export const baseConfigUpdateSchema = z.object({
    username: z.string().min(1).max(50).optional(),
    password: z.string().min(6).max(100).optional(),
    bot_token: z.string().optional(),
    chat_id: z.string().min(1).optional(),
    bound_user_name: z.string().optional(),
    bound_user_username: z.string().optional(),
    stop_push: z.union([z.number().int().min(0).max(1), z.boolean().transform(val => val ? 1 : 0)]).optional(),
    only_title: z.union([z.number().int().min(0).max(1), z.boolean().transform(val => val ? 1 : 0)]).optional(),
});

// 文章验证 Schema
export const postSchema = z.object({
    post_id: z.number().int().positive('文章ID必须是正整数'),
    title: z.string().min(1, '标题不能为空').max(500, '标题不能超过500个字符'),
    memo: z.string().max(2000, '摘要不能超过2000个字符').default(''),
    category: z.string().min(1, '分类不能为空').max(100, '分类不能超过100个字符'),
    creator: z.string().min(1, '创建者不能为空').max(100, '创建者不能超过100个字符'),
    push_status: z.number().int().min(0).max(2).default(0),
    sub_id: z.number().int().positive().optional(),
    pub_date: z.string().min(1, '发布日期不能为空'),
    push_date: z.string().optional(),
});

// 关键词订阅验证 Schema
export const keywordSubSchema = z.object({
    keyword1: z.string().max(100, '关键词1不能超过100个字符').optional(),
    keyword2: z.string().max(100, '关键词2不能超过100个字符').optional(),
    keyword3: z.string().max(100, '关键词3不能超过100个字符').optional(),
    creator: z.string().max(100, '创建者不能超过100个字符').optional(),
    category: z.string().max(100, '分类不能超过100个字符').optional(),
}).refine(
    (data) => data.keyword1 || data.keyword2 || data.keyword3 || data.creator || data.category,
    {
        message: '至少需要提供一个关键词或过滤条件',
    }
);

// 关键词订阅更新验证 Schema
export const keywordSubUpdateSchema = z.object({
    keyword1: z.string().max(100).optional(),
    keyword2: z.string().max(100).optional(),
    keyword3: z.string().max(100).optional(),
    creator: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
});

// 登录验证 Schema
export const loginSchema = z.object({
    username: z.string().min(1, '用户名不能为空'),
    password: z.string().min(1, '密码不能为空'),
});

// 初始化系统验证 Schema
export const initSystemSchema = z.object({
    username: z.string().min(1, '用户名不能为空').max(50, '用户名不能超过50个字符'),
    password: z.string().min(6, '密码至少6个字符').max(100, '密码不能超过100个字符'),
    confirmPassword: z.string().min(6, '确认密码至少6个字符'),
}).refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
});

// Bot Token 验证 Schema
export const botTokenSchema = z.object({
    bot_token: z.string().min(1, 'Bot Token不能为空').regex(
        /^\d+:[A-Za-z0-9_-]+$/,
        'Bot Token格式不正确'
    ),
    webhook_url: z.string().url('Webhook URL 格式不正确').optional(),
});

// 分页参数验证 Schema
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    pushStatus: z.coerce.number().int().min(0).max(2).optional(),
    creator: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    search: z.string().max(200).optional(),
});

// ID 参数验证 Schema
export const idParamSchema = z.object({
    id: z.coerce.number().int().positive('ID必须是正整数'),
});

// Telegram 用户验证 Schema
export const telegramUserSchema = z.object({
    id: z.number().int().positive(),
    first_name: z.string().min(1),
    last_name: z.string().optional(),
    username: z.string().optional(),
    language_code: z.string().optional(),
});

// RSS 配置验证 Schema
export const rssConfigSchema = z.object({
    url: z.string().url('RSS URL格式不正确'),
    timeout: z.number().int().min(1000).max(60000).default(10000),
    userAgent: z.string().min(1).default('NodeSeeker-Bot/1.0'),
});

// 推送状态更新验证 Schema
export const pushStatusUpdateSchema = z.object({
    postId: z.number().int().positive(),
    pushStatus: z.number().int().min(0).max(2),
    subId: z.number().int().positive().optional(),
    pushDate: z.string().optional(),
});

// 批量推送状态更新验证 Schema
export const batchPushStatusUpdateSchema = z.array(pushStatusUpdateSchema).min(1).max(100);

// 日期范围验证 Schema
export const dateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '开始日期格式不正确 (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '结束日期格式不正确 (YYYY-MM-DD)'),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: '开始日期不能晚于结束日期',
    path: ['endDate'],
});

// Telegram 命令验证 Schema
export const telegramCommandSchema = z.object({
    command: z.string().min(1),
    args: z.array(z.string()).default([]),
    chatId: z.number().int(),
    userId: z.number().int(),
    username: z.string().optional(),
});

// 验证工具函数
export class ValidationError extends Error {
    constructor(
        message: string,
        public field?: string,
        public code?: string
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

// 验证助手函数
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            throw new ValidationError(
                firstError.message,
                firstError.path.join('.'),
                firstError.code
            );
        }
        throw error;
    }
}

// 安全验证助手函数（返回结果而不抛出异常）
export function safeValidateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string; field?: string } {
    try {
        const result = schema.parse(data);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            return {
                success: false,
                error: firstError.message,
                field: firstError.path.join('.')
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : '验证失败'
        };
    }
}

// 中间件验证函数
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
    return async (c: any, next: any) => {
        try {
            const body = await c.req.json();
            const validatedData = validateData(schema, body);
            c.set('validatedData', validatedData);
            await next();
        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    field: error.field,
                    code: error.code
                }, 400);
            }
            return c.json({
                success: false,
                message: '请求数据格式错误'
            }, 400);
        }
    };
}

// 查询参数验证中间件
export function createQueryValidationMiddleware<T>(schema: z.ZodSchema<T>) {
    return async (c: any, next: any) => {
        try {
            const query = c.req.query();
            const validatedQuery = validateData(schema, query);
            c.set('validatedQuery', validatedQuery);
            await next();
        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    field: error.field,
                    code: error.code
                }, 400);
            }
            return c.json({
                success: false,
                message: '查询参数格式错误'
            }, 400);
        }
    };
}

// 路径参数验证中间件
export function createParamValidationMiddleware<T>(schema: z.ZodSchema<T>) {
    return async (c: any, next: any) => {
        try {
            const params = c.req.param();
            const validatedParams = validateData(schema, params);
            c.set('validatedParams', validatedParams);
            await next();
        } catch (error) {
            if (error instanceof ValidationError) {
                return c.json({
                    success: false,
                    message: error.message,
                    field: error.field,
                    code: error.code
                }, 400);
            }
            return c.json({
                success: false,
                message: '路径参数格式错误'
            }, 400);
        }
    };
}