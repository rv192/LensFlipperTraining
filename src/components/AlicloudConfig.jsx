import React, { useState, useEffect } from 'react';
import { ALICLOUD_CONFIG, validateConfig, CONFIG_INSTRUCTIONS } from '../utils/alicloudConfig';
import './AlicloudConfig.css';

const AlicloudConfig = ({ onConfigChange, onClose }) => {
  const [config, setConfig] = useState({
    accessKeyId: '',
    accessKeySecret: '',
    appKey: ALICLOUD_CONFIG.appKey,
    region: ALICLOUD_CONFIG.region
  });
  const [isValid, setIsValid] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    // 从localStorage加载配置
    const savedConfig = localStorage.getItem('alicloud-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    }
  }, []);

  useEffect(() => {
    // 验证配置
    try {
      validateConfig(config);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    }
  }, [config]);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (isValid) {
      // 保存到localStorage
      localStorage.setItem('alicloud-config', JSON.stringify(config));
      
      // 通知父组件
      if (onConfigChange) {
        onConfigChange(config);
      }
      
      alert('配置已保存！');
    }
  };

  const handleTest = async () => {
    if (!isValid) {
      alert('请先完善配置信息');
      return;
    }

    try {
      // 这里可以添加测试连接的逻辑
      alert('配置测试功能开发中...');
    } catch (error) {
      alert('测试失败: ' + error.message);
    }
  };

  return (
    <div className="alicloud-config-overlay">
      <div className="alicloud-config-modal">
        <div className="config-header">
          <h2>阿里云实时语音识别配置</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="config-content">
          <div className="config-section">
            <h3>访问凭证</h3>
            <div className="form-group">
              <label>AccessKey ID:</label>
              <input
                type="text"
                value={config.accessKeyId}
                onChange={(e) => handleInputChange('accessKeyId', e.target.value)}
                placeholder="请输入AccessKey ID"
                className={config.accessKeyId ? 'valid' : 'invalid'}
              />
              <small>在阿里云控制台 > 访问控制 > 用户 > AccessKey管理中获取</small>
            </div>

            <div className="form-group">
              <label>AccessKey Secret:</label>
              <div className="secret-input">
                <input
                  type={showSecret ? "text" : "password"}
                  value={config.accessKeySecret}
                  onChange={(e) => handleInputChange('accessKeySecret', e.target.value)}
                  placeholder="请输入AccessKey Secret"
                  className={config.accessKeySecret ? 'valid' : 'invalid'}
                />
                <button 
                  type="button" 
                  className="toggle-secret"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? '隐藏' : '显示'}
                </button>
              </div>
              <small>AccessKey Secret，请妥善保管</small>
            </div>
          </div>

          <div className="config-section">
            <h3>项目配置</h3>
            <div className="form-group">
              <label>AppKey:</label>
              <input
                type="text"
                value={config.appKey}
                onChange={(e) => handleInputChange('appKey', e.target.value)}
                placeholder="请输入项目AppKey"
                className={config.appKey ? 'valid' : 'invalid'}
              />
              <small>在智能语音交互控制台创建项目后获得</small>
            </div>

            <div className="form-group">
              <label>地域:</label>
              <select
                value={config.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
              >
                <option value="cn-shanghai">华东2（上海）</option>
                <option value="cn-beijing">华北2（北京）</option>
                <option value="cn-shenzhen">华南1（深圳）</option>
              </select>
              <small>选择离您最近的地域以获得最佳性能</small>
            </div>
          </div>

          <div className="config-section">
            <h3>配置说明</h3>
            <div className="instructions">
              <ol>
                {CONFIG_INSTRUCTIONS.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="config-status">
            <div className={`status-indicator ${isValid ? 'valid' : 'invalid'}`}>
              {isValid ? '✓ 配置完整' : '⚠ 配置不完整'}
            </div>
          </div>
        </div>

        <div className="config-actions">
          <button 
            className="test-button" 
            onClick={handleTest}
            disabled={!isValid}
          >
            测试连接
          </button>
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={!isValid}
          >
            保存配置
          </button>
          <button className="cancel-button" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlicloudConfig;
