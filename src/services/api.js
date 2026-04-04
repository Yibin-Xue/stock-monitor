// API服务层
import axios from 'axios';

// 强制指定 API 后端地址，避免构建时环境变量丢失导致请求发到错误域名
const API_BACKEND = import.meta.env.VITE_API_BASE_URL || 'https://stock-monitor.zeabur.app';

// 创建axios实例 - 支持部署环境
const api = axios.create({
  baseURL: `${API_BACKEND}/api`,
  timeout: 10000, // 超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('[API] baseURL:', api.defaults.baseURL);

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 股票相关API
export const stockApi = {
  // 搜索股票
  search: async (keyword) => {
    try {
      return await api.get('/stocks/search', { params: { keyword } });
    } catch (error) {
      console.error('搜索股票失败:', error);
      throw error;
    }
  },

  // 获取股票详情
  getDetail: async (code) => {
    try {
      return await api.get(`/stocks/${code}`);
    } catch (error) {
      console.error('获取股票详情失败:', error);
      throw error;
    }
  },

  // 获取K线数据
  getKline: async (code, period = 'day') => {
    try {
      return await api.get(`/stocks/${code}/kline`, { params: { period } });
    } catch (error) {
      console.error('获取K线数据失败:', error);
      throw error;
    }
  },
};

// 市场相关API
export const marketApi = {
  // 获取市场总览（全量 A股+港股+跨市场）
  getOverview: async () => {
    try {
      return await api.get('/market/overview');
    } catch (error) {
      console.error('获取市场总览失败:', error);
      throw error;
    }
  },

  // 获取市场指数
  getIndices: async () => {
    try {
      return await api.get('/market/indices');
    } catch (error) {
      console.error('获取市场指数失败:', error);
      throw error;
    }
  },

  // 获取热门板块
  getHotSectors: async () => {
    try {
      return await api.get('/market/sectors');
    } catch (error) {
      console.error('获取热门板块失败:', error);
      throw error;
    }
  },

  // 获取资金流向
  getFundFlow: async () => {
    try {
      return await api.get('/market/fund-flow');
    } catch (error) {
      console.error('获取资金流向失败:', error);
      throw error;
    }
  },

  // 获取财经新闻
  getNews: async (limit = 10) => {
    try {
      return await api.get('/market/news', { params: { limit } });
    } catch (error) {
      console.error('获取财经新闻失败:', error);
      throw error;
    }
  },
};

// 大模型分析相关API
export const aiApi = {
  // 分析股票(技术面+基本面)
  analyzeStock: async (code) => {
    try {
      return await api.get(`/analysis/${code}/analyze`);
    } catch (error) {
      console.error('大模型分析失败:', error);
      throw error;
    }
  },

  // 获取股票评分数据
  getStockScore: async (code) => {
    try {
      return await api.get(`/analysis/${code}/analyze`);
    } catch (error) {
      console.error('获取股票评分失败:', error);
      throw error;
    }
  },

  // 生成大模型深度分析报告（单独设置更长超时，大模型推理需要时间）
  generateLLMReport: async (code) => {
    try {
      return await api.get(`/analysis/${code}/llm-report`, {
        timeout: 180000  // 3分钟，大模型推理 + Python分析需要时间
      });
    } catch (error) {
      console.error('生成大模型报告失败:', error);
      throw error;
    }
  },

  // 测试大模型连接
  testConnection: async () => {
    try {
      return await api.get('/analysis/test-connection');
    } catch (error) {
      console.error('测试大模型连接失败:', error);
      throw error;
    }
  },
};

// 行业相关API
export const industryApi = {
  // 获取行业景气度
  getSentiment: async () => {
    try {
      return await api.get('/industry/sentiment');
    } catch (error) {
      console.error('获取行业景气度失败:', error);
      throw error;
    }
  },

  // 获取行业动态
  getNews: async (industry) => {
    try {
      return await api.get('/industry/news', { params: { industry } });
    } catch (error) {
      console.error('获取行业动态失败:', error);
      throw error;
    }
  },

  // 获取行业详情
  getDetail: async (industry) => {
    try {
      return await api.get(`/industry/${industry}`);
    } catch (error) {
      console.error('获取行业详情失败:', error);
      throw error;
    }
  },
};

// 报告相关API
export const reportApi = {
  // 生成股票深度报告
  generate: async (code) => {
    try {
      return await api.post('/report/generate', { code });
    } catch (error) {
      console.error('生成报告失败:', error);
      throw error;
    }
  },
};

export default api;