# 大模型接入方案选择指南

## 🔥 火山引擎 Doubao-Seed-2.0 接入方案

### 方案对比

| 接入方式 | 优点 | 缺点 | 适用场景 | 推荐度 |
|---------|------|------|---------|-------|
| **Rest API** | 简单直接,无需SDK | 需要手动处理流式输出 | 快速测试、简单调用 | ⭐⭐⭐⭐ |
| **OpenAI SDK** | 兼容性好,生态丰富 | 需要额外安装SDK | 已有OpenAI代码迁移 | ⭐⭐⭐⭐⭐ |
| **火山引擎SDK** | 原生支持,功能最全 | 需要学习新SDK | 深度集成、生产环境 | ⭐⭐⭐⭐⭐ |

---

## ✅ 推荐方案: OpenAI SDK 调用

### 为什么选择这个方案?

1. **代码简洁**: 只需要几行代码就能调用
2. **兼容性好**: 如果以后换其他模型(OpenAI/Claude),代码改动最小
3. **生态丰富**: 网上教程多,遇到问题容易解决
4. **流式输出**: 支持SSE流式返回,用户体验好

### 接入步骤

#### Step 1: 安装依赖

```bash
cd "d:/Trae CN/program/股票监控/backend"
npm install openai
```

#### Step 2: 配置环境变量

在 `backend/.env` 文件中添加:

```env
# 火山引擎 Doubao API配置
DOUBAO_API_KEY=你的API Key
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-seed-2-0-pro-260215
```

#### Step 3: 创建 Doubao 服务

创建 `backend/services/doubaoService.js`:

```javascript
const OpenAI = require('openai');

class DoubaoService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DOUBAO_API_KEY,
      baseURL: process.env.DOUBAO_BASE_URL,
    });
    this.model = process.env.DOUBAO_MODEL;
  }

  /**
   * 生成股票深度分析报告
   * @param {Object} stockData - 股票数据
   * @returns {Promise<string>} 分析报告
   */
  async generateStockReport(stockData) {
    const prompt = this.buildPrompt(stockData);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的股票分析师,擅长技术面和基本面分析。请基于提供的数据生成专业的投资分析报告。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Doubao API调用失败:', error);
      throw error;
    }
  }

  /**
   * 构建提示词
   */
  buildPrompt(stockData) {
    return `
请基于以下股票数据,生成一份专业的投资分析报告:

【股票基本信息】
- 股票代码: ${stockData.code}
- 股票名称: ${stockData.name}
- 所属行业: ${stockData.industry || '未知'}

【技术面数据】
- 当前价格: ¥${stockData.currentPrice}
- 涨跌幅: ${stockData.changePercent}%
- 技术指标:
  - MA趋势: ${stockData.technical?.maTrend || '未知'}
  - RSI: ${stockData.technical?.rsi || '未知'}
  - MACD: ${stockData.technical?.macd || '未知'}

【基本面数据】
- ROE: ${stockData.fundamental?.roe || '未知'}%
- 毛利率: ${stockData.fundamental?.grossMargin || '未知'}%
- 净利率: ${stockData.fundamental?.netMargin || '未知'}%
- PE: ${stockData.fundamental?.pe || '未知'}
- PB: ${stockData.fundamental?.pb || '未知'}

请从以下几个方面进行分析:
1. 市场分析(当前市场环境、板块热度)
2. 财务分析(盈利能力、成长性、估值水平)
3. 行业分析(行业地位、竞争优势)
4. 投资建议(买入/持有/卖出,目标价位)
5. 风险提示(主要风险因素)

报告要求:
- 专业、客观、有数据支撑
- 每个观点都要有逻辑依据
- 给出明确的投资建议
- 字数控制在800-1200字
`;
  }
}

module.exports = new DoubaoService();
```

#### Step 4: 修改分析路由

修改 `backend/routes/analysisRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const analysisService = require('../services/analysisService');
const doubaoService = require('../services/doubaoService');

// ... 原有代码 ...

/**
 * 大模型深度分析
 * GET /api/analysis/:code/llm-report
 */
router.get('/:code/llm-report', async (req, res) => {
  try {
    const { code } = req.params;
    
    // 1. 获取股票基础数据
    const stockData = await analysisService.getStockData(code);
    
    // 2. 调用Doubao生成报告
    const report = await doubaoService.generateStockReport(stockData);
    
    res.json({
      success: true,
      data: {
        code,
        name: stockData.name,
        report,
        generatedAt: new Date().toISOString(),
        model: 'doubao-seed-2-0-pro'
      }
    });
  } catch (error) {
    console.error('生成大模型报告失败:', error);
    res.status(500).json({
      success: false,
      message: '生成报告失败: ' + error.message
    });
  }
});

module.exports = router;
```

#### Step 5: 前端调用

修改 `src/services/api.js`:

```javascript
// 大模型分析相关API
export const aiApi = {
  // AI技术分析(已有功能)
  analyzeStock: async (code) => {
    try {
      return await api.get(`/analysis/${code}/analyze`);
    } catch (error) {
      console.error('AI技术分析失败:', error);
      throw error;
    }
  },
  
  // 大模型深度报告(新增)
  generateLLMReport: async (code) => {
    try {
      return await api.get(`/analysis/${code}/llm-report`);
    } catch (error) {
      console.error('生成大模型报告失败:', error);
      throw error;
    }
  }
};
```

---

## 💰 成本估算

### Doubao-Seed-2.0-pro 价格
- **输入**: 3.2元/百万tokens
- **输出**: 16元/百万tokens

### 单次分析成本
- 输入(提示词): ~800 tokens ≈ ¥0.0026
- 输出(报告): ~1500 tokens ≈ ¥0.024
- **单次总成本**: ~¥0.027 (约3分钱)

### 月度成本估算
- 每天分析10只股票: 10 × ¥0.027 × 30 = **¥8.1/月**
- 每天分析50只股票: 50 × ¥0.027 × 30 = **¥40.5/月**

---

## 🚀 快速开始

### 1. 获取API Key
- 登录火山引擎控制台
- 进入"API Key管理"
- 创建新的API Key
- 复制Key保存好

### 2. 配置环境变量
在 `backend/.env` 中添加:
```env
DOUBAO_API_KEY=你的API Key
```

### 3. 安装依赖
```bash
cd backend
npm install openai
```

### 4. 测试调用
```bash
# 启动后端
cd backend
npm start

# 测试API
curl http://localhost:3002/api/analysis/600519/llm-report
```

---

## ⚠️ 注意事项

1. **API Key安全**: 不要提交到GitHub,使用环境变量
2. **错误处理**: 添加重试机制和降级方案
3. **流式输出**: 如果需要实时显示,可以使用SSE
4. **缓存**: 相同股票的报告可以缓存1小时,节省成本

---

## 🔄 备选方案

如果Doubao不合适,还可以考虑:

| 服务商 | 模型 | 价格 | 特点 |
|-------|------|------|------|
| OpenAI | GPT-4 | $0.03/1K tokens | 最强效果 |
| OpenAI | GPT-3.5 | $0.002/1K tokens | 性价比高 |
| Anthropic | Claude 3 | $0.015/1K tokens | 长文本支持 |
| 阿里云 | 通义千问 | ¥0.012/1K tokens | 中文优化 |
| 百度 | 文心一言 | ¥0.012/1K tokens | 国内稳定 |

---

## 📞 需要帮助?

如果你需要我帮你:
1. 完整实现上述代码
2. 添加流式输出支持
3. 添加缓存机制
4. 添加错误重试

随时告诉我! 🚀
