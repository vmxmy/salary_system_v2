#!/usr/bin/env python3
"""
报表API视图优化测试脚本
测试优化前后的性能差异
"""

import asyncio
import time
import json
import requests
from typing import Dict, Any, List, Optional
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API配置
BASE_URL = "http://localhost:8080/v2"

class ReportOptimizationTester:
    """报表优化测试器"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        # 添加访问令牌
        self.access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDkzODE4MTB9.S8lvm-q0DiKayMqaIzisRnj57iK1Y7Z7omyrjyVoQrk"
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        self.test_results = []
    
    def test_data_source_preview(self, data_source_id: int) -> Dict[str, Any]:
        """测试数据源预览API的优化效果"""
        logger.info(f"开始测试: 数据源{data_source_id}预览 (数据源ID: {data_source_id})")
        
        # 测试传统查询
        traditional_time = self._call_preview_api(data_source_id, use_optimized_view=False)
        
        # 测试优化查询
        optimized_time = self._call_preview_api(data_source_id, use_optimized_view=True)
        
        # 计算性能提升
        improvement = 0.0
        if traditional_time > 0 and optimized_time > 0:
            improvement = ((traditional_time - optimized_time) / traditional_time) * 100
        
        result = {
            "test_name": f"数据源{data_source_id}预览",
            "traditional_time": traditional_time,
            "optimized_time": optimized_time,
            "improvement_percent": improvement,
            "status": "优化有效" if improvement > 10 else "优化效果不明显"
        }
        
        self.test_results.append(result)
        logger.info(f"测试完成: 数据源{data_source_id}预览, 性能提升: {improvement:.2f}%")
        return result

    def _call_preview_api(self, data_source_id: int, use_optimized_view: bool) -> float:
        """调用预览API并返回执行时间"""
        try:
            url = f"{self.base_url}/reports/data-sources/{data_source_id}/preview"
            params = {
                "limit": 20,
                "use_optimized_view": use_optimized_view
            }
            
            start_time = time.time()
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            execution_time = time.time() - start_time
            
            if response.status_code == 200:
                return execution_time
            else:
                logger.error(f"API调用失败: {response.status_code}, {response.text}")
                return 0.0
                
        except Exception as e:
            logger.error(f"API调用异常: {e}")
            return 0.0
    
    def test_report_query(self, template_id: int, test_name: str = "报表查询"):
        """测试报表查询API的优化效果"""
        logger.info(f"开始测试: {test_name} (模板ID: {template_id})")
        
        query_data = {
            "template_id": template_id,
            "page": 1,
            "page_size": 50,
            "filters": {},
            "sorting": []
        }
        
        # 测试标准查询
        standard_time, standard_success, standard_result = self._test_query_api(
            "/reports/query", query_data
        )
        
        # 测试快速查询（如果支持）
        fast_query_data = {
            "data_source_type": "payroll",
            "category": "entries",
            "page": 1,
            "page_size": 50,
            "filters": {},
            "sorting": []
        }
        
        fast_time, fast_success, fast_result = self._test_query_api(
            "/reports/query-fast", fast_query_data
        )
        
        # 计算性能提升
        improvement = 0
        if standard_success and fast_success and standard_time > 0:
            improvement = ((standard_time - fast_time) / standard_time) * 100
        
        result = {
            "test_name": test_name,
            "template_id": template_id,
            "standard": {
                "time": standard_time,
                "success": standard_success,
                "count": standard_result.get("total", 0) if standard_result else 0
            },
            "fast": {
                "time": fast_time,
                "success": fast_success,
                "count": fast_result.get("total", 0) if fast_result else 0
            },
            "improvement_percent": improvement,
            "status": "优化有效" if improvement > 10 else "优化效果不明显"
        }
        
        self.test_results.append(result)
        logger.info(f"测试完成: {test_name}, 性能提升: {improvement:.2f}%")
        return result
    
    def _test_query_api(self, endpoint: str, data: Dict[str, Any]):
        """测试查询API"""
        url = f"{self.base_url}{endpoint}"
        
        start_time = time.time()
        try:
            response = requests.post(url, headers=self.headers, json=data, timeout=60)
            execution_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                return execution_time, True, result
            else:
                logger.error(f"API调用失败: {response.status_code}, {response.text}")
                return execution_time, False, {}
                
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"API调用异常: {str(e)}")
            return execution_time, False, {}
    
    def test_optimization_suggestions(self, data_source_id: int):
        """测试优化建议API"""
        logger.info(f"测试优化建议API (数据源ID: {data_source_id})")
        
        url = f"{self.base_url}/reports/data-sources/{data_source_id}/optimization-suggestions"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                suggestions = response.json()
                logger.info(f"优化建议: {json.dumps(suggestions, indent=2, ensure_ascii=False)}")
                return suggestions
            else:
                logger.error(f"获取优化建议失败: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"获取优化建议异常: {str(e)}")
            return None
    
    def test_available_views(self):
        """测试可用视图列表API"""
        logger.info("测试可用视图列表API")
        
        url = f"{self.base_url}/reports/optimization/available-views"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                views = response.json()
                logger.info(f"可用视图数量: {views.get('total_views', 0)}")
                logger.info(f"配置映射数量: {views.get('total_mappings', 0)}")
                return views
            else:
                logger.error(f"获取可用视图失败: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"获取可用视图异常: {str(e)}")
            return None
    
    def test_performance_comparison(self, data_source_id: int):
        """测试性能对比API"""
        logger.info(f"测试性能对比API (数据源ID: {data_source_id})")
        
        url = f"{self.base_url}/reports/optimization/test-view-performance"
        data = {
            "data_source_id": data_source_id,
            "query_params": {
                "limit": 20,
                "filters": {}
            }
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"性能对比结果: {json.dumps(result, indent=2, ensure_ascii=False)}")
                return result
            else:
                logger.error(f"性能对比测试失败: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"性能对比测试异常: {str(e)}")
            return None
    
    def test_fast_query_api(self, report_id: int):
        """测试快速查询API"""
        logger.info(f"测试快速查询API (报表ID: {report_id})")
        
        try:
            url = f"{self.base_url}/reports/query-fast"
            payload = {
                "data_source_type": "payroll",
                "category": "entries",
                "filters": {"status": "active"},
                "page": 1,
                "page_size": 20
            }
            
            start_time = time.time()
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            execution_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"快速查询成功: 执行时间 {execution_time:.3f}s, 结果数量: {len(data.get('data', []))}")
                return True
            else:
                logger.error(f"快速查询失败: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"快速查询异常: {e}")
            return False

    def test_performance_stats(self):
        """测试性能统计API"""
        logger.info("测试性能统计API")
        
        try:
            url = f"{self.base_url}/reports/optimization/stats"
            params = {"hours": 24}
            
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            
            if response.status_code == 200:
                stats = response.json()
                logger.info(f"性能统计获取成功: {stats}")
                return stats
            else:
                logger.error(f"获取性能统计失败: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"性能统计异常: {e}")
            return None
    
    def run_comprehensive_test(self):
        """运行综合测试"""
        logger.info("开始运行报表优化综合测试")
        
        # 测试可用视图列表
        logger.info("测试可用视图列表API")
        self.test_available_views()
        
        # 使用实际存在的报表类型ID进行测试
        report_type_ids = [2, 3, 4]  # 使用数据库中实际存在的报表类型ID
        
        for report_id in report_type_ids:
            try:
                # 测试报表查询优化
                self.test_report_query(report_id, f"报表{report_id}查询")
                
                # 测试快速查询API
                self.test_fast_query_api(report_id)
                
                # 测试性能统计
                self.test_performance_stats()
                
            except Exception as e:
                logger.error(f"测试报表{report_id}时发生错误: {e}")
                continue
        
        # 生成测试总结
        self._generate_summary()
    
    def print_test_summary(self):
        """打印测试总结"""
        logger.info("=" * 60)
        logger.info("测试总结")
        logger.info("=" * 60)
        
        if not self.test_results:
            logger.info("没有测试结果")
            return
        
        total_tests = len(self.test_results)
        successful_optimizations = len([r for r in self.test_results if r["improvement_percent"] > 10])
        
        logger.info(f"总测试数: {total_tests}")
        logger.info(f"优化有效测试数: {successful_optimizations}")
        logger.info(f"优化成功率: {(successful_optimizations/total_tests)*100:.1f}%")
        
        logger.info("\n详细结果:")
        for result in self.test_results:
            logger.info(f"- {result['test_name']}: {result['improvement_percent']:.2f}% 提升 ({result['status']})")
        
        # 计算平均性能提升
        avg_improvement = sum(r["improvement_percent"] for r in self.test_results) / total_tests
        logger.info(f"\n平均性能提升: {avg_improvement:.2f}%")


def main():
    """主函数"""
    tester = ReportOptimizationTester()
    
    # 运行综合测试
    tester.run_comprehensive_test()
    
    # 保存测试结果
    with open("report_optimization_test_results.json", "w", encoding="utf-8") as f:
        json.dump(tester.test_results, f, indent=2, ensure_ascii=False)
    
    logger.info("测试完成，结果已保存到 report_optimization_test_results.json")


if __name__ == "__main__":
    main() 