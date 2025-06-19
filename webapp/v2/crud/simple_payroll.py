"""
极简工资单模块的CRUD操作
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_
from typing import List, Dict
from datetime import date

from .. import models
from ..pydantic_models import simple_payroll as pydantic_simple_payroll

def get_monthly_payroll_summary(db: Session, start_year: int, end_year: int) -> List[pydantic_simple_payroll.MonthlyPayrollSummary]:
    """
    获取指定年份范围内每个月的薪资状态概览。

    - 查询 payroll_periods 表来确定月份。
    - 聚合 payroll_runs 确定是否存在薪资运行。
    - 聚合 payroll_entries 按 audit_status 统计数量。
    """
    
    # 1. 动态获取状态ID，避免硬编码
    status_map = {}
    status_lookup_type_code = 'PAYROLL_ENTRY_STATUS' # 假设这是工资条目状态的类型代码
    statuses_to_fetch = ['PENDING', 'PENDING_AUDIT', 'APPROVED']
    
    status_lookups = db.query(models.config.LookupValue).join(models.config.LookupType).filter(
        models.config.LookupType.code == status_lookup_type_code,
        models.config.LookupValue.code.in_(statuses_to_fetch)
    ).all()

    for sl in status_lookups:
        status_map[sl.code] = sl.id

    not_calculated_id = status_map.get('PENDING')
    pending_audit_id = status_map.get('PENDING_AUDIT')
    approved_id = status_map.get('APPROVED')
    
    # 2. 查询每个月的薪资运行情况
    runs_query = (
        db.query(
            extract('year', models.payroll.PayrollPeriod.start_date).label('year'),
            extract('month', models.payroll.PayrollPeriod.start_date).label('month'),
            func.count(models.payroll.PayrollRun.id).label('run_count')
        )
        .join(models.payroll.PayrollRun, models.payroll.PayrollRun.payroll_period_id == models.payroll.PayrollPeriod.id)
        .filter(extract('year', models.payroll.PayrollPeriod.start_date).between(start_year, end_year))
        .group_by('year', 'month')
    ).subquery('runs_summary')

    # 3. 查询每个月的工资条目状态统计 (使用状态ID)
    entries_query = (
        db.query(
            extract('year', models.payroll.PayrollPeriod.start_date).label('year'),
            extract('month', models.payroll.PayrollPeriod.start_date).label('month'),
            func.sum(case((models.payroll.PayrollEntry.status_lookup_value_id == not_calculated_id, 1), else_=0)).label('not_calculated'),
            func.sum(case((models.payroll.PayrollEntry.status_lookup_value_id == pending_audit_id, 1), else_=0)).label('pending_audit'),
            func.sum(case((models.payroll.PayrollEntry.status_lookup_value_id == approved_id, 1), else_=0)).label('approved')
        )
        .join(models.payroll.PayrollEntry, models.payroll.PayrollEntry.payroll_period_id == models.payroll.PayrollPeriod.id)
        .filter(extract('year', models.payroll.PayrollPeriod.start_date).between(start_year, end_year))
        .group_by('year', 'month')
    ).subquery('entries_summary')

    # 4. 将结果合并
    results: Dict[str, pydantic_simple_payroll.MonthlyPayrollSummary] = {}
    for year in range(start_year, end_year + 1):
        for month in range(1, 13):
            key = f"{year}-{month}"
            results[key] = pydantic_simple_payroll.MonthlyPayrollSummary(
                year=year,
                month=month,
                has_payroll_run=False,
                record_status_summary=pydantic_simple_payroll.MonthlyRecordStatusSummary()
            )

    runs_data = db.query(runs_query).all()
    for row in runs_data:
        key = f"{row.year}-{row.month}"
        if key in results:
            results[key].has_payroll_run = row.run_count > 0

    entries_data = db.query(entries_query).all()
    for row in entries_data:
        key = f"{row.year}-{row.month}"
        if key in results:
            results[key].record_status_summary.not_calculated = row.not_calculated or 0
            results[key].record_status_summary.pending_audit = row.pending_audit or 0
            results[key].record_status_summary.approved = row.approved or 0

    return list(results.values()) 