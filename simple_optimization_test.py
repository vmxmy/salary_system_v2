#!/usr/bin/env python3
"""
简化的报表优化测试脚本
专注于测试已经实现的优化功能
"""

import requests
import time
import json
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleOptimizationTester:
    def __init__(self):
        self.base_url = "http://localhost:8080/v2"
        self.access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDkzODE4MTB9.S8lvm-q0DiKayMqaIzisRnj57iK1Y7Z7omyrjyVoQrk"
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def test_available_views(self):
        """测试可用视图列表API"""
        logger.info("🔍 测试可用视图列表API")
        
        try:
            url = f"{self.base_url}/reports/optimization/available-views"
            response = requests.get(url, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ 可用视图数量: {len(data.get('available_views', []))}")
                logger.info(f"✅ 配置映射数量: {len(data.get('view_mappings', {}))}")
                
                # 显示具体的视图信息
                for view in data.get('available_views', []):
                    logger.info(f"   📊 视图: {view}")
                
                return True
            else:
                logger.error(f"❌ 获取可用视图失败: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ 可用视图API异常: {e}")
            return False

    def test_performance_stats(self):
        """测试性能统计API"""
        logger.info("📈 测试性能统计API")
        
        try:
            url = f"{self.base_url}/reports/optimization/stats"
            params = {"hours": 24}
            
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            
            if response.status_code == 200:
                stats = response.json()
                data = stats.get('data', {})
                
                logger.info(f"✅ 性能统计获取成功:")
                logger.info(f"   📊 总查询数: {data.get('total_queries', 0)}")
                logger.info(f"   ⚡ 优化查询数: {data.get('optimized_queries', 0)}")
                logger.info(f"   ⏱️ 平均执行时间: {data.get('average_execution_time', 0):.3f}s")
                logger.info(f"   📈 优化率: {data.get('optimization_rate', 0):.1f}%")
                
                return True
            else:
                logger.error(f"❌ 获取性能统计失败: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ 性能统计API异常: {e}")
            return False

    def test_direct_view_query(self):
        """测试直接查询优化视图"""
        logger.info("🚀 测试直接查询优化视图")
        
        # 测试查询薪资条目详细视图
        try:
            url = f"{self.base_url}/reports/query"
            payload = {
                "sql": "SELECT * FROM v_payroll_entries_detailed LIMIT 10",
                "use_optimized_view": True
            }
            
            start_time = time.time()
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            execution_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                result_count = len(data.get('data', []))
                logger.info(f"✅ 直接视图查询成功:")
                logger.info(f"   ⏱️ 执行时间: {execution_time:.3f}s")
                logger.info(f"   📊 结果数量: {result_count}")
                return True
            else:
                logger.error(f"❌ 直接视图查询失败: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ 直接视图查询异常: {e}")
            return False

    def run_tests(self):
        """运行所有测试"""
        logger.info("🎯 开始运行简化优化测试")
        logger.info("=" * 60)
        
        results = []
        
        # 测试1: 可用视图列表
        results.append(("可用视图列表", self.test_available_views()))
        
        # 测试2: 性能统计
        results.append(("性能统计", self.test_performance_stats()))
        
        # 测试3: 直接视图查询
        results.append(("直接视图查询", self.test_direct_view_query()))
        
        # 输出测试总结
        logger.info("=" * 60)
        logger.info("📋 测试总结:")
        
        success_count = 0
        for test_name, success in results:
            status = "✅ 成功" if success else "❌ 失败"
            logger.info(f"   {status}: {test_name}")
            if success:
                success_count += 1
        
        logger.info(f"📊 总体结果: {success_count}/{len(results)} 测试通过")
        
        if success_count == len(results):
            logger.info("🎉 所有测试通过！视图优化策略实施成功！")
        else:
            logger.info("⚠️ 部分测试失败，需要进一步调试")

if __name__ == "__main__":
    tester = SimpleOptimizationTester()
    tester.run_tests() 