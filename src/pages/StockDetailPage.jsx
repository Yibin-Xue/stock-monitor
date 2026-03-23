import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { stockApi, aiApi } from '../services/api';
import { formatNumber, formatPercent, getChangeColor } from '../utils/utils';
import * as echarts from 'echarts';

const StockDetailPage = () => {
  // 内联样式
  const styles = {
    aiAnalysis: {
      marginTop: '20px',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
    },
    aiAnalyzeBtn: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    aiAnalyzeBtnDisabled: {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed',
    },
    analysisMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '15px',
      fontSize: '14px',
      color: '#666',
    },
    analysisText: {
      lineHeight: '1.6',
    },
    analysisPlaceholder: {
      padding: '20px',
      textAlign: 'center',
      color: '#666',
    },
    aiAnalysisResult: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
    },
    analysisHeader: {
      marginBottom: '15px',
    },
    analysisTitle: {
      marginBottom: '10px',
      color: '#333',
    },
    modelName: {
      fontSize: '12px',
      color: '#666',
    },
    analysisTime: {
      fontSize: '12px',
      color: '#666',
    },
    analysisContent: {
      lineHeight: '1.6',
    },
    analysisH5: {
      margin: '15px 0 10px 0',
      color: '#333',
      fontSize: '16px',
    },
    analysisH6: {
      margin: '10px 0 5px 0',
      color: '#666',
      fontSize: '14px',
    },
    analysisP: {
      margin: '5px 0',
      color: '#444',
      fontSize: '14px',
    },
  };
  const { code } = useParams();
  const [stockData, setStockData] = useState(null);
  const [klineData, setKlineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('day'); // day, week, month
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null); // 综合分析数据
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const klineChartRef = useRef(null);
  const chartInstance = useRef(null);

  // 验证股票数据合理性
  const validateStockData = (data) => {
    if (data.changePercent) {
      const changePercent = parseFloat(data.changePercent);
      if (Math.abs(changePercent) > 100) {
        console.warn('涨跌幅异常:', data.changePercent);
        data.changePercent = Math.max(-100, Math.min(100, changePercent)).toFixed(2);
      }
    }
    if (data.price < 0) {
      data.price = 0;
    }
    return data;
  };

  // 并行获取数据，提高加载速度
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        const [detailResponse, klineResponse, scoreResponse] = await Promise.all([
          stockApi.getDetail(code),
          stockApi.getKline(code, timePeriod),
          aiApi.getStockScore(code)
        ]);
        
        const stockDetail = detailResponse.data;
        validateStockData(stockDetail);
        setStockData(stockDetail);
        setKlineData(klineResponse.data);
        
        // 使用真实评分数据 (来自 /analyze API)
        if (scoreResponse.code === 200 && scoreResponse.data) {
          const data = scoreResponse.data;
          const tech = data.technical_analysis || {};
          const fund = data.fundamental_analysis || {};
          const advice = data.investment_advice || {};
          
          setAnalysisData({
            fundamental: {
              valuation: {
                pe: fund.valuation?.pe || stockDetail.pe || 0,
                pb: fund.valuation?.pb || stockDetail.pb || 0,
                pe_ttm: stockDetail.pe_ttm || 0,
                valuationLevel: fund.valuation?.level || '未知',
                valuationScore: fund.valuation?.score || 0
              },
              financialHealth: {
                currentRatio: fund.solvency?.current_ratio || stockDetail.financial?.currentRatio || 1.5,
                quickRatio: fund.solvency?.quick_ratio || stockDetail.financial?.quickRatio || 1.0,
                debtRatio: fund.solvency?.debt_ratio || stockDetail.financial?.debtRatio || 50,
                healthScore: fund.solvency?.score || 8
              },
              growth: {
                roe: fund.profitability?.roe || stockDetail.financial?.roe || 0,
                revenueGrowth: stockDetail.financial?.or_yoy,
                profitGrowth: stockDetail.financial?.profit_yoy,
                growthRating: fund.profitability?.level || '一般',
                growthScore: fund.profitability?.score || 6
              }
            },
            technical: {
              trend: tech.short_term?.trend || '震荡',
              signals: tech.short_term?.trend?.includes('上升') ? '看涨信号' : '看跌信号',
              technicalScore: tech.short_term?.strength || 50,
              rsi: tech.indicators?.rsi,
              macd: tech.indicators?.macd,
              support: tech.support_levels?.[0],
              resistance: tech.resistance_levels?.[0],
              shortTermTrend: tech.short_term?.trend,
              mediumTermTrend: tech.medium_term?.trend,
              longTermTrend: tech.long_term?.trend
            },
            fundFlow: {
              northFlow: '未知',
              marginBalance: '未知',
              mainFlow: '未知',
              fundScore: 10
            },
            macroIndustry: {
              industryTrend: '未知',
              policySupport: '未知',
              industryScore: 10
            },
            totalScore: advice.score || fund.overall_score || 50,
            rating: advice.recommendation || '观望',
            riskLevel: advice.risk_level || '中',
            riskItems: advice.risks || [],
            opportunities: advice.opportunities || [],
            shortTerm: advice.short_term || '观望',
            mediumTerm: advice.medium_term || '观望',
            longTerm: advice.long_term || '观望',
            dataTime: stockDetail.trade_date || new Date().toISOString().split('T')[0]
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('获取数据失败:', err);
        setError('获取股票数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [code, timePeriod]);

  // 初始化和更新K线图
  useEffect(() => {
    if (klineData.length === 0) return;

    // 初始化图表
    if (!chartInstance.current && klineChartRef.current) {
      chartInstance.current = echarts.init(klineChartRef.current);
    }

    // 配置K线图
    const option = {
      title: {
        text: `${stockData?.name || '股票'} K线图`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['K线', '成交量'],
        bottom: 10
      },
      grid: [
        {
          left: '3%',
          right: '4%',
          height: '60%'
        },
        {
          left: '3%',
          right: '4%',
          top: '70%',
          height: '20%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: [...klineData].reverse().map(item => item[0]),
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#8392A5' } }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: [...klineData].reverse().map(item => item[0]),
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#8392A5' } },
          axisLabel: { show: false },
          axisTick: { show: false }
        }
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: {
            show: false
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: [...klineData].reverse().map(item => [
            parseFloat(item[1]), // 开盘价
            parseFloat(item[4]), // 收盘价
            parseFloat(item[3]), // 最低价
            parseFloat(item[2])  // 最高价
          ]),
          itemStyle: {
            color: '#ff4d4f',   // 红色涨
            color0: '#52c41a',  // 绿色跌
            borderColor: '#ff4d4f',
            borderColor0: '#52c41a'
          }
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: [...klineData].reverse().map(item => item[5]),
          itemStyle: {
            color: '#1890ff'
          }
        }
      ]
    };

    // 更新图表
    if (chartInstance.current) {
      chartInstance.current.setOption(option);
    }

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [klineData, stockData]);

  // 生成深度报告（同时触发大模型分析）
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      console.log('[前端] 开始生成深度报告');
      
      // 调用大模型API生成深度分析报告
      const llmResponse = await aiApi.generateLLMReport(code);
      
      console.log('[前端] 大模型报告生成成功', llmResponse);
      
      // 设置报告数据
      setReportData(llmResponse.data.report);
      setReportGenerated(true);
      
      // 设置大模型分析数据
      setAiAnalysis({
        model: llmResponse.data.model,
        timestamp: llmResponse.data.generatedAt,
        analysis: llmResponse.data.report
      });
    } catch (error) {
      console.error('[前端] 生成报告失败:', error);
      console.error('错误堆栈:', error.stack);
      const errorMsg = error.response?.data?.message || error.message || '未知错误';
      alert('生成报告失败: ' + errorMsg + '\n\n详情请查看 Console（F12）');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return <div className="loading">加载股票数据中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!stockData) {
    return <div className="error">未找到股票数据</div>;
  }

  return (
    <div className="stock-detail-page">
      <div className="container">
        <h1>{stockData.name} ({stockData.code})</h1>
        
        {/* 最新数据模块 */}
        <div className="latest-data card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>最新数据</h3>
            <div className="data-time" style={{ fontSize: '14px', color: '#999' }}>
              数据时间: {stockData.trade_date || new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="data-grid">
            <div className="data-item">
              <div className="data-label">当前价格</div>
              <div className="data-value">{formatNumber(stockData.price)}</div>
            </div>
            <div className="data-item">
              <div className="data-label">涨跌幅</div>
              <div className={`data-value ${getChangeColor(stockData.change)}`}>
                {stockData.change >= 0 ? '+' : ''}{formatNumber(stockData.change)} ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent}%)
              </div>
            </div>
            <div className="data-item">
              <div className="data-label">开盘价</div>
              <div className="data-value">{formatNumber(stockData.open)}</div>
            </div>
            <div className="data-item">
              <div className="data-label">最高价</div>
              <div className="data-value">{formatNumber(stockData.high)}</div>
            </div>
            <div className="data-item">
              <div className="data-label">最低价</div>
              <div className="data-value">{formatNumber(stockData.low)}</div>
            </div>
            <div className="data-item">
              <div className="data-label">成交量</div>
              <div className="data-value">{formatNumber(stockData.volume * 100)}股</div>
            </div>
            <div className="data-item">
              <div className="data-label">市盈率(TTM)</div>
              <div className="data-value">{formatNumber(stockData.pe_ttm || stockData.pe)}</div>
            </div>
            <div className="data-item">
              <div className="data-label">市净率</div>
              <div className="data-value">{formatNumber(stockData.pb)}</div>
            </div>
            <div className="data-item">
              <div className="data-label">总市值</div>
              <div className="data-value">{formatNumber(stockData.total_mv / 10000)}亿</div>
            </div>
            <div className="data-item">
              <div className="data-label">流通市值</div>
              <div className="data-value">{formatNumber(stockData.circ_mv / 10000)}亿</div>
            </div>
            <div className="data-item">
              <div className="data-label">换手率</div>
              <div className="data-value">{formatNumber(stockData.turnover_rate || stockData.turnover)}%</div>
            </div>
            <div className="data-item">
              <div className="data-label">行业</div>
              <div className="data-value">{stockData.industry || '未知'}</div>
            </div>
          </div>
        </div>

        {/* 技术面解读模块 */}
        <div className="technical-analysis card">
          <h3>技术面分析</h3>
          <div className="kline-container">
            <div className="indicator-selector">
              <button 
                className={timePeriod === 'day' ? 'active' : ''} 
                onClick={() => setTimePeriod('day')}
              >
                日线
              </button>
              <button 
                className={timePeriod === 'week' ? 'active' : ''} 
                onClick={() => setTimePeriod('week')}
              >
                周线
              </button>
              <button 
                className={timePeriod === 'month' ? 'active' : ''} 
                onClick={() => setTimePeriod('month')}
              >
                月线
              </button>
            </div>
            {/* K线图容器 */}
            <div ref={klineChartRef} style={{ width: '100%', height: '400px' }}></div>
          </div>
        </div>

        {/* 核心结论速览 */}
        {analysisData && (
          <div className="core-conclusion card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>核心结论速览</h3>
              <div className="data-time" style={{ fontSize: '14px', color: '#999' }}>
                数据时间: {analysisData.dataTime || new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="conclusion-grid">
              <div className="conclusion-item">
                <div className="conclusion-label">综合评分</div>
                <div className="conclusion-value score">{analysisData.totalScore}</div>
              </div>
              <div className="conclusion-item">
                <div className="conclusion-label">投资评级</div>
                <div className="conclusion-value rating">{analysisData.rating}</div>
              </div>
              <div className="conclusion-item">
                <div className="conclusion-label">核心投资逻辑</div>
                <div className="conclusion-value">
                  {analysisData.opportunities?.length > 0 
                    ? analysisData.opportunities.join('；') 
                    : analysisData.rating === '强烈看好' ? '多维度全面向好，具备高投资价值' : 
                     analysisData.rating === '看好' ? '核心维度向好，具备较好投资价值' :
                     analysisData.rating === '中性观望' ? '多维度有分歧，无明确投资机会' :
                     '核心维度存在明显缺陷/风险'}
                </div>
              </div>
              <div className="conclusion-item">
                <div className="conclusion-label">核心风险点</div>
                <div className="conclusion-value">
                  {analysisData.riskItems.length > 0 ? analysisData.riskItems.join('; ') : '无明显风险'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 基本面分析模块 */}
        <div className="fundamental-analysis">
          <h3>基本面分析</h3>
          
          {/* 估值分析 */}
          {analysisData && (
            <div className="financial-card card">
              <h4>估值分析</h4>
              <div className="financial-grid">
                <div className="financial-item">
                  <div className="financial-label">PE(TTM)</div>
                  <div className="financial-value">{formatNumber(analysisData.fundamental.valuation.pe)}</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">PE</div>
                  <div className="financial-value">{formatNumber(analysisData.fundamental.valuation.pe_ttm)}</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">PB</div>
                  <div className="financial-value">{formatNumber(analysisData.fundamental.valuation.pb)}</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">估值水平</div>
                  <div className="financial-value">{analysisData.fundamental.valuation.valuationLevel}</div>
                </div>
              </div>
            </div>
          )}

          {/* 财务健康度分析 */}
          {analysisData && (
            <div className="financial-card card">
              <h4>财务健康度分析</h4>
              <div className="financial-grid">
                <div className="financial-item">
                  <div className="financial-label">流动比率</div>
                  <div className="financial-value">{formatNumber(analysisData.fundamental.financialHealth.currentRatio)}</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">速动比率</div>
                  <div className="financial-value">{formatNumber(analysisData.fundamental.financialHealth.quickRatio)}</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">资产负债率</div>
                  <div className="financial-value">{formatNumber(analysisData.fundamental.financialHealth.debtRatio)}%</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">财务健康评分</div>
                  <div className="financial-value">{analysisData.fundamental.financialHealth.healthScore}/15</div>
                </div>
              </div>
            </div>
          )}

          {/* 成长性分析 */}
          {analysisData && (
            <div className="financial-card card">
              <h4>成长性分析</h4>
              <div className="financial-grid">
                <div className="financial-item">
                  <div className="financial-label">营收增长率</div>
                  <div className="financial-value">{analysisData.fundamental.growth.revenueGrowth != null ? formatPercent(analysisData.fundamental.growth.revenueGrowth / 100) : '暂无数据'}</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">净利润增长率</div>
                  <div className="financial-value">{analysisData.fundamental.growth.profitGrowth != null ? formatPercent(analysisData.fundamental.growth.profitGrowth / 100) : '暂无数据'}</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">ROE</div>
                  <div className="financial-value">{analysisData.fundamental.growth.roe != null ? formatPercent(analysisData.fundamental.growth.roe / 100) : '暂无数据'}</div>
                </div>
                <div className="financial-item">
                  <div className="financial-label">成长性评级</div>
                  <div className="financial-value">{analysisData.fundamental.growth.growthRating}</div>
                </div>
              </div>
            </div>
          )}

          {/* 公司概况 */}
          <div className="company-card card">
            <h4>公司概况</h4>
            <div className="company-info">
              <div className="company-item">
                <div className="company-label">股票代码</div>
                <div className="company-value">{stockData.code}</div>
              </div>
              <div className="company-item">
                <div className="company-label">股票名称</div>
                <div className="company-value">{stockData.name}</div>
              </div>
              <div className="company-item">
                <div className="company-label">所属行业</div>
                <div className="company-value">{stockData.industry || '未知'}</div>
              </div>
              <div className="company-item">
                <div className="company-label">上市日期</div>
                <div className="company-value">{stockData.list_date || '未知'}</div>
              </div>
              <div className="company-item">
                <div className="company-label">交易所</div>
                <div className="company-value">{stockData.exchange === 'SH' ? '上海证券交易所' : '深圳证券交易所'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 技术面分析详细 */}
        {analysisData && (
          <div className="technical-analysis card">
            <h3>技术面分析详细</h3>
            <div className="analysis-content">
              <div className="analysis-grid">
                <div className="analysis-item">
                  <div className="analysis-label">趋势判断</div>
                  <div className="analysis-value">{analysisData.technical.trend}</div>
                </div>
                <div className="analysis-item">
                  <div className="analysis-label">买卖信号</div>
                  <div className="analysis-value">{analysisData.technical.signals}</div>
                </div>
                <div className="analysis-item">
                  <div className="analysis-label">技术面评分</div>
                  <div className="analysis-value">{analysisData.technical.technicalScore}/20</div>
                </div>
              </div>
              <p className="analysis-conclusion">
                技术面呈现{analysisData.technical.trend}，{analysisData.technical.signals}，
                {analysisData.technical.technicalScore >= 15 ? '短期走势向好' : 
                 analysisData.technical.technicalScore >= 10 ? '短期走势平稳' : '短期走势偏弱'}
              </p>
            </div>
          </div>
        )}

        {/* 风险预警清单 */}
        {analysisData && (
          <div className="risk-warning card">
            <h3>风险预警清单</h3>
            {analysisData.riskItems.length > 0 ? (
              <ul className="risk-list">
                {analysisData.riskItems.map((risk, index) => (
                  <li key={index} className="risk-item">
                    <span className="risk-icon">⚠️</span>
                    <span className="risk-content">{risk}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-risk">未发现明显风险项</p>
            )}
          </div>
        )}

        {/* 操作建议 */}
        {analysisData && (
          <div className="operation-suggestion card">
            <h3>操作建议</h3>
            <div className="suggestion-content">
              <div className="suggestion-item">
                <div className="suggestion-label">投资建议</div>
                <div className="suggestion-value">
                  {analysisData.rating === '强烈看好' ? '买入' : 
                   analysisData.rating === '看好' ? '买入' :
                   analysisData.rating === '中性观望' ? '观望' :
                   '卖出'}
                </div>
              </div>
              <div className="suggestion-item">
                <div className="suggestion-label">参考仓位</div>
                <div className="suggestion-value">
                  {analysisData.rating === '强烈看好' ? '70-90%' : 
                   analysisData.rating === '看好' ? '50-70%' :
                   analysisData.rating === '中性观望' ? '0-30%' :
                   '0%'}
                </div>
              </div>
              <div className="suggestion-item">
                <div className="suggestion-label">关键入场价位</div>
                <div className="suggestion-value">
                  {stockData ? formatNumber(stockData.price * 0.95) : '-'}
                </div>
              </div>
              <div className="suggestion-item">
                <div className="suggestion-label">止损价位</div>
                <div className="suggestion-value">
                  {stockData ? formatNumber(stockData.price * 0.85) : '-'}
                </div>
              </div>
            </div>
            <p className="disclaimer">
              免责声明：本分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。
            </p>
          </div>
        )}

        {/* 综合量化评分表 */}
        {analysisData && (
          <div className="score-table card">
            <h3>综合量化评分表</h3>
            <table className="analysis-table">
              <thead>
                <tr>
                  <th>分析维度</th>
                  <th>权重占比</th>
                  <th>得分</th>
                  <th>满分</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>基本面-估值水平</td>
                  <td>15%</td>
                  <td>{analysisData.fundamental.valuation.valuationScore}</td>
                  <td>15</td>
                </tr>
                <tr>
                  <td>基本面-财务健康度</td>
                  <td>15%</td>
                  <td>{analysisData.fundamental.financialHealth.healthScore}</td>
                  <td>15</td>
                </tr>
                <tr>
                  <td>基本面-成长性</td>
                  <td>10%</td>
                  <td>{analysisData.fundamental.growth.growthScore}</td>
                  <td>10</td>
                </tr>
                <tr>
                  <td>技术面分析</td>
                  <td>20%</td>
                  <td>{analysisData.technical.technicalScore}</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>资金与情绪面分析</td>
                  <td>20%</td>
                  <td>{analysisData.fundFlow.fundScore}</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>宏观与行业分析</td>
                  <td>20%</td>
                  <td>{analysisData.macroIndustry.industryScore}</td>
                  <td>20</td>
                </tr>
                <tr className="total-row">
                  <td>综合得分</td>
                  <td>100%</td>
                  <td>{analysisData.totalScore}</td>
                  <td>100</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 智能深度分析 */}
        <div className="intelligent-analysis card">
          <h3>智能深度分析</h3>
          <div className="analysis-content">
            {/* 初始状态 */}
            {!reportGenerated && !generatingReport && (
              <div className="report-placeholder">
                <div className="report-icon">🤖</div>
                <div className="report-text">
                  <p>点击下方按钮，调用大模型生成深度分析报告</p>
                  <p>报告将包含：市场分析、财务分析、行业分析、风险因素、投资建议等多维度信息</p>
                </div>
                <button 
                  className="btn btn-primary generate-report-btn"
                  onClick={handleGenerateReport}
                  disabled={!stockData}
                >
                  生成深度分析报告
                </button>
              </div>
            )}
            
            {/* 生成中状态 */}
            {generatingReport && (
              <div className="report-loading">
                <div className="loading-spinner"></div>
                <p>正在生成深度分析报告... 请稍候</p>
              </div>
            )}
            
            {/* 生成完成状态 */}
            {reportGenerated && aiAnalysis && (
              <div className="report-result">
                {/* 大模型深度分析结果 */}
                <div className="ai-analysis-result" style={styles.aiAnalysisResult}>
                  <div className="analysis-header" style={styles.analysisHeader}>
                    <h4 style={styles.analysisTitle}>大模型深度分析</h4>
                    <div className="analysis-meta" style={styles.analysisMeta}>
                      <span className="model-name" style={styles.modelName}>模型: {aiAnalysis.model}</span>
                      <span className="analysis-time" style={styles.analysisTime}>分析时间: {new Date(aiAnalysis.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="analysis-content" style={styles.analysisContent}>
                    {aiAnalysis.analysis.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return <h5 key={index} style={styles.analysisH5}>{line.replace(/^#+\s*/, '')}</h5>;
                      } else if (line.startsWith('## ') || line.startsWith('### ')) {
                        return <h6 key={index} style={styles.analysisH6}>{line.replace(/^#+\s*/, '')}</h6>;
                      } else if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={index} style={{...styles.analysisP, fontWeight: 'bold'}}>{line.replace(/\*\*/g, '')}</p>;
                      } else if (line.trim() !== '') {
                        return <p key={index} style={styles.analysisP}>{line}</p>;
                      } else {
                        return <br key={index} />;
                      }
                    })}
                  </div>
                </div>
                
                <div className="report-footer">
                  <p className="report-source">数据来源：金融数据API（Tushare）+ 大模型分析</p>
                  <p className="report-disclaimer">免责声明：本报告由AI生成，仅供参考，不构成投资建议</p>
                </div>
                <button 
                  className="btn btn-secondary mt-2"
                  onClick={() => {
                    setReportGenerated(false);
                    setReportData(null);
                    setAiAnalysis(null);
                  }}
                >
                  重新生成报告
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailPage;