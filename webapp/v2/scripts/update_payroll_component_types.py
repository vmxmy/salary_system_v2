#!/usr/bin/env python
"""
更新薪资字段定义表的约束，支持新的类型分类。
"""
import sys
import os
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

# 将项目根目录添加到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from webapp.v2.database import get_db

def update_constraint():
    """更新约束并分类字段"""
    db = next(get_db())
    
    try:
        # 开始事务
        with db.begin():
            # 1. 删除原有约束
            db.execute(text("""
                ALTER TABLE config.payroll_component_definitions 
                DROP CONSTRAINT IF EXISTS chk_payroll_component_type;
            """))
            
            # 2. 创建新约束
            db.execute(text("""
                ALTER TABLE config.payroll_component_definitions 
                ADD CONSTRAINT chk_payroll_component_type 
                CHECK (type IN ('EARNING', 'DEDUCTION', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION', 
                               'BENEFIT', 'STATUTORY', 'STAT', 'OTHER',
                               'CALCULATION_BASE', 'CALCULATION_RATE', 'CALCULATION_RESULT', 'TAX'));
            """))
            
            # 3. 将旧数据规范化为大写
            db.execute(text("""
                UPDATE config.payroll_component_definitions
                SET type = 'EARNING' 
                WHERE type = 'Earning';
                
                UPDATE config.payroll_component_definitions
                SET type = 'DEDUCTION' 
                WHERE type = 'Deduction';
            """))
            
            # 4. 更新计算基数相关字段分类
            db.execute(text("""
                UPDATE config.payroll_component_definitions
                SET type = 'CALCULATION_BASE'
                WHERE name IN (
                  '医疗保险缴费工资', 
                  '医疗保险缴费基数', 
                  '养老缴费基数',
                  '职业年金缴费工资',
                  '职业年金缴费基数'
                ) 
                AND type = 'STAT';
            """))
            
            # 5. 更新计算费率相关字段分类
            db.execute(text("""
                UPDATE config.payroll_component_definitions
                SET type = 'CALCULATION_RATE'
                WHERE name IN (
                  '医疗保险单位缴纳费率', 
                  '医疗保险个人缴纳费率',
                  '大病医疗单位缴纳费率',
                  '养老单位缴费比例',
                  '养老个人缴费比例',
                  '职业年金单位缴费费率',
                  '职业年金个人费率',
                  '适用税率'
                ) 
                AND type = 'STAT';
            """))
            
            # 6. 更新计算结果相关字段分类
            db.execute(text("""
                UPDATE config.payroll_component_definitions
                SET type = 'CALCULATION_RESULT'
                WHERE name IN (
                  '应纳税所得额',
                  '免税额',
                  '扣除额',
                  '计税基数',
                  '速算扣除数',
                  '税后工资'
                ) 
                AND type = 'STAT';
            """))
            
            # 7. 更新个人扣款相关字段分类
            db.execute(text("""
                UPDATE config.payroll_component_definitions
                SET type = 'PERSONAL_DEDUCTION'
                WHERE name IN (
                  '医疗保险个人缴纳金额',
                  '医疗保险个人应缴总额',
                  '失业保险个人应缴金额',
                  '个人所得税'
                ) 
                AND type = 'DEDUCTION';
            """))
            
            # 8. 更新单位扣款相关字段分类
            db.execute(text("""
                UPDATE config.payroll_component_definitions
                SET type = 'EMPLOYER_DEDUCTION'
                WHERE name IN (
                  '医疗保险单位缴纳金额',
                  '大病医疗单位缴纳',
                  '医疗保险单位应缴总额',
                  '工伤单位应缴金额'
                ) 
                AND type = 'DEDUCTION';
            """))
            
        print("薪资字段定义表的约束和分类已成功更新！")
        
    except SQLAlchemyError as e:
        print(f"更新失败: {e}")

if __name__ == "__main__":
    update_constraint() 