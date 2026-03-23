const express = require('express');
const router = express.Router();
const tushareService = require('../services/tushareService');
const akshareClient = require('../services/akshareClient');

// ========== 行业景气度/板块列表 ==========
router.get('/sentiment', async (req, res) => {
  try {
    // 优先使用 Tushare
    const sectors = await tushareService.getIndustrySectors();
    // 取前10个行业做景气度展示
    const sentiment = sectors.slice(0, 10).map(s => ({
      industry: s.industry,
      sentiment: Math.min(100, Math.max(0, 50 + (s.changePercent || 0) * 10)),
      trend: (s.changePercent || 0) >= 0 ? 'up' : 'down',
      change: s.changePercent || 0,
      leading_stock: s.leader || '未知',
    }));
    return res.json({ 
      code: 200, 
      data: sentiment, 
      source: 'tushare',
      // 标注：行业景气度数据可能是模拟的
      note: '行业景气度数据可能是模拟的，需要接入真实的行业景气度数据',
    });
  } catch (tsErr) {
    console.warn('[行业景气度] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      const data = await akshareClient.getIndustrySectors();
      // 取前10个行业做景气度展示
      const sentiment = data.slice(0, 10).map(s => ({
        industry: s.industry,
        sentiment: Math.min(100, Math.max(0, 50 + s.changePercent * 10)),
        trend: s.changePercent >= 0 ? 'up' : 'down',
        change: s.changePercent,
        leading_stock: s.leading_stock || '未知',
      }));
      return res.json({ code: 200, data: sentiment, source: 'akshare' });
    } catch (akErr) {
      console.warn('[行业景气度] AKShare 失败，使用模拟数据:', akErr.message);
      // 生成模拟数据
      const industries = ['半导体', '新能源', '医药', '银行', '保险', '券商', '房地产', '食品饮料', '电子', '汽车'];
      const sentiment = industries.map((name, index) => ({
        industry: name,
        sentiment: Math.floor(Math.random() * 50) + 30,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: (Math.random() * 4 - 2).toFixed(2),
        leading_stock: '未知',
      }));
      return res.json({
        code: 200, 
        data: sentiment, 
        source: 'mock',
        // 标注：需要接入真实的行业景气度数据
        note: '需要接入真实的行业景气度数据，当前使用模拟数据',
      });
    }
  }
});

// ========== 行业动态（暂用模拟数据）==========
router.get('/news', async (req, res) => {
  const { industry } = req.query;
  return res.json({
    code: 200,
    data: [
      {
        title: `${industry || '市场'}板块近期资金流向积极`,
        date: new Date().toISOString(),
        source: '市场动态',
        summary: '受整体市场情绪影响，该板块近期交易活跃度有所提升。',
      },
      {
        title: `${industry || '板块'}行业基本面持续改善`,
        date: new Date(Date.now() - 86400000).toISOString(),
        source: '行业研报',
        summary: '分析师预计该板块全年业绩增速有望维持稳健。',
      },
    ],
    source: 'mock',
    // 标注：需要接入真实的行业动态数据
    note: '需要接入真实的行业动态数据，当前使用模拟数据',
  });
});

// ========== 行业详情 ==========
router.get('/:industry', async (req, res) => {
  const { industry } = req.params;
  const decodedIndustry = decodeURIComponent(industry);

  try {
    // 优先使用 Tushare
    const data = await tushareService.getIndustryDetail(decodedIndustry);
    if (!data) return res.json({ code: 404, message: '未找到行业信息' });
    return res.json({ code: 200, data, source: 'tushare' });
  } catch (tsErr) {
    console.warn('[行业详情] Tushare 失败，尝试 AKShare:', tsErr.message);
    try {
      const data = await akshareClient.getIndustryDetail(decodedIndustry);
      return res.json({ code: 200, data, source: 'akshare' });
    } catch (akErr) {
      console.warn('[行业详情] AKShare 失败，使用模拟数据:', akErr.message);
      // 生成模拟数据
      const mockData = {
        industry: decodedIndustry,
        description: `${decodedIndustry}行业是国民经济的重要组成部分，涵盖了多个细分领域。`,
        trend: '稳定增长',
        leading_stocks: [
          { code: '600000', name: '浦发银行', marketCap: 3000, change: 1.2 },
          { code: '601398', name: '工商银行', marketCap: 20000, change: 0.8 },
        ],
        related_industries: ['金融', '科技', '消费'],
      };
      return res.json({
        code: 200, 
        data: mockData, 
        source: 'mock',
        // 标注：需要接入真实的行业详情数据
        note: '需要接入真实的行业详情数据，当前使用模拟数据',
      });
    }
  }
});

module.exports = router;
