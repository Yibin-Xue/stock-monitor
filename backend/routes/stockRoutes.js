const express = require('express');
const router = express.Router();
const tushareService = require('../services/tushareService');
const akshareClient = require('../services/akshareClient');
const aiService = require('../services/aiService');

/**
 * 将纯数字代码转为 Tushare 格式 (600519 -> 600519.SH)
 */
function toTsCode(code) {
  if (code.includes('.')) return code.toUpperCase();
  if (code.startsWith('6') || code.startsWith('9')) return `${code}.SH`;
  return `${code}.SZ`;
}

// ========== 股票搜索 ==========
router.get('/search', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json({ code: 400, message: '请提供搜索关键词' });

  try {
    // 1. 优先使用 Tushare 搜索股票列表
    const searchResults = await tushareService.searchStocks(keyword);
    if (!searchResults || searchResults.length === 0) {
      return res.json({ code: 200, data: [], source: 'tushare' });
    }

    // 2. 获取前10个结果的实时行情（避免请求过多）
    const stocksWithPrice = [];
    const limit = Math.min(searchResults.length, 10);

    for (let i = 0; i < limit; i++) {
      try {
        let stockCode = searchResults[i].code || searchResults[i].symbol;
        // 确保 code 是纯数字（去掉 .SH 等后缀）
        stockCode = stockCode.replace(/\.[A-Z]+$/, '');

        // 优先使用 Tushare 获取股票详情
        const tsCode = toTsCode(stockCode);
        const stockInfo = await tushareService.getStockInfo(tsCode);
        
        stocksWithPrice.push({
          ts_code: stockInfo.ts_code,
          code: stockInfo.code,
          name: stockInfo.name,
          symbol: stockInfo.symbol,
          exchange: stockInfo.exchange,
          market: stockInfo.market,
          price: stockInfo.price,
          open: stockInfo.open,
          high: stockInfo.high,
          low: stockInfo.low,
          pre_close: stockInfo.pre_close,
          change: stockInfo.change,
          changePercent: stockInfo.changePercent,
          volume: stockInfo.volume,
          turnover: stockInfo.turnover,
          marketCap: stockInfo.total_mv || 0,
          total_mv: stockInfo.total_mv || 0,
          turnover_rate: stockInfo.turnover_rate || 0,
          pe: stockInfo.pe || 0,
        });
      } catch (e) {
        // Tushare 失败，尝试使用 AKShare
        try {
          let stockCode = searchResults[i].code || searchResults[i].symbol;
          stockCode = stockCode.replace(/\.[A-Z]+$/, '');
          
          const detail = await akshareClient.getStockDetail(stockCode);
          stocksWithPrice.push({
            ts_code: searchResults[i].ts_code,
            code: searchResults[i].code || searchResults[i].symbol,
            name: searchResults[i].name,
            symbol: searchResults[i].symbol,
            exchange: searchResults[i].exchange,
            market: searchResults[i].market,
            price: detail.price,
            open: detail.open,
            high: detail.high,
            low: detail.low,
            pre_close: detail.pre_close,
            change: detail.change,
            changePercent: detail.changePercent,
            volume: detail.volume,
            turnover: detail.turnover,
            marketCap: detail.total_mv || 0,
            total_mv: detail.total_mv || 0,
            turnover_rate: detail.turnover_rate || 0,
            pe: detail.pe || 0,
          });
        } catch (akErr) {
          // 单个股票详情获取失败，仍然返回基本信息（设置默认值避免前端报错）
          console.warn(`[搜索详情] 获取 ${searchResults[i].code} 失败:`, akErr.message);
          stocksWithPrice.push({
            ts_code: searchResults[i].ts_code,
            code: searchResults[i].code || searchResults[i].symbol,
            name: searchResults[i].name,
            symbol: searchResults[i].symbol,
            exchange: searchResults[i].exchange,
            market: searchResults[i].market,
            price: 0,
            open: 0,
            high: 0,
            low: 0,
            pre_close: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
            turnover: 0,
            marketCap: 0,
            total_mv: 0,
            turnover_rate: 0,
            pe: 0,
          });
        }
      }
    }

    return res.json({ code: 200, data: stocksWithPrice, source: 'tushare' });
  } catch (tsErr) {
    console.warn('[搜索] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      const searchResults = await akshareClient.searchStocks(keyword);
      if (!searchResults || searchResults.length === 0) {
        return res.json({ code: 200, data: [], source: 'akshare' });
      }

      // 获取前10个结果的实时行情
      const stocksWithPrice = [];
      const limit = Math.min(searchResults.length, 10);

      for (let i = 0; i < limit; i++) {
        try {
          let stockCode = searchResults[i].code;
          stockCode = stockCode.replace(/\.[A-Z]+$/, '');

          const detail = await akshareClient.getStockDetail(stockCode);
          stocksWithPrice.push({
            ...searchResults[i],
            price: detail.price,
            open: detail.open,
            high: detail.high,
            low: detail.low,
            pre_close: detail.pre_close,
            change: detail.change,
            changePercent: detail.changePercent,
            volume: detail.volume,
            turnover: detail.turnover,
            marketCap: detail.total_mv || 0,
          });
        } catch (e) {
          console.warn(`[搜索详情] 获取 ${searchResults[i].code} 失败:`, e.message);
          stocksWithPrice.push({
            ...searchResults[i],
            price: 0,
            open: 0,
            high: 0,
            low: 0,
            pre_close: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
            turnover: 0,
            marketCap: 0,
          });
        }
      }

      return res.json({ code: 200, data: stocksWithPrice, source: 'akshare' });
    } catch (akErr) {
      return res.json({ code: 500, message: '搜索失败', error: akErr.message });
    }
  }
});

