// 日志服务 - 同时输出到浏览器控制台和服务端控制台
class LogService {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.serverLogEndpoint = '/api/log'; // Vite开发服务器的日志端点
  }

  // 发送日志到服务端
  async sendToServer(level, message, data = null) {
    if (!this.isDevelopment) return; // 只在开发环境发送到服务端
    
    try {
      const logData = {
        level,
        message,
        timestamp: new Date().toISOString(),
        data: data ? JSON.stringify(data) : null,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // 使用fetch发送到开发服务器
      await fetch(this.serverLogEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      }).catch(() => {
        // 静默处理服务端日志发送失败，避免影响主要功能
      });
    } catch (error) {
      // 静默处理错误，避免日志服务本身影响应用
    }
  }

  // 统一的日志方法
  log(level, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `${timestamp}: ${message}`;
    
    // 输出到浏览器控制台
    switch (level) {
      case 'error':
        console.error(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'debug':
      default:
        console.log(formattedMessage, data || '');
        break;
    }

    // 发送到服务端（异步，不阻塞）
    this.sendToServer(level, message, data);
    
    return formattedMessage;
  }

  // 便捷方法
  debug(message, data = null) {
    return this.log('debug', message, data);
  }

  info(message, data = null) {
    return this.log('info', message, data);
  }

  warn(message, data = null) {
    return this.log('warn', message, data);
  }

  error(message, data = null) {
    return this.log('error', message, data);
  }

  // 训练相关的特殊日志方法
  trainingLog(message, data = null) {
    return this.log('info', `🎯 ${message}`, data);
  }

  speechLog(message, data = null) {
    return this.log('info', `🎤 ${message}`, data);
  }

  apiLog(message, data = null) {
    return this.log('info', `🌐 ${message}`, data);
  }

  // 测试方法 - 用于验证日志服务是否正常工作
  test() {
    this.debug('这是一条调试信息');
    this.info('这是一条信息');
    this.warn('这是一条警告');
    this.error('这是一条错误信息');
    this.trainingLog('这是训练日志');
    this.speechLog('这是语音日志');
    this.apiLog('这是API日志');
  }
}

export default new LogService();
