import React, { useState, useEffect, useRef } from 'react';
import EyeChart from './EyeChart';
import FontSizeSelector from './FontSizeSelector';
import speechService from '../services/speechService';
import databaseService from '../services/databaseService';
import audioService from '../services/audioService';
import alicloudSpeechService from '../services/alicloudSpeechService';
import alicloudTokenService from '../services/alicloudTokenService';
import logService from '../services/logService';
import { ALICLOUD_CONFIG, validateConfig } from '../utils/alicloudConfig';
import AlicloudConfig from './AlicloudConfig';
import { TRAINING_CONFIG, DIRECTIONS, COMMON_MISTAKES } from '../utils/constants';
import { getGridConfig } from '../utils/responsive';
import './TrainingSession.css';
import packageJson from '../../package.json';

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
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [useAlicloud, setUseAlicloud] = useState(true); // 是否使用阿里云实时识别（默认开启）
  const [appVersion] = useState(packageJson.version); // 应用版本号
  const [alicloudConnected, setAlicloudConnected] = useState(false); // 阿里云连接状态
  const [showVolumeBar, setShowVolumeBar] = useState(false); // 是否显示音量条
  const [intermediateResult, setIntermediateResult] = useState(''); // 中间识别结果
  const [alicloudConfigured, setAlicloudConfigured] = useState(false); // 阿里云是否已配置
  const [showAlicloudConfig, setShowAlicloudConfig] = useState(false); // 显示配置界面
  const [lastProcessedResult, setLastProcessedResult] = useState(''); // 防止重复处理
  const [isProcessingResult, setIsProcessingResult] = useState(false); // 防止并发处理
  const [lastProcessedDirection, setLastProcessedDirection] = useState(''); // 最后处理的方向
  const [lastProcessedTime, setLastProcessedTime] = useState(0); // 最后处理的时间
  const [debugLogs, setDebugLogs] = useState([]); // 调试日志
  const [lastDirectionInfo, setLastDirectionInfo] = useState({ direction: null, count: 0 }); // 记录上一个方向及其连续次数
  const [fontSize, setFontSize] = useState(() => {
    // 从localStorage读取保存的字体大小设置
    return localStorage.getItem('eyeChart-fontSize') || 'medium';
  });
  const [showDirectionLabels, setShowDirectionLabels] = useState(() => {
    // 从localStorage读取是否显示方向字母的设置，默认不显示
    return localStorage.getItem('eyeChart-showDirectionLabels') === 'true';
  });

  // 检查是否启用调试模式（URL包含/debug）
  const isDebugMode = window.location.pathname.includes('/debug') || window.location.search.includes('debug=true');

  const timerRef = useRef(null);
  const statsRef = useRef(stats);
  const timeLeftRef = useRef(timeLeft);
  const isTrainingRef = useRef(isTraining);
  const currentCellRef = useRef(currentCell);
  const isProcessingResultRef = useRef(false);
  const lastDirectionInfoRef = useRef(lastDirectionInfo);

  // 添加调试日志 - 同时输出到浏览器控制台和服务端控制台
  const addDebugLog = (message) => {
    // 使用logService同时输出到浏览器和服务端控制台
    const formattedMessage = logService.trainingLog(message);
    // 只在调试模式下才保存到页面显示的调试日志中
    if (isDebugMode) {
      setDebugLogs(prev => [...prev.slice(-4), formattedMessage]); // 只保留最新5条
    }
  };

  // 保持 ref 与 state 同步
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    isTrainingRef.current = isTraining;
  }, [isTraining]);

  useEffect(() => {
    currentCellRef.current = currentCell;
  }, [currentCell]);

  useEffect(() => {
    isProcessingResultRef.current = isProcessingResult;
  }, [isProcessingResult]);

  useEffect(() => {
    lastDirectionInfoRef.current = lastDirectionInfo;
  }, [lastDirectionInfo]);

  // 同步音效设置
  useEffect(() => {
    audioService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // 初始化阿里云配置
  useEffect(() => {
    checkAlicloudConfig();

    // 清理函数
    return () => {
      alicloudSpeechService.disconnect();
    };
  }, []);

  // 检查阿里云配置
  const checkAlicloudConfig = () => {
    try {
      console.log('检查阿里云配置...', ALICLOUD_CONFIG);
      validateConfig(ALICLOUD_CONFIG);
      setAlicloudConfigured(true);
      console.log('阿里云配置检查通过');

      // 配置服务
      if (alicloudTokenService && alicloudSpeechService) {
        alicloudTokenService.setConfig(ALICLOUD_CONFIG);
        alicloudSpeechService.setConfig({
          appKey: ALICLOUD_CONFIG.appKey,
          ...ALICLOUD_CONFIG.speechConfig
        });
        console.log('阿里云服务配置完成');
      } else {
        throw new Error('阿里云服务未正确导入');
      }

    } catch (error) {
      console.error('阿里云配置检查失败:', error);
      setAlicloudConfigured(false);
      setUseAlicloud(false);
    }
  };

  // 处理阿里云配置变化
  const handleAlicloudConfigChange = (newConfig) => {
    // 更新配置并重新检查
    Object.assign(ALICLOUD_CONFIG, newConfig);
    checkAlicloudConfig();
  };
  const gridRef = useRef(null);
  const getCellDirectionRef = useRef(null);

  // 处理EyeChart传递的getCellDirection函数
  const handleCellDirectionReady = (getCellDirection) => {
    console.log(`📋 EyeChart 传递了 getCellDirection 函数:`, !!getCellDirection);
    getCellDirectionRef.current = getCellDirection;
    console.log(`📋 getCellDirectionRef.current 已设置:`, !!getCellDirectionRef.current);
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

  // 处理方向标签显示切换
  const toggleDirectionLabels = () => {
    setShowDirectionLabels(prev => {
      const newValue = !prev;
      localStorage.setItem('eyeChart-showDirectionLabels', newValue);
      console.log('方向标签显示已设置为:', newValue);
      return newValue;
    });
  };

  // 生成随机格子 - 从网格中选择已存在的格子
  const generateRandomCell = () => {
    const gridConfig = getGridConfig();

    // 最多重试10次
    for (let attempt = 0; attempt < 10; attempt++) {
      const row = Math.floor(Math.random() * gridConfig.rows);
      const col = Math.floor(Math.random() * gridConfig.cols);
      const cellId = `${row}-${col}`;

      // 获取该格子的实际方向
      console.log(`🎲 生成随机格子调试 (尝试 ${attempt + 1}):`);
      console.log(`🎲 - 网格配置: ${gridConfig.rows}x${gridConfig.cols}`);
      console.log(`🎲 - 生成的格子ID: ${cellId}`);
      console.log(`🎲 - getCellDirectionRef.current 是否存在: ${!!getCellDirectionRef.current}`);

      const direction = getCellDirectionRef.current ? getCellDirectionRef.current(cellId) : null;

      console.log(`🎲 - 获取到的方向: ${direction}`);

      if (direction) {
        console.log(`✅ 成功生成格子: ${cellId}, 方向: ${direction}`);
        return {
          id: cellId,
          row,
          col,
          direction
        };
      } else {
        console.warn(`⚠️ 尝试 ${attempt + 1}: 无法获取格子 ${cellId} 的方向，重试...`);
      }
    }

    // 如果10次都失败了，返回一个错误状态
    console.error(`❌ 10次尝试后仍无法获取有效格子方向！`);
    console.error(`❌ getCellDirectionRef.current:`, getCellDirectionRef.current);

    return {
      id: '0-0',
      row: 0,
      col: 0,
      direction: null
    };
  };

  // 开始训练
  const startTraining = async () => {
    try {
      console.log('🚀 startTraining 开始执行');

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

      console.log('🚀 设置 isTraining = true');
      setIsTraining(true);
      setTimeLeft(TRAINING_CONFIG.DURATION);
      setStats({ totalAttempts: 0, correctAnswers: 0, completedCells: 0 });

      // 选择第一个格子
      const firstCell = generateRandomCell();
      addDebugLog(`🎲 生成第一个格子: ${JSON.stringify(firstCell)}`);

      // 检查是否成功获取到格子方向
      if (!firstCell.direction) {
        throw new Error('无法获取格子方向，请稍后重试');
      }

      setCurrentCell(firstCell);
      addDebugLog(`📍 设置currentCell完成`);

      // 开始计时器
      startTimer();

      // 根据模式启动不同的语音识别
      if (!testMode) {
        if (useAlicloud && alicloudConfigured) {
          await startAlicloudRecognition();
        } else {
          setFeedback('请按住录音按钮说出高亮格子中E的方向');
        }
      } else {
        setFeedback('测试模式：请点击下方按钮选择方向');
      }
    } catch (error) {
      setFeedback(`启动失败: ${error.message}`);
    }
  };

  // 启动阿里云实时识别
  const startAlicloudRecognition = async () => {
    try {
      addDebugLog(`🚀 开始启动阿里云识别`);
      addDebugLog(`📍 启动时currentCell: ${currentCell ? JSON.stringify(currentCell) : '空'}`);
      console.log('开始启动阿里云实时识别...');
      setFeedback('正在连接阿里云语音服务...');

      // 检查服务是否可用
      if (!alicloudSpeechService) {
        throw new Error('阿里云语音服务未初始化');
      }



      // 设置回调函数
      alicloudSpeechService.setCallbacks({
        onConnectionOpen: () => {
          setAlicloudConnected(true);
          setFeedback('已连接，请直接说出方向');
        },
        onConnectionClose: () => {
          setAlicloudConnected(false);
          setFeedback('连接已断开');
          setShowVolumeBar(false);
        },
        onConnectionError: (error) => {
          setAlicloudConnected(false);
          setFeedback(`连接错误: ${error.message}`);
        },
        onSentenceBegin: (payload) => {
          console.log('开始说话:', payload);
          setIntermediateResult('');
        },
        onTranscriptionChanged: (payload) => {
          // 只用于显示实时识别结果，不进行处理
          setIntermediateResult(payload.result);
          setFeedback(`识别中: ${payload.result}`);
          addDebugLog(`🎤 实时识别结果: ${payload.result}`);
        },
        onSentenceEnd: (payload) => {
          addDebugLog(`📝 句子结束，最终结果: ${payload.result}`);

          // 检查是否正在处理其他结果
          if (isProcessingResultRef.current) {
            addDebugLog(`⚠️ 正在处理其他结果，跳过: ${payload.result}`);
            return;
          }

          // 解析方向词
          addDebugLog(`🔍 开始解析方向词: ${payload.result}`);
          const direction = alicloudSpeechService.parseDirection(payload.result);
          addDebugLog(`🔍 解析结果: ${direction || '无'}`);

          if (direction) {
            // 简单的重复检查：检查方向词和时间窗口
            const now = Date.now();
            const timeSinceLastProcess = now - (lastProcessedTime || 0);

            if (direction === lastProcessedDirection && timeSinceLastProcess < 2000) {
              addDebugLog(`⚠️ 短时间内重复方向词，跳过处理: ${direction} (${timeSinceLastProcess}ms)`);
              return;
            }

            addDebugLog(`🎯 识别到方向词: ${direction}, 原文: ${payload.result}`);
            setLastProcessedResult(payload.result);
            setLastProcessedDirection(direction);
            setLastProcessedTime(now);
            setIntermediateResult(''); // 清除中间结果显示
            handleSpeechResult(direction, payload.result);
          } else {
            addDebugLog(`❌ 没有识别到方向词`);
            // 记录失败案例
            logService.failedCase({
              text: payload.result,
              reason: '未匹配到方向词',
              timestamp: new Date().toISOString()
            });
          }
        },
        onVolumeChange: (volume) => {
          setVoiceVolume(volume);
          if (!showVolumeBar) setShowVolumeBar(true);
        }
      });
 
      // 开始识别
      await alicloudSpeechService.startRecognition();

    } catch (error) {
      console.error('启动阿里云识别失败:', error);
      setFeedback(`启动阿里云识别失败: ${error.message}`);
      setUseAlicloud(false); // 回退到Groq模式
    }
  };

  // 启动VAD监听
  const startVADListening = async () => {
    try {
      setFeedback('语音监听已启动，请直接说出方向');
      await speechService.startContinuousListening({
        onSpeechStart: () => {
          setIsRecording(true);
          setFeedback('检测到语音，正在录音...');
        },
        onSpeechEnd: async (audioBlob) => {
          setIsRecording(false);
          setIsListening(true);
          setFeedback('正在识别中...');

          try {
            const text = await speechService.transcribeAudio(audioBlob);
            const direction = speechService.parseDirection(text);

            if (direction) {
              handleSpeechResult(direction, text);
            } else {
              setFeedback(`没有识别到方向，识别结果: "${text || '无法识别'}"，请重新说话`);
              setTimeout(() => {
                if (isTraining) {
                  setFeedback('请直接说出方向');
                }
              }, 2000);
            }
          } catch (error) {
            setFeedback(`语音识别出错: ${error.message}`);
            setTimeout(() => {
              if (isTraining) {
                setFeedback('请直接说出方向');
              }
            }, 2000);
          } finally {
            setIsListening(false);
          }
        },
        onVolumeChange: (volume) => {
          setVoiceVolume(volume);
        }
      });
    } catch (error) {
      setFeedback(`启动语音监听失败: ${error.message}`);
      setUseAlicloud(false); // 回退到Groq模式
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
    addDebugLog(`🎯 handleSpeechResult 被调用`);
    addDebugLog(`🎯 参数: 方向=${recognizedDirection}, 文本=${text}`);

    // 检查是否正在处理其他结果
    if (isProcessingResultRef.current) {
      addDebugLog(`❌ 正在处理其他结果，忽略当前结果`);
      return;
    }

    // 设置处理锁定
    setIsProcessingResult(true);
    addDebugLog(`🔒 设置处理锁定`);

    // 使用ref获取最新的状态值，避免闭包陷阱
    const currentIsTraining = isTrainingRef.current;
    const currentCurrentCell = currentCellRef.current;

    addDebugLog(`🎯 currentCell: ${currentCurrentCell ? JSON.stringify(currentCurrentCell) : '空'}`);
    addDebugLog(`🎯 isTraining: ${currentIsTraining}`);

    // 检查训练是否还在进行中
    if (!currentIsTraining) {
      addDebugLog(`❌ 训练已结束，忽略语音识别结果`);
      setIsProcessingResult(false);
      return;
    }

    if (!currentCurrentCell) {
      addDebugLog(`❌ currentCell 为空，无法处理结果`);
      setIsProcessingResult(false);
      return;
    }

    addDebugLog(`🎯 当前格子方向: ${currentCurrentCell.direction}`);
    
    // 口误纠正逻辑
    let finalDirection = recognizedDirection;
    const targetDirection = currentCurrentCell.direction;

    if (recognizedDirection !== targetDirection) {
      // 检查识别出的方向是否是目标方向的常见口误
      const possibleMistakes = COMMON_MISTAKES[targetDirection];
      if (possibleMistakes && possibleMistakes.includes(recognizedDirection)) {
        addDebugLog(`🔄 检测到口误! 用户说 "${recognizedDirection}", 但本意可能是 "${targetDirection}"。进行纠正。`);
        finalDirection = targetDirection; // 纠正为目标方向
      }
    }
    
    addDebugLog(`🎯 方向比较: ${finalDirection} (最终) === ${targetDirection} (目标) = ${finalDirection === targetDirection}`);
    const isCorrect = finalDirection === targetDirection;

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

      // 立即重置状态，避免延迟导致的状态混乱
      setLastProcessedResult('');
      // 注意：不要立即重置lastProcessedDirection和lastProcessedTime，
      // 因为需要保留它们来防止短时间内的重复识别
      setIsProcessingResult(false);
      addDebugLog(`🔓 立即释放处理锁定`);

      // 选择下一个格子
      setTimeout(() => {
        // 使用ref获取最新的训练状态
        if (isTrainingRef.current) {
          addDebugLog(`🎲 生成下一个格子 (应用连续方向限制规则)`);
          
          const currentLastDirectionInfo = lastDirectionInfoRef.current;
          addDebugLog(`🎲 当前方向历史: ${JSON.stringify(currentLastDirectionInfo)}`);

          let nextCell;
          let nextDirection;
          let attempts = 0;
          const maxAttempts = 10; // 防止无限循环的安全措施

          // 循环直到找到一个有效的格子
          do {
            nextCell = generateRandomCell();
            nextDirection = nextCell.direction;
            attempts++;

            addDebugLog(`🎲 尝试 ${attempts}: 生成格子 ${JSON.stringify(nextCell)}`);

            // 检查是否需要强制切换方向
            if (currentLastDirectionInfo.count === 2 && nextDirection === currentLastDirectionInfo.direction) {
              addDebugLog(`🎲 方向 "${nextDirection}" 已连续出现2次，强制切换。`);
              // 如果已经连续2次，且新方向与旧方向相同，则此格子无效，继续循环
            } else {
              // 格子有效，跳出循环
              addDebugLog(`🎲 格子有效。`);
              break;
            }
          } while (attempts < maxAttempts);

          if (attempts >= maxAttempts) {
            addDebugLog(`⚠️ 已尝试 ${maxAttempts} 次，仍未找到有效格子，将使用最后一次生成的结果。`);
          }

          addDebugLog(`🎲 最终下一个格子: ${JSON.stringify(nextCell)} (尝试${attempts}次)`);

          // 更新方向历史记录
          let newCount = 1;
          let newDirection = nextDirection;

          if (nextDirection === currentLastDirectionInfo.direction) {
            newCount = currentLastDirectionInfo.count + 1;
          }

          const newLastDirectionInfo = { direction: newDirection, count: newCount };
          setLastDirectionInfo(newLastDirectionInfo);
          addDebugLog(`🎲 更新方向历史: ${JSON.stringify(newLastDirectionInfo)}`);

          setCurrentCell(nextCell);

          // 重置方向和时间状态，允许识别新格子的方向
          setLastProcessedDirection('');
          setLastProcessedTime(0);
          addDebugLog(`🔄 重置方向识别状态，准备识别新格子`);

          if (testMode) {
            setFeedback('测试模式：请点击下方按钮选择方向');
          } else {
            setFeedback('请直接说出方向');
          }
        } else {
          addDebugLog(`❌ 训练已结束，不生成下一个格子`);
        }
      }, 1000);
    } else {
      audioService.playError(); // 播放错误音效
      setFeedback(`错误！您说的是: ${text}，请重新尝试`);
      setCellError(true);

      // 立即重置状态，允许重新尝试
      setLastProcessedResult('');
      // 错误情况下也保留方向和时间，避免重复错误识别
      setIsProcessingResult(false);
      addDebugLog(`🔓 立即释放处理锁定`);

      setTimeout(() => {
        setCellError(false);
        if (isTraining && !testMode) {
          setFeedback('请直接说出方向');
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
    console.log('🛑 endTraining 被调用');
    console.trace('🛑 调用堆栈:');
    setIsTraining(false);
    setIsListening(false);
    setIsRecording(false);
    setCurrentCell(null);
    setVoiceVolume(0);
    setIsProcessingResult(false); // 重置处理状态
    setLastProcessedResult(''); // 重置上次处理结果
    setLastProcessedDirection(''); // 重置上次处理方向
    setLastProcessedTime(0); // 重置上次处理时间

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 停止语音识别服务
    speechService.stopContinuousListening();
    speechService.cleanup();

    // 停止阿里云识别
    if (useAlicloud) {
      alicloudSpeechService.stopRecognition();
      alicloudSpeechService.disconnect();
      setAlicloudConnected(false);
      setIntermediateResult('');
    }

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
    <div className={`training-session ${isTraining ? 'training-active' : ''}`}>
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
          <div className="version-info">
            <span className="version-label">版本: {appVersion}</span>
          </div>
          <div className="direction-labels-control">
            <button
              className={`direction-labels-toggle ${showDirectionLabels ? 'enabled' : 'disabled'}`}
              onClick={toggleDirectionLabels}
              title={showDirectionLabels ? '隐藏方向字母' : '显示方向字母'}
            >
              {showDirectionLabels ? '👁️' : '🙈'}
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
        showDirectionLabels={showDirectionLabels}
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

        {!testMode && !isTraining && (
          <div className="voice-mode-selector">
            <div className="mode-section">
              <h3>语音识别模式</h3>

              <div className="mode-description">
                {alicloudConfigured ? (
                  <div className="alicloud-status">
                    <span className={`status-dot ${alicloudConnected ? 'connected' : 'disconnected'}`}></span>
                    {alicloudConnected ? '已连接阿里云服务' : '未连接'}
                    {intermediateResult && (
                      <div className="intermediate-result">识别中: {intermediateResult}</div>
                    )}
                  </div>
                ) : (
                  <div className="config-prompt">
                    请先配置阿里云访问凭证
                    <button
                      className="config-button"
                      onClick={() => setShowAlicloudConfig(true)}
                    >
                      配置
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {!testMode && isTraining && useAlicloud && (
          <div className="alicloud-status-panel">
            <div className="status-info">
              <span className={`connection-status ${alicloudConnected ? 'connected' : 'disconnected'}`}>
                {alicloudConnected ? '🟢 语音识别已启动，请直接说话' : '🔴 未连接'}
              </span>
              {intermediateResult && (
                <div className="intermediate-result">
                  识别中: {intermediateResult}
                </div>
              )}
              {alicloudConnected && (
                <div className="voice-hint">
                  <p>💡 直接说出方向：上、下、左、右</p>
                  <p>🎤 无需按任何按钮，系统会自动识别您的语音</p>
                </div>
              )}
              {showVolumeBar && (
                <div className="volume-bar-container">
                  <div className="volume-bar" style={{ width: `${Math.min(voiceVolume * 200, 100)}%` }}></div>
                </div>
              )}
              {isDebugMode && !alicloudConnected && alicloudConfigured && (
                <div className="debug-controls">
                  <button
                    className="test-token-button"
                    onClick={async () => {
                      try {
                        console.log('测试Token获取...');
                        const token = await alicloudTokenService.getAccessToken();
                        console.log('Token获取成功:', token);
                        alert('Token获取成功，长度: ' + token.length);
                      } catch (error) {
                        console.error('Token获取失败:', error);
                        alert('Token获取失败: ' + error.message);
                      }
                    }}
                  >
                    测试Token获取
                  </button>
                </div>
              )}
            </div>
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

        {/* 调试信息显示 - 只在调试模式下显示 */}
        {isDebugMode && debugLogs.length > 0 && (
          <div className="debug-panel" style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>调试信息:</div>
            {debugLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
            ))}
            <button
              onClick={() => setDebugLogs([])}
              style={{
                marginTop: '5px',
                padding: '2px 8px',
                fontSize: '10px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '3px'
              }}
            >
              清除
            </button>
          </div>
        )}
      </div>

      {/* 阿里云配置弹窗 */}
      {showAlicloudConfig && (
        <AlicloudConfig
          onConfigChange={handleAlicloudConfigChange}
          onClose={() => setShowAlicloudConfig(false)}
        />
      )}
    </div>
  );
};

export default TrainingSession;
