"""
批量操作相关的功能。
"""
from sqlalchemy.orm import Session
from typing import List, Tuple, Dict, Any

from ...models.payroll import PayrollPeriod, PayrollRun, PayrollEntry
from ...pydantic_models.payroll import PayrollEntryCreate, PayrollEntryUpdate, PayrollRunCreate
from ..hr import get_employee_by_name_and_id_number, get_employee
from .payroll_entries import create_payroll_entry, update_payroll_entry
from .payroll_runs import create_payroll_run


def bulk_validate_payroll_entries(
    db: Session,
    payroll_period_id: int,
    entries: List[PayrollEntryCreate]
) -> Dict[str, Any]:
    """
    批量验证薪资明细数据
    
    Args:
        db: 数据库会话
        payroll_period_id: 薪资周期ID
        entries: 薪资明细创建数据列表
    
    Returns:
        Dict[str, Any]: 验证结果，包含统计信息和验证后的数据
    """
    # 验证薪资周期是否存在
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_period_id).first()
    if not period:
        raise ValueError(f"Payroll period with ID {payroll_period_id} not found")
    
    total = len(entries)
    valid = 0
    invalid = 0
    warnings = 0
    errors = []
    validated_data = []
    
    for i, entry_data in enumerate(entries):
        validation_errors = []
        validated_entry = {
            "_clientId": getattr(entry_data, '_clientId', f"validate_{i}_{payroll_period_id}"),
            "originalIndex": i,
            "employee_id": getattr(entry_data, 'employee_id', None),
            "gross_pay": float(entry_data.gross_pay),
            "total_deductions": float(entry_data.total_deductions),
            "net_pay": float(entry_data.net_pay),
            "earnings_details": entry_data.earnings_details or {},
            "deductions_details": entry_data.deductions_details or {},
            "remarks": entry_data.remarks,
            "__isValid": True,
            "__errors": [],
            "__rowId": f"row_{i}",
            "__isNew": True
        }
        
        try:
            # 验证员工是否存在
            employee = None
            if hasattr(entry_data, 'employee_id') and entry_data.employee_id:
                employee = get_employee(db, entry_data.employee_id)
            
            # 如果没有提供employee_id或找不到员工，尝试使用姓名+身份证匹配
            if not employee and hasattr(entry_data, 'employee_info') and entry_data.employee_info:
                info = entry_data.employee_info
                if info and info.get('last_name') and info.get('first_name') and info.get('id_number'):
                    employee = get_employee_by_name_and_id_number(
                        db, 
                        info['last_name'], 
                        info['first_name'], 
                        info['id_number']
                    )
                    if employee:
                        validated_entry["employee_id"] = employee.id
                        validated_entry["employee_full_name"] = f"{employee.last_name}{employee.first_name}"
                        validated_entry["employee_name"] = f"{employee.last_name}{employee.first_name}"
                        validated_entry["id_number"] = employee.id_number
                        validated_entry["employee_info"] = {
                            "last_name": employee.last_name,
                            "first_name": employee.first_name,
                            "id_number": employee.id_number
                        }
            
            # 如果找不到员工，标记为无效
            if not employee:
                validation_errors.append("Employee not found")
                validated_entry["__isValid"] = False
            
            # 验证数据完整性
            if entry_data.gross_pay < 0:
                validation_errors.append("Gross pay cannot be negative")
            
            if entry_data.total_deductions < 0:
                validation_errors.append("Total deductions cannot be negative")
            
            if entry_data.net_pay < 0:
                validation_errors.append("Net pay cannot be negative")
            
            # 验证薪资平衡性（应发-扣除=实发，允许0.01的误差）
            calculated_net_pay = float(entry_data.gross_pay) - float(entry_data.total_deductions)
            net_pay_diff = abs(calculated_net_pay - float(entry_data.net_pay))
            if net_pay_diff > 0.01:
                validation_errors.append(f"Net pay calculation mismatch: expected {calculated_net_pay:.2f}, got {float(entry_data.net_pay):.2f}")
            
            # 检查是否已存在相同的薪资明细
            if employee:
                existing_entry = db.query(PayrollEntry).filter(
                    PayrollEntry.employee_id == employee.id,
                    PayrollEntry.payroll_period_id == payroll_period_id
                ).first()
                
                if existing_entry:
                    validation_errors.append(f"Payroll entry already exists for employee {employee.id} in this period")
                    validated_entry["__isNew"] = False
            
            # 设置验证结果
            if validation_errors:
                validated_entry["__isValid"] = False
                validated_entry["__errors"] = validation_errors
                validated_entry["validationErrors"] = validation_errors
                invalid += 1
            else:
                valid += 1
                
        except Exception as e:
            validation_errors.append(f"Validation error: {str(e)}")
            validated_entry["__isValid"] = False
            validated_entry["__errors"] = validation_errors
            validated_entry["validationErrors"] = validation_errors
            invalid += 1
        
        validated_data.append(validated_entry)
    
    return {
        "total": total,
        "valid": valid,
        "invalid": invalid,
        "warnings": warnings,
        "errors": errors,
        "validatedData": validated_data
    }


