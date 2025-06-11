#!/usr/bin/env python3
"""
🚀 性能瓶颈诊断脚本
专门用于分析API响应时间与SQL查询时间的巨大差距
"""

import time
import requests
import logging
import threading
import psutil
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PerformanceBottleneckDiagnoser:
    def __init__(self):
        self.base_url = "http://localhost:8080/v2"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "api_tests": [],
            "concurrent_tests": [],
            "bottleneck_analysis": {},
            "recommendations": []
        }
    
    def test_single_api_detailed(self, endpoint: str, description: str = ""):
        """详细测试单个API的性能分解"""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"🔍 详细测试: {description} - {url}")
        
        try:
            # 🚀 分段测试
            times = {}
            
            # 1. 连接建立时间
            times['start'] = time.time()
            
            # 2. 发送请求
            response = requests.get(url, timeout=30)
            times['response_received'] = time.time()
            
            # 3. 数据解析时间
            try:
                data = response.json()
                times['json_parsed'] = time.time()
                data_size = len(json.dumps(data))
            except:
                data = None
                data_size = len(response.content) if response.content else 0
                times['json_parsed'] = times['response_received']
            
            # 计算各阶段耗时
            total_time = (times['response_received'] - times['start']) * 1000
            parsing_time = (times['json_parsed'] - times['response_received']) * 1000
            
            result = {
                "endpoint": endpoint,
                "description": description,
                "status_code": response.status_code,
                "total_time_ms": total_time,
                "parsing_time_ms": parsing_time,
                "network_time_ms": total_time - parsing_time,
                "data_size_bytes": data_size,
                "data_size_mb": data_size / (1024 * 1024),
                "throughput_mbps": (data_size / (1024 * 1024)) / (total_time / 1000) if total_time > 0 else 0,
                "timestamp": datetime.now().isoformat(),
                "success": response.status_code == 200
            }
            
            # 📊 性能分析
            if total_time > 5000:
                logger.warning(f"🚨 极慢响应: {total_time:.2f}ms")
            elif total_time > 2000:
                logger.warning(f"⚠️ 慢响应: {total_time:.2f}ms")
            else:
                logger.info(f"✅ 正常响应: {total_time:.2f}ms")
            
            logger.info(f"   📦 数据大小: {data_size / 1024:.2f} KB")
            logger.info(f"   🌐 网络耗时: {result['network_time_ms']:.2f}ms")
            logger.info(f"   🔧 解析耗时: {parsing_time:.2f}ms")
            logger.info(f"   📊 吞吐量: {result['throughput_mbps']:.2f} MB/s")
            
            self.results["api_tests"].append(result)
            return result
            
        except Exception as e:
            logger.error(f"❌ 测试失败: {e}")
            error_result = {
                "endpoint": endpoint,
                "description": description,
                "error": str(e),
                "success": False,
                "timestamp": datetime.now().isoformat()
            }
            self.results["api_tests"].append(error_result)
            return error_result
    
    def test_concurrent_load(self, endpoint: str, concurrent_users: int = 5):
        """测试并发负载对性能的影响"""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"🔄 并发测试: {concurrent_users} 用户同时访问 {url}")
        
        def single_request():
            start_time = time.time()
            try:
                response = requests.get(url, timeout=30)
                end_time = time.time()
                return {
                    "success": True,
                    "duration": (end_time - start_time) * 1000,
                    "status_code": response.status_code,
                    "size": len(response.content)
                }
            except Exception as e:
                end_time = time.time()
                return {
                    "success": False,
                    "duration": (end_time - start_time) * 1000,
                    "error": str(e)
                }
        
        # 执行并发测试
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = [executor.submit(single_request) for _ in range(concurrent_users)]
            results = [future.result() for future in as_completed(futures)]
        end_time = time.time()
        
        # 分析结果
        successful_results = [r for r in results if r["success"]]
        failed_results = [r for r in results if not r["success"]]
        
        if successful_results:
            durations = [r["duration"] for r in successful_results]
            concurrent_result = {
                "endpoint": endpoint,
                "concurrent_users": concurrent_users,
                "total_test_time": (end_time - start_time) * 1000,
                "success_count": len(successful_results),
                "failure_count": len(failed_results),
                "average_response_time": sum(durations) / len(durations),
                "min_response_time": min(durations),
                "max_response_time": max(durations),
                "requests_per_second": len(successful_results) / (end_time - start_time),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"📊 并发测试结果:")
            logger.info(f"   成功: {concurrent_result['success_count']}/{concurrent_users}")
            logger.info(f"   平均响应: {concurrent_result['average_response_time']:.2f}ms")
            logger.info(f"   响应范围: {concurrent_result['min_response_time']:.2f}ms - {concurrent_result['max_response_time']:.2f}ms")
            logger.info(f"   QPS: {concurrent_result['requests_per_second']:.2f}")
            
            self.results["concurrent_tests"].append(concurrent_result)
            return concurrent_result
        
        return None
    
    def analyze_system_resources(self):
        """分析系统资源使用情况"""
        logger.info("🖥️ 分析系统资源使用情况")
        
        # CPU使用率
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # 内存使用率
        memory = psutil.virtual_memory()
        
        # 磁盘I/O
        disk_io = psutil.disk_io_counters()
        
        # 网络I/O
        network_io = psutil.net_io_counters()
        
        resource_analysis = {
            "cpu_percent": cpu_percent,
            "memory_total_gb": memory.total / (1024**3),
            "memory_used_gb": memory.used / (1024**3),
            "memory_percent": memory.percent,
            "disk_read_mb": disk_io.read_bytes / (1024**2) if disk_io else 0,
            "disk_write_mb": disk_io.write_bytes / (1024**2) if disk_io else 0,
            "network_sent_mb": network_io.bytes_sent / (1024**2) if network_io else 0,
            "network_recv_mb": network_io.bytes_recv / (1024**2) if network_io else 0,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"💻 CPU使用率: {cpu_percent}%")
        logger.info(f"🧠 内存使用率: {memory.percent}% ({memory.used / (1024**3):.2f}GB / {memory.total / (1024**3):.2f}GB)")
        
        self.results["bottleneck_analysis"]["system_resources"] = resource_analysis
        return resource_analysis
    
    def run_comprehensive_diagnosis(self):
        """运行全面诊断"""
        logger.info("🚀 开始全面性能瓶颈诊断")
        
        # 1. 系统资源分析
        self.analyze_system_resources()
        
        # 2. 核心API性能测试
        core_apis = [
            ("/views-optimized/users/17", "用户信息优化接口"),
            ("/views-optimized/departments", "部门信息优化接口"),
            ("/views-optimized/payroll-component-definitions?is_active=true&size=100", "薪资组件定义接口"),
            ("/simple-payroll/periods?size=50", "薪资周期接口"),
            ("/views-optimized/lookup-values-public?lookup_type_code=GENDER", "Lookup值接口")
        ]
        
        logger.info(f"📋 测试 {len(core_apis)} 个核心API")
        for endpoint, description in core_apis:
            self.test_single_api_detailed(endpoint, description)
            time.sleep(0.5)  # 避免过载
        
        # 3. 并发负载测试（选择最慢的API）
        slowest_api = None
        slowest_time = 0
        for test in self.results["api_tests"]:
            if test.get("success") and test.get("total_time_ms", 0) > slowest_time:
                slowest_time = test["total_time_ms"]
                slowest_api = test["endpoint"]
        
        if slowest_api:
            logger.info(f"🔄 对最慢API进行并发测试: {slowest_api}")
            self.test_concurrent_load(slowest_api, concurrent_users=3)
        
        # 4. 生成诊断建议
        self.generate_bottleneck_recommendations()
        
        # 5. 保存结果
        self.save_results()
        
        logger.info("✅ 性能瓶颈诊断完成")
    
    def generate_bottleneck_recommendations(self):
        """生成瓶颈分析建议"""
        recommendations = []
        
        # 分析API响应时间
        slow_apis = [test for test in self.results["api_tests"] 
                    if test.get("success") and test.get("total_time_ms", 0) > 2000]
        
        if slow_apis:
            recommendations.append(f"发现 {len(slow_apis)} 个慢API（>2秒），需要重点优化")
            
            # 分析数据大小 vs 响应时间
            for api in slow_apis:
                if api.get("data_size_mb", 0) > 1:  # 超过1MB
                    recommendations.append(f"API {api['endpoint']} 返回数据过大（{api['data_size_mb']:.2f}MB），建议分页或数据压缩")
                elif api.get("throughput_mbps", 0) < 1:  # 吞吐量小于1MB/s
                    recommendations.append(f"API {api['endpoint']} 吞吐量过低（{api['throughput_mbps']:.2f}MB/s），可能存在服务器处理瓶颈")
        
        # 分析系统资源
        resources = self.results["bottleneck_analysis"].get("system_resources", {})
        if resources.get("cpu_percent", 0) > 80:
            recommendations.append("CPU使用率过高，可能存在计算密集型操作")
        if resources.get("memory_percent", 0) > 90:
            recommendations.append("内存使用率过高，可能存在内存泄漏或数据缓存过多")
        
        # 分析并发性能
        concurrent_tests = self.results.get("concurrent_tests", [])
        for test in concurrent_tests:
            if test.get("max_response_time", 0) > test.get("average_response_time", 0) * 3:
                recommendations.append(f"并发访问时响应时间波动较大，可能存在资源竞争")
        
        self.results["recommendations"] = recommendations
        
        logger.info("💡 诊断建议:")
        for i, rec in enumerate(recommendations, 1):
            logger.info(f"   {i}. {rec}")
    
    def save_results(self):
        """保存诊断结果"""
        filename = f"performance_bottleneck_diagnosis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"📄 诊断结果已保存到: {filename}")

def main():
    """主函数"""
    diagnoser = PerformanceBottleneckDiagnoser()
    diagnoser.run_comprehensive_diagnosis()

if __name__ == "__main__":
    main() 