"""
工资生成服务模块
处理Excel导入、复制上月数据、批量调整等工资生成相关业务逻辑
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from datetime import datetime
from decimal import Decimal
import logging

from ...models import PayrollRun, PayrollEntry, PayrollPeriod, Employee
from ...pydantic_models.simple_payroll import (
    PayrollGenerationRequest, PayrollRunResponse, BatchAdjustment, PayrollSourceData
)
from .employee_salary_config_service import EmployeeSalaryConfigService

logger = logging.getLogger(__name__)

class PayrollGenerationService:
    """工资生成服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_payroll(
        self, 
        request: PayrollGenerationRequest, 
        user_id: int
    ) -> PayrollRunResponse:
        """生成工资数据"""
        try:
            # 验证期间是否存在
            period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == request.period_id
            ).first()
            if not period:
                raise ValueError(f"工资期间 {request.period_id} 不存在")
            
            # 🎯 修改逻辑：优先使用现有工资运行，而不是总是创建新的
            existing_run = self.db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == request.period_id
            ).first()
            
            if existing_run:
                logger.info(f"✅ [生成工资数据] 使用现有工资运行: ID={existing_run.id}, 期间ID={request.period_id}")
                # 清空现有工资条目（如果有的话）
                existing_entries_count = self.db.query(PayrollEntry).filter(
                    PayrollEntry.payroll_run_id == existing_run.id
                ).count()
                if existing_entries_count > 0:
                    logger.info(f"🗑️ [生成工资数据] 清理现有 {existing_entries_count} 条工资条目...")
                    from ...models.payroll import PayrollEntry
                    self.db.query(PayrollEntry).filter(
                        PayrollEntry.payroll_run_id == existing_run.id
                    ).delete()
                    self.db.commit()
                    logger.info(f"✅ [生成工资数据] 已清理现有工资条目")
                # 重置工资运行状态
                existing_run.status_lookup_value_id = 60  # 待计算状态
                existing_run.run_date = datetime.now().date()
                existing_run.initiated_by_user_id = user_id
                self.db.commit()
                target_run = existing_run
            else:
                logger.info(f"📝 [生成工资数据] 期间无现有工资运行，创建新的...")
                # 创建新的工资运行记录
                target_run = PayrollRun(
                    payroll_period_id=request.period_id,
                    run_date=datetime.now().date(),
                    status_lookup_value_id=60, # 待计算状态
                    initiated_by_user_id=user_id
                )
                self.db.add(target_run)
                self.db.commit()
                self.db.refresh(target_run)
                logger.info(f"✅ [生成工资数据] 创建新工资运行: ID={target_run.id}, 期间ID={request.period_id}")
            
            logger.info(f"🎯 [生成工资数据] 使用目标工资运行: ID={target_run.id}, 期间ID={request.period_id}")
            
            # 根据生成类型执行不同逻辑
            if request.generation_type == "copy_previous":
                affected_count = self._copy_previous_entries(target_run, request.source_data)
                logger.info(f"复制上月数据完成，影响 {affected_count} 条记录")
            elif request.generation_type == "import":
                self._import_excel_entries(target_run, request.source_data)
                logger.info("Excel导入功能执行完成")
            elif request.generation_type == "manual":
                self._create_manual_entries(target_run, request.source_data)
                logger.info("手动创建功能执行完成")
            else:
                raise ValueError(f"不支持的生成类型: {request.generation_type}")
            
            # 更新运行状态
            target_run.calculated_at = datetime.now()
            self.db.commit()
            
            # 返回创建的运行记录
            return self._build_payroll_run_response(target_run)
            
        except Exception as e:
            logger.error(f"生成工资数据失败: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def check_existing_data(
        self,
        target_period_id: int
    ) -> Dict[str, Any]:
        """
        检查目标期间是否已有数据
        
        Returns:
            检查结果，包含现有数据的详细信息
        """
        try:
            logger.info(f"🔍 [检查现有数据] 检查期间 {target_period_id} 的现有数据")
            
            # 检查工资运行记录
            existing_runs = self.db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == target_period_id
            ).all()
            
            payroll_data_info = {
                "has_data": len(existing_runs) > 0,
                "runs_count": len(existing_runs),
                "runs": []
            }
            
            total_entries = 0
            for run in existing_runs:
                from ...models.payroll import PayrollEntry
                entries_count = self.db.query(PayrollEntry).filter(
                    PayrollEntry.payroll_run_id == run.id
                ).count()
                total_entries += entries_count
                
                # 获取状态信息
                from ...models.config import LookupValue
                status = self.db.query(LookupValue).filter(
                    LookupValue.id == run.status_lookup_value_id
                ).first()
                
                payroll_data_info["runs"].append({
                    "id": run.id,
                    "run_date": run.run_date.isoformat() if run.run_date else None,
                    "status_name": status.name if status else "未知状态",
                    "entries_count": entries_count,
                    "total_gross_pay": float(run.total_gross_pay or 0),
                    "total_net_pay": float(run.total_net_pay or 0)
                })
            
            payroll_data_info["total_entries"] = total_entries
            
            # 检查员工薪资配置
            target_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == target_period_id
            ).first()
            
            if target_period:
                from ...models.payroll_config import EmployeeSalaryConfig
                existing_configs = self.db.query(EmployeeSalaryConfig).filter(
                    and_(
                        EmployeeSalaryConfig.is_active == True,
                        EmployeeSalaryConfig.effective_date <= target_period.end_date,
                        or_(
                            EmployeeSalaryConfig.end_date.is_(None),
                            EmployeeSalaryConfig.end_date >= target_period.start_date
                        )
                    )
                ).all()
                
                salary_config_info = {
                    "has_data": len(existing_configs) > 0,
                    "configs_count": len(existing_configs),
                    "employees_with_configs": len(set(config.employee_id for config in existing_configs))
                }
            else:
                salary_config_info = {
                    "has_data": False,
                    "configs_count": 0,
                    "employees_with_configs": 0
                }
            
            result = {
                "target_period_id": target_period_id,
                "target_period_name": target_period.name if target_period else "未知期间",
                "has_any_data": payroll_data_info["has_data"] or salary_config_info["has_data"],
                "payroll_data": payroll_data_info,
                "salary_configs": salary_config_info,
                "summary": {
                    "total_payroll_runs": payroll_data_info["runs_count"],
                    "total_payroll_entries": payroll_data_info["total_entries"],
                    "total_salary_configs": salary_config_info["configs_count"],
                    "employees_with_configs": salary_config_info["employees_with_configs"]
                }
            }
            
            logger.info(f"✅ [检查现有数据] 检查完成: 工资记录={payroll_data_info['runs_count']}个运行/{payroll_data_info['total_entries']}条条目, 薪资配置={salary_config_info['configs_count']}条")
            return result
            
        except Exception as e:
            logger.error(f"💥 [检查现有数据] 检查失败: {e}", exc_info=True)
            raise

    def copy_previous_payroll(
        self,
        target_period_id: int,
        source_period_id: int,
        description: str,
        user_id: int,
        force_overwrite: bool = False
    ) -> PayrollRunResponse:
        """复制上月工资数据的完整实现"""
        try:
            logger.info(f"🚀 [复制工资数据] 开始复制操作: 从期间 {source_period_id} 到期间 {target_period_id}, 用户ID: {user_id}, 描述: {description}, 强制覆盖: {force_overwrite}")
            
            # 验证目标期间
            target_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == target_period_id
            ).first()
            if not target_period:
                logger.error(f"❌ [复制工资数据] 目标期间不存在: {target_period_id}")
                raise ValueError(f"目标期间 {target_period_id} 不存在")
            
            logger.info(f"✅ [复制工资数据] 目标期间验证通过: {target_period.name} (ID: {target_period_id})")
            
            # 验证源期间
            source_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == source_period_id
            ).first()
            if not source_period:
                logger.error(f"❌ [复制工资数据] 源期间不存在: {source_period_id}")
                raise ValueError(f"源期间 {source_period_id} 不存在")
            
            logger.info(f"✅ [复制工资数据] 源期间验证通过: {source_period.name} (ID: {source_period_id})")
            
            # 智能检查现有数据 - 只检查实际的工资条目
            if not force_overwrite:
                existing_data = self.check_existing_data(target_period_id)
                # 修改逻辑：只有当存在实际工资条目时才需要确认
                if existing_data["payroll_data"]["total_entries"] > 0:
                    logger.warning(f"⚠️ [复制工资数据] 目标期间存在 {existing_data['payroll_data']['total_entries']} 条工资条目，需要用户确认")
                    # 返回特殊响应，要求前端显示确认对话框
                    raise ValueError(f"CONFIRMATION_REQUIRED:{existing_data}")
                else:
                    logger.info(f"✅ [复制工资数据] 目标期间虽有配置数据但无工资条目，可以安全复制")
            
            # 检查目标期间是否已有数据（原有逻辑保留用于日志）
            existing_run = self.db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == target_period_id
            ).first()
            if existing_run:
                logger.warning(f"⚠️ [复制工资数据] 目标期间 {target_period_id} 已存在数据，执行强制覆盖/新版本创建")
            else:
                logger.info(f"✅ [复制工资数据] 目标期间 {target_period_id} 无现有数据，可以安全创建")
            
            # 获取源期间的最新工资运行
            source_run = self.db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == source_period_id
            ).order_by(desc(PayrollRun.run_date)).first()
            
            if not source_run:
                logger.error(f"❌ [复制工资数据] 源期间没有工资运行数据: {source_period_id}")
                raise ValueError(f"源期间 {source_period_id} 没有工资数据可复制")
            
            logger.info(f"✅ [复制工资数据] 找到源工资运行: ID={source_run.id}, 运行日期={source_run.run_date}, 状态ID={source_run.status_lookup_value_id}")
            
            # 🎯 修改逻辑：优先使用现有工资运行，而不是总是创建新的
            # 使用最新的工资运行记录，并清理可能的重复记录
            target_runs = self.db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == target_period_id
            ).order_by(desc(PayrollRun.run_date)).all()

            if target_runs:
                # 如果存在多条记录，保留最新的，删除旧的
                target_run = target_runs[0]  # 最新的记录
                
                if len(target_runs) > 1:
                    logger.warning(f"⚠️ [复制工资数据] 发现期间 {target_period_id} 存在 {len(target_runs)} 条工资运行记录，保留最新记录ID={target_run.id}，清理旧记录")
                    
                    # 删除旧的工资运行记录及其相关条目
                    for old_run in target_runs[1:]:
                        logger.info(f"🗑️ [复制工资数据] 删除旧工资运行: ID={old_run.id}")
                        # 先删除相关的工资条目
                        self.db.query(PayrollEntry).filter(
                            PayrollEntry.payroll_run_id == old_run.id
                        ).delete()
                        # 再删除工资运行记录
                        self.db.delete(old_run)
                    
                    self.db.commit()
                    logger.info(f"✅ [复制工资数据] 已清理 {len(target_runs) - 1} 条重复的工资运行记录")
                
                logger.info(f"✅ [复制工资数据] 使用现有工资运行: ID={target_run.id}, 期间ID={target_period_id}")
                
                # 清空现有工资条目（如果有的话）
                existing_entries_count = self.db.query(PayrollEntry).filter(
                    PayrollEntry.payroll_run_id == target_run.id
                ).count()
                if existing_entries_count > 0:
                    logger.info(f"🗑️ [复制工资数据] 清理现有 {existing_entries_count} 条工资条目...")
                    self.db.query(PayrollEntry).filter(
                        PayrollEntry.payroll_run_id == target_run.id
                    ).delete()
                    self.db.commit()
                    logger.info(f"✅ [复制工资数据] 已清理现有工资条目")
                
                # 重置工资运行状态为待计算
                target_run.status_lookup_value_id = 60
                target_run.run_date = datetime.now().date()
                target_run.initiated_by_user_id = user_id
                self.db.commit()
            else:
                logger.info(f"📝 [复制工资数据] 目标期间无现有工资运行，创建新的...")
                # 创建新的工资运行记录
                target_run = PayrollRun(
                    payroll_period_id=target_period_id,
                    run_date=datetime.now().date(),
                    status_lookup_value_id=60, # 待计算状态
                    initiated_by_user_id=user_id
                )
                self.db.add(target_run)
                self.db.commit()
                self.db.refresh(target_run)
                logger.info(f"✅ [复制工资数据] 创建新工资运行: ID={target_run.id}, 期间ID={target_period_id}, 状态=待计算(60)")
            
            logger.info(f"🎯 [复制工资数据] 使用目标工资运行: ID={target_run.id}, 期间ID={target_period_id}")
            
            # 获取所有源工资条目
            source_entries = self.db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == source_run.id
            ).all()
            
            logger.info(f"📋 [复制工资数据] 源工资条目统计: 总数={len(source_entries)}")
            
            if not source_entries:
                logger.warning(f"⚠️ [复制工资数据] 源期间 {source_period_id} 没有工资条目数据，保持目标运行为空")
                target_run.calculated_at = datetime.now()
                self.db.commit()
                return self._build_payroll_run_response(target_run)
            
            # 批量复制工资条目
            copied_count = 0
            skipped_count = 0
            
            logger.info(f"⚡ [复制工资数据] 开始批量复制 {len(source_entries)} 条工资条目...")
            
            for index, source_entry in enumerate(source_entries):
                try:
                    # 验证员工是否仍然有效
                    employee = self.db.query(Employee).filter(
                        Employee.id == source_entry.employee_id
                    ).first()
                    
                    if not employee:
                        logger.warning(f"⚠️ [复制工资数据] 跳过无效员工 ID: {source_entry.employee_id}")
                        skipped_count += 1
                        continue
                    
                    # 创建新的工资条目
                    new_entry = PayrollEntry(
                        payroll_run_id=target_run.id,
                        payroll_period_id=target_run.payroll_period_id,
                        employee_id=source_entry.employee_id,
                        gross_pay=source_entry.gross_pay,
                        total_deductions=source_entry.total_deductions,
                        net_pay=source_entry.net_pay,
                        # 深拷贝JSONB字段
                        earnings_details=dict(source_entry.earnings_details) if source_entry.earnings_details else {},
                        deductions_details=dict(source_entry.deductions_details) if source_entry.deductions_details else {},
                        calculation_inputs=dict(source_entry.calculation_inputs) if source_entry.calculation_inputs else {},
                        status_lookup_value_id=60,  # 待计算状态
                        calculated_at=datetime.now()
                    )
                    self.db.add(new_entry)
                    copied_count += 1
                    
                    # 每100条提交一次，提高性能
                    if copied_count % 100 == 0:
                        self.db.commit()
                        logger.info(f"📊 [复制工资数据] 进度更新: 已复制 {copied_count}/{len(source_entries)} 条记录...")
                        
                except Exception as e:
                    logger.error(f"❌ [复制工资数据] 复制员工 {source_entry.employee_id} 的工资记录失败: {e}")
                    skipped_count += 1
                    continue
            
            # 复制员工薪资配置（包括社保和公积金基数）
            logger.info(f"💰 [复制工资数据] 开始复制员工薪资配置...")
            try:
                salary_config_service = EmployeeSalaryConfigService(self.db)
                config_result = salary_config_service.copy_salary_configs_for_period(
                    source_period_id=source_period_id,
                    target_period_id=target_period_id,
                    user_id=user_id
                )
                logger.info(f"✅ [复制工资数据] 薪资配置复制结果: {config_result['message']}")
            except Exception as e:
                logger.error(f"❌ [复制工资数据] 复制薪资配置失败: {e}")
                # 薪资配置复制失败不影响主流程，但要记录错误
            
            # 最终提交并更新状态
            target_run.calculated_at = datetime.now()
            self.db.commit()
            
            logger.info(f"🎉 [复制工资数据] 复制操作完成: 成功复制 {copied_count} 条，跳过 {skipped_count} 条")
            logger.info(f"📈 [复制工资数据] 复制统计: 源期间={source_period.name}, 目标期间={target_period.name}, 目标运行ID={target_run.id}")
            
            return self._build_payroll_run_response(target_run)
            
        except Exception as e:
            logger.error(f"💥 [复制工资数据] 复制操作失败: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def _copy_previous_entries(self, new_run: PayrollRun, source_data: Optional['PayrollSourceData']) -> int:
        """复制上月条目的内部方法"""
        if not source_data or not source_data.source_period_id:
            raise ValueError("复制上月数据需要提供源期间ID")
        
        source_period_id = source_data.source_period_id
        
        # 获取源期间的最新运行
        source_run = self.db.query(PayrollRun).filter(
            PayrollRun.payroll_period_id == source_period_id
        ).order_by(desc(PayrollRun.run_date)).first()
        
        if not source_run:
            raise ValueError(f"源期间 {source_period_id} 没有可复制的数据")
        
        # 获取所有有效员工ID（优化查询）
        from ...models.hr import Employee
        valid_employee_ids = set(
            emp.id for emp in self.db.query(Employee.id).filter(
                Employee.status_lookup_value_id.isnot(None)  # 假设有效员工有状态
            ).all()
        )
        
        # 复制条目逻辑
        from ...models.payroll import PayrollEntry
        source_entries = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == source_run.id
        ).all()
        
        copied_count = 0
        for entry in source_entries:
            # 只复制有效员工的记录
            if entry.employee_id not in valid_employee_ids:
                logger.debug(f"跳过无效员工 {entry.employee_id} 的记录")
                continue
                
            new_entry = PayrollEntry(
                payroll_run_id=new_run.id,
                payroll_period_id=new_run.payroll_period_id,
                employee_id=entry.employee_id,
                gross_pay=entry.gross_pay,
                total_deductions=entry.total_deductions,
                net_pay=entry.net_pay,
                earnings_details=dict(entry.earnings_details) if entry.earnings_details else {},
                deductions_details=dict(entry.deductions_details) if entry.deductions_details else {},
                calculation_inputs=dict(entry.calculation_inputs) if entry.calculation_inputs else {},
                status_lookup_value_id=60  # 待计算状态
            )
            self.db.add(new_entry)
            copied_count += 1
        
        return copied_count
    
    def _import_excel_entries(self, new_run: PayrollRun, source_data: Optional['PayrollSourceData']):
        """Excel导入条目的内部方法"""
        if not source_data or not source_data.file_data:
            logger.info("Excel导入：未提供文件数据，创建空的工资运行")
            return
            
        file_data = source_data.file_data
        logger.info(f"Excel导入：处理 {len(file_data)} 行数据")
        
        # TODO: 实现Excel数据解析和导入逻辑
        # 这里应该：
        # 1. 验证Excel数据格式
        # 2. 匹配员工信息
        # 3. 解析薪资组件
        # 4. 创建PayrollEntry记录
        logger.warning("Excel导入功能详细逻辑待实现")
    
    def _create_manual_entries(self, new_run: PayrollRun, source_data: Optional['PayrollSourceData']):
        """手动创建条目的内部方法"""
        if not source_data or not source_data.initial_entries:
            logger.info("手动创建：未提供初始数据，创建空的工资运行")
            return
            
        initial_entries = source_data.initial_entries
        logger.info(f"手动创建：处理 {len(initial_entries)} 条初始记录")
        
        # TODO: 实现手动创建逻辑
        # 这里应该：
        # 1. 验证员工ID有效性
        # 2. 验证薪资数据格式
        # 3. 创建PayrollEntry记录
        logger.warning("手动创建功能详细逻辑待实现")
    
    def _build_payroll_run_response(self, run: PayrollRun) -> PayrollRunResponse:
        """构建工资运行响应模型"""
        # 获取期间名称
        period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == run.payroll_period_id).first()
        period_name = period.name if period else "未知期间"
        
        # 获取状态信息
        from ...models.config import LookupValue
        status = self.db.query(LookupValue).filter(LookupValue.id == run.status_lookup_value_id).first()
        
        # 计算版本号（同一期间内按时间排序的序号）
        version_number = self.db.query(PayrollRun).filter(
            and_(
                PayrollRun.payroll_period_id == run.payroll_period_id,
                PayrollRun.run_date >= run.run_date
            )
        ).count()
        
        # 计算实际工资条目数量
        from ...models.payroll import PayrollEntry
        total_entries = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == run.id
        ).count()
        
        logger.info(f"📊 [构建响应] 工资运行ID={run.id}, 期间={period_name}, 条目数={total_entries}")
        
        return PayrollRunResponse(
            id=run.id,
            period_id=run.payroll_period_id,
            period_name=period_name,
            version_number=version_number,
            status_id=run.status_lookup_value_id,
            status_name=status.name if status else "未知状态",
            total_entries=total_entries,  # 实际工资条目数量
            total_gross_pay=run.total_gross_pay or Decimal('0.00'),
            total_net_pay=run.total_net_pay or Decimal('0.00'),
            total_deductions=run.total_deductions or Decimal('0.00'),
            initiated_by_user_id=run.initiated_by_user_id or 0,
            initiated_by_username="系统",  # 暂时设为系统
            initiated_at=run.run_date,
            calculated_at=None,
            approved_at=None,
            description=None
        ) 