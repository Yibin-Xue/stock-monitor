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
            print(f"API error ({api_name}): {result.get('msg')}")
            return None
        
        return result.get('data')
    except Exception as e:
        print(f"API call failed ({api_name}): {e}")
        return None

def verify_fields(ts_code='600519.SH'):
    """验证所有必需字段"""
    print("=" * 80)
    print("AI Analysis Data Fields Verification")
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
    print("\n1. Verify Basic Info (daily API)")
    daily_data = call_api('daily', {
        'ts_code': ts_code,
        'start_date': get_recent_date(5),
        'end_date': get_today()
    })
    
    if daily_data and daily_data.get('items'):
        fields = daily_data['fields']
        latest = daily_data['items'][0]
        
        print("   Returned fields:", fields)
        print("\n   Checking required fields:")
        for field in required_fields['basic']:
            if field in fields:
                idx = fields.index(field)
                value = latest[idx] if idx < len(latest) else None
                status = "OK" if value is not None else "NULL"
                print(f"     [{status}] {field}: {value}")
            else:
                print(f"     [MISSING] {field}: field not found")
                all_ok = False
    else:
        print("   [FAILED] Failed to get data")
        all_ok = False
    
    # 2. 验证估值数据(daily_basic)
    print("\n2. Verify Valuation Data (daily_basic API)")
    basic_data = call_api('daily_basic', {
        'ts_code': ts_code,
        'start_date': get_recent_date(5),
        'end_date': get_today()
    })
    
    if basic_data and basic_data.get('items'):
        fields = basic_data['fields']
        latest = basic_data['items'][0]
        
        print("   Returned fields:", fields)
        print("\n   Checking required fields:")
        for field in required_fields['valuation']:
            if field in fields:
                idx = fields.index(field)
                value = latest[idx] if idx < len(latest) else None
                status = "OK" if value is not None else "NULL"
                print(f"     [{status}] {field}: {value}")
            else:
                print(f"     [MISSING] {field}: field not found")
                all_ok = False
    else:
        print("   [FAILED] Failed to get data")
        all_ok = False
    
    # 3. 验证财务指标(fina_indicator)
    print("\n3. Verify Financial Indicators (fina_indicator API)")
    fina_data = call_api('fina_indicator', {
        'ts_code': ts_code,
        'start_date': get_recent_date(365),
        'end_date': get_today()
    })
    
    if fina_data and fina_data.get('items'):
        fields = fina_data['fields']
        latest = fina_data['items'][0]
        
        print(f"   Returned {len(fields)} fields")
        print("\n   Checking required fields:")
        for field in required_fields['financial']:
            if field in fields:
                idx = fields.index(field)
                value = latest[idx] if idx < len(latest) else None
                status = "OK" if value is not None else "NULL"
                print(f"     [{status}] {field}: {value}")
            else:
                print(f"     [MISSING] {field}: field not found")
                all_ok = False
    else:
        print("   [FAILED] Failed to get data")
        all_ok = False
    
    # 4. 验证K线数据
    print("\n4. Verify K-Line Data (daily API, 60 days)")
    kline_data = call_api('daily', {
        'ts_code': ts_code,
        'start_date': get_recent_date(70),
        'end_date': get_today()
    })
    
    if kline_data and kline_data.get('items'):
        items = kline_data['items']
        print(f"   [OK] Got {len(items)} K-line records")
        if len(items) >= 60:
            print("   [OK] Sufficient data for technical analysis (need at least 60)")
        else:
            print(f"   [WARNING] Insufficient data (need 60, got {len(items)})")
            all_ok = False
    else:
        print("   [FAILED] Failed to get data")
        all_ok = False
    
    # 总结
    print("\n" + "=" * 80)
    if all_ok:
        print("[SUCCESS] All required fields verified!")
    else:
        print("[WARNING] Some fields missing or empty")
    print("=" * 80)
    
    return all_ok

if __name__ == '__main__':
    # 验证贵州茅台
    verify_fields('600519.SH')
