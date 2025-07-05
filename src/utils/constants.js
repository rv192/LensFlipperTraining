// E字母的四个方向
export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down', 
  LEFT: 'left',
  RIGHT: 'right'
};

// 中文方向映射
export const DIRECTION_CHINESE = {
  [DIRECTIONS.UP]: '上',
  [DIRECTIONS.DOWN]: '下',
  [DIRECTIONS.LEFT]: '左',
  [DIRECTIONS.RIGHT]: '右'
};

// 语音识别关键词映射
export const SPEECH_KEYWORDS = {
  // 基础方向词
  '上': DIRECTIONS.UP,
  '下': DIRECTIONS.DOWN,
  '左': DIRECTIONS.RIGHT,  // 修复：说"左"对应开口向右
  '右': DIRECTIONS.LEFT,   // 修复：说"右"对应开口向左

  // 英文方向词
  'up': DIRECTIONS.UP,
  'down': DIRECTIONS.DOWN,
  'left': DIRECTIONS.RIGHT,  // 修复：说"left"对应开口向右
  'right': DIRECTIONS.LEFT,  // 修复：说"right"对应开口向左

  // 完整词组（推荐使用，识别率更高）
  '向上': DIRECTIONS.UP,
  '向下': DIRECTIONS.DOWN,
  '向左': DIRECTIONS.RIGHT,  // 修复：说"向左"对应开口向右
  '向右': DIRECTIONS.LEFT,   // 修复：说"向右"对应开口向左
  '往上': DIRECTIONS.UP,
  '往下': DIRECTIONS.DOWN,
  '往左': DIRECTIONS.RIGHT,
  '往右': DIRECTIONS.LEFT,
  '朝上': DIRECTIONS.UP,
  '朝下': DIRECTIONS.DOWN,
  '朝左': DIRECTIONS.RIGHT,
  '朝右': DIRECTIONS.LEFT,

  // 常见误识别词映射
  // "上"的常见误识别
  '商': DIRECTIONS.UP,
  '尚': DIRECTIONS.UP,
  '伤': DIRECTIONS.UP,
  '赏': DIRECTIONS.UP,
  '3': DIRECTIONS.UP,      // 数字3
  '三': DIRECTIONS.UP,     // 中文三（重复但保留以确保覆盖）
  '上面': DIRECTIONS.UP,
  '上方': DIRECTIONS.UP,

  // "下"的常见误识别
  '夏': DIRECTIONS.DOWN,
  '下面': DIRECTIONS.DOWN,
  '下方': DIRECTIONS.DOWN,
  '吓': DIRECTIONS.DOWN,

  // "左"的常见误识别
  '做': DIRECTIONS.RIGHT,
  '作': DIRECTIONS.RIGHT,
  '坐': DIRECTIONS.RIGHT,
  '左边': DIRECTIONS.RIGHT,
  '左侧': DIRECTIONS.RIGHT,
  '左面': DIRECTIONS.RIGHT,

  // "右"的常见误识别
  '有': DIRECTIONS.LEFT,
  '又': DIRECTIONS.LEFT,
  '右边': DIRECTIONS.LEFT,
  '右侧': DIRECTIONS.LEFT,
  '右面': DIRECTIONS.LEFT,

  // 数字表示（有些用户可能会说数字）
  '一': DIRECTIONS.UP,     // 1点钟方向-上
  // '三': DIRECTIONS.RIGHT,  // 注释掉，避免与"三"→"上"的映射冲突
  '六': DIRECTIONS.DOWN,   // 6点钟方向-下
  '九': DIRECTIONS.LEFT,   // 9点钟方向-左（对应开口向左）

  // 其他可能的表达
  '顶': DIRECTIONS.UP,
  '底': DIRECTIONS.DOWN,
  '东': DIRECTIONS.RIGHT,
  '西': DIRECTIONS.LEFT,
  '南': DIRECTIONS.DOWN,
  '北': DIRECTIONS.UP
};

// 训练配置
export const TRAINING_CONFIG = {
  DURATION: 120, // 2分钟 = 120秒
  GRID_ROWS: 6,
  GRID_COLS: 8,
  AUDIO_TIMEOUT: 5000, // 5秒录音超时
};

// E字母大小配置
export const FONT_SIZE_CONFIG = {
  small: {
    name: '小',
    desktop: '18px',
    mobile: '16px',
    scale: 0.7
  },
  medium: {
    name: '中',
    desktop: '24px',
    mobile: '20px',
    scale: 1.0
  },
  large: {
    name: '大',
    desktop: '32px',
    mobile: '28px',
    scale: 1.4
  }
};

// 响应式网格配置
export const RESPONSIVE_GRID_CONFIG = {
  // 大屏幕 (>= 1200px)
  large: {
    rows: 6,
    cols: 8
  },
  // 中等屏幕 (768px - 1199px)
  medium: {
    rows: 5,
    cols: 7
  },
  // 小屏幕 (481px - 767px)
  small: {
    rows: 4,
    cols: 6
  },
  // 超小屏幕 (<= 480px)
  xsmall: {
    rows: 3,
    cols: 5
  },
  // 移动端大屏 (iPhone Plus/Max 等)
  'mobile-large': {
    rows: 5,
    cols: 6
  },
  // 移动端中屏 (iPhone 标准尺寸)
  'mobile-medium': {
    rows: 4,
    cols: 5
  },
  // 移动端小屏
  'mobile-small': {
    rows: 4,
    cols: 4
  },
  // 横屏小屏幕
  landscape: {
    rows: 3,
    cols: 7
  }
};

// API配置
export const API_CONFIG = {
  BASE_URL: 'https://ncnh.s8.72live.com/v1',
  API_KEY: 'sk-0RzLlo5gveF0tYKQ8rgUMbKZCFdTlLg7MAa8SOAYpBHbXdOI',
  WHISPER_MODEL: 'whisper-large-v3'
};

// 语音识别使用建议
export const SPEECH_TIPS = {
  RECOMMENDED_PHRASES: [
    '向上', '向下', '向左', '向右',  // 最推荐
    '往上', '往下', '往左', '往右',  // 次推荐
    '朝上', '朝下', '朝左', '朝右'   // 备选
  ],
  SINGLE_WORDS: ['上', '下', '左', '右'],  // 单字词，识别率较低
  TIPS: [
    '推荐使用"向上"、"向下"、"向左"、"向右"等完整词组',
    '避免使用单字"上下左右"，容易被误识别',
    '说话清晰，语速适中',
    '在安静环境中使用效果更佳'
  ]
};
