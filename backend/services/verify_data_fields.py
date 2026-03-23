#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证AI分析所需的所有数据字段是否可以正确获取
"""
import sys
import json
import requests
from datetime import datetime, timedelta

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'http://finance.sina.com.cn',
}

FINANCE_API_BASE = 'https://www.codebuddy.cn/v2/tool/financedata'

def get_today():
    return datetime.now().strftime('%Y%m%d')

def get_recent_date(days):
    return (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')

def call_api(api_name, params=None):
    """调用CodeBuddy API"""
    try:
        url = FINANCE_API_BASE
        payload = {
            'api_name': api_name,
            'params': params or {},
            'fields': ''
        }
        
        r = requests.post(url, json=payload,
                        headers={**HEADERS, 'Content-Type': 'application/json'}, timeout=10)
        result = r.json()
        
        if result.get('code') != 0:
            print(f"❌ API错误 ({api_name}): {result.get('msg')}")
            return None
        
        return result.get('data')
    except Exception as e:
        print(f"❌ 调用失败 ({api_name}): {e}")
        return None

def verify_fields(ts_code='600519.SH'):
    """验证所有必需字段"""
    print("=" * 80)
    print("AI分析功能数据字段验证")
    print("=" * 80)
    
    # 必需字段清单
    required_fields = {
        'basic': ['open', 'high', 'low', 'close', 'pre_close', 'vol', 'amount'],
        'valuation': ['pe', 'pe_ttm', 'pb', 'total_mv', 'turnover_rate'],
        'financial': ['roe', 'grossprofit_margin', 'netprofit_margin', 'debt_to_assets',
                     'current_ratio', 'quick_ratio', 'eps']
    }
    
    all_ok = True
    
    # 1. 验证基本信息(daily)
    print("\n📊 1. 验证基本信息 (daily接口)")
    daily_data = call_api('daily', {
        'ts_code': ts_code,
        'start_date': get_recent_date(5),
        'end_date': get_today()
    })
    
    if daily_data and daily_data.get('items'):
        fields = daily_data['fields']
        latest = daily_data['items'][0]
        
        print("   返回字段:", fields)
        print("\n   检查必需字段:")
        for field in required_fields['basic']:
            if field in fields:
                idx = fields.index(field)
                value = latest[idx] if idx < len(latest) else None
                status = "✅" if value is not None else "⚠️  空值"
                print(f"     {status} {field}: {value}")
            else:
                print(f"     ❌ {field}: 字段不存在")
                all_ok = False
    else:
        print("   ❌ 获取数据失败")
        all_ok = False
    
    # 2. 验证估值数据(daily_basic)
    print("\n💰 2. 验证估值数据 (daily_basic接口)")
    basic_data = call_api('daily_basic', {
        'ts_code': ts_code,
        'start_date': get_recent_date(5),
        'end_date': get_today()
    })
    
    if basic_data and basic_data.get('items'):
        fields = basic_data['fields']
        latest = basic_data['items'][0]
        
        print("   返回字段:", fields)
        print("\n   检查必需字段:")
        for field in required_fields['valuation']:
            if field in fields:
                idx = fields.index(field)
                value = latest[idx] if idx < len(latest) else None
                status = "✅" if value is not None else "⚠️  空值"
                print(f"     {status} {field}: {value}")
            else:
                print(f"     ❌ {field}: 字段不存在")
                all_ok = False
    else:
        print("   ❌ 获取数据失败")
        all_ok = False
    
    # 3. 验证财务指标(fina_indicator)
    print("\n📈 3. 验证财务指标 (fina_indicator接口)")
    fina_data = call_api('fina_indicator', {
        'ts_code': ts_code,
        'start_date': get_recent_date(365),
        'end_date': get_today()
    })
    
    if fina_data and fina_data.get('items'):
        fields = fina_data['fields']
        latest = fina_data['items'][0]
        
        print("   返回字段数:", len(fields))
        print("\n   检查必需字段:")
        for field in required_fields['financial']:
            if field in fields:
                idx = fields.index(field)
                value = latest[idx] if idx < len(latest) else None
                status = "✅" if value is not None else "⚠️  空值"
                print(f"     {status} {field}: {value}")
            else:
                print(f"     ❌ {field}: 字段不存在")
                all_ok = False
    else:
        print("   ❌ 获取数据失败")
        all_ok = False
    
    # 4. 验证K线数据
    print("\n📉 4. 验证K线数据 (daily接口,60日)")
    kline_data = call_api('daily', {
        'ts_code': ts_code,
        'start_date': get_recent_date(70),
        'end_date': get_today()
    })
    
    if kline_data and kline_data.get('items'):
        items = kline_data['items']
        print(f"   ✅ 获取到 {len(items)} 条K线数据")
        if len(items) >= 60:
            print("   ✅ 数据量足够进行技术分析(需要至少60条)")
        else:
            print(f"   ⚠️  数据量不足(需要60条,实际{len(items)}条)")
            all_ok = False
    else:
        print("   ❌ 获取数据失败")
        all_ok = False
    
    # 总结
    print("\n" + "=" * 80)
    if all_ok:
        print("✅ 所有必需字段验证通过!")
    else:
        print("⚠️  部分字段缺失或为空,请检查")
    print("=" * 80)
    
    return all_ok

if __name__ == '__main__':
    # 验证贵州茅台
    verify_fields('600519.SH')
