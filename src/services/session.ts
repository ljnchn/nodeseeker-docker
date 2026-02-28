import { DatabaseService } from './database';
import type { SessionData, SessionVerification } from '../types';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';

export class SessionService {
  private readonly SESSION_EXPIRY_HOURS = 24 * 7; // 7天过期
  private readonly MAX_SESSIONS_PER_USER = 5; // 每个用户最多5个活跃session
  
  constructor(private dbService: DatabaseService) {
    // session表现在通过数据库迁移创建，不需要在这里初始化
  }

  /**
   * 生成安全的session ID
   */
  private generateSessionId(): string {
    // 生成128位随机数，转换为hex字符串
    return randomBytes(16).toString('hex');
  }

  /**
   * 计算过期时间
   */
  private calculateExpiryDate(): string {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.SESSION_EXPIRY_HOURS);
    return expiry.toISOString();
  }

  /**
   * 创建新的session
   */
  createSession(
    userId: number, 
    username: string, 
    ipAddress?: string, 
    userAgent?: string
  ): SessionData {
    try {
      // 清理该用户的过期session
      this.cleanupExpiredSessions(userId);
      
      // 检查并限制用户的活跃session数量
      this.limitUserSessions(userId);

      const sessionId = this.generateSessionId();
      const now = new Date().toISOString();
      const expiresAt = this.calculateExpiryDate();

      const sessionData: SessionData = {
        sessionId,
        userId,
        username,
        createdAt: now,
        lastAccessedAt: now,
        expiresAt,
        ipAddress,
        userAgent
      };

      // 插入新session
      const stmt = this.dbService.db.prepare(`
        INSERT INTO sessions (
          session_id, user_id, username, created_at, 
          last_accessed_at, expires_at, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        sessionId, userId, username, now, 
        now, expiresAt, ipAddress, userAgent
      );

      logger.debug(`创建新session: ${sessionId} for user: ${username}`);
      return sessionData;
    } catch (error) {
      logger.error('创建session失败:', error);
      throw new Error(`创建session失败: ${error}`);
    }
  }

  /**
   * 验证session
   */
  verifySession(sessionId: string, ipAddress?: string): SessionVerification {
    try {
      if (!sessionId || sessionId.trim().length === 0) {
        return { valid: false, message: 'Session ID不能为空' };
      }

      // 查询session
      const stmt = this.dbService.db.prepare(`
        SELECT * FROM sessions 
        WHERE session_id = ? AND expires_at > datetime('now')
      `);

      const row = stmt.get(sessionId) as any;
      
      if (!row) {
        return { valid: false, message: 'Session不存在或已过期' };
      }

      // 可选：检查IP地址是否匹配（增强安全性）
      if (row.ip_address && ipAddress && row.ip_address !== ipAddress) {
        logger.warn(`Session ${sessionId} IP地址不匹配: ${row.ip_address} vs ${ipAddress}`);
        // 可以选择是否严格检查IP，这里仅记录警告
      }

      // 更新最后访问时间
      this.updateLastAccessed(sessionId);

      const sessionData: SessionData = {
        sessionId: row.session_id,
        userId: row.user_id,
        username: row.username,
        createdAt: row.created_at,
        lastAccessedAt: new Date().toISOString(), // 使用当前时间
        expiresAt: row.expires_at,
        ipAddress: row.ip_address,
        userAgent: row.user_agent
      };

      return { valid: true, sessionData };
    } catch (error) {
      logger.error('验证session失败:', error);
      return { valid: false, message: `验证session失败: ${error}` };
    }
  }

  /**
   * 更新session的最后访问时间
   */
  private updateLastAccessed(sessionId: string): void {
    try {
      const stmt = this.dbService.db.prepare(`
        UPDATE sessions 
        SET last_accessed_at = datetime('now') 
        WHERE session_id = ?
      `);
      stmt.run(sessionId);
    } catch (error) {
      logger.error('更新session访问时间失败:', error);
    }
  }

  /**
   * 刷新session（延长过期时间）
   */
  refreshSession(sessionId: string): SessionVerification {
    try {
      const verification = this.verifySession(sessionId);
      if (!verification.valid || !verification.sessionData) {
        return verification;
      }

      const newExpiresAt = this.calculateExpiryDate();
      
      const stmt = this.dbService.db.prepare(`
        UPDATE sessions 
        SET expires_at = ?, last_accessed_at = datetime('now')
        WHERE session_id = ?
      `);
      
      stmt.run(newExpiresAt, sessionId);

      // 返回更新后的session数据
      verification.sessionData.expiresAt = newExpiresAt;
      verification.sessionData.lastAccessedAt = new Date().toISOString();

      logger.debug(`刷新session: ${sessionId}`);
      return verification;
    } catch (error) {
      logger.error('刷新session失败:', error);
      return { valid: false, message: `刷新session失败: ${error}` };
    }
  }

  /**
   * 销毁指定session
   */
  destroySession(sessionId: string): boolean {
    try {
      const stmt = this.dbService.db.prepare(`
        DELETE FROM sessions WHERE session_id = ?
      `);
      
      const result = stmt.run(sessionId);
      const destroyed = result.changes > 0;
      
      if (destroyed) {
        logger.debug(`销毁session: ${sessionId}`);
      }
      
      return destroyed;
    } catch (error) {
      logger.error('销毁session失败:', error);
      return false;
    }
  }

  /**
   * 销毁用户的所有session（登出所有设备）
   */
  destroyAllUserSessions(userId: number): number {
    try {
      const stmt = this.dbService.db.prepare(`
        DELETE FROM sessions WHERE user_id = ?
      `);
      
      const result = stmt.run(userId);
      const destroyedCount = result.changes;
      
      logger.debug(`销毁用户 ${userId} 的 ${destroyedCount} 个session`);
      return destroyedCount;
    } catch (error) {
      logger.error('销毁用户session失败:', error);
      return 0;
    }
  }

  /**
   * 清理过期的session
   */
  cleanupExpiredSessions(userId?: number): number {
    try {
      let sql = `DELETE FROM sessions WHERE expires_at <= datetime('now')`;
      let params: any[] = [];
      
      if (userId) {
        sql += ` AND user_id = ?`;
        params.push(userId);
      }
      
      const stmt = this.dbService.db.prepare(sql);
      const result = stmt.run(...params);
      const cleanedCount = result.changes;
      
      if (cleanedCount > 0) {
        logger.debug(`清理了 ${cleanedCount} 个过期session`);
      }
      
      return cleanedCount;
    } catch (error) {
      logger.error('清理过期session失败:', error);
      return 0;
    }
  }

  /**
   * 限制用户的活跃session数量
   */
  private limitUserSessions(userId: number): void {
    try {
      // 获取用户当前活跃session数量
      const countStmt = this.dbService.db.prepare(`
        SELECT COUNT(*) as count FROM sessions 
        WHERE user_id = ? AND expires_at > datetime('now')
      `);
      
      const { count } = countStmt.get(userId) as { count: number };
      
      if (count >= this.MAX_SESSIONS_PER_USER) {
        // 删除最旧的session
        const deleteStmt = this.dbService.db.prepare(`
          DELETE FROM sessions 
          WHERE user_id = ? 
          ORDER BY last_accessed_at ASC 
          LIMIT ?
        `);
        
        const toDelete = count - this.MAX_SESSIONS_PER_USER + 1;
        const result = deleteStmt.run(userId, toDelete);
        
        logger.debug(`用户 ${userId} session数量超限，删除了 ${result.changes} 个旧session`);
      }
    } catch (error) {
      logger.error('限制用户session数量失败:', error);
    }
  }

  /**
   * 获取用户的活跃session列表
   */
  getUserSessions(userId: number): SessionData[] {
    try {
      const stmt = this.dbService.db.prepare(`
        SELECT * FROM sessions 
        WHERE user_id = ? AND expires_at > datetime('now')
        ORDER BY last_accessed_at DESC
      `);
      
      const rows = stmt.all(userId) as any[];
      
      return rows.map(row => ({
        sessionId: row.session_id,
        userId: row.user_id,
        username: row.username,
        createdAt: row.created_at,
        lastAccessedAt: row.last_accessed_at,
        expiresAt: row.expires_at,
        ipAddress: row.ip_address,
        userAgent: row.user_agent
      }));
    } catch (error) {
      logger.error('获取用户session列表失败:', error);
      return [];
    }
  }

  /**
   * 获取session统计信息
   */
  getSessionStats(): { 
    totalSessions: number; 
    activeSessions: number; 
    expiredSessions: number; 
  } {
    try {
      const totalStmt = this.dbService.db.prepare(`
        SELECT COUNT(*) as count FROM sessions
      `);
      const { count: totalSessions } = totalStmt.get() as { count: number };

      const activeStmt = this.dbService.db.prepare(`
        SELECT COUNT(*) as count FROM sessions 
        WHERE expires_at > datetime('now')
      `);
      const { count: activeSessions } = activeStmt.get() as { count: number };

      const expiredSessions = totalSessions - activeSessions;

      return { totalSessions, activeSessions, expiredSessions };
    } catch (error) {
      logger.error('获取session统计信息失败:', error);
      return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 };
    }
  }
}