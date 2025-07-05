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
  '上': DIRECTIONS.UP,
  '下': DIRECTIONS.DOWN,
  '左': DIRECTIONS.RIGHT,  // 修复：说"左"对应开口向右
  '右': DIRECTIONS.LEFT,   // 修复：说"右"对应开口向左
  'up': DIRECTIONS.UP,
  'down': DIRECTIONS.DOWN,
  'left': DIRECTIONS.RIGHT,  // 修复：说"left"对应开口向右
  'right': DIRECTIONS.LEFT,  // 修复：说"right"对应开口向左
  '向上': DIRECTIONS.UP,
  '向下': DIRECTIONS.DOWN,
  '向左': DIRECTIONS.RIGHT,  // 修复：说"向左"对应开口向右
  '向右': DIRECTIONS.LEFT    // 修复：说"向右"对应开口向左
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
