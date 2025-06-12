"""
极简工资报表系统优化服务
使用单一SQL查询替代N+1查询，大幅提升性能
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class SimplePayrollServiceOptimized:
    """优化版极简工资报表系统服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # 删除 get_payroll_periods_ultra_fast 方法 - 使用 SimplePayrollService 的标准实现
    
    def get_payroll_versions_ultra_fast(
        self, 
        period_id: int, 
        page: int = 1, 
        size: int = 20
    ) -> Dict[str, Any]:
        """🚀 超高性能工资运行查询 - 单一SQL解决统计问题"""
        try:
            # 🚀 核心优化：使用单一SQL获取所有版本数据和统计
            query = text("""
                SELECT 
                    pr.id,
                    pr.payroll_period_id,
                    pr.run_date,
                    pr.status_lookup_value_id,
                    pr.total_gross_pay,
                    pr.total_net_pay,
                    pr.total_deductions,
                    pr.initiated_by_user_id,
                    -- 期间信息
                    pp.name as period_name,
                    -- 状态信息
                    status.name as status_name,
                    -- 统计信息（使用存储的字段，避免重新计算）
                    pr.total_employees as entries_count,
                    -- 版本号（基于时间顺序）
                    ROW_NUMBER() OVER (PARTITION BY pr.payroll_period_id ORDER BY pr.run_date DESC) as version_number
                FROM payroll.payroll_runs pr
                JOIN payroll.payroll_periods pp ON pp.id = pr.payroll_period_id
                LEFT JOIN config.lookup_values status ON status.id = pr.status_lookup_value_id
                WHERE pr.payroll_period_id = :period_id
                ORDER BY pr.run_date DESC
                LIMIT :size OFFSET :offset
            """)
            
            count_query = text("""
                SELECT COUNT(*) 
                FROM payroll.payroll_runs 
                WHERE payroll_period_id = :period_id
            """)
            
            params = {
                'period_id': period_id,
                'size': size,
                'offset': (page - 1) * size
            }
            
            start_time = datetime.now()
            
            # 获取总数
            total_result = self.db.execute(count_query, params)
            total = total_result.scalar()
            
            # 获取数据
            result = self.db.execute(query, params)
            rows = result.fetchall()
            
            elapsed = (datetime.now() - start_time).total_seconds() * 1000
            
            # 构建响应数据
            versions = []
            for row in rows:
                versions.append({
                    'id': row.id,
                    'period_id': period_id,
                    'period_name': row.period_name,
                    'version_number': row.version_number,
                    'status_id': row.status_lookup_value_id or 60,
                    'status_name': row.status_name or '未知状态',
                    'total_entries': row.entries_count or 0,
                    'total_gross_pay': float(row.total_gross_pay or 0),
                    'total_net_pay': float(row.total_net_pay or 0),
                    'total_deductions': float(row.total_deductions or 0),
                    'initiated_by_user_id': row.initiated_by_user_id or 1,
                    'initiated_by_username': '系统',
                    'initiated_at': row.run_date.isoformat() if row.run_date else datetime.now().isoformat(),
                    'calculated_at': row.run_date.isoformat() if row.run_date else None,
                    'approved_at': None,
                    'description': f"工资运行 #{row.version_number}"
                })
            
            logger.info(f"✅ [优化版] 版本查询完成 - 返回 {len(versions)} 条记录, 耗时: {elapsed:.2f}ms")
            
            return {
                "data": versions,
                "meta": {
                    "page": page,
                    "size": size,
                    "total": total,
                    "totalPages": (total + size - 1) // size
                }
            }
            
        except Exception as e:
            logger.error(f"获取工资运行列表失败: {e}", exc_info=True)
            raise 