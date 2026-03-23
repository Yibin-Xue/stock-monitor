# AI分析功能快速使用指南

## 一、当前状态

✅ **已完成**:
- AI分析功能已接入真实数据源
- 所有必需字段验证通过
- 支持两种数据源(CodeBuddy/Tushare)
- 不虚构数据,空值显示为'NA'

## 二、使用方法

### 方式1: 前端使用(推荐)

1. **启动后端服务**
   ```bash
   cd backend
   npm install  # 首次需要安装依赖
   npm start   # 启动后端服务
   ```

2. **启动前端服务**
   ```bash
   cd 股票监控
   npm install  # 首次需要安装依赖
   npm run dev  # 启动前端
   ```

3. **使用AI分析**
   - 打开浏览器访问 http://localhost:5173
   - 进入"自选股"页面
   - 点击任意股票的"🤖 AI分析"按钮
   - 等待10-30秒
   - 查看详细分析报告

### 方式2: 命令行测试

#### 使用CodeBuddy API(默认,无需配置)
```bash
cd backend/services
python analysis_service.py analyze 600519
```

#### 使用Tushare API(需要配置Token)
```bash
# 1. 配置Token
set TUSHARE_TOKEN=你的Token

# 2. 运行分析
python analysis_service_tushare.py analyze 600519
```

#### 验证数据字段
```bash
python verify_fields_simple.py
```

## 三、数据说明

### 可用数据字段
| 类别 | 字段 | 说明 | 数据来源 |
|------|------|------|---------|
| 基本信息 | open/high/low/close | 开高低收 | daily |
|  | pre_close | 昨收 | daily |
|  | vol | 成交量(手) | daily |
|  | amount | 成交额(千元) | daily |
| 估值数据 | pe/pe_ttm | 市盈率 | daily_basic |
|  | pb | 市净率 | daily_basic |
|  | total_mv | 总市值(万元) | daily_basic |
|  | turnover_rate | 换手率(%) | daily_basic |
| 财务指标 | roe | 净资产收益率(%) | fina_indicator |
|  | gross_margin | 毛利率(%) | fina_indicator |
|  | net_margin | 净利率(%) | fina_indicator |
|  | debt_to_assets | 资产负债率(%) | fina_indicator |
|  | current_ratio | 流动比率 | fina_indicator |
|  | eps | 每股收益 | fina_indicator |

### 空值处理
- 所有字段如果没有真实数据,显示为'NA'
- 不会虚构或填充默认值
- 计算时会跳过'NA'值

## 四、输出示例

### 分析报告结构
```json
{
  "stock": {
    "code": "600519",
    "name": "贵州茅台",
    "current_price": 1445.0,
    "change": -7.87,
    "change_pct": -0.54
  },
  "technical_analysis": {
    "short_term": {
      "trend": "下降",
      "strength": 60,
      "ma5": 1450.5,
      "ma10": 1455.2
    },
    "support_levels": [1400, 1420, 1430],
    "resistance_levels": [1460, 1475, 1490],
    "rsi": 45.6
  },
  "fundamental_analysis": {
    "profitability": {
      "roe": 26.37,
      "gross_margin": 91.29,
      "net_margin": 52.08,
      "score": 100,
      "level": "优秀"
    },
    "solvency": {
      "debt_ratio": 12.81,
      "current_ratio": 6.62,
      "score": 80,
      "level": "优秀"
    },
    "valuation": {
      "pe": 20.99,
      "pb": 7.97,
      "score": 30,
      "level": "合理"
    },
    "overall_score": 70
  },
  "investment_advice": {
    "recommendation": "增持",
    "risk_level": "中",
    "score": 66,
    "opportunities": [
      "盈利能力强",
      "成交活跃,资金关注度高"
    ],
    "risks": [
      "暂无明显风险"
    ]
  }
}
```

## 五、常见问题

### Q1: 分析时提示"数据不足"
**A**: 某些新股或停牌股票可能数据不足,建议选择上市时间较长、交易活跃的股票。

### Q2: 某些字段显示为'NA'
**A**:
1. 该股票可能没有该数据
2. API可能没有权限访问该数据
3. 数据正在更新中
建议稍后再试或选择其他股票

### Q3: 想使用Tushare API
**A**:
1. 访问 https://tushare.pro 注册
2. 获取Token
3. 配置环境变量:
   ```bash
   set TUSHARE_TOKEN=你的Token
   ```
4. 重启后端服务

### Q4: 分析速度慢
**A**:
- 需要调用多个API接口获取数据
- 网络状况会影响速度
- 正常情况下10-30秒完成
- 建议网络稳定时使用

## 六、技术支持

### 相关文档
- `AI_ANALYSIS_README.md` - 完整使用说明
- `DATA_FIELDS_MAPPING.md` - 数据字段映射
- `TUSHARE_TOKEN_CONFIG.md` - Token配置说明
- `AI_ANALYSIS_REAL_DATA_REPORT.md` - 数据接入报告

### 获取帮助
- 查看日志文件了解详细错误信息
- 运行验证脚本检查数据可用性
- 确认Token配置正确(如使用Tushare)

## 七、示例股票

以下股票数据较全,适合测试:
- 600519.SH - 贵州茅台
- 000001.SZ - 平安银行
- 000002.SZ - 万科A
- 600036.SH - 招商银行
- 600000.SH - 浦发银行

## 八、注意事项

1. **投资风险**: AI分析仅供参考,不构成投资建议
2. **数据时效性**: 财务数据基于最新财报,可能不是实时数据
3. **权限限制**: 某些数据可能需要更高等级的API权限
4. **网络要求**: 需要稳定的网络连接访问数据API
5. **数据真实性**: 所有数据来自公开API,不虚构任何数据

---

## 快速测试命令

```bash
# 1. 验证数据字段
cd backend/services
python verify_fields_simple.py

# 2. 测试分析功能
python analysis_service.py analyze 600519

# 3. 启动后端服务(新窗口)
cd backend
npm start

# 4. 启动前端服务(新窗口)
cd 股票监控
npm run dev
```

完成!现在可以开始使用AI分析功能了!
