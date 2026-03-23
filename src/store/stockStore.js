import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const stockStore = create(
  persist(
    (set, get) => ({
      // 自选股列表
      watchlist: [],
      // 搜索结果
      searchResults: [],
      // 市场指数
      marketIndices: [],
      // 热门板块
      hotSectors: [],
      // 行业景气度
      industrySentiment: [],
      // 行业动态
      industryNews: [],
      // 数据加载状态
      loading: {
        search: false,
        market: false,
        watchlist: false,
        industry: false,
      },
      // 错误信息
      error: null,
      // 个性化设置
      settings: {
        refreshInterval: 30, // 秒
        defaultIndicators: ['price', 'change', 'volume'],
      },
      // 搜索股票
      searchStocks: async (keyword) => {
        set({ loading: { ...get().loading, search: true }, error: null });
        try {
          const response = await fetch(`http://localhost:3002/api/stocks/search?keyword=${encodeURIComponent(keyword)}`);
          const result = await response.json();

          if (result.code === 200) {
            // 后端返回的数据已经包含了 price, change 等字段
            set({ searchResults: result.data || [], loading: { ...get().loading, search: false } });
          } else {
            set({ error: result.message || '搜索失败', searchResults: [], loading: { ...get().loading, search: false } });
          }
        } catch (error) {
          console.error('搜索股票失败:', error);
          set({ error: error.message, searchResults: [], loading: { ...get().loading, search: false } });
        }
      },
      // 添加股票到自选
      addToWatchlist: (stock) => {
        const watchlist = get().watchlist;
        if (!watchlist.some(item => item.code === stock.code)) {
          set({ watchlist: [...watchlist, stock] });
        }
      },
      // 批量添加股票到自选
      batchAddToWatchlist: (stocks) => {
        const watchlist = get().watchlist;
        const newStocks = stocks.filter(stock => !watchlist.some(item => item.code === stock.code));
        set({ watchlist: [...watchlist, ...newStocks] });
      },
      // 从自选中删除股票
      removeFromWatchlist: (code) => {
        set({ watchlist: get().watchlist.filter(item => item.code !== code) });
      },
      // 清空自选
      clearWatchlist: () => {
        set({ watchlist: [] });
      },
      // 更新自选股行情数据（刷新价格等）
      refreshWatchlist: async () => {
        const watchlist = get().watchlist;
        if (watchlist.length === 0) return;

        set({ loading: { ...get().loading, watchlist: true } });

        try {
          const updatedWatchlist = await Promise.all(
            watchlist.map(async (stock) => {
              try {
                const response = await fetch(`http://localhost:3002/api/stocks/${stock.code}`);
                const result = await response.json();
                if (result.code === 200 && result.data) {
                  return {
                    ...stock,
                    price: result.data.price,
                    open: result.data.open,
                    high: result.data.high,
                    low: result.data.low,
                    pre_close: result.data.pre_close,
                    change: result.data.change,
                    changePercent: result.data.changePercent,
                    volume: result.data.volume,
                    turnover_rate: result.data.turnover_rate || 0,
                    turnover: result.data.turnover || 0,
                    pe: result.data.pe || result.data.pe_ttm || 0,
                    pb: result.data.pb || 0,
                    total_mv: result.data.total_mv || 0,
                    marketCap: result.data.total_mv || 0,
                  };
                }
                return stock;
              } catch (e) {
                console.error(`刷新股票 ${stock.code} 数据失败:`, e);
                return stock;
              }
            })
          );
          set({ watchlist: updatedWatchlist, loading: { ...get().loading, watchlist: false } });
        } catch (error) {
          console.error('刷新自选股数据失败:', error);
          set({ error: error.message, loading: { ...get().loading, watchlist: false } });
        }
      },
      // 获取市场数据
      fetchMarketData: async () => {
        set({ loading: { ...get().loading, market: true }, error: null });
        try {
          // 调用真实的API获取市场数据
          const [indicesResponse, sectorsResponse] = await Promise.all([
            fetch('http://localhost:3002/api/market/indices'),
            fetch('http://localhost:3002/api/market/sectors')
          ]);
          
          const indicesResult = await indicesResponse.json();
          const sectorsResult = await sectorsResponse.json();
          
          const marketIndices = indicesResult.code === 200 ? indicesResult.data : [];
          const hotSectors = sectorsResult.code === 200 ? sectorsResult.data : [];
          
          // 转换行业板块数据格式，确保字段名称一致
          const formattedSectors = hotSectors.map(sector => ({
            name: sector.industry || sector.name,
            change: parseFloat(sector.changePercent || sector.change) || 0,
            leader: sector.leader || '未知'
          }));
          
          set({
            marketIndices,
            hotSectors: formattedSectors,
            loading: { ...get().loading, market: false },
          });
        } catch (error) {
          console.error('获取市场数据失败:', error);
          set({ error: error.message, loading: { ...get().loading, market: false } });
        }
      },
      // 获取行业数据
      fetchIndustryData: async () => {
        set({ loading: { ...get().loading, industry: true }, error: null });
        try {
          // 调用真实的API获取行业数据
          const sentimentResponse = await fetch('http://localhost:3002/api/industry/sentiment');
          const sentimentResult = await sentimentResponse.json();
          
          const industrySentiment = sentimentResult.code === 200 ? sentimentResult.data : [];
          
          // 转换行业景气度数据格式
          const formattedSentiment = industrySentiment.map(item => ({
            industry: item.industry,
            score: item.sentiment || 50,
            trend: item.trend || 'stable'
          }));
          
          // 获取行业动态
          let industryNews = [];
          try {
            // 为每个行业获取动态新闻
            const newsPromises = formattedSentiment.slice(0, 2).map(async (item) => {
              try {
                const newsResponse = await fetch(`http://localhost:3002/api/industry/news?industry=${encodeURIComponent(item.industry)}`);
                const newsResult = await newsResponse.json();
                if (newsResult.code === 200 && newsResult.data) {
                  return {
                    industry: item.industry,
                    news: newsResult.data
                  };
                }
                return null;
              } catch (e) {
                console.error(`获取 ${item.industry} 行业动态失败:`, e);
                return null;
              }
            });
            
            const newsResults = await Promise.all(newsPromises);
            industryNews = newsResults.filter(item => item !== null);
          } catch (e) {
            console.error('获取行业动态失败:', e);
          }
          
          // 如果没有获取到行业动态，使用默认数据
          if (industryNews.length === 0) {
            industryNews = [
              {
                industry: '半导体',
                news: [
                  {
                    title: '半导体行业景气度持续回升',
                    time: '2026-03-20 09:30',
                    content: '根据最新数据，半导体行业景气度持续回升，产能利用率稳步提高。',
                  },
                  {
                    title: '国产芯片取得重大突破',
                    time: '2026-03-19 14:20',
                    content: '某国产芯片企业宣布在高端芯片领域取得重大技术突破。',
                  },
                ],
              },
              {
                industry: '新能源',
                news: [
                  {
                    title: '新能源汽车销量再创新高',
                    time: '2026-03-20 10:15',
                    content: '3月新能源汽车销量同比增长35%，再创新高。',
                  },
                  {
                    title: '电池技术获得新突破',
                    time: '2026-03-18 16:45',
                    content: '某电池企业宣布研发出高能量密度电池，续航里程提升20%。',
                  },
                ],
              },
            ];
          }
          
          set({
            industrySentiment: formattedSentiment,
            industryNews: industryNews,
            loading: { ...get().loading, industry: false },
          });
        } catch (error) {
          console.error('获取行业数据失败:', error);
          set({ error: error.message, loading: { ...get().loading, industry: false } });
        }
      },
      // 更新设置
      updateSettings: (newSettings) => {
        set({ settings: { ...get().settings, ...newSettings } });
      },

    }),
    {
      name: 'stock-watchlist-storage',
      version: 1, // 版本号，用于数据迁移
      partialize: (state) => ({
        // 只持久化自选股列表，其他数据不保存
        watchlist: state.watchlist,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('📦 自选股数据已从本地存储恢复:', state?.watchlist?.length || 0, '只股票');
      },
    }
  )
);

export default stockStore;