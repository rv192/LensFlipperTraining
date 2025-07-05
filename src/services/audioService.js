// 音效服务
import logService from './logService';

class AudioService {
  constructor() {
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 0.5;
    this.initializeSounds();
  }

  // 初始化音效
  initializeSounds() {
    // 创建正确音效 - 使用 Web Audio API 生成愉快的音调
    this.sounds.correct = this.createCorrectSound();
    
    // 创建错误音效 - 使用 Web Audio API 生成提示音调
    this.sounds.error = this.createErrorSound();
  }

  // 创建正确答案的音效 (愉快的上升音调)
  createCorrectSound() {
    return () => {
      if (!this.isEnabled) return;
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建一个愉快的上升音调序列
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (大三和弦)
        const duration = 0.15; // 每个音符持续时间
        
        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
          oscillator.type = 'sine';
          
          // 设置音量包络
          const startTime = audioContext.currentTime + index * duration;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        });
      } catch (error) {
        logService.warn('无法播放正确音效', error);
      }
    };
  }

  // 创建错误答案的音效 (明显的提示音)
  createErrorSound() {
    return () => {
      if (!this.isEnabled) return;

      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // 创建一个更明显的错误音效 - 使用两个短促的音调
        const frequencies = [349.23, 293.66]; // F4 到 D4 的下降
        const duration = 0.15;
        const gap = 0.05; // 音符之间的间隔

        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
          oscillator.type = 'triangle'; // 使用三角波，声音更明显

          // 设置音量包络
          const startTime = audioContext.currentTime + index * (duration + gap);
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, startTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        });
      } catch (error) {
        logService.warn('无法播放错误音效', error);
      }
    };
  }

  // 播放正确音效
  playCorrect() {
    logService.debug('播放正确音效');
    if (this.sounds.correct) {
      this.sounds.correct();
    }
  }

  // 播放错误音效
  playError() {
    logService.debug('播放错误音效');
    if (this.sounds.error) {
      this.sounds.error();
    }
  }

  // 设置音量 (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // 启用/禁用音效
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // 获取音效状态
  getStatus() {
    return {
      enabled: this.isEnabled,
      volume: this.volume
    };
  }

  // 测试音效
  testSounds() {
    logService.debug('测试正确音效...');
    this.playCorrect();

    setTimeout(() => {
      logService.debug('测试错误音效...');
      this.playError();
    }, 1000);
  }
}

export default new AudioService();
