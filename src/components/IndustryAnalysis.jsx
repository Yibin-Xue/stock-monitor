import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import stockStore from '../store/stockStore';
import { getSentimentLevel } from '../utils/utils';

const IndustryAnalysis = () => {
  const { industrySentiment, industryNews, loading, fetchIndustryData } = stockStore();

  useEffect(() => {
    fetchIndustryData();
  }, [fetchIndustryData]);

  if (loading.industry) {
    return <div className="loading">加载行业数据中...</div>;
  }

  return (
    <div className="industry-analysis">
      <h3>行业分析</h3>
      
      {/* 行业景气度 */}
      <div className="industry-sentiment">
        <h4>行业景气度</h4>
        <div className="sentiment-list">
          {industrySentiment.map((item, index) => {
            const level = getSentimentLevel(item.score);
            return (
              <div key={index} className="sentiment-item card">
                <div className="sentiment-header">
                  <div className="industry-name">
                    <Link to={`/industry/${item.industry}`}>{item.industry}</Link>
                  </div>
                  <div className="sentiment-score">
                    <span className="score-value">{item.score}</span>
                    <span className="score-level" style={{ color: level.color }}>{level.text}</span>
                  </div>
                </div>
                <div className="景气度评分">
                  <div className="景气度-bar">
                    <div 
                      className={`景气度-fill 景气度-${level.level}`} 
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                  <div className="trend-icon">
                    {item.trend === 'up' && '↑'}
                    {item.trend === 'down' && '↓'}
                    {item.trend === 'stable' && '→'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 行业动态 */}
      <div className="industry-news">
        <h4>行业动态</h4>
        {industryNews.map((item, index) => (
          <div key={index} className="news-section">
            <h5><Link to={`/industry/${item.industry}`}>{item.industry}</Link></h5>
            <div className="news-list">
              {item.news.map((news, newsIndex) => (
                <div key={newsIndex} className="news-item">
                  <div className="news-title">{news.title}</div>
                  <div className="news-time">{news.time}</div>
                  <div className="news-content">{news.content}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndustryAnalysis;