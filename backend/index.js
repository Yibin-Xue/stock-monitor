const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量 - 云平台直接注入环境变量，本地开发用 .env 文件
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({
    path: '.env'
  });
}

console.log('环境变量加载完成:', {
  ARK_API_KEY: process.env.ARK_API_KEY ? '已配置' : '未配置',
  VOLCANO_MODEL: process.env.VOLCANO_MODEL
});

// 初始化Express应用
const app = express();
const port = process.env.PORT || 3003;

// CORS配置 - 支持本地开发和线上部署
const corsOptions = {
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如 curl、Postman）
    if (!origin) return callback(null, true);

    // 生产环境：如果设置了 FRONTEND_URL 只允许指定域名，否则允许所有
    if (process.env.NODE_ENV === 'production') {
      if (process.env.FRONTEND_URL) {
        const allowed = process.env.FRONTEND_URL.split(',').map(u => u.trim());
        if (allowed.some(u => origin === u || origin.endsWith(u.replace('https://', '')))) {
          return callback(null, true);
        }
        console.error('CORS拒绝:', origin);
        return callback(new Error('Not allowed by CORS'));
      }
      // 未配置 FRONTEND_URL 时允许所有（方便初次部署测试）
      return callback(null, true);
    }

    // 开发环境：允许本地所有端口
    const devAllowed = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'];
    if (devAllowed.includes(origin)) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

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

// 健康检查（支持多种路径）
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Stock backend service is running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stock backend service is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stock backend service is running' });
});

// 启动服务器 - 绑定到 0.0.0.0 以支持云平台部署
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} (binding to 0.0.0.0)`);
});

module.exports = app;