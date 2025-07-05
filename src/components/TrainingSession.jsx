import React, { useState, useEffect, useRef } from 'react';
import EyeChart from './EyeChart';
import FontSizeSelector from './FontSizeSelector';
import speechService from '../services/speechService';
import databaseService from '../services/databaseService';
import audioService from '../services/audioService';
import { TRAINING_CONFIG, DIRECTIONS } from '../utils/constants';
import { getGridConfig } from '../utils/responsive';
import './TrainingSession.css';

const TrainingSession = ({ onSessionEnd }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [currentCell, setCurrentCell] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TRAINING_CONFIG.DURATION);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    correctAnswers: 0,
    completedCells: 0
  });
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [cellError, setCellError] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fontSize, setFontSize] = useState(() => {
    // 从localStorage读取保存的字体大小设置
    return localStorage.getItem('eyeChart-fontSize') || 'medium';
  });

  const timerRef = useRef(null);
  const statsRef = useRef(stats);
  const timeLeftRef = useRef(timeLeft);

  // 保持 ref 与 state 同步
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // 同步音效设置
  useEffect(() => {
    audioService.setEnabled(soundEnabled);
  }, [soundEnabled]);
  const gridRef = useRef(null);
  const getCellDirectionRef = useRef(null);

  // 处理EyeChart传递的getCellDirection函数
  const handleCellDirectionReady = (getCellDirection) => {
    getCellDirectionRef.current = getCellDirection;
  };

  // 切换音效开关
  const toggleSound = () => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      // 切换时播放一个测试音效
      if (newValue) {
        setTimeout(() => audioService.playCorrect(), 100);
      }
      return newValue;
    });
  };

  // 处理字体大小变化
  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    // 保存到localStorage
    localStorage.setItem('eyeChart-fontSize', newSize);
    console.log('字体大小已更改为:', newSize);
  };

  // 生成随机格子 - 从网格中选择已存在的格子
  const generateRandomCell = () => {
    const gridConfig = getGridConfig();
    const row = Math.floor(Math.random() * gridConfig.rows);
    const col = Math.floor(Math.random() * gridConfig.cols);
    const cellId = `${row}-${col}`;

    // 获取该格子的实际方向
    const direction = getCellDirectionRef.current ? getCellDirectionRef.current(cellId) : null;

    console.log(`生成随机格子: ${cellId}, 方向: ${direction}, 网格配置: ${gridConfig.rows}x${gridConfig.cols}`);

    return {
      id: cellId,
      row,
      col,
      direction
    };
  };

  // 开始训练
  const startTraining = async () => {
    try {
      // 检查麦克风权限
      const supportCheck = speechService.checkSupport();
      if (!supportCheck.supported) {
        setFeedback(supportCheck.reason + ' - 将启用测试模式');
        setTestMode(true);
        // 继续启动训练，但使用测试模式
      } else {
        await speechService.requestMicrophonePermission();
        setTestMode(false);
      }
      
      setIsTraining(true);
      setTimeLeft(TRAINING_CONFIG.DURATION);
      setStats({ totalAttempts: 0, correctAnswers: 0, completedCells: 0 });
      setFeedback('训练开始！请按住录音按钮说出高亮格子中E的方向');
      
      // 选择第一个格子
      const firstCell = generateRandomCell();
      setCurrentCell(firstCell);
      
      // 开始计时器
      startTimer();
      
      // 开始监听语音或显示测试按钮
      if (!testMode) {
        setFeedback('请按住录音按钮说出高亮格子中E的方向');
      } else {
        setFeedback('测试模式：请点击下方按钮选择方向');
      }
    } catch (error) {
      setFeedback(`启动失败: ${error.message}`);
    }
  };

  // 开始计时器
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 使用 setTimeout 确保在下一个事件循环中调用 endTraining
          // 这样可以确保获取到最新的 stats 状态
          setTimeout(() => endTraining(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 开始录音
  const startRecording = async () => {
    if (!isTraining || isRecording) return;

    try {
      setIsRecording(true);
      setFeedback('正在录音中，请说出方向...');
      await speechService.startRecording();
    } catch (error) {
      setFeedback(`开始录音失败: ${error.message}`);
      setIsRecording(false);
    }
  };

  // 停止录音并识别
  const stopRecordingAndRecognize = async () => {
    if (!isRecording) return;

    try {
      setIsListening(true);
      setFeedback('正在识别中...');

      const audioBlob = await speechService.stopRecording();

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('没有录制到音频数据');
      }

      const text = await speechService.transcribeAudio(audioBlob);
      const direction = speechService.parseDirection(text);

      if (direction) {
        handleSpeechResult(direction, text);
      } else {
        setFeedback(`没有识别到方向，识别结果: "${text || '无法识别'}"，请重新录音`);
        setTimeout(() => {
          if (isTraining) {
            setFeedback('请按住录音按钮说出方向');
          }
        }, 2000);
      }
    } catch (error) {
      setFeedback(`语音识别出错: ${error.message}`);
      setTimeout(() => {
        if (isTraining) {
          setFeedback('请按住录音按钮说出方向');
        }
      }, 2000);
    } finally {
      setIsRecording(false);
      setIsListening(false);
    }
  };

  // 处理语音识别结果
  const handleSpeechResult = (recognizedDirection, text) => {
    if (!currentCell) return;

    console.log('语音识别结果:', { recognizedDirection, text });
    console.log('当前格子方向:', currentCell.direction);
    console.log('方向比较:', recognizedDirection === currentCell.direction);

    const isCorrect = recognizedDirection === currentCell.direction;

    setStats(prev => {
      const newStats = {
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        completedCells: prev.completedCells + (isCorrect ? 1 : 0)
      };
      console.log('语音识别后更新统计:', newStats);
      return newStats;
    });

    if (isCorrect) {
      audioService.playCorrect(); // 播放正确音效
      setFeedback(`正确！识别到: ${text}`);
      // 选择下一个格子
      setTimeout(() => {
        if (isTraining) {
          const nextCell = generateRandomCell();
          setCurrentCell(nextCell);
          if (testMode) {
            setFeedback('测试模式：请点击下方按钮选择方向');
          } else {
            setFeedback('请按住录音按钮说出高亮格子中E的方向');
          }
        }
      }, 1000);
    } else {
      audioService.playError(); // 播放错误音效
      setFeedback(`错误！您说的是: ${text}，请重新尝试`);
      setCellError(true);
      setTimeout(() => {
        setCellError(false);
        if (isTraining && !testMode) {
          setFeedback('请按住录音按钮说出高亮格子中E的方向');
        }
      }, 1500);
    }
  };

  // 测试模式：手动选择方向
  const handleTestModeDirection = (direction) => {
    if (!currentCell || !testMode) return;

    const isCorrect = direction === currentCell.direction;

    setStats(prev => {
      const newStats = {
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        completedCells: prev.completedCells + (isCorrect ? 1 : 0)
      };
      console.log('测试模式后更新统计:', newStats);
      return newStats;
    });

    if (isCorrect) {
      audioService.playCorrect(); // 播放正确音效
      setFeedback(`正确！`);
      // 选择下一个格子
      setTimeout(() => {
        if (isTraining) {
          const nextCell = generateRandomCell();
          setCurrentCell(nextCell);
          setFeedback('测试模式：请点击下方按钮选择方向');
        }
      }, 1000);
    } else {
      audioService.playError(); // 播放错误音效
      setFeedback(`错误！请重新尝试`);
      setCellError(true);
      setTimeout(() => {
        setCellError(false);
        if (isTraining) {
          setFeedback('测试模式：请点击下方按钮选择方向');
        }
      }, 1500);
    }
  };

  // 结束训练
  const endTraining = () => {
    setIsTraining(false);
    setIsListening(false);
    setCurrentCell(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    speechService.cleanup();

    // 使用 ref 获取最新的状态值
    const currentStats = statsRef.current;
    const currentTimeLeft = timeLeftRef.current;

    console.log('训练结束时的统计数据:', currentStats);
    console.log('训练结束时的剩余时间:', currentTimeLeft);

    const accuracy = currentStats.totalAttempts > 0
      ? Math.round((currentStats.correctAnswers / currentStats.totalAttempts) * 100)
      : 0;

    const sessionData = {
      ...currentStats,
      accuracy,
      duration: TRAINING_CONFIG.DURATION - currentTimeLeft
    };

    console.log('最终会话数据:', sessionData);

    // 保存训练记录
    databaseService.saveTrainingSession(sessionData);

    setFeedback(`训练结束！完成 ${currentStats.completedCells} 个格子，正确率 ${accuracy}%`);

    if (onSessionEnd) {
      onSessionEnd(sessionData);
    }
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      speechService.cleanup();
    };
  }, []);

  return (
    <div className="training-session">
      <div className="training-header">
        <div className="timer">
          <span className="timer-label">剩余时间:</span>
          <span className={`timer-value ${timeLeft <= 30 ? 'warning' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="stats">
          <span>完成: {stats.completedCells}</span>
          <span>正确率: {stats.totalAttempts > 0 ? Math.round((stats.correctAnswers / stats.totalAttempts) * 100) : 0}%</span>
        </div>

        <div className="header-controls">
          <FontSizeSelector
            currentSize={fontSize}
            onSizeChange={handleFontSizeChange}
          />
          <div className="sound-control">
            <button
              className={`sound-toggle ${soundEnabled ? 'enabled' : 'disabled'}`}
              onClick={toggleSound}
              title={soundEnabled ? '关闭音效' : '开启音效'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        </div>
      </div>

      <EyeChart
        currentCell={currentCell}
        isTraining={isTraining}
        cellError={cellError}
        fontSize={fontSize}
        onCellDirectionReady={handleCellDirectionReady}
      />

      <div className="training-controls">
        <div className={`feedback ${isListening ? 'listening' : ''}`}>
          {feedback}
        </div>
        
        {!isTraining ? (
          <button 
            className="start-button"
            onClick={startTraining}
          >
            开始训练
          </button>
        ) : (
          <button 
            className="stop-button"
            onClick={endTraining}
          >
            停止训练
          </button>
        )}
        
        {!testMode && isTraining && (
          <div className="voice-controls">
            <button
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onMouseDown={startRecording}
              onMouseUp={stopRecordingAndRecognize}
              onTouchStart={startRecording}
              onTouchEnd={stopRecordingAndRecognize}
              disabled={isListening}
            >
              {isRecording ? '🔴 录音中...' : '🎤 按住录音'}
            </button>
            {isListening && (
              <div className="processing-indicator">
                <div className="pulse"></div>
                正在识别...
              </div>
            )}
          </div>
        )}

        {testMode && isTraining && (
          <div className="test-mode-controls">
            <div className="direction-buttons">
              <button
                className="direction-button"
                onClick={() => handleTestModeDirection('up')}
              >
                上 ↑
              </button>
              <button
                className="direction-button"
                onClick={() => handleTestModeDirection('down')}
              >
                下 ↓
              </button>
              <button
                className="direction-button"
                onClick={() => handleTestModeDirection('left')}
              >
                左 ←
              </button>
              <button
                className="direction-button"
                onClick={() => handleTestModeDirection('right')}
              >
                右 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingSession;
