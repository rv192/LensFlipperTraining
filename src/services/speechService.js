import { API_CONFIG, SPEECH_KEYWORDS } from '../utils/constants';

class SpeechService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
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
      console.error('麦克风权限被拒绝:', error);
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

      console.log('使用音频格式:', mimeType);

      this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      
      console.log('开始录音...');
    } catch (error) {
      console.error('开始录音失败:', error);
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
          console.log('录音结束，音频大小:', audioBlob.size);
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
      console.log('准备发送音频到API，音频大小:', audioBlob.size, '类型:', audioBlob.type);

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

      console.log('音频文件名:', fileName);
      console.log('音频MIME类型:', mimeType);

      const formData = new FormData();
      formData.append('file', audioBlob, fileName);
      formData.append('model', API_CONFIG.WHISPER_MODEL);

      // 添加其他可能需要的参数
      formData.append('response_format', 'json');
      formData.append('language', 'zh');  // 指定中文语言

      // 打印FormData内容用于调试
      console.log('FormData内容:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size}bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      console.log('发送请求到:', `${API_CONFIG.BASE_URL}/audio/transcriptions`);
      console.log('使用模型:', API_CONFIG.WHISPER_MODEL);

      const response = await fetch(`${API_CONFIG.BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`
        },
        body: formData
      });

      console.log('API响应状态:', response.status);

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `无法读取错误信息: ${e.message}`;
        }
        console.error('API错误响应:', errorText);
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      let result;
      try {
        result = await response.json();
        console.log('API响应结果:', result);
      } catch (e) {
        const text = await response.text();
        console.error('JSON解析失败，原始响应:', text);
        throw new Error(`响应格式错误: ${e.message}`);
      }

      // 检查响应格式
      if (result && typeof result.text === 'string') {
        console.log('语音识别成功:', result.text);
        return result.text;
      } else {
        console.error('意外的响应格式:', result);
        throw new Error('API返回了意外的响应格式');
      }
    } catch (error) {
      console.error('语音识别失败:', error);
      throw error;
    }
  }

  // 解析识别结果，提取方向
  parseDirection(text) {
    if (!text) return null;

    const cleanText = text.toLowerCase().trim();
    console.log('解析文本:', cleanText);

    // 按关键词长度排序，优先匹配更长的词组
    const sortedKeywords = Object.entries(SPEECH_KEYWORDS)
      .sort(([a], [b]) => b.length - a.length);

    // 检查是否包含方向关键词
    for (const [keyword, direction] of sortedKeywords) {
      if (cleanText.includes(keyword.toLowerCase())) {
        console.log(`匹配关键词: "${keyword}" -> 方向: "${direction}"`);
        return direction;
      }
    }

    console.log('未找到匹配的方向关键词');
    console.log('可用关键词:', Object.keys(SPEECH_KEYWORDS));
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
      console.error('语音识别过程出错:', error);
      return {
        text: '',
        direction: null,
        success: false,
        error: error.message
      };
    }
  }

  // 清理资源
  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    this.audioChunks = [];
  }
}

export default new SpeechService();
