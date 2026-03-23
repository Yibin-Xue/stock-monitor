# 股票监控系统后端

## 环境配置

1. 复制 `.env.example` 为 `.env`:

```bash
cp .env.example .env
```

2. 在 `.env` 文件中配置 Tushare Token:

```
TUSHARE_TOKEN=your_tushare_token_here
PORT=3001
NODE_ENV=development
```

## 获取 Tushare Token

1. 访问 [Tushare 官网](https://tushare.pro/)
2. 注册账号并登录
3. 进入"个人中心" -> "接口TOKEN"
4. 复制 TOKEN 粘贴到 `.env` 文件中

## 安装依赖

```bash
npm install
```

## 启动服务

开发模式:
```bash
npm run dev
```

生产模式:
```bash
npm start
```

## API 接口

### 股票相关

- `GET /api/stocks/search?keyword=xxx` - 搜索股票
- `GET /api/stocks/:code` - 获取股票详情
- `GET /api/stocks/:code/kline?period=day` - 获取K线数据

### 市场相关

- `GET /api/market/indices` - 获取市场指数
- `GET /api/market/sectors` - 获取热门板块
- `GET /api/market/fund-flow` - 获取资金流向

### 行业相关

- `GET /api/industry/sentiment` - 获取行业景气度
- `GET /api/industry/news?industry=xxx` - 获取行业动态
- `GET /api/industry/:industry` - 获取行业详情

## 数据源

所有数据来自 [Tushare](https://tushare.pro/) 的免费接口。
