# 股票监控系统 - 数据接入指南

## 已完成的工作

### 1. 后端数据层改造
- ✅ 创建了 Tushare 服务模块 (`services/tushareService.js`)
- ✅ 更新了所有 API 路由,接入真实数据
  - 股票搜索、详情、K线
  - 市场指数、板块
  - 行业分析
- ✅ 添加了环境变量配置文件 (`.env`, `.env.example`)
- ✅ 创建了后端说明文档 (`backend/README.md`)

### 2. 数据来源
- **数据源**: [Tushare Pro](https://tushare.pro/)
- **接口类型**: 免费 API 接口
- **覆盖数据**:
  - 股票基本信息
  - 实时行情数据
  - K线数据(日K/周K/月K)
  - 财务指标(ROE、毛利率、净利率等)
  - 市场指数
  - 行业分类

## 下一步操作

### 1. 获取 Tushare Token
1. 访问 https://tushare.pro/
2. 注册账号并登录
3. 进入"个人中心" -> "接口TOKEN"
4. 复制 TOKEN

### 2. 配置环境变量
编辑 `backend/.env` 文件,将 TOKEN 粘贴进去:
```env
TUSHARE_TOKEN=你的token
PORT=3001
NODE_ENV=development
```

### 3. 启动后端服务
```bash
cd backend
npm run dev
```

### 4. 启动前端服务
```bash
npm run dev
```

### 5. 访问应用
- 前端地址: http://localhost:5173
- 后端 API: http://localhost:3001

## API 接口说明

### 股票相关
- `GET /api/stocks/search?keyword=茅台` - 搜索股票
- `GET /api/stocks/600519` - 获取股票详情
- `GET /api/stocks/600519/kline?period=day` - 获取K线数据

### 市场相关
- `GET /api/market/indices` - 获取市场指数
- `GET /api/market/sectors` - 获取热门板块
- `GET /api/market/fund-flow` - 获取资金流向(模拟数据)

### 行业相关
- `GET /api/industry/sentiment` - 获取行业景气度
- `GET /api/industry/:industry` - 获取行业详情

## 注意事项

1. **API 限制**: Tushare 免费版有一定调用频率限制,建议合理使用
2. **交易日**: 只有交易日才有行情数据
3. **数据延迟**: 免费数据有一定延迟,不适合实时交易
4. **Token 保密**: 不要将 Token 提交到公开代码仓库

## 准备上线

当准备上线时,需要:
1. 将前端打包: `npm run build`
2. 将后端部署到云服务器
3. 配置生产环境变量
4. 考虑使用 CDN 加速
5. 配置 HTTPS 证书
