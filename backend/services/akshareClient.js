const { spawn } = require('child_process');
const path = require('path');

// Python 脚本路径
const SCRIPT_PATH = path.join(__dirname, 'akshare_service.py');
// Python 可执行文件（支持配置）
const PYTHON_CMD = process.env.PYTHON_CMD || 'python';

/**
 * 调用 Python AKShare 脚本
 * @param {string} action - 操作名称
 * @param {string[]} args - 参数列表
 * @returns {Promise<any>} - 返回数据
 */
function callAKShare(action, args = []) {
  return new Promise((resolve, reject) => {
    const cmdArgs = [SCRIPT_PATH, action, ...args];
    const proc = spawn(PYTHON_CMD, cmdArgs, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      timeout: 30000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      try {
        if (!stdout.trim()) {
          return reject(new Error(`AKShare 无输出, stderr: ${stderr}`));
        }
        const result = JSON.parse(stdout.trim());
        if (result.code !== 0) {
          return reject(new Error(result.msg || 'AKShare 返回错误'));
        }
        resolve(result.data);
      } catch (e) {
        reject(new Error(`解析 AKShare 输出失败: ${stdout} | err: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`启动 Python 失败: ${err.message}`));
    });
  });
}

// ===== 封装各功能接口 =====

async function searchStocks(keyword) {
  return await callAKShare('search', [keyword]);
}

async function getStockDetail(code) {
  return await callAKShare('detail', [code]);
}

async function getStockKline(code, period = 'daily') {
  return await callAKShare('kline', [code, period]);
}

async function getFinancialIndicator(code) {
  return await callAKShare('indicators', [code]);
}

async function getMarketIndices() {
  return await callAKShare('indices', []);
}

async function getIndustrySectors() {
  return await callAKShare('sectors', []);
}

async function getIndustryDetail(industryName) {
  return await callAKShare('industry_detail', [industryName]);
}

async function getFundFlow() {
  return await callAKShare('fund_flow', []);
}

async function getFinancialNews() {
  return await callAKShare('news', []);
}

module.exports = {
  searchStocks,
  getStockDetail,
  getStockKline,
  getFinancialIndicator,
  getMarketIndices,
  getIndustrySectors,
  getIndustryDetail,
  getFundFlow,
  getFinancialNews,
};
