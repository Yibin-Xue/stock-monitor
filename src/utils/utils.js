// 工具类

// 格式化日期
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// 格式化数字
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0';
  return parseFloat(num).toFixed(decimals);
};

// 格式化大数字（如市值）
export const formatLargeNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  }
  return num.toString();
};

// 格式化百分比
export const formatPercent = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0%';
  return parseFloat(num).toFixed(decimals) + '%';
};

// 计算涨跌幅颜色
export const getChangeColor = (change) => {
  if (change > 0) return 'rose';
  if (change < 0) return 'fall';
  return '';
};

// 导出数据为Excel
export const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 本地存储工具
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('存储失败:', error);
    }
  },
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('获取失败:', error);
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('删除失败:', error);
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('清空失败:', error);
    }
  },
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 深拷贝
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// 验证股票代码
export const validateStockCode = (code) => {
  // 简单的股票代码验证
  const pattern = /^[0-9]{5,6}$/;
  return pattern.test(code);
};

// 获取行业景气度等级
export const getSentimentLevel = (score) => {
  if (score >= 80) return { level: 'high', text: '高', color: '#52c41a' };
  if (score >= 60) return { level: 'medium', text: '中', color: '#faad14' };
  return { level: 'low', text: '低', color: '#ff4d4f' };
};

// 生成随机ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 计算两个日期之间的天数
export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 检查是否为移动设备
export const isMobile = () => {
  return window.innerWidth <= 767;
};

// 检查是否为平板设备
export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth <= 1199;
};

// 检查是否为桌面设备
export const isDesktop = () => {
  return window.innerWidth >= 1200;
};

// 获取设备类型
export const getDeviceType = () => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

// 滚动到指定元素
export const scrollToElement = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth'
    });
  }
};

// 复制文本到剪贴板
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};

// 生成唯一的颜色
export const generateColor = (index) => {
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1',
    '#13c2c2', '#fa8c16', '#eb2f96', '#a0d911', '#fa541c'
  ];
  return colors[index % colors.length];
};

// 检查网络状态
export const checkNetworkStatus = () => {
  return navigator.onLine;
};

// 延迟函数
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 重试函数
export const retry = async (func, maxAttempts = 3, delayMs = 1000) => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await func();
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) throw error;
      await delay(delayMs);
    }
  }
};

// 计算百分比
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

// 格式化时间差
export const formatTimeDiff = (startTime, endTime) => {
  const diff = Math.abs(endTime - startTime);
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}分${seconds}秒`;
};

// 检查是否为有效的URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 获取URL参数
export const getUrlParams = (url) => {
  const params = {};
  const urlObj = new URL(url);
  for (const [key, value] of urlObj.searchParams.entries()) {
    params[key] = value;
  }
  return params;
};

// 设置URL参数
export const setUrlParams = (params) => {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  window.history.pushState({}, '', url.toString());
};

// 移除URL参数
export const removeUrlParams = (keys) => {
  const url = new URL(window.location.href);
  keys.forEach(key => {
    url.searchParams.delete(key);
  });
  window.history.pushState({}, '', url.toString());
};