// ========== 股票详情 ==========
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  try {
    // 优先使用 Tushare 获取股票详情
    const tsCode = toTsCode(code);
    const stockInfo = await tushareService.getStockInfo(tsCode);
    if (!stockInfo) return res.json({ code: 404, message: '未找到股票信息' });

    // 从 daily_basic 接口获取估值指标
    let valuation = null;
    try {
      const axios = require('axios');
      const response = await axios.post('http://api.tushare.pro', {
        api_name: 'daily_basic',
        token: process.env.TUSHARE_TOKEN || '',
        params: {
          ts_code: tsCode,
          trade_date: stockInfo.trade_date || '',
        },
        fields: 'ts_code,trade_date,pe,pe_ttm,pb,total_mv,circ_mv,turnover_rate'
      });
      
      if (response.data.code === 0 && response.data.data && response.data.data.items) {
        const item = response.data.data.items[0];
        if (item) {
          valuation = {
            pe: item[2] || 0,
            pe_ttm: item[3] || 0,
            pb: item[4] || 0,
            total_mv: item[5] || 0,
            circ_mv: item[6] || 0,
            turnover_rate: item[7] || 0,
          };
        }
      }
    } catch (e) {
      console.warn('[估值] Tushare daily_basic 获取失败:', e.message);
    }

    // 同时尝试获取财务指标（Tushare）
    let financial = null;
    try {
      financial = await tushareService.getFinancialIndicator(tsCode);
    } catch (e) {
      console.warn('[财务] Tushare 财务获取失败:', e.message);
      // Tushare 失败，尝试使用 AKShare
      try {
        financial = await akshareClient.getFinancialIndicator(code);
      } catch (akErr) {
        console.warn('[财务] AKShare 财务获取失败:', akErr.message);
      }
    }

    const data = {
      ...stockInfo,
      ...valuation,
      financial,
      company: {
        established: stockInfo.list_date,
        business: stockInfo.industry || '',
        status: '已上市',
      },
      forecast: '请关注公司官方财报披露',
    };

    return res.json({ code: 200, data, source: 'tushare' });
  } catch (tsErr) {
    console.warn('[详情] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      // 尝试使用 AKShare 获取实时行情
      const stockData = await akshareClient.getStockDetail(code);

      // 同时尝试获取财务指标（AKShare）
      let financial = null;
      try {
        financial = await akshareClient.getFinancialIndicator(code);
      } catch (e) {
        console.warn('[财务] AKShare 财务获取失败:', e.message);
      }

      const data = {
        ...stockData,
        financial,
        company: {
          established: '',
          business: stockData.industry || '',
          status: '已上市',
        },
        forecast: '请关注公司官方财报披露',
      };

      return res.json({ code: 200, data, source: 'akshare' });
    } catch (akErr) {
      return res.json({ code: 500, message: '获取失败', error: akErr.message });
    }
  }
});

// ========== K 线数据 ==========
router.get('/:code/kline', async (req, res) => {
  const { code } = req.params;
  const { period = 'day' } = req.query;

  try {
    // 优先使用 Tushare
    const tsCode = toTsCode(code);
    const data = await tushareService.getStockKline(tsCode, period);
    return res.json({ code: 200, data, source: 'tushare' });
  } catch (tsErr) {
    console.warn('[K线] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      // 尝试使用 AKShare
      const data = await akshareClient.getStockKline(code, period);
      return res.json({ code: 200, data, source: 'akshare' });
    } catch (akErr) {
      return res.json({ code: 500, message: '获取K线失败', error: akErr.message });
    }
  }
});

// ========== 大模型分析 ==========
router.post('/:code/analyze', async (req, res) => {
  const { code } = req.params;
  const { analysisData } = req.body;

  try {
    // 优先使用 Tushare 获取股票详情
    const tsCode = toTsCode(code);
    const stockInfo = await tushareService.getStockInfo(tsCode);
    if (!stockInfo) return res.json({ code: 404, message: '未找到股票信息' });

    // 调用大模型分析
    const analysisResult = await aiService.analyzeStock(stockInfo, analysisData);

    return res.json({ code: 200, data: analysisResult, source: 'ai' });
  } catch (error) {
    console.error('大模型分析失败:', error);
    return res.json({ code: 500, message: '大模型分析失败', error: error.message });
  }
});

module.exports = router;
