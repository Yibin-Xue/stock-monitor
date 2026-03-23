# Tushare Token配置说明

## 配置步骤

1. **获取Tushare Token**
   - 访问: https://tushare.pro
   - 注册账号并登录
   - 进入个人中心 -> API Token
   - 复制你的Token

2. **配置环境变量**
   
   **Windows (PowerShell)**:
   ```powershell
   $env:TUSHARE_TOKEN="你的Token"
   ```
   
   **Windows (CMD)**:
   ```cmd
   set TUSHARE_TOKEN=你的Token
   ```
   
   **Linux/Mac**:
   ```bash
   export TUSHARE_TOKEN=你的Token
   ```

3. **永久配置(可选)**
   
   创建 `.env` 文件在项目根目录:
   ```
   TUSHARE_TOKEN=你的Token
   ```

## 验证配置

运行以下命令测试:
```bash
python backend/services/analysis_service_tushare.py analyze 600519
```

如果看到分析报告输出,说明配置成功!

## 可用权限

根据Tushare权限等级,可以访问的数据:
- **普通积分**: 基础行情、日线数据、每日指标
- **高级积分**: 历史分钟、财务指标、资金流向
- **专业版**: 全部数据

确保你的账号权限满足所需数据的访问级别。
