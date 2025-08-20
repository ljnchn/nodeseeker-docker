// 登录页面 JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('message');

  // 检查是否已经登录
  const token = localStorage.getItem('token');
  if (token) {
    // 验证 token 是否有效
    fetch('/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        window.location.href = '/dashboard';
      }
    })
    .catch(() => {
      // Token 无效，清除
      localStorage.removeItem('token');
    });
  }

  // 显示消息
  function showMessage(message, type = 'info') {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
  }

  // 隐藏消息
  function hideMessage() {
    messageDiv.style.display = 'none';
  }

  // 表单提交处理
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const data = {
      username: formData.get('username'),
      password: formData.get('password')
    };

    // 基础验证
    if (!data.username || !data.password) {
      showMessage('请填写用户名和密码', 'error');
      return;
    }

    try {
      showMessage('正在登录...', 'info');
      
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        showMessage('登录成功！正在跳转...', 'success');
        
        // 保存 token
        localStorage.setItem('token', result.data.token);
        
        // 跳转到控制台
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        showMessage(result.message || '登录失败', 'error');
      }
    } catch (error) {
      console.error('登录错误:', error);
      showMessage('网络错误，请重试', 'error');
    }
  });

  // 输入框焦点效果
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.style.borderColor = '#1976d2';
    });
    
    input.addEventListener('blur', function() {
      this.style.borderColor = '#ddd';
    });
  });
});