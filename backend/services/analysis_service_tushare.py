#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票AI分析服务 - 使用Tushare真实数据
被 Node.js 后端通过子进程调用,返回 JSON 格式分析报告
用法: python analysis_service.py <action> [params...]
"""

import sys
import json
import requests
import traceback
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# 设置输出编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 统一 headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'http://finance.sina.com.cn',
}

# Tushare API 基础 URL
TUSHARE_API_BASE = 'http://api.tushare.pro'
# 从环境变量读取token
TOKEN = os.environ.get('TUSHARE_TOKEN', '493d8b1bd7edd1c8e716ca6b7af6eda08b176c130b297ea33d0e5c29')


def success(data):
    print(json.dumps({"code": 0, "data": data}, ensure_ascii=False))


def error(msg):
    print(json.dumps({"code": -1, "msg": str(msg)}, ensure_ascii=False))


def get_today():
    """获取今日日期 YYYYMMDD"""
    return datetime.now().strftime('%Y%m%d')


def get_recent_date(days):
    """获取N天前日期 YYYYMMDD"""
    return (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')


def to_ts_code(code):
    """将股票代码转为 Tushare 格式"""
    code = str(code).strip()
    if code.startswith('6') or code.startswith('9'):
        return f"{code}.SH"
    else:
        return f"{code}.SZ"


def call_tushare_api(api_name: str, params: dict = None) -> Optional[dict]:
    """
    调用 Tushare API
    """
    try:
        url = TUSHARE_API_BASE
        payload = {
            'api_name': api_name,
            'token': TOKEN,
            'params': params or {},
            'fields': ''
        }
        
        r = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
        result = r.json()
        
        if result.get('code') != 0:
            print(f"Tushare API error ({api_name}): {result.get('msg')}", file=sys.stderr)
            return None
        
        return result.get('data')
    except Exception as e:
        print(f"调用Tushare API失败 ({api_name}): {e}", file=sys.stderr)
        return None


def get_stock_basic_info(code):
    """获取股票基本信息 - 使用daily接口获取最新行情"""
    try:
        ts_code = to_ts_code(code)
        
        # 获取最新日线数据
        data = call_tushare_api('daily', {
            'ts_code': ts_code,
            'start_date': get_recent_date(5),
            'end_date': get_today()
        })
        
        if not data or not data.get('items'):
            return None
        
        latest = data['items'][0]
        fields = data['fields']
        
        # 解析数据
        info = {}
        for i, field in enumerate(fields):
            if i < len(latest):
                info[field] = latest[i]
        
        # 获取股票名称 - stock_basic返回字段: ts_code, symbol, name, area, industry, market, list_date, is_hs
        basic_data = call_tushare_api('stock_basic', {
            'ts_code': ts_code,
            'list_status': 'L'
        })
        
        name = code
        if basic_data and basic_data.get('items'):
            fields = basic_data.get('fields', [])
            if 'name' in fields:
                name_idx = fields.index('name')
                name = basic_data['items'][0][name_idx] if name_idx < len(basic_data['items'][0]) else code
            else:
                name = basic_data['items'][0][2] if len(basic_data['items'][0]) > 2 else code
        
        return {
            'name': name,
            'open': float(info.get('open', 0) or 0),
            'pre_close': float(info.get('pre_close', 0) or 0),
            'price': float(info.get('close', 0) or 0),
            'high': float(info.get('high', 0) or 0),
            'low': float(info.get('low', 0) or 0),
            'volume': float(info.get('vol', 0) or 0),
            'amount': float(info.get('amount', 0) or 0),
            'trade_date': info.get('trade_date', '')
        }
    except Exception as e:
        print(f"获取基本信息失败: {e}", file=sys.stderr)
        return None


def get_stock_valuation(ts_code):
    """获取估值数据 - 使用daily_basic接口"""
    try:
        data = call_tushare_api('daily_basic', {
            'ts_code': ts_code,
            'start_date': get_recent_date(5),
            'end_date': get_today()
        })
        
        if not data or not data.get('items'):
            return {}
        
        latest = data['items'][0]
        fields = data['fields']
        
        valuation = {}
        for i, field in enumerate(fields):
            if field in ['pe', 'pe_ttm', 'pb', 'total_mv', 'circ_mv', 'turnover_rate', 'volume_ratio']:
                if i < len(latest) and latest[i] is not None:
                    try:
                        valuation[field] = float(latest[i])
                    except:
                        valuation[field] = None
        
        return valuation
    except Exception as e:
        print(f"获取估值数据失败: {e}", file=sys.stderr)
        return {}


def get_financial_indicators(ts_code):
    """获取财务指标 - 使用fina_indicator接口"""
    try:
        data = call_tushare_api('fina_indicator', {
            'ts_code': ts_code,
            'start_date': get_recent_date(365),
            'end_date': get_today()
        })
        
        if not data or not data.get('items'):
            return {}
        
        latest = data['items'][0]
        fields = data['fields']
        
        indicators = {}
        # 需要的字段映射
        field_mapping = {
            'roe': 'roe',
            'roa': 'roa',
            'gross_margin': 'gross_margin',
            'net_margin': 'netprofit_margin',  # Tushare字段名
            'debt_to_assets': 'debt_to_assets',
            'current_ratio': 'current_ratio',
            'quick_ratio': 'quick_ratio',
            'eps': 'eps'
        }
        
        for tushare_field, our_field in field_mapping.items():
            if tushare_field in fields:
                idx = fields.index(tushare_field)
                if idx < len(latest) and latest[idx] is not None:
                    try:
                        indicators[our_field] = float(latest[idx])
                    except:
                        indicators[our_field] = None
        
        # 添加报告期
        if 'end_date' in fields:
            idx = fields.index('end_date')
            if idx < len(latest):
                indicators['report_date'] = latest[idx]
        
        return indicators
    except Exception as e:
        print(f"获取财务指标失败: {e}", file=sys.stderr)
        return {}


def get_kline_data(ts_code, count=60):
    """获取K线数据 - 使用daily接口"""
    try:
        data = call_tushare_api('daily', {
            'ts_code': ts_code,
            'start_date': get_recent_date(count + 10),
            'end_date': get_today()
        })
        
        if not data or not data.get('items'):
            return []
        
        items = data['items']
        fields = data['fields']
        
        klines = []
        for item in items[-count:]:
            kline = {}
            for i, field in enumerate(fields):
                if field in ['trade_date', 'open', 'high', 'low', 'close', 'vol', 'amount']:
                    if i < len(item):
                        kline[field] = item[i]
            if kline.get('trade_date') and kline.get('close'):
                klines.append(kline)
        
        return klines
    except Exception as e:
        print(f"获取K线数据失败: {e}", file=sys.stderr)
        return []


def analyze_technical(klines):
    """技术分析 - 基于真实K线数据"""
    if len(klines) < 10:
        return {
            'short_term': {'trend': 'NA', 'strength': 0},
            'medium_term': {'trend': 'NA', 'strength': 0},
            'long_term': {'trend': 'NA', 'strength': 0},
            'support_levels': [],
            'resistance_levels': [],
            'volume_trend': 'NA',
            'indicators': {}
        }
    
    latest = klines[-1]
    close_prices = [float(k.get('close', 0)) for k in klines if k.get('close') is not None]
    volumes = [float(k.get('vol', 0)) for k in klines if k.get('vol') is not None]
    
    if not close_prices or len(close_prices) < 10:
        return {
            'short_term': {'trend': '数据不足', 'strength': 0},
            'medium_term': {'trend': '数据不足', 'strength': 0},
            'long_term': {'trend': '数据不足', 'strength': 0},
            'support_levels': [],
            'resistance_levels': [],
            'volume_trend': '数据不足',
            'indicators': {}
        }
    
    # 计算移动平均线
    ma5 = sum(close_prices[-5:]) / 5
    ma10 = sum(close_prices[-10:]) / 10
    ma20 = sum(close_prices[-20:]) / 20
    
    # 趋势判断
    short_trend = '上升' if ma5 > ma10 else '下降'
    medium_trend = '上升' if ma10 > ma20 else '下降'
    
    # 计算RSI
    gains = []
    losses = []
    for i in range(1, min(len(close_prices), 15)):
        change = close_prices[i] - close_prices[i-1]
        if change > 0:
            gains.append(change)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(change))
    
    if len(gains) >= 14:
        avg_gain = sum(gains) / 14
        avg_loss = sum(losses) / 14
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
    else:
        rsi = 50
    
    # 支撑位和压力位
    high_prices = [float(k.get('high', 0)) for k in klines[-30:] if k.get('high')]
    low_prices = [float(k.get('low', 0)) for k in klines[-30:] if k.get('low')]
    
    if high_prices:
        resistance_levels = sorted(high_prices)[-5:]
        resistance_levels = [round(r, 2) for r in resistance_levels[:3]]
    else:
        resistance_levels = []
    
    if low_prices:
        support_levels = sorted(low_prices)[:5]
        support_levels = [round(s, 2) for s in support_levels[-3:]]
    else:
        support_levels = []
    
    # 成交量趋势
    if len(volumes) >= 10:
        recent_avg = sum(volumes[-5:]) / 5
        prev_avg = sum(volumes[-10:-5]) / 5
        if prev_avg > 0:
            if recent_avg > prev_avg * 1.2:
                volume_trend = '放量'
            elif recent_avg < prev_avg * 0.8:
                volume_trend = '缩量'
            else:
                volume_trend = '平稳'
        else:
            volume_trend = 'NA'
    else:
        volume_trend = 'NA'
    
    # MACD
    ema12 = sum(close_prices[-12:]) / 12
    ema26 = sum(close_prices[-26:]) / 26
    macd = ema12 - ema26
    
    start_price = float(klines[0].get('close', 0)) if klines[0].get('close') else 0
    current_price = float(latest.get('close', 0)) if latest.get('close') else 0
    
    return {
        'short_term': {
            'trend': short_trend,
            'strength': 80 if ma5 > ma10 else 60,
            'ma5': round(ma5, 2),
            'ma10': round(ma10, 2)
        },
        'medium_term': {
            'trend': medium_trend,
            'strength': 75 if ma10 > ma20 else 55,
            'ma20': round(ma20, 2)
        },
        'long_term': {
            'trend': '上升' if current_price > start_price else '下降',
            'strength': 70 if current_price > start_price else 50
        },
        'support_levels': support_levels,
        'resistance_levels': resistance_levels,
        'volume_trend': volume_trend,
        'indicators': {
            'rsi': round(rsi, 2),
            'macd': round(macd, 2),
            'current_price': round(current_price, 2)
        }
    }


def analyze_fundamental(financial_indicators, valuation):
    """基本面分析 - 基于真实数据"""
    # 获取数据,如果不存在则返回None
    roe = financial_indicators.get('roe')
    gross_margin = financial_indicators.get('gross_margin')
    net_margin = financial_indicators.get('net_margin')
    debt_ratio = financial_indicators.get('debt_to_assets')
    current_ratio = financial_indicators.get('current_ratio')
    
    pe = valuation.get('pe') or valuation.get('pe_ttm')
    pb = valuation.get('pb')
    
    # 盈利能力评估
    profitability_score = 0
    if gross_margin is not None and gross_margin > 0:
        if gross_margin > 40:
            profitability_score += 30
        elif gross_margin > 20:
            profitability_score += 20
    
    if net_margin is not None and net_margin > 0:
        if net_margin > 15:
            profitability_score += 30
        elif net_margin > 8:
            profitability_score += 20
    
    if roe is not None and roe > 0:
        if roe > 15:
            profitability_score += 40
        elif roe > 10:
            profitability_score += 25
    
    # 偿债能力评估
    solvency_score = 0
    if debt_ratio is not None and debt_ratio >= 0:
        if debt_ratio < 30:
            solvency_score += 50
        elif debt_ratio < 50:
            solvency_score += 30
        elif debt_ratio < 70:
            solvency_score += 10
    
    if current_ratio is not None and current_ratio > 0:
        if current_ratio > 2:
            solvency_score += 30
        elif current_ratio > 1.5:
            solvency_score += 20
        elif current_ratio > 1:
            solvency_score += 10
    
    # 估值评估
    valuation_score = 0
    if pe is not None and pe > 0:
        if pe < 15:
            valuation_score += 50
        elif pe < 25:
            valuation_score += 30
        elif pe < 40:
            valuation_score += 10
    
    if pb is not None and pb > 0:
        if pb < 2:
            valuation_score += 30
        elif pb < 3:
            valuation_score += 20
    
    # 确定等级
    profitability_level = '优秀' if profitability_score >= 80 else '良好' if profitability_score >= 60 else '一般'
    solvency_level = '优秀' if solvency_score >= 80 else '良好' if solvency_score >= 60 else '一般'
    valuation_level = '低估' if valuation_score >= 60 else '合理' if valuation_score >= 30 else '高估'
    
    # 综合评分
    total_score = (profitability_score + solvency_score + valuation_score) / 3
    
    return {
        'profitability': {
            'roe': round(roe, 2) if roe is not None else 'NA',
            'gross_margin': round(gross_margin, 2) if gross_margin is not None else 'NA',
            'net_margin': round(net_margin, 2) if net_margin is not None else 'NA',
            'score': round(profitability_score, 0),
            'level': profitability_level
        },
        'solvency': {
            'debt_ratio': round(debt_ratio, 2) if debt_ratio is not None else 'NA',
            'current_ratio': round(current_ratio, 2) if current_ratio is not None else 'NA',
            'score': round(solvency_score, 0),
            'level': solvency_level
        },
        'valuation': {
            'pe': round(pe, 2) if pe is not None else 'NA',
            'pb': round(pb, 2) if pb is not None else 'NA',
            'score': round(valuation_score, 0),
            'level': valuation_level
        },
        'overall_score': round(total_score, 0),
        'report_date': financial_indicators.get('report_date', 'NA')
    }


def analyze_stock(code):
    """股票深度分析 - 主函数"""
    try:
        ts_code = to_ts_code(code)
        
        # 1. 获取基本信息
        basic_info = get_stock_basic_info(code)
        if not basic_info:
            error(f"未找到股票: {code}")
            return
        
        stock_name = basic_info['name']
        
        # 2. 获取各类数据
        valuation = get_stock_valuation(ts_code)
        financial_indicators = get_financial_indicators(ts_code)
        klines = get_kline_data(ts_code)
        
        # 3. 进行技术分析
        technical_analysis = analyze_technical(klines)
        
        # 4. 进行基本面分析
        fundamental_analysis = analyze_fundamental(financial_indicators, valuation)
        
        # 5. 生成投资建议
        total_score = fundamental_analysis.get('overall_score', 0)
        trend_score = technical_analysis['short_term']['strength']
        
        # 综合得分
        final_score = (total_score * 0.6 + trend_score * 0.4)
        
        # 投资建议
        if final_score >= 75:
            recommendation = '买入'
            risk_level = '中低'
        elif final_score >= 60:
            recommendation = '增持'
            risk_level = '中'
        elif final_score >= 45:
            recommendation = '持有'
            risk_level = '中高'
        elif final_score >= 30:
            recommendation = '减持'
            risk_level = '高'
        else:
            recommendation = '卖出'
            risk_level = '很高'
        
        # 机会和风险提示
        opportunities = []
        risks = []
        
        if technical_analysis['short_term']['trend'] == '上升':
            opportunities.append('短期趋势向上')
        
        if fundamental_analysis['profitability']['score'] >= 70:
            opportunities.append('盈利能力强')
        
        if fundamental_analysis['valuation']['level'] == '低估':
            opportunities.append('估值处于低估区间')
        
        if technical_analysis['volume_trend'] == '放量':
            opportunities.append('成交活跃,资金关注度高')
        
        debt_ratio = fundamental_analysis['solvency'].get('debt_ratio')
        if debt_ratio and debt_ratio != 'NA' and debt_ratio > 60:
            risks.append('资产负债率较高')
        
        if fundamental_analysis['valuation']['level'] == '高估':
            risks.append('估值偏高,注意回调风险')
        
        rsi = technical_analysis['indicators'].get('rsi')
        if rsi and rsi != 'NA' and rsi > 70:
            risks.append('RSI超买,短期可能回调')
        
        if not opportunities:
            opportunities.append('暂无明显机会,建议观望')
        
        if not risks:
            risks.append('暂无明显风险')
        
        # 构建最终分析报告
        report = {
            'stock': {
                'code': code,
                'ts_code': ts_code,
                'name': stock_name,
                'current_price': basic_info['price'],
                'change': round(basic_info['price'] - basic_info['pre_close'], 2),
                'change_pct': round((basic_info['price'] - basic_info['pre_close']) / basic_info['pre_close'] * 100, 2) if basic_info['pre_close'] > 0 else 0
            },
            'technical_analysis': technical_analysis,
            'fundamental_analysis': fundamental_analysis,
            'investment_advice': {
                'recommendation': recommendation,
                'risk_level': risk_level,
                'score': round(final_score, 0),
                'short_term': f"{'看好' if technical_analysis['short_term']['trend'] == '上升' else '谨慎'}",
                'medium_term': f"{'看好' if technical_analysis['medium_term']['trend'] == '上升' else '谨慎'}",
                'long_term': f"{'看好' if technical_analysis['long_term']['trend'] == '上升' else '谨慎'}",
                'opportunities': opportunities,
                'risks': risks
            },
            'analysis_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_source': 'Tushare API'
        }
        
        success(report)
        
    except Exception as e:
        error(f"分析失败: {e}\n{traceback.format_exc()}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        error("缺少 action 参数")
        sys.exit(1)
    
    action = sys.argv[1]
    
    try:
        if action == 'analyze':
            if len(sys.argv) < 3:
                error("缺少股票代码")
                sys.exit(1)
            analyze_stock(sys.argv[2])
        else:
            error(f"未知 action: {action}")
    except Exception as e:
        error(f"执行失败: {e}\n{traceback.format_exc()}")
