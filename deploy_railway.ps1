# Railway 后端一键部署脚本
# 使用方法：在 PowerShell 中执行 .\deploy_railway.ps1

Write-Host "=== 股票监控系统 - Railway 后端部署 ===" -ForegroundColor Cyan

# 步骤1：登录Railway（会打开浏览器）
Write-Host "`n[1/5] 登录 Railway..." -ForegroundColor Yellow
railway login
if ($LASTEXITCODE -ne 0) { Write-Host "登录失败，请重试" -ForegroundColor Red; exit 1 }

# 步骤2：进入backend目录，初始化Railway项目
Write-Host "`n[2/5] 创建 Railway 项目并关联服务..." -ForegroundColor Yellow
Set-Location backend

# 创建新项目
railway init --name stock-monitor-backend
if ($LASTEXITCODE -ne 0) { Write-Host "初始化失败" -ForegroundColor Red; Set-Location ..; exit 1 }

# 步骤3：设置环境变量
Write-Host "`n[3/5] 配置环境变量..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set TUSHARE_TOKEN=493d8b1bd7edd1c8e716ca6b7af6eda08b176c130b297ea33d0e5c29
railway variables set ARK_API_KEY=c41ea688-7fff-4f4f-971e-f852c2b75daa
railway variables set DOUBAO_API_KEY=9960c043-3452-40d1-814b-c8b8873843d1
railway variables set DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
railway variables set DOUBAO_MODEL=doubao-seed-2-0-pro-260215
railway variables set VOLCANO_MODEL=doubao-seed-2-0-pro-260215
Write-Host "环境变量配置完成" -ForegroundColor Green

# 步骤4：部署
Write-Host "`n[4/5] 部署到 Railway..." -ForegroundColor Yellow
railway up
if ($LASTEXITCODE -ne 0) { Write-Host "部署失败" -ForegroundColor Red; Set-Location ..; exit 1 }

# 步骤5：获取部署URL
Write-Host "`n[5/5] 生成公开域名..." -ForegroundColor Yellow
railway domain
$url = railway open --json 2>$null | ConvertFrom-Json | Select-Object -ExpandProperty url
Write-Host "`n=== 部署成功！===" -ForegroundColor Green
Write-Host "后端地址: https://<你的-railway-域名>.up.railway.app" -ForegroundColor Cyan
Write-Host "`n请将上方域名复制，告诉我，我帮你更新前端的API地址" -ForegroundColor Yellow

Set-Location ..
