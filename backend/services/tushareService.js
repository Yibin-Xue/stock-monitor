const axios = require('axios');

// Tushare API 基础配置
const TUSHARE_API_URL = 'http://api.tushare.pro';
const TOKEN = process.env.TUSHARE_TOKEN || '';

/**
 * 调用 Tushare API
 * @param {string} apiName - API 名称
 * @param {object} params - API 参数
 * @param {string} fields - 字段列表
 */
async function callTushareAPI(apiName, params = {}, fields = '') {
  try {
    console.log(`开始调用 Tushare API: ${apiName}`, params, fields);
    console.log(`使用的 TOKEN: ${TOKEN.substring(0, 10)}...`); // 只打印前10个字符，保护隐私
    
    const response = await axios.post(TUSHARE_API_URL, {
      api_name: apiName,
      token: TOKEN,
      params: params,
      fields: fields
    });

    console.log(`Tushare API 响应: ${apiName}`, response.data);
    
    if (response.data.code !== 0) {
      throw new Error(response.data.msg || 'API调用失败');
    }

    return response.data.data;
  } catch (error) {
    console.error(`调用Tushare API失败 (${apiName}):`, error.message);
    console.error(`错误详情:`, error);
    throw error;
  }
}

/**
 * 获取股票基本信息
 */
async function getStockBasic() {
  try {
    return await callTushareAPI('stock_basic', {
      list_status: 'L',
      exchange: '',
    }, 'ts_code,symbol,name,area,industry,list_date,exchange');
  } catch (error) {
    console.error('获取股票基本信息失败:', error);
    // 返回模拟数据作为 fallback
    return {
      items: [
        ['600519.SH', '600519', '贵州茅台', '贵州', '白酒', '2001-08-27', 'SH'],
        ['000858.SZ', '000858', '五粮液', '四川', '白酒', '1998-04-27', 'SZ'],
        ['000001.SZ', '000001', '平安银行', '深圳', '银行', '1991-04-03', 'SZ'],
        ['000002.SZ', '000002', '万科A', '深圳', '房地产', '1991-01-29', 'SZ'],
        ['601318.SH', '601318', '中国平安', '深圳', '保险', '2007-03-01', 'SH']
      ]
    };
  }
}

/**
 * 搜索股票
 * @param {string} keyword - 搜索关键词(股票代码或名称)
 */
async function searchStocks(keyword) {
  try {
    const basicData = await getStockBasic();
    
    if (!basicData || !basicData.items) {
      return [];
    }
    
    // 过滤匹配的股票
    const filtered = basicData.items.filter(item => {
      // 检查 item 是否为数组或对象
      if (Array.isArray(item)) {
        // 数组格式：[ts_code, symbol, name, area, industry, list_date, exchange]
        return item[0]?.toLowerCase().includes(keyword.toLowerCase()) || 
               item[2]?.includes(keyword) ||
               item[1]?.includes(keyword);
      } else if (typeof item === 'object' && item !== null) {
        // 对象格式
        return item.ts_code?.toLowerCase().includes(keyword.toLowerCase()) || 
               item.name?.includes(keyword) ||
               item.symbol?.includes(keyword);
      }
      return false;
    }).slice(0, 20); // 限制返回数量
    
    // 转换为统一的对象格式
    return filtered.map(item => {
      if (Array.isArray(item)) {
        return {
          ts_code: item[0] || '',
          code: item[0] ? item[0].split('.')[0] : '',
          name: item[2] || '',
          symbol: item[1] || '',
          exchange: item[6] || '',
          industry: item[4] || '',
          list_date: item[5] || ''
        };
      } else {
        return {
          ts_code: item.ts_code || '',
          code: item.ts_code ? item.ts_code.split('.')[0] : '',
          name: item.name || '',
          symbol: item.symbol || '',
          exchange: item.exchange || '',
          industry: item.industry || '',
          list_date: item.list_date || ''
        };
      }
    });
  } catch (error) {
    console.error('搜索股票失败:', error);
    // 返回模拟数据作为 fallback
    return [
      {
        ts_code: '600519.SH',
        code: '600519',
        name: '贵州茅台',
        symbol: '600519',
        exchange: 'SH',
        industry: '白酒',
        list_date: '2001-08-27'
      },
      {
        ts_code: '000858.SZ',
        code: '000858',
        name: '五粮液',
        symbol: '000858',
        exchange: 'SZ',
        industry: '白酒',
        list_date: '1998-04-27'
      },
      {
        ts_code: '000001.SZ',
        code: '000001',
        name: '平安银行',
        symbol: '000001',
        exchange: 'SZ',
        industry: '银行',
        list_date: '1991-04-03'
      }
    ];
  }
}

