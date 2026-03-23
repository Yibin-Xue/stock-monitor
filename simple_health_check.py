#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""股票监控系统健康检查脚本(简化版)"""

import os
import sys
import json
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent

def check_project():
    """检查项目状态"""
    results = {
        'status': 'ok',
        'checks': {},
        'issues': [],
        'warnings': []
    }
    
    print("="*80)
    print("股票监控系统健康检查")
    print("="*80)
    
    # 1. 检查目录结构
    print("\n[1/6] 检查目录结构...")
    required_dirs = ['backend', 'src', 'public']
    for dir_name in required_dirs:
        dir_path = PROJECT_ROOT / dir_name
        if dir_path.exists():
            print(f"  + {dir_name}: OK")
            results['checks'][dir_name] = 'ok'
        else:
            print(f"  - {dir_name}: MISSING")
            results['checks'][dir_name] = 'missing'
            results['issues'].append(f"目录缺失: {dir_name}")
    
    # 2. 检查后端路由
    print("\n[2/6] 检查后端路由...")
    routes = ['stockRoutes.js', 'marketRoutes.js', 'industryRoutes.js', 
              'reportRoutes.js', 'analysisRoutes.js']
    for route in routes:
        route_path = PROJECT_ROOT / 'backend' / 'routes' / route
        if route_path.exists():
            print(f"  + {route}: OK")
        else:
            print(f"  - {route}: MISSING")
            results['issues'].append(f"路由缺失: {route}")
    
    # 3. 检查后端服务
    print("\n[3/6] 检查后端服务...")
    services = ['analysis_service.py', 'analysis_service_tushare.py', 
                'tushareService.js', 'akshare_service.py']
    for service in services:
        service_path = PROJECT_ROOT / 'backend' / 'services' / service
        if service_path.exists():
            print(f"  + {service}: OK")
        else:
            print(f"  - {service}: MISSING")
            results['issues'].append(f"服务缺失: {service}")
    
    # 4. 检查前端组件
    print("\n[4/6] 检查前端组件...")
    components = ['Watchlist.jsx', 'StockAnalysis.jsx', 'IndustryAnalysis.jsx']
    for component in components:
        component_path = PROJECT_ROOT / 'src' / 'components' / component
        if component_path.exists():
            print(f"  + {component}: OK")
        else:
            print(f"  - {component}: MISSING")
            results['issues'].append(f"组件缺失: {component}")
    
    # 5. 检查文档
    print("\n[5/6] 检查文档...")
    docs = ['README.md', 'AI_ANALYSIS_README.md', 'QUICK_START_GUIDE.md']
    for doc in docs:
        doc_path = PROJECT_ROOT / doc
        if doc_path.exists():
            print(f"  + {doc}: OK")
        else:
            print(f"  - {doc}: MISSING")
            results['warnings'].append(f"文档缺失: {doc}")
    
    # 6. 检查配置
    print("\n[6/6] 检查配置...")
    env_file = PROJECT_ROOT / 'backend' / '.env'
    if env_file.exists():
        print(f"  + backend/.env: OK")
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'TUSHARE_TOKEN' in content and len(content.split('=')[1].strip()) > 10:
                print(f"  + Tushare Token: Configured")
                results['checks']['tushare_token'] = 'configured'
            else:
                print(f"  - Tushare Token: Not configured")
                results['warnings'].append("Tushare Token未配置")
    else:
        print(f"  - backend/.env: MISSING")
        results['warnings'].append("环境配置文件缺失")
    
    # 计算健康分数
    total_checks = len(results['checks'])
    ok_checks = sum(1 for v in results['checks'].values() if v == 'ok' or v == 'configured')
    health_score = (ok_checks / total_checks * 100) if total_checks > 0 else 0
    
    # 总结
    print("\n" + "="*80)
    print("检查摘要")
    print("="*80)
    print(f"健康分数: {health_score:.1f}/100")
    print(f"正常项: {ok_checks}/{total_checks}")
    print(f"错误项: {len(results['issues'])}")
    print(f"警告项: {len(results['warnings'])}")
    
    if results['issues']:
        print("\n错误项:")
        for issue in results['issues']:
            print(f"  - {issue}")
    
    if results['warnings']:
        print("\n警告项:")
        for warning in results['warnings']:
            print(f"  - {warning}")
    
    # 项目状态
    if health_score >= 90:
        status = "优秀 (A)"
        print(f"\n项目状态: {status}")
    elif health_score >= 80:
        status = "良好 (B)"
        print(f"\n项目状态: {status}")
    elif health_score >= 70:
        status = "中等 (C)"
        print(f"\n项目状态: {status}")
    elif health_score >= 60:
        status = "及格 (D)"
        print(f"\n项目状态: {status}")
    else:
        status = "不及格 (F)"
        print(f"\n项目状态: {status}")
    
    # 保存结果
    results['health_score'] = health_score
    results['status'] = status
    
    results_file = PROJECT_ROOT / 'health_check_results.json'
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n详细结果已保存到: {results_file}")
    
    return results

if __name__ == '__main__':
    results = check_project()
    sys.exit(0 if results['status'] not in ['不及格 (F)', '及格 (D)'] else 1)
