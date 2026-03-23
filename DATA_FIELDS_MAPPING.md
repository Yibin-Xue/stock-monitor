# 数据字段映射说明

## AI分析功能所需数据字段

### 1. 基本信息 (daily 接口)
| 字段 | Tushare字段 | 说明 | 数据来源 |
|------|------------|------|---------|
| open | open | 开盘价 | daily |
| high | high | 最高价 | daily |
| low | low | 最低价 | daily |
| close | close | 收盘价 | daily |
| pre_close | pre_close | 昨收价 | daily |
| vol | vol | 成交量(手) | daily |
| amount | amount | 成交额(千元) | daily |
| trade_date | trade_date | 交易日期 | daily |

### 2. 估值数据 (daily_basic 接口)
| 字段 | Tushare字段 | 说明 | 数据来源 |
|------|------------|------|---------|
| pe | pe | 市盈率 | daily_basic |
| pe_ttm | pe_ttm | 市盈率TTM | daily_basic |
| pb | pb | 市净率 | daily_basic |
| total_mv | total_mv | 总市值(万元) | daily_basic |
| circ_mv | circ_mv | 流通市值(万元) | daily_basic |
| turnover_rate | turnover_rate | 换手率(%) | daily_basic |
| volume_ratio | volume_ratio | 量比 | daily_basic |

### 3. 财务指标 (fina_indicator 接口)
| 字段 | Tushare字段 | 说明 | 数据来源 |
|------|------------|------|---------|
| roe | roe | 净资产收益率(%) | fina_indicator |
| roa | roa | 总资产报酬率(%) | fina_indicator |
| gross_margin | gross_margin | 毛利(%) | fina_indicator |
| net_margin | netprofit_margin | 净利率(%) | fina_indicator |
| debt_to_assets | debt_to_assets | 资产负债率(%) | fina_indicator |
| current_ratio | current_ratio | 流动比率 | fina_indicator |
| quick_ratio | quick_ratio | 速动比率 | fina_indicator |
| eps | eps | 基本每股收益 | fina_indicator |
| end_date | end_date | 报告期 | fina_indicator |

### 4. K线数据 (daily 接口)
| 字段 | Tushare字段 | 说明 | 数据来源 |
|------|------------|------|---------|
| trade_date | trade_date | 交易日期 | daily |
| open | open | 开盘价 | daily |
| high | high | 最高价 | daily |
| low | low | 最低价 | daily |
| close | close | 收盘价 | daily |
| vol | vol | 成交量(手) | daily |
| amount | amount | 成交额(千元) | daily |

## API调用示例

### 1. 获取最新行情
```bash
curl -X POST https://www.codebuddy.cn/v2/tool/financedata \
  -H "Content-Type: application/json" \
  -d '{
    "api_name": "daily",
    "params": {
      "ts_code": "600519.SH",
      "start_date": "20250310",
      "end_date": "20250321"
    },
    "fields": ""
  }'
```

### 2. 获取估值数据
```bash
curl -X POST https://www.codebuddy.cn/v2/tool/financedata \
  -H "Content-Type: application/json" \
  -d '{
    "api_name": "daily_basic",
    "params": {
      "ts_code": "600519.SH",
      "start_date": "20250310",
      "end_date": "20250321"
    },
    "fields": ""
  }'
```

### 3. 获取财务指标
```bash
curl -X POST https://www.codebuddy.cn/v2/tool/financedata \
  -H "Content-Type: application/json" \
  -d '{
    "api_name": "fina_indicator",
    "params": {
      "ts_code": "600519.SH",
      "start_date": "20240321",
      "end_date": "20250321"
    },
    "fields": ""
  }'
```

## 数据处理规则

1. **空值处理**: 所有字段如果没有数据,显示为 'NA',不虚构数据
2. **数值格式**:
   - 保留2位小数
   - 百分比已经包含%,不需要额外处理
3. **日期格式**:
   - 交易日期: YYYYMMDD
   - 报告期: YYYYMMDD (如 20250930 表示2025年Q3)
4. **单位**:
   - 成交量: 手
   - 成交额: 千元
   - 市值: 万元
   - 股本: 万股

## 计算指标

### 技术指标
- **MA5/MA10/MA20**: 简单移动平均
- **RSI**: 相对强弱指标 (14日)
- **MACD**: EMA12 - EMA26
- **支撑位**: 最近30日最低价的前3位
- **压力位**: 最近30日最高价的前3位

### 评分算法
- **技术面**: 40%权重
  - 短期趋势: MA5>MA10得80分,否则60分
  - 中期趋势: MA10>MA20得75分,否则55分
  - 长期趋势: 当前价>起始价得70分,否则50分

- **基本面**: 60%权重
  - 盈利能力: 100分制
    - 毛利率>40%: +30分
    - 净利率>15%: +30分
    - ROE>15%: +40分
  - 偿债能力: 100分制
    - 资产负债率<30%: +50分
    - 流动比率>2: +30分
  - 估值水平: 100分制
    - PE<15: +50分
    - PB<2: +30分

### 投资建议
| 综合得分 | 建议操作 | 风险等级 |
|---------|---------|---------|
| 75-100 | 买入 | 中低 |
| 60-74 | 增持 | 中 |
| 45-59 | 持有 | 中高 |
| 30-44 | 减持 | 高 |
| 0-29 | 卖出 | 很高 |
