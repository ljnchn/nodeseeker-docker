import { DatabaseService } from './database';
import { getEnvConfig } from '../config/env';
import * as bcrypt from 'bcryptjs';
import type { BaseConfig, JWTPayload, AuthVerification } from '../types';

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
  token?: string;
  user?: {
    username: string;
    isInitialized: boolean;
  };
}

export class AuthService {
  // 使用固定 Token，简化认证流程
  private readonly FIXED_TOKEN = 'nodeseeker-admin-token-2024';
  private readonly TOKEN_EXPIRY = '7d'; // 保留过期时间概念，但实际不过期

  constructor(private dbService: DatabaseService) {
    // 移除对 JWT_SECRET 的依赖
  }

  /**
   * 生成固定 Token
   */
  private generateToken(username: string): string {
    // 返回固定的管理员 token
    return this.FIXED_TOKEN;
  }

  /**
   * 验证固定 Token
   */
  async verifyToken(token: string): Promise<AuthVerification> {
    try {
      // 简单验证：检查 token 是否为固定值
      if (token !== this.FIXED_TOKEN) {
        return { valid: false, message: 'Token 无效' };
      }

      // 验证用户是否仍然存在
      const config = this.dbService.getBaseConfig();
      if (!config) {
        return { valid: false, message: '系统未初始化' };
      }

      // 返回固定的用户信息
      const payload: JWTPayload = {
        userId: 1,
        username: config.username
      };

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, message: `Token 验证失败: ${error}` };
    }
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
  async register(request: RegisterRequest): Promise<AuthResult> {
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

      // 生成固定 token
      const token = this.generateToken(config.username);

      return {
        success: true,
        message: '系统初始化成功',
        token,
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
  async login(request: LoginRequest): Promise<AuthResult> {
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

      // 生成固定 token
      const token = this.generateToken(config.username);

      return {
        success: true,
        message: '登录成功',
        token,
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
   * 刷新 token（返回相同的固定 token）
   */
  async refreshToken(oldToken: string): Promise<AuthResult> {
    const verification = await this.verifyToken(oldToken);
    
    if (!verification.valid || !verification.payload) {
      return {
        success: false,
        message: verification.message || 'Token 无效'
      };
    }

    // 返回相同的固定 token
    const newToken = this.generateToken(verification.payload.username);

    return {
      success: true,
      message: 'Token 刷新成功',
      token: newToken,
      user: {
        username: verification.payload.username,
        isInitialized: true
      }
    };
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