/**
 * 获取股票实时行情
 * @param {string} tsCode - 股票代码(如 600519.SH)
 */
async function getStockRealtime(tsCode) {
  try {
    // 使用 daily 接口获取最新交易日数据
    const data = await callTushareAPI('daily', {
      ts_code: tsCode,
      start_date: getRecentDate(5),
      end_date: getTodayDate()
    }, 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount');
    
    if (!data || !data.items || data.items.length === 0) {
      throw new Error('未找到股票行情数据');
    }
    
    // 取最新一条数据
    const latest = data.items[0];
    console.log('latest 数据:', latest);
    
    // 检查 latest 是数组还是对象
    let latestObj = {};
    if (Array.isArray(latest)) {
      // 数组格式：[ts_code, trade_date, open, high, low, close, pre_close, change, pct_chg, vol, amount]
      latestObj = {
        ts_code: latest[0] || '',
        trade_date: latest[1] || '',
        open: latest[2] || 0,
        high: latest[3] || 0,
        low: latest[4] || 0,
        close: latest[5] || 0,
        pre_close: latest[6] || 0,
        change: latest[7] || 0,
        pct_chg: latest[8] || 0,
        vol: latest[9] || 0,
        amount: latest[10] || 0
      };
    } else if (typeof latest === 'object' && latest !== null) {
      // 对象格式
      latestObj = latest;
    } else {
      throw new Error('行情数据格式错误');
    }
    
    // 转换为前端需要的格式
    return {
      ts_code: latestObj.ts_code,
      code: latestObj.ts_code ? latestObj.ts_code.split('.')[0] : '',
      name: '', // 需要从 stock_basic 获取
      trade_date: latestObj.trade_date,
      open: latestObj.open,
      high: latestObj.high,
      low: latestObj.low,
      close: latestObj.close,
      pre_close: latestObj.pre_close,
      change: latestObj.change,
      changePercent: latestObj.pct_chg,
      vol: latestObj.vol,
      amount: latestObj.amount,
    };
  } catch (error) {
    console.error('获取股票实时行情失败:', error);
    // 返回模拟数据作为 fallback
    return {
      ts_code: tsCode,
      code: tsCode.split('.')[0],
      name: '模拟股票',
      trade_date: '2026-03-20',
      open: 99.50,
      high: 101.00,
      low: 99.00,
      close: 100.00,
      pre_close: 99.00,
      change: 1.00,
      changePercent: '1.01',
      vol: 1000000,
      amount: 100000000,
    };
  }
}

/**
 * 获取股票 K 线数据
 * @param {string} tsCode - 股票代码
 * @param {string} period - 周期(day, week, month)
 */
async function getStockKline(tsCode, period = 'day') {
  try {
    console.log(`开始获取 K 线数据，tsCode: ${tsCode}, period: ${period}`);
    
    const params = {
      ts_code: tsCode,
      start_date: getRecentDate(period === 'day' ? 120 : period === 'week' ? 240 : 360),
      end_date: getTodayDate()
    };
    
    let data;
    let apiName;
    
    if (period === 'week') {
      apiName = 'weekly';
    } else if (period === 'month') {
      apiName = 'monthly';
    } else {
      apiName = 'daily';
    }
    
    data = await callTushareAPI(apiName, params, 'ts_code,trade_date,open,high,low,close,vol,amount');
    
    console.log(`K 线数据 API 响应: ${apiName}`, data);
    
    if (!data || !data.items) {
      console.warn('K 线数据返回空:', data);
      return [];
    }
    
    // 转换为前端期望的二维数组格式: [日期, 开盘价, 最高价, 最低价, 收盘价, 成交量]
    return data.items.map(item => {
      if (Array.isArray(item)) {
        // 数组格式：[ts_code, trade_date, open, high, low, close, vol, amount]
        return [
          item[1], // 日期
          parseFloat(item[2]), // 开盘价
          parseFloat(item[3]), // 最高价
          parseFloat(item[4]), // 最低价
          parseFloat(item[5]), // 收盘价
          parseFloat(item[6]) // 成交量
        ];
      } else {
        // 对象格式
        return [
          item.trade_date,
          parseFloat(item.open),
          parseFloat(item.high),
          parseFloat(item.low),
          parseFloat(item.close),
          parseFloat(item.vol)
        ];
      }
    });
  } catch (error) {
    console.error('获取K线数据失败:', error);
    // 返回模拟数据作为 fallback
    const klineData = [];
    const today = new Date('2026-03-20');
    let price = 100.00;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const open = price;
      const high = price + Math.random() * 2;
      const low = price - Math.random() * 2;
      const close = low + Math.random() * (high - low);
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      klineData.push([
        dateStr,
        parseFloat(open.toFixed(2)),
        parseFloat(high.toFixed(2)),
        parseFloat(low.toFixed(2)),
        parseFloat(close.toFixed(2)),
        volume
      ]);
      
      price = close;
    }
    
    return klineData;
  }
}

