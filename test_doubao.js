import OpenAI from 'openai';

// 从环境变量读取配置
const DOUBAO_API_KEY = '9960c043-3452-40d1-814b-c8b8873843d1';
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_MODEL = 'doubao-seed-2-0-pro-260215';  // 使用完整的模型ID

console.log('开始测试 Doubao API 连接...\n');

// 创建 OpenAI 客户端
const client = new OpenAI({
  apiKey: DOUBAO_API_KEY,
  baseURL: DOUBAO_BASE_URL,
});

async function testConnection() {
  try {
    console.log('1. 测试 API 连接...');
    const response = await client.chat.completions.create({
      model: DOUBAO_MODEL,
      messages: [
        {
          role: 'user',
          content: '请回复"连接成功",不超过10个字。'
        }
      ],
      max_tokens: 20,
    });

    console.log('✓ API 连接成功!');
    console.log('  响应:', response.choices[0].message.content);
    console.log('  模型:', response.model);
    console.log('  Tokens:', response.usage);
  } catch (error) {
    console.error('✗ API 连接失败:', error.message);
    if (error.status === 401) {
      console.error('  原因: API Key 无效');
    } else if (error.status === 429) {
      console.error('  原因: API 调用频率超限');
    }
    process.exit(1);
  }
}

async function testStockReport() {
  try {
    console.log('\n2. 测试生成股票分析报告...');

    const stockData = {
      code: '600519',
      name: '贵州茅台',
      industry: '白酒',
      currentPrice: 1675.00,
      changePercent: -1.25,
      technical: {
        maTrend: '下跌趋势',
        shortTermTrend: '下跌',
        mediumTermTrend: '下跌',
        longTermTrend: '上涨',
        rsi: 35.2,
        macd: '卖出信号',
        support: 1650,
        resistance: 1720
      },
      fundamental: {
        roe: 26.37,
        grossMargin: 91.29,
        netMargin: 50.35,
        pe: 20.99,
        pb: 7.97,
        revenueGrowth: 18.5,
        profitGrowth: 15.2
      },
      overallScore: 70
    };

    const response = await client.chat.completions.create({
      model: DOUBAO_MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的股票分析师,擅长技术面和基本面分析。'
        },
        {
          role: 'user',
          content: `请基于以下股票数据,生成简短的投资分析报告(200字以内):\n\n股票: ${stockData.name} (${stockData.code})\n当前价格: ¥${stockData.currentPrice}\n涨跌幅: ${stockData.changePercent}%\nROE: ${stockData.fundamental.roe}%\n毛利率: ${stockData.fundamental.grossMargin}%\nPE: ${stockData.fundamental.pe}\n技术面: ${stockData.technical.maTrend}\n综合评分: ${stockData.overallScore}分\n\n请给出简单的投资建议(买入/持有/卖出)。`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log('✓ 报告生成成功!');
    console.log('\n报告内容:');
    console.log('---');
    console.log(response.choices[0].message.content);
    console.log('---');
    console.log('  Tokens:', response.usage);
  } catch (error) {
    console.error('✗ 报告生成失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
(async () => {
  await testConnection();
  await testStockReport();

  console.log('\n✓ 所有测试通过!');
  console.log('\n可以开始使用大模型功能了!');
})();
