# 翻转拍训练助手

一个基于Web的智能视力训练应用，使用AI语音识别技术辅助孩子进行翻转拍练习。

## 功能特点

- 🎯 **智能视力表**: 自适应屏幕大小的E字母视力表
- 🎤 **语音识别**: 使用Whisper AI模型识别孩子的发音
- ⏱️ **标准训练**: 2分钟标准训练时长
- 📊 **实时统计**: 实时显示完成格数和正确率
- 💾 **历史记录**: 本地保存训练历史数据
- 📱 **响应式设计**: 完美适配手机和平板设备

## 技术栈

- **前端**: React 18 + Vite
- **语音识别**: OpenAI Whisper API
- **数据存储**: LocalStorage
- **样式**: 原生CSS + 响应式设计

## 安装和运行

### 前置要求

- Node.js 16+ 
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd lens-flipper-training
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

4. **访问应用**
   - **桌面端**: 打开浏览器访问 `https://localhost:3000`
   - **移动端**: 访问 `https://192.168.5.194:3000` (需要接受证书警告)
   - 允许麦克风权限（如果支持）
   - 开始训练！

### 📱 移动端使用说明

1. **HTTPS访问**: 移动端必须使用HTTPS才能访问麦克风
2. **证书警告**: 首次访问会提示证书不安全，点击"继续访问"
3. **权限授权**: 允许浏览器访问麦克风权限
4. **备用模式**: 如果语音不可用，会自动启用按钮测试模式

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

## 使用说明

### 🎤 语音模式（推荐）
1. **开始训练**: 点击"开始训练"按钮
2. **授权麦克风**: 允许浏览器访问麦克风权限
3. **按住录音**: 看到高亮格子后，按住"🎤 按住录音"按钮
4. **说出方向**: 按住按钮时说出E字母的方向，松开按钮结束录音
5. **支持语言**:
   - 中文: "上"、"下"、"左"、"右"
   - 英文: "up"、"down"、"left"、"right"
6. **查看结果**: 训练结束后查看详细统计

### 📱 测试模式（移动端备用）
如果语音识别不可用（如HTTP环境或权限问题），应用会自动切换到测试模式：
1. 点击"开始训练"按钮
2. 看到高亮格子后，点击对应的方向按钮
3. 支持上、下、左、右四个方向按钮
4. 同样提供完整的训练统计

## API配置

项目使用OpenAI兼容的API进行语音识别，配置位于 `src/utils/constants.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'https://api.72live.com',
  API_KEY: 'your-api-key',
  WHISPER_MODEL: 'whisper-3'
};
```

## 项目结构

```
src/
├── components/
│   ├── EyeChart.jsx          # 视力表组件
│   ├── TrainingSession.jsx   # 训练会话组件
│   └── *.css                 # 组件样式
├── services/
│   ├── speechService.js      # 语音识别服务
│   └── databaseService.js    # 数据库服务
├── utils/
│   └── constants.js          # 常量配置
├── App.jsx                   # 主应用组件
└── main.jsx                  # 应用入口
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**注意**: 语音识别功能需要HTTPS环境或localhost才能正常工作。

## 开发说明

### 添加新功能

1. 在 `src/components/` 中创建新组件
2. 在 `src/services/` 中添加新服务
3. 更新 `src/utils/constants.js` 中的配置

### 调试语音识别

1. 打开浏览器开发者工具
2. 查看Console中的语音识别日志
3. 检查Network面板中的API请求

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
