#!/usr/bin/env python3
"""
优化 v_comprehensive_employee_payroll 视图性能
解决递归CTE、多层JOIN和JSONB字段展开的性能问题
"""
import os
import sys
import time
import json
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# 数据库连接配置
DB_CONFIG = {
    'host': 'pg.debian.ziikoo.com',
    'port': 25432,
    'database': 'salary_system_v2',
    'user': 'postgres',
    'password': '810705'
}

class ComprehensivePayrollViewOptimizer:
    """综合薪资视图优化器"""
    
    def __init__(self):
        self.conn = None
        self.performance_results = {}
        
    def connect(self):
        """连接数据库"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.conn.autocommit = True
            print("✅ 数据库连接成功")
        except Exception as e:
            print(f"❌ 数据库连接失败: {e}")
            sys.exit(1)
            
    def disconnect(self):
        """断开数据库连接"""
        if self.conn:
            self.conn.close()
            print("✅ 数据库连接已关闭")
    
    def analyze_current_performance(self):
        """分析当前视图性能"""
        print("\n🔍 分析当前视图性能...")
        
        # 1. 基础性能测试
        queries = [
            {
                'name': '小样本查询(10行)',
                'sql': 'SELECT * FROM reports.v_comprehensive_employee_payroll LIMIT 10;'
            },
            {
                'name': '中等样本查询(50行)', 
                'sql': 'SELECT * FROM reports.v_comprehensive_employee_payroll LIMIT 50;'
            },
            {
                'name': '部门过滤查询',
                'sql': 'SELECT * FROM reports.v_comprehensive_employee_payroll WHERE "部门名称" = \'办公室\' LIMIT 20;'
            },
            {
                'name': '薪资范围查询',
                'sql': 'SELECT * FROM reports.v_comprehensive_employee_payroll WHERE "应发合计" > 5000 LIMIT 30;'
            }
        ]
        
        for query in queries:
            print(f"  📊 测试: {query['name']}")
            
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                start_time = time.time()
                cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query['sql']}")
                result = cursor.fetchone()
                end_time = time.time()
                
                explain_data = result['QUERY PLAN'][0]
                execution_time = explain_data['Execution Time']
                planning_time = explain_data['Planning Time']
                
                self.performance_results[query['name']] = {
                    'execution_time_ms': execution_time,
                    'planning_time_ms': planning_time,
                    'total_time_ms': execution_time + planning_time,
                    'measured_time_ms': (end_time - start_time) * 1000
                }
                
                print(f"    ⏱️  执行时间: {execution_time:.2f}ms")
                print(f"    📋 规划时间: {planning_time:.2f}ms")
                print(f"    🎯 总耗时: {execution_time + planning_time:.2f}ms")
        
        return self.performance_results
    
    def identify_bottlenecks(self):
        """识别性能瓶颈"""
        print("\n🔬 识别性能瓶颈...")
        
        # 分析递归CTE性能
        print("  🔄 分析递归CTE性能...")
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
            EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
            WITH RECURSIVE category_tree AS (
                SELECT id, name, parent_category_id, 0 as level
                FROM hr.personnel_categories 
                WHERE parent_category_id IS NULL
                UNION ALL
                SELECT pc.id, pc.name, pc.parent_category_id, ct.level + 1
                FROM hr.personnel_categories pc
                INNER JOIN category_tree ct ON pc.parent_category_id = ct.id
            )
            SELECT * FROM category_tree;
            """)
            
            result = cursor.fetchone()
            cte_time = result['QUERY PLAN'][0]['Execution Time']
            print(f"    🔄 递归CTE执行时间: {cte_time:.2f}ms")
        
        # 分析JSONB字段性能
        print("  📦 分析JSONB字段展开性能...")
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
            EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
            SELECT 
                pe.id,
                (pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric as basic_salary,
                (pe.deductions_details->'PERSONAL_INCOME_TAX'->>'amount')::numeric as tax
            FROM payroll.payroll_entries pe 
            LIMIT 100;
            """)
            
            result = cursor.fetchone()
            jsonb_time = result['QUERY PLAN'][0]['Execution Time']
            print(f"    📦 JSONB字段提取时间: {jsonb_time:.2f}ms")
        
        # 分析JOIN性能
        print("  🔗 分析多表JOIN性能...")
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
            EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
            SELECT pe.id, e.employee_code, d.name as dept, pos.name as position
            FROM payroll.payroll_entries pe
            LEFT JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
            LIMIT 100;
            """)
            
            result = cursor.fetchone()
            join_time = result['QUERY PLAN'][0]['Execution Time']
            print(f"    🔗 多表JOIN时间: {join_time:.2f}ms")
        
        return {
            'cte_time': cte_time,
            'jsonb_time': jsonb_time,
            'join_time': join_time
        }
    
    def get_dynamic_payroll_components(self):
        """获取动态薪资组件列表"""
        print("  📋 获取动态薪资组件...")
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
            SELECT code, name, type, display_order
            FROM config.payroll_component_definitions 
            WHERE is_active = true 
            ORDER BY 
                CASE type 
                    WHEN 'EARNING' THEN 1 
                    WHEN 'DEDUCTION' THEN 2 
                    WHEN 'PERSONAL_DEDUCTION' THEN 3 
                    WHEN 'EMPLOYER_DEDUCTION' THEN 4 
                    ELSE 5 
                END,
                display_order, name;
            """)
            
            components = cursor.fetchall()
            
            earnings = [c for c in components if c['type'] == 'EARNING']
            deductions = [c for c in components if c['type'] in ('DEDUCTION', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION')]
            
            print(f"    💰 应发项目: {len(earnings)} 个")
            print(f"    💸 扣除项目: {len(deductions)} 个")
            
            return {
                'earnings': earnings,
                'deductions': deductions,
                'all_components': components
            }

    def create_optimized_view(self):
        """创建优化版本的视图"""
        print("\n🚀 创建优化版本视图...")
        
        components = self.get_dynamic_payroll_components()
        
        # 1. 创建简化的人员层次视图
        self._create_personnel_hierarchy_helper()
        
        # 2. 生成动态字段SQL
        earnings_fields = self._generate_earnings_fields(components['earnings'])
        deductions_fields = self._generate_deductions_fields(components['deductions'])
        
        # 3. 创建优化的主视图
        optimized_view_sql = f"""
        CREATE OR REPLACE VIEW reports.v_comprehensive_employee_payroll_optimized AS
        SELECT 
            -- 基本标识信息
            pe.id as "薪资条目ID",
            pe.employee_id as "员工ID",
            pe.payroll_period_id as "薪资期间ID",
            pe.payroll_run_id as "薪资运行ID",
            
            -- 员工基本信息  
            e.employee_code as "员工编号",
            e.first_name as "名",
            e.last_name as "姓",
            COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '未知姓名') as "姓名",
            e.id_number as "身份证号",
            e.phone_number as "电话",
            e.email as "邮箱",
            e.hire_date as "入职日期",
            COALESCE(e.is_active, false) as "员工状态",
            
            -- 组织架构信息
            COALESCE(d.name, '未分配部门') as "部门名称",
            COALESCE(pos.name, '未分配职位') as "职位名称",
            COALESCE(pc.name, '未分类') as "人员类别",
            COALESCE(ph.root_name, '未分类') as "根人员类别",
            
            -- 薪资期间信息
            COALESCE(pp.name, '未知期间') as "薪资期间名称",
            pp.start_date as "薪资期间开始日期",
            pp.end_date as "薪资期间结束日期", 
            pp.pay_date as "薪资发放日期",
            pr.run_date as "薪资运行日期",
            
            -- 薪资汇总信息
            COALESCE(pe.gross_pay, 0.00) as "应发合计",
            COALESCE(pe.total_deductions, 0.00) as "扣除合计",
            COALESCE(pe.net_pay, 0.00) as "实发合计",
            
            -- 动态应发字段
            {earnings_fields},
            
            -- 动态扣除字段
            {deductions_fields},
            
            -- 系统字段
            COALESCE(pe.status_lookup_value_id, 1) as "状态ID",
            COALESCE(pe.remarks, '') as "备注",
            pe.audit_status as "审计状态",
            pe.audit_timestamp as "审计时间",
            pe.auditor_id as "审计员ID",
            pe.audit_notes as "审计备注",
            pe.version as "版本号",
            COALESCE(pe.calculated_at, pe.updated_at, NOW()) as "计算时间",
            pe.updated_at as "更新时间",
            
            -- 原始数据保留
            pe.earnings_details as "原始应发明细",
            pe.deductions_details as "原始扣除明细",
            pe.calculation_inputs as "原始计算输入",
            pe.calculation_log as "原始计算日志"
        
        FROM payroll.payroll_entries pe
        LEFT JOIN hr.employees e ON pe.employee_id = e.id
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id  
        LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
        LEFT JOIN reports.v_personnel_hierarchy_simple ph ON pc.id = ph.category_id
        LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
        LEFT JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id;
        """
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(optimized_view_sql)
            print("  ✅ 优化视图创建成功")
            return True
        except Exception as e:
            print(f"  ❌ 优化视图创建失败: {e}")
            return False
    
    def _create_personnel_hierarchy_helper(self):
        """创建简化的人员层次辅助视图"""
        helper_view_sql = """
        CREATE OR REPLACE VIEW reports.v_personnel_hierarchy_simple AS
        WITH RECURSIVE category_tree AS (
            SELECT 
                id,
                name,
                parent_category_id,
                id as root_id,
                name as root_name,
                0 as level
            FROM hr.personnel_categories 
            WHERE parent_category_id IS NULL
            
            UNION ALL
            
            SELECT 
                pc.id,
                pc.name,
                pc.parent_category_id,
                ct.root_id,
                ct.root_name,
                ct.level + 1
            FROM hr.personnel_categories pc
            INNER JOIN category_tree ct ON pc.parent_category_id = ct.id
        )
        SELECT 
            id as category_id,
            root_id,
            root_name,
            level
        FROM category_tree;
        """
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(helper_view_sql)
        print("  ✅ 人员层次辅助视图创建成功")
    
    def _generate_earnings_fields(self, earnings):
        """生成应发字段SQL"""
        fields = []
        for component in earnings:
            # 转义字段名中的双引号
            safe_name = component['name'].replace('"', '""')
            field_sql = f"""COALESCE(((pe.earnings_details->'{component['code']}'->>'amount')::numeric), 0.00) as "{safe_name}\""""
            fields.append(field_sql)
        return ',\n            '.join(fields)
    
    def _generate_deductions_fields(self, deductions):
        """生成扣除字段SQL""" 
        fields = []
        for component in deductions:
            # 转义字段名中的双引号
            safe_name = component['name'].replace('"', '""')
            field_sql = f"""COALESCE(((pe.deductions_details->'{component['code']}'->>'amount')::numeric), 0.00) as "{safe_name}\""""
            fields.append(field_sql)
        return ',\n            '.join(fields)
    
    def compare_performance(self):
        """对比优化前后的性能"""
        print("\n📊 性能对比测试...")
        
        test_queries = [
            {
                'name': '小样本查询对比',
                'original': 'SELECT * FROM reports.v_comprehensive_employee_payroll LIMIT 10;',
                'optimized': 'SELECT * FROM reports.v_comprehensive_employee_payroll_optimized LIMIT 10;'
            },
            {
                'name': '中等样本查询对比',
                'original': 'SELECT * FROM reports.v_comprehensive_employee_payroll LIMIT 50;',
                'optimized': 'SELECT * FROM reports.v_comprehensive_employee_payroll_optimized LIMIT 50;'
            },
            {
                'name': '部门过滤查询对比',
                'original': 'SELECT * FROM reports.v_comprehensive_employee_payroll WHERE "部门名称" = \'办公室\' LIMIT 20;',
                'optimized': 'SELECT * FROM reports.v_comprehensive_employee_payroll_optimized WHERE "部门名称" = \'办公室\' LIMIT 20;'
            }
        ]
        
        comparison_results = {}
        
        for test in test_queries:
            print(f"\n  🔬 {test['name']}")
            
            # 测试原始视图
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {test['original']}")
                result = cursor.fetchone()
                original_stats = result['QUERY PLAN'][0]
                
                original_time = original_stats['Execution Time'] + original_stats['Planning Time']
                print(f"    📊 原始视图: {original_time:.2f}ms")
            
            # 测试优化视图
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {test['optimized']}")
                result = cursor.fetchone()
                optimized_stats = result['QUERY PLAN'][0]
                
                optimized_time = optimized_stats['Execution Time'] + optimized_stats['Planning Time']
                print(f"    🚀 优化视图: {optimized_time:.2f}ms")
            
            # 计算改进情况
            improvement = ((original_time - optimized_time) / original_time) * 100
            comparison_results[test['name']] = {
                'original_time': original_time,
                'optimized_time': optimized_time,
                'improvement_percent': improvement
            }
            
            if improvement > 0:
                print(f"    ✅ 性能提升: {improvement:.1f}%")
            else:
                print(f"    ⚠️  性能下降: {abs(improvement):.1f}%")
        
        return comparison_results
    
    def generate_optimization_report(self, performance_results, bottleneck_analysis, comparison_results):
        """生成优化报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"comprehensive_payroll_view_optimization_report_{timestamp}.json"
        
        report = {
            'timestamp': timestamp,
            'optimization_summary': {
                'original_view_performance': performance_results,
                'bottleneck_analysis': bottleneck_analysis,
                'performance_comparison': comparison_results
            },
            'optimization_techniques': [
                '分离递归CTE到独立辅助视图',
                '减少多层嵌套JOIN',
                '优化JSONB字段访问',
                '添加COALESCE防止NULL值',
                '使用索引友好的JOIN顺序'
            ],
            'recommendations': [
                '考虑为高频查询创建物化视图',
                '定期VACUUM ANALYZE相关表',
                '监控查询计划变化',
                '根据业务需求调整视图字段'
            ]
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n📋 优化报告已保存: {report_file}")
        return report_file

def main():
    """主函数"""
    print("🚀 开始优化 v_comprehensive_employee_payroll 视图")
    print("=" * 60)
    
    optimizer = ComprehensivePayrollViewOptimizer()
    
    try:
        # 1. 连接数据库
        optimizer.connect()
        
        # 2. 分析当前性能
        print("\n📊 Phase 1: 性能分析")
        performance_results = optimizer.analyze_current_performance()
        
        # 3. 识别瓶颈
        print("\n🔍 Phase 2: 瓶颈识别")
        bottleneck_analysis = optimizer.identify_bottlenecks()
        
        # 4. 创建优化视图
        print("\n🛠️  Phase 3: 创建优化视图")
        if optimizer.create_optimized_view():
            # 5. 性能对比
            print("\n⚖️  Phase 4: 性能对比")
            comparison_results = optimizer.compare_performance()
            
            # 6. 生成报告
            print("\n📄 Phase 5: 生成报告")
            report_file = optimizer.generate_optimization_report(
                performance_results, 
                bottleneck_analysis, 
                comparison_results
            )
            
            # 7. 总结
            print("\n🎉 优化完成总结:")
            print("  ✅ 创建了优化版本视图: reports.v_comprehensive_employee_payroll_optimized")
            print("  ✅ 创建了辅助视图: reports.v_personnel_hierarchy_simple")
            print(f"  ✅ 生成了优化报告: {report_file}")
            
            avg_improvement = sum(r['improvement_percent'] for r in comparison_results.values()) / len(comparison_results)
            if avg_improvement > 0:
                print(f"  🚀 平均性能提升: {avg_improvement:.1f}%")
            else:
                print(f"  ⚠️  平均性能变化: {avg_improvement:.1f}%")
        else:
            print("❌ 优化视图创建失败，请检查错误信息")
            
    except Exception as e:
        print(f"❌ 优化过程出错: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        optimizer.disconnect()

if __name__ == "__main__":
    main() 