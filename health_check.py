#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票监控系统健康检查脚本
检查项目各个模块的完整性和可用性
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent

class HealthChecker:
    """项目健康检查器"""
    
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.info = []
        self.results = {
            'backend': {},
            'frontend': {},
            'data_sources': {},
            'docs': {}
        }
    
    def log(self, message: str, level: str = 'info'):
        """记录检查结果"""
        if level == 'error':
            self.issues.append(f"❌ {message}")
        elif level == 'warning':
            self.warnings.append(f"⚠️  {message}")
        else:
            self.info.append(f"✅ {message}")
    
    def check_file_exists(self, filepath: str, description: str) -> bool:
        """检查文件是否存在"""
        full_path = PROJECT_ROOT / filepath
        if full_path.exists():
            self.log(f"{description}: {filepath}", 'info')
            return True
        else:
            self.log(f"{description} 缺失: {filepath}", 'error')
            return False
    
    def check_directory_structure(self):
        """检查目录结构"""
        print("\n" + "="*80)
        print("检查目录结构")
        print("="*80)
        
        # 检查后端
        self.check_directory_exists("backend", "后端目录")
        
        # 检查前端
        self.check_directory_exists("src", "前端源代码目录")
        self.check_directory_exists("public", "前端静态资源目录")
        
        # 检查配置文件
        self.check_file_exists("package.json", "前端package.json")
        self.check_file_exists("backend/package.json", "后端package.json")
        self.check_file_exists("vite.config.js", "Vite配置文件")
        self.check_file_exists("eslint.config.js", "ESLint配置文件")
    
    def check_directory_exists(self, dirpath: str, description: str) -> bool:
        """检查目录是否存在"""
        full_path = PROJECT_ROOT / dirpath
        if full_path.exists() and full_path.is_dir():
            count = len(list(full_path.rglob('*')))
            self.log(f"{description}: {dirpath} ({count} 个文件)", 'info')
            return True
        else:
            self.log(f"{description} 缺失: {dirpath}", 'error')
            return False
    
    def check_backend_services(self):
        """检查后端服务"""
        print("\n" + "="*80)
        print("🔧 检查后端服务")
        print("="*80)
        
        # 检查路由文件
        routes_dir = PROJECT_ROOT / "backend" / "routes"
        required_routes = [
            "stockRoutes.js",
            "marketRoutes.js",
            "industryRoutes.js",
            "reportRoutes.js",
            "analysisRoutes.js"
        ]
        
        for route_file in required_routes:
            self.check_file_exists(f"backend/routes/{route_file}", f"路由文件 {route_file}")
        
        # 检查服务文件
        services_dir = PROJECT_ROOT / "backend" / "services"
        required_services = [
            "analysis_service.py",
            "analysis_service_tushare.py",
            "tushareService.js",
            "akshare_service.py",
            "verify_fields_simple.py"
        ]
        
        for service_file in required_services:
            self.check_file_exists(f"backend/services/{service_file}", f"服务文件 {service_file}")
        
        # 检查环境变量
        env_file = PROJECT_ROOT / "backend" / ".env"
        if env_file.exists():
            self.log("环境配置文件: backend/.env", 'info')
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'TUSHARE_TOKEN' in content:
                    self.log("Tushare Token: 已配置", 'info')
                    self.results['data_sources']['tushare_token'] = 'configured'
                else:
                    self.log("Tushare Token: 未配置", 'warning')
                    self.results['data_sources']['tushare_token'] = 'not_configured'
        else:
            self.log("环境配置文件缺失: backend/.env", 'warning')
            self.results['data_sources']['tushare_token'] = 'missing'
    
    def check_frontend_components(self):
        """检查前端组件"""
        print("\n" + "="*80)
        print("🎨 检查前端组件")
        print("="*80)
        
        # 检查主要组件
        components_dir = PROJECT_ROOT / "src" / "components"
        required_components = [
            "Watchlist.jsx",
            "StockDetail.jsx",
            "StockAnalysis.jsx",
            "IndustryAnalysis.jsx",
            "MarketOverview.jsx",
            "Report.jsx"
        ]
        
        for component in required_components:
            self.check_file_exists(f"src/components/{component}", f"组件 {component}")
        
        # 检查页面
        pages_dir = PROJECT_ROOT / "src" / "pages"
        if pages_dir.exists():
            page_files = list(pages_dir.glob('*.jsx'))
            self.log(f"页面组件: {len(page_files)} 个", 'info')
        else:
            self.log("页面目录缺失: src/pages", 'error')
    
    def check_documentation(self):
        """检查文档完整性"""
        print("\n" + "="*80)
        print("📚 检查文档")
        print("="*80)
        
        docs = [
            ("README.md", "项目说明"),
            ("AI_ANALYSIS_README.md", "AI分析功能说明"),
            ("AI_ANALYSIS_REAL_DATA_REPORT.md", "真实数据接入报告"),
            ("DATA_FIELDS_MAPPING.md", "数据字段映射"),
            ("TUSHARE_TOKEN_CONFIG.md", "Token配置指南"),
            ("QUICK_START_GUIDE.md", "快速开始指南"),
            ("PROJECT_CHECK_REPORT.md", "项目检查报告")
        ]
        
        for doc_file, description in docs:
            if self.check_file_exists(doc_file, description):
                self.results['docs'][doc_file] = 'exists'
            else:
                self.results['docs'][doc_file] = 'missing'
    
    def check_dependencies(self):
        """检查依赖项"""
        print("\n" + "="*80)
        print("📦 检查依赖项")
        print("="*80)
        
        # 检查前端依赖
        frontend_node_modules = PROJECT_ROOT / "node_modules"
        if frontend_node_modules.exists():
            self.log("前端依赖: 已安装 (node_modules exists)", 'info')
            self.results['frontend']['dependencies'] = 'installed'
        else:
            self.log("前端依赖: 未安装 (需要运行 npm install)", 'warning')
            self.results['frontend']['dependencies'] = 'not_installed'
        
        # 检查后端依赖
        backend_node_modules = PROJECT_ROOT / "backend" / "node_modules"
        if backend_node_modules.exists():
            self.log("后端依赖: 已安装 (backend/node_modules exists)", 'info')
            self.results['backend']['dependencies'] = 'installed'
        else:
            self.log("后端依赖: 未安装 (需要运行 npm install)", 'warning')
            self.results['backend']['dependencies'] = 'not_installed'
    
    def check_ai_analysis_service(self):
        """检查AI分析服务"""
        print("\n" + "="*80)
        print("🤖 检查AI分析服务")
        print("="*80)
        
        # 检查Python分析服务
        analysis_service = PROJECT_ROOT / "backend" / "services" / "analysis_service.py"
        if analysis_service.exists():
            self.log("CodeBuddy分析服务: 存在", 'info')
            self.results['data_sources']['codebuddy'] = 'available'
        else:
            self.log("CodeBuddy分析服务: 缺失", 'error')
            self.results['data_sources']['codebuddy'] = 'missing'
        
        analysis_service_tushare = PROJECT_ROOT / "backend" / "services" / "analysis_service_tushare.py"
        if analysis_service_tushare.exists():
            self.log("Tushare分析服务: 存在", 'info')
            self.results['data_sources']['tushare'] = 'available'
        else:
            self.log("Tushare分析服务: 缺失", 'error')
            self.results['data_sources']['tushare'] = 'missing'
        
        # 检查验证脚本
        verify_script = PROJECT_ROOT / "backend" / "services" / "verify_fields_simple.py"
        if verify_script.exists():
            self.log("数据字段验证脚本: 存在", 'info')
    
    def generate_summary(self):
        """生成检查摘要"""
        print("\n" + "="*80)
        print("📊 检查摘要")
        print("="*80)
        
        total_issues = len(self.issues)
        total_warnings = len(self.warnings)
        total_info = len(self.info)
        
        print(f"\n✅ 正常项: {total_info}")
        print(f"⚠️  警告项: {total_warnings}")
        print(f"❌ 错误项: {total_issues}")
        
        # 计算健康分数
        if total_info > 0:
            health_score = (total_info / (total_info + total_issues)) * 100
        else:
            health_score = 0
        
        print(f"\n🎯 项目健康度: {health_score:.1f}/100")
        
        if health_score >= 90:
            status = "优秀 (A)"
        elif health_score >= 80:
            status = "良好 (B)"
        elif health_score >= 70:
            status = "中等 (C)"
        elif health_score >= 60:
            status = "及格 (D)"
        else:
            status = "不及格 (F)"
        
        print(f"📈 项目状态: {status}")
        
        # 输出关键问题
        if self.issues:
            print("\n" + "="*80)
            print("🚨 关键问题 (需立即处理)")
            print("="*80)
            for issue in self.issues[:10]:  # 只显示前10个
                print(f"  {issue}")
        
        # 输出警告
        if self.warnings:
            print("\n" + "="*80)
            print("⚠️  警告项 (建议处理)")
            print("="*80)
            for warning in self.warnings[:10]:  # 只显示前10个
                print(f"  {warning}")
        
        # 保存结果到JSON
        results_file = PROJECT_ROOT / "health_check_results.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump({
                'health_score': health_score,
                'status': status,
                'total_issues': total_issues,
                'total_warnings': total_warnings,
                'total_info': total_info,
                'results': self.results,
                'issues': self.issues,
                'warnings': self.warnings,
                'info': self.info
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 详细结果已保存到: {results_file}")
    
    def run_all_checks(self):
        """运行所有检查"""
        sys.stdout.reconfigure(encoding='utf-8')  # 修复Windows编码问题
        print("股票监控系统健康检查")
        print("="*80)
        
        try:
            self.check_directory_structure()
            self.check_backend_services()
            self.check_frontend_components()
            self.check_documentation()
            self.check_dependencies()
            self.check_ai_analysis_service()
            self.generate_summary()
            
            return True
        except Exception as e:
            print(f"\n❌ 检查过程中发生错误: {e}")
            return False

def main():
    """主函数"""
    checker = HealthChecker()
    success = checker.run_all_checks()
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()
