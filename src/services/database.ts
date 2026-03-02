import type { Database } from 'bun:sqlite';
import { createDatabaseConnection } from '../config/database';
import type { BaseConfig, Post, KeywordSub } from '../types';
import { logger } from '../utils/logger';

export class DatabaseService {
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private readonly CACHE_TTL = 60000; // 1分钟缓存

  constructor(private db: Database) {
    this.queryCache = new Map();
  }

  // 静态工厂方法
  static create(): DatabaseService {
    const db = createDatabaseConnection();
    return new DatabaseService(db);
  }

  // 缓存助手方法
  private getCacheKey(method: string, params: any[]): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.queryCache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private clearCacheByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.queryCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.queryCache.delete(key));
  }

  /**
   * 检查数据库表是否存在
   */
  checkTablesExist(): boolean {
    try {
      // 检查主要表是否存在
      const tables = ['base_config', 'posts', 'keywords_sub'];
      
      for (const table of tables) {
        const result = this.db.query(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(table);
        
        if (!result) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('检查数据库表存在性失败:', error);
      return false;
    }
  }

  // 基础配置相关操作
  getBaseConfig(): BaseConfig | null {
    const cacheKey = this.getCacheKey('getBaseConfig', []);
    const cached = this.getFromCache<BaseConfig | null>(cacheKey);
    if (cached !== null) return cached;

    const result = this.db.query('SELECT * FROM base_config LIMIT 1').get() as BaseConfig | null;
    
    // 缓存120秒，配置变化不频繁
    this.setCache(cacheKey, result, 120000);
    return result;
  }

  createBaseConfig(config: Omit<BaseConfig, 'id' | 'created_at' | 'updated_at'>): BaseConfig {
    const stmt = this.db.query(`
      INSERT INTO base_config (username, password, bot_token, chat_id, bound_user_name, bound_user_username, stop_push, only_title, rss_url, rss_interval_seconds, rss_proxy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    
    const result = stmt.get(
      config.username,
      config.password,
      config.bot_token || null,
      config.chat_id,
      config.bound_user_name || null,
      config.bound_user_username || null,
      config.stop_push,
      config.only_title,
      config.rss_url || 'https://rss.nodeseek.com/',
      config.rss_interval_seconds || 60,
      config.rss_proxy || null
    ) as BaseConfig;
    
    // 清理相关缓存
    this.clearCacheByPattern('BaseConfig');
    
    return result;
  }

  updateBaseConfig(config: Partial<BaseConfig>): BaseConfig | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (config.username !== undefined) {
      updates.push('username = ?');
      values.push(config.username);
    }
    if (config.password !== undefined) {
      updates.push('password = ?');
      values.push(config.password);
    }
    if (config.bot_token !== undefined) {
      updates.push('bot_token = ?');
      values.push(config.bot_token);
    }
    if (config.chat_id !== undefined) {
      updates.push('chat_id = ?');
      values.push(config.chat_id);
    }
    if (config.bound_user_name !== undefined) {
      updates.push('bound_user_name = ?');
      values.push(config.bound_user_name);
    }
    if (config.bound_user_username !== undefined) {
      updates.push('bound_user_username = ?');
      values.push(config.bound_user_username);
    }
    if (config.stop_push !== undefined) {
      updates.push('stop_push = ?');
      values.push(config.stop_push);
    }
    if (config.only_title !== undefined) {
      updates.push('only_title = ?');
      values.push(config.only_title);
    }
    if (config.rss_url !== undefined) {
      updates.push('rss_url = ?');
      values.push(config.rss_url);
    }
    if (config.rss_interval_seconds !== undefined) {
      updates.push('rss_interval_seconds = ?');
      values.push(config.rss_interval_seconds);
    }
    if (config.rss_proxy !== undefined) {
      updates.push('rss_proxy = ?');
      values.push(config.rss_proxy);
    }

    if (updates.length === 0) {
      return this.getBaseConfig();
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const stmt = this.db.query(`
      UPDATE base_config 
      SET ${updates.join(', ')}
      WHERE id = (SELECT id FROM base_config LIMIT 1)
      RETURNING *
    `);

    const result = stmt.get(...values) as BaseConfig | null;

    // 清理相关缓存
    this.clearCacheByPattern('BaseConfig');

    return result;
  }

  // 文章相关操作
  createPost(post: Omit<Post, 'id' | 'created_at'>): Post {
    const stmt = this.db.query(`
      INSERT INTO posts (post_id, title, memo, category, creator, push_status, sub_id, pub_date, push_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const result = stmt.get(
      post.post_id,
      post.title,
      post.memo,
      post.category,
      post.creator,
      post.push_status,
      post.sub_id || null,
      post.pub_date,
      post.push_date || null
    ) as Post;

    // 清除相关缓存
    this.clearCacheByPattern('posts');
    this.clearCacheByPattern('Stats');

    return result;
  }

  /**
   * 批量创建文章
   */
  batchCreatePosts(posts: Array<Omit<Post, 'id' | 'created_at'>>): number {
    if (posts.length === 0) {
      return 0;
    }

    const stmt = this.db.query(`
      INSERT INTO posts (post_id, title, memo, category, creator, push_status, sub_id, pub_date, push_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 使用事务进行批量插入
    const transaction = this.db.transaction((posts: Array<Omit<Post, 'id' | 'created_at'>>) => {
      let insertedCount = 0;
      for (const post of posts) {
        try {
          stmt.run(
            post.post_id,
            post.title,
            post.memo,
            post.category,
            post.creator,
            post.push_status,
            post.sub_id || null,
            post.pub_date,
            post.push_date || null
          );
          insertedCount++;
        } catch (error) {
          logger.error(`插入文章失败 (post_id: ${post.post_id}):`, error);
        }
      }
      return insertedCount;
    });

    const insertedCount = transaction(posts);
    
    // 清除相关缓存
    this.clearCacheByPattern('posts');
    this.clearCacheByPattern('Stats');
    
    return insertedCount;
  }

  getPostByPostId(postId: number): Post | null {
    const stmt = this.db.query('SELECT * FROM posts WHERE post_id = ?');
    return stmt.get(postId) as Post | null;
  }

  /**
   * 批量查询文章，根据 post_id 数组
   */
  getPostsByPostIds(postIds: number[]): Map<number, Post> {
    if (postIds.length === 0) {
      return new Map();
    }

    // 构建 IN 查询的占位符
    const placeholders = postIds.map(() => '?').join(',');
    const query = `SELECT * FROM posts WHERE post_id IN (${placeholders})`;
    
    const stmt = this.db.query(query);
    const results = stmt.all(...postIds) as Post[];
    
    // 将结果转换为 Map，以 post_id 为键
    const postMap = new Map<number, Post>();
    results.forEach(post => {
      postMap.set(post.post_id, post);
    });
    
    return postMap;
  }

  updatePostPushStatus(postId: number, pushStatus: number, subId?: number, pushDate?: string): void {
    const stmt = this.db.query(`
      UPDATE posts 
      SET push_status = ?, sub_id = ?, push_date = ?
      WHERE post_id = ?
    `);
    
    stmt.run(pushStatus, subId || null, pushDate || null, postId);
  }

  getRecentPosts(limit: number = 10): Post[] {
    const stmt = this.db.query(`
      SELECT * FROM posts 
      ORDER BY pub_date DESC 
      LIMIT ?
    `);
    
    return stmt.all(limit) as Post[];
  }

  getUnpushedPosts(): Post[] {
    const stmt = this.db.query(`
      SELECT * FROM posts 
      WHERE push_status = 0 
      ORDER BY pub_date ASC
    `);
    
    return stmt.all() as Post[];
  }

  // 新增：带分页的文章查询
  getPostsWithPagination(
    page: number = 1, 
    limit: number = 30, 
    filters?: {
      pushStatus?: number;
      pushStatusIn?: number[];  // 新增：IN 查询
      pushStatusNot?: number;
      creator?: string;
      category?: string;
      search?: string;
      subId?: number;
    }
  ): {
    posts: Post[];
    total: number;
    page: number;
    totalPages: number;
  } {
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    

    if (filters) {
      if (filters.pushStatusIn && filters.pushStatusIn.length > 0) {
        // 同时查询多个状态（如 [1, 3] 表示已匹配的文章）
        const placeholders = filters.pushStatusIn.map(() => '?').join(',');
        conditions.push(`push_status IN (${placeholders})`);
        params.push(...filters.pushStatusIn);
      } else if (filters.pushStatus !== undefined && filters.pushStatus !== null && filters.pushStatus.toString() !== '') {
        conditions.push('push_status = ?');
        params.push(filters.pushStatus);
      }
      
      if (filters.pushStatusNot !== undefined && filters.pushStatusNot !== null && filters.pushStatusNot.toString() !== '') {
        conditions.push('push_status != ?');
        params.push(filters.pushStatusNot);
      }
      
      if (filters.creator) {
        conditions.push('creator LIKE ?');
        params.push(`%${filters.creator}%`);
      }
      
      if (filters.category) {
        conditions.push('category LIKE ?');
        params.push(`%${filters.category}%`);
      }
      
      if (filters.search) {
        conditions.push('title LIKE ?');
        params.push(`%${filters.search}%`);
      }
      
      if (filters.subId !== undefined) {
        conditions.push('sub_id = ?');
        params.push(filters.subId);
      }
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 查询文章
    const postsStmt = this.db.query(`
      SELECT * FROM posts 
      ${whereClause}
      ORDER BY pub_date DESC 
      LIMIT ? OFFSET ?
    `);
    const posts = postsStmt.all(...params, limit, offset) as Post[];
    
    // 查询总数
    const countStmt = this.db.query(`
      SELECT COUNT(*) as count FROM posts 
      ${whereClause}
    `);
    const countResult = countStmt.get(...params) as { count: number };
    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      posts,
      total,
      page,
      totalPages
    };
  }

  // 新增：批量更新文章推送状态
  batchUpdatePostPushStatus(updates: Array<{
    postId: number;
    pushStatus: number;
    subId?: number;
    pushDate?: string;
  }>): void {
    if (updates.length === 0) return;
    
    const stmt = this.db.query(`
      UPDATE posts 
      SET push_status = ?, sub_id = ?, push_date = ?
      WHERE post_id = ?
    `);
    
    // 使用事务进行批量更新
    const transaction = this.db.transaction((updates) => {
      for (const update of updates) {
        stmt.run(
          update.pushStatus,
          update.subId || null,
          update.pushDate || null,
          update.postId
        );
      }
    });
    
    transaction(updates);
  }

  // 关键词订阅相关操作
  createKeywordSub(sub: Omit<KeywordSub, 'id' | 'created_at' | 'updated_at'>): KeywordSub {
    const stmt = this.db.query(`
      INSERT INTO keywords_sub (keyword1, keyword2, keyword3, creator, category)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);

    const result = stmt.get(
      sub.keyword1 || null,
      sub.keyword2 || null,
      sub.keyword3 || null,
      sub.creator || null,
      sub.category || null
    ) as KeywordSub;

    // 清理相关缓存
    this.clearCacheByPattern('KeywordSubs');
    this.clearCacheByPattern('Subscriptions');

    return result;
  }

  getAllKeywordSubs(): KeywordSub[] {
    const cacheKey = this.getCacheKey('getAllKeywordSubs', []);
    const cached = this.getFromCache<KeywordSub[]>(cacheKey);
    if (cached !== null) return cached;

    const stmt = this.db.query('SELECT * FROM keywords_sub ORDER BY created_at DESC');
    const subscriptions = stmt.all() as KeywordSub[];
    
    // 缓存60秒，因为订阅变化不频繁
    this.setCache(cacheKey, subscriptions, 60000);
    return subscriptions;
  }

  deleteKeywordSub(id: number): boolean {
    const stmt = this.db.query('DELETE FROM keywords_sub WHERE id = ?');
    const result = stmt.run(id);
    
    // 清理相关缓存
    this.clearCacheByPattern('KeywordSubs');
    this.clearCacheByPattern('Subscriptions');
    
    return result.changes > 0;
  }

  updateKeywordSub(id: number, sub: Partial<Omit<KeywordSub, 'id' | 'created_at' | 'updated_at'>>): KeywordSub | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (sub.keyword1 !== undefined) {
      updates.push('keyword1 = ?');
      values.push(sub.keyword1 || null);
    }
    if (sub.keyword2 !== undefined) {
      updates.push('keyword2 = ?');
      values.push(sub.keyword2 || null);
    }
    if (sub.keyword3 !== undefined) {
      updates.push('keyword3 = ?');
      values.push(sub.keyword3 || null);
    }
    if (sub.creator !== undefined) {
      updates.push('creator = ?');
      values.push(sub.creator || null);
    }
    if (sub.category !== undefined) {
      updates.push('category = ?');
      values.push(sub.category || null);
    }

    if (updates.length === 0) {
      return this.getKeywordSubById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.query(`
      UPDATE keywords_sub 
      SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `);

    return stmt.get(...values) as KeywordSub | null;
  }

  getKeywordSubById(id: number): KeywordSub | null {
    const stmt = this.db.query('SELECT * FROM keywords_sub WHERE id = ?');
    return stmt.get(id) as KeywordSub | null;
  }

  // 数据库初始化检查
  isInitialized(): boolean {
    try {
      // 首先检查数据库表是否存在
      if (!this.checkTablesExist()) {
        return false;
      }
      
      // 然后检查是否有基础配置
      const config = this.getBaseConfig();
      return config !== null;
    } catch (error) {
      logger.error('检查数据库初始化状态失败:', error);
      return false;
    }
  }

  // 统计查询方法（使用 COUNT 提高效率和缓存）
  getPostsCount(): number {
    const cacheKey = this.getCacheKey('getPostsCount', []);
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const stmt = this.db.query(`
      SELECT COUNT(*) as count FROM posts
    `);
    const result = stmt.get() as { count: number };
    const count = result?.count || 0;
    this.setCache(cacheKey, count, 30000); // 30秒缓存
    return count;
  }

  getPostsCountByStatus(pushStatus: number): number {
    const cacheKey = this.getCacheKey('getPostsCountByStatus', [pushStatus]);
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const stmt = this.db.query(`
      SELECT COUNT(*) as count FROM posts
      WHERE push_status = ?
    `);
    const result = stmt.get(pushStatus) as { count: number };
    const count = result?.count || 0;
    this.setCache(cacheKey, count, 30000); // 30秒缓存
    return count;
  }

  getSubscriptionsCount(): number {
    const cacheKey = this.getCacheKey('getSubscriptionsCount', []);
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const stmt = this.db.query(`SELECT COUNT(*) as count FROM keywords_sub`);
    const result = stmt.get() as { count: number };
    const count = result?.count || 0;
    this.setCache(cacheKey, count, 60000); // 1分钟缓存（关键词变化较少）
    return count;
  }

  getTodayPostsCount(): number {
    const cacheKey = this.getCacheKey('getTodayPostsCount', []);
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const today = new Date().toISOString().split('T')[0];
    const stmt = this.db.query(`
      SELECT COUNT(*) as count FROM posts
      WHERE date(created_at) = date(?)
    `);
    const result = stmt.get(today) as { count: number };
    const count = result?.count || 0;
    this.setCache(cacheKey, count, 60000);
    return count;
  }

  getTodayPushedCount(): number {
    const cacheKey = this.getCacheKey('getTodayPushedCount', []);
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const today = new Date().toISOString().split('T')[0];
    const stmt = this.db.query(`
      SELECT COUNT(*) as count FROM posts
      WHERE push_status = 3 AND date(created_at) = date(?)
    `);
    const result = stmt.get(today) as { count: number };
    const count = result?.count || 0;
    this.setCache(cacheKey, count, 60000);
    return count;
  }

  getTodayMessagesCount(): number {
    const cacheKey = this.getCacheKey('getTodayMessagesCount', []);
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const today = new Date().toISOString().split('T')[0];
    const stmt = this.db.query(`
      SELECT COUNT(*) as count FROM posts
      WHERE push_status = 3 AND date(push_date) = date(?)
    `);
    const result = stmt.get(today) as { count: number };
    const count = result?.count || 0;
    this.setCache(cacheKey, count, 60000);
    return count;
  }

  getPostsCountByDateRange(startDate: string, endDate: string): number {
    const cacheKey = this.getCacheKey('getPostsCountByDateRange', [startDate, endDate]);
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;
    
    const stmt = this.db.query(`
      SELECT COUNT(*) as count FROM posts 
      WHERE DATE(pub_date) BETWEEN ? AND ?
    `);
    const result = stmt.get(startDate, endDate) as { count: number };
    const count = result?.count || 0;
    this.setCache(cacheKey, count, 60000); // 1分钟缓存
    return count;
  }

  getLastUpdateTime(): string | null {
    const stmt = this.db.query(`
      SELECT created_at as last_update FROM posts order by id desc limit 1
    `);
    const result = stmt.get() as { last_update: string } | null;
    return result?.last_update || null; // 返回最后更新时间
  }

  // 获取综合统计信息
  getComprehensiveStats(): {
    total_posts: number;
    pushed_posts: number; // 已推送成功 (状态 3)
    matched_not_pushed: number; // 已匹配但未推送 (状态 1)
    total_subscriptions: number;
    today_pushed: number;
    last_update: string | null;
  } {
    try {
      const totalPosts = this.getPostsCount();
      const pushedPosts = this.getPostsCountByStatus(3); // 已推送成功
      const matchedNotPushed = this.getPostsCountByStatus(1); // 已匹配但未推送
      const totalSubscriptions = this.getSubscriptionsCount();
      const todayPushed = this.getTodayPushedCount();
      const lastUpdate = this.getLastUpdateTime();

      return {
        total_posts: totalPosts,
        pushed_posts: pushedPosts,
        matched_not_pushed: matchedNotPushed,
        total_subscriptions: totalSubscriptions,
        today_pushed: todayPushed,
        last_update: lastUpdate
      };
    } catch (error) {
      logger.error('获取综合统计信息失败:', error);
      return {
        total_posts: 0,
        pushed_posts: 0,
        matched_not_pushed: 0,
        total_subscriptions: 0,
        today_pushed: 0,
        last_update: null
      };
    }
  }


  // 关闭数据库连接
  close(): void {
    this.db.close();
  }
}