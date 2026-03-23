const express = require('express');
const router = express.Router();
const tushareService = require('../services/tushareService');
const akshareClient = require('../services/akshareClient');

// ========== 市场指数 ==========
router.get('/indices', async (req, res) => {
  try {
    // 优先使用 Tushare
    const data = await tushareService.getMarketIndices();
    return res.json({ code: 200, data, source: 'tushare' });
  } catch (tsErr) {
    console.warn('[指数] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      const data = await akshareClient.getMarketIndices();
      return res.json({ code: 200, data, source: 'akshare' });
    } catch (akErr) {
      console.warn('[指数] AKShare 失败，使用模拟数据:', akErr.message);
      return res.json({
        code: 200,
        data: [
          { name: '上证指数', code: '000001', price: 0, change: 0, changePercent: 0 },
          { name: '深证成指', code: '399001', price: 0, change: 0, changePercent: 0 },
          { name: '创业板指', code: '399006', price: 0, change: 0, changePercent: 0 },
        ],
        source: 'mock',
        // 标注：需要接入真实的市场指数数据
        note: '需要接入真实的市场指数数据，当前使用模拟数据',
      });
    }
  }
});

// ========== 热门板块 ==========
router.get('/sectors', async (req, res) => {
  try {
    // 优先使用 Tushare
    const sectors = await tushareService.getIndustrySectors();
    const data = sectors.map(s => ({
      industry: s.industry,
      stockCount: s.stockCount,
      changePercent: s.changePercent || (Math.random() * 4 - 2).toFixed(2),
      leader: '未知',
    }));
    return res.json({ 
      code: 200, 
      data, 
      source: 'tushare',
      // 标注：行业板块的涨跌幅数据可能是模拟的
      note: '行业板块的涨跌幅数据可能是模拟的，需要接入真实的行业板块涨跌幅数据',
    });
  } catch (tsErr) {
    console.warn('[板块] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      const data = await akshareClient.getIndustrySectors();
      return res.json({ code: 200, data, source: 'akshare' });
    } catch (akErr) {
      console.warn('[板块] AKShare 失败，使用模拟数据:', akErr.message);
      // 生成模拟数据
      const industries = ['半导体', '新能源', '医药', '银行', '保险', '券商', '房地产', '食品饮料'];
      const mockData = industries.map((name) => ({
        industry: name,
        changePercent: (Math.random() * 6 - 3).toFixed(2),
        stockCount: Math.floor(Math.random() * 100) + 20,
        leader: '未知',
      }));
      return res.json({
        code: 200, 
        data: mockData, 
        source: 'mock',
        // 标注：需要接入真实的行业板块数据
        note: '需要接入真实的行业板块数据，当前使用模拟数据',
      });
    }
  }
});

// ========== 资金流向 ==========
router.get('/fund-flow', async (req, res) => {
  try {
    // 优先使用 Tushare
    const data = await tushareService.getFundFlow();
    return res.json({ code: 200, data, source: 'tushare' });
  } catch (tsErr) {
    console.warn('[资金] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      const data = await akshareClient.getFundFlow();
      return res.json({ code: 200, data, source: 'akshare' });
    } catch (akErr) {
      console.warn('[资金] AKShare 失败，尝试新浪财经:', akErr.message);
      // 尝试使用新浪财经资金流向接口
      try {
        const axios = require('axios');
        // 新浪财经北向资金接口
        const url = 'http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHSGTRecord';
        const response = await axios.get(url, {
          params: {
            date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
            page: 1,
            num: 1
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'http://finance.sina.com.cn'
          }
        });
        
        const northData = response.data.data[0];
        const northFlow = {
          name: '北向资金',
          today: parseFloat(northData.net_amount) || 0,
          '5day': 0, // 暂时使用0，实际项目中可以计算5天累计
          '10day': 0  // 暂时使用0，实际项目中可以计算10天累计
        };
        
        return res.json({
          code: 200,
          data: [northFlow],
          source: 'sina',
          // 标注：5天和10天累计数据是模拟的
          note: '5天和10天累计资金流向数据是模拟的，需要接入真实的历史资金流向数据',
        });
      } catch (sinaErr) {
        console.warn('[资金] 新浪财经失败，使用模拟数据:', sinaErr.message);
        // 如果所有接口都失败，使用模拟数据
        return res.json({
          code: 200,
          data: [
            { name: '北向资金', today: 0, '5day': 0, '10day': 0 },
            { name: '南向资金', today: 0, '5day': 0, '10day': 0 },
          ],
          source: 'mock',
          // 标注：需要接入真实的资金流向数据
          note: '需要接入真实的资金流向数据，当前使用模拟数据',
        });
      }
    }
  }
});

// ========== 财经新闻 ==========
router.get('/news', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await tushareService.getFinancialNews(limit);
    return res.json({ code: 200, data, source: 'tushare' });
  } catch (tsErr) {
    console.warn('[新闻] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      const data = await akshareClient.getFinancialNews();
      return res.json({ code: 200, data, source: 'akshare' });
    } catch (akErr) {
      console.warn('[新闻] AKShare 失败，使用模拟数据:', akErr.message);
      // 生成模拟数据
      const mockNews = [
        {
          title: '央行降准0.5个百分点，释放长期资金约1.2万亿元',
          content: '中国人民银行决定于2024年1月降低金融机构存款准备金率0.5个百分点，释放长期资金约1.2万亿元，以支持实体经济发展。',
          source: '央行',
          time: new Date().toISOString(),
          url: '#'
        },
        {
          title: '证监会：进一步提高上市公司质量，严厉打击财务造假',
          content: '证监会表示将继续加强上市公司监管，提高信息披露质量，严厉打击财务造假等违法行为，保护投资者合法权益。',
          source: '证监会',
          time: new Date().toISOString(),
          url: '#'
        },
        {
          title: '新能源汽车销量持续增长，行业景气度高',
          content: '2024年1月新能源汽车销量同比增长35.2%，渗透率达到38.6%，行业景气度持续提升。',
          source: '汽车工业协会',
          time: new Date().toISOString(),
          url: '#'
        }
      ];
      return res.json({
        code: 200,
        data: mockNews,
        source: 'mock',
        // 标注：需要接入真实的财经新闻数据
        note: '需要接入真实的财经新闻数据，当前使用模拟数据',
      });
    }
  }
});

// ========== 市场总览（全量：A股+港股+跨市场） ==========
router.get('/overview', async (req, res) => {
  try {
    console.log('[市场总览] 开始获取全量市场数据...');
    const data = await tushareService.getMarketOverview();
    console.log('[市场总览] 数据获取成功');
    return res.json({ code: 200, data, source: 'tushare' });
  } catch (err) {
    console.error('[市场总览] 获取失败:', err.message);
    return res.json({ code: 500, message: '获取市场总览数据失败', error: err.message });
  }
});

module.exports = router;
