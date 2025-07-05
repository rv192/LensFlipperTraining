// 简单的本地存储数据库服务
import logService from './logService';

class DatabaseService {
  constructor() {
    this.storageKey = 'lens_flipper_training_history';
    this.initDatabase();
  }

  // 初始化数据库
  initDatabase() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  // 保存训练记录
  saveTrainingSession(sessionData) {
    try {
      const history = this.getTrainingHistory();
      const newSession = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...sessionData
      };
      
      history.push(newSession);
      
      // 只保留最近50条记录
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      return newSession;
    } catch (error) {
      logService.error('保存训练记录失败', error);
      return null;
    }
  }

  // 获取训练历史
  getTrainingHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logService.error('获取训练历史失败', error);
      return [];
    }
  }

  // 获取统计数据
  getStatistics() {
    const history = this.getTrainingHistory();
    
    if (history.length === 0) {
      return {
        totalSessions: 0,
        averageAccuracy: 0,
        averageCompletedCells: 0,
        bestAccuracy: 0,
        totalTrainingTime: 0
      };
    }

    const totalSessions = history.length;
    const totalAccuracy = history.reduce((sum, session) => sum + (session.accuracy || 0), 0);
    const totalCells = history.reduce((sum, session) => sum + (session.completedCells || 0), 0);
    const totalTime = history.reduce((sum, session) => sum + (session.duration || 0), 0);
    const bestAccuracy = Math.max(...history.map(session => session.accuracy || 0));

    return {
      totalSessions,
      averageAccuracy: Math.round(totalAccuracy / totalSessions),
      averageCompletedCells: Math.round(totalCells / totalSessions),
      bestAccuracy,
      totalTrainingTime: Math.round(totalTime)
    };
  }

  // 获取最近的训练记录
  getRecentSessions(limit = 10) {
    const history = this.getTrainingHistory();
    return history.slice(-limit).reverse();
  }

  // 清除所有数据
  clearAllData() {
    try {
      localStorage.removeItem(this.storageKey);
      this.initDatabase();
      return true;
    } catch (error) {
      logService.error('清除数据失败', error);
      return false;
    }
  }

  // 导出数据
  exportData() {
    const history = this.getTrainingHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lens_flipper_training_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}

export default new DatabaseService();
