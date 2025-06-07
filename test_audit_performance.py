#!/usr/bin/env python3
"""
测试审核API性能的脚本
"""
import time
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from webapp.v2.database import get_db_v2
from webapp.v2.services.simple_payroll.payroll_audit_service import PayrollAuditService

def test_audit_performance():
    """测试审核性能"""
    payroll_run_id = 53
    
    # 获取数据库连接
    db = next(get_db_v2())
    
    try:
        # 创建审核服务
        service = PayrollAuditService(db)
        
        print(f"🔍 开始测试审核API性能 (payroll_run_id: {payroll_run_id})")
        
        # 测试优化后的性能
        start_time = time.time()
        summary = service.get_audit_summary(payroll_run_id)
        end_time = time.time()
        
        duration_ms = (end_time - start_time) * 1000
        
        print(f"✅ 审核完成!")
        print(f"⏱️  响应时间: {duration_ms:.2f}ms")
        print(f"📊 审核结果:")
        print(f"   - 总条目数: {summary.total_entries}")
        print(f"   - 总异常数: {summary.total_anomalies}")
        print(f"   - 错误数: {summary.error_count}")
        print(f"   - 警告数: {summary.warning_count}")
        print(f"   - 审核状态: {summary.audit_status}")
        print(f"   - 总应发: ¥{summary.total_gross_pay}")
        print(f"   - 总实发: ¥{summary.total_net_pay}")
        
        if summary.comparison_with_previous:
            print(f"📈 与上期对比:")
            print(f"   - 应发差额: ¥{summary.comparison_with_previous.get('gross_pay_variance', 0)}")
            print(f"   - 实发差额: ¥{summary.comparison_with_previous.get('net_pay_variance', 0)}")
            print(f"   - 人数差额: {summary.comparison_with_previous.get('entries_count_variance', 0)}")
        
        # 性能评估
        if duration_ms < 1000:
            print(f"🚀 性能优秀: {duration_ms:.2f}ms < 1秒")
        elif duration_ms < 5000:
            print(f"✅ 性能良好: {duration_ms:.2f}ms < 5秒")
        elif duration_ms < 10000:
            print(f"⚠️  性能一般: {duration_ms:.2f}ms < 10秒")
        else:
            print(f"❌ 性能较差: {duration_ms:.2f}ms > 10秒")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_audit_performance() 