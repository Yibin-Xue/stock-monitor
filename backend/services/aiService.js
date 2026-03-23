const axios = require('axios');

/**
 * 大模型分析服务
 */
class AIService {
  constructor() {
    // 从环境变量加载大模型API密钥
    this.apiKeys = {
      // OpenAI API密钥
      openai: process.env.OPENAI_API_KEY || '',
      // 百度文心一言API密钥
      baidu: process.env.BAIDU_API_KEY || '',
      // 火山方舟API配置
      volcano: {
        apiKey: process.env.ARK_API_KEY || '',
        model: process.env.VOLCANO_MODEL || 'doubao-seed-2-0-pro-260215',
      },
    };
  }

  /**
   * 分析股票数据
   * @param {Object} stockData - 股票数据
   * @param {Object} analysisData - 分析数据
   * @returns {Promise<Object>} 大模型分析结果
   */
  async analyzeStock(stockData, analysisData) {
    try {
      console.log('开始大模型分析股票:', stockData.name);

      // 构建分析提示词
      const prompt = this.buildStockAnalysisPrompt(stockData, analysisData);
      console.log('构建的提示词:', prompt);

      // 根据配置的API密钥调用相应的大模型
      if (this.apiKeys.openai) {
        return await this.callOpenAI(prompt);
      } else if (this.apiKeys.baidu) {
        return await this.callBaidu(prompt);
      } else if (this.apiKeys.volcano.apiKey && this.apiKeys.volcano.model) {
        return await this.callVolcano(prompt, stockData, analysisData);
      } else {
        // 如果没有配置API密钥，返回模拟数据
        console.log('未配置大模型API密钥，返回模拟数据');
        return this.getMockAnalysis(stockData);
      }
    } catch (error) {
      console.error('大模型分析失败:', error);
      // 失败时返回模拟数据
      return this.getMockAnalysis(stockData);
    }
  }

  /**
   * 构建股票分析提示词
   * @param {Object} stockData - 股票数据
   * @param {Object} analysisData - 分析数据
   * @returns {string} 提示词
   */
  buildStockAnalysisPrompt(stockData, analysisData) {
    return `请对以下股票进行深度分析，提供专业、客观的投资建议：

股票信息：
- 股票名称：${stockData.name}
- 股票代码：${stockData.code}
- 行业：${stockData.industry}
- 当前价格：${stockData.price}
- 涨跌幅：${stockData.changePercent}%
- 成交量：${stockData.volume}
- 成交额：${stockData.turnover}
- 市盈率(TTM)：${stockData.pe_ttm}
- 市净率：${stockData.pb}
- 总市值：${stockData.total_mv}
- 流通市值：${stockData.circ_mv}

财务指标：
- ROE：${stockData.financial?.roe || '未知'}%
- ROA：${stockData.financial?.roa || '未知'}%
- 净利润同比增长：${stockData.financial?.profit_yoy || '未知'}%
- 营收同比增长：${stockData.financial?.or_yoy || '未知'}%
- 流动比率：${stockData.financial?.currentRatio || '未知'}
- 速动比率：${stockData.financial?.quickRatio || '未知'}
- 资产负债率：${stockData.financial?.debtRatio || '未知'}%

分析结果：
- 估值水平：${analysisData?.fundamental?.valuation?.valuationLevel || '未知'}
- 财务健康度：${analysisData?.fundamental?.financialHealth?.healthScore || '未知'}
- 成长性：${analysisData?.fundamental?.growth?.growthRating || '未知'}
- 技术趋势：${analysisData?.technical?.trend || '未知'}
- 投资评级：${analysisData?.rating || '未知'}
- 风险项：${analysisData?.riskItems?.join('; ') || '无'}

请从以下几个方面进行分析：
1. 公司基本面分析
2. 行业地位与竞争优势
3. 财务状况评估
4. 技术面分析
5. 风险因素
6. 投资建议与目标价
7. 短期与长期展望

分析要专业、客观，基于提供的数据，不要使用没有根据的信息。`;
  }

