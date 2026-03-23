import React, { useState, useEffect } from 'react';
import stockStore from '../store/stockStore';

const StockSearch = () => {
  const [keyword, setKeyword] = useState('');
  const { searchStocks, searchResults, loading, addToWatchlist } = stockStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.trim()) {
        searchStocks(keyword);
      } else {
        stockStore.setState({ searchResults: [] });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, searchStocks]);

  const handleAddStock = (stock) => {
    addToWatchlist(stock);
    // 显示添加成功提示
    alert('添加成功！');
  };

  return (
    <div className="search-container">
      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="请输入股票代码或名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="search-button">搜索</button>
      </div>
      {loading.search && (
        <div className="loading">搜索中...</div>
      )}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>搜索结果</h4>
          <div className="stock-list">
            {searchResults.map((stock) => {
              const price = stock.price ?? 0;
              const change = stock.change ?? 0;
              const changePercent = stock.changePercent ?? 0;
              const marketCap = stock.marketCap ?? 0;

              return (
                <div key={stock.code} className="stock-item">
                  <div className="stock-info">
                    <div className="stock-code">{stock.code} | {stock.market || 'A股'}</div>
                    <div className="stock-name">{stock.name}</div>
                    <div className="stock-price">{price.toFixed(2)}</div>
                    <div className={`stock-change ${change >= 0 ? 'rose' : 'fall'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                    </div>
                    <div className="stock-market-cap">市值: {marketCap}亿</div>
                  </div>
                  <div className="stock-actions">
                    <button className="btn btn-primary" onClick={() => handleAddStock(stock)}>
                      添加
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSearch;