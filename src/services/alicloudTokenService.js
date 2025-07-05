// 阿里云Token获取服务
import CryptoJS from 'crypto-js';
import logService from './logService';

class AlicloudTokenService {
  constructor() {
    this.tokenCache = null;
    this.tokenExpireTime = null;
    
    // 这些配置需要您提供
    this.config = {
      accessKeyId: '', // 需要配置您的阿里云AccessKey ID
      accessKeySecret: '', // 需要配置您的阿里云AccessKey Secret
      region: 'cn-shanghai', // 可以根据需要调整地域
    };
  }

  // 设置配置
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  // 获取访问令牌
  async getAccessToken() {
    try {
      // 检查缓存的Token是否还有效
      if (this.tokenCache && this.tokenExpireTime && Date.now() < this.tokenExpireTime) {
        logService.apiLog('使用缓存的Token');
        return this.tokenCache;
      }

      logService.apiLog('获取新的访问令牌...');
      
      // 构建请求参数
      const params = {
        'AccessKeyId': this.config.accessKeyId,
        'Action': 'CreateToken',
        'Version': '2019-02-28',
        'RegionId': this.config.region,
        'Format': 'JSON',
        'SignatureMethod': 'HMAC-SHA1',
        'SignatureVersion': '1.0',
        'SignatureNonce': this.generateNonce(),
        'Timestamp': this.getTimestamp()
      };

      // 生成签名
      const signature = this.generateSignature(params, 'POST');
      params['Signature'] = signature;

      // 构建请求URL
      const url = `https://nls-meta.${this.config.region}.aliyuncs.com/`;

      // 构建请求体
      const formData = new URLSearchParams();
      Object.keys(params).forEach(key => {
        formData.append(key, params[key]);
      });

      logService.apiLog('发送Token请求', { url, params, body: formData.toString() });

      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        logService.error('Token请求失败', { status: response.status, error: errorText });
        throw new Error(`Token请求失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      logService.apiLog('Token响应', result);

      if (result.Token && result.Token.Id) {
        // 缓存Token，设置过期时间（通常24小时，这里设置为23小时以确保安全）
        this.tokenCache = result.Token.Id;
        this.tokenExpireTime = Date.now() + (23 * 60 * 60 * 1000); // 23小时后过期

        logService.apiLog('Token获取成功');
        return this.tokenCache;
      } else {
        throw new Error('Token响应格式错误: ' + JSON.stringify(result));
      }

    } catch (error) {
      logService.error('获取访问令牌失败', error);
      throw error;
    }
  }

  // 生成签名
  generateSignature(params, httpMethod) {
    // 1. 对参数进行排序
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});

    // 2. 构建规范化查询字符串
    const canonicalizedQueryString = Object.keys(sortedParams)
      .map(key => `${this.percentEncode(key)}=${this.percentEncode(sortedParams[key])}`)
      .join('&');

    // 3. 构建待签名字符串
    const stringToSign = `${httpMethod}&${this.percentEncode('/')}&${this.percentEncode(canonicalizedQueryString)}`;

    logService.apiLog('待签名字符串', stringToSign);

    // 4. 计算签名
    const signature = CryptoJS.HmacSHA1(stringToSign, this.config.accessKeySecret + '&').toString(CryptoJS.enc.Base64);

    return signature;
  }

  // URL编码
  percentEncode(str) {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  // 生成随机数
  generateNonce() {
    return Math.random().toString(36).substr(2, 15);
  }

  // 获取时间戳
  getTimestamp() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  // 清除缓存的Token
  clearTokenCache() {
    this.tokenCache = null;
    this.tokenExpireTime = null;
    logService.apiLog('Token缓存已清除');
  }
}

export default new AlicloudTokenService();
