#!/usr/bin/env python3
"""
火山方舟大模型服务
使用 volcenginesdkarkruntime 调用火山方舟 API
"""

import os
import json
from volcenginesdkarkruntime import Ark

def analyze_stock(stock_data, analysis_data, prompt):
    """
    使用火山方舟大模型分析股票
    
    Args:
        stock_data (dict): 股票数据
        analysis_data (dict): 分析数据
        prompt (str): 分析提示词
    
    Returns:
        dict: 分析结果
    """
    try:
        # 从环境变量获取配置
        api_key = os.environ.get('ARK_API_KEY')
        model = os.environ.get('VOLCANO_MODEL', 'doubao-seed-2-0-pro-260215')
        
        if not api_key:
            return {
                "error": "Missing ARK_API_KEY"
            }
        
        # 初始化 Ark 客户端
        client = Ark(
            base_url='https://ark.cn-beijing.volces.com/api/v3',
            api_key=api_key,
        )
        
        # 调用大模型
        response = client.responses.create(
            model=model,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )
        
        # 解析响应
        if response:
            try:
                # 尝试不同的响应结构
                if hasattr(response, 'output') and response.output:
                    output_item = response.output[0]
                    if hasattr(output_item, 'content') and output_item.content:
                        content = output_item.content[0].text
                    elif hasattr(output_item, 'text'):
                        content = output_item.text
                    else:
                        content = str(output_item)
                elif hasattr(response, 'text'):
                    content = response.text
                elif hasattr(response, 'summary') and response.summary:
                    # 处理 ResponseReasoningItem 结构
                    summary_items = response.summary
                    if summary_items:
                        content = '\n'.join([item.text for item in summary_items if hasattr(item, 'text')])
                    else:
                        content = str(response)
                else:
                    content = str(response)
                
                # 处理编码问题
                content = content.encode('utf-8', 'ignore').decode('utf-8')
                
                # 清理分析内容，移除乱码和无用信息
                content = content.replace('\n', '\n').replace('\r', '').strip()
                
                # 提取核心分析内容，去除开头的系统提示
                if '用户需要我对股票' in content:
                    content = content.split('用户需要我对股票')[1]
                
                return {
                    "analysis": content,
                    "model": model,
                    "timestamp": response.created.isoformat() if hasattr(response, 'created') else ""
                }
            except Exception as e:
                return {
                    "error": f"Failed to parse response: {str(e)}"
                }
        else:
            return {
                "error": "Invalid response from Volcano Ark"
            }
    
    except Exception as e:
        return {
            "error": str(e)
        }

if __name__ == "__main__":
    # 从环境变量获取数据
    stock_data = json.loads(os.environ.get('STOCK_DATA', '{}'))
    analysis_data = json.loads(os.environ.get('ANALYSIS_DATA', '{}'))
    prompt = os.environ.get('PROMPT', '')
    
    result = analyze_stock(stock_data, analysis_data, prompt)
    print(json.dumps(result, ensure_ascii=False, indent=2))
