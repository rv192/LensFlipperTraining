import React, { useState } from 'react';
import TrainingSession from './components/TrainingSession';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [sessionResults, setSessionResults] = useState(null);

  const handleSessionEnd = (results) => {
    console.log('App.jsx 接收到的训练结果:', results);
    setSessionResults(results);
    setCurrentView('results');
  };

  const startNewSession = () => {
    setSessionResults(null);
    setCurrentView('training');
  };

  const goHome = () => {
    setCurrentView('home');
  };

  const renderHome = () => (
    <div className="home-screen">
      <div className="home-content">
        <h1 className="app-title">翻转拍训练助手</h1>
        <p className="app-description">
          智能语音识别辅助视力训练
        </p>
        
        <div className="features">
          <div className="feature-item">
            <div className="feature-icon">👁️</div>
            <div className="feature-text">
              <h3>智能视力表</h3>
              <p>自适应屏幕大小的E字母视力表</p>
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">🎤</div>
            <div className="feature-text">
              <h3>语音识别</h3>
              <p>AI智能识别孩子的发音方向</p>
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">⏱️</div>
            <div className="feature-text">
              <h3>2分钟训练</h3>
              <p>标准训练时长，实时统计正确率</p>
            </div>
          </div>
        </div>

        <button
          className="start-training-button"
          onClick={startNewSession}
        >
          开始训练
        </button>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="results-screen">
      <div className="results-content">
        <h2 className="results-title">训练结果</h2>
        
        {sessionResults && (
          <div className="results-stats">
            <div className="stat-card">
              <div className="stat-value">{sessionResults.completedCells}</div>
              <div className="stat-label">完成格数</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{sessionResults.accuracy}%</div>
              <div className="stat-label">正确率</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{sessionResults.totalAttempts}</div>
              <div className="stat-label">总尝试次数</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{Math.round(sessionResults.duration)}s</div>
              <div className="stat-label">训练时长</div>
            </div>
          </div>
        )}
        
        <div className="performance-feedback">
          {sessionResults && (
            <>
              {sessionResults.accuracy >= 90 && (
                <div className="feedback excellent">
                  🎉 优秀！您的表现非常棒！
                </div>
              )}
              {sessionResults.accuracy >= 70 && sessionResults.accuracy < 90 && (
                <div className="feedback good">
                  👍 良好！继续保持练习！
                </div>
              )}
              {sessionResults.accuracy < 70 && (
                <div className="feedback needs-improvement">
                  💪 继续努力！多练习会有进步的！
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="results-actions">
          <button 
            className="action-button primary"
            onClick={startNewSession}
          >
            再次训练
          </button>
          
          <button 
            className="action-button secondary"
            onClick={goHome}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app">
      {currentView === 'home' && renderHome()}
      {currentView === 'training' && (
        <TrainingSession onSessionEnd={handleSessionEnd} />
      )}
      {currentView === 'results' && renderResults()}
    </div>
  );
}

export default App;
