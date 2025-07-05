import { API_CONFIG, SPEECH_KEYWORDS, DIRECTIONS } from '../utils/constants';
import { pinyinMatcher } from '../utils/pinyinMatcher.js';
import logService from './logService';

class SpeechService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isListening = false;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.vadThreshold = 0.01; // 语音检测阈值
    this.silenceTimeout = 1500; // 静音超时时间(ms)
    this.minSpeechDuration = 300; // 最小语音持续时间(ms)
    this.silenceTimer = null;
    this.speechStartTime = null;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onVolumeChange = null;
  }

  // 检查浏览器是否支持录音
  checkSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        reason: '您的浏览器不支持录音功能'
      };
    }

    // 检查是否为HTTPS或localhost
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    if (!isSecure) {
      return {
        supported: false,
        reason: '录音功能需要HTTPS连接，请使用HTTPS访问或在localhost测试'
      };
    }

    return {
      supported: true,
      reason: '支持录音功能'
    };
  }

  // 请求麦克风权限
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      return stream;
    } catch (error) {
      logService.error('麦克风权限被拒绝', error);
      throw new Error('需要麦克风权限才能进行语音识别');
    }
  }

  // 开始录音
  async startRecording() {
    if (this.isRecording) return;

    try {
      const stream = await this.requestMicrophonePermission();
      
      this.audioChunks = [];
      // 尝试不同的音频格式，优先使用API支持的格式
      const supportedTypes = [
        'audio/wav',
        'audio/mp3',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/webm;codecs=opus',
        'audio/webm'
      ];

      let mimeType = '';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      logService.speechLog('使用音频格式', mimeType);

      this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      logService.speechLog('开始录音...');
    } catch (error) {
      logService.error('开始录音失败', error);
      throw error;
    }
  }

  // 停止录音并返回音频数据
  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return null;

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = async () => {
        try {
          // 使用录制时的格式
          const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          
          // 停止所有音频轨道
          const stream = this.mediaRecorder.stream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          
          this.isRecording = false;
          logService.speechLog('录音结束，音频大小', audioBlob.size);
          resolve(audioBlob);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.onerror = (error) => {
        reject(error);
      };

      this.mediaRecorder.stop();
    });
  }

  // 将音频发送到Whisper API进行识别
  async transcribeAudio(audioBlob) {
    try {
      logService.apiLog('准备发送音频到API', { size: audioBlob.size, type: audioBlob.type });

      // 检查音频大小
      if (audioBlob.size === 0) {
        throw new Error('录制的音频文件为空');
      }

      if (audioBlob.size > 25 * 1024 * 1024) { // 25MB限制
        throw new Error('音频文件太大，超过25MB限制');
      }

      // 确定正确的文件名和扩展名
      let fileName = 'audio.webm'; // 默认
      const mimeType = audioBlob.type.toLowerCase();

      if (mimeType.includes('wav')) {
        fileName = 'audio.wav';
      } else if (mimeType.includes('mp3')) {
        fileName = 'audio.mp3';
      } else if (mimeType.includes('mp4')) {
        fileName = 'audio.mp4';
      } else if (mimeType.includes('ogg')) {
        fileName = 'audio.ogg';
      } else if (mimeType.includes('webm')) {
        fileName = 'audio.webm';
      }

      logService.apiLog('音频文件信息', { fileName, mimeType });

      const formData = new FormData();
      formData.append('file', audioBlob, fileName);
      formData.append('model', API_CONFIG.WHISPER_MODEL);
      // 指定中文语言以提高识别准确率
      formData.append('language', 'zh');
      // 添加提示词来提高方向词识别准确率
      formData.append('prompt', '这是关于方向的语音：上下左右，向上向下向左向右');

      // 打印FormData内容用于调试
      logService.apiLog('FormData内容准备完成');
      const formDataInfo = {};
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          formDataInfo[key] = `File(${value.name}, ${value.size}bytes, ${value.type})`;
        } else {
          formDataInfo[key] = value;
        }
      }
      logService.apiLog('FormData详情', formDataInfo);

      logService.apiLog('发送API请求', {
        url: `${API_CONFIG.BASE_URL}/audio/transcriptions`,
        model: API_CONFIG.WHISPER_MODEL,
        audioSize: audioBlob.size,
        audioType: audioBlob.type
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`
        },
        body: formData
      });

      logService.apiLog('API响应状态', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          logService.error('API错误响应原文', errorText);

          // 尝试解析JSON错误
          try {
            const errorJson = JSON.parse(errorText);
            logService.error('API错误JSON', errorJson);
          } catch (e) {
            logService.error('错误响应不是JSON格式');
          }
        } catch (e) {
          errorText = `无法读取错误信息: ${e.message}`;
        }
        logService.error('API错误响应', errorText);
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      let result;
      try {
        result = await response.json();
        logService.apiLog('API响应结果', result);
      } catch (e) {
        const text = await response.text();
        logService.error('JSON解析失败，原始响应', text);
        throw new Error(`响应格式错误: ${e.message}`);
      }

      // 检查响应格式
      if (result && typeof result.text === 'string') {
        logService.speechLog('语音识别成功', result.text);
        return result.text;
      } else {
        logService.error('意外的响应格式', result);
        throw new Error('API返回了意外的响应格式');
      }
    } catch (error) {
      logService.error('语音识别失败', error);
      throw error;
    }
  }

  // 计算字符串相似度（编辑距离）
  calculateSimilarity(str1, str2) {
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

  // 解析识别结果，提取方向 - 简化版本，统一处理逻辑
  parseDirection(text) {
    if (!text) {
      logService.speechLog('parseDirection: 输入为空');
      return null;
    }

    const cleanText = text.toLowerCase().trim();
    logService.speechLog('parseDirection 输入', { original: text, cleaned: cleanText });

    // 1. 直接关键词匹配 - 按长度排序，优先匹配长词组
    const sortedKeywords = Object.entries(SPEECH_KEYWORDS)
      .sort(([a], [b]) => b.length - a.length);

    for (const [keyword, direction] of sortedKeywords) {
      if (cleanText.includes(keyword.toLowerCase())) {
        logService.speechLog('✅ 关键词匹配成功', { keyword, direction });
        return direction;
      }
    }

    // 2. 拼音匹配 - 处理同音字
    const pinyinResult = pinyinMatcher.matchDirectionByPinyin(cleanText);
    if (pinyinResult) {
      logService.speechLog('✅ 拼音匹配成功', { text: cleanText, result: pinyinResult });
      return pinyinResult;
    }

    logService.speechLog('❌ 未匹配到方向词', cleanText);
    return null;
  }

  // 完整的语音识别流程
  async recognizeSpeech(timeoutMs = 5000) {
    try {
      await this.startRecording();
      
      // 设置录音超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('录音超时')), timeoutMs);
      });
      
      const recordingPromise = new Promise((resolve) => {
        setTimeout(async () => {
          const audioBlob = await this.stopRecording();
          resolve(audioBlob);
        }, timeoutMs);
      });
      
      const audioBlob = await Promise.race([recordingPromise, timeoutPromise]);
      
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('没有录制到音频数据');
      }
      
      const text = await this.transcribeAudio(audioBlob);
      const direction = this.parseDirection(text);
      
      return {
        text,
        direction,
        success: direction !== null
      };
    } catch (error) {
      logService.error('语音识别过程出错', error);
      return {
        text: '',
        direction: null,
        success: false,
        error: error.message
      };
    }
  }

  // 开始连续语音监听 (VAD模式)
  async startContinuousListening(callbacks = {}) {
    try {
      this.onSpeechStart = callbacks.onSpeechStart;
      this.onSpeechEnd = callbacks.onSpeechEnd;
      this.onVolumeChange = callbacks.onVolumeChange;

      const stream = await this.requestMicrophonePermission();

      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);

      // 配置分析器
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      this.microphone.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isListening = true;

      logService.speechLog('开始连续语音监听...');
      this.detectSpeech();

      return true;
    } catch (error) {
      logService.error('启动连续监听失败', error);
      throw error;
    }
  }

  // 语音活动检测
  detectSpeech() {
    if (!this.isListening || !this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    // 计算音频能量
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const volume = Math.sqrt(sum / this.dataArray.length) / 255;

    // 通知音量变化
    if (this.onVolumeChange) {
      this.onVolumeChange(volume);
    }

    const isSpeaking = volume > this.vadThreshold;

    if (isSpeaking) {
      // 检测到语音
      if (!this.speechStartTime) {
        this.speechStartTime = Date.now();
        logService.speechLog('检测到语音开始');
      }

      // 清除静音计时器
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      // 如果语音持续时间足够且还未开始录音，开始录音
      const speechDuration = Date.now() - this.speechStartTime;
      if (speechDuration >= this.minSpeechDuration && !this.isRecording) {
        this.startAutoRecording();
      }
    } else {
      // 检测到静音
      if (this.speechStartTime && !this.silenceTimer) {
        // 开始静音计时
        this.silenceTimer = setTimeout(() => {
          this.handleSpeechEnd();
        }, this.silenceTimeout);
      }
    }

    // 继续检测
    if (this.isListening) {
      requestAnimationFrame(() => this.detectSpeech());
    }
  }

  // 自动开始录音
  async startAutoRecording() {
    if (this.isRecording) return;

    try {
      logService.speechLog('自动开始录音...');
      this.audioChunks = [];

      // 获取新的媒体流用于录音
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const supportedTypes = [
        'audio/wav',
        'audio/mp3',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/webm;codecs=opus',
        'audio/webm'
      ];

      let mimeType = '';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      if (this.onSpeechStart) {
        this.onSpeechStart();
      }
    } catch (error) {
      logService.error('自动录音失败', error);
    }
  }

  // 处理语音结束
  async handleSpeechEnd() {
    logService.speechLog('检测到语音结束');
    this.speechStartTime = null;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.isRecording) {
      try {
        const audioBlob = await this.stopRecording();
        if (this.onSpeechEnd && audioBlob && audioBlob.size > 0) {
          this.onSpeechEnd(audioBlob);
        }
      } catch (error) {
        logService.error('停止录音失败', error);
      }
    }
  }

  // 停止连续监听
  stopContinuousListening() {
    logService.speechLog('停止连续语音监听');
    this.isListening = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
    this.speechStartTime = null;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onVolumeChange = null;
  }

  // 设置VAD参数
  setVADConfig(config) {
    if (config.threshold !== undefined) {
      this.vadThreshold = Math.max(0, Math.min(1, config.threshold));
    }
    if (config.silenceTimeout !== undefined) {
      this.silenceTimeout = Math.max(500, config.silenceTimeout);
    }
    if (config.minSpeechDuration !== undefined) {
      this.minSpeechDuration = Math.max(100, config.minSpeechDuration);
    }
  }

  // 获取VAD配置
  getVADConfig() {
    return {
      threshold: this.vadThreshold,
      silenceTimeout: this.silenceTimeout,
      minSpeechDuration: this.minSpeechDuration
    };
  }

  // 清理资源
  cleanup() {
    this.stopContinuousListening();
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    this.audioChunks = [];
  }
}

export default new SpeechService();
