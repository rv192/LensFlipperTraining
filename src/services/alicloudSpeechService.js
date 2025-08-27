// 阿里云实时语音识别服务
import { SPEECH_KEYWORDS, DIRECTIONS } from '../utils/constants';
import alicloudTokenService from './alicloudTokenService';
import logService from './logService';

class AlicloudSpeechService {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.processor = null;
    this.microphone = null;
    this.taskId = null;
    this.isListening = false;
    this.listeningTimeout = null;
    
    // 回调函数
    this.onConnectionOpen = null;
    this.onConnectionClose = null;
    this.onConnectionError = null;
    this.onSentenceBegin = null;
    this.onTranscriptionChanged = null;
    this.onSentenceEnd = null;
    this.onVolumeChange = null;
    
    // 配置参数
    this.config = {
      // 这些需要从您的阿里云配置中获取
      accessKeyId: '', // 需要配置
      accessKeySecret: '', // 需要配置
      appKey: '', // 需要配置
      
      // 音频参数
      format: 'pcm',
      sampleRate: 16000,
      enableIntermediateResult: true,
      enablePunctuationPrediction: true,
      enableInverseTextNormalization: true,
      maxSentenceSilence: 800,
      enableWords: false,
      disfluency: false
    };
  }

  // 设置配置
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  // 设置回调函数
  setCallbacks(callbacks) {
    this.onConnectionOpen = callbacks.onConnectionOpen;
    this.onConnectionClose = callbacks.onConnectionClose;
    this.onConnectionError = callbacks.onConnectionError;
    this.onSentenceBegin = callbacks.onSentenceBegin;
    this.onTranscriptionChanged = callbacks.onTranscriptionChanged;
    this.onSentenceEnd = callbacks.onSentenceEnd;
    this.onVolumeChange = callbacks.onVolumeChange;
  }

  // 获取访问令牌
  async getAccessToken() {
    try {
      logService.apiLog('正在获取阿里云访问令牌...');
      return await alicloudTokenService.getAccessToken();
    } catch (error) {
      logService.error('获取阿里云访问令牌失败', error);
      throw new Error('获取访问令牌失败，请检查阿里云配置: ' + error.message);
    }
  }

  // 建立WebSocket连接
  async connect() {
    try {
      if (this.isConnected) {
        logService.apiLog('WebSocket已连接');
        return;
      }

      // 获取访问令牌
      const token = await this.getAccessToken();
      logService.apiLog('获取到访问令牌', { tokenLength: token.length });

      // 构建WebSocket URL
      const wsUrl = this.buildWebSocketUrl(token);
      logService.apiLog('WebSocket URL', wsUrl);

      logService.apiLog('正在连接阿里云实时语音识别服务...');
      this.websocket = new WebSocket(wsUrl);

      // 等待连接建立
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket连接超时'));
        }, 15000);

        this.websocket.onopen = (event) => {
          clearTimeout(timeout);
          logService.apiLog('WebSocket连接已建立');
          this.isConnected = true;

          if (this.onConnectionOpen) {
            this.onConnectionOpen(event);
          }
          resolve();
        };

        this.websocket.onmessage = this.handleWebSocketMessage.bind(this);
        this.websocket.onclose = this.handleWebSocketClose.bind(this);

        this.websocket.onerror = (event) => {
          clearTimeout(timeout);
          logService.error('WebSocket连接错误', event);
          if (this.onConnectionError) {
            this.onConnectionError(new Error('WebSocket连接失败'));
          }
          reject(new Error('WebSocket连接失败'));
        };
      });
    } catch (error) {
      logService.error('连接阿里云语音服务失败', error);
      throw error;
    }
  }

  // 构建WebSocket URL
  buildWebSocketUrl(token) {
    // 使用就近地域智能接入
    const baseUrl = 'wss://nls-gateway.aliyuncs.com/ws/v1';
    return `${baseUrl}?token=${encodeURIComponent(token)}`;
  }

  // 处理WebSocket连接打开
  handleWebSocketOpen(event) {
    logService.apiLog('WebSocket连接已建立');
    this.isConnected = true;

    if (this.onConnectionOpen) {
      this.onConnectionOpen(event);
    }
  }

  // 处理WebSocket消息
  handleWebSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);
      logService.apiLog('收到阿里云消息', message);

      const { header, payload } = message;

      // 检查状态码
      if (header.status && header.status !== 20000000) {
        logService.error('❌ 阿里云返回错误', { status: header.status, statusText: header.status_text });
        if (this.onConnectionError) {
          this.onConnectionError(new Error(`阿里云错误 ${header.status}: ${header.status_text}`));
        }
        return;
      }

      switch (header.name) {
        case 'TaskFailed':
          logService.error('❌ 任务失败', message);
          if (this.onConnectionError) {
            this.onConnectionError(new Error(header.status_text || '任务失败'));
          }
          break;

        case 'TranscriptionStarted':
          logService.speechLog('✅ 识别已开始');
          break;

        case 'SentenceBegin':
          logService.speechLog('句子开始', payload);
          if (this.onSentenceBegin) {
            this.onSentenceBegin(payload);
          }
          break;

        case 'TranscriptionResultChanged':
          logService.speechLog('识别结果变化', payload);
          if (this.onTranscriptionChanged) {
            this.onTranscriptionChanged(payload);
          }
          break;

        case 'SentenceEnd':
          logService.speechLog('句子结束', payload);
          if (this.onSentenceEnd) {
            this.onSentenceEnd(payload);
          }
          break;

        default:
          logService.speechLog('未处理的消息类型', header.name);
      }
    } catch (error) {
      logService.error('解析WebSocket消息失败', error);
    }
  }

  // 处理WebSocket连接关闭
  handleWebSocketClose(event) {
    logService.apiLog('WebSocket连接已关闭', event);
    this.isConnected = false;
    this.isRecording = false;

    if (this.onConnectionClose) {
      this.onConnectionClose(event);
    }
  }

  // 处理WebSocket错误
  handleWebSocketError(event) {
    logService.error('WebSocket错误', event);

    if (this.onConnectionError) {
      this.onConnectionError(new Error('WebSocket连接错误'));
    }
  }

  // 开始识别
  async startRecognition() {
    try {
      logService.speechLog('开始阿里云实时语音识别...');

      // 建立WebSocket连接
      await this.connect();

      // 发送开始识别指令
      await this.sendStartCommand();

      // 开始音频捕获
      await this.startAudioCapture();

      return Promise.resolve();

    } catch (error) {
      logService.error('开始识别失败', error);
      throw error;
    }
  }



  // 发送开始识别命令
  async sendStartCommand() {
    if (!this.isConnected || !this.websocket) {
      throw new Error('WebSocket未连接');
    }

    // 生成任务ID
    this.taskId = this.generateTaskId();

    const startMessage = {
      header: {
        message_id: this.generateMessageId(),
        task_id: this.taskId,
        namespace: 'SpeechTranscriber',
        name: 'StartTranscription',
        appkey: this.config.appKey
      },
      payload: {
        format: 'pcm',
        sample_rate: 16000,
        enable_intermediate_result: true,
        enable_punctuation_prediction: false,
        enable_inverse_text_normalization: true,
        max_sentence_silence: 400,
        enable_words: false,
        disfluency: false,
        customization: {
          hotwords: [
            { word: '上', weight: 20 },
            { word: '下', weight: 20 },
            { word: '左', weight: 20 },
            { word: '右', weight: 20 },
            { word: '向上', weight: 20 },
            { word: '向下', weight: 20 },
            { word: '向左', weight: 20 },
            { word: '向右', weight: 20 }
          ]
        }
      }
    };

    logService.apiLog('发送开始识别指令', startMessage);
    this.websocket.send(JSON.stringify(startMessage));
    this.isRecording = true;
  }

  // 手动触发识别（用于测试）
  triggerRecognition(direction = null) {
    if (!this.isListening || !this.isConnected) {
      logService.speechLog('未在监听状态，无法触发识别');
      return;
    }

    const directions = ['上', '下', '左', '右'];
    const recognizedDirection = direction || directions[Math.floor(Math.random() * directions.length)];

    logService.speechLog('触发识别', recognizedDirection);

    // 模拟句子开始
    if (this.onSentenceBegin) {
      this.onSentenceBegin({ index: 1, time: Date.now() });
    }

    // 模拟中间结果
    setTimeout(() => {
      if (this.onTranscriptionChanged && this.isListening) {
        this.onTranscriptionChanged({ result: recognizedDirection, confidence: 0.8 });
      }
    }, 200);

    // 模拟最终结果
    setTimeout(() => {
      if (this.onSentenceEnd && this.isListening) {
        this.onSentenceEnd({ result: recognizedDirection, confidence: 0.95 });
      }
      // 识别完成后继续监听，不断开连接
      logService.speechLog('识别完成，继续监听下一次语音...');
    }, 800);
  }

  // 开始音频捕获
  async startAudioCapture() {
    try {
      logService.speechLog('请求麦克风权限...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      logService.speechLog('创建音频上下文...');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      this.microphone = this.audioContext.createMediaStreamSource(stream);

      // 创建音频处理器
      const bufferSize = 4096;
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.processor.onaudioprocess = (event) => {
        if (this.isRecording && this.isConnected && this.websocket) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);

          // 计算音量
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const volume = Math.sqrt(sum / inputData.length);
          if (this.onVolumeChange) {
            this.onVolumeChange(volume);
          }

          // 转换为16位PCM
          const pcmData = this.float32ToPCM16(inputData);
 
          // 发送音频数据到阿里云
          if (this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(pcmData);
          }
        }
      };

      this.microphone.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      logService.speechLog('音频捕获已启动，开始发送数据到阿里云...');

    } catch (error) {
      logService.error('开始音频捕获失败', error);
      throw error;
    }
  }

  // 停止识别
  async stopRecognition() {
    try {
      logService.speechLog('停止阿里云语音识别');
      this.isRecording = false;
      this.isListening = false;

      // 清除回调函数，防止继续处理识别结果
      this.onTranscriptionChanged = null;
      this.onSentenceEnd = null;
      this.onSentenceBegin = null;

      // 发送停止识别指令
      if (this.websocket && this.isConnected) {
        const stopMessage = {
          header: {
            message_id: this.generateMessageId(),
            task_id: this.taskId,
            namespace: 'SpeechTranscriber',
            name: 'StopTranscription',
            appkey: this.config.appKey
          }
        };

        logService.apiLog('发送停止识别指令', stopMessage);
        this.websocket.send(JSON.stringify(stopMessage));
      }

      // 停止音频捕获
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }

      if (this.microphone) {
        this.microphone.disconnect();
        this.microphone = null;
      }

      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

    } catch (error) {
      logService.error('停止识别失败', error);
    }
  }

  // 断开连接
  disconnect() {
    logService.apiLog('断开阿里云WebSocket连接');
    this.isRecording = false;
    this.isConnected = false;
    this.isListening = false;

    // 清除回调函数
    this.onTranscriptionChanged = null;
    this.onSentenceEnd = null;
    this.onSentenceBegin = null;
    this.onConnectionOpen = null;
    this.onConnectionError = null;
    this.onConnectionClose = null;

    // 关闭WebSocket连接
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // 清理音频资源
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.onConnectionClose) {
      this.onConnectionClose();
    }
  }

  // 工具函数：获取中文拼音首字母
  getPinyinInitial(char) {
    // 一个简化的汉字到拼音首字母的映射
    // 实际应用中可能需要更完整的映射表或使用专门的库
    const pinyinMap = {
      '上': 'S', '下': 'X', '左': 'Z', '右': 'Y',
      '商': 'S', '尚': 'S', '伤': 'S', '赏': 'S', '三': 'S',
      '夏': 'X', '吓': 'X',
      '做': 'Z', '作': 'Z', '坐': 'Z',
      '有': 'Y', '又': 'Y',
      // 可以继续扩展...
    };

    // 如果是英文字母或数字，直接返回大写形式
    if (/^[a-zA-Z0-9]+$/.test(char)) {
      return char.charAt(0).toUpperCase();
    }

    // 返回映射的首字母，如果找不到则返回字符本身
    return pinyinMap[char] || char.charAt(0).toUpperCase();
  }

  // 解析方向词 - 混合匹配方案 + 口误纠正
  parseDirection(text) {
    if (!text) {
      logService.speechLog('parseDirection: 输入为空');
      return null;
    }

    const cleanText = text.toLowerCase().trim();
    logService.speechLog('parseDirection 输入', { original: text, cleaned: cleanText });

    let parsedDirection = null;

    // 1. 直接关键词匹配 - 按长度排序，优先匹配长词组
    // 这一步会处理所有预定义的映射，包括 "6" -> "右"
    const sortedKeywords = Object.entries(SPEECH_KEYWORDS)
      .sort(([a], [b]) => b.length - a.length);

    for (const [keyword, direction] of sortedKeywords) {
      if (cleanText.includes(keyword.toLowerCase())) {
        logService.speechLog('✅ 关键词匹配成功', { keyword, direction });
        parsedDirection = direction;
        break;
      }
    }

    // 2. 如果精确匹配失败，尝试首字母匹配
    // 这一步用于处理发音相似的中文误识别，如 "右" -> "又"
    if (!parsedDirection) {
      const firstChar = cleanText.charAt(0);
      const initial = this.getPinyinInitial(firstChar);
      
      logService.speechLog('尝试首字母匹配', { firstChar, initial });

      // 定义方向词与首字母的映射
      const directionInitials = {
        'S': DIRECTIONS.UP,    // 上
        'X': DIRECTIONS.DOWN,  // 下
        'Z': DIRECTIONS.LEFT,  // 左
        'Y': DIRECTIONS.RIGHT  // 右
      };

      const matchedDirection = directionInitials[initial];
      if (matchedDirection) {
        logService.speechLog('✅ 首字母匹配成功', { initial, direction: matchedDirection });
        parsedDirection = matchedDirection;
      }
    }

    if (!parsedDirection) {
      logService.speechLog('❌ 未匹配到方向词', cleanText);
      return null;
    }

    // 3. 口误纠正
    // 注意：这个步骤需要知道当前的目标方向，所以它不能在 parseDirection 内部完成
    // 它应该在调用 parseDirection 之后，由 handleSpeechResult 来执行
    // 因此，这里我们直接返回解析出的方向
    return parsedDirection;
  }

  // 工具函数：Float32转PCM16
  float32ToPCM16(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    return buffer;
  }

  // 生成32位十六进制ID（阿里云要求的格式）
  generateHexId() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars[Math.floor(Math.random() * 16)];
    }
    return result;
  }

  // 生成消息ID
  generateMessageId() {
    return this.generateHexId();
  }

  // 生成任务ID
  generateTaskId() {
    if (!this.taskId) {
      this.taskId = this.generateHexId();
    }
    return this.taskId;
  }

}
 
export default new AlicloudSpeechService();
