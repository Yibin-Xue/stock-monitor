const OpenAI = require('openai');

class DoubaoService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DOUBAO_API_KEY,
      baseURL: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    });
    this.model = process.env.DOUBAO_MODEL || 'doubao-seed-2-0-pro';
  }

  /**
   * 生成股票深度分析报告
   * @param {Object} stockData - 股票数据
   * @returns {Promise<string>} 分析报告
   */
  async generateStockReport(stockData) {
    const prompt = this.buildPrompt(stockData);
    
    // 打印传给 AI 的数据（调试用）
    const stock = stockData.stock || {};
    const technical = stockData.technical_analysis || {};
    const fundamental = stockData.fundamental_analysis || {};
    console.log('[Doubao] 传给AI的数据:', JSON.stringify({
      code: stock.code,
      name: stock.name,
      price: stock.current_price,
      change: stock.change_pct,
      rsi: technical.indicators?.rsi,
      roe: fundamental.profitability?.roe,
      pe: fundamental.valuation?.pe
    }, null, 2));
    console.log('[Doubao] Prompt前500字符:', prompt.substring(0, 500));
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的A股股票分析师。你必须基于提供的数据生成分析报告。如果数据缺失某项，说明该维度受限，但不要因此生成"数据缺失"的通用模板，而应该基于已有的真实数据进行分析。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,  // 降低 token 数加快响应速度
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Doubao API调用失败:', error);
      if (error.status === 401) {
        throw new Error('API Key无效,请检查配置');
      } else if (error.status === 429) {
        throw new Error('API调用频率超限,请稍后再试');
      } else {
        throw error;
      }
    }
  }

  /**
   * 构建提示词
   */
  buildPrompt(stockData) {
    // 从 Python 脚本返回的数据结构中提取字段
    const stock = stockData.stock || {};
    const technical = stockData.technical_analysis || {};
    const fundamental = stockData.fundamental_analysis || {};
    const market = stockData.market_analysis || {};
    const industry = stockData.industry_analysis || {};
    const advice = stockData.investment_advice || {};
    
    const code = stock.code || '';
    const name = stock.name || '';
    const currentPrice = stock.current_price || 0;
    const changePercent = stock.change_pct || 0;
    const tradeDate = stock.trade_date || '';
    
    // 技术面数据
    const shortTerm = technical.short_term || {};
    const mediumTerm = technical.medium_term || {};
    const longTerm = technical.long_term || {};
    const indicators = technical.indicators || {};
    
    // 基本面数据
    const profitability = fundamental.profitability || {};
    const solvency = fundamental.solvency || {};
    const valuation = fundamental.valuation || {};
    
    const today = new Date().toLocaleDateString('zh-CN');
    
    return `
你是专业的A股股票分析师。请基于以下真实数据，对【${name}(${code})】进行深度分析：

【数据时间】
- 行情日期: ${tradeDate}（今日: ${today}）
- 分析生成时间: ${new Date().toLocaleString('zh-CN')}

【一、股票基本信息】
- 股票代码: ${code}
- 股票名称: ${name}
- 当前价格: ¥${currentPrice}
- 涨跌幅: ${changePercent > 0 ? '+' : ''}${changePercent}%

【二、技术面分析（基于K线数据）】
- 短期趋势: ${shortTerm.trend || '未知'}（强度: ${shortTerm.strength || '未知'}/100）
- 中期趋势: ${mediumTerm.trend || '未知'}（强度: ${mediumTerm.strength || '未知'}/100）
- 长期趋势: ${longTerm.trend || '未知'}（强度: ${longTerm.strength || '未知'}/100）
- RSI指标: ${indicators.rsi || '未知'}（>70超买，<30超卖）
- MACD: ${indicators.macd || '未知'}
- 成交量趋势: ${technical.volume_trend || '未知'}
- 支撑位: ¥${(technical.support_levels || [])[0] || '未知'}
- 压力位: ¥${(technical.resistance_levels || [])[0] || '未知'}

【三、基本面分析（基于最新财报）】
- ROE(净资产收益率): ${profitability.roe !== undefined && profitability.roe !== 'NA' ? profitability.roe + '%' : '暂无数据'}
- 毛利率: ${profitability.gross_margin !== undefined && profitability.gross_margin !== 'NA' ? profitability.gross_margin + '%' : '暂无数据'}
- 净利率: ${profitability.net_margin !== undefined && profitability.net_margin !== 'NA' ? profitability.net_margin + '%' : '暂无数据'}
- 资产负债率: ${solvency.debt_ratio !== undefined && solvency.debt_ratio !== 'NA' ? solvency.debt_ratio + '%' : '暂无数据'}
- 流动比率: ${solvency.current_ratio !== undefined && solvency.current_ratio !== 'NA' ? solvency.current_ratio : '暂无数据'}
- PE(TTM): ${valuation.pe !== undefined && valuation.pe !== 'NA' ? valuation.pe : '暂无数据'}
- PB: ${valuation.pb !== undefined && valuation.pb !== 'NA' ? valuation.pb : '暂无数据'}
- 估值水平: ${valuation.level || '暂无数据'}
- 财报报告期: ${fundamental.report_date || '暂无数据'}

【四、市场环境分析】
- 市场评分: ${market.score || '暂无数据'}/100
- 描述: ${market.text || '暂无数据'}

【五、行业分析】
- 行业评分: ${industry.score || '暂无数据'}/100
- 描述: ${industry.text || '暂无数据'}

【六、综合评分与投资建议】
- 综合评分: ${advice.score || fundamental.overall_score || '暂无数据'}/100
- 投资评级: ${advice.recommendation || '暂无'}
- 风险等级: ${advice.risk_level || '暂无'}
- 短期建议: ${advice.short_term || '暂无'}
- 中期建议: ${advice.medium_term || '暂无'}
- 长期建议: ${advice.long_term || '暂无'}

【七、机会与风险】
- 投资机会: ${(advice.opportunities || []).join('；') || '暂无'}
- 风险因素: ${(advice.risks || []).join('；') || '暂无'}

请根据以上真实数据，生成一份专业的投资分析报告，要求：
1. 必须基于上述真实数据进行分析，不得虚构数据
2. 如果某项数据显示"暂无数据"，应在报告中说明该维度分析受限
3. 结合当前时点（${today}）的市场环境进行分析
4. 给出明确的投资建议（买入/增持/持有/减持/卖出）
5. 包含风险提示
6. 字数控制在1500字左右
7. 使用中文，专业、客观、有据可依
`;
  }

  /**
   * 测试API连接
   */
  async testConnection() {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: '请回复"连接成功",不超过10个字。'
          }
        ],
        max_tokens: 20,
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('测试连接失败:', error);
      throw error;
    }
  }
}

module.exports = new DoubaoService();
