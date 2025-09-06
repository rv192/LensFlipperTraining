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
  '左': DIRECTIONS.LEFT,   // 箭头向左
  '右': DIRECTIONS.RIGHT,  // 箭头向右
 
  // 英文方向词
  'up': DIRECTIONS.UP,
  'down': DIRECTIONS.DOWN,
  'left': DIRECTIONS.LEFT,
  'right': DIRECTIONS.RIGHT,
 
  // 完整词组（推荐使用，识别率更高）
  '向上': DIRECTIONS.UP,
  '向下': DIRECTIONS.DOWN,
  '向左': DIRECTIONS.LEFT,
  '向右': DIRECTIONS.RIGHT,
  '往上': DIRECTIONS.UP,
  '往下': DIRECTIONS.DOWN,
  '往左': DIRECTIONS.LEFT,
  '往右': DIRECTIONS.RIGHT,
  '朝上': DIRECTIONS.UP,
  '朝下': DIRECTIONS.DOWN,
  '朝左': DIRECTIONS.LEFT,
  '朝右': DIRECTIONS.RIGHT,

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
  '做': DIRECTIONS.LEFT,
  '作': DIRECTIONS.LEFT,
  '坐': DIRECTIONS.LEFT,
  '左边': DIRECTIONS.LEFT,
  '左侧': DIRECTIONS.LEFT,
  '左面': DIRECTIONS.LEFT,
 
  // "右"的常见误识别
  '有': DIRECTIONS.RIGHT,
  '又': DIRECTIONS.RIGHT,
  '6': DIRECTIONS.RIGHT,   // 数字6，常被误识别为"右"
  '右边': DIRECTIONS.RIGHT,
  '右侧': DIRECTIONS.RIGHT,
  '右面': DIRECTIONS.RIGHT,

  // 其他可能的表达
  '顶': DIRECTIONS.UP,
  '底': DIRECTIONS.DOWN,
  '东': DIRECTIONS.RIGHT,
  '西': DIRECTIONS.LEFT,
  '南': DIRECTIONS.DOWN,
  '北': DIRECTIONS.UP
};

// 常见口误配置
// 注意：在实际训练场景中，不应该存在口误，用户应该准确说出方向
// 因此这里禁用口误纠正功能，确保用户必须准确说出目标方向
export const COMMON_MISTAKES = {
  // [DIRECTIONS.LEFT]: [DIRECTIONS.RIGHT], // 用户本意是"左"，但说成了"右"
  // [DIRECTIONS.RIGHT]: [DIRECTIONS.LEFT], // 用户本意是"右"，但说成了"左"
  // 注意：上下方向通常不会混淆，所以不加入口误处理
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
  extraSmall: {
    name: '超小',
    desktop: '12px',
    mobile: '10px',
    scale: 0.4
  },
  small: {
    name: '小',
    desktop: '16px',
    mobile: '14px',
    scale: 0.6
  },
  medium: {
    name: '中',
    desktop: '20px',
    mobile: '18px',
    scale: 0.8
  },
  large: {
    name: '大',
    desktop: '26px',
    mobile: '22px',
    scale: 1.0
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

// 特殊识别结果处理配置
// 用于处理特定的误识别情况，优先级高于首字母匹配
export const SPECIAL_RECOGNITION_OVERRIDES = {
  // 完全匹配的特殊处理
  'sha': DIRECTIONS.DOWN,    // "下"经常被识别为"Sha"，应该是下而不是上
  'shot': DIRECTIONS.DOWN,   // 可能的"下"误识别
  'show': DIRECTIONS.DOWN,   // 可能的"下"误识别

  // 发音相似导致的误识别处理
  '六': DIRECTIONS.RIGHT,     // 用户说"右"，但被识别为"六"
  '6': DIRECTIONS.RIGHT,      // 用户说"右"，但被识别为数字"6"
  'liu': DIRECTIONS.RIGHT,    // 用户说"右"，但被识别为拼音"liu"

  // 可以继续添加其他特殊情况
  // 'xxx': DIRECTIONS.XXX,

  // 注意：这里的key应该是小写，匹配时会转为小写比较
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