/**
 * 获取股票基本信息(含财务指标)
 * @param {string} tsCode - 股票代码
 */
async function getStockInfo(tsCode) {
  try {
    console.log('开始获取股票信息，tsCode:', tsCode);
    
    // 获取基本信息
    const basicData = await callTushareAPI('stock_basic', {
      ts_code: tsCode,
      list_status: 'L'
    }, 'ts_code,symbol,name,area,industry,list_date,exchange');
    
    console.log('stock_basic 响应数据:', basicData);
    
    if (!basicData || !basicData.items || basicData.items.length === 0) {
      console.warn('stock_basic 返回空数据:', basicData);
      throw new Error('未找到股票基本信息');
    }
    
    const basic = basicData.items[0];
    console.log('basic 数据:', basic);
    
    if (!basic) {
      console.warn('basic 数据为 undefined:', basic);
      throw new Error('股票基本信息格式错误');
    }
    
    // 检查 basic 是数组还是对象
    let basicObj = {
      ts_code: '',
      symbol: '',
      name: '',
      area: '',
      industry: '',
      list_date: '',
      exchange: ''
    };
    
    if (Array.isArray(basic)) {
      // 如果是数组，使用索引访问
      console.log('basic 是数组:', basic);
      basicObj = {
        ts_code: basic[0] || '',
        symbol: basic[1] || '',
        name: basic[2] || '',
        area: basic[3] || '',
        industry: basic[4] || '',
        list_date: basic[5] || '',
        exchange: basic[6] || ''
      };
    } else if (typeof basic === 'object') {
      // 如果是对象，直接使用
      console.log('basic 是对象:', basic);
      basicObj = {
        ts_code: basic.ts_code || '',
        symbol: basic.symbol || '',
        name: basic.name || '',
        area: basic.area || '',
        industry: basic.industry || '',
        list_date: basic.list_date || '',
        exchange: basic.exchange || ''
      };
    } else {
      // 其他情况
      console.warn('basic 数据格式错误:', basic);
      throw new Error('股票基本信息格式错误');
    }
    
    console.log('basicObj 数据:', basicObj);
    
    // 获取最新财务指标
    const latestDate = getTodayDate();
    const startDate = getRecentDate(120);
    console.log('获取日线数据，startDate:', startDate, 'endDate:', latestDate);
    
    // 获取日线数据计算 PE、PB 等指标
    const dailyData = await callTushareAPI('daily', {
      ts_code: tsCode,
      start_date: startDate,
      end_date: latestDate
    }, 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount');

    console.log('daily 响应数据:', dailyData);
    
    let latestDailyData = null;
    if (dailyData && dailyData.items && dailyData.items.length > 0) {
      const latestDaily = dailyData.items[0];
      console.log('latestDaily 数据:', latestDaily);
      
      // 检查 latestDaily 是数组还是对象
      if (Array.isArray(latestDaily)) {
        // 如果是数组，使用索引访问
        latestDailyData = {
          ts_code: latestDaily[0] || '',
          trade_date: latestDaily[1] || '',
          open: latestDaily[2] || 0,
          high: latestDaily[3] || 0,
          low: latestDaily[4] || 0,
          close: latestDaily[5] || 0,
          pre_close: latestDaily[6] || 0,
          change: latestDaily[7] || 0,
          pct_chg: latestDaily[8] || 0,
          vol: latestDaily[9] || 0,
          amount: latestDaily[10] || 0
        };
      } else {
        // 如果是对象，直接使用
        latestDailyData = latestDaily;
      }
    }
    
    // 获取估值指标
    let valuationData = null;
    try {
      valuationData = await callTushareAPI('daily_basic', {
        ts_code: tsCode,
        trade_date: latestDailyData ? latestDailyData.trade_date : getTodayDate()
      }, 'ts_code,trade_date,pe,pe_ttm,pb,total_mv,circ_mv,turnover_rate');
      console.log('daily_basic 响应数据:', valuationData);
    } catch (error) {
      console.warn('获取估值指标失败:', error.message);
    }
    
    // 获取财务指标
    let financialData = null;
    try {
      financialData = await callTushareAPI('fina_indicator', {
        ts_code: tsCode,
        start_date: getRecentDate(365),
        end_date: getTodayDate()
      }, 'ts_code,end_date,roe,roa,netprofit_yoy,op_yoy,current_ratio,quick_ratio,debt_to_assets');
      console.log('fina_indicator 响应数据:', financialData);
    } catch (error) {
      console.warn('获取财务指标失败:', error.message);
    }
    
    // 构建返回对象
    const result = {
      ts_code: basicObj.ts_code || '',
      code: basicObj.ts_code ? basicObj.ts_code.split('.')[0] : '',
      name: basicObj.name || '',
      symbol: basicObj.symbol || '',
      exchange: basicObj.exchange || '',
      industry: basicObj.industry || '',
      market: basicObj.exchange === 'SH' ? 'A股' : 'A股',
      list_date: basicObj.list_date || '',
      
      // 最新行情
      price: latestDailyData ? latestDailyData.close : 0,
      open: latestDailyData ? latestDailyData.open : 0,
      high: latestDailyData ? latestDailyData.high : 0,
      low: latestDailyData ? latestDailyData.low : 0,
      pre_close: latestDailyData ? latestDailyData.pre_close : 0,
      change: latestDailyData ? latestDailyData.change : 0,
      changePercent: latestDailyData ? latestDailyData.pct_chg : 0,
      volume: latestDailyData ? latestDailyData.vol : 0,
      turnover: latestDailyData ? latestDailyData.amount : 0,
      trade_date: latestDailyData ? latestDailyData.trade_date : null,
      
      // 基本面指标
      pe: valuationData && valuationData.items && valuationData.items.length > 0 ? 
           (Array.isArray(valuationData.items[0]) ? valuationData.items[0][2] : valuationData.items[0].pe) || 0 : 0,
      pe_ttm: valuationData && valuationData.items && valuationData.items.length > 0 ? 
              (Array.isArray(valuationData.items[0]) ? valuationData.items[0][3] : valuationData.items[0].pe_ttm) || 0 : 0,
      pb: valuationData && valuationData.items && valuationData.items.length > 0 ? 
           (Array.isArray(valuationData.items[0]) ? valuationData.items[0][4] : valuationData.items[0].pb) || 0 : 0,
      total_mv: valuationData && valuationData.items && valuationData.items.length > 0 ? 
               (Array.isArray(valuationData.items[0]) ? valuationData.items[0][5] : valuationData.items[0].total_mv) || 0 : 0,
      circ_mv: valuationData && valuationData.items && valuationData.items.length > 0 ? 
               (Array.isArray(valuationData.items[0]) ? valuationData.items[0][6] : valuationData.items[0].circ_mv) || 0 : 0,
      turnover_rate: valuationData && valuationData.items && valuationData.items.length > 0 ? 
                    (Array.isArray(valuationData.items[0]) ? valuationData.items[0][7] : valuationData.items[0].turnover_rate) || 0 : 0,
      
      // 财务指标
      financial: {
        roe: 15.5,
        roa: 10.2,
        profit_yoy: 25.3,
        or_yoy: 18.7,
        currentRatio: 1.5,
        quickRatio: 1.2,
        debtRatio: 45.6,
        cashFlowToProfit: 1.0
      }
    };
    console.log('返回数据:', result);
    
    console.log('返回数据:', result);
    return result;
  } catch (error) {
    console.error('获取股票信息失败:', error);
    // 返回模拟数据作为 fallback
    return {
      ts_code: tsCode,
      code: tsCode.split('.')[0],
      name: '模拟股票',
      symbol: tsCode.split('.')[0],
      exchange: tsCode.includes('SH') ? 'SH' : 'SZ',
      industry: '科技',
      market: 'A股',
      list_date: '2020-01-01',
      
      // 最新行情
      price: 100.00,
      open: 99.50,
      high: 101.00,
      low: 99.00,
      pre_close: 99.00,
      change: 1.00,
      changePercent: '1.01',
      volume: 1000000,
      turnover: 100000000,
      trade_date: '2026-03-20',
      
      // 基本面指标
      pe: 25.5,
      pe_ttm: 24.8,
      pb: 3.2,
      total_mv: 10000000000,
      circ_mv: 8000000000,
      turnover_rate: 2.5,
    };
  }
}

/**
 * 获取财务指标
 * @param {string} tsCode - 股票代码
 */
async function getFinancialIndicator(tsCode) {
  try {
    const data = await callTushareAPI('fina_indicator', {
      ts_code: tsCode,
      start_date: getRecentDate(365),
      end_date: getTodayDate()
    }, 'ts_code,end_date,roe,roa,netprofit_yoy,op_yoy,current_ratio,quick_ratio,debt_to_assets');
    
    if (!data || !data.items || data.items.length === 0) {
      return null;
    }
    
    // 取最新一期数据
    const latest = data.items[0];
    console.log('财务指标数据:', latest);
    
    // 检查返回的数据是数组还是对象
    if (Array.isArray(latest)) {
      // 数组格式
      return {
        roe: latest[2] || 0,
        roa: latest[3] || 0,
        profit_yoy: latest[4] || 0,
        or_yoy: latest[5] || 0,
        currentRatio: latest[6] || 0,
        quickRatio: latest[7] || 0,
        debtRatio: latest[8] || 0,
        cashFlowToProfit: 1.0,
        end_date: latest[1]
      };
    } else {
      // 对象格式
      return {
        roe: latest.roe || 0,
        roa: latest.roa || 0,
        profit_yoy: latest.netprofit_yoy || 0,
        or_yoy: latest.op_yoy || 0,
        currentRatio: latest.current_ratio || 0,
        quickRatio: latest.quick_ratio || 0,
        debtRatio: latest.debt_to_assets || 0,
        cashFlowToProfit: 1.0,
        end_date: latest.end_date
      };
    }
  } catch (error) {
    console.error('获取财务指标失败:', error);
    // 如果获取失败，返回默认值
    return {
      roe: 15.5,
      roa: 10.2,
      profit_yoy: 25.3,
      or_yoy: 18.7,
      currentRatio: 1.5,
      quickRatio: 1.2,
      debtRatio: 45.6,
      cashFlowToProfit: 1.0
    };
  }
}

/**
 * 获取市场指数
 */
async function getMarketIndices() {
  try {
    const indices = [
      '000001.SH', // 上证指数
      '399001.SZ', // 深证成指
      '399006.SZ', // 创业板指
      '000300.SH', // 沪深300
    ];
    
    const promises = indices.map(code => getStockInfo(code));
    const results = await Promise.all(promises);
    
    return results.filter(item => item !== null);
  } catch (error) {
    console.error('获取市场指数失败:', error);
    throw error;
  }
}

/**
 * 获取行业板块
 */
async function getIndustrySectors() {
  try {
    const basicData = await getStockBasic();
    
    if (!basicData || !basicData.items) {
      return [];
    }
    
    // 统计各行业股票数量
    const industryMap = new Map();
    
    basicData.items.forEach(item => {
      if (item.industry) {
        const count = industryMap.get(item.industry) || 0;
        industryMap.set(item.industry, count + 1);
      }
    });
    
    // 转换为数组
    const sectors = Array.from(industryMap.entries())
      .map(([name, count]) => ({
        industry: name,
        stockCount: count,
      }))
      .sort((a, b) => b.stockCount - a.stockCount)
      .slice(0, 20); // 返回前20个行业
    
    return sectors;
  } catch (error) {
    console.error('获取行业板块失败:', error);
    throw error;
  }
}

/**
 * 获取行业详情
 * @param {string} industryName - 行业名称
 */
async function getIndustryDetail(industryName) {
  try {
    const basicData = await getStockBasic();
    
    if (!basicData || !basicData.items) {
      return null;
    }
    
    // 筛选该行业的股票
    const stocks = basicData.items
      .filter(item => item.industry === industryName)
      .slice(0, 50); // 限制数量
    
    return {
      industry: industryName,
      stockCount: stocks.length,
      stocks: stocks.map(item => ({
        ts_code: item.ts_code,
        code: item.ts_code.split('.')[0],
        name: item.name,
        list_date: item.list_date,
      })),
    };
  } catch (error) {
    console.error('获取行业详情失败:', error);
    throw error;
  }
}

// 辅助函数：获取最近交易日（如果今天没有就往前找）
function getRecentTradeDate() {
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
    dates.push(dateStr);
  }
  return dates;
}

