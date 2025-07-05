import { RESPONSIVE_GRID_CONFIG } from './constants';

/**
 * 获取当前屏幕大小类型
 * @returns {string} 屏幕大小类型: 'large', 'medium', 'small', 'xsmall', 'landscape'
 */
export const getScreenSize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height && height <= 600;
  const isMobile = isMobileDevice();

  // 移动端横屏特殊处理
  if (isLandscape && isMobile) {
    return 'landscape';
  }

  // 移动端竖屏优化
  if (isMobile && width < height) {
    if (width >= 414) {
      return 'mobile-large'; // iPhone Plus/Max 等大屏手机
    } else if (width >= 375) {
      return 'mobile-medium'; // iPhone 标准尺寸
    } else {
      return 'mobile-small'; // 小屏手机
    }
  }

  // 桌面端分类
  if (width >= 1200) {
    return 'large';
  } else if (width >= 768) {
    return 'medium';
  } else if (width >= 481) {
    return 'small';
  } else {
    return 'xsmall';
  }
};

/**
 * 根据屏幕大小获取网格配置
 * @returns {object} 包含 rows 和 cols 的配置对象
 */
export const getGridConfig = () => {
  const screenSize = getScreenSize();
  return RESPONSIVE_GRID_CONFIG[screenSize];
};

/**
 * 监听屏幕大小变化
 * @param {function} callback 屏幕大小变化时的回调函数
 * @returns {function} 取消监听的函数
 */
export const useResponsiveGrid = (callback) => {
  let currentScreenSize = getScreenSize();
  
  const handleResize = () => {
    const newScreenSize = getScreenSize();
    if (newScreenSize !== currentScreenSize) {
      currentScreenSize = newScreenSize;
      callback(getGridConfig());
    }
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
};

/**
 * 检查是否为移动设备
 * @returns {boolean}
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * 获取视口信息
 * @returns {object} 包含宽度、高度、是否横屏等信息
 */
export const getViewportInfo = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;
  const isMobile = isMobileDevice();
  
  return {
    width,
    height,
    isLandscape,
    isMobile,
    aspectRatio: width / height,
    screenSize: getScreenSize()
  };
};
