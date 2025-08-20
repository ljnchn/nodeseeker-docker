# NodeSeeker API 文档

## 基础信息

- **Base URL**: `http://localhost:3000`
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`

## 认证流程

### 1. 检查系统状态
```http
GET /auth/status
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "initialized": false,
    "message": "系统尚未初始化"
  }
}
```

### 2. 系统初始化（首次使用）
```http
POST /auth/init
Content-Type: application/json

{
  "username": "admin",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "admin",
      "isInitialized": true
    }
  },
  "message": "系统初始化成功"
}
```

### 3. 用户登录
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

### 4. 验证 Token
```http
GET /auth/verify
Authorization: Bearer <token>
```

## 配置管理

### 获取系统配置
```http
GET /api/config
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "bot_token": "123456:ABC-DEF...",
    "chat_id": "123456789",
    "bound_user_name": "John Doe",
    "bound_user_username": "johndoe",
    "stop_push": 0,
    "only_title": 0,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 更新系统配置
```http
PUT /api/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "chat_id": "987654321",
  "stop_push": 0,
  "only_title": 1
}
```

### 设置 Telegram Bot Token
```http
POST /api/bot-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "bot_token": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
}
```

## 订阅管理

### 获取订阅列表
```http
GET /api/subscriptions
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "keyword1": "Docker",
      "keyword2": "容器",
      "keyword3": null,
      "creator": null,
      "category": "tech",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 添加订阅
```http
POST /api/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "keyword1": "Docker",
  "keyword2": "容器",
  "keyword3": "部署",
  "creator": "admin",
  "category": "tech"
}
```

### 更新订阅
```http
PUT /api/subscriptions/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "keyword1": "Kubernetes",
  "keyword2": "K8s"
}
```

### 删除订阅
```http
DELETE /api/subscriptions/1
Authorization: Bearer <token>
```

## 文章管理

### 获取文章列表
```http
GET /api/posts?page=1&limit=20&pushStatus=0&creator=admin&category=tech
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 30，最大: 100）
- `pushStatus`: 推送状态（0: 未推送, 1: 已推送, 2: 无需推送）
- `creator`: 创建者筛选
- `category`: 分类筛选

**响应示例**:
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "post_id": 12345,
        "title": "Docker 容器化部署指南",
        "memo": "详细介绍如何使用 Docker 进行应用容器化部署...",
        "category": "tech",
        "creator": "admin",
        "push_status": 0,
        "sub_id": null,
        "pub_date": "2024-01-01T00:00:00.000Z",
        "push_date": null,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "totalPages": 5
  }
}
```

### 手动抓取 RSS
```http
POST /api/rss/fetch
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "new": 5,
    "updated": 0,
    "skipped": 15
  },
  "message": "RSS 更新成功"
}
```

### 手动推送文章
```http
POST /api/posts/12345/push/1
Authorization: Bearer <token>
```

## 统计信息

### 获取系统统计
```http
GET /api/stats
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_posts": 1000,
    "unpushed_posts": 50,
    "pushed_posts": 800,
    "skipped_posts": 150,
    "total_subscriptions": 10,
    "today_posts": 25,
    "today_messages": 15,
    "last_update": "2024-01-01T12:00:00.000Z"
  }
}
```

### 获取匹配统计
```http
GET /api/match-stats
Authorization: Bearer <token>
```

## 系统管理

### 数据清理
```http
POST /api/cleanup
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "deletedCount": 100
  },
  "message": "清理完成，删除了 100 条记录"
}
```

### 验证 RSS 源
```http
GET /api/rss/validate
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "accessible": true,
    "message": "RSS 源可正常访问"
  }
}
```

### 获取定时任务状态
```http
GET /api/scheduler/status
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "rssTask": {
      "running": true,
      "nextRun": "2024-01-01T12:01:00.000Z"
    },
    "cleanupTask": {
      "running": true,
      "nextRun": "2024-01-02T02:00:00.000Z"
    }
  }
}
```

### 手动执行 RSS 任务
```http
POST /api/scheduler/rss/run
Authorization: Bearer <token>
```

## Telegram 集成

### Webhook 处理
```http
POST /telegram/webhook
Content-Type: application/json

{
  "update_id": 123456,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "date": 1640995200,
    "text": "/start"
  }
}
```

### 设置 Webhook
```http
POST /telegram/set-webhook
Authorization: Bearer <token>
Content-Type: application/json

{
  "webhookUrl": "https://your-domain.com/telegram/webhook"
}
```

### 获取 Bot 信息
```http
GET /telegram/bot-info
Authorization: Bearer <token>
```

### 发送测试消息
```http
POST /telegram/test-message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "这是一条测试消息"
}
```

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 常见错误码

- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权或 Token 无效
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

### 验证错误示例

```json
{
  "success": false,
  "message": "用户名不能为空",
  "field": "username",
  "code": "required"
}
```

## 数据模型

### BaseConfig
```typescript
interface BaseConfig {
  id?: number;
  username: string;
  password: string;
  bot_token?: string;
  chat_id: string;
  bound_user_name?: string;
  bound_user_username?: string;
  stop_push: number;
  only_title: number;
  created_at?: string;
  updated_at?: string;
}
```

### Post
```typescript
interface Post {
  id?: number;
  post_id: number;
  title: string;
  memo: string;
  category: string;
  creator: string;
  push_status: number; // 0: 未推送, 1: 已推送, 2: 无需推送
  sub_id?: number;
  pub_date: string;
  push_date?: string;
  created_at?: string;
}
```

### KeywordSub
```typescript
interface KeywordSub {
  id?: number;
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  creator?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}
```

## 使用示例

### JavaScript/Node.js
```javascript
const API_BASE = 'http://localhost:3000';
let token = '';

// 登录
async function login(username, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  const result = await response.json();
  if (result.success) {
    token = result.data.token;
  }
  return result;
}

// 获取文章列表
async function getPosts(page = 1, limit = 20) {
  const response = await fetch(`${API_BASE}/api/posts?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
}

// 添加订阅
async function addSubscription(keywords) {
  const response = await fetch(`${API_BASE}/api/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      keyword1: keywords[0],
      keyword2: keywords[1],
      keyword3: keywords[2],
    }),
  });
  
  return await response.json();
}
```

### Python
```python
import requests

class NodeSeekerAPI:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url
        self.token = None
    
    def login(self, username, password):
        response = requests.post(f'{self.base_url}/auth/login', json={
            'username': username,
            'password': password
        })
        
        result = response.json()
        if result['success']:
            self.token = result['data']['token']
        return result
    
    def get_posts(self, page=1, limit=20):
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(
            f'{self.base_url}/api/posts',
            headers=headers,
            params={'page': page, 'limit': limit}
        )
        return response.json()
    
    def add_subscription(self, keywords):
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        data = {
            'keyword1': keywords[0] if len(keywords) > 0 else None,
            'keyword2': keywords[1] if len(keywords) > 1 else None,
            'keyword3': keywords[2] if len(keywords) > 2 else None,
        }
        response = requests.post(
            f'{self.base_url}/api/subscriptions',
            headers=headers,
            json=data
        )
        return response.json()

# 使用示例
api = NodeSeekerAPI()
api.login('admin', 'password123')
posts = api.get_posts(page=1, limit=10)
```