const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const doubaoService = require('../services/doubaoService');

// 加载环境变量
dotenv.config();

const router = express.Router();

// Python 脚本路径 - 根据是否配置了Tushare Token选择不同的服务
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN || '';
const ANALYSIS_SCRIPT_PATH = TUSHARE_TOKEN
  ? path.join(__dirname, '../services/analysis_service_tushare.py')
  : path.join(__dirname, '../services/analysis_service.py');

/**
 * 调用 Python 分析脚本
 */
function callAnalysisService(code) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [ANALYSIS_SCRIPT_PATH, 'analyze', code]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString('utf8');
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString('utf8');
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          if (result.code === 0) {
            resolve(result.data);
          } else {
            reject(new Error(result.msg || '分析失败'));
          }
        } catch (e) {
          reject(new Error(`解析结果失败: ${e.message}\n输出: ${stdout}`));
        }
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`启动 Python 进程失败: ${err.message}`));
    });

    // 设置超时 (60秒)
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('分析超时'));
    }, 60000);
  });
}

// ========== 股票深度分析 ==========
router.get('/:code/analyze', async (req, res) => {
  const { code } = req.params;

  try {
    console.log(`[AI分析] 开始分析股票: ${code}`);

    const analysisReport = await callAnalysisService(code);

    console.log(`[AI分析] 股票 ${code} 分析完成`);

    return res.json({
      code: 200,
      data: analysisReport,
      message: '分析成功'
    });
  } catch (error) {
    console.error(`[AI分析] 股票 ${code} 分析失败:`, error.message);

    return res.json({
      code: 500,
      message: '分析失败',
      error: error.message
    });
  }
});

// ========== 获取股票评分数据 ==========
router.get('/:code/score', async (req, res) => {
  const { code } = req.params;

  try {
    console.log(`[评分] 获取股票评分: ${code}`);

    const analysisData = await callAnalysisService(code);

    // 提取评分相关数据
    const scoreData = {
      // 基本面评分
      fundamental: {
        valuation: analysisData.fundamental_analysis?.valuation || {},
        financialHealth: {
          debtRatio: analysisData.fundamental_analysis?.solvency?.debt_ratio,
          currentRatio: analysisData.fundamental_analysis?.solvency?.current_ratio,
          score: analysisData.fundamental_analysis?.solvency?.score,
          level: analysisData.fundamental_analysis?.solvency?.level
        },
        growth: {
          roe: analysisData.fundamental_analysis?.profitability?.roe,
          score: analysisData.fundamental_analysis?.profitability?.score,
          level: analysisData.fundamental_analysis?.profitability?.level
        }
      },
      // 技术面评分
      technical: {
        trend: analysisData.technical_analysis?.short_term?.trend || '震荡',
        shortTermTrend: analysisData.technical_analysis?.short_term?.trend || '震荡',
        mediumTermTrend: analysisData.technical_analysis?.medium_term?.trend || '震荡',
        longTermTrend: analysisData.technical_analysis?.long_term?.trend || '震荡',
        signals: analysisData.technical_analysis?.short_term?.trend?.includes('上升') ? '看涨' : '无明确信号',
        technicalScore: analysisData.technical_analysis?.short_term?.strength || 50,
        rsi: analysisData.technical_analysis?.indicators?.rsi,
        macd: analysisData.technical_analysis?.indicators?.macd,
        support: analysisData.technical_analysis?.support_levels?.[0],
        resistance: analysisData.technical_analysis?.resistance_levels?.[0]
      },
      // 综合评分
      overallScore: analysisData.investment_advice?.score || 50,
      rating: analysisData.investment_advice?.recommendation || '观望',
      riskLevel: analysisData.investment_advice?.risk_level || '中',
      // 投资建议
      opportunities: analysisData.investment_advice?.opportunities || [],
      risks: analysisData.investment_advice?.risks || [],
      shortTerm: analysisData.investment_advice?.short_term || '观望',
      mediumTerm: analysisData.investment_advice?.medium_term || '观望',
      longTerm: analysisData.investment_advice?.long_term || '观望'
    };

    return res.json({
      code: 200,
      data: scoreData,
      message: '获取评分成功'
    });
  } catch (error) {
    console.error(`[评分] 股票 ${code} 获取评分失败:`, error.message);

    return res.json({
      code: 500,
      message: '获取评分失败',
      error: error.message
    });
  }
});

// ========== 批量分析 ==========
router.post('/batch-analyze', async (req, res) => {
  const { codes } = req.body;

  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return res.json({
      code: 400,
      message: '请提供股票代码列表'
    });
  }

  // 限制批量分析数量(最多5只)
  const maxCodes = Math.min(codes.length, 5);
  const codesToAnalyze = codes.slice(0, maxCodes);

  try {
    console.log(`[AI分析] 批量分析 ${maxCodes} 只股票`);

    // 并行分析
    const analysisPromises = codesToAnalyze.map(code =>
      callAnalysisService(code).catch(error => ({
        code: code,
        error: error.message
      }))
    );

    const results = await Promise.all(analysisPromises);

    console.log(`[AI分析] 批量分析完成,成功 ${results.filter(r => !r.error).length}/${maxCodes}`);

    return res.json({
      code: 200,
      data: results,
      message: `批量分析完成,成功 ${results.filter(r => !r.error).length}/${maxCodes}`
    });
  } catch (error) {
    console.error('[AI分析] 批量分析失败:', error.message);

    return res.json({
      code: 500,
      message: '批量分析失败',
      error: error.message
    });
  }
});

// ========== 大模型深度分析报告 ==========
// 策略：先快速获取股票基础行情（stockApi），同时异步获取Python分析数据
// 如果 Python 在 25 秒内返回则合并，否则仅凭基础数据让大模型生成报告
router.get('/:code/llm-report', async (req, res) => {
  const { code } = req.params;

  try {
    console.log(`[大模型报告] 开始生成 ${code} 的分析报告`);

    // 并行：Python分析 + 超时保护（25秒以内优先使用，超时则用空数据兜底）
    const pythonDataPromise = callAnalysisService(code);
    const timeoutPromise = new Promise(resolve =>
      setTimeout(() => resolve(null), 25000) // 25秒超时兜底
    );

    const stockData = await Promise.race([pythonDataPromise, timeoutPromise]);

    if (stockData) {
      console.log(`[大模型报告] Python分析完成，开始调用大模型`);
    } else {
      console.warn(`[大模型报告] Python分析超时，仅凭股票代码调用大模型`);
    }

    // 2. 调用 Doubao 生成深度分析报告（stockData 为 null 时也能工作）
    const dataForLLM = stockData || { stock: { code }, technical_analysis: {}, fundamental_analysis: {} };
    const report = await doubaoService.generateStockReport(dataForLLM);

    console.log(`[大模型报告] ${code} 的报告生成完成`);

    return res.json({
      code: 200,
      data: {
        code: stockData?.stock?.code || code,
        name: stockData?.stock?.name || code,
        report: report,
        generatedAt: new Date().toISOString(),
        model: process.env.DOUBAO_MODEL || 'doubao-seed-2-0-pro',
        basicData: {
          currentPrice: stockData?.stock?.current_price,
          changePercent: stockData?.stock?.change_pct,
          technical: stockData?.technical_analysis,
          fundamental: stockData?.fundamental_analysis,
          overallScore: stockData?.investment_advice?.score
        }
      },
      message: '报告生成成功'
    });
  } catch (error) {
    console.error(`[大模型报告] 生成 ${code} 的报告失败:`, error.message);

    return res.json({
      code: 500,
      message: '生成报告失败',
      error: error.message
    });
  }
});

// ========== 测试大模型连接 ==========
router.get('/test-connection', async (req, res) => {
  try {
    console.log('[测试] 测试大模型连接');

    const result = await doubaoService.testConnection();

    console.log('[测试] 连接成功:', result);

    return res.json({
      code: 200,
      data: {
        model: process.env.DOUBAO_MODEL || 'doubao-seed-2-0-pro',
        response: result
      },
      message: '连接成功'
    });
  } catch (error) {
    console.error('[测试] 连接失败:', error.message);

    return res.json({
      code: 500,
      message: '连接失败',
      error: error.message
    });
  }
});

module.exports = router;
