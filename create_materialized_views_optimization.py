#!/usr/bin/env python3
"""
创建物化视图优化脚本
重点优化薪资组件使用统计视图的性能
"""
import os
import sys
import time
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

class MaterializedViewOptimizer:
    """物化视图优化器"""
    
    def __init__(self):
        self.conn = None
        
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
    
    def create_payroll_component_usage_materialized_view(self):
        """创建薪资组件使用统计物化视图"""
        
        print("\n🏗️ 创建薪资组件使用统计物化视图...")
        
        # 1. 删除已存在的物化视图
        drop_sql = """
        DROP MATERIALIZED VIEW IF EXISTS reports.mv_payroll_component_usage_stats;
        """
        
        # 2. 创建优化的物化视图
        create_sql = """
        CREATE MATERIALIZED VIEW reports.mv_payroll_component_usage_stats AS
        WITH component_usage AS (
            -- 应发项目统计
            SELECT 
                pcd.code,
                pcd.name,
                pcd.type AS component_type,
                pcd.display_order,
                pcd.is_active,
                COUNT(DISTINCT pe.id) as usage_count,
                COUNT(DISTINCT pe.employee_id) as employee_count,
                AVG((pe.earnings_details->pcd.code->>'amount')::numeric) as avg_amount,
                SUM((pe.earnings_details->pcd.code->>'amount')::numeric) as total_amount,
                MIN((pe.earnings_details->pcd.code->>'amount')::numeric) as min_amount,
                MAX((pe.earnings_details->pcd.code->>'amount')::numeric) as max_amount,
                COUNT(CASE WHEN (pe.earnings_details->pcd.code->>'amount')::numeric > 0 THEN 1 END) as positive_count
            FROM config.payroll_component_definitions pcd
            LEFT JOIN payroll.payroll_entries pe ON (
                pcd.type = 'EARNING' 
                AND pe.earnings_details ? pcd.code
                AND (pe.earnings_details->pcd.code->>'amount')::numeric != 0
            )
            WHERE pcd.is_active = true AND pcd.type = 'EARNING'
            GROUP BY pcd.code, pcd.name, pcd.type, pcd.display_order, pcd.is_active
            
            UNION ALL
            
            -- 扣除项目统计  
            SELECT 
                pcd.code,
                pcd.name,
                pcd.type AS component_type,
                pcd.display_order,
                pcd.is_active,
                COUNT(DISTINCT pe.id) as usage_count,
                COUNT(DISTINCT pe.employee_id) as employee_count,
                AVG((pe.deductions_details->pcd.code->>'amount')::numeric) as avg_amount,
                SUM((pe.deductions_details->pcd.code->>'amount')::numeric) as total_amount,
                MIN((pe.deductions_details->pcd.code->>'amount')::numeric) as min_amount,
                MAX((pe.deductions_details->pcd.code->>'amount')::numeric) as max_amount,
                COUNT(CASE WHEN (pe.deductions_details->pcd.code->>'amount')::numeric > 0 THEN 1 END) as positive_count
            FROM config.payroll_component_definitions pcd
            LEFT JOIN payroll.payroll_entries pe ON (
                pcd.type IN ('DEDUCTION', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION')
                AND pe.deductions_details ? pcd.code
                AND (pe.deductions_details->pcd.code->>'amount')::numeric != 0
            )
            WHERE pcd.is_active = true 
            AND pcd.type IN ('DEDUCTION', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION')
            GROUP BY pcd.code, pcd.name, pcd.type, pcd.display_order, pcd.is_active
        )
        SELECT 
            code,
            name,
            component_type,
            display_order,
            is_active,
            COALESCE(usage_count, 0) as usage_count,
            COALESCE(employee_count, 0) as employee_count,
            COALESCE(avg_amount, 0.00) as avg_amount,
            COALESCE(total_amount, 0.00) as total_amount,
            COALESCE(min_amount, 0.00) as min_amount,
            COALESCE(max_amount, 0.00) as max_amount,
            COALESCE(positive_count, 0) as positive_count,
            ROUND(
                CASE 
                    WHEN usage_count > 0 THEN (positive_count::decimal / usage_count) * 100 
                    ELSE 0 
                END, 2
            ) as usage_rate_percent,
            NOW() as last_updated
        FROM component_usage
        ORDER BY usage_count DESC, component_type, display_order;
        """
        
        # 3. 创建索引
        index_sql = """
        -- 主查询索引
        CREATE INDEX idx_mv_payroll_component_usage_stats_usage_count 
        ON reports.mv_payroll_component_usage_stats (usage_count DESC);
        
        CREATE INDEX idx_mv_payroll_component_usage_stats_component_type 
        ON reports.mv_payroll_component_usage_stats (component_type);
        
        CREATE INDEX idx_mv_payroll_component_usage_stats_code 
        ON reports.mv_payroll_component_usage_stats (code);
        
        -- 复合索引
        CREATE INDEX idx_mv_payroll_component_usage_stats_type_usage 
        ON reports.mv_payroll_component_usage_stats (component_type, usage_count DESC);
        """
        
        try:
            with self.conn.cursor() as cursor:
                # 删除旧视图
                cursor.execute(drop_sql)
                print("  ✅ 已删除旧的物化视图")
                
                # 创建新物化视图
                start_time = time.time()
                cursor.execute(create_sql)
                creation_time = time.time() - start_time
                print(f"  ✅ 物化视图创建完成 ({creation_time:.2f}秒)")
                
                # 创建索引
                cursor.execute(index_sql)
                print("  ✅ 索引创建完成")
                
                # 获取统计信息
                cursor.execute("SELECT COUNT(*) FROM reports.mv_payroll_component_usage_stats;")
                row_count = cursor.fetchone()[0]
                print(f"  📊 物化视图包含 {row_count} 行数据")
                
                return True
                
        except Exception as e:
            print(f"  ❌ 创建物化视图失败: {e}")
            return False
    
    def create_personnel_hierarchy_materialized_view(self):
        """创建人员层次结构物化视图"""
        
        print("\n🏗️ 创建人员层次结构物化视图...")
        
        drop_sql = """
        DROP MATERIALIZED VIEW IF EXISTS reports.mv_personnel_hierarchy;
        """
        
        create_sql = """
        CREATE MATERIALIZED VIEW reports.mv_personnel_hierarchy AS
        WITH RECURSIVE category_tree AS (
            -- 基础查询：顶级分类
            SELECT 
                id,
                name,
                parent_category_id,
                id as root_id,
                name as root_name,
                0 as level,
                ARRAY[id] as path,
                name as full_path
            FROM hr.personnel_categories 
            WHERE parent_category_id IS NULL
            
            UNION ALL
            
            -- 递归查询：子分类
            SELECT 
                pc.id,
                pc.name,
                pc.parent_category_id,
                ct.root_id,
                ct.root_name,
                ct.level + 1,
                ct.path || pc.id,
                ct.full_path || ' > ' || pc.name
            FROM hr.personnel_categories pc
            INNER JOIN category_tree ct ON pc.parent_category_id = ct.id
        )
        SELECT 
            id as category_id,
            name as category_name,
            parent_category_id,
            root_id,
            root_name,
            level,
            path,
            full_path,
            -- 员工统计
            (SELECT COUNT(*) FROM hr.employees e WHERE e.personnel_category_id = id) as employee_count,
            NOW() as last_updated
        FROM category_tree
        ORDER BY level, root_name, name;
        """
        
        index_sql = """
        CREATE INDEX idx_mv_personnel_hierarchy_category_id 
        ON reports.mv_personnel_hierarchy (category_id);
        
        CREATE INDEX idx_mv_personnel_hierarchy_root_id 
        ON reports.mv_personnel_hierarchy (root_id);
        
        CREATE INDEX idx_mv_personnel_hierarchy_level 
        ON reports.mv_personnel_hierarchy (level);
        """
        
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(drop_sql)
                print("  ✅ 已删除旧的物化视图")
                
                start_time = time.time()
                cursor.execute(create_sql)
                creation_time = time.time() - start_time
                print(f"  ✅ 物化视图创建完成 ({creation_time:.2f}秒)")
                
                cursor.execute(index_sql)
                print("  ✅ 索引创建完成")
                
                cursor.execute("SELECT COUNT(*) FROM reports.mv_personnel_hierarchy;")
                row_count = cursor.fetchone()[0]
                print(f"  📊 物化视图包含 {row_count} 行数据")
                
                return True
                
        except Exception as e:
            print(f"  ❌ 创建物化视图失败: {e}")
            return False
    
    def create_refresh_functions(self):
        """创建刷新函数和调度任务"""
        
        print("\n🔄 创建物化视图刷新函数...")
        
        refresh_function_sql = """
        -- 创建刷新函数
        CREATE OR REPLACE FUNCTION reports.refresh_materialized_views()
        RETURNS TABLE(view_name text, refresh_time interval, row_count bigint) 
        LANGUAGE plpgsql
        AS $$
        DECLARE
            start_time timestamp;
            end_time timestamp;
            rows_count bigint;
        BEGIN
            -- 刷新薪资组件使用统计
            start_time := clock_timestamp();
            REFRESH MATERIALIZED VIEW CONCURRENTLY reports.mv_payroll_component_usage_stats;
            end_time := clock_timestamp();
            GET DIAGNOSTICS rows_count = ROW_COUNT;
            SELECT COUNT(*) INTO rows_count FROM reports.mv_payroll_component_usage_stats;
            
            RETURN QUERY SELECT 
                'mv_payroll_component_usage_stats'::text,
                end_time - start_time,
                rows_count;
            
            -- 刷新人员层次结构
            start_time := clock_timestamp();
            REFRESH MATERIALIZED VIEW CONCURRENTLY reports.mv_personnel_hierarchy;
            end_time := clock_timestamp();
            SELECT COUNT(*) INTO rows_count FROM reports.mv_personnel_hierarchy;
            
            RETURN QUERY SELECT 
                'mv_personnel_hierarchy'::text,
                end_time - start_time,
                rows_count;
                
        END;
        $$;
        
        -- 创建快速刷新函数(仅统计数据)
        CREATE OR REPLACE FUNCTION reports.quick_refresh_component_usage()
        RETURNS void
        LANGUAGE plpgsql
        AS $$
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY reports.mv_payroll_component_usage_stats;
        END;
        $$;
        """
        
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(refresh_function_sql)
                print("  ✅ 刷新函数创建完成")
                return True
                
        except Exception as e:
            print(f"  ❌ 创建刷新函数失败: {e}")
            return False
    
    def performance_test_comparison(self):
        """性能对比测试"""
        
        print("\n📊 性能对比测试...")
        
        # 测试原始视图
        print("  🔍 测试原始视图性能...")
        start_time = time.time()
        
        with self.conn.cursor() as cursor:
            cursor.execute("EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM reports.v_payroll_component_usage ORDER BY usage_count DESC LIMIT 30;")
            original_result = cursor.fetchall()
            
        original_time = time.time() - start_time
        
        # 提取执行时间
        original_execution_time = None
        for row in original_result:
            if 'Execution Time:' in row[0]:
                original_execution_time = float(row[0].split('Execution Time: ')[1].split(' ms')[0])
                break
        
        # 测试物化视图
        print("  🚀 测试物化视图性能...")
        start_time = time.time()
        
        with self.conn.cursor() as cursor:
            cursor.execute("EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM reports.mv_payroll_component_usage_stats ORDER BY usage_count DESC LIMIT 30;")
            materialized_result = cursor.fetchall()
            
        materialized_time = time.time() - start_time
        
        # 提取执行时间
        materialized_execution_time = None
        for row in materialized_result:
            if 'Execution Time:' in row[0]:
                materialized_execution_time = float(row[0].split('Execution Time: ')[1].split(' ms')[0])
                break
        
        # 性能对比
        if original_execution_time and materialized_execution_time:
            improvement = ((original_execution_time - materialized_execution_time) / original_execution_time) * 100
            
            print(f"\n🎯 性能对比结果:")
            print(f"  📈 原始视图执行时间: {original_execution_time:.2f}ms")
            print(f"  ⚡ 物化视图执行时间: {materialized_execution_time:.2f}ms")
            print(f"  🚀 性能提升: {improvement:.1f}%")
            
            if improvement > 50:
                print(f"  ✅ 优化效果显著！")
            elif improvement > 20:
                print(f"  👍 优化效果良好")
            else:
                print(f"  ⚠️ 优化效果有限")
        else:
            print(f"  ⚠️ 无法提取准确的执行时间")
    
    def run_optimization(self):
        """运行完整的优化流程"""
        try:
            self.connect()
            
            print("🚀 开始物化视图优化流程...")
            print("="*80)
            
            # 1. 创建薪资组件使用统计物化视图
            success1 = self.create_payroll_component_usage_materialized_view()
            
            # 2. 创建人员层次结构物化视图
            success2 = self.create_personnel_hierarchy_materialized_view()
            
            # 3. 创建刷新函数
            success3 = self.create_refresh_functions()
            
            # 4. 性能对比测试
            if success1:
                self.performance_test_comparison()
            
            print("\n" + "="*80)
            if success1 and success2 and success3:
                print("✅ 物化视图优化完成！")
                print("\n💡 使用建议:")
                print("  1. 使用 reports.mv_payroll_component_usage_stats 替代原始视图")
                print("  2. 使用 reports.mv_personnel_hierarchy 优化人员层次查询")
                print("  3. 定期执行 SELECT * FROM reports.refresh_materialized_views(); 刷新数据")
                print("  4. 在薪资数据变更后调用 SELECT reports.quick_refresh_component_usage();")
            else:
                print("❌ 优化过程中出现错误，请检查日志")
                
        finally:
            self.disconnect()

def main():
    """主函数"""
    print("🏗️ 薪资系统物化视图优化")
    print("="*80)
    
    optimizer = MaterializedViewOptimizer()
    optimizer.run_optimization()

if __name__ == "__main__":
    main() 