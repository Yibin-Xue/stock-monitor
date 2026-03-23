import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import stockStore from '../store/stockStore';
import { formatNumber, formatPercent, getChangeColor } from '../utils/utils';

const Watchlist = () => {
  const { watchlist, removeFromWatchlist, clearWatchlist, refreshWatchlist } = stockStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // 排序函数
  const sortedWatchlist = [...watchlist].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  // 分页逻辑
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedWatchlist.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedWatchlist.length / itemsPerPage);

  // 处理排序
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // 处理删除股票
  const handleRemoveStock = (code) => {
    removeFromWatchlist(code);
  };

  // 处理清空自选
  const handleClearWatchlist = () => {
    if (window.confirm('确定要清空自选股吗？')) {
      clearWatchlist();
    }
  };

  // 处理刷新行情
  const handleRefresh = async () => {
    await refreshWatchlist();
    setLastUpdated(new Date());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLastUpdated(new Date()), 0);
    return () => clearTimeout(timer);
  }, [watchlist.length]);

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
        <h3>自选股列表</h3>
        <div className="header-right">
          <div className="last-updated">
            数据更新时间: {lastUpdated.toLocaleString()}
          </div>
          {watchlist.length > 0 && (
            <>
              <button className="btn btn-secondary" onClick={handleRefresh}>
                刷新行情
              </button>
              <button className="btn btn-secondary" onClick={handleClearWatchlist}>
                清空自选
              </button>
            </>
          )}
        </div>
      </div>
      {watchlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <div className="empty-state-text">暂无自选股</div>
          <div className="empty-state-subtext">请通过搜索添加股票到自选池</div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('code')}>
                    股票代码 {sortConfig.key === 'code' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('name')}>
                    股票名称 {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('price')}>
                    当前价格 {sortConfig.key === 'price' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('changePercent')}>
                    涨跌幅 {sortConfig.key === 'changePercent' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('volume')}>
                    成交量(万手) {sortConfig.key === 'volume' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('turnover_rate')}>
                    换手率% {sortConfig.key === 'turnover_rate' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('pe')}>
                    PE {sortConfig.key === 'pe' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('total_mv')}>
                    市值(亿) {sortConfig.key === 'total_mv' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((stock) => {
                  const volume = stock.volume || 0;
                  const turnoverRate = parseFloat(stock.turnover_rate || 0);
                  const pe = parseFloat(stock.pe || 0);
                  const marketCap = parseFloat(stock.total_mv || stock.marketCap || 0);
                  const marketCapBillion = marketCap > 0 ? marketCap.toFixed(2) : 0;
                  const volumeWan = volume > 0 ? (volume / 10000).toFixed(2) : 0;

                  return (
                    <tr key={stock.code}>
                      <td><Link to={`/stock/${stock.code}`}>{stock.code}</Link></td>
                      <td><Link to={`/stock/${stock.code}`}>{stock.name}</Link></td>
                      <td>{formatNumber(stock.price)}</td>
                      <td className={getChangeColor(stock.change)}>
                        {stock.change >= 0 ? '+' : ''}{formatNumber(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{formatPercent(stock.changePercent)})
                      </td>
                      <td>{volumeWan}</td>
                      <td>{turnoverRate > 0 ? turnoverRate.toFixed(2) : '-'}</td>
                      <td>{pe > 0 ? pe.toFixed(2) : '-'}</td>
                      <td>{marketCapBillion}</td>
                      <td>
                        <Link to={`/stock/${stock.code}`} className="btn btn-primary mr-1">详情</Link>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleRemoveStock(stock.code)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                className={currentPage === index + 1 ? 'active' : ''}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}


    </div>
  );
};

export default Watchlist;