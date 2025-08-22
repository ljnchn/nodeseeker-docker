import { Hono } from 'hono'
import { AuthService } from '../services/auth'
import { DatabaseService } from '../services/database'

type Bindings = {
  ENVIRONMENT: string
}

type Variables = {
  dbService: DatabaseService
  authService: AuthService
}

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 检查初始化状态
authRoutes.get('/check-init', async (c) => {
  try {
    const authService = c.get('authService')
    const result = await authService.checkInitialization()
    
    return c.json({
      success: true,
      data: result
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `检查初始化状态失败: ${error}`
    }, 500)
  }
})

// 获取客户端信息的辅助函数
function getClientInfo(c: any): { ipAddress?: string; userAgent?: string } {
  const ipAddress = c.req.header('x-forwarded-for') || 
                   c.req.header('x-real-ip') || 
                   c.env?.CF_CONNECTING_IP || 
                   '127.0.0.1';
  const userAgent = c.req.header('user-agent');
  return { ipAddress, userAgent };
}

// 用户注册（初始化）
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password, confirmPassword } = body
    
    if (!username || !password || !confirmPassword) {
      return c.json({
        success: false,
        message: '请填写所有必填字段'
      }, 400)
    }
    
    const authService = c.get('authService')
    const { ipAddress, userAgent } = getClientInfo(c)
    
    const result = await authService.register({
      username,
      password,
      confirmPassword
    }, ipAddress, userAgent)
    
    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        sessionId: result.sessionId,
        user: result.user
      })
    } else {
      return c.json(result, 400)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: `注册失败: ${error}`
    }, 500)
  }
})

// 用户登录
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password } = body
    
    if (!username || !password) {
      return c.json({
        success: false,
        message: '请填写用户名和密码'
      }, 400)
    }
    
    const authService = c.get('authService')
    const { ipAddress, userAgent } = getClientInfo(c)
    
    const result = await authService.login({
      username,
      password
    }, ipAddress, userAgent)
    
    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        sessionId: result.sessionId,
        user: result.user
      })
    } else {
      return c.json(result, 401)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: `登录失败: ${error}`
    }, 500)
  }
})

// 验证session
authRoutes.post('/verify', async (c) => {
  try {
    const body = await c.req.json()
    const { sessionId } = body
    
    if (!sessionId) {
      return c.json({
        success: false,
        message: '请提供sessionId'
      }, 400)
    }
    
    const authService = c.get('authService')
    const { ipAddress } = getClientInfo(c)
    
    const result = await authService.verifySession(sessionId, ipAddress)
    
    return c.json({
      success: result.valid,
      message: result.message || (result.valid ? 'Session有效' : 'Session无效'),
      data: result.sessionData || result.payload
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `验证失败: ${error}`
    }, 500)
  }
})

// 刷新session
authRoutes.post('/refresh', async (c) => {
  try {
    const body = await c.req.json()
    const { sessionId } = body
    
    if (!sessionId) {
      return c.json({
        success: false,
        message: '请提供sessionId'
      }, 400)
    }
    
    const authService = c.get('authService')
    const result = await authService.refreshSession(sessionId)
    
    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        sessionId: result.sessionId,
        user: result.user
      })
    } else {
      return c.json(result, 401)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: `刷新session失败: ${error}`
    }, 500)
  }
})

// 登出
authRoutes.post('/logout', async (c) => {
  try {
    const body = await c.req.json()
    const { sessionId } = body
    
    if (!sessionId) {
      return c.json({
        success: false,
        message: '请提供sessionId'
      }, 400)
    }
    
    const authService = c.get('authService')
    const result = await authService.logout(sessionId)
    
    return c.json(result)
  } catch (error) {
    return c.json({
      success: false,
      message: `登出失败: ${error}`
    }, 500)
  }
})

// 登出所有设备
authRoutes.post('/logout-all', async (c) => {
  try {
    const authService = c.get('authService')
    const result = await authService.logoutAllDevices()
    
    return c.json(result)
  } catch (error) {
    return c.json({
      success: false,
      message: `登出所有设备失败: ${error}`
    }, 500)
  }
})

// 获取活跃session列表
authRoutes.get('/sessions', async (c) => {
  try {
    const authService = c.get('authService')
    const sessions = authService.getUserSessions()
    
    return c.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    return c.json({
      success: false,
      message: `获取session列表失败: ${error}`
    }, 500)
  }
})

// 修改密码
authRoutes.post('/change-password', async (c) => {
  try {
    const body = await c.req.json()
    const { token, oldPassword, newPassword } = body
    
    if (!token || !oldPassword || !newPassword) {
      return c.json({
        success: false,
        message: '请填写所有必填字段'
      }, 400)
    }
    
    const authService = c.get('authService')
    
    // 验证token
    const verification = await authService.verifyToken(token)
    if (!verification.valid || !verification.payload) {
      return c.json({
        success: false,
        message: verification.message || 'Token无效'
      }, 401)
    }
    
    // 修改密码
    const result = await authService.changePassword(
      verification.payload.username,
      oldPassword,
      newPassword
    )
    
    if (result.success) {
      return c.json(result)
    } else {
      return c.json(result, 400)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: `修改密码失败: ${error}`
    }, 500)
  }
})

// 初始化系统（与注册相同的逻辑，但使用不同的端点）
authRoutes.post('/init', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password, confirmPassword } = body
    
    if (!username || !password || !confirmPassword) {
      return c.json({
        success: false,
        message: '请填写所有必填字段'
      }, 400)
    }
    
    const authService = c.get('authService')
    const { ipAddress, userAgent } = getClientInfo(c)
    
    const result = await authService.register({
      username,
      password,
      confirmPassword
    }, ipAddress, userAgent)
    
    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        data: {
          sessionId: result.sessionId,
          user: result.user
        }
      })
    } else {
      return c.json(result, 400)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: `初始化失败: ${error}`
    }, 500)
  }
})