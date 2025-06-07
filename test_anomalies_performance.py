#!/usr/bin/env python3
"""
测试异常列表API性能的脚本
"""
import time
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from webapp.v2.database import get_db_v2
from webapp.v2.services.simple_payroll.payroll_audit_service import PayrollAuditService

def test_anomalies_performance():
    """测试异常列表性能"""
    payroll_run_id = 53
    
    # 获取数据库连接
    db = next(get_db_v2())
    
    try:
        # 创建审核服务
        service = PayrollAuditService(db)
        
        print(f"🔍 开始测试异常列表API性能 (payroll_run_id: {payroll_run_id})")
        
        # 第一次调用 - 可能需要实时计算
        print("\n📊 第一次调用（可能需要实时计算）:")
        start_time = time.time()
        anomalies_1 = service.get_audit_anomalies(payroll_run_id)
        end_time = time.time()
        duration_1 = (end_time - start_time) * 1000
        
        print(f"⏱️  响应时间: {duration_1:.2f}ms")
        print(f"📋 异常数量: {len(anomalies_1)}")
        
        if anomalies_1:
            print(f"📝 异常类型分布:")
            type_counts = {}
            severity_counts = {}
            for anomaly in anomalies_1:
                type_counts[anomaly.anomaly_type] = type_counts.get(anomaly.anomaly_type, 0) + 1
                severity_counts[anomaly.severity] = severity_counts.get(anomaly.severity, 0) + 1
            
            for anomaly_type, count in type_counts.items():
                print(f"   - {anomaly_type}: {count}")
            
            print(f"🚨 严重程度分布:")
            for severity, count in severity_counts.items():
                print(f"   - {severity}: {count}")
        
        # 第二次调用 - 应该从缓存读取
        print("\n💾 第二次调用（应该从缓存读取）:")
        start_time = time.time()
        anomalies_2 = service.get_audit_anomalies(payroll_run_id)
        end_time = time.time()
        duration_2 = (end_time - start_time) * 1000
        
        print(f"⏱️  响应时间: {duration_2:.2f}ms")
        print(f"📋 异常数量: {len(anomalies_2)}")
        
        # 性能对比
        if duration_2 < duration_1:
            improvement = ((duration_1 - duration_2) / duration_1) * 100
            print(f"🚀 缓存提升: {improvement:.1f}% ({duration_1:.2f}ms → {duration_2:.2f}ms)")
        
        # 测试过滤功能
        print("\n🔍 测试过滤功能:")
        start_time = time.time()
        error_anomalies = service.get_audit_anomalies(
            payroll_run_id, 
            severity=['error']
        )
        end_time = time.time()
        duration_filter = (end_time - start_time) * 1000
        
        print(f"⏱️  过滤响应时间: {duration_filter:.2f}ms")
        print(f"❌ 错误异常数量: {len(error_anomalies)}")
        
        # 性能评估
        print(f"\n📈 性能评估:")
        avg_duration = (duration_1 + duration_2) / 2
        if avg_duration < 500:
            print(f"🚀 性能优秀: 平均 {avg_duration:.2f}ms < 500ms")
        elif avg_duration < 1000:
            print(f"✅ 性能良好: 平均 {avg_duration:.2f}ms < 1秒")
        elif avg_duration < 3000:
            print(f"⚠️  性能一般: 平均 {avg_duration:.2f}ms < 3秒")
        else:
            print(f"❌ 性能较差: 平均 {avg_duration:.2f}ms > 3秒")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_anomalies_performance() 