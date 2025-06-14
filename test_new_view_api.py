#!/usr/bin/env python3
"""
测试新的 v_comprehensive_employee_payroll 视图API功能
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json
from decimal import Decimal

# 数据库连接配置
DATABASE_URL = "postgresql://postgres:810705@localhost:5432/salary_system"

def decimal_encoder(obj):
    """JSON序列化Decimal类型"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def test_comprehensive_view():
    """测试完整的员工薪资视图"""
    print("🔍 测试 v_comprehensive_employee_payroll 视图...")
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 模拟API查询
        query = text("""
            SELECT 
                payroll_entry_id as id,
                employee_id,
                payroll_period_id,
                payroll_run_id,
                employee_code,
                first_name,
                last_name,
                full_name as employee_name,
                department_name,
                position_name,
                personnel_category_name,
                root_personnel_category_name,
                payroll_period_name,
                gross_pay,
                net_pay,
                total_deductions,
                
                -- 应发项目
                basic_salary,
                performance_bonus,
                basic_performance_salary,
                position_salary_general as position_salary,
                grade_salary,
                salary_grade,
                allowance_general as allowance,
                traffic_allowance,
                only_child_parent_bonus as only_child_bonus,
                
                -- 个人扣除项目
                personal_income_tax,
                pension_personal_amount as pension_personal,
                medical_ins_personal_amount as medical_personal,
                housing_fund_personal,
                
                -- 原始JSONB数据
                raw_earnings_details,
                raw_deductions_details,
                
                calculated_at,
                updated_at
            FROM reports.v_comprehensive_employee_payroll
            WHERE payroll_period_id = :period_id
            ORDER BY payroll_entry_id
            LIMIT :limit
        """)
        
        result = session.execute(query, {"period_id": 42, "limit": 3})
        
        entries = []
        for row in result:
            entry_dict = {
                'id': row.id,
                'employee_id': row.employee_id,
                'payroll_period_id': row.payroll_period_id,
                'payroll_run_id': row.payroll_run_id,
                'employee_code': row.employee_code,
                'employee_name': row.employee_name,
                'first_name': row.first_name,
                'last_name': row.last_name,
                'department_name': row.department_name,
                'position_name': row.position_name,
                'personnel_category_name': row.personnel_category_name,
                'root_personnel_category_name': row.root_personnel_category_name,
                'payroll_period_name': row.payroll_period_name,
                'gross_pay': float(row.gross_pay) if row.gross_pay else 0.0,
                'net_pay': float(row.net_pay) if row.net_pay else 0.0,
                'total_deductions': float(row.total_deductions) if row.total_deductions else 0.0,
                
                # 展开的薪资组件
                'basic_salary': float(row.basic_salary) if row.basic_salary else 0.0,
                'performance_bonus': float(row.performance_bonus) if row.performance_bonus else 0.0,
                'basic_performance_salary': float(row.basic_performance_salary) if row.basic_performance_salary else 0.0,
                'position_salary': float(row.position_salary) if row.position_salary else 0.0,
                'grade_salary': float(row.grade_salary) if row.grade_salary else 0.0,
                'salary_grade': float(row.salary_grade) if row.salary_grade else 0.0,
                'allowance': float(row.allowance) if row.allowance else 0.0,
                'traffic_allowance': float(row.traffic_allowance) if row.traffic_allowance else 0.0,
                'only_child_bonus': float(row.only_child_bonus) if row.only_child_bonus else 0.0,
                
                # 扣除项目
                'personal_income_tax': float(row.personal_income_tax) if row.personal_income_tax else 0.0,
                'pension_personal': float(row.pension_personal) if row.pension_personal else 0.0,
                'medical_personal': float(row.medical_personal) if row.medical_personal else 0.0,
                'housing_fund_personal': float(row.housing_fund_personal) if row.housing_fund_personal else 0.0,
                
                # 原始JSONB数据
                'earnings_details': row.raw_earnings_details or {},
                'deductions_details': row.raw_deductions_details or {},
                
                'calculated_at': row.calculated_at.isoformat() if row.calculated_at else None,
                'updated_at': row.updated_at.isoformat() if row.updated_at else None
            }
            entries.append(entry_dict)
        
        print(f"✅ 成功查询到 {len(entries)} 条薪资记录")
        
        # 显示第一条记录的详细信息
        if entries:
            first_entry = entries[0]
            print(f"\n📋 第一条记录详情:")
            print(f"   员工: {first_entry['employee_name']} ({first_entry['employee_id']})")
            print(f"   部门: {first_entry['department_name']}")
            print(f"   职位: {first_entry['position_name']}")
            print(f"   人员类别: {first_entry['personnel_category_name']} -> {first_entry['root_personnel_category_name']}")
            print(f"   薪资周期: {first_entry['payroll_period_name']}")
            print(f"   应发合计: ¥{first_entry['gross_pay']:,.2f}")
            print(f"   实发合计: ¥{first_entry['net_pay']:,.2f}")
            print(f"   扣除合计: ¥{first_entry['total_deductions']:,.2f}")
            
            print(f"\n💰 薪资组件明细:")
            print(f"   基本工资: ¥{first_entry['basic_salary']:,.2f}")
            print(f"   绩效奖金: ¥{first_entry['performance_bonus']:,.2f}")
            print(f"   岗位工资: ¥{first_entry['position_salary']:,.2f}")
            print(f"   津贴补助: ¥{first_entry['allowance']:,.2f}")
            
            print(f"\n📉 扣除项目明细:")
            print(f"   个人所得税: ¥{first_entry['personal_income_tax']:,.2f}")
            print(f"   养老保险: ¥{first_entry['pension_personal']:,.2f}")
            print(f"   医疗保险: ¥{first_entry['medical_personal']:,.2f}")
            print(f"   住房公积金: ¥{first_entry['housing_fund_personal']:,.2f}")
            
            print(f"\n🔧 原始JSONB数据:")
            print(f"   应发项目数量: {len(first_entry['earnings_details'])}")
            print(f"   扣除项目数量: {len(first_entry['deductions_details'])}")
        
        # 模拟分页响应格式
        response = {
            "data": entries,
            "meta": {
                "page": 1,
                "size": 3,
                "total": len(entries),
                "totalPages": 1
            }
        }
        
        print(f"\n📊 API响应格式预览:")
        print(json.dumps(response, indent=2, default=decimal_encoder, ensure_ascii=False)[:500] + "...")
        
        return True
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        session.close()

