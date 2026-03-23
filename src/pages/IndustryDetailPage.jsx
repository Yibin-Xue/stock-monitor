import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { industryApi } from '../services/api';
import * as echarts from 'echarts';

const IndustryDetailPage = () => {
  const { industry } = useParams();
  const [industryData, setIndustryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const priceChartRef = useRef(null);
  const marketShareChartRef = useRef(null);
  const priceChartInstance = useRef(null);
  const marketShareChartInstance = useRef(null);

  useEffect(() => {
    const fetchIndustryData = async () => {
      try {
        setLoading(true);
        const response = await industryApi.getDetail(industry);
        setIndustryData(response.data);
        setError(null);
      } catch (err) {
        setError('获取行业数据失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIndustryData();
  }, [industry]);

  // 初始化和更新图表
  useEffect(() => {
    if (!industryData) return;

    // 初始化价格走势图表
    if (!priceChartInstance.current && priceChartRef.current) {
      priceChartInstance.current = echarts.init(priceChartRef.current);
    }

    // 初始化市场份额图表
    if (!marketShareChartInstance.current && marketShareChartRef.current) {
      marketShareChartInstance.current = echarts.init(marketShareChartRef.current);
    }

    // 配置价格走势图表
    const priceOption = {
      title: {
        text: '价格走势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: industryData.priceTrend.map(item => item[0])
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: industryData.priceTrend.map(item => item[1]),
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#1890ff'
        }
      }]
    };

    // 配置市场份额图表
    const marketShareOption = {
      title: {
        text: '主要企业市场份额',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [{
        name: '市场份额',
        type: 'pie',
        radius: '50%',
        data: industryData.companies.map(company => ({
          name: company.name,
          value: company.marketShare
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };

    // 更新图表
    if (priceChartInstance.current) {
      priceChartInstance.current.setOption(priceOption);
    }

    if (marketShareChartInstance.current) {
      marketShareChartInstance.current.setOption(marketShareOption);
    }

    // 响应式调整
    const handleResize = () => {
      priceChartInstance.current?.resize();
      marketShareChartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      priceChartInstance.current?.dispose();
      marketShareChartInstance.current?.dispose();
      priceChartInstance.current = null;
      marketShareChartInstance.current = null;
    };
  }, [industryData]);

  if (loading) {
    return <div className="loading">加载行业数据中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!industryData) {
    return <div className="error">未找到行业数据</div>;
  }

  return (
    <div className="industry-detail-page">
      <div className="container">
        <h1>{industryData.industry}行业深度分析</h1>
        
        {/* 行业概况 */}
        <div className="industry-overview card">
          <h3>行业概况</h3>
          <div className="industry-scale-card">
            <h4>行业规模</h4>
            <div className="industry-scale-grid">
              <div className="industry-scale-item">
                <div className="industry-scale-label">市场容量</div>
                <div className="industry-scale-value">{industryData.scale}亿元</div>
              </div>
              <div className="industry-scale-item">
                <div className="industry-scale-label">CR5占比</div>
                <div className="industry-scale-value">{industryData.cr5}%</div>
              </div>
              <div className="industry-scale-item">
                <div className="industry-scale-label">CR10占比</div>
                <div className="industry-scale-value">{industryData.cr10}%</div>
              </div>
              <div className="industry-scale-item">
                <div className="industry-scale-label">产业链</div>
                <div className="industry-scale-value">{industryData.chain}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 行业景气度 */}
        <div className="industry-sentiment card">
          <h3>行业景气度</h3>
          <div className="sentiment-content">
            <div className="sentiment-item">
              <div className="sentiment-label">供需状况</div>
              <div className="sentiment-value">{industryData.supplyDemand}</div>
            </div>
            <div className="sentiment-item">
              <div className="sentiment-label">价格走势</div>
              <div ref={priceChartRef} style={{ width: '100%', height: '300px' }}>
                {/* 价格走势图表 */}
              </div>
            </div>
          </div>
        </div>

        {/* 竞争格局 */}
        <div className="competition-landscape card">
          <h3>竞争格局</h3>
          <div className="competition-content">
            <h4>主要企业市场份额</h4>
            <div ref={marketShareChartRef} style={{ width: '100%', height: '300px' }}>
              {/* 市场份额图表 */}
            </div>
            <div className="companies-list">
              {industryData.companies.map((company, index) => (
                <div key={index} className="company-item">
                  <div className="company-name">{company.name}</div>
                  <div className="company-market-share">{company.marketShare}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 发展趋势 */}
        <div className="development-trends card">
          <h3>发展趋势</h3>
          <div className="trends-content">
            <h4>技术发展方向</h4>
            <ul className="trends-list">
              {industryData.trends.map((trend, index) => (
                <li key={index}>{trend}</li>
              ))}
            </ul>
            
            <h4>专家观点</h4>
            {industryData.experts.map((expert, index) => (
              <div key={index} className="expert-card">
                <div className="expert-title">{expert.name}</div>
                <div className="expert-content">{expert.opinion}</div>
                <div className="expert-source">{expert.source}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustryDetailPage;