"""
银行代发相关的功能。
"""
from sqlalchemy.orm import Session
from typing import List, Tuple, Optional

from ...models.payroll import PayrollEntry
from ...models.hr import Employee, EmployeeBankAccount


def get_payroll_entries_for_bank_export(
    db: Session, 
    run_id: int
) -> List[Tuple[PayrollEntry, Optional[str], Optional[str], Optional[str], Optional[str]]]: 
    """
    获取指定薪资审核中所有符合条件的工资条目，用于银行代发文件生成。
    包含员工工号、姓名和银行账户信息（优先获取主账户）。

    Args:
        db: 数据库会话
        run_id: 薪资审核ID

    Returns:
        一个元组列表: (PayrollEntry对象, 员工工号, 员工姓名, 银行账号, 开户行名称)
        银行信息字段可能为 None 如果员工无此信息或无主账户。
    """
    # Subquery to get the primary bank account for each employee
    # If no primary, it could be extended to pick any, or be None
    primary_bank_account_sq = (
        db.query(
            EmployeeBankAccount.employee_id,
            EmployeeBankAccount.account_number.label("primary_account_number"),
            EmployeeBankAccount.bank_name.label("primary_bank_name")
        )
        .filter(EmployeeBankAccount.is_primary == True)
        .subquery('primary_bank_account_sq')
    )

    results = (
        db.query(
            PayrollEntry,
            Employee.employee_code, # Assuming Employee model has employee_code
            Employee.first_name,
            Employee.last_name,
            primary_bank_account_sq.c.primary_account_number,
            primary_bank_account_sq.c.primary_bank_name
        )
        .join(Employee, PayrollEntry.employee_id == Employee.id)
        .outerjoin(
            primary_bank_account_sq, 
            Employee.id == primary_bank_account_sq.c.employee_id
        )
        .filter(PayrollEntry.payroll_run_id == run_id)
        # TODO: Add filter for PayrollEntry.status_lookup_value_id to select only approved/payable entries
        # e.g., .filter(PayrollEntry.status_lookup_value_id == get_lookup_value_id_by_code(db, 'PAYROLL_ENTRY_STATUS', 'APPROVED_FOR_PAYMENT'))
        .order_by(Employee.employee_code) 
        .all()
    )

    formatted_results = []
    for entry, emp_code, first_name, last_name, acc_number, bank_name_val in results:
        full_name = f"{last_name or ''} {first_name or ''}".strip()
        formatted_results.append( (entry, emp_code, full_name, acc_number, bank_name_val) )
    
    return formatted_results 