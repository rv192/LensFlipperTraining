# 翻转拍训练助手

一个基于Web的智能视力训练应用，使用AI语音识别技术辅助孩子进行翻转拍练习。

## 功能特点

- 🎯 **智能视力表**: 自适应屏幕大小的E字母视力表，平衡方向分布
- 🎤 **双重语音识别**: 支持Whisper API和阿里云实时语音识别
- ⏱️ **标准训练**: 2分钟标准训练时长，实时反馈
- 📊 **实时统计**: 完整的训练数据统计和历史记录
- 💾 **本地存储**: 训练历史数据本地保存，支持导出
- 📱 **完美适配**: 响应式设计，支持手机、平板、桌面
- 🔊 **音效反馈**: 正确/错误音效提示，增强训练体验
- 🐛 **调试模式**: 可选的调试信息显示，便于开发和问题排查
- 🌐 **多语言支持**: 中文和英文语音识别，智能拼音匹配

## 技术栈

- **前端框架**: React 18 + Vite
- **语音识别**: OpenAI Whisper API + 阿里云实时语音识别
- **数据存储**: LocalStorage + 结构化数据管理
- **样式系统**: 原生CSS + 响应式设计 + 移动端优化
- **开发工具**: ESLint + 热重载 + HTTPS开发服务器

## 安装和运行

### 前置要求

- Node.js 16+
- npm 或 yarn

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/rv192/LensFlipperTraining.git
cd LensFlipperTraining
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
   - **桌面端**: 打开浏览器访问 `https://localhost:3000`
   - **移动端**: 在同一网络下访问 `https://[你的IP地址]:3000`
   - **首次访问**: 浏览器会提示证书不安全，点击"继续访问"即可
   - **权限授权**: 允许浏览器访问麦克风权限
   - **开始使用**: 点击"开始训练"开始体验！

### 🔧 重要说明

- **HTTPS必需**: 项目使用HTTPS服务器，这是语音识别功能的必要条件
- **证书已包含**: 项目已包含开发用的自签名证书，无需额外配置
- **自动检测**: 如果语音识别不可用，应用会自动切换到按钮测试模式

### 📱 移动端使用说明

1. **HTTPS访问**: 移动端必须使用HTTPS才能访问麦克风
2. **证书警告**: 首次访问会提示证书不安全，点击"继续访问"
3. **权限授权**: 允许浏览器访问麦克风权限
4. **备用模式**: 如果语音不可用，会自动启用按钮测试模式

### 🐛 调试模式

应用支持可选的调试模式，用于开发和问题排查：

- **启用方式1**: 访问 `https://localhost:3000/debug`
- **启用方式2**: 访问 `https://localhost:3000/?debug=true`
- **调试信息**: 显示详细的语音识别日志、网格信息等
- **默认隐藏**: 正常使用时调试信息完全隐藏，保持界面简洁

### 🚀 生产部署

#### 方案1: Caddy代理部署（推荐）

使用Caddy将HTTP应用代理为HTTPS，语音识别功能完全正常：

```bash
# 1. 配置HTTP模式
export NODE_ENV=production
export DISABLE_HTTPS=true

# 2. 启动应用
npm run dev

# 3. 配置Caddy（参考 Caddyfile.example）
caddy run
```

#### 方案2: 静态文件部署

```bash
# 构建静态文件
npm run build

# 部署 dist/ 目录到任何静态文件服务器
```

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 使用说明

### 🎤 阿里云实时语音识别（推荐）
1. **开始训练**: 点击"开始训练"按钮
2. **授权麦克风**: 允许浏览器访问麦克风权限
3. **直接说话**: 看到高亮格子后，直接说出E字母的方向
4. **实时识别**: 无需按任何按钮，系统自动识别语音
5. **支持语言**:
   - 中文: "上"、"下"、"左"、"右"
   - 英文: "up"、"down"、"left"、"right"
   - 智能匹配: 支持拼音首字母匹配和特殊词汇处理
6. **即时反馈**: 识别成功后立即播放音效并切换到下一个格子

