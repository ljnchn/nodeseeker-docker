// 初始化页面 JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const initForm = document.getElementById('initForm');
  const messageDiv = document.getElementById('message');

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

  // 检查数据库状态
  async function checkDatabaseStatus() {
    try {
      const response = await fetch('/api/db/status');
      const result = await response.json();
      
      if (result.success) {
        const { tablesExist, initialized } = result.data;
        
        if (!tablesExist) {
          showMessage('正在初始化数据库...', 'info');
          await initializeDatabase();
        } else if (initialized) {
          showMessage('系统已经初始化，正在跳转到登录页面...', 'info');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          return false; // 阻止表单显示
        }
      }
      return true; // 允许表单显示
    } catch (error) {
      console.error('检查数据库状态失败:', error);
      showMessage('检查系统状态失败，请刷新页面重试', 'error');
      return false;
    }
  }

  // 初始化数据库
  async function initializeDatabase() {
    try {
      const response = await fetch('/api/db/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage('数据库初始化成功，请设置管理员账户', 'success');
        return true;
      } else {
        showMessage(result.message || '数据库初始化失败', 'error');
        return false;
      }
    } catch (error) {
      console.error('数据库初始化失败:', error);
      showMessage('数据库初始化失败，请重试', 'error');
      return false;
    }
  }

  // 页面加载时检查数据库状态
  checkDatabaseStatus().then(canShowForm => {
    if (!canShowForm) {
      initForm.style.display = 'none';
      return;
    }
  });

  // 表单提交处理
  initForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(initForm);
    const data = {
      username: formData.get('username'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    };

    // 基础验证
    if (!data.username || !data.password || !data.confirmPassword) {
      showMessage('请填写所有字段', 'error');
      return;
    }

    if (data.password !== data.confirmPassword) {
      showMessage('两次输入的密码不一致', 'error');
      return;
    }

    if (data.password.length < 6) {
      showMessage('密码长度至少6个字符', 'error');
      return;
    }

    try {
      showMessage('正在初始化系统...', 'info');
      
      const response = await fetch('/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        showMessage('系统初始化成功！正在跳转...', 'success');
        
        // 保存 sessionId
        localStorage.setItem('sessionId', result.data.sessionId);
        
        // 跳转到控制台
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        showMessage(result.message || '初始化失败', 'error');
      }
    } catch (error) {
      console.error('初始化错误:', error);
      showMessage('网络错误，请重试', 'error');
    }
  });

  // 输入验证
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  confirmPasswordInput.addEventListener('input', function() {
    if (passwordInput.value && confirmPasswordInput.value) {
      if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity('密码不一致');
      } else {
        confirmPasswordInput.setCustomValidity('');
      }
    }
  });
});