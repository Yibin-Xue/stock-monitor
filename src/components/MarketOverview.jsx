import React, { useEffect, useState, useCallback } from 'react';
import { marketApi } from '../services/api';

// ---- 工具函数 ----
const fmt = (v, digits = 2) => {
  if (v == null || isNaN(v)) return '--';
  return Number(v).toFixed(digits);
};
const fmtPct = (v) => {
  if (v == null || isNaN(v)) return '--';
  const n = Number(v);
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
};
const fmtAmt = (v, unit = '亿') => {
  if (v == null || isNaN(v)) return '--';
  return Number(v).toFixed(2) + unit;
};
const changeColor = (v) => {
  if (v == null || isNaN(v)) return '#aaa';
  return Number(v) >= 0 ? '#e84141' : '#00b578';
};
const changeBg = (v) => {
  if (v == null || isNaN(v)) return 'transparent';
  return Number(v) >= 0 ? 'rgba(232,65,65,0.08)' : 'rgba(0,181,120,0.08)';
};

// ---- 子组件：指数卡片 ----
const IndexCard = ({ name, data, amountUnit }) => {
  if (!data) return (
    <div style={styles.indexCard}>
      <div style={styles.indexName}>{name}</div>
      <div style={styles.indexPrice}>--</div>
      <div style={styles.indexChange}>暂无数据</div>
    </div>
  );
  const color = changeColor(data.pct_chg);
  return (
    <div style={{ ...styles.indexCard, background: changeBg(data.pct_chg) }}>
      <div style={styles.indexName}>{name}</div>
      <div style={{ ...styles.indexPrice, color }}>{fmt(data.close)}</div>
      <div style={{ ...styles.indexChange, color }}>
        {fmtPct(data.pct_chg)}
        {data.change != null && (
          <span style={styles.indexChangeAbs}> ({data.change >= 0 ? '+' : ''}{fmt(data.change)})</span>
        )}
      </div>
      {data.amountBillion != null && (
        <div style={styles.indexAmount}>成交 {fmtAmt(data.amountBillion, amountUnit || '亿')}</div>
      )}
    </div>
  );
};

// ---- 子组件：资金流向徽章 ----
const MoneyBadge = ({ label, value, unit }) => {
  const color = changeColor(value);
  return (
    <div style={styles.moneyBadge}>
      <span style={styles.moneyLabel}>{label}</span>
      <span style={{ ...styles.moneyValue, color }}>
        {value != null ? (value >= 0 ? '+' : '') + fmt(value) + (unit || '亿') : '--'}
      </span>
    </div>
  );
};

// ---- 子组件：板块排行 ----
const SectorRank = ({ title, sectors, isTop }) => (
  <div style={styles.sectorBlock}>
    <div style={styles.sectorTitle}>{title}</div>
    {sectors && sectors.length > 0 ? sectors.map((s, i) => (
      <div key={i} style={styles.sectorRow}>
        <span style={styles.sectorRank}>{i + 1}</span>
        <span style={styles.sectorName}>{s.name}</span>
        <span style={{ ...styles.sectorPct, color: changeColor(s.pct_change) }}>
          {fmtPct(s.pct_change)}
        </span>
      </div>
    )) : <div style={styles.noData}>暂无数据</div>}
  </div>
);

// ---- 子组件：数据行 ----
const DataRow = ({ label, value, color }) => (
  <div style={styles.dataRow}>
    <span style={styles.dataLabel}>{label}</span>
    <span style={{ ...styles.dataValue, color: color || '#e0e0e0' }}>{value ?? '--'}</span>
  </div>
);

