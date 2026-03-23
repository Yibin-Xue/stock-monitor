import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OverviewPage from './pages/OverviewPage';
import StockDetailPage from './pages/StockDetailPage';
import IndustryDetailPage from './pages/IndustryDetailPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        {/* 导航栏 */}
        <nav className="navbar">
          <div className="container">
            <div className="navbar-brand">
              <NavLink to="/" className="brand-link">
                智能股票监控
              </NavLink>
            </div>
            <div className="navbar-nav">
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                首页
              </NavLink>
              <NavLink to="/overview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                市场总览
              </NavLink>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/stock/:code" element={<StockDetailPage />} />
            <Route path="/industry/:industry" element={<IndustryDetailPage />} />
          </Routes>
        </main>

        {/* 页脚 */}
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-info">
                <p>© 2026 智能股票监控</p>
                <p>数据来源：Tushare Pro API</p>
              </div>
              <div className="footer-links">
                <a href="#">关于我们</a>
                <a href="#">使用帮助</a>
                <a href="#">隐私政策</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;