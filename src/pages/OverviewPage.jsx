import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MarketOverview from '../components/MarketOverview';
import IndustryAnalysis from '../components/IndustryAnalysis';
import stockStore from '../store/stockStore';
import { marketApi } from '../services/api';
import { formatNumber, formatPercent, getChangeColor } from '../utils/utils';

const OverviewPage = () => {
  const { watchlist, refreshWatchlist } = stockStore();
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    if (watchlist.length > 0) {
      refreshWatchlist();
    }
  }, [refreshWatchlist, watchlist.length]);

  // 按行业分类自选股
  const groupedStocks = watchlist.reduce((groups, stock) => {
    // 这里简化处理，实际项目中应该根据股票代码获取行业信息
    const industry = stock.code.startsWith('600') ? '白酒' : stock.code.startsWith('000') ? '白酒' : '科技';
    if (!groups[industry]) {
      groups[industry] = [];
    }
    groups[industry].push(stock);
    return groups;
  }, {});

  // 获取财经新闻
  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const result = await marketApi.getNews(10);
        if (result.code === 200) {
          setNews(result.data);
        }
      } catch (error) {
        console.error('获取财经新闻失败:', error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="overview-page">
      <div className="container">
        <h1>市场总览</h1>
        
        {/* 市场总体分析 */}
        <MarketOverview />
        
        {/* 自选股票总览 */}
        <div className="watchlist-overview">
          <h3>自选股票总览</h3>
          {Object.entries(groupedStocks).map(([industry, stocks]) => (
            <div key={industry} className="industry-category">
              <div className="industry-header">
                <h4>{industry}</h4>
                <span>{stocks.length}只股票</span>
              </div>
              <div className="industry-content">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>股票代码</th>
                        <th>股票名称</th>
                        <th>当前价格</th>
                        <th>涨跌幅</th>
                        <th>PE</th>
                        <th>市值(亿)</th>
                        <th>成交量</th>
                        <th>换手率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.map((stock) => (
                        <tr key={stock.code}>
                          <td><Link to={`/stock/${stock.code}`}>{stock.code}</Link></td>
                          <td><Link to={`/stock/${stock.code}`}>{stock.name}</Link></td>
                          <td>{formatNumber(stock.price)}</td>
                          <td className={getChangeColor(stock.change)}>
                            {stock.change >= 0 ? '+' : ''}{formatNumber(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{formatPercent(stock.changePercent)})
                          </td>
                          <td>{stock.pe > 0 ? stock.pe.toFixed(2) : '-'}</td>
                          <td>{stock.total_mv ? (stock.total_mv / 10000).toFixed(2) : '-'}</td>
                          <td>{stock.volume ? formatNumber(stock.volume) : '0'}</td>
                          <td>{stock.turnover_rate > 0 ? stock.turnover_rate.toFixed(2) + '%' : '0%'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
          {watchlist.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <div className="empty-state-text">暂无自选股</div>
              <div className="empty-state-subtext">请通过搜索添加股票到自选池</div>
            </div>
          )}
        </div>
        
        {/* 财经新闻 */}
        <div className="market-hotspots">
          <h3>财经新闻</h3>
          <div className="hotspots-grid">
            {newsLoading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <span>加载中...</span>
              </div>
            ) : news.length > 0 ? (
              news.map((item, index) => (
                <div key={index} className="hotspot-card">
                  <h4 className="hotspot-card-title">{item.title}</h4>
                  <p className="hotspot-card-content">{item.content}</p>
                  <div className="hotspot-card-meta">
                    <span className="hotspot-card-source">{item.source}</span>
                    <span className="hotspot-card-time">{new Date(item.time).toLocaleString()}</span>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hotspot-card-link">
                      查看原文
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📰</div>
                <div className="empty-state-text">暂无财经新闻</div>
                <div className="empty-state-subtext">稍后再试</div>
              </div>
            )}
          </div>
        </div>
        
        {/* 行业解读 */}
        <IndustryAnalysis />
      </div>
    </div>
  );
};

export default OverviewPage;