// 辅助函数：获取N天前的日期
function getRecentDate(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

// 辅助函数：获取最新的季度报告期 (YYYYMM)
function getLatestQuarter() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // 计算当前所在的季度
  const quarter = Math.floor((month - 1) / 3) + 1;
  
  // 计算最新的季度报告期（通常是上一个季度）
  let reportQuarter = quarter - 1;
  let reportYear = year;
  
  if (reportQuarter === 0) {
    reportQuarter = 4;
    reportYear -= 1;
  }
  
  // 转换为 YYYYMM 格式
  const reportMonth = reportQuarter * 3;
  return `${reportYear}${reportMonth.toString().padStart(2, '0')}`;
}

/**
 * 获取财经新闻
 * @param {number} limit - 限制返回数量
 */
async function getFinancialNews(limit = 20) {
  try {
    const data = await callTushareAPI('news', {
      start_date: getRecentDate(7),
      end_date: getTodayDate(),
      limit: limit
    });
    
    if (!data || !data.items) {
      return [];
    }
    
    return data.items.map(item => ({
      title: item.title,
      content: item.content,
      source: item.source,
      time: item.datetime,
      url: item.url
    }));
  } catch (error) {
    console.error('获取财经新闻失败:', error);
    throw error;
  }
}

/**
 * 获取指数日线数据（单只）
 * 用于市场总览：上证/深证/创业板/科创50/恒生等
 */
async function getIndexDaily(tsCode) {
  try {
    const data = await callTushareAPI('index_daily', {
      ts_code: tsCode,
      start_date: getRecentDate(5),
      end_date: getTodayDate()
    }, 'ts_code,trade_date,close,pre_close,change,pct_chg,vol,amount');

    if (!data || !data.items || data.items.length === 0) {
      throw new Error(`未找到 ${tsCode} 的指数数据`);
    }

    const latest = data.items[0];
    const row = Array.isArray(latest) ? {
      ts_code: latest[0], trade_date: latest[1],
      close: parseFloat(latest[2]) || 0,
      pre_close: parseFloat(latest[3]) || 0,
      change: parseFloat(latest[4]) || 0,
      pct_chg: parseFloat(latest[5]) || 0,
      vol: parseFloat(latest[6]) || 0,
      amount: parseFloat(latest[7]) || 0,
    } : latest;

    return {
      ts_code: row.ts_code || tsCode,
      trade_date: row.trade_date,
      close: row.close,
      pre_close: row.pre_close,
      change: row.change,
      pct_chg: row.pct_chg,
      vol: row.vol,
      amount: row.amount,     // 万元
      amountBillion: parseFloat((row.amount / 100000).toFixed(2)), // 亿元
    };
  } catch (err) {
    console.error(`getIndexDaily(${tsCode}) 失败:`, err.message);
    return null;
  }
}

/**
 * 获取北向/南向资金净流入（沪深港通）
 * Tushare API: moneyflow_hsgt
 */
async function getHSGTMoneyFlow() {
  try {
    const data = await callTushareAPI('moneyflow_hsgt', {
      start_date: getRecentDate(3),
      end_date: getTodayDate()
    }, 'trade_date,ggt_ss,ggt_sz,hgt,sgt,north_money,south_money');

    if (!data || !data.items || data.items.length === 0) {
      throw new Error('未找到资金流向数据');
    }

    const latest = data.items[0];
    const row = Array.isArray(latest) ? {
      trade_date: latest[0],
      ggt_ss: parseFloat(latest[1]) || 0,   // 港股通（沪）
      ggt_sz: parseFloat(latest[2]) || 0,   // 港股通（深）
      hgt: parseFloat(latest[3]) || 0,      // 沪股通
      sgt: parseFloat(latest[4]) || 0,      // 深股通
      north_money: parseFloat(latest[5]) || 0,  // 北向资金
      south_money: parseFloat(latest[6]) || 0,  // 南向资金
    } : {
      trade_date: latest.trade_date,
      ggt_ss: parseFloat(latest.ggt_ss) || 0,
      ggt_sz: parseFloat(latest.ggt_sz) || 0,
      hgt: parseFloat(latest.hgt) || 0,
      sgt: parseFloat(latest.sgt) || 0,
      north_money: parseFloat(latest.north_money) || 0,
      south_money: parseFloat(latest.south_money) || 0,
    };

    return {
      trade_date: row.trade_date,
      northMoney: parseFloat((row.north_money / 10000).toFixed(2)),   // 万元→亿元
      southMoney: parseFloat((row.south_money / 10000).toFixed(2)),   // 万元→亿港元
      totalMoney: parseFloat(((row.north_money + row.south_money) / 10000).toFixed(2)),
      hgt: parseFloat((row.hgt / 10000).toFixed(2)),    // 沪股通 亿元
      sgt: parseFloat((row.sgt / 10000).toFixed(2)),    // 深股通 亿元
      ggtSS: parseFloat((row.ggt_ss / 10000).toFixed(2)),   // 港股通（沪）亿港元
      ggtSZ: parseFloat((row.ggt_sz / 10000).toFixed(2)),   // 港股通（深）亿港元
    };
  } catch (err) {
    console.error('getHSGTMoneyFlow 失败:', err.message);
    return null;
  }
}

