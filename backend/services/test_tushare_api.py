#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试Tushare API调用
"""
import requests
import json
import os
from datetime import datetime

# Tushare API配置
TUSHARE_API_URL = 'http://api.tushare.pro'
TOKEN = os.environ.get('TUSHARE_TOKEN', 'YOUR_TOKEN_HERE')

def get_today():
    return datetime.now().strftime('%Y%m%d')

def get_recent_date(days):
    from datetime import timedelta
    return (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')

def call_tushare_api(api_name, params=None):
    """调用Tushare API"""
    try:
        url = TUSHARE_API_URL
        payload = {
            'api_name': api_name,
            'token': TOKEN,
            'params': params or {},
            'fields': ''
        }
        
        r = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
        result = r.json()
        
        if result.get('code') != 0:
            print(f"❌ API错误 ({api_name}): {result.get('msg')}")
            return None
        
        return result.get('data')
    except Exception as e:
        print(f"❌ 调用失败 ({api_name}): {e}")
        return None

def test_api(ts_code='600519.SH'):
    """测试所有需要的API"""
    print("=" * 60)
    print("Tushare API 测试")
    print("=" * 60)
    
    # 测试1: 获取基本信息(daily)
    print("\n1️⃣ 测试 daily 接口 (基本信息)...")
    daily_data = call_tushare_api('daily', {
        'ts_code': ts_code,
        'start_date': get_recent_date(5),
        'end_date': get_today()
    })
    
    if daily_data and daily_data.get('items'):
        print("✅ daily 接口调用成功")
        latest = daily_data['items'][0]
        fields = daily_data['fields']
        print(f"   最新日期: {latest[fields.index('trade_date')]}")
        print(f"   收盘价: {latest[fields.index('close')]}")
        print(f"   成交量: {latest[fields.index('vol')]}")
    else:
        print("❌ daily 接口调用失败")
    
    # 测试2: 获取估值数据(daily_basic)
    print("\n2️⃣ 测试 daily_basic 接口 (估值数据)...")
    basic_data = call_tushare_api('daily_basic', {
        'ts_code': ts_code,
        'start_date': get_recent_date(5),
        'end_date': get_today()
    })
    
    if basic_data and basic_data.get('items'):
        print("✅ daily_basic 接口调用成功")
        latest = basic_data['items'][0]
        fields = basic_data['fields']
        print(f"   PE: {latest[fields.index('pe')] if 'pe' in fields else 'N/A'}")
        print(f"   PB: {latest[fields.index('pb')] if 'pb' in fields else 'N/A'}")
        print(f"   换手率: {latest[fields.index('turnover_rate')] if 'turnover_rate' in fields else 'N/A'}")
    else:
        print("❌ daily_basic 接口调用失败")
    
    # 测试3: 获取财务指标(fina_indicator)
    print("\n3️⃣ 测试 fina_indicator 接口 (财务指标)...")
    fina_data = call_tushare_api('fina_indicator', {
        'ts_code': ts_code,
        'start_date': get_recent_date(365),
        'end_date': get_today()
    })
    
    if fina_data and fina_data.get('items'):
        print("✅ fina_indicator 接口调用成功")
        latest = fina_data['items'][0]
        fields = fina_data['fields']
        print(f"   报告期: {latest[fields.index('end_date')] if 'end_date' in fields else 'N/A'}")
        print(f"   ROE: {latest[fields.index('roe')] if 'roe' in fields else 'N/A'}")
        print(f"   毛利率: {latest[fields.index('gross_margin')] if 'gross_margin' in fields else 'N/A'}")
        
        # 显示所有可用字段
        print("\n   📋 可用字段列表:")
        for i, field in enumerate(fields):
            value = latest[i] if i < len(latest) else None
            print(f"      - {field}: {value}")
    else:
        print("❌ fina_indicator 接口调用失败")
        print("   提示: 该接口可能需要高级积分或专业版权限")
    
    # 测试4: 获取K线数据(daily,历史60日)
    print("\n4️⃣ 测试 daily 接口 (K线数据,60日)...")
    kline_data = call_tushare_api('daily', {
        'ts_code': ts_code,
        'start_date': get_recent_date(70),
        'end_date': get_today()
    })
    
    if kline_data and kline_data.get('items'):
        items = kline_data['items']
        print(f"✅ daily 接口调用成功")
        print(f"   获取到 {len(items)} 条K线数据")
        if len(items) >= 10:
            print(f"   最新10条日期: {[item[kline_data['fields'].index('trade_date')] for item in items[-10:]]}")
    else:
        print("❌ daily 接口调用失败")
    
    # 测试5: 获取股票基本信息(stock_basic)
    print("\n5️⃣ 测试 stock_basic 接口 (股票列表)...")
    stock_basic = call_tushare_api('stock_basic', {
        'ts_code': ts_code,
        'list_status': 'L'
    })
    
    if stock_basic and stock_basic.get('items'):
        print("✅ stock_basic 接口调用成功")
        latest = stock_basic['items'][0]
        fields = stock_basic['fields']
        print(f"   股票名称: {latest[fields.index('name')] if 'name' in fields else 'N/A'}")
        print(f"   行业: {latest[fields.index('industry')] if 'industry' in fields else 'N/A'}")
        print(f"   上市日期: {latest[fields.index('list_date')] if 'list_date' in fields else 'N/A'}")
    else:
        print("❌ stock_basic 接口调用失败")
    
    print("\n" + "=" * 60)
    print("测试完成!")
    print("=" * 60)
    print("\n💡 提示:")
    print("   - 如果某些接口调用失败,可能是因为权限不足")
    print("   - 请检查Tushare账号的积分等级")
    print("   - finance-data API与Tushare API字段可能略有不同")
    print("=" * 60)

if __name__ == '__main__':
    if TOKEN == 'YOUR_TOKEN_HERE':
        print("❌ 请先设置TUSHARE_TOKEN环境变量!")
        print("   Windows: set TUSHARE_TOKEN=你的Token")
        print("   Linux/Mac: export TUSHARE_TOKEN=你的Token")
    else:
        # 测试贵州茅台
        test_api('600519.SH')
