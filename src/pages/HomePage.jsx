import React, { useEffect } from 'react';
import StockSearch from '../components/StockSearch';
import Watchlist from '../components/Watchlist';
import stockStore from '../store/stockStore';

const HomePage = () => {
  const { refreshWatchlist, watchlist } = stockStore();

  useEffect(() => {
    if (watchlist.length > 0) {
      console.log('🔄 刷新自选股行情数据...');
      refreshWatchlist();
    }
  }, [refreshWatchlist, watchlist.length]);

  return (
    <div className="home-page">
      <div className="container">
        <h1>智能股票自选监控</h1>
        <StockSearch />
        <Watchlist />
      </div>
    </div>
  );
};

export default HomePage;