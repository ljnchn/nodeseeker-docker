import { DatabaseService } from './database';
import { SessionService } from './session';
import { getEnvConfig } from '../config/env';
import * as bcrypt from 'bcryptjs';
import type { BaseConfig, SessionData, AuthVerification } from '../types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  sessionId?: string;
  sessionData?: SessionData;
  user?: {
    username: string;
    isInitialized: boolean;
  };
}

export class AuthService {
  private sessionService: SessionService;

  constructor(private dbService: DatabaseService) {
    this.sessionService = new SessionService(dbService);
  }

  /**
   * 验证session
   */
  async verifySession(sessionId: string, ipAddress?: string): Promise<AuthVerification> {
    try {
      const verification = this.sessionService.verifySession(sessionId, ipAddress);
      
      if (!verification.valid || !verification.sessionData) {
        return { valid: false, message: verification.message || 'Session无效' };
      }

      // 验证用户是否仍然存在
      const config = this.dbService.getBaseConfig();
      if (!config || config.username !== verification.sessionData.username) {
        // 用户不存在，销毁session
        this.sessionService.destroySession(sessionId);
        return { valid: false, message: '用户不存在' };
      }

      return { 
        valid: true, 
        sessionData: verification.sessionData,
        // 为了向后兼容，保留payload格式
        payload: {
          userId: verification.sessionData.userId,
          username: verification.sessionData.username
        }
      };
    } catch (error) {
      console.error('验证session失败:', error);
      return { valid: false, message: `Session验证失败: ${error}` };
    }
  }

  /**
   * 验证token（向后兼容方法，实际验证session）
   */
  async verifyToken(token: string, ipAddress?: string): Promise<AuthVerification> {
    return this.verifySession(token, ipAddress);
  }

  /**
   * 哈希密码
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * 用户注册（初始化）
   */
  async register(request: RegisterRequest, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // 检查是否已经初始化
      const isInitialized = this.dbService.isInitialized();
      if (isInitialized) {
        return {
          success: false,
          message: '系统已经初始化，无法重复注册'
        };
      }

      // 验证输入
      const validation = this.validateRegisterInput(request);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // 哈希密码
      const hashedPassword = await this.hashPassword(request.password);

      // 创建用户配置
      const config = this.dbService.createBaseConfig({
        username: request.username,
        password: hashedPassword,
        chat_id: '', // 初始为空，等待 Telegram 绑定
        stop_push: 0,
        only_title: 0
      });

      // 创建session
      const sessionData = this.sessionService.createSession(
        1, // 固定用户ID为1（单用户系统）
        config.username,
        ipAddress,
        userAgent
      );

      return {
        success: true,
        message: '系统初始化成功',
        sessionId: sessionData.sessionId,
        sessionData,
        user: {
          username: config.username,
          isInitialized: true
        }
      };
    } catch (error) {
      console.error('注册失败:', error);
      return {
        success: false,
        message: `注册失败: ${error}`
      };
    }
  }

  /**
   * 用户登录
   */
  async login(request: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // 获取用户配置
      const config = this.dbService.getBaseConfig();
      if (!config) {
        return {
          success: false,
          message: '系统尚未初始化，请先注册'
        };
      }

      // 验证用户名
      if (config.username !== request.username) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 验证密码
      const isPasswordValid = await this.verifyPassword(request.password, config.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 创建新session
      const sessionData = this.sessionService.createSession(
        1, // 固定用户ID为1（单用户系统）
        config.username,
        ipAddress,
        userAgent
      );

      return {
        success: true,
        message: '登录成功',
        sessionId: sessionData.sessionId,
        sessionData,
        user: {
          username: config.username,
          isInitialized: true
        }
      };
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: `登录失败: ${error}`
      };
    }
  }

  /**
   * 刷新session
   */
  async refreshSession(sessionId: string): Promise<AuthResult> {
    const verification = this.sessionService.refreshSession(sessionId);
    
    if (!verification.valid || !verification.sessionData) {
      return {
        success: false,
        message: verification.message || 'Session无效'
      };
    }

    return {
      success: true,
      message: 'Session刷新成功',
      sessionId: verification.sessionData.sessionId,
      sessionData: verification.sessionData,
      user: {
        username: verification.sessionData.username,
        isInitialized: true
      }
    };
  }

  /**
   * 刷新token（向后兼容方法）
   */
  async refreshToken(oldToken: string): Promise<AuthResult> {
    return this.refreshSession(oldToken);
  }

  /**
   * 登出（销毁session）
   */
  async logout(sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const destroyed = this.sessionService.destroySession(sessionId);
      
      return {
        success: destroyed,
        message: destroyed ? '登出成功' : 'Session不存在或已过期'
      };
    } catch (error) {
      console.error('登出失败:', error);
      return {
        success: false,
        message: `登出失败: ${error}`
      };
    }
  }

  /**
   * 登出所有设备
   */
  async logoutAllDevices(userId: number = 1): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const count = this.sessionService.destroyAllUserSessions(userId);
      
      return {
        success: true,
        message: `已登出 ${count} 个设备`,
        count
      };
    } catch (error) {
      console.error('登出所有设备失败:', error);
      return {
        success: false,
        message: `登出所有设备失败: ${error}`,
        count: 0
      };
    }
  }

  /**
   * 获取用户的活跃session列表
   */
  getUserSessions(userId: number = 1): SessionData[] {
    return this.sessionService.getUserSessions(userId);
  }

  /**
   * 修改密码
   */
  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const config = this.dbService.getBaseConfig();
      if (!config || config.username !== username) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      // 验证旧密码
      const isOldPasswordValid = await this.verifyPassword(oldPassword, config.password);
      if (!isOldPasswordValid) {
        return {
          success: false,
          message: '原密码错误'
        };
      }

      // 验证新密码
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message
        };
      }

      // 哈希新密码
      const hashedNewPassword = await this.hashPassword(newPassword);

      // 更新密码
      this.dbService.updateBaseConfig({
        password: hashedNewPassword
      });

      return {
        success: true,
        message: '密码修改成功'
      };
    } catch (error) {
      console.error('修改密码失败:', error);
      return {
        success: false,
        message: `修改密码失败: ${error}`
      };
    }
  }

  /**
   * 检查系统是否已初始化
   */
  checkInitialization(): { initialized: boolean; message: string } {
    try {
      const isInitialized = this.dbService.isInitialized();
      return {
        initialized: isInitialized,
        message: isInitialized ? '系统已初始化' : '系统尚未初始化'
      };
    } catch (error) {
      return {
        initialized: false,
        message: `检查初始化状态失败: ${error}`
      };
    }
  }

  /**
   * 验证注册输入
   */
  private validateRegisterInput(request: RegisterRequest): { valid: boolean; message: string } {
    if (!request.username || request.username.trim().length === 0) {
      return { valid: false, message: '用户名不能为空' };
    }

    if (request.username.length < 3 || request.username.length > 20) {
      return { valid: false, message: '用户名长度必须在3-20个字符之间' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(request.username)) {
      return { valid: false, message: '用户名只能包含字母、数字和下划线' };
    }

    const passwordValidation = this.validatePassword(request.password);
    if (!passwordValidation.valid) {
      return passwordValidation;
    }

    if (request.password !== request.confirmPassword) {
      return { valid: false, message: '两次输入的密码不一致' };
    }

    return { valid: true, message: '验证通过' };
  }

  /**
   * 验证密码强度
   */
  private validatePassword(password: string): { valid: boolean; message: string } {
    if (!password || password.length === 0) {
      return { valid: false, message: '密码不能为空' };
    }

    if (password.length < 6) {
      return { valid: false, message: '密码长度至少6个字符' };
    }

    if (password.length > 50) {
      return { valid: false, message: '密码长度不能超过50个字符' };
    }

    return { valid: true, message: '密码强度符合要求' };
  }
}