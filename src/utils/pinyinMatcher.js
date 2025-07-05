import { pinyin } from 'pinyin-pro';
import { SPEECH_KEYWORDS, DIRECTIONS, SPECIAL_RECOGNITION_OVERRIDES } from './constants.js';

/**
 * 拼音匹配工具类
 * 用于解决同音字识别问题
 */
export class PinyinMatcher {
  constructor() {
    // 预计算所有关键词的拼音
    this.keywordPinyinMap = this.buildKeywordPinyinMap();
    // 方向词的拼音映射
    this.directionPinyinMap = this.buildDirectionPinyinMap();
  }

  /**
   * 构建关键词拼音映射表
   */
  buildKeywordPinyinMap() {
    const map = new Map();
    
    for (const [keyword, direction] of Object.entries(SPEECH_KEYWORDS)) {
      // 只处理中文关键词
      if (/[\u4e00-\u9fa5]/.test(keyword)) {
        const pinyinStr = this.toPinyinString(keyword);
        if (!map.has(pinyinStr)) {
          map.set(pinyinStr, []);
        }
        map.get(pinyinStr).push({ keyword, direction });
      }
    }
    
    console.log('拼音映射表:', Array.from(map.entries()));
    return map;
  }

  /**
   * 构建方向词拼音映射
   */
  buildDirectionPinyinMap() {
    return {
      'shang': DIRECTIONS.UP,     // 上
      'xia': DIRECTIONS.DOWN,     // 下
      'zuo': DIRECTIONS.RIGHT,    // 左 (对应开口向右)
      'you': DIRECTIONS.LEFT,     // 右 (对应开口向左)

      // 常见同音字
      'shang1': DIRECTIONS.UP,    // 商、伤、尚等
      'xia4': DIRECTIONS.DOWN,    // 夏、吓等
      'zuo4': DIRECTIONS.RIGHT,   // 做、作、坐等
      'you3': DIRECTIONS.LEFT,    // 有、又等
      'you4': DIRECTIONS.LEFT,    // 右

      // 数字误识别
      '3': DIRECTIONS.UP,         // 数字3可能被识别为"上"
      'san': DIRECTIONS.UP,       // 三的拼音
    };
  }

  /**
   * 将中文转换为无音调拼音字符串
   */
  toPinyinString(text) {
    try {
      // 使用 pinyin-pro 转换，去除音调
      const result = pinyin(text, { 
        toneType: 'none',  // 不要音调
        type: 'string',    // 返回字符串
        separator: ''      // 不要分隔符
      });
      return result.toLowerCase();
    } catch (error) {
      console.error('拼音转换失败:', error);
      return text.toLowerCase();
    }
  }

  /**
   * 使用拼音匹配方向词 - 首字母匹配版本（极简高效）
   * 支持中文拼音和英文误识别的兼容处理
   */
  matchDirectionByPinyin(text) {
    if (!text) {
      return null;
    }

    const cleanText = text.trim().toLowerCase();

    // 1. 特殊识别结果处理（最高优先级）
    if (SPECIAL_RECOGNITION_OVERRIDES[cleanText]) {
      console.log('✅ 特殊处理匹配:', cleanText, '->', SPECIAL_RECOGNITION_OVERRIDES[cleanText]);
      return SPECIAL_RECOGNITION_OVERRIDES[cleanText];
    }

    // 2. 特殊处理：数字3
    if (cleanText === '3' || cleanText.includes('3')) {
      console.log('✅ 数字3匹配: "3" -> up');
      return DIRECTIONS.UP;
    }

    console.log('🔤 首字母匹配输入:', cleanText);

    let firstLetter;
    let matchType;

    // 检查是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(cleanText)) {
      // 中文：转换为拼音并获取首字母
      const textPinyin = this.toPinyinString(cleanText);
      firstLetter = textPinyin.charAt(0).toLowerCase();
      matchType = '中文拼音';
      console.log('🔤 中文拼音:', textPinyin, '首字母:', firstLetter);
    } else {
      // 英文或其他：直接获取首字母（兼容阿里云误识别）
      firstLetter = cleanText.charAt(0).toLowerCase();
      matchType = '英文首字母';
      console.log('🔤 英文首字母:', firstLetter);
    }

    // 首字母匹配映射 - 兼容中文拼音和英文误识别
    const firstLetterMap = {
      's': DIRECTIONS.UP,    // 上(shang) / Sha, Shot, Song 等英文误识别
      'x': DIRECTIONS.DOWN,  // 下(xia) / 可能的英文误识别
      'z': DIRECTIONS.RIGHT, // 左(zuo) / 可能的英文误识别
      'y': DIRECTIONS.LEFT,  // 右(you) / 可能的英文误识别
      // 扩展英文兼容
      'd': DIRECTIONS.DOWN,  // Down 的首字母，兼容可能的英文识别
      'l': DIRECTIONS.RIGHT, // Left 的首字母，但注意这里是"左"对应开口向右
      'r': DIRECTIONS.LEFT,  // Right 的首字母，但注意这里是"右"对应开口向左
      'u': DIRECTIONS.UP     // Up 的首字母，兼容可能的英文识别
    };

    if (firstLetterMap[firstLetter]) {
      console.log(`✅ ${matchType}首字母匹配:`, firstLetter, '->', firstLetterMap[firstLetter]);
      return firstLetterMap[firstLetter];
    }

    console.log('❌ 首字母匹配失败:', cleanText, '首字母:', firstLetter);
    return null;
  }

  /**
   * 计算拼音相似度
   */
  calculatePinyinSimilarity(text1, text2) {
    const pinyin1 = this.toPinyinString(text1);
    const pinyin2 = this.toPinyinString(text2);
    
    return this.calculateEditDistance(pinyin1, pinyin2);
  }

  /**
   * 计算编辑距离相似度
   */
  calculateEditDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
  }

  /**
   * 模糊拼音匹配
   */
  fuzzyPinyinMatch(text, minSimilarity = 0.7) {
    if (!text || !/[\u4e00-\u9fa5]/.test(text)) {
      return null;
    }

    const textPinyin = this.toPinyinString(text);
    const directionWords = ['上', '下', '左', '右'];
    
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const word of directionWords) {
      const wordPinyin = this.toPinyinString(word);
      const similarity = this.calculateEditDistance(textPinyin, wordPinyin);
      
      console.log(`🔤 模糊拼音匹配: "${text}"(${textPinyin}) vs "${word}"(${wordPinyin}) = ${similarity.toFixed(2)}`);
      
      if (similarity > bestSimilarity && similarity >= minSimilarity) {
        bestSimilarity = similarity;
        bestMatch = SPEECH_KEYWORDS[word];
      }
    }

    if (bestMatch) {
      console.log(`✅ 模糊拼音匹配成功: 相似度 ${bestSimilarity.toFixed(2)} -> 方向: "${bestMatch}"`);
    }

    return bestMatch;
  }
}

// 创建全局实例
export const pinyinMatcher = new PinyinMatcher();
