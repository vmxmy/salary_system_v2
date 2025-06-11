"""
薪资计算CRUD操作
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from datetime import datetime, date, timezone
import uuid
from decimal import Decimal
import logging
import json

from ..models import (
    PayrollRun, Employee, Department, 
    EmployeeSalaryConfig, AttendanceRecord, AttendancePeriod,
    CalculationRuleSet, CalculationRule, CalculationLog,
    PayrollEntry, LookupValue, LookupType
)
from ..pydantic_models.payroll_calculation import CalculationSummary, CalculationStatusEnum
from ..payroll_engine.simple_calculator import ComponentType, CalculationResult, CalculationStatus, CalculationComponent


logger = logging.getLogger(__name__)

class PayrollCalculationCRUD:
    """薪资计算CRUD操作类"""
    
    def __init__(self, db: Session):
        self.db = db
        self.calculated_entry_status_id: Optional[int] = None
        self.error_entry_status_id: Optional[int] = None
        self._initialize_status_ids()
    
    def _initialize_status_ids(self):
        try:
            payroll_entry_status_type = self.db.query(LookupType).filter(LookupType.code == "PAYROLL_ENTRY_STATUS").first()
            if not payroll_entry_status_type:
                logger.error("CRUD INIT ERROR: LookupType 'PAYROLL_ENTRY_STATUS' not found.")
                # Consider raising an exception or handling this state
                return

            calculated_value = self.db.query(LookupValue).filter(
                LookupValue.lookup_type_id == payroll_entry_status_type.id,
                LookupValue.code == "CALCULATED_ENTRY"
            ).first()
            if calculated_value:
                self.calculated_entry_status_id = calculated_value.id
            else:
                logger.error("CRUD INIT ERROR: LookupValue 'CALCULATED_ENTRY' for type 'PAYROLL_ENTRY_STATUS' not found.")

            error_value = self.db.query(LookupValue).filter(
                LookupValue.lookup_type_id == payroll_entry_status_type.id,
                LookupValue.code == "ERROR_ENTRY"
            ).first()
            if error_value:
                self.error_entry_status_id = error_value.id
            else:
                logger.error("CRUD INIT ERROR: LookupValue 'ERROR_ENTRY' for type 'PAYROLL_ENTRY_STATUS' not found.")
        except Exception as e:
            logger.error(f"CRUD INIT ERROR: Failed to initialize payroll entry status IDs: {e}")
    
    def _get_component_amount_by_code(self, components: List[CalculationComponent], code: str) -> Decimal:
        """Helper to get component amount by code, defaults to 0.00 if not found or amount is None."""
        if components is None: # Add a check for None components list
            return Decimal("0.00")
        for comp in components:
            if comp.component_code == code and comp.amount is not None:
                try:
                    return Decimal(str(comp.amount))
                except Exception:
                    logger.warning(f"CRUD: Could not convert component {code} amount '{comp.amount}' to Decimal.")
                    return Decimal("0.00")
        return Decimal("0.00")
    
    def get_payroll_run(self, payroll_run_id: int) -> Optional[PayrollRun]:
        """获取薪资审核"""
        return self.db.query(PayrollRun).options(joinedload(PayrollRun.payroll_period)).filter(PayrollRun.id == payroll_run_id).first()
    
    def get_employees_for_calculation(
        self,
        payroll_run_id: int,
        employee_ids: Optional[List[int]] = None,
        department_ids: Optional[List[int]] = None,
        limit: Optional[int] = None
    ) -> List[Employee]:
        """获取需要计算的员工列表"""
        query = self.db.query(Employee).filter(Employee.is_active == True)
        
        # 按员工ID筛选
        if employee_ids:
            query = query.filter(Employee.id.in_(employee_ids))
        
        # 按部门ID筛选
        if department_ids:
            query = query.filter(Employee.department_id.in_(department_ids))
        
        # 排除已经计算过的员工（可选）
        # existing_entries = self.db.query(PayrollEntry.employee_id).filter(
        #     PayrollEntry.payroll_run_id == payroll_run_id
        # ).subquery()
        # query = query.filter(~Employee.id.in_(existing_entries))
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def get_employee_salary_config(self, employee_id: int) -> Optional[EmployeeSalaryConfig]:
        """获取员工薪资配置"""
        return self.db.query(EmployeeSalaryConfig).filter(
            and_(
                EmployeeSalaryConfig.employee_id == employee_id,
                EmployeeSalaryConfig.is_active == True,
                EmployeeSalaryConfig.effective_date <= date.today(),
                or_(
                    EmployeeSalaryConfig.end_date.is_(None),
                    EmployeeSalaryConfig.end_date >= date.today()
                )
            )
        ).first()
    
    def get_employee_attendance_data(self, employee_id: int, payroll_run_id: int) -> Optional[AttendanceRecord]:
        """获取员工考勤数据"""
        # 根据薪资审核获取对应的考勤周期
        payroll_run = self.get_payroll_run(payroll_run_id)
        if not payroll_run:
            return None
        
        # 查找对应的考勤记录
        return self.db.query(AttendanceRecord).filter(
            and_(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.period_id.in_(
                    self.db.query(AttendancePeriod.id).filter(
                        and_(
                            AttendancePeriod.period_start <= payroll_run.payroll_period.end_date,
                            AttendancePeriod.period_end >= payroll_run.payroll_period.start_date
                        )
                    )
                )
            )
        ).first()
    
    def get_calculation_rules(self, employee: Employee) -> List[CalculationRule]:
        """获取适用于员工的计算规则"""
        # 获取默认规则集
        rule_set = self.db.query(CalculationRuleSet).filter(
            and_(
                CalculationRuleSet.is_active == True,
                CalculationRuleSet.is_default == True,
                CalculationRuleSet.effective_date <= date.today(),
                or_(
                    CalculationRuleSet.end_date.is_(None),
                    CalculationRuleSet.end_date >= date.today()
                )
            )
        ).first()
        
        if not rule_set:
            return []
        
        # 获取规则集中的所有活跃规则
        return self.db.query(CalculationRule).filter(
            and_(
                CalculationRule.rule_set_id == rule_set.id,
                CalculationRule.is_active == True
            )
        ).order_by(CalculationRule.execution_order).all()
    
    def create_calculation_task(
        self,
        payroll_run_id: int,
        employee_ids: List[int],
        calculation_config: Dict[str, Any]
    ) -> str:
        """创建计算任务"""
        task_id = str(uuid.uuid4())
        
        # 这里应该创建一个任务记录表来跟踪异步任务状态
        # 暂时返回任务ID
        return task_id
    
    def get_calculation_task(self, task_id: str):
        """获取计算任务状态"""
        # 这里应该从任务记录表中获取任务状态
        # 暂时返回模拟数据
        return None
    
    def save_calculation_result(
        self,
        payroll_run_id: int,
        employee_id: int,
        result: CalculationResult,
        calculation_context_dict: Dict[str, Any]
    ):
        """保存计算结果"""
        logger.debug(f"CRUD: save_calculation_result for employee {employee_id}, run {payroll_run_id}. Result status: {result.status}")
        try:
            logger.debug(f"CRUD: Attempting to serialize calculation_context_dict for employee {employee_id}")
            try:
                serialized_inputs_test = json.dumps(calculation_context_dict, default=self._default_json_serializer, indent=2) # Added indent for readability
                logger.debug(f"CRUD: calculation_context_dict for employee {employee_id} serialized successfully for testing. Sample: {serialized_inputs_test[:1000]}...")
            except TypeError as te:
                logger.error(f"CRUD: Pre-serialization test FAILED for calculation_context_dict (employee {employee_id}): {te}", exc_info=True)
                # Option: Re-raise to stop further processing if pre-serialization fails
                # raise ValueError(f"Pre-serialization of calculation_inputs failed: {te}") from te
                # For now, let it proceed to see if SQLAlchemy's handler gives more info or if it's a different issue.

            existing_entry = self.db.query(PayrollEntry).filter(
                and_(
                    PayrollEntry.payroll_run_id == payroll_run_id,
                    PayrollEntry.employee_id == employee_id
                )
            ).first()

            if result.status == CalculationStatus.COMPLETED:
                status_id = self.calculated_entry_status_id
                remarks = result.error_message or "Successfully calculated"
            else: # FAILED or other non-COMPLETED status
                status_id = self.error_entry_status_id
                remarks = result.error_message or "Calculation failed"
            
            if not status_id: # Fallback if lookup values weren't found
                logger.error(f"CRUD: Cannot determine status_id for PayrollEntry (employee {employee_id}). Defaulting to error or skipping update.")
                remarks += " (Status ID lookup failed)"
                # Decide on fallback behavior, e.g., don't save or save with a generic error status_id if available

            if existing_entry:
                logger.info(f"CRUD: Updating existing PayrollEntry for employee {employee_id}, run {payroll_run_id}")
                updated_entry = self._update_payroll_entry(existing_entry, result, calculation_context_dict)
                updated_entry.status_lookup_value_id = status_id
                updated_entry.remarks = remarks
                self.db.add(updated_entry)
            else:
                logger.info(f"CRUD: Creating new PayrollEntry for employee {employee_id}, run {payroll_run_id}")
                # Ensure payroll_period_id is available if creating new entry
                # This logic might need adjustment based on how payroll_period_id is determined for new entries.
                # If payroll_period_id is None here and it's required, an error will occur.
                # For now, assuming it's passed correctly or can be None based on schema.
                
                #payroll_run_obj = self.db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
                #if not payroll_run_obj:
                #    logger.error(f"PayrollRun with ID {payroll_run_id} not found. Cannot create PayrollEntry.")
                #    return

                new_entry = self._create_payroll_entry(self.db, payroll_run_id, result, calculation_context_dict)
                new_entry.status_lookup_value_id = status_id
                new_entry.remarks = remarks
                self.db.add(new_entry)
            
            self._log_calculation(payroll_run_id, result, calculation_context_dict)

            self.db.commit()
            logger.info(f"CRUD: Successfully saved/updated PayrollEntry for employee {employee_id}, run {payroll_run_id}")
        except Exception as e:
            self.db.rollback()
            logger.error(f"CRUD: Error in save_calculation_result for employee {employee_id}: {e}", exc_info=True)
            raise
    
    def get_calculation_summary(self, payroll_run_id: int) -> Optional[CalculationSummary]:
        """获取计算汇总信息"""
        payroll_run = self.get_payroll_run(payroll_run_id)
        if not payroll_run:
            return None
        
        # 统计计算结果
        entries = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == payroll_run_id
        ).all()
        
        if not entries:
            return None
        
        # 计算汇总数据
        total_gross = sum(float(entry.gross_salary or 0) for entry in entries)
        total_deductions = sum(float(entry.total_deductions or 0) for entry in entries)
        total_net = sum(float(entry.net_salary or 0) for entry in entries)
        
        return CalculationSummary(
            payroll_run_id=payroll_run_id,
            calculation_date=datetime.now(),
            total_employees=len(entries),
            calculated_employees=len(entries),
            successful_count=len([e for e in entries if e.status == 'CALCULATED']),
            failed_count=len([e for e in entries if e.status == 'ERROR']),
            total_gross_salary=total_gross,
            total_deductions=total_deductions,
            total_net_salary=total_net,
            calculation_status=CalculationStatusEnum.COMPLETED,
            last_updated=datetime.now()
        )
    
    def _create_payroll_entry(self, db: Session, payroll_run_id: int, result: CalculationResult, calculation_context_dict: Dict[str, Any]) -> PayrollEntry:
        """创建新的薪资条目记录"""
        logger.info(f"CRUD: Creating new PayrollEntry for employee {result.employee_id}, run {payroll_run_id}")

        # 获取关联的 PayrollRun 以获取 payroll_period_id
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
        if not payroll_run:
            logger.error(f"CRUD ERROR: PayrollRun with ID {payroll_run_id} not found when creating PayrollEntry for employee {result.employee_id}.")
            # Consider raising an exception or returning None if this scenario should halt processing
            # For now, we'll proceed, but payroll_period_id will be None, likely causing an IntegrityError downstream if not handled
            effective_payroll_period_id = None
        else:
            effective_payroll_period_id = payroll_run.payroll_period_id

        # 序列化薪资组件
        earnings_dict = {}
        deductions_dict = {}
        if result.components:
            for comp in result.components:
                comp_data = {
                    "amount": float(comp.amount) if comp.amount is not None else 0.0,
                    "name": getattr(comp, 'component_name', comp.component_code)
                }
                if comp.component_type == ComponentType.EARNING:
                    earnings_dict[comp.component_code] = comp_data
                elif comp.component_type in [ComponentType.PERSONAL_DEDUCTION, ComponentType.EMPLOYER_DEDUCTION]:
                    deductions_dict[comp.component_code] = comp_data
        
        # 序列化计算日志 (引擎部分的日志) - 改为使用 result.calculation_details
        # engine_calc_log_str = None
        # if result.calculation_log: # This line caused AttributeError
        #     try:
        #         engine_calc_log_str = json.dumps(result.calculation_log)
        #     except Exception as e:
        #         logger.error(f"CRUD: Error serializing engine calculation_log for employee {result.employee_id}: {e}")
        #         engine_calc_log_str = json.dumps([f"Error serializing log: {e}"])

        # calculation_log_for_entry will be result.calculation_details if it's not None, otherwise an empty dict or specific log message.
        calculation_log_for_entry = result.calculation_details if result.calculation_details is not None else {}
        if not result.calculation_details and result.error_message:
             # If no specific details, but there is an error message, include it in the log.
            calculation_log_for_entry['error'] = result.error_message

        entry = PayrollEntry(
            employee_id=result.employee_id,
            payroll_run_id=payroll_run_id,
            payroll_period_id=effective_payroll_period_id, # 使用获取到的 payroll_period_id
            gross_pay=result.total_earnings if result.total_earnings is not None else Decimal("0.00"),
            total_deductions=result.total_deductions if result.total_deductions is not None else Decimal("0.00"),
            net_pay=result.net_pay if result.net_pay is not None else Decimal("0.00"),
            earnings_details=earnings_dict, #  SQLAlchemy's CustomJSONB will handle serialization
            deductions_details=deductions_dict, # SQLAlchemy's CustomJSONB will handle serialization
            calculation_inputs=calculation_context_dict, # SQLAlchemy's CustomJSONB will handle serialization
            calculation_log=calculation_log_for_entry, # Use result.calculation_details or a constructed log
            remarks=result.error_message, # Fixed: result.remarks -> result.error_message (may be None for successful calculations)
            status_lookup_value_id=self.calculated_entry_status_id if result.status == CalculationStatus.COMPLETED else self.error_entry_status_id
        )
        db.add(entry)
        # db.flush() # Flush to get ID if needed immediately, or commit at the end of save_calculation_result
        logger.info(f"CRUD: PayrollEntry prepared for employee {result.employee_id}, run {payroll_run_id}")
        return entry
    
    def _update_payroll_entry(
        self,
        entry: PayrollEntry,
        result: CalculationResult,
        calculation_context_dict: Dict[str, Any]
    ):
        """更新薪资条目，使用 CalculationResult 对象"""
        logger.debug(f"CRUD: _update_payroll_entry for employee {result.employee_id}. Result status: {result.status}")
        
        # 更新汇总字段 - 注意字段名对应关系
        entry.gross_pay = result.total_earnings if result.total_earnings is not None else entry.gross_pay
        entry.total_deductions = result.total_deductions if result.total_deductions is not None else entry.total_deductions
        entry.net_pay = result.net_pay if result.net_pay is not None else entry.net_pay


        earnings_details = entry.earnings_details or {}
        deductions_details = entry.deductions_details or {}
        if result.components:
            for comp in result.components:
                comp_data = {
                    "amount": float(comp.amount) if comp.amount is not None else 0.0,
                    "name": getattr(comp, 'component_name', comp.component_code)
                }
                if comp.component_type == ComponentType.EARNING:
                    earnings_details[comp.component_code] = comp_data
                elif comp.component_type in [ComponentType.PERSONAL_DEDUCTION, ComponentType.EMPLOYER_DEDUCTION]:
                    deductions_details[comp.component_code] = comp_data

        entry.earnings_details = earnings_details
        entry.deductions_details = deductions_details

        entry.calculation_inputs = calculation_context_dict
        # entry.calculation_log = result.log_messages
        
        if result.status == CalculationStatus.COMPLETED:
            if self.calculated_entry_status_id:
                entry.status_lookup_value_id = self.calculated_entry_status_id
            else:
                logger.error(f"Cannot update PayrollEntry status to COMPLETED for employee {result.employee_id}: LookupValue ID for 'CALCULATED_ENTRY' is not initialized.")
        elif result.status == CalculationStatus.FAILED:
            if self.error_entry_status_id:
                entry.status_lookup_value_id = self.error_entry_status_id
            else:
                logger.error(f"Cannot update PayrollEntry status to FAILED for employee {result.employee_id}: LookupValue ID for 'ERROR_ENTRY' is not initialized.")
        else:
            logger.warning(f"Unexpected CalculationStatus '{result.status}' for employee {result.employee_id} during update. Status not changed.")

        entry.calculated_at = func.now() # Update calculated_at timestamp
        return entry
    
    def _log_calculation(
        self,
        payroll_run_id: int,
        result: CalculationResult,
        calculation_context_dict: Dict[str, Any]
    ):
        """记录计算日志"""
        logger.debug(f"CRUD: _log_calculation for employee {result.employee_id}, run {payroll_run_id}")
        
        # Prepare calculation_details for logging (converting Decimal to str/float for JSON compatibility)
        log_calc_details = {
            "employee_id": result.employee_id,
            "status": result.status.value if hasattr(result.status, 'value') else str(result.status),
            "total_earnings": str(result.total_earnings) if result.total_earnings is not None else "0.00",
            "total_deductions": str(result.total_deductions) if result.total_deductions is not None else "0.00",
            "net_pay": str(result.net_pay) if result.net_pay is not None else "0.00",
            "taxable_income": str(self._get_component_amount_by_code(result.components, "TAXABLE_INCOME")), # Use helper
            "income_tax": str(self._get_component_amount_by_code(result.components, "INCOME_TAX")), # Use helper
            "social_insurance_employee": str(self._get_component_amount_by_code(result.components, "SOCIAL_INSURANCE_EMPLOYEE")), # Use helper
            "housing_fund_employee": str(self._get_component_amount_by_code(result.components, "HOUSING_FUND_EMPLOYEE")), # Use helper
            "components": [
                {
                    "db_name": comp.db_name,
                    "component_code": comp.component_code,
                    "component_name": comp.component_name,
                    "amount": str(comp.amount),
                    "component_type": comp.component_type.value if hasattr(comp.component_type, 'value') else str(comp.component_type)
                } for comp in (result.components if result.components else [])
            ],
            "calculation_details": result.calculation_details # Assuming this is already JSON-serializable
        }

        log_status = 'SUCCESS'
        if result.status != CalculationStatus.COMPLETED:
            log_status = 'ERROR'
        
        log = CalculationLog(
            payroll_run_id=payroll_run_id,
            employee_id=result.employee_id,
            component_code='TOTAL', # Or more specific if available
            calculation_method='ENGINE',
            result_amount=result.net_pay if result.net_pay is not None else Decimal("0.00"),
            calculation_details=log_calc_details, # Use the prepared dict
            status=log_status,
            error_message=result.error_message if hasattr(result, 'error_message') else None
        )
        self.db.add(log)
        logger.debug(f"CRUD: Added CalculationLog for employee {result.employee_id}")

    def _default_json_serializer(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        # 如果还有其他自定义类型，在这里添加处理
        # 例如，如果CalculationContext中包含其他dataclass实例且未被to_dict转换
        # if dataclasses.is_dataclass(obj):
        #     return dataclasses.asdict(obj) # 这需要进一步确保asdict的结果也是可序列化的
        raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable for calculation_inputs") 