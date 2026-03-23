# 股票监控系统 - 部署上线指南

## 🚀 部署方案概述

根据你的项目特点(前后端分离 + 动态数据 + AI分析),推荐以下部署方案:

### 推荐方案: Vercel (前端) + Railway/Render (后端)

**优势**:
- ✅ 免费额度充足
- ✅ 自动HTTPS
- ✅ Git集成,自动部署
- ✅ 全球CDN加速
- ✅ 环境变量管理方便
- ✅ 适合个人项目

---

## 📦 方案一: Vercel (前端) + Railway (后端)

### 1. 前端部署 (Vercel)

#### 1.1 准备工作
```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录Vercel
vercel login
```

#### 1.2 配置环境变量
创建 `.env.production` 文件:
```env
VITE_API_BASE_URL=https://your-backend.railway.app
VITE_API_PORT=3002
```

#### 1.3 修改前端API配置
修改 `src/services/api.js` (如果有的话) 或直接在组件中使用:
```javascript
// 获取API地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// API调用示例
const fetchStockData = async (code) => {
  const response = await fetch(`${API_BASE_URL}/api/stocks/${code}`);
  return response.json();
};
```

#### 1.4 部署步骤
```bash
# 在项目根目录执行
cd "d:/Trae CN/program/股票监控"

# 登录Vercel
vercel login

# 部署到Vercel
vercel

# 按提示操作:
# - Set up and deploy? Y
# - Scope? Your account
# - Link to existing project? N (新项目)
# - Project name? stock-monitor
# - Directory? . (当前目录)
# - Override settings? N
```

#### 1.5 部署配置文件
创建 `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### 1.6 添加环境变量
在Vercel控制台:
1. 进入项目设置 → Environment Variables
2. 添加环境变量:
   - `VITE_API_BASE_URL`: `https://your-backend.railway.app`
3. 重新部署

---

### 2. 后端部署 (Railway)

#### 2.1 准备工作
```bash
# 1. 安装Railway CLI
npm install -g @railway/cli

# 2. 登录Railway
railway login
```

#### 2.2 创建配置文件
创建 `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install",
    "watchPatterns": [
      "**"
    ]
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### 2.3 添加Procfile
在 `backend` 目录创建 `Procfile`:
```
web: npm start
```

#### 2.4 修改后端配置
修改 `backend/index.js`:
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;  // Railway会自动分配PORT

// 配置CORS - 允许前端域名
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend.vercel.app',  // 替换为你的Vercel域名
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 其他中间件
app.use(express.json());

// 路由...
// ...

// 启动服务器
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
```

#### 2.5 部署步骤
```bash
# 进入后端目录
cd "d:/Trae CN/program/股票监控/backend"

# 初始化Railway项目
railway init

# 按提示操作:
# - Is this a new project? Yes
# - Project name? stock-monitor-backend

# 添加环境变量
railway variables set TUSHARE_TOKEN=your_token_here
railway variables set NODE_ENV=production

# 部署
railway up

# 获取域名
railway domain
```

#### 2.6 查看日志
```bash
# 查看实时日志
railway logs

# 查看服务状态
railway status
```

---

## 🎯 方案二: Netlify (前端) + Render (后端)

### 前端部署 (Netlify)

#### 1. 准备工作
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录Netlify
netlify login
```

#### 2. 构建配置
创建 `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### 3. 部署
```bash
# 构建项目
npm run build

# 部署
netlify deploy --prod --dir=dist
```

#### 4. 环境变量
在Netlify控制台:
1. Site settings → Environment variables
2. 添加:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`

---

### 后端部署 (Render)

#### 1. 准备工作
- 注册账号: https://render.com
- 连接GitHub账号

#### 2. 创建Web Service
1. 在Render控制台点击 "New +"
2. 选择 "Web Service"
3. 连接GitHub仓库或粘贴代码
4. 配置:
   - Name: `stock-monitor-backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. 添加环境变量:
   - `PORT`: `3002`
   - `TUSHARE_TOKEN`: 你的Token
   - `NODE_ENV`: `production`
6. 点击 "Create Web Service"

#### 3. 获取域名
部署完成后,Render会提供一个URL,例如:
```
https://stock-monitor-backend.onrender.com
```

---

## 🌐 方案三: 使用自己的服务器 (VPS)

如果你有VPS服务器(如阿里云、腾讯云、AWS等):

### 1. 服务器准备
```bash
# 安装Node.js (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2 (进程管理)
npm install -g pm2

# 安装Nginx (反向代理)
sudo apt-get install nginx
```

### 2. 部署后端
```bash
# 克隆代码
git clone https://github.com/YOUR_USERNAME/stock-monitor.git
cd stock-monitor/backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 使用PM2启动
pm2 start index.js --name stock-backend
pm2 save
pm2 startup
```

### 3. 部署前端
```bash
# 回到项目根目录
cd stock-monitor

# 构建项目
npm run build

# 复制到Nginx目录
sudo cp -r dist/* /var/www/html/
```

### 4. 配置Nginx
```nginx
# /etc/nginx/sites-available/stock-monitor
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 启用SSL (Let's Encrypt)
```bash
# 安装Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 🔑 关键配置: CORS和API代理

### 1. 后端CORS配置
```javascript
// backend/index.js
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend.vercel.app',
  'https://your-frontend.netlify.app',
  'https://your-domain.com'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

### 2. 前端API配置
```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

export const api = {
  // 获取股票数据
  getStock: async (code) => {
    const response = await fetch(`${API_BASE_URL}/api/stocks/${code}`);
    return response.json();
  },

  // AI分析
  analyzeStock: async (code) => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/${code}/analyze`);
    return response.json();
  },

  // 批量分析
  batchAnalyze: async (codes) => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/batch-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codes }),
    });
    return response.json();
  }
};
```

### 3. 环境变量配置

#### 前端 (.env.development)
```env
VITE_API_BASE_URL=http://localhost:3002
```

#### 前端 (.env.production)
```env
VITE_API_BASE_URL=https://your-backend.railway.app
```

#### 后端 (.env)
```env
PORT=3002
TUSHARE_TOKEN=your_token_here
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 🔄 自动部署流程 (GitHub Actions)

### 1. 前端自动部署
创建 `.github/workflows/deploy-frontend.yml`:
```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'public/**'
      - 'package.json'
      - 'vite.config.js'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
```

### 2. 后端自动部署
创建 `.github/workflows/deploy-backend.yml`:
```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
      - 'backend/package.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        uses: railwayapp/cli@master
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: stock-monitor-backend
          command: up
```

---

## 💰 成本对比

| 平台 | 免费额度 | 付费计划 | 推荐指数 |
|------|----------|----------|----------|
| Vercel | 100GB带宽/月 | $20/月起 | ⭐⭐⭐⭐⭐ |
| Netlify | 100GB带宽/月 | $19/月起 | ⭐⭐⭐⭐⭐ |
| Railway | $5赠送 | $5/月起 | ⭐⭐⭐⭐ |
| Render | 750小时/月 | $7/月起 | ⭐⭐⭐⭐ |
| 自建VPS | - | $5-50/月 | ⭐⭐⭐ |

---

## 🎯 推荐部署方案

### 快速部署 (个人项目)
- **前端**: Vercel
- **后端**: Railway
- **总成本**: $0-5/月

### 生产环境 (小团队)
- **前端**: Vercel Pro
- **后端**: 自建VPS或Railway Pro
- **总成本**: $20-50/月

### 大规模应用
- **前端**: Vercel Enterprise或自建CDN
- **后端**: Kubernetes集群
- **数据库**: MongoDB Atlas
- **总成本**: $200+/月

---

## 📝 部署后检查清单

- [ ] 前端可以正常访问
- [ ] 后端健康检查通过
- [ ] API调用正常工作
- [ ] CORS配置正确
- [ ] 环境变量已配置
- [ ] HTTPS证书已启用
- [ ] 日志记录正常
- [ ] 监控和告警已设置
- [ ] 备份策略已制定

---

## 🔗 有用的链接

- Vercel: https://vercel.com
- Railway: https://railway.app
- Netlify: https://netlify.com
- Render: https://render.com
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas

---

**最后更新**: 2026-03-21
**适用项目**: 股票监控系统 v1.0
