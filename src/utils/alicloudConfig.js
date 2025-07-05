// 阿里云配置
// 注意：在生产环境中，AccessKey信息应该通过后端服务获取，不应直接暴露在前端代码中

export const ALICLOUD_CONFIG = {
  // 阿里云访问凭证
  accessKeyId: 'LTAI5tAF5UmSBYqiuycXL2fc',
  accessKeySecret: 'u8AjhOWN9ygpkOYH8cChJz7DHPkkvX',

  // 智能语音交互项目配置
  appKey: 'k16uhjdpBqvpCOqU',
  
  // 地域配置
  region: 'cn-shanghai', // 可选: cn-shanghai, cn-beijing, cn-shenzhen
  
  // 实时语音识别参数
  speechConfig: {
    // 音频格式
    format: 'pcm',

    // 采样率 (8000 或 16000)
    sampleRate: 16000,

    // 是否返回中间识别结果
    enableIntermediateResult: true,

    // 是否在后处理中添加标点
    enablePunctuationPrediction: false, // 关闭标点，避免影响方向词识别

    // 是否将中文数字转为阿拉伯数字
    enableInverseTextNormalization: false, // 关闭数字转换，保持原始识别结果

    // 语音断句检测阈值 (200ms-6000ms) - 缩短以提高响应速度
    maxSentenceSilence: 500,

    // 是否开启返回词信息
    enableWords: false,

    // 过滤语气词，即声音顺滑 - 关闭以保留所有识别内容
    disfluency: false,

    // 是否开启语义断句 - 关闭以避免影响短词识别
    enableSemanticSentenceDetection: false,

    // 自定义热词，提高特定词汇识别准确率
    customizationId: '', // 如果有自定义模型可以在这里配置

    // 语言模型 - 明确指定中文
    language: 'zh-CN',

    // 强制中文识别，禁用多语言检测
    enableLanguageDetection: false,

    // 设置识别场景为通用场景
    scene: 'default'
  }
};

// 获取WebSocket服务地址
export function getWebSocketUrl(region = 'cn-shanghai') {
  const regionMap = {
    'cn-shanghai': 'wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1',
    'cn-beijing': 'wss://nls-gateway-cn-beijing.aliyuncs.com/ws/v1',
    'cn-shenzhen': 'wss://nls-gateway-cn-shenzhen.aliyuncs.com/ws/v1'
  };
  
  // 默认使用就近地域智能接入
  return regionMap[region] || 'wss://nls-gateway.aliyuncs.com/ws/v1';
}

// 配置验证
export function validateConfig(config) {
  const errors = [];
  
  if (!config.accessKeyId) {
    errors.push('缺少 accessKeyId');
  }
  
  if (!config.accessKeySecret) {
    errors.push('缺少 accessKeySecret');
  }
  
  if (!config.appKey) {
    errors.push('缺少 appKey');
  }
  
  if (errors.length > 0) {
    throw new Error('阿里云配置不完整: ' + errors.join(', '));
  }
  
  return true;
}

// 配置说明
export const CONFIG_INSTRUCTIONS = {
  accessKeyId: '在阿里云控制台 > 访问控制 > 用户 > AccessKey管理中获取',
  accessKeySecret: '在阿里云控制台 > 访问控制 > 用户 > AccessKey管理中获取',
  appKey: '在阿里云控制台 > 智能语音交互 > 全部项目中创建项目后获取',
  region: '选择离您最近的地域以获得最佳性能',
  
  steps: [
    '1. 登录阿里云控制台 (https://ecs.console.aliyun.com)',
    '2. 开通智能语音交互服务',
    '3. 创建AccessKey (建议创建子用户并授权)',
    '4. 在智能语音交互控制台创建项目',
    '5. 将配置信息填入 src/utils/alicloudConfig.js',
    '6. 重启应用'
  ]
};
