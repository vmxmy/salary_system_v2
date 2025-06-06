"""
工资生成服务模块
处理Excel导入、复制上月数据、批量调整等工资生成相关业务逻辑
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime
from decimal import Decimal
import logging

from ...models import PayrollRun, PayrollEntry, PayrollPeriod, Employee
from ...pydantic_models.simple_payroll import (
    PayrollGenerationRequest, PayrollRunResponse, BatchAdjustment
)

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
            
            # 创建新的工资运行记录
            new_run = PayrollRun(
                period_id=request.period_id,
                description=request.description or f"通过{request.generation_type}方式生成",
                initiated_by_user_id=user_id,
                initiated_at=datetime.now()
            )
            self.db.add(new_run)
            self.db.commit()
            self.db.refresh(new_run)
            
            # 根据生成类型执行不同逻辑
            if request.generation_type == "copy_previous":
                affected_count = self._copy_previous_entries(new_run, request.source_data)
                logger.info(f"复制上月数据完成，影响 {affected_count} 条记录")
            elif request.generation_type == "import":
                self._import_excel_entries(new_run, request.source_data)
                logger.info("Excel导入功能执行完成")
            elif request.generation_type == "manual":
                self._create_manual_entries(new_run, request.source_data)
                logger.info("手动创建功能执行完成")
            else:
                raise ValueError(f"不支持的生成类型: {request.generation_type}")
            
            # 更新运行状态
            new_run.calculated_at = datetime.now()
            self.db.commit()
            
            # 返回创建的运行记录
            return self._build_payroll_run_response(new_run)
            
        except Exception as e:
            logger.error(f"生成工资数据失败: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def copy_previous_payroll(
        self,
        target_period_id: int,
        source_period_id: int,
        description: str,
        user_id: int
    ) -> PayrollRunResponse:
        """复制上月工资数据的完整实现"""
        try:
            # 验证目标期间
            target_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == target_period_id
            ).first()
            if not target_period:
                raise ValueError(f"目标期间 {target_period_id} 不存在")
            
            # 验证源期间
            source_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == source_period_id
            ).first()
            if not source_period:
                raise ValueError(f"源期间 {source_period_id} 不存在")
            
            # 检查目标期间是否已有数据
            existing_run = self.db.query(PayrollRun).filter(
                PayrollRun.period_id == target_period_id
            ).first()
            if existing_run:
                logger.warning(f"目标期间 {target_period_id} 已存在数据，将创建新版本")
            
            # 获取源期间的最新工资运行
            source_run = self.db.query(PayrollRun).filter(
                PayrollRun.period_id == source_period_id
            ).order_by(desc(PayrollRun.initiated_at)).first()
            
            if not source_run:
                raise ValueError(f"源期间 {source_period_id} 没有工资数据可复制")
            
            # 创建新的工资运行记录
            new_run = PayrollRun(
                period_id=target_period_id,
                description=description,
                initiated_by_user_id=user_id,
                initiated_at=datetime.now()
            )
            self.db.add(new_run)
            self.db.commit()
            self.db.refresh(new_run)
            
            # 获取所有源工资条目
            source_entries = self.db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == source_run.id
            ).all()
            
            if not source_entries:
                logger.warning(f"源期间 {source_period_id} 没有工资条目数据")
                new_run.calculated_at = datetime.now()
                self.db.commit()
                return self._build_payroll_run_response(new_run)
            
            # 批量复制工资条目
            copied_count = 0
            skipped_count = 0
            
            for source_entry in source_entries:
                try:
                    # 验证员工是否仍然有效
                    employee = self.db.query(Employee).filter(
                        Employee.id == source_entry.employee_id
                    ).first()
                    
                    if not employee:
                        logger.warning(f"跳过无效员工 ID: {source_entry.employee_id}")
                        skipped_count += 1
                        continue
                    
                    # 创建新的工资条目
                    new_entry = PayrollEntry(
                        payroll_run_id=new_run.id,
                        employee_id=source_entry.employee_id,
                        gross_pay=source_entry.gross_pay,
                        net_pay=source_entry.net_pay,
                        # 深拷贝JSONB字段
                        earnings_details=dict(source_entry.earnings_details) if source_entry.earnings_details else {},
                        deductions_details=dict(source_entry.deductions_details) if source_entry.deductions_details else {},
                        calculation_inputs=dict(source_entry.calculation_inputs) if source_entry.calculation_inputs else {},
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    self.db.add(new_entry)
                    copied_count += 1
                    
                    # 每100条提交一次，提高性能
                    if copied_count % 100 == 0:
                        self.db.commit()
                        logger.info(f"已复制 {copied_count} 条记录...")
                        
                except Exception as e:
                    logger.error(f"复制员工 {source_entry.employee_id} 的工资记录失败: {e}")
                    skipped_count += 1
                    continue
            
            # 最终提交并更新状态
            new_run.calculated_at = datetime.now()
            self.db.commit()
            
            logger.info(f"复制工资数据完成: 成功 {copied_count} 条，跳过 {skipped_count} 条")
            
            return self._build_payroll_run_response(new_run)
            
        except Exception as e:
            logger.error(f"复制工资数据失败: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def _copy_previous_entries(self, new_run: PayrollRun, source_data: Optional[Dict[str, Any]]) -> int:
        """复制上月条目的内部方法"""
        if not source_data or not source_data.get("source_period_id"):
            raise ValueError("复制上月数据需要提供源期间ID")
        
        source_period_id = source_data["source_period_id"]
        
        # 获取源期间的最新运行
        source_run = self.db.query(PayrollRun).filter(
            PayrollRun.period_id == source_period_id
        ).order_by(desc(PayrollRun.initiated_at)).first()
        
        if not source_run:
            raise ValueError(f"源期间 {source_period_id} 没有可复制的数据")
        
        # 获取所有有效员工ID（优化查询）
        valid_employee_ids = set(
            emp.id for emp in self.db.query(Employee.id).filter(
                Employee.status_lookup_value_id.isnot(None)  # 假设有效员工有状态
            ).all()
        )
        
        # 复制条目逻辑
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
                employee_id=entry.employee_id,
                gross_pay=entry.gross_pay,
                net_pay=entry.net_pay,
                earnings_details=dict(entry.earnings_details) if entry.earnings_details else {},
                deductions_details=dict(entry.deductions_details) if entry.deductions_details else {},
                calculation_inputs=dict(entry.calculation_inputs) if entry.calculation_inputs else {},
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            self.db.add(new_entry)
            copied_count += 1
        
        return copied_count
    
    def _import_excel_entries(self, new_run: PayrollRun, source_data: Optional[Dict[str, Any]]):
        """Excel导入条目的内部方法"""
        if not source_data or not source_data.get("file_data"):
            logger.info("Excel导入：未提供文件数据，创建空的工资运行")
            return
            
        file_data = source_data["file_data"]
        logger.info(f"Excel导入：处理 {len(file_data)} 行数据")
        
        # TODO: 实现Excel数据解析和导入逻辑
        # 这里应该：
        # 1. 验证Excel数据格式
        # 2. 匹配员工信息
        # 3. 解析薪资组件
        # 4. 创建PayrollEntry记录
        logger.warning("Excel导入功能详细逻辑待实现")
    
    def _create_manual_entries(self, new_run: PayrollRun, source_data: Optional[Dict[str, Any]]):
        """手动创建条目的内部方法"""
        if not source_data or not source_data.get("initial_entries"):
            logger.info("手动创建：未提供初始数据，创建空的工资运行")
            return
            
        initial_entries = source_data["initial_entries"]
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
        period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == run.period_id).first()
        period_name = period.name if period else "未知期间"
        
        # 获取发起人用户名
        from ...models import User
        user = self.db.query(User).filter(User.id == run.initiated_by_user_id).first()
        initiated_by_username = user.username if user else "未知用户"
        
        # 计算统计数据
        entries_query = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == run.id
        )
        entries_count = entries_query.count()
        
        # 计算金额汇总
        total_gross_pay = Decimal('0.00')
        total_net_pay = Decimal('0.00')
        total_deductions = Decimal('0.00')
        
        if entries_count > 0:
            for entry in entries_query.all():
                total_gross_pay += entry.gross_pay or Decimal('0.00')
                total_net_pay += entry.net_pay or Decimal('0.00')
                total_deductions += (entry.gross_pay or Decimal('0.00')) - (entry.net_pay or Decimal('0.00'))
        
        # 计算版本号（在同期间中的排序）
        version_number = self.db.query(PayrollRun).filter(
            and_(
                PayrollRun.period_id == run.period_id,
                PayrollRun.initiated_at >= run.initiated_at
            )
        ).count()
        
        return PayrollRunResponse(
            id=run.id,
            period_id=run.period_id,
            period_name=period_name,
            version_number=version_number,
            status_id=1,
            status_name="草稿",
            total_entries=entries_count,
            total_gross_pay=total_gross_pay,
            total_net_pay=total_net_pay,
            total_deductions=total_deductions,
            initiated_by_user_id=run.initiated_by_user_id,
            initiated_by_username=initiated_by_username,
            initiated_at=run.initiated_at,
            calculated_at=run.calculated_at,
            approved_at=None,  # PayrollRun 模型没有 approved_at 字段
            description=f"工资运行 #{version_number}"  # 移除对不存在字段的引用
        ) 