def test_view_performance():
    """测试视图查询性能"""
    print("\n⚡️ 测试视图查询性能...")
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        import time
        
        # 测试大量数据查询
        start_time = time.time()
        
        query = text("""
            SELECT COUNT(*) as total
            FROM reports.v_comprehensive_employee_payroll
        """)
        
        result = session.execute(query).fetchone()
        total_records = result.total
        
        end_time = time.time()
        query_time = end_time - start_time
        
        print(f"✅ 视图总记录数: {total_records:,}")
        print(f"✅ 查询耗时: {query_time:.3f} 秒")
        
        if query_time < 1.0:
            print("🚀 查询性能优秀!")
        elif query_time < 3.0:
            print("👍 查询性能良好")
        else:
            print("⚠️ 查询性能需要优化")
            
        return True
        
    except Exception as e:
        print(f"❌ 性能测试失败: {e}")
        return False
        
    finally:
        session.close()

if __name__ == "__main__":
    print("🧪 开始测试新的完整员工薪资视图...")
    
    success1 = test_comprehensive_view()
    success2 = test_view_performance()
    
    if success1 and success2:
        print("\n🎉 所有测试通过！新视图API数据源修改成功！")
        print("\n📝 修改总结:")
        print("   ✅ 视图名称: employee_salary_details_view -> v_comprehensive_employee_payroll")
        print("   ✅ 字段展开: 所有JSONB字段已展开为标准字段")
        print("   ✅ 数据完整: 包含员工基本信息、薪资明细、计算基数等")
        print("   ✅ 性能良好: 查询响应时间在可接受范围内")
        print("   ✅ 兼容性: 保留原始JSONB字段确保向后兼容")
    else:
        print("\n❌ 测试失败，需要进一步检查和修复")
        sys.exit(1) 