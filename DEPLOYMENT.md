# 部署指南

本文档介绍如何将翻转拍训练助手部署到生产环境，特别是使用Caddy作为HTTPS代理的方案。

## 🚀 部署方案

### 方案1: Caddy + HTTP开发服务器（推荐用于快速部署）

这种方案让应用以HTTP模式运行，通过Caddy提供HTTPS访问。

#### 1. 准备应用

```bash
# 克隆项目
git clone https://github.com/rv192/LensFlipperTraining.git
cd LensFlipperTraining

# 安装依赖
npm install

# 配置为HTTP模式
export NODE_ENV=production
export DISABLE_HTTPS=true

# 启动应用（HTTP模式）
npm run dev
```

#### 2. 配置Caddy

```bash
# 复制Caddy配置
cp Caddyfile.example Caddyfile

# 编辑配置文件，修改域名
nano Caddyfile
```

修改 `Caddyfile` 中的域名：
```
your-domain.com {
    reverse_proxy localhost:3000
    # ... 其他配置
}
```

#### 3. 启动Caddy

```bash
# 启动Caddy
caddy start

# 或者前台运行（用于调试）
caddy run
```

#### 4. 验证部署

- 访问 `https://your-domain.com`
- 检查HTTPS证书是否正常
- 测试语音识别功能
- 检查调试模式：`https://your-domain.com/debug`

### 方案2: Caddy + 静态文件（推荐用于生产环境）

这种方案构建静态文件，通过Caddy直接服务。

#### 1. 构建应用

```bash
# 构建生产版本
npm run build

# 构建结果在 dist/ 目录
ls -la dist/
```

#### 2. 配置Caddy

使用 `Caddyfile.example` 中的方案2配置：

```
your-domain.com {
    root * /path/to/your/LensFlipperTraining/dist
    file_server
    try_files {path} /index.html
    # ... 其他配置
}
```

#### 3. 启动服务

```bash
# 启动Caddy
caddy start
```

## 🔧 配置说明

### 环境变量

- `NODE_ENV=production`: 生产环境模式
- `DISABLE_HTTPS=true`: 禁用Vite的HTTPS服务器

### Caddy配置要点

1. **反向代理**: `reverse_proxy localhost:3000`
2. **HTTPS自动化**: Caddy自动获取Let's Encrypt证书
3. **安全头**: 包含HSTS、XSS保护等安全配置
4. **压缩**: 启用gzip压缩减少传输大小
5. **日志**: 记录访问日志便于监控

### 语音识别兼容性

✅ **完全兼容**: 通过Caddy代理的HTTPS访问，浏览器会识别为安全连接
✅ **麦克风权限**: 正常获取麦克风权限
✅ **WebSocket**: 阿里云WSS连接正常工作
✅ **API调用**: 所有HTTPS API调用正常

## 🛡️ 安全配置

### 1. 防火墙设置

```bash
# 只开放必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000/tcp  # 阻止直接访问应用端口
```

### 2. SSL/TLS配置

Caddy默认使用安全的TLS配置，包括：
- TLS 1.2+
- 强加密套件
- HSTS头
- 自动证书更新

### 3. 访问控制（可选）

```
your-domain.com {
    # IP白名单（如果需要）
    @allowed {
        remote_ip 192.168.1.0/24 10.0.0.0/8
    }
    
    # 拒绝其他IP
    respond @allowed "Access denied" 403
    
    reverse_proxy localhost:3000
}
```

## 📊 监控和维护

### 1. 日志监控

```bash
# 查看Caddy日志
tail -f /var/log/caddy/lens-flipper.log

# 查看应用日志
journalctl -u your-app-service -f
```

### 2. 健康检查

```bash
# 检查应用状态
curl -f https://your-domain.com/ || echo "App down"

# 检查证书有效期
caddy list-certificates
```

### 3. 自动重启（systemd）

创建 `/etc/systemd/system/lens-flipper.service`:

```ini
[Unit]
Description=Lens Flipper Training App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/LensFlipperTraining
Environment=NODE_ENV=production
Environment=DISABLE_HTTPS=true
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
systemctl enable lens-flipper
systemctl start lens-flipper
```

## 🔍 故障排除

### 常见问题

1. **语音识别不工作**
   - 检查HTTPS是否正常
   - 验证麦克风权限
   - 查看浏览器控制台错误

2. **Caddy代理失败**
   - 检查应用是否在3000端口运行
   - 验证防火墙设置
   - 查看Caddy错误日志

3. **证书问题**
   - 确保域名DNS正确指向服务器
   - 检查80端口是否可访问（Let's Encrypt验证需要）

### 调试命令

```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 测试本地连接
curl -I http://localhost:3000

# 检查Caddy配置
caddy validate --config Caddyfile

# 重载Caddy配置
caddy reload
```

## 📝 总结

通过Caddy代理HTTP应用为HTTPS是一个**完全可行且推荐的部署方案**：

✅ **语音识别正常工作**
✅ **自动HTTPS证书管理**
✅ **简化部署流程**
✅ **良好的安全性**
✅ **易于维护和监控**

这种方案特别适合：
- 快速部署到生产环境
- 不想处理复杂的SSL证书配置
- 需要负载均衡或反向代理功能
- 希望统一管理多个应用的HTTPS
