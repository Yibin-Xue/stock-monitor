import React, { useState } from 'react';
import './StockAnalysis.css';

// API 基础地址，优先使用环境变量，生产环境默认 Zeabur 后端
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://stock-monitor.zeabur.app';

const StockAnalysis = ({ code, name, onClose }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch(`${API_BASE}/api/analysis/${code}/analyze`);
      const result = await response.json();

      if (result.code === 200) {
        setAnalysis(result.data);
      } else {
        setError(result.message || '分析失败');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading && !error) {
    return (
      <div className="stock-analysis">
        <div className="analysis-header">
          <h3>{name} ({code}) - AI深度分析</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="analysis-start">
          <p>点击下方按钮开始AI智能分析</p>
          <button className="analyze-btn" onClick={handleAnalyze}>
            🚀 开始分析
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stock-analysis loading">
        <div className="analysis-header">
          <h3>{name} ({code}) - AI深度分析</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="loading-content">
          <div className="spinner"></div>
          <p>AI正在深度分析中,请稍候...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-analysis">
        <div className="analysis-header">
          <h3>{name} ({code}) - AI深度分析</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="error-content">
          <p className="error-message">❌ {error}</p>
          <button className="retry-btn" onClick={handleAnalyze}>重试</button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { technical_analysis, fundamental_analysis, investment_advice, stock } = analysis;

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getRecommendationColor = (rec) => {
    const map = {
      '买入': '#10b981',
      '增持': '#34d399',
      '持有': '#f59e0b',
      '减持': '#fb923c',
      '卖出': '#ef4444'
    };
    return map[rec] || '#6b7280';
  };

  return (
    <div className="stock-analysis">
      <div className="analysis-header">
        <h3>{stock.name} ({stock.code}) - AI深度分析报告</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {/* 基本信息 */}
      <div className="analysis-section stock-info">
        <div className="info-item">
          <span className="label">最新价</span>
          <span className="value price">{stock.current_price.toFixed(2)}</span>
        </div>
        <div className="info-item">
          <span className="label">涨跌幅</span>
          <span className={`value change ${stock.change_pct >= 0 ? 'up' : 'down'}`}>
            {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct.toFixed(2)}%
          </span>
        </div>
        <div className="info-item">
          <span className="label">分析时间</span>
          <span className="value">{analysis.analysis_time}</span>
        </div>
        <div className="info-item">
          <span className="label">数据来源</span>
          <span className="value source">{analysis.data_source}</span>
        </div>
      </div>

      {/* 投资建议 */}
      <div className="analysis-section recommendation">
        <h4>📊 投资建议</h4>
        <div className="recommendation-content">
          <div className="main-recommendation">
            <div className="rec-badge" style={{ backgroundColor: getRecommendationColor(investment_advice.recommendation) }}>
              {investment_advice.recommendation}
            </div>
            <div className="rec-details">
              <div className="rec-score">
                <span>综合评分: </span>
                <span style={{ color: getScoreColor(investment_advice.score), fontSize: '1.5em', fontWeight: 'bold' }}>
                  {investment_advice.score}分
                </span>
              </div>
              <div className="rec-risk">风险等级: {investment_advice.risk_level}</div>
            </div>
          </div>
          <div className="time-frame">
            <div className="frame-item">
              <span>短期: </span>
              <span className={`status ${investment_advice.short_term.includes('看好') ? 'bullish' : 'bearish'}`}>
                {investment_advice.short_term}
              </span>
            </div>
            <div className="frame-item">
              <span>中期: </span>
              <span className={`status ${investment_advice.medium_term.includes('看好') ? 'bullish' : 'bearish'}`}>
                {investment_advice.medium_term}
              </span>
            </div>
            <div className="frame-item">
              <span>长期: </span>
              <span className={`status ${investment_advice.long_term.includes('看好') ? 'bullish' : 'bearish'}`}>
                {investment_advice.long_term}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 技术分析 */}
      <div className="analysis-section technical">
        <h4>📈 技术分析</h4>
        <div className="trend-grid">
          <div className="trend-card">
            <div className="trend-label">短期趋势</div>
            <div className="trend-value">{technical_analysis.short_term.trend}</div>
            <div className="trend-indicators">
              <span>MA5: {technical_analysis.short_term.ma5}</span>
              <span>MA10: {technical_analysis.short_term.ma10}</span>
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-label">中期趋势</div>
            <div className="trend-value">{technical_analysis.medium_term.trend}</div>
            <div className="trend-indicators">
              <span>MA20: {technical_analysis.medium_term.ma20}</span>
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-label">长期趋势</div>
            <div className="trend-value">{technical_analysis.long_term.trend}</div>
          </div>
        </div>
        <div className="technical-details">
          <div className="detail-item">
            <span className="label">支撑位: </span>
            <span className="values">{technical_analysis.support_levels.join(', ') || '暂无数据'}</span>
          </div>
          <div className="detail-item">
            <span className="label">压力位: </span>
            <span className="values">{technical_analysis.resistance_levels.join(', ') || '暂无数据'}</span>
          </div>
          <div className="detail-item">
            <span className="label">成交量: </span>
            <span className="values">{technical_analysis.volume_trend}</span>
          </div>
          <div className="detail-item">
            <span className="label">RSI: </span>
            <span className={`values ${technical_analysis.indicators.rsi > 70 ? 'overbought' : technical_analysis.indicators.rsi < 30 ? 'oversold' : 'normal'}`}>
              {technical_analysis.indicators.rsi}
              {technical_analysis.indicators.rsi > 70 && ' (超买)'}
              {technical_analysis.indicators.rsi < 30 && ' (超卖)'}
            </span>
          </div>
        </div>
      </div>

      {/* 基本面分析 */}
      <div className="analysis-section fundamental">
        <h4>💰 基本面分析</h4>
        <div className="fundamental-grid">
          <div className="fundamental-card">
            <div className="card-header">
              <span>盈利能力</span>
              <span className="score-badge" style={{ color: getScoreColor(fundamental_analysis.profitability.score) }}>
                {fundamental_analysis.profitability.score}分 - {fundamental_analysis.profitability.level}
              </span>
            </div>
            <div className="card-content">
              <div className="metric">ROE: {fundamental_analysis.profitability.roe}%</div>
              <div className="metric">毛利率: {fundamental_analysis.profitability.gross_margin}%</div>
              <div className="metric">净利率: {fundamental_analysis.profitability.net_margin}%</div>
            </div>
          </div>
          <div className="fundamental-card">
            <div className="card-header">
              <span>偿债能力</span>
              <span className="score-badge" style={{ color: getScoreColor(fundamental_analysis.solvency.score) }}>
                {fundamental_analysis.solvency.score}分 - {fundamental_analysis.solvency.level}
              </span>
            </div>
            <div className="card-content">
              <div className="metric">资产负债率: {fundamental_analysis.solvency.debt_ratio}%</div>
              <div className="metric">流动比率: {fundamental_analysis.solvency.current_ratio}</div>
            </div>
          </div>
          <div className="fundamental-card">
            <div className="card-header">
              <span>估值水平</span>
              <span className="score-badge" style={{ color: getScoreColor(fundamental_analysis.valuation.score) }}>
                {fundamental_analysis.valuation.score}分 - {fundamental_analysis.valuation.level}
              </span>
            </div>
            <div className="card-content">
              <div className="metric">PE: {fundamental_analysis.valuation.pe}</div>
              <div className="metric">PB: {fundamental_analysis.valuation.pb}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 机会与风险 */}
      <div className="analysis-section opportunities-risks">
        <div className="opportunities">
          <h4 style={{ color: '#10b981' }}>✅ 投资机会</h4>
          <ul>
            {investment_advice.opportunities.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="risks">
          <h4 style={{ color: '#ef4444' }}>⚠️ 风险提示</h4>
          <ul>
            {investment_advice.risks.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="analysis-footer">
        <button className="refresh-btn" onClick={handleAnalyze}>🔄 重新分析</button>
        <button className="close-btn" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
};

export default StockAnalysis;
