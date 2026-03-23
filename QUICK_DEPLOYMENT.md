# 股票监控系统 - 快速部署步骤

## 🚀 最简单方案: Vercel (前端) + Railway (后端)

### 前置要求
- GitHub账号
- Vercel账号
- Railway账号
- 代码推送到GitHub

---

## 📱 步骤1: 推送代码到GitHub

```bash
# 1. 初始化Git仓库(如果还没有)
cd "d:/Trae CN/program/股票监控"
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit: 股票监控系统v1.0"

# 4. 在GitHub创建新仓库
# 然后运行:
git remote add origin https://github.com/YOUR_USERNAME/stock-monitor.git
git branch -M main
git push -u origin main
```

---

## 🎨 步骤2: 部署前端到Vercel

### 方法一: 通过网页部署(推荐)

1. 访问 https://vercel.com
2. 点击 "New Project"
3. 导入GitHub仓库
4. 配置:
   - Framework Preset: Vite
   - Root Directory: `.`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点击 "Deploy"
6. 等待部署完成(1-2分钟)
7. 复制Vercel提供的域名,例如: `https://stock-monitor.vercel.app`

### 方法二: 通过CLI部署

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd "d:/Trae CN/program/股票监控"
vercel
```

---

## 🔧 步骤3: 配置前端环境变量

### 在Vercel控制台设置:

1. 进入项目设置: Settings → Environment Variables
2. 添加以下变量:
   - **名称**: `VITE_API_BASE_URL`
   - **值**: `https://your-backend.railway.app` (先填一个占位符,后端部署后再更新)
   - **环境**: Production, Preview, Development

3. 保存后重新部署

---

## 🖥️ 步骤4: 部署后端到Railway

### 方法一: 通过网页部署(推荐)

1. 访问 https://railway.app
2. 点击 "New Project"
3. 点击 "Deploy from GitHub repo"
4. 选择你的GitHub仓库
5. 配置:
   - 选择 `backend` 目录作为根目录
   - Build Command: `npm install`
   - Start Command: `npm start`
6. 添加环境变量:
   - `PORT`: `3002`
   - `TUSHARE_TOKEN`: `493d8b1bd7edd1c8e716ca6b7af6eda08b176c130b297ea33d0e5c29`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app` (前端部署后的URL)
7. 点击 "Deploy"
8. 等待部署完成(2-3分钟)
9. 复制Railway提供的域名,例如: `https://stock-monitor-backend.up.railway.app`

### 方法二: 通过CLI部署

```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
cd "d:/Trae CN/program/股票监控/backend"
railway init

# 添加环境变量
railway variables set PORT=3002
railway variables set TUSHARE_TOKEN=493d8b1bd7edd1c8e716ca6b7af6eda08b176c130b297ea33d0e5c29
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://your-frontend.vercel.app

# 部署
railway up

# 查看域名
railway domain
```

---

## 🔗 步骤5: 更新前端配置

1. 回到Vercel控制台
2. 进入 Environment Variables
3. 修改 `VITE_API_BASE_URL` 的值为Railway的域名:
   - 例如: `https://stock-monitor-backend.up.railway.app`
4. 保存并重新部署

---

## ✅ 步骤6: 测试部署

### 测试后端
```bash
# 替换为你的Railway域名
curl https://your-backend.railway.app/api/health
```

应该返回:
```json
{
  "status": "ok",
  "message": "Stock backend service is running"
}
```

### 测试前端
在浏览器中打开你的Vercel域名,例如:
```
https://stock-monitor.vercel.app
```

### 测试AI分析
1. 添加一只股票(如600519)
2. 点击 "🤖 AI分析" 按钮
3. 等待分析结果

---

## 🔑 重要配置: CORS

确保后端配置了正确的CORS允许前端域名:

### 修改 `backend/index.js`:
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// 允许的前端域名列表
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend.vercel.app',  // 替换为你的Vercel域名
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// 路由...

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
```

---

## 🔄 自动部署配置

### 设置GitHub自动部署

#### Vercel:
1. 进入项目设置 → Git
2. 确保已连接GitHub
3. 启用自动部署:
   - Production branch: `main`
   - Framework: `Vite`

#### Railway:
1. 进入项目设置 → General
2. 确保已连接GitHub
3. 启用自动部署:
   - Branch: `main`
   - Root Directory: `backend`

现在每次推送代码到GitHub,都会自动部署!

---

## 📊 部署后的URL示例

- **前端**: https://stock-monitor.vercel.app
- **后端**: https://stock-monitor-backend.up.railway.app
- **健康检查**: https://stock-monitor-backend.up.railway.app/api/health
- **AI分析**: https://stock-monitor-backend.up.railway.app/api/analysis/600519/analyze

---

## 🐛 常见问题

### 1. CORS错误
**问题**: 前端调用后端API时报CORS错误

**解决**:
- 检查后端 `allowedOrigins` 是否包含前端域名
- 确认环境变量 `FRONTEND_URL` 正确设置
- 重新部署后端

### 2. 环境变量未生效
**问题**: 环境变量在部署后无法使用

**解决**:
- 确保在生产环境使用正确的变量名
- 前端环境变量必须以 `VITE_` 开头
- 修改环境变量后需要重新部署

### 3. 后端无法启动
**问题**: Railway部署后端无法启动

**解决**:
- 检查 `Procfile` 是否存在
- 确认 `package.json` 中的 `start` 脚本正确
- 查看Railway日志: `railway logs`

### 4. 前端构建失败
**问题**: Vercel部署时构建失败

**解决**:
- 检查 `package.json` 中的依赖是否正确
- 确认 `vite.config.js` 配置正确
- 查看Vercel部署日志

---

## 💰 免费额度说明

### Vercel免费额度:
- 100GB带宽/月
- 无限项目
- 自动HTTPS
- 全球CDN

### Railway免费额度:
- $5免费额度/月
- 512MB RAM
- 500小时运行时间/月
- 10GB数据传输/月

对于个人项目和小型应用,免费额度完全够用!

---

## 🎯 部署成功标志

- ✅ 前端可以正常访问
- ✅ 后端健康检查通过
- ✅ 可以添加自选股
- ✅ 可以查看市场行情
- ✅ **AI分析功能正常工作** ⭐
- ✅ 自动部署已配置

---

## 📞 获取帮助

- Vercel文档: https://vercel.com/docs
- Railway文档: https://docs.railway.app
- 项目文档: `DEPLOYMENT_GUIDE.md`

---

**预计部署时间**: 15-30分钟  
**总成本**: $0 (免费额度足够)  
**维护难度**: 低 (自动部署) 🎉

祝你部署成功! 🚀
