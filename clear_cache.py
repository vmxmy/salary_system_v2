#!/usr/bin/env python3
"""
清理审核缓存的脚本
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from webapp.v2.database import get_db_v2

def clear_cache():
    """清理缓存"""
    payroll_run_id = 53
    
    # 获取数据库连接
    db = next(get_db_v2())
    
    try:
        from sqlalchemy import text
        
        # 清理审核汇总缓存
        db.execute(text('DELETE FROM payroll.payroll_run_audit_summary WHERE payroll_run_id = :id'), {'id': payroll_run_id})
        
        # 清理异常缓存
        db.execute(text('DELETE FROM payroll.payroll_audit_anomalies WHERE payroll_run_id = :id'), {'id': payroll_run_id})
        
        db.commit()
        print(f'✅ 已清理 payroll_run_id {payroll_run_id} 的缓存数据')
        
    except Exception as e:
        print(f"❌ 清理缓存失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_cache() 