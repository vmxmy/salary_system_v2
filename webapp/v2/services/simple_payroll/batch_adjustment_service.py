"""
批量调整服务
提供工资数据的批量修改、预览和执行功能
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, select, update
import asyncio

from webapp.v2.models import PayrollRun, PayrollEntry, Employee
from webapp.v2.pydantic_models.simple_payroll import (
    BatchAdjustmentRequest,
    BatchAdjustmentPreviewRequest,
    BatchAdjustmentRule,
    BatchAdjustmentResult,
    BatchAdjustmentPreview,
    AdjustmentEntry
)

logger = logging.getLogger(__name__)

class BatchAdjustmentService:
    """批量调整服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def preview_batch_adjustment(
        self, 
        request: BatchAdjustmentPreviewRequest
    ) -> BatchAdjustmentPreview:
        """
        预览批量调整结果
        
        Args:
            request: 批量调整预览请求
            
        Returns:
            BatchAdjustmentPreview: 预览结果
        """
        try:
            logger.info(f"开始预览批量调整 - 工资版本: {request.payroll_run_id}")
            
            # 验证工资版本存在
            payroll_run = self.db.get(PayrollRun, request.payroll_run_id)
            if not payroll_run:
                raise ValueError(f"工资版本 {request.payroll_run_id} 不存在")
            
            # 获取目标员工的工资条目
            affected_entries = await self._get_affected_entries(
                request.payroll_run_id,
                request.employee_codes,
                request.adjustment_rules
            )
            
            # 计算调整结果
            preview_entries = []
            for entry_data in affected_entries:
                preview_entry = await self._calculate_adjustment_preview(
                    entry_data,
                    request.adjustment_rules
                )
                preview_entries.extend(preview_entry)
            
            logger.info(f"预览完成 - 影响条目数: {len(preview_entries)}")
            
            return BatchAdjustmentPreview(
                affected_entries=preview_entries,
                total_affected=len(preview_entries)
            )
            
        except Exception as e:
            logger.error(f"预览批量调整失败: {str(e)}")
            raise

    async def execute_batch_adjustment(
        self, 
        request: BatchAdjustmentRequest
    ) -> BatchAdjustmentResult:
        """
        执行批量调整
        
        Args:
            request: 批量调整请求
            
        Returns:
            BatchAdjustmentResult: 执行结果
        """
        try:
            logger.info(f"开始执行批量调整 - 工资版本: {request.payroll_run_id}")
            
            # 验证工资版本存在且状态允许修改
            payroll_run = self.db.get(PayrollRun, request.payroll_run_id)
            if not payroll_run:
                raise ValueError(f"工资版本 {request.payroll_run_id} 不存在")
            
            if payroll_run.status not in ['DRAFT', 'IN_REVIEW']:
                raise ValueError("只能调整草稿或审核中状态的工资版本")
            
            # 获取目标员工的工资条目
            affected_entries = await self._get_affected_entries(
                request.payroll_run_id,
                request.employee_codes,
                request.adjustment_rules
            )
            
            # 执行批量调整
            updated_count = 0
            for entry in affected_entries:
                try:
                    await self._apply_adjustments(entry, request.adjustment_rules)
                    updated_count += 1
                except Exception as e:
                    logger.error(f"调整条目 {entry.id} 失败: {str(e)}")
                    continue
            
            # 提交事务
            self.db.commit()
            
            # 重新计算工资总额
            await self._recalculate_payroll_totals(request.payroll_run_id)
            
            logger.info(f"批量调整完成 - 成功调整 {updated_count} 条记录")
            
            return BatchAdjustmentResult(
                affected_count=updated_count,
                description=request.description or "批量调整"
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"执行批量调整失败: {str(e)}")
            raise

    async def _get_affected_entries(
        self,
        payroll_run_id: int,
        employee_codes: List[str],
        adjustment_rules: List[BatchAdjustmentRule]
    ) -> List[PayrollEntry]:
        """获取受影响的工资条目"""
        
        # 构建查询条件
        query = select(PayrollEntry).where(
            and_(
                PayrollEntry.payroll_run_id == payroll_run_id,
                PayrollEntry.employee_code.in_(employee_codes)
            )
        )
        
        result = self.db.execute(query)
        return result.scalars().all()

    async def _calculate_adjustment_preview(
        self,
        entry: PayrollEntry,
        adjustment_rules: List[BatchAdjustmentRule]
    ) -> List[AdjustmentEntry]:
        """计算单个条目的调整预览"""
        
        preview_entries = []
        
        for rule in adjustment_rules:
            try:
                # 获取组件当前值
                old_value = await self._get_component_value(entry, rule.component)
                
                # 计算新值
                new_value = await self._apply_rule_calculation(old_value, rule)
                
                # 创建预览条目
                preview_entry = AdjustmentEntry(
                    employee_code=entry.employee_code,
                    employee_name=entry.employee_name,
                    component_code=rule.component,
                    component_name=await self._get_component_name(rule.component),
                    old_value=float(old_value),
                    new_value=float(new_value),
                    difference=float(new_value - old_value)
                )
                
                # 只有值发生变化才添加到预览
                if abs(new_value - old_value) > 0.01:
                    preview_entries.append(preview_entry)
                    
            except Exception as e:
                logger.warning(f"计算条目 {entry.id} 规则 {rule.component} 预览失败: {str(e)}")
                continue
        
        return preview_entries

    async def _apply_adjustments(
        self,
        entry: PayrollEntry,
        adjustment_rules: List[BatchAdjustmentRule]
    ) -> None:
        """应用调整规则到工资条目"""
        
        updated_earnings = entry.earnings_details.copy() if entry.earnings_details else {}
        updated_deductions = entry.deductions_details.copy() if entry.deductions_details else {}
        
        for rule in adjustment_rules:
            try:
                # 获取组件类型
                component_type = await self._get_component_type(rule.component)
                
                if component_type == 'EARNING':
                    old_value = Decimal(str(updated_earnings.get(rule.component, 0)))
                    new_value = await self._apply_rule_calculation(old_value, rule)
                    updated_earnings[rule.component] = float(new_value)
                    
                elif component_type in ['DEDUCTION', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION']:
                    old_value = Decimal(str(updated_deductions.get(rule.component, 0)))
                    new_value = await self._apply_rule_calculation(old_value, rule)
                    updated_deductions[rule.component] = float(new_value)
                    
            except Exception as e:
                logger.warning(f"应用规则 {rule.component} 到条目 {entry.id} 失败: {str(e)}")
                continue
        
        # 更新数据库记录
        entry.earnings_details = updated_earnings
        entry.deductions_details = updated_deductions
        
        # 重新计算总额
        entry.gross_pay = sum(updated_earnings.values())
        entry.total_deductions = sum(updated_deductions.values())
        entry.net_pay = entry.gross_pay - entry.total_deductions
        
        self.db.add(entry)

    async def _apply_rule_calculation(
        self,
        old_value: Decimal,
        rule: BatchAdjustmentRule
    ) -> Decimal:
        """应用规则计算新值"""
        
        value = Decimal(str(rule.value))
        
        if rule.operation == 'add':
            return old_value + value
        elif rule.operation == 'subtract':
            return max(Decimal('0'), old_value - value)  # 避免负数
        elif rule.operation == 'multiply':
            # 百分比计算
            percentage = value / Decimal('100')
            return old_value * (Decimal('1') + percentage)
        elif rule.operation == 'set':
            return value
        else:
            raise ValueError(f"不支持的操作类型: {rule.operation}")

    async def _get_component_value(
        self,
        entry: PayrollEntry,
        component_code: str
    ) -> Decimal:
        """获取组件当前值"""
        
        # 先检查收入组件
        if entry.earnings_details and component_code in entry.earnings_details:
            return Decimal(str(entry.earnings_details[component_code]))
        
        # 再检查扣除组件
        if entry.deductions_details and component_code in entry.deductions_details:
            return Decimal(str(entry.deductions_details[component_code]))
        
        # 默认返回0
        return Decimal('0')

    async def _get_component_type(self, component_code: str) -> str:
        """获取组件类型（简化实现）"""
        
        # 简化实现：根据常见组件代码推断类型
        if component_code in ['basic_salary', 'performance_bonus', 'overtime_pay', 'allowances']:
            return 'EARNING'
        elif component_code in ['personal_tax', 'social_security', 'housing_fund', 'other_deductions']:
            return 'DEDUCTION'
        else:
            # 默认假设为收入项
            return 'EARNING'

    async def _get_component_name(self, component_code: str) -> str:
        """获取组件名称（简化实现）"""
        
        # 简化实现：返回代码作为名称
        name_mapping = {
            'basic_salary': '基本工资',
            'performance_bonus': '绩效奖金',
            'overtime_pay': '加班费',
            'allowances': '津贴补贴',
            'personal_tax': '个人所得税',
            'social_security': '社保费用',
            'housing_fund': '住房公积金',
            'other_deductions': '其他扣除'
        }
        return name_mapping.get(component_code, component_code)

    async def _recalculate_payroll_totals(self, payroll_run_id: int) -> None:
        """重新计算工资版本总额"""
        
        try:
            # 获取所有条目的统计
            query = select(
                PayrollEntry.gross_pay,
                PayrollEntry.total_deductions,
                PayrollEntry.net_pay
            ).where(PayrollEntry.payroll_run_id == payroll_run_id)
            
            result = self.db.execute(query)
            entries = result.all()
            
            if entries:
                total_gross = sum(entry.gross_pay or 0 for entry in entries)
                total_deductions = sum(entry.total_deductions or 0 for entry in entries)
                total_net = sum(entry.net_pay or 0 for entry in entries)
                
                # 更新工资版本统计
                update_stmt = update(PayrollRun).where(
                    PayrollRun.id == payroll_run_id
                ).values(
                    total_gross_pay=total_gross,
                    total_deductions=total_deductions,
                    total_net_pay=total_net
                )
                
                self.db.execute(update_stmt)
                
        except Exception as e:
            logger.error(f"重新计算工资总额失败: {str(e)}")
            raise

    async def get_adjustment_history(
        self,
        payroll_run_id: int,
        page: int = 1,
        size: int = 20
    ) -> Dict[str, Any]:
        """获取调整历史记录"""
        
        # 这里可以实现调整历史记录的查询
        # 暂时返回空列表
        return {
            "items": [],
            "total": 0,
            "page": page,
            "size": size
        } 