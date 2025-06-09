#!/usr/bin/env python3
"""
核心业务视图性能测试脚本
测试所有重要视图的查询性能，识别性能瓶颈
"""
import os
import sys
import time
import json
from datetime import datetime
import asyncio
import traceback
from typing import Dict, List, Any

import psycopg2
from psycopg2.extras import RealDictCursor

# 数据库连接配置
DATABASE_URL = "postgresql+psycopg2://postgres:810705@pg.debian.ziikoo.com:25432/salary_system_v2"
DB_CONFIG = {
    'host': 'pg.debian.ziikoo.com',
    'port': 25432,
    'database': 'salary_system_v2',
    'user': 'postgres',
    'password': '810705'
}

class ViewPerformanceTester:
    """视图性能测试器"""
    
    def __init__(self):
        self.conn = None
        self.results = []
        
    def connect(self):
        """连接数据库"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            print("✅ 数据库连接成功")
        except Exception as e:
            print(f"❌ 数据库连接失败: {e}")
            sys.exit(1)
            
    def disconnect(self):
        """断开数据库连接"""
        if self.conn:
            self.conn.close()
            print("✅ 数据库连接已关闭")
    
    def execute_explain_analyze(self, query: str, test_name: str) -> Dict[str, Any]:
        """执行EXPLAIN ANALYZE查询"""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                start_time = time.time()
                cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query}")
                result_row = cursor.fetchone()
                explain_result = result_row['QUERY PLAN'][0]
                end_time = time.time()
                
                # 提取关键性能指标
                execution_time = explain_result['Execution Time']
                planning_time = explain_result['Planning Time']
                
                result = {
                    'test_name': test_name,
                    'query': query,
                    'execution_time_ms': execution_time,
                    'planning_time_ms': planning_time,
                    'total_time_ms': execution_time + planning_time,
                    'measured_time_ms': (end_time - start_time) * 1000,
                    'explain_output': explain_result,
                    'timestamp': datetime.now().isoformat()
                }
                
                print(f"📊 {test_name}: {execution_time:.2f}ms")
                return result
                
        except Exception as e:
            error_result = {
                'test_name': test_name,
                'query': query,
                'error': str(e),
                'traceback': traceback.format_exc(),
                'timestamp': datetime.now().isoformat()
            }
            print(f"❌ {test_name}: 错误 - {e}")
            return error_result
    
    def test_view_queries(self):
        """测试核心视图查询性能"""
        
        test_queries = [
            # 1. 员工基础信息视图
            {
                'name': '员工基础信息视图(基本查询)',
                'query': 'SELECT * FROM reports.v_employees_basic LIMIT 100;'
            },
            {
                'name': '员工基础信息视图(带过滤)',
                'query': "SELECT * FROM reports.v_employees_basic WHERE department_name = '办公室' LIMIT 50;"
            },
            
            # 2. 薪资条目基础视图
            {
                'name': '薪资条目基础视图(基本查询)',
                'query': 'SELECT * FROM reports.v_payroll_entries_basic LIMIT 100;'
            },
            {
                'name': '薪资条目基础视图(按部门)',
                'query': "SELECT * FROM reports.v_payroll_entries_basic WHERE department_name = '办公室' LIMIT 50;"
            },
            
            # 3. 薪资条目详情视图(包含JSONB)
            {
                'name': '薪资条目详情视图(基本查询)',
                'query': 'SELECT * FROM reports.v_payroll_entries_detailed LIMIT 50;'
            },
            {
                'name': '薪资条目详情视图(带JSONB过滤)',
                'query': "SELECT * FROM reports.v_payroll_entries_detailed WHERE earnings_details ? 'BASIC_SALARY' LIMIT 20;"
            },
            
            # 4. 综合薪资详情视图(最复杂)
            {
                'name': '综合薪资详情视图(小样本)',
                'query': 'SELECT * FROM reports.v_comprehensive_employee_payroll LIMIT 10;'
            },
            {
                'name': '综合薪资详情视图(带条件)',
                'query': "SELECT * FROM reports.v_comprehensive_employee_payroll WHERE \"部门名称\" = '办公室' LIMIT 5;"
            },
            
            # 5. 薪资周期详情视图
            {
                'name': '薪资周期详情视图',
                'query': 'SELECT * FROM reports.v_payroll_periods_detail ORDER BY start_date DESC LIMIT 20;'
            },
            
            # 6. 薪资运行详情视图
            {
                'name': '薪资运行详情视图',
                'query': 'SELECT * FROM reports.v_payroll_runs_detail ORDER BY run_date DESC LIMIT 20;'
            },
            
            # 7. 薪资组件使用情况视图(聚合查询)
            {
                'name': '薪资组件使用情况视图',
                'query': 'SELECT * FROM reports.v_payroll_component_usage ORDER BY usage_count DESC LIMIT 30;'
            },
            
            # 8. 薪资汇总分析视图
            {
                'name': '薪资汇总分析视图',
                'query': 'SELECT * FROM reports.v_payroll_summary_analysis ORDER BY start_date DESC LIMIT 20;'
            },
            
            # 9. 员工薪资历史视图
            {
                'name': '员工薪资历史视图',
                'query': 'SELECT * FROM reports.v_employee_salary_history WHERE period_rank <= 3 LIMIT 50;'
            },
            
            # 10. 审计概览视图
            {
                'name': '审计概览视图',
                'query': 'SELECT * FROM payroll.audit_overview ORDER BY payroll_run_id DESC LIMIT 20;'
            },
            
            # 11. 审计异常详情视图
            {
                'name': '审计异常详情视图',
                'query': 'SELECT * FROM payroll.audit_anomalies_detail WHERE severity = \'ERROR\' LIMIT 20;'
            },
            
            # 12. 测试复杂聚合查询
            {
                'name': '员工部门薪资统计(复杂聚合)',
                'query': '''
                SELECT 
                    department_name,
                    COUNT(*) as employee_count,
                    AVG(gross_pay) as avg_gross_pay,
                    SUM(gross_pay) as total_gross_pay
                FROM reports.v_payroll_entries_basic 
                GROUP BY department_name 
                ORDER BY total_gross_pay DESC;
                '''
            },
            
            # 13. 测试JSONB查询性能
            {
                'name': 'JSONB字段查询性能测试',
                'query': '''
                SELECT 
                    employee_code,
                    earnings_details->'BASIC_SALARY'->>'amount' as basic_salary,
                    deductions_details->'PERSONAL_INCOME_TAX'->>'amount' as tax
                FROM reports.v_payroll_entries_detailed 
                WHERE earnings_details ? 'BASIC_SALARY' 
                LIMIT 100;
                '''
            },
            
            # 14. 测试递归CTE性能
            {
                'name': '递归CTE性能测试(人员层次)',
                'query': '''
                WITH RECURSIVE category_tree AS (
                    SELECT id, name, parent_category_id, 0 as level
                    FROM hr.personnel_categories 
                    WHERE parent_category_id IS NULL
                    
                    UNION ALL
                    
                    SELECT pc.id, pc.name, pc.parent_category_id, ct.level + 1
                    FROM hr.personnel_categories pc
                    INNER JOIN category_tree ct ON pc.parent_category_id = ct.id
                )
                SELECT * FROM category_tree ORDER BY level, name;
                '''
            }
        ]
        
        print("🚀 开始执行视图性能测试...")
        print("="*80)
        
        for i, test in enumerate(test_queries, 1):
            print(f"\n{i:2d}. 测试: {test['name']}")
            result = self.execute_explain_analyze(test['query'], test['name'])
            self.results.append(result)
            
            # 短暂停顿，避免对数据库造成过大压力
            time.sleep(0.1)
        
        print("\n" + "="*80)
        print("✅ 性能测试完成!")
        
    def analyze_results(self):
        """分析测试结果"""
        print("\n📈 性能分析报告")
        print("="*80)
        
        # 按执行时间排序
        valid_results = [r for r in self.results if 'execution_time_ms' in r]
        sorted_results = sorted(valid_results, key=lambda x: x['execution_time_ms'], reverse=True)
        
        # 统计信息
        execution_times = [r['execution_time_ms'] for r in valid_results]
        if execution_times:
            avg_time = sum(execution_times) / len(execution_times)
            max_time = max(execution_times)
            min_time = min(execution_times)
            
            print(f"📊 测试统计:")
            print(f"   - 总测试数: {len(self.results)}")
            print(f"   - 成功测试: {len(valid_results)}")
            print(f"   - 失败测试: {len(self.results) - len(valid_results)}")
            print(f"   - 平均执行时间: {avg_time:.2f}ms")
            print(f"   - 最长执行时间: {max_time:.2f}ms")
            print(f"   - 最短执行时间: {min_time:.2f}ms")
        
        # 性能问题识别
        print(f"\n⚠️  性能关注点 (执行时间 > 100ms):")
        slow_queries = [r for r in valid_results if r['execution_time_ms'] > 100]
        
        if slow_queries:
            for result in slow_queries:
                print(f"   - {result['test_name']}: {result['execution_time_ms']:.2f}ms")
        else:
            print("   - 暂无明显性能问题")
        
        # Top 5 最慢查询
        print(f"\n🐌 执行时间最长的5个查询:")
        for i, result in enumerate(sorted_results[:5], 1):
            print(f"   {i}. {result['test_name']}: {result['execution_time_ms']:.2f}ms")
        
        # 错误报告
        error_results = [r for r in self.results if 'error' in r]
        if error_results:
            print(f"\n❌ 错误查询:")
            for result in error_results:
                print(f"   - {result['test_name']}: {result['error']}")
    
    def save_results(self, filename: str = None):
        """保存测试结果到JSON文件"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"view_performance_test_results_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n💾 测试结果已保存到: {filename}")
        return filename
    
    def run_full_test(self):
        """运行完整的性能测试"""
        try:
            self.connect()
            self.test_view_queries()
            self.analyze_results()
            filename = self.save_results()
            return filename
        finally:
            self.disconnect()

def main():
    """主函数"""
    print("🔍 核心业务视图性能测试")
    print("="*80)
    
    tester = ViewPerformanceTester()
    result_file = tester.run_full_test()
    
    print(f"\n🎯 建议下一步:")
    print(f"   1. 查看详细结果: cat {result_file}")
    print(f"   2. 分析慢查询的执行计划")
    print(f"   3. 考虑创建物化视图优化性能")
    print(f"   4. 优化JSONB字段查询")

if __name__ == "__main__":
    main() 