// ---- 主组件 ----
const MarketOverview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setError(null);
      const res = await marketApi.getOverview();
      if (res.code === 200) {
        setOverview(res.data);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        setError(res.message || '获取失败');
      }
    } catch (e) {
      setError(e.message || '网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(fetchOverview, 60000); // 每分钟刷新
    return () => clearInterval(timer);
  }, [fetchOverview]);

  if (loading) {
    return (
      <div style={styles.loadingBox}>
        <div style={styles.spinner}></div>
        <span style={{ color: '#aaa', marginLeft: 10 }}>市场数据加载中...</span>
      </div>
    );
  }

  const a = overview?.aShare;
  const hk = overview?.hkShare;
  const cross = overview?.crossMarket;
  const meta = overview?.meta;

  return (
    <div style={styles.container}>
      {/* ===== 顶部标题栏 ===== */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h3 style={styles.title}>市场总览</h3>
          {meta && (
            <div style={styles.metaBar}>
              <span style={styles.metaItem}>{meta.tradeDate}</span>
              <span style={styles.metaSep}>|</span>
              <span style={styles.metaItem}>{meta.weekday}</span>
              <span style={styles.metaSep}>|</span>
              <span style={{ ...styles.metaItem, color: '#f5a623', fontWeight: 600 }}>{meta.marketType}</span>
            </div>
          )}
        </div>
        <div style={styles.headerRight}>
          {error && <span style={styles.errorTip}>⚠ {error}</span>}
          {lastUpdate && <span style={styles.updateTime}>更新: {lastUpdate}</span>}
          <button style={styles.refreshBtn} onClick={fetchOverview}>刷新</button>
        </div>
      </div>

      {/* ===== A股区块 ===== */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span style={styles.sectionDot}></span>A股核心
        </div>

        {/* 主要指数 */}
        <div style={styles.indicesGrid}>
          <IndexCard name="上证指数" data={a?.indices?.sh} />
          <IndexCard name="深证成指" data={a?.indices?.sz} />
          <IndexCard name="创业板指" data={a?.indices?.cy} />
          <IndexCard name="科创50"   data={a?.indices?.kc} />
          <IndexCard name="沪深300"  data={a?.indices?.hs300} />
        </div>

        {/* 成交额 + 资金流向 */}
        <div style={styles.statsRow}>
          {/* 成交额 */}
          <div style={styles.statCard}>
            <div style={styles.statCardTitle}>成交额</div>
            <DataRow label="A股总成交" value={a?.totalAmount != null ? fmtAmt(a.totalAmount) : '--'} />
            <DataRow
              label="沪市成交"
              value={a?.indices?.sh?.amountBillion != null ? fmtAmt(a.indices.sh.amountBillion) : '--'}
            />
            <DataRow
              label="深市成交"
              value={a?.indices?.sz?.amountBillion != null ? fmtAmt(a.indices.sz.amountBillion) : '--'}
            />
          </div>

          {/* 北向资金 */}
          <div style={styles.statCard}>
            <div style={styles.statCardTitle}>北向资金（亿元）</div>
            {a?.moneyFlow ? (
              <>
                <MoneyBadge label="北向合计" value={a.moneyFlow.northMoney} />
                <MoneyBadge label="沪股通" value={a.moneyFlow.hgt} />
                <MoneyBadge label="深股通" value={a.moneyFlow.sgt} />
              </>
            ) : (
              <div style={styles.noData}>暂无数据</div>
            )}
          </div>
        </div>

        {/* 板块涨跌榜 */}
        {a?.sectorRank ? (
          <div style={styles.sectorGrid}>
            <SectorRank title="📈 涨幅 TOP5 板块" sectors={a.sectorRank.top5} isTop={true} />
            <SectorRank title="📉 跌幅 TOP5 板块" sectors={a.sectorRank.bottom5} isTop={false} />
          </div>
        ) : (
          <div style={styles.noDataBlock}>
            A股板块数据暂无
            <div style={{ fontSize: 10, color: '#444', marginTop: 6, lineHeight: 1.4 }}>
              可能原因：Tushare `sw_daily` 接口需要 5000 积分权限或当天数据尚未更新。<br/>
              如需开通权限，请访问 <a href="https://tushare.pro" target="_blank" style={{ color: '#4a90e2', textDecoration: 'none' }}>tushare.pro</a> 获取更多积分。
            </div>
          </div>
        )}
      </div>

      {/* ===== 港股区块 ===== */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span style={{ ...styles.sectionDot, background: '#f5a623', borderRadius: 3 }}></span>港股核心
        </div>

        {/* 港股指数 */}
        <div style={styles.indicesGrid}>
          <IndexCard name="恒生指数"     data={hk?.indices?.hsi}    amountUnit="亿港元" />
          <IndexCard name="恒生科技"     data={hk?.indices?.hstech} amountUnit="亿港元" />
          <IndexCard name="恒生国企指数" data={hk?.indices?.hscei}  amountUnit="亿港元" />
        </div>

        {/* 港股成交 + 南向资金 */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statCardTitle}>港股成交额（亿港元）</div>
            <DataRow
              label="全市场估算"
              value={hk?.totalAmount != null ? fmtAmt(hk.totalAmount, '亿港元') : '--'}
            />
          </div>

          <div style={styles.statCard}>
            <div style={styles.statCardTitle}>南向资金（亿港元）</div>
            {hk?.moneyFlow ? (
              <>
                <MoneyBadge label="南向合计" value={hk.moneyFlow.southMoney} unit="亿港元" />
                <MoneyBadge label="港股通(沪)" value={hk.moneyFlow.ggtSS} unit="亿港元" />
                <MoneyBadge label="港股通(深)" value={hk.moneyFlow.ggtSZ} unit="亿港元" />
              </>
            ) : (
              <div style={styles.noData}>暂无数据</div>
            )}
          </div>
        </div>

        {/* 港股数据说明 */}
        {hk?.indices?.hsi == null && (
          <div style={styles.hkNotice}>
            港股指数数据暂不支持（Tushare `index_daily` 仅覆盖 A 股 .SH/.SZ 指数），待接入其他数据源
          </div>
        )}
      </div>

      {/* ===== 跨市场区块 ===== */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span style={{ ...styles.sectionDot, background: '#a29bfe', borderRadius: 3 }}></span>跨市场联动
        </div>
        <div style={styles.statsRow}>
          <div style={{ ...styles.statCard, flex: '1 1 200px' }}>
            <div style={styles.statCardTitle}>资金合计流向（亿元）</div>
            {cross?.totalMoneyFlow != null ? (
              <MoneyBadge label="北向+南向" value={cross.totalMoneyFlow} />
            ) : (
              <div style={styles.noData}>暂无数据</div>
            )}
            {cross?.moneyFlowDate && (
              <div style={{ ...styles.noData, textAlign: 'center', marginTop: 8, fontSize: 10 }}>
                数据日期: {cross.moneyFlowDate}
              </div>
            )}
          </div>
          <div style={{ ...styles.statCard, flex: '1 1 200px' }}>
            <div style={styles.statCardTitle}>AH 溢价率</div>
            <div style={styles.noData}>
              {cross?.ahPremium != null
                ? fmt(cross.ahPremium) + '%'
                : '需接 AH 溢价指数'}
            </div>
            <div style={{ ...styles.noData, textAlign: 'center', marginTop: 8, fontSize: 10 }}>
              A股溢价幅度
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- 样式 ----
const styles = {
  container: {
    background: 'linear-gradient(160deg, #16213e 0%, #1a1a2e 100%)',
    borderRadius: 14,
    padding: '22px 26px',
    marginBottom: 24,
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  loadingBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 48, background: '#1a1a2e', borderRadius: 14,
  },
  spinner: {
    width: 22, height: 22,
    border: '2px solid rgba(255,255,255,0.1)',
    borderTop: '2px solid #e84141',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // 顶部标题栏
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 22,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: 0.5 },
  metaBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 20, padding: '3px 12px',
  },
  metaItem: { fontSize: 12, color: '#bbb' },
  metaSep: { color: 'rgba(255,255,255,0.15)', fontSize: 11 },
  errorTip: { fontSize: 12, color: '#f5a623' },
  updateTime: { fontSize: 11, color: '#555' },
  refreshBtn: {
    fontSize: 12, padding: '4px 14px', borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)', color: '#999', cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // 区块
  section: {
    marginBottom: 20,
    padding: '16px 18px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 600, color: '#ccc',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  sectionDot: {
    display: 'inline-block', width: 6, height: 18, borderRadius: 3,
    background: '#e84141',
  },

  // 指数卡片
  indicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8, marginBottom: 14,
  },
  indexCard: {
    padding: '12px 13px', borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 96,
  },
  indexName: { fontSize: 11, color: '#777', marginBottom: 6, letterSpacing: 0.3 },
  indexPrice: { fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 3, letterSpacing: -0.5 },
  indexChange: { fontSize: 12, fontWeight: 600, marginBottom: 5 },
  indexChangeAbs: { fontSize: 10, opacity: 0.75, marginLeft: 4 },
  indexAmount: {
    fontSize: 10, color: '#555', marginTop: 'auto',
    paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)',
    paddingTop: 6, marginTop: 6,
  },

  // 统计卡片行
  statsRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  statCard: {
    flex: '1 1 220px',
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 8, padding: '12px 15px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  statCardTitle: {
    fontSize: 11, color: '#666', fontWeight: 600, letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.04)',
    textTransform: 'uppercase',
  },
  dataRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
    minHeight: 24,
  },
  dataLabel: { fontSize: 11, color: '#777' },
  dataValue: { fontSize: 12, fontWeight: 600 },

  // 资金徽章
  moneyBadge: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
    minHeight: 24,
  },
  moneyLabel: { fontSize: 11, color: '#777' },
  moneyValue: { fontSize: 12, fontWeight: 700 },

  // 板块排行
  sectorGrid: { display: 'flex', gap: 10, marginTop: 14 },
  sectorBlock: {
    flex: 1,
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 9, padding: '12px 16px',
  },
  sectorTitle: {
    fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 10,
    paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  sectorRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  sectorRank: {
    width: 18, height: 18, borderRadius: 4,
    background: 'rgba(255,255,255,0.06)',
    fontSize: 11, color: '#666', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sectorName: { flex: 1, fontSize: 12, color: '#ccc' },
  sectorPct: { fontSize: 13, fontWeight: 700 },

  noData: { fontSize: 12, color: '#444', padding: '4px 0', fontStyle: 'italic' },
  noDataBlock: {
    fontSize: 12, color: '#444', fontStyle: 'italic',
    background: 'rgba(255,255,255,0.01)',
    border: '1px dashed rgba(255,255,255,0.05)',
    borderRadius: 9, padding: '12px 16px',
    marginTop: 10,
  },
  hkNotice: {
    fontSize: 11, color: '#555', fontStyle: 'italic',
    marginTop: 10,
    paddingTop: 8, paddingBottom: 8,
    paddingLeft: 12, paddingRight: 12,
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.04)',
  },
};

export default MarketOverview;