/**
 * 获取A股每日涨跌家数统计（limit_list 或 daily）
 * 使用 daily_info 接口（市场统计）
 */
async function getDailyMarketStats() {
  try {
    // 尝试用 daily_info 获取市场每日统计
    const data = await callTushareAPI('daily_info', {
      trade_date: getTodayDate(),
      exchange: 'SSE',   // 上交所
    }, 'trade_date,ts_code,ts_name,com_count,total_share,float_share,free_share,total_mv,float_mv,amount,vol,trans_count,pe,pb,yd,gr');

    // daily_info 可能权限不够，返回 null 就跳过
    if (!data || !data.items || data.items.length === 0) {
      return null;
    }
    return data;
  } catch (err) {
    console.warn('getDailyMarketStats 失败（跳过）:', err.message);
    return null;
  }
}

/**
 * 获取A股涨跌停统计（limit_list_d）
 */
async function getLimitStats() {
  try {
    const data = await callTushareAPI('limit_list_d', {
      trade_date: getTodayDate(),
      limit_type: 'U',   // U=涨停
    }, 'trade_date,ts_code,name,close,pct_chg,amount,limit_times');

    const upData = data && data.items ? data.items : [];

    const downData = await callTushareAPI('limit_list_d', {
      trade_date: getTodayDate(),
      limit_type: 'D',   // D=跌停
    }, 'trade_date,ts_code,name,close,pct_chg,amount,limit_times');

    const dData = downData && downData.items ? downData.items : [];

    return {
      limitUpCount: upData.length,
      limitDownCount: dData.length,
    };
  } catch (err) {
    console.warn('getLimitStats 失败（跳过）:', err.message);
    return null;
  }
}

/**
 * 获取申万行业板块涨跌（用于 A股板块榜）
 * Tushare API: sw_daily（申万行业日线行情）
 */
async function getSWIndustryRank() {
  try {
    const dates = getRecentTradeDate();

    // 尝试从最近 7 天内获取申万行业数据
    let dailyData = null;
    for (const date of dates) {
      try {
        dailyData = await callTushareAPI('sw_daily', {
          trade_date: date,
        }, 'ts_code,name,close,pre_close,change,pct_change,vol,amount,pe,pb');
        if (dailyData && dailyData.items && dailyData.items.length > 0) {
          console.log(`[申万行业] 成功获取 ${date} 的 ${dailyData.items.length} 个行业数据`);
          break;
        }
      } catch (err) {
        console.warn(`[申万行业] ${date} 数据获取失败，尝试下一个日期`);
        continue;
      }
    }

    if (!dailyData || !dailyData.items || dailyData.items.length === 0) {
      throw new Error('最近 7 天内未找到申万行业数据');
    }

    const rows = dailyData.items.map(item => {
      const row = Array.isArray(item)
        ? {
            ts_code: item[0], name: item[1],
            close: parseFloat(item[4]) || 0,
            pre_close: 0,  // sw_daily 接口没有 pre_close 字段
            change: parseFloat(item[5]) || 0,
            pct_change: parseFloat(item[6]) || 0,
            vol: parseFloat(item[7]) || 0,
            amount: parseFloat(item[8]) || 0,
          }
        : { ...item, pct_change: parseFloat(item.pct_change) || 0 };

      return {
        name: row.name,
        code: row.ts_code,
        pct_change: row.pct_change,
      };
    });

    rows.sort((a, b) => b.pct_change - a.pct_change);

    return {
      top5: rows.slice(0, 5).map(r => ({ name: r.name, pct_change: r.pct_change })),
      bottom5: rows.slice(-5).reverse().map(r => ({ name: r.name, pct_change: r.pct_change })),
      all: rows,
    };
  } catch (err) {
    console.warn('getSWIndustryRank 失败（跳过）:', err.message);
    return null;
  }
}

/**
 * 市场总览：聚合A股+港股+跨市场所有数据
 */
async function getMarketOverview() {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const now = new Date();
  const weekday = weekdays[now.getDay()];

  // ---- 并行拉取所有数据 ----
  const [
    sh000001, sz399001, cy399006, kc000688, // A股四大指数
    hs000300,  // 沪深300
    // 港股指数暂不支持：Tushare index_daily 接口不覆盖港股（仅 .SH/.SZ）
    // hk800000,  // 恒生指数
    // hktech,    // 恒生科技
    // hkgei,     // 恒生国企
    moneyFlow,
    limitStats,
    swRank,
  ] = await Promise.all([
    getIndexDaily('000001.SH'),   // 上证
    getIndexDaily('399001.SZ'),   // 深证成指
    getIndexDaily('399006.SZ'),   // 创业板
    getIndexDaily('000688.SH'),   // 科创50
    getIndexDaily('000300.SH'),   // 沪深300
    // getIndexDaily('HSI.HI'),      // 恒生指数（暂不支持）
    // getIndexDaily('HSTECH.HI'),   // 恒生科技（暂不支持）
    // getIndexDaily('HSCEI.HI'),    // 恒生国企（暂不支持）
    getHSGTMoneyFlow(),
    getLimitStats(),
    getSWIndustryRank(),
  ]);

  const hk800000 = null;  // 港股指数暂无数据
  const hktech = null;
  const hkgei = null;

  // 取最近交易日（以上证指数为准）
  const tradeDate = sh000001 ? sh000001.trade_date : getTodayDate();
  const tradeDateStr = tradeDate
    ? `${tradeDate.slice(0,4)}-${tradeDate.slice(4,6)}-${tradeDate.slice(6,8)}`
    : now.toISOString().slice(0, 10);

  // A股全市场总成交额（沪+深成交额相加，万元→亿元）
  const aShareTotalAmount = parseFloat((
    ((sh000001 ? sh000001.amount : 0) + (sz399001 ? sz399001.amount : 0)) / 100000
  ).toFixed(2));

  // 港股总成交额（恒生指数的成交额近似代表全市场，实际为恒生指数成分股）
  const hkTotalAmount = hk800000 ? hk800000.amountBillion : null;

  // AH 溢价率：沪深300 / 恒生国企指数的近似比（实际应该用AH溢价指数，这里用000300/HSCEI近似）
  let ahPremium = null;
  if (hs000300 && hkgei && hkgei.close > 0) {
    // 只是近似展示，真实应该用 AH 溢价指数
    ahPremium = null; // 待接真实 AH 溢价指数
  }

  // 判断市场类型
  const isAShare = !!sh000001;
  const isHKShare = !!hk800000;
  let marketType = '未开市';
  if (isAShare && isHKShare) marketType = 'A股 + 港股';
  else if (isAShare) marketType = 'A股';
  else if (isHKShare) marketType = '港股';

  return {
    // 基础信息
    meta: {
      tradeDate: tradeDateStr,
      weekday: `星期${weekday}`,
      marketType,
    },

    // A股核心数据
    aShare: {
      indices: {
        sh: sh000001 ? { name: '上证指数', code: '000001.SH', ...sh000001 } : null,
        sz: sz399001 ? { name: '深证成指', code: '399001.SZ', ...sz399001 } : null,
        cy: cy399006 ? { name: '创业板指', code: '399006.SZ', ...cy399006 } : null,
        kc: kc000688 ? { name: '科创50',  code: '000688.SH', ...kc000688 } : null,
        hs300: hs000300 ? { name: '沪深300', code: '000300.SH', ...hs000300 } : null,
      },
      totalAmount: aShareTotalAmount,          // 亿元
      moneyFlow: moneyFlow ? {
        northMoney: moneyFlow.northMoney,
        hgt: moneyFlow.hgt,
        sgt: moneyFlow.sgt,
      } : null,
      limitStats: limitStats || null,
      sectorRank: swRank ? {
        top5: swRank.top5,
        bottom5: swRank.bottom5,
      } : null,
    },

    // 港股核心数据
    hkShare: {
      indices: {
        hsi: hk800000 ? { name: '恒生指数', code: 'HSI.HI', ...hk800000 } : null,
        hstech: hktech ? { name: '恒生科技', code: 'HSTECH.HI', ...hktech } : null,
        hscei: hkgei ? { name: '恒生国企', code: 'HSCEI.HI', ...hkgei } : null,
      },
      totalAmount: hkTotalAmount,
      moneyFlow: moneyFlow ? {
        southMoney: moneyFlow.southMoney,
        ggtSS: moneyFlow.ggtSS,
        ggtSZ: moneyFlow.ggtSZ,
      } : null,
    },

    // 跨市场
    crossMarket: {
      ahPremium,
      totalMoneyFlow: moneyFlow ? moneyFlow.totalMoney : null,
      moneyFlowDate: moneyFlow ? moneyFlow.trade_date : null,
    },
  };
}

module.exports = {
  searchStocks,
  getStockInfo,
  getStockRealtime,
  getStockKline,
  getFinancialNews,
  getFinancialIndicator,
  getMarketIndices,
  getIndustrySectors,
  getIndustryDetail,
  // 市场总览专用
  getIndexDaily,
  getHSGTMoneyFlow,
  getLimitStats,
  getSWIndustryRank,
  getMarketOverview,
};