  /**
   * 调用OpenAI API
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 分析结果
   */
  async callOpenAI(prompt) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一位专业的股票分析师，擅长对股票进行深度分析并提供投资建议。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.openai}`
      }
    });

    return this.parseOpenAIResponse(response.data);
  }

  /**
   * 调用百度文心一言API
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 分析结果
   */
  async callBaidu(prompt) {
    // 这里需要根据百度文心一言API的实际接口进行调用
    // 示例代码，需要根据实际情况修改
    const response = await axios.post('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    }, {
      params: {
        access_token: this.apiKeys.baidu
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return this.parseBaiduResponse(response.data);
  }

  /**
   * 解析OpenAI响应
   * @param {Object} data - OpenAI响应数据
   * @returns {Object} 分析结果
   */
  parseOpenAIResponse(data) {
    const content = data.choices[0].message.content;
    return {
      analysis: content,
      model: 'gpt-3.5-turbo',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 解析百度文心一言响应
   * @param {Object} data - 百度文心一言响应数据
   * @returns {Object} 分析结果
   */
  parseBaiduResponse(data) {
    const content = data.result;
    return {
      analysis: content,
      model: 'ernie-bot',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 调用火山方舟API
   * @param {string} prompt - 提示词
   * @param {Object} stockData - 股票数据
   * @param {Object} analysisData - 分析数据
   * @returns {Promise<Object>} 分析结果
   */
  async callVolcano(prompt, stockData, analysisData) {
    const { apiKey, model } = this.apiKeys.volcano;
    
    if (!apiKey) {
      console.log('未配置火山方舟API密钥，返回模拟数据');
      return this.getMockAnalysis(stockData);
    }
    
    try {
      // 使用 Python 脚本调用火山方舟 API
      const { execSync } = require('child_process');
      
      // 设置环境变量传递数据
      const env = {
        ...process.env,
        ARK_API_KEY: apiKey,
        VOLCANO_MODEL: model,
        STOCK_DATA: JSON.stringify(stockData),
        ANALYSIS_DATA: JSON.stringify(analysisData),
        PROMPT: prompt
      };
      
      // 执行 Python 脚本
      const result = execSync(
        `python services/volcano_ark_service.py`,
        { env, encoding: 'utf8', cwd: 'D:\\Trae CN\\program\\股票监控\\backend' }
      );
      
      // 解析结果
      const analysisResult = JSON.parse(result);
      
      if (analysisResult.error) {
        console.error('火山方舟API调用失败:', analysisResult.error);
        return this.getMockAnalysis(stockData);
      }
      
      return analysisResult;
    } catch (error) {
      console.error('调用火山方舟Python脚本失败:', error);
      return this.getMockAnalysis(stockData);
    }
  }

  /**
   * 生成火山方舟签名
   * @param {string} accessKey - 访问密钥
   * @param {string} secretKey - 秘密密钥
   * @param {string} timestamp - 时间戳
   * @param {string} endpoint - API端点
   * @param {string} prompt - 提示词
   * @returns {string} 签名
   */
  generateVolcanoSignature(accessKey, secretKey, timestamp, endpoint, prompt) {
    const crypto = require('crypto');
    const path = new URL(endpoint).pathname;
    const stringToSign = `POST\n${path}\n\n${timestamp}`;
    return crypto.createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * 解析火山方舟响应
   * @param {Object} data - 火山方舟响应数据
   * @returns {Object} 分析结果
   */
  parseVolcanoResponse(data) {
    const content = data.choices[0].message.content;
    return {
      analysis: content,
      model: this.apiKeys.volcano.model,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取模拟分析数据
   * @param {Object} stockData - 股票数据
   * @returns {Object} 模拟分析结果
   */
  getMockAnalysis(stockData) {
    return {
      analysis: `# ${stockData.name} (${stockData.code}) 深度分析报告\n\n## 1. 公司基本面分析\n${stockData.name}是${stockData.industry}行业的龙头企业，具有较强的市场竞争力。公司业绩稳定增长，营收和净利润均保持良好的增长态势。\n\n## 2. 行业地位与竞争优势\n公司在${stockData.industry}行业中处于领先地位，具有明显的竞争优势，包括技术优势、品牌优势和规模优势。\n\n## 3. 财务状况评估\n公司财务状况良好，ROE和ROA均处于行业较高水平，资产负债率合理，流动性充足。\n\n## 4. 技术面分析\n从技术面来看，股票近期表现${stockData.changePercent > 0 ? '强势' : '疲软'}，${stockData.changePercent > 3 ? '处于上升趋势' : stockData.changePercent < -3 ? '处于下降趋势' : '处于震荡趋势'}。\n\n## 5. 风险因素\n主要风险包括行业竞争加剧、宏观经济波动、政策变化等。\n\n## 6. 投资建议与目标价\n基于基本面和技术面分析，给予${stockData.name}"${stockData.changePercent > 0 ? '买入' : '持有'}"评级，目标价${stockData.price * (1 + (stockData.changePercent > 0 ? 0.1 : 0.05))}元。\n\n## 7. 短期与长期展望\n短期来看，${stockData.name}有望受益于${stockData.industry}行业的复苏，业绩有望继续保持增长。长期来看，公司的竞争优势将持续支撑其业绩增长，具有较好的投资价值。`,
      model: 'mock',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AIService();