def bulk_create_payroll_entries(
    db: Session, 
    payroll_period_id: int, 
    entries: List[PayrollEntryCreate], 
    overwrite_mode: bool = False
) -> Tuple[List[PayrollEntry], List[Dict[str, Any]]]:
    """
    批量创建工资明细
    
    Args:
        db: 数据库会话
        payroll_period_id: 工资周期ID
        entries: 工资明细创建数据列表
        overwrite_mode: 是否启用覆盖模式
    
    Returns:
        Tuple[成功创建的工资明细列表, 错误信息列表]
        
    Raises:
        ValueError: 当工资周期不存在或查找状态失败时
    """
    created_entries = []
    errors = []
    
    # 验证工资周期是否存在
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_period_id).first()
    if not period:
        raise ValueError(f"Payroll period with ID {payroll_period_id} not found")
    
    # 获取或创建默认的PayrollRun
    default_run = db.query(PayrollRun).filter(
        PayrollRun.payroll_period_id == payroll_period_id
    ).first()
    
    if not default_run:
        # 创建默认的PayrollRun
        from ..config import get_lookup_value_by_code, get_lookup_type_by_code
        
        # 获取"待计算"状态的ID
        # 首先获取PAYROLL_RUN_STATUS类型的ID
        payroll_run_status_type = get_lookup_type_by_code(db, "PAYROLL_RUN_STATUS")
        if not payroll_run_status_type:
            raise ValueError("PAYROLL_RUN_STATUS lookup type not found")
        
        pending_status = get_lookup_value_by_code(db, payroll_run_status_type.id, "PRUN_PENDING_CALC")
        if not pending_status:
            raise ValueError("PAYROLL_RUN_STATUS lookup value 'PRUN_PENDING_CALC' not found")
        
        run_data = PayrollRunCreate(
            payroll_period_id=payroll_period_id,
            status_lookup_value_id=pending_status.id
        )
        default_run = create_payroll_run(db, run_data)
    
    for i, entry_data in enumerate(entries):
        try:
            # 首先尝试根据employee_id获取员工
            employee = None
            if hasattr(entry_data, 'employee_id') and entry_data.employee_id:
                employee = get_employee(db, entry_data.employee_id)
            
            # 如果没有提供employee_id或找不到员工，尝试使用姓名+身份证匹配
            if not employee and hasattr(entry_data, 'employee_info') and entry_data.employee_info:
                info = entry_data.employee_info
                if info.get('last_name') and info.get('first_name') and info.get('id_number'):
                    employee = get_employee_by_name_and_id_number(
                        db, 
                        info['last_name'], 
                        info['first_name'], 
                        info['id_number']
                    )
                    if employee:
                        entry_data.employee_id = employee.id
            
            # 如果还是找不到员工，记录错误
            if not employee:
                errors.append({
                    "index": i,
                    "employee_id": getattr(entry_data, 'employee_id', None),
                    "error": "Employee not found"
                })
                continue
                
            # 设置payroll_run_id和payroll_period_id
            entry_data.payroll_run_id = default_run.id
            entry_data.payroll_period_id = payroll_period_id
            
            # 创建一个不包含employee_info的数据字典，用于传递给create_payroll_entry
            entry_dict = entry_data.dict(exclude={'employee_info'})
            clean_entry_data = PayrollEntryCreate(**entry_dict)
            
            # 检查是否已存在相同的工资明细
            existing_entry = db.query(PayrollEntry).filter(
                PayrollEntry.employee_id == clean_entry_data.employee_id,
                PayrollEntry.payroll_period_id == payroll_period_id
            ).first()
            
            if existing_entry and overwrite_mode:
                # 更新现有记录
                update_data = PayrollEntryUpdate(**clean_entry_data.dict())
                db_entry = update_payroll_entry(db, existing_entry.id, update_data)
                created_entries.append(db_entry)
            elif existing_entry and not overwrite_mode:
                # 记录错误：记录已存在
                errors.append({
                    "index": i,
                    "employee_id": clean_entry_data.employee_id,
                    "error": f"Payroll entry already exists for employee {clean_entry_data.employee_id} in this period"
                })
            else:
                # 创建新记录
                db_entry = create_payroll_entry(db, clean_entry_data)
                created_entries.append(db_entry)
                
        except Exception as e:
            # 记录错误
            errors.append({
                "index": i,
                "employee_id": getattr(entry_data, 'employee_id', None),
                "error": str(e)
            })
            # 回滚当前事务中的更改
            db.rollback()
    
    return created_entries, errors 