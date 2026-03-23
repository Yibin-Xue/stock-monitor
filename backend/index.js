const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量 - 确保在其他模块加载之前调用
dotenv.config({
  path: '.env'
});

console.log('环境变量加载完成:', {
  ARK_API_KEY: process.env.ARK_API_KEY ? '已配置' : '未配置',
  VOLCANO_MODEL: process.env.VOLCANO_MODEL
});

// 初始化Express应用
const app = express();
const port = process.env.PORT || 3003;

// CORS配置 - 支持部署环境
const allowedOrigins = [
  'http://localhost:5173',
  'https://stock-monitor.vercel.app',
  'https://*.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(allowed =>
      origin === allowed || allowed.includes('*') && origin.match(allowed.replace('*', '.*'))
    )) {
      callback(null, true);
    } else {
      console.error('CORS错误: 不允许的源', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 中间件
app.use(express.json());

// 导入路由
const stockRoutes = require('./routes/stockRoutes');
const marketRoutes = require('./routes/marketRoutes');
const industryRoutes = require('./routes/industryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const analysisRoutes = require('./routes/analysisRoutes');

// 使用路由
app.use('/api/stocks', stockRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/analysis', analysisRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stock backend service is running' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;