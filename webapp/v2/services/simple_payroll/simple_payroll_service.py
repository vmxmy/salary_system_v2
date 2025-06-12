"""
极简工资报表系统主服务
集成工资生成、审核、报表等功能的统一服务入口
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from datetime import datetime
from decimal import Decimal
import logging

from ...models import PayrollPeriod, PayrollRun, Employee, Department, PayrollEntry, LookupValue
from ...pydantic_models.simple_payroll import (
    PayrollPeriodResponse, PayrollRunResponse
)
from .payroll_generation_service import PayrollGenerationService
from .payroll_audit_service import PayrollAuditService
from .payroll_report_service import PayrollReportService
from .enhanced_audit_service import EnhancedAuditService

logger = logging.getLogger(__name__)

class SimplePayrollService:
    """极简工资报表系统主服务"""
    
    def __init__(self, db: Session):
        self.db = db
        # 初始化子服务
        self._generation_service = None
        self._audit_service = None
        self._report_service = None
        self._enhanced_audit_service = None
    
    @property
    def generation_service(self) -> PayrollGenerationService:
        """工资生成服务"""
        if self._generation_service is None:
            self._generation_service = PayrollGenerationService(self.db)
        return self._generation_service
    
    @property
    def audit_service(self) -> PayrollAuditService:
        """工资审核服务"""
        if self._audit_service is None:
            self._audit_service = PayrollAuditService(self.db)
        return self._audit_service
    
    @property
    def report_service(self) -> PayrollReportService:
        """报表生成服务"""
        if self._report_service is None:
            self._report_service = PayrollReportService(self.db)
        return self._report_service
    
    @property
    def enhanced_audit_service(self) -> EnhancedAuditService:
        """增强审核服务"""
        if self._enhanced_audit_service is None:
            self._enhanced_audit_service = EnhancedAuditService(self.db)
        return self._enhanced_audit_service
    
    def get_payroll_periods(
        self, 
        year: Optional[int] = None,
        month: Optional[int] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        size: int = 50
    ) -> Dict[str, Any]:
        """获取工资期间列表"""
        logger.info(f"🔄 [SimplePayrollService.get_payroll_periods] 开始查询 - 参数: year={year}, month={month}, is_active={is_active}, page={page}, size={size}")
        
        try:
            query = self.db.query(PayrollPeriod)
            logger.info(f"📊 [SimplePayrollService.get_payroll_periods] 基础查询创建完成")
            
            # 应用筛选条件
            if year is not None:
                from sqlalchemy import extract
                query = query.filter(extract('year', PayrollPeriod.start_date) == year)
            if month is not None:
                from sqlalchemy import extract
                query = query.filter(extract('month', PayrollPeriod.start_date) == month)
            if is_active is not None:
                # 假设活跃期间是那些有开始日期且未过期的期间
                if is_active:
                    query = query.filter(PayrollPeriod.start_date.isnot(None))
                else:
                    query = query.filter(PayrollPeriod.start_date.is_(None))
            
            # 排序 - 按开始日期倒序
            query = query.order_by(desc(PayrollPeriod.start_date))
            
            # 分页
            total = query.count()
            logger.info(f"📊 [SimplePayrollService.get_payroll_periods] 查询统计 - 总记录数: {total}")
            
            periods = query.offset((page - 1) * size).limit(size).all()
            logger.info(f"📊 [SimplePayrollService.get_payroll_periods] 分页查询完成 - 当前页记录数: {len(periods)}")
            
            result = []
            for period in periods:
                # 获取该期间的工资运行统计
                try:
                    runs_count = self.db.query(PayrollRun).filter(
                        PayrollRun.payroll_period_id == period.id
                    ).count()
                    logger.info(f"🔍 [调试] 期间 {period.id} 的运行统计: {runs_count}")
                except Exception as e:
                    logger.error(f"❌ 统计运行数失败: {e}")
                    runs_count = 0
                
                # 获取最新运行的基本信息
                latest_run = self.db.query(PayrollRun).filter(
                    PayrollRun.payroll_period_id == period.id
                ).order_by(desc(PayrollRun.run_date)).first()
                
                # 使用SQL实时统计该期间的工资条目数量（所有PayrollRun的总和）
                try:
                    entries_count = self.db.query(PayrollEntry).filter(
                        PayrollEntry.payroll_period_id == period.id
                    ).count()
                    logger.info(f"🔍 [调试] 期间 {period.id} 的条目统计: {entries_count}")
                except Exception as e:
                    logger.error(f"❌ 统计条目数失败: {e}")
                    entries_count = 0
                
                # 计算状态
                status = "empty"  # 无数据
                if latest_run:
                    # 根据PayrollRun模型的实际字段判断状态
                    # 这里简化处理，可以根据实际业务需求调整
                    status = "calculated"  # 已计算
                
                logger.info(f"📊 [期间统计] ID={period.id}, 名称={period.name}, 运行数={runs_count}, 条目数={entries_count}")
                
                result.append(PayrollPeriodResponse(
                    id=period.id,
                    name=period.name,
                    description=None,  # 模型中没有description字段
                    frequency_id=period.frequency_lookup_value_id,
                    frequency_name=period.frequency.name if period.frequency else "未知",
                    status_id=period.status_lookup_value_id or 0,
                    status_name=period.status_lookup.name if period.status_lookup else status,
                    is_active=True,  # 暂时设为True
                    start_date=period.start_date,
                    end_date=period.end_date,
                    runs_count=runs_count,
                    entries_count=entries_count,  # 实际工资条目数量
                    created_at=datetime.now(),  # 模型中没有created_at字段，使用当前时间
                    updated_at=datetime.now()   # 模型中没有updated_at字段，使用当前时间
                ))
            
            # 返回分页格式
            response_data = {
                "data": result,
                "meta": {
                    "page": page,
                    "size": size,
                    "total": total,
                    "totalPages": (total + size - 1) // size
                }
            }
            
            logger.info(f"✅ [SimplePayrollService.get_payroll_periods] 查询完成 - 返回 {len(result)} 条记录")
            return response_data
            
        except Exception as e:
            logger.error(f"获取工资期间列表失败: {e}", exc_info=True)
            raise
    
    def get_payroll_versions(
        self, 
        period_id: int, 
        page: int = 1, 
        size: int = 20
    ) -> Dict[str, Any]:
        """获取指定期间的工资运行列表"""
        try:
            # 验证期间是否存在
            period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == period_id
            ).first()
            
            if not period:
                raise ValueError(f"工资期间 {period_id} 不存在")
            
            # 获取工资运行记录（分页）
            query = self.db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == period_id
            ).order_by(desc(PayrollRun.run_date))
            
            total = query.count()
            runs = query.offset((page - 1) * size).limit(size).all()
            
            result = []
            for index, run in enumerate(runs):
                # 查询真实的状态信息
                status_name = "未知状态"
                status_id = run.status_lookup_value_id or 60  # 默认为待计算
                
                if run.status_lookup_value_id:
                    status_lookup = self.db.query(LookupValue).filter(
                        LookupValue.id == run.status_lookup_value_id
                    ).first()
                    if status_lookup:
                        status_name = status_lookup.name
                        status_id = status_lookup.id
                
                # 查询工资条目统计
                entries_count = self.db.query(PayrollEntry).filter(
                    PayrollEntry.payroll_run_id == run.id
                ).count()
                
                # 计算汇总金额
                entry_stats = self.db.query(
                    func.sum(PayrollEntry.gross_pay).label('total_gross'),
                    func.sum(PayrollEntry.total_deductions).label('total_deductions'),
                    func.sum(PayrollEntry.net_pay).label('total_net')
                ).filter(PayrollEntry.payroll_run_id == run.id).first()
                
                total_gross_pay = entry_stats.total_gross or Decimal('0.00')
                total_deductions = entry_stats.total_deductions or Decimal('0.00')
                total_net_pay = entry_stats.total_net or Decimal('0.00')
                
                # 构建响应数据
                result.append(PayrollRunResponse(
                    id=run.id,
                    period_id=period_id,
                    period_name=period.name,
                    version_number=index + 1,  # 简单的版本号
                    status_id=status_id,
                    status_name=status_name,
                    total_entries=entries_count,
                    total_gross_pay=total_gross_pay,
                    total_net_pay=total_net_pay,
                    total_deductions=total_deductions,
                    initiated_by_user_id=run.initiated_by_user_id or 1,
                    initiated_by_username="系统",
                    initiated_at=run.run_date or datetime.now(),
                    calculated_at=run.run_date,
                    approved_at=None,
                    description=f"工资运行 #{index + 1}"
                ))
            
            return {
                "data": result,
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
    
    def get_system_statistics(self) -> Dict[str, Any]:
        """获取系统统计信息"""
        try:
            # 基础统计
            total_periods = self.db.query(PayrollPeriod).count()
            total_employees = self.db.query(Employee).count()
            total_departments = self.db.query(Department).count()
            total_runs = self.db.query(PayrollRun).count()
            
            # 最近一个月的统计
            latest_period = self.db.query(PayrollPeriod).order_by(
                desc(PayrollPeriod.year),
                desc(PayrollPeriod.month)
            ).first()
            
            latest_period_stats = {}
            if latest_period:
                latest_run = self.db.query(PayrollRun).filter(
                    PayrollRun.period_id == latest_period.id
                ).order_by(desc(PayrollRun.initiated_at)).first()
                
                if latest_run:
                    run_response = self.generation_service._build_payroll_run_response(latest_run)
                    latest_period_stats = {
                        "period_name": latest_period.name,
                        "total_entries": run_response.total_entries,
                        "total_gross_pay": str(run_response.total_gross_pay),
                        "total_net_pay": str(run_response.total_net_pay),
                        "calculated_at": latest_run.calculated_at.isoformat() if latest_run.calculated_at else None
                    }
            
            return {
                "system_overview": {
                    "total_periods": total_periods,
                    "total_employees": total_employees,
                    "total_departments": total_departments,
                    "total_runs": total_runs
                },
                "latest_period": latest_period_stats,
                "report_templates_count": len(self.report_service._report_templates),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"获取系统统计失败: {e}", exc_info=True)
            raise
    
    def validate_period_for_generation(self, period_id: int) -> Dict[str, Any]:
        """验证期间是否可以生成工资"""
        try:
            period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == period_id
            ).first()
            
            if not period:
                return {
                    "valid": False,
                    "message": "工资期间不存在",
                    "details": {}
                }
            
            # 检查是否已锁定
            if period.is_locked:
                return {
                    "valid": False,
                    "message": "该期间已锁定，无法生成工资",
                    "details": {"is_locked": True}
                }
            
            # 检查是否有有效员工
            active_employees_count = self.db.query(Employee).filter(
                Employee.status_lookup_value_id.isnot(None)  # 假设有效员工有状态
            ).count()
            
            if active_employees_count == 0:
                return {
                    "valid": False,
                    "message": "没有有效员工，无法生成工资",
                    "details": {"active_employees_count": 0}
                }
            
            # 检查现有数据
            existing_runs = self.db.query(PayrollRun).filter(
                PayrollRun.period_id == period_id
            ).count()
            
            return {
                "valid": True,
                "message": "可以生成工资",
                "details": {
                    "period_name": period.name,
                    "active_employees_count": active_employees_count,
                    "existing_runs_count": existing_runs,
                    "is_locked": period.is_locked or False
                }
            }
            
        except Exception as e:
            logger.error(f"验证期间失败: {e}", exc_info=True)
            raise
    
    def get_available_source_periods(self, target_period_id: int) -> List[PayrollPeriodResponse]:
        """获取可作为复制源的期间列表"""
        try:
            # 获取目标期间信息
            target_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == target_period_id
            ).first()
            
            if not target_period:
                raise ValueError(f"目标期间 {target_period_id} 不存在")
            
            # 查找有数据的历史期间（排除目标期间）
            periods_with_data = self.db.query(PayrollPeriod).join(PayrollRun).filter(
                PayrollPeriod.id != target_period_id
            ).distinct().order_by(
                desc(PayrollPeriod.year),
                desc(PayrollPeriod.month)
            ).limit(6).all()  # 最近6个有数据的期间
            
            result = []
            for period in periods_with_data:
                # 获取最新运行信息
                latest_run = self.db.query(PayrollRun).filter(
                    PayrollRun.period_id == period.id
                ).order_by(desc(PayrollRun.initiated_at)).first()
                
                if latest_run and latest_run.calculated_at:  # 只返回已计算的期间
                    run_response = self.generation_service._build_payroll_run_response(latest_run)
                    
                    result.append(PayrollPeriodResponse(
                        id=period.id,
                        name=period.name,
                        year=period.year,
                        month=period.month,
                        status="calculated",
                        runs_count=1,
                        latest_run_at=latest_run.initiated_at,
                        is_locked=period.is_locked or False,
                        description=f"可复制数据：{run_response.total_entries}条记录",
                        total_entries=run_response.total_entries  # 额外信息
                    ))
            
            return result
            
        except Exception as e:
            logger.error(f"获取可复制期间列表失败: {e}", exc_info=True)
            raise
    
    def quick_status_check(self, period_id: Optional[int] = None) -> Dict[str, Any]:
        """快速状态检查（用于仪表板显示）"""
        try:
            # 如果没有指定期间，使用最新期间
            if not period_id:
                latest_period = self.db.query(PayrollPeriod).order_by(
                    desc(PayrollPeriod.year),
                    desc(PayrollPeriod.month)
                ).first()
                
                if not latest_period:
                    return {
                        "status": "no_data",
                        "message": "暂无工资期间数据",
                        "suggestions": ["请先创建工资期间"]
                    }
                
                period_id = latest_period.id
            
            # 获取期间信息
            period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == period_id
            ).first()
            
            if not period:
                return {
                    "status": "error",
                    "message": "指定的工资期间不存在",
                    "suggestions": []
                }
            
            # 检查该期间的工资运行
            latest_run = self.db.query(PayrollRun).filter(
                PayrollRun.period_id == period_id
            ).order_by(desc(PayrollRun.initiated_at)).first()
            
            if not latest_run:
                return {
                    "status": "ready_to_generate",
                    "message": f"{period.name} 尚未生成工资数据",
                    "period_name": period.name,
                    "suggestions": ["点击生成工资开始处理", "可以复制上月数据快速开始"]
                }
            
            # 检查运行状态
            if latest_run.calculated_at:
                # 获取审核状态
                try:
                    audit_summary = self.audit_service.get_audit_summary(latest_run.id)
                    if audit_summary.error_count > 0:
                        return {
                            "status": "needs_review",
                            "message": f"{period.name} 工资数据需要审核",
                            "period_name": period.name,
                            "latest_run_id": latest_run.id,
                            "error_count": audit_summary.error_count,
                            "warning_count": audit_summary.warning_count,
                            "suggestions": ["查看审核异常", "修复错误后重新审核"]
                        }
                    else:
                        return {
                            "status": "ready_to_approve",
                            "message": f"{period.name} 工资数据审核通过，可以审批",
                            "period_name": period.name,
                            "latest_run_id": latest_run.id,
                            "warning_count": audit_summary.warning_count,
                            "suggestions": ["审批工资数据", "生成报表"]
                        }
                except Exception:
                    return {
                        "status": "needs_audit",
                        "message": f"{period.name} 工资数据待审核",
                        "period_name": period.name,
                        "latest_run_id": latest_run.id,
                        "suggestions": ["执行工资审核", "查看数据详情"]
                    }
            else:
                return {
                    "status": "generating",
                    "message": f"{period.name} 工资数据生成中",
                    "period_name": period.name,
                    "latest_run_id": latest_run.id,
                    "suggestions": ["请等待生成完成"]
                }
            
        except Exception as e:
            logger.error(f"快速状态检查失败: {e}", exc_info=True)
            return {
                "status": "error",
                "message": "状态检查失败",
                "suggestions": ["请刷新页面重试"]
            }
    
    # =============================================================================
    # 审核相关方法
    # =============================================================================
    
    def run_payroll_audit(
        self, 
        payroll_run_id: int, 
        audit_type: str = "BASIC",
        auditor_id: int = 1,
        user_agent: str = None,
        ip_address: str = None
    ) -> Dict[str, Any]:
        """执行薪资审核"""
        try:
            logger.info(f"🔍 [SimplePayrollService.run_payroll_audit] 开始审核 - payroll_run_id={payroll_run_id}, audit_type={audit_type}")
            
            # 使用增强审核服务执行完整审核
            audit_result = self.enhanced_audit_service.run_comprehensive_audit(
                payroll_run_id=payroll_run_id,
                audit_type=audit_type,
                auditor_id=auditor_id,
                user_agent=user_agent,
                ip_address=ip_address
            )
            
            logger.info(f"✅ [SimplePayrollService.run_payroll_audit] 审核完成 - 状态: {audit_result.get('audit_status')}")
            return audit_result
            
        except Exception as e:
            logger.error(f"执行薪资审核失败: {e}", exc_info=True)
            raise
    
    def get_audit_summary(self, payroll_run_id: int) -> Optional[Dict[str, Any]]:
        """获取审核汇总信息"""
        try:
            return self.enhanced_audit_service.get_audit_summary(payroll_run_id)
        except Exception as e:
            logger.error(f"获取审核汇总失败: {e}", exc_info=True)
            raise
    
    def get_audit_anomalies(
        self, 
        payroll_run_id: int,
        anomaly_types: List[str] = None,
        severity: List[str] = None,
        page: int = 1,
        size: int = 50
    ) -> Dict[str, Any]:
        """获取审核异常列表"""
        try:
            return self.enhanced_audit_service.get_audit_anomalies(
                payroll_run_id=payroll_run_id,
                anomaly_types=anomaly_types,
                severity=severity,
                page=page,
                size=size
            )
        except Exception as e:
            logger.error(f"获取审核异常列表失败: {e}", exc_info=True)
            raise
    
    def ignore_audit_anomaly(
        self, 
        anomaly_id: str, 
        ignore_reason: str,
        user_id: int
    ) -> bool:
        """忽略审核异常"""
        try:
            from webapp.v2.models.audit import PayrollAuditAnomaly
            from datetime import datetime
            
            anomaly = self.db.query(PayrollAuditAnomaly).filter(
                PayrollAuditAnomaly.id == anomaly_id
            ).first()
            
            if not anomaly:
                raise ValueError(f"审核异常 {anomaly_id} 不存在")
            
            anomaly.is_ignored = True
            anomaly.ignore_reason = ignore_reason
            anomaly.ignored_by_user_id = user_id
            anomaly.ignored_at = datetime.now()
            
            self.db.commit()
            
            logger.info(f"✅ [SimplePayrollService.ignore_audit_anomaly] 异常已忽略 - anomaly_id={anomaly_id}")
            return True
            
        except Exception as e:
            logger.error(f"忽略审核异常失败: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def get_monthly_snapshots(
        self, 
        period_id: int,
        page: int = 1,
        size: int = 50
    ) -> Dict[str, Any]:
        """获取月度快照数据"""
        try:
            from webapp.v2.models.audit import MonthlyPayrollSnapshot
            
            query = self.db.query(MonthlyPayrollSnapshot).filter(
                MonthlyPayrollSnapshot.period_id == period_id
            ).order_by(MonthlyPayrollSnapshot.employee_code)
            
            total = query.count()
            snapshots = query.offset((page - 1) * size).limit(size).all()
            
            result = []
            for snapshot in snapshots:
                result.append({
                    'id': snapshot.id,
                    'employee_code': snapshot.employee_code,
                    'employee_name': snapshot.employee_name,
                    'department_name': snapshot.department_name,
                    'position_name': snapshot.position_name,
                    'gross_pay': float(snapshot.gross_pay),
                    'total_deductions': float(snapshot.total_deductions),
                    'net_pay': float(snapshot.net_pay),
                    'earnings_details': snapshot.earnings_details,
                    'deductions_details': snapshot.deductions_details,
                    'audit_status': snapshot.audit_status,
                    'snapshot_date': snapshot.snapshot_date.isoformat()
                })
            
            return {
                "data": result,
                "meta": {
                    "page": page,
                    "size": size,
                    "total": total,
                    "totalPages": (total + size - 1) // size
                }
            }
            
        except Exception as e:
            logger.error(f"获取月度快照失败: {e}", exc_info=True)
            raise 