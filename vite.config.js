import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 日志中间件
function logMiddleware() {
  return {
    name: 'log-middleware',
    configureServer(server) {
      server.middlewares.use('/api/log', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const logData = JSON.parse(body);
              const timestamp = new Date(logData.timestamp).toLocaleTimeString();
              const levelEmoji = {
                error: '❌',
                warn: '⚠️',
                info: 'ℹ️',
                debug: '🐛'
              };

              // 格式化输出到服务端控制台
              const emoji = levelEmoji[logData.level] || '📝';
              const message = `${emoji} [CLIENT] ${timestamp}: ${logData.message}`;

              // 根据日志级别使用不同的console方法
              switch (logData.level) {
                case 'error':
                  console.error(message);
                  if (logData.data) console.error('  Data:', logData.data);
                  break;
                case 'warn':
                  console.warn(message);
                  if (logData.data) console.warn('  Data:', logData.data);
                  break;
                case 'info':
                  console.info(message);
                  if (logData.data) console.info('  Data:', logData.data);
                  break;
                default:
                  console.log(message);
                  if (logData.data) console.log('  Data:', logData.data);
                  break;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              console.error('❌ [SERVER] 解析客户端日志失败:', error);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), logMiddleware()],
  server: {
    host: true,
    port: 3000,
    // 默认使用HTTP，只有明确设置ENABLE_HTTPS=true时才启用HTTPS
    https: process.env.ENABLE_HTTPS === 'true'
      ? (() => {
          const fs = require('fs');
          return {
            key: fs.readFileSync('./certs/key.pem'),
            cert: fs.readFileSync('./certs/cert.pem'),
          };
        })()
      : false
  },
  optimizeDeps: {
    exclude: ['sql.js']
  }
})
