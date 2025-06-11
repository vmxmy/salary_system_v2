#!/usr/bin/env python3
"""
测试员工薪资配置复制功能

用法：
    python test_salary_config_copy.py --source-period 1 --target-period 2
"""

import argparse
import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

from webapp.v2.database import get_db_v2
from webapp.v2.services.simple_payroll.employee_salary_config_service import EmployeeSalaryConfigService


def test_copy_salary_configs():
    """测试薪资配置复制功能"""
    parser = argparse.ArgumentParser(description="测试员工薪资配置复制功能")
    parser.add_argument("--source-period", type=int, required=True, help="源期间ID")
    parser.add_argument("--target-period", type=int, required=True, help="目标期间ID")
    parser.add_argument("--user-id", type=int, default=1, help="操作用户ID")
    
    args = parser.parse_args()
    
    print(f"🚀 开始测试薪资配置复制功能")
    print(f"📋 参数: 源期间={args.source_period}, 目标期间={args.target_period}, 用户ID={args.user_id}")
    
    # 获取数据库连接
    db = next(get_db_v2())
    
    try:
        # 创建服务实例
        service = EmployeeSalaryConfigService(db)
        
        # 执行复制操作
        print(f"⚡ 开始复制操作...")
        result = service.copy_salary_configs_for_period(
            source_period_id=args.source_period,
            target_period_id=args.target_period,
            user_id=args.user_id
        )
        
        print(f"✅ 复制完成！")
        print(f"📊 结果统计:")
        print(f"   - 成功新建: {result['copied_count']} 条")
        print(f"   - 成功更新: {result['updated_count']} 条")
        print(f"   - 跳过处理: {result['skipped_count']} 条")
        print(f"   - 总计处理: {result['total_processed']} 条")
        print(f"   - 详细信息: {result['message']}")
        
        if result['success']:
            print(f"🎉 测试成功！")
            return 0
        else:
            print(f"❌ 测试失败：{result['message']}")
            return 1
            
    except Exception as e:
        print(f"💥 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


def test_batch_update_configs():
    """测试批量更新薪资配置功能"""
    print(f"🚀 开始测试批量更新薪资配置功能")
    
    # 示例更新数据
    sample_updates = [
        {
            "employee_id": 303,  # 汪琳
            "social_insurance_base": 20000.00,
            "housing_fund_base": 25000.00,
            "basic_salary": 12000.00
        },
        {
            "employee_id": 304,  # 韩霜  
            "social_insurance_base": 19500.00,
            "housing_fund_base": 24000.00,
            "basic_salary": 11500.00
        }
    ]
    
    # 获取数据库连接
    db = next(get_db_v2())
    
    try:
        service = EmployeeSalaryConfigService(db)
        
        print(f"⚡ 开始批量更新操作...")
        result = service.batch_update_salary_configs(
            updates=sample_updates,
            user_id=1
        )
        
        print(f"✅ 批量更新完成！")
        print(f"📊 结果统计:")
        print(f"   - 成功更新: {result['updated_count']} 条")
        print(f"   - 更新失败: {result['failed_count']} 条")
        print(f"   - 请求总数: {result['total_requested']} 条")
        print(f"   - 详细信息: {result['message']}")
        
        if result['success']:
            print(f"🎉 批量更新测试成功！")
            return 0
        else:
            print(f"❌ 批量更新测试失败：{result['message']}")
            return 1
            
    except Exception as e:
        print(f"💥 批量更新测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


def main():
    """主函数"""
    print("=" * 60)
    print("员工薪资配置管理功能测试")
    print("=" * 60)
    
    # 如果提供了命令行参数，执行复制测试
    if len(sys.argv) > 1:
        return test_copy_salary_configs()
    
    # 否则执行批量更新测试  
    print("提示: 如需测试复制功能，请使用:")
    print("  python test_salary_config_copy.py --source-period 1 --target-period 2")
    print()
    return test_batch_update_configs()


if __name__ == "__main__":
    sys.exit(main()) 