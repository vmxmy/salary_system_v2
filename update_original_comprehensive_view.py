#!/usr/bin/env python3
"""
更新原始 v_comprehensive_employee_payroll 视图
将所有 payroll_component_definitions 中的字段动态生成到视图中
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

class ComprehensiveViewUpdater:
    """原始综合薪资视图更新器"""
    
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
    
    def get_all_payroll_components(self):
        """获取所有活跃的薪资组件"""
        print("📋 获取所有活跃薪资组件...")
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
            SELECT 
                code, 
                name, 
                type, 
                display_order
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
                display_order, 
                name;
            """)
            
            components = cursor.fetchall()
            
            # 按类型分组
            earnings = [c for c in components if c['type'] == 'EARNING']
            deductions = [c for c in components if c['type'] in ('DEDUCTION', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION')]
            
            # 获取计算输入字段（从实际数据中）
            calculation_inputs = self._get_calculation_input_components()
            
            print(f"  💰 应发项目: {len(earnings)} 个")
            print(f"  💸 扣除项目: {len(deductions)} 个") 
            print(f"  📊 计算输入: {len(calculation_inputs)} 个")
            print(f"  📋 总计: {len(components) + len(calculation_inputs)} 个组件")
            
            return {
                'earnings': earnings,
                'deductions': deductions,
                'calculation_inputs': calculation_inputs,
                'all_components': components
            }
    
    def _get_calculation_input_components(self):
        """从实际数据中获取计算输入字段"""
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
            SELECT DISTINCT jsonb_object_keys(calculation_inputs) as code
            FROM payroll.payroll_entries 
            WHERE calculation_inputs IS NOT NULL 
            AND calculation_inputs != '{}' 
            AND jsonb_typeof(calculation_inputs) = 'object'
            ORDER BY jsonb_object_keys(calculation_inputs);
            """)
            
            codes = [row['code'] for row in cursor.fetchall()]
            
            # 创建伪组件对象，用于统一处理
            calculation_components = []
            for code in codes:
                # 基于code生成中文名称
                name = self._generate_chinese_name(code)
                calculation_components.append({
                    'code': code,
                    'name': name,
                    'type': 'CALCULATION_INPUT'
                })
            
            return calculation_components
    
    def _generate_chinese_name(self, code):
        """根据code生成中文名称"""
        name_mapping = {
            'MEDICAL_INS_BASE': '医疗保险缴费基数',
            'MEDICAL_INS_BASE_SALARY': '医疗保险缴费工资',
            'MEDICAL_INS_PAY_SALARY': '医疗保险缴费工资2',
            'OCCUPATIONAL_PENSION_BASE': '职业年金缴费基数',
            'OCCUPATIONAL_PENSION_PAY_SALARY': '职业年金缴费工资',
            'PENSION_BASE': '养老缴费基数',
            'TAX_BASE': '计税基数',
            'HOUSING_FUND_BASE': '住房公积金缴费基数',
            'MEDICAL_INS_EMPLOYER_RATE': '医疗保险单位缴纳费率',
            'MEDICAL_INS_PERSONAL_RATE': '医疗保险个人缴纳费率',
            'OCCUPATIONAL_PENSION_EMPLOYER_RATE': '职业年金单位缴费费率',
            'OCCUPATIONAL_PENSION_PERSONAL_RATE': '职业年金个人费率',
            'PENSION_EMPLOYER_RATE': '养老单位缴费比例',
            'PENSION_PERSONAL_RATE': '养老个人缴费比例',
            'SERIOUS_ILLNESS_EMPLOYER_RATE': '大病医疗单位缴纳费率',
            'TAX_RATE': '适用税率',
            'HOUSING_FUND_PERSONAL_RATE': '住房公积金个人缴费比例',
            'HOUSING_FUND_EMPLOYER_RATE': '住房公积金单位缴费比例',
            'AFTER_TAX_SALARY': '税后工资',
            'QUICK_DEDUCTION': '速算扣除数',
            'TAXABLE_INCOME': '应纳税所得额',
            'TAX_DEDUCTION_AMOUNT': '扣除额',
            'TAX_EXEMPT_AMOUNT': '免税额',
            'UNIFIED_PAYROLL_FLAG': '工资统发',
            'FISCAL_SUPPORT_FLAG': '财政供养',
            'ANNUAL_FIXED_SALARY_TOTAL': '固定薪酬全年应发数'
        }
        return name_mapping.get(code, code)  # 如果找不到映射，返回原code
    
    def generate_dynamic_fields_sql(self, components):
        """生成动态字段SQL"""
        print("🔨 生成动态字段SQL...")
        
        fields = []
        
        # 1. 生成应发字段
        print("  💰 生成应发字段...")
        for component in components['earnings']:
            safe_name = component['name'].replace('"', '""')
            field_sql = f"""COALESCE(((pe.earnings_details->'{component['code']}'->>'amount')::numeric), 0.00) as "{safe_name}\""""
            fields.append(field_sql)
        
        # 2. 生成扣除字段
        print("  💸 生成扣除字段...")
        for component in components['deductions']:
            safe_name = component['name'].replace('"', '""')
            field_sql = f"""COALESCE(((pe.deductions_details->'{component['code']}'->>'amount')::numeric), 0.00) as "{safe_name}\""""
            fields.append(field_sql)
        
        # 3. 生成计算输入字段
        print("  📊 生成计算输入字段...")
        for component in components['calculation_inputs']:
            safe_name = component['name'].replace('"', '""')
            # 根据组件类型确定数据类型
            if component['code'].endswith('_FLAG'):
                field_sql = f"""COALESCE(((pe.calculation_inputs->'{component['code']}'->>'amount')::boolean), true) as "{safe_name}\""""
            else:
                field_sql = f"""COALESCE(((pe.calculation_inputs->'{component['code']}'->>'amount')::numeric), 0.00) as "{safe_name}\""""
            fields.append(field_sql)
        
        print(f"  ✅ 生成了 {len(fields)} 个动态字段")
        return ',\n    '.join(fields)
    
    def create_updated_view_sql(self, dynamic_fields):
        """创建更新的视图SQL"""
        print("📝 构建完整的视图SQL...")
        
        view_sql = f"""
        DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll;
        
        CREATE VIEW reports.v_comprehensive_employee_payroll AS
        WITH personnel_hierarchy AS (
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
                root_name
            FROM category_tree
        )
        SELECT 
            -- 基本标识信息
            pe.id as "薪资条目id",
            pe.employee_id as "员工id",
            pe.payroll_period_id as "薪资期间id",
            pe.payroll_run_id as "薪资运行id",
            
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
            
            -- 动态生成的所有薪资组件字段
            {dynamic_fields},
            
            -- 系统字段
            COALESCE(pe.status_lookup_value_id, 1) as "状态id",
            COALESCE(pe.remarks, '') as "备注",
            pe.audit_status as "审计状态",
            pe.audit_timestamp as "审计时间",
            pe.auditor_id as "审计员id",
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
        LEFT JOIN personnel_hierarchy ph ON pc.id = ph.category_id
        LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
        LEFT JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id;
        """
        
        return view_sql
    
    def backup_current_view(self):
        """备份当前视图定义"""
        print("💾 备份当前视图定义...")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"v_comprehensive_employee_payroll_backup_{timestamp}.sql"
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT pg_get_viewdef('reports.v_comprehensive_employee_payroll', true) as view_definition;")
            result = cursor.fetchone()
            
            backup_sql = f"""-- 备份时间: {datetime.now()}
-- 原始视图定义备份

CREATE OR REPLACE VIEW reports.v_comprehensive_employee_payroll AS
{result['view_definition']}
"""
            
            with open(backup_file, 'w', encoding='utf-8') as f:
                f.write(backup_sql)
        
        print(f"  ✅ 备份已保存: {backup_file}")
        return backup_file
    
    def execute_view_update(self, view_sql):
        """执行视图更新"""
        print("🚀 执行视图更新...")
        
        try:
            # 分割SQL语句
            sql_statements = view_sql.strip().split(';')
            
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                for statement in sql_statements:
                    if statement.strip():  # 跳过空语句
                        print(f"  🔧 执行: {statement.strip()[:50]}...")
                        cursor.execute(statement.strip() + ';')
            
            print("  ✅ 视图更新成功")
            return True
        except Exception as e:
            print(f"  ❌ 视图更新失败: {e}")
            return False
    
    def validate_updated_view(self):
        """验证更新后的视图"""
        print("🔍 验证更新后的视图...")
        
        tests = [
            {
                'name': '基本查询测试',
                'sql': 'SELECT COUNT(*) as count FROM reports.v_comprehensive_employee_payroll;'
            },
            {
                'name': '字段数量统计',
                'sql': """
                SELECT COUNT(*) as column_count 
                FROM information_schema.columns 
                WHERE table_schema = 'reports' 
                AND table_name = 'v_comprehensive_employee_payroll';
                """
            },
            {
                'name': '样本数据查询',
                'sql': 'SELECT * FROM reports.v_comprehensive_employee_payroll LIMIT 1;'
            }
        ]
        
        results = {}
        
        for test in tests:
            try:
                with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    start_time = time.time()
                    cursor.execute(test['sql'])
                    
                    if test['name'] == '样本数据查询':
                        result = cursor.fetchone()
                        column_count = len(result.keys()) if result else 0
                        results[test['name']] = {
                            'status': 'success',
                            'column_count': column_count,
                            'execution_time': (time.time() - start_time) * 1000
                        }
                        print(f"  ✅ {test['name']}: {column_count} 个字段")
                    else:
                        result = cursor.fetchone()
                        results[test['name']] = {
                            'status': 'success',
                            'result': dict(result) if result else None,
                            'execution_time': (time.time() - start_time) * 1000
                        }
                        
                        if test['name'] == '基本查询测试':
                            print(f"  ✅ {test['name']}: {result['count']} 条记录")
                        elif test['name'] == '字段数量统计':
                            print(f"  ✅ {test['name']}: {result['column_count']} 个字段")
                            
            except Exception as e:
                results[test['name']] = {
                    'status': 'error',
                    'error': str(e)
                }
                print(f"  ❌ {test['name']}: {e}")
        
        return results
    
    def generate_update_report(self, components, backup_file, validation_results):
        """生成更新报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"comprehensive_view_update_report_{timestamp}.json"
        
        report = {
            'timestamp': timestamp,
            'update_summary': {
                'total_components': len(components['all_components']),
                'earnings_count': len(components['earnings']),
                'deductions_count': len(components['deductions']),
                'calculation_inputs_count': len(components['calculation_inputs']),
                'backup_file': backup_file
            },
            'validation_results': validation_results,
            'benefits': [
                '所有活跃薪资组件自动包含在视图中',
                '新增组件时无需手动修改视图',
                '保持数据完整性和一致性',
                '简化前端开发和报表生成'
            ],
            'maintenance_notes': [
                '当添加新的薪资组件时，重新运行此脚本更新视图',
                '定期检查视图性能，必要时考虑创建物化视图',
                '备份文件可用于回滚操作'
            ]
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n📋 更新报告已保存: {report_file}")
        return report_file

def main():
    """主函数"""
    print("🚀 开始更新 v_comprehensive_employee_payroll 视图")
    print("=" * 60)
    print("⚠️  警告: 此操作将修改原始视图，请确保已做好备份！")
    
    # 用户确认
    confirm = input("\n📋 是否继续执行更新？(yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ 操作已取消")
        return
    
    updater = ComprehensiveViewUpdater()
    
    try:
        # 1. 连接数据库
        updater.connect()
        
        # 2. 获取所有薪资组件
        print("\n📋 Phase 1: 获取薪资组件")
        components = updater.get_all_payroll_components()
        
        # 3. 备份当前视图
        print("\n💾 Phase 2: 备份当前视图")
        backup_file = updater.backup_current_view()
        
        # 4. 生成动态字段
        print("\n🔨 Phase 3: 生成动态字段")
        dynamic_fields = updater.generate_dynamic_fields_sql(components)
        
        # 5. 构建新视图SQL
        print("\n📝 Phase 4: 构建新视图")
        view_sql = updater.create_updated_view_sql(dynamic_fields)
        
        # 6. 执行更新
        print("\n🚀 Phase 5: 执行更新")
        if updater.execute_view_update(view_sql):
            # 7. 验证更新
            print("\n🔍 Phase 6: 验证更新")
            validation_results = updater.validate_updated_view()
            
            # 8. 生成报告
            print("\n📄 Phase 7: 生成报告")
            report_file = updater.generate_update_report(components, backup_file, validation_results)
            
            # 9. 总结
            print("\n🎉 更新完成总结:")
            print(f"  ✅ 视图已更新: reports.v_comprehensive_employee_payroll")
            print(f"  ✅ 包含组件: {len(components['all_components'])} 个")
            print(f"  ✅ 备份文件: {backup_file}")
            print(f"  ✅ 更新报告: {report_file}")
            
            if 'column_count' in str(validation_results):
                print(f"  📊 视图字段数: 详见验证结果")
        else:
            print("❌ 视图更新失败，请检查错误信息")
            print(f"💾 可使用备份文件恢复: {backup_file}")
            
    except Exception as e:
        print(f"❌ 更新过程出错: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        updater.disconnect()

if __name__ == "__main__":
    main() 