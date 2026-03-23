#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试获取财务指标
"""
import sys
import json
import requests
from datetime import datetime

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'http://finance.sina.com.cn',
}

FINANCE_API_BASE = 'https://www.codebuddy.cn/v2/tool/financedata'

# 测试获取贵州茅台的财务指标
ts_code = '600519.SH'

params = {
    'api_name': 'fina_indicator',
    'params': {'ts_code': ts_code},
    'fields': ''
}
r = requests.post(FINANCE_API_BASE, json=params,
                 headers={**HEADERS, 'Content-Type': 'application/json'}, timeout=10)
result = r.json()

print("返回结果:")
print(json.dumps(result, indent=2, ensure_ascii=False))

if result.get('code') == 0 and result.get('data', {}).get('items'):
    items = result['data']['items']
    fields = result['data']['fields']

    print("\n字段列表:")
    print(fields)

    print("\n前3条数据:")
    for i, item in enumerate(items[:3]):
        print(f"\n第{i+1}条:")
        for j, field in enumerate(fields):
            print(f"  {field}: {item[j] if j < len(item) else 'N/A'}")