### 🎙️ Whisper语音识别（备选）
1. **开始训练**: 点击"开始训练"按钮
2. **按住录音**: 看到高亮格子后，按住"🎤 按住录音"按钮
3. **说出方向**: 按住按钮时说出E字母的方向，松开按钮结束录音
4. **等待识别**: 系统处理语音并给出结果
5. **支持语言**: 同上

### 📱 测试模式（移动端备用）
如果语音识别不可用，应用会自动切换到测试模式：
1. 点击"开始训练"按钮
2. 看到高亮格子后，点击对应的方向按钮
3. 支持上、下、左、右四个方向按钮
4. 同样提供完整的训练统计和音效反馈

## API配置

### 语音识别服务配置

项目支持两种语音识别服务，配置位于 `src/utils/constants.js`:

#### 1. 阿里云实时语音识别（默认推荐）
```javascript
export const ALICLOUD_CONFIG = {
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  appKey: 'your-app-key',
  // 其他配置...
};
```

#### 2. OpenAI兼容API（Whisper）
```javascript
export const API_CONFIG = {
  BASE_URL: 'https://api.72live.com',
  API_KEY: 'your-api-key',
  WHISPER_MODEL: 'whisper-3'
};
```

### 配置说明
- **阿里云服务**: 提供实时语音识别，响应速度快，准确率高
- **Whisper API**: 作为备选方案，支持按键录音模式
- **自动降级**: 如果主要服务不可用，会自动切换到备选方案或测试模式

## 项目结构

```
src/
├── components/
│   ├── EyeChart.jsx              # 智能视力表组件
│   ├── TrainingSession.jsx       # 训练会话主组件
│   ├── AlicloudConfig.jsx        # 阿里云配置组件
│   ├── FontSizeSelector.jsx      # 字体大小选择器
│   └── *.css                     # 组件样式文件
├── services/
│   ├── speechService.js          # Whisper语音识别服务
│   ├── alicloudSpeechService.js  # 阿里云实时语音识别
│   ├── alicloudTokenService.js   # 阿里云Token管理
│   ├── audioService.js           # 音频处理服务
│   ├── databaseService.js        # 本地数据库服务
│   └── logService.js             # 日志服务
├── utils/
│   ├── constants.js              # 常量和配置
│   ├── pinyinMatcher.js          # 拼音匹配工具
│   ├── responsive.js            # 响应式工具
│   └── alicloudConfig.js         # 阿里云配置工具
├── App.jsx                       # 主应用组件
├── main.jsx                      # 应用入口
└── index.css                     # 全局样式
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**注意**: 语音识别功能需要HTTPS环境或localhost才能正常工作。

## 开发说明

### 开发环境设置

1. **启用调试模式**: 访问 `https://localhost:3000/debug` 查看详细日志
2. **查看服务端日志**: 开发服务器控制台会显示客户端日志
3. **热重载**: 修改代码后自动刷新，保持开发状态

### 添加新功能

1. **组件开发**: 在 `src/components/` 中创建新组件
2. **服务集成**: 在 `src/services/` 中添加新服务
3. **配置管理**: 更新 `src/utils/constants.js` 中的配置
4. **样式优化**: 确保移动端和桌面端的响应式适配

### 调试和测试

1. **语音识别调试**:
   - 启用调试模式查看实时识别结果
   - 检查浏览器控制台的详细日志
   - 使用Network面板监控API请求

2. **移动端测试**:
   - 使用真实设备测试触摸交互
   - 验证HTTPS证书在移动端的表现
   - 测试不同屏幕尺寸的适配效果

3. **性能优化**:
   - 监控语音识别的响应时间
   - 检查内存使用情况
   - 优化音频处理性能

## 常见问题

### Q: 麦克风权限被拒绝怎么办？
A: 在浏览器地址栏点击麦克风图标，允许权限后刷新页面。

### Q: 语音识别不准确怎么办？
A: 确保环境安静，说话清晰，距离麦克风适中。

### Q: 在移动设备上无法使用？
A: 确保使用HTTPS访问，某些移动浏览器需要HTTPS才能访问麦克风。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
