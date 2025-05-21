"""
工资相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import io

from ..database import get_db_v2
from ..crud import payroll as crud
from ..pydantic_models.payroll import (
    PayrollPeriodCreate, PayrollPeriodUpdate, PayrollPeriod, PayrollPeriodListResponse,
    PayrollRunCreate, PayrollRunUpdate, PayrollRun, PayrollRunListResponse,
    PayrollEntryCreate, PayrollEntryUpdate, PayrollEntry, PayrollEntryListResponse,
    PayrollRunPatch, PayrollEntryPatch
)
from ...auth import require_permissions, get_current_user
from ..utils import create_error_response

router = APIRouter(
    prefix="",
    tags=["Payroll"],
)


# PayrollPeriod endpoints
@router.get("/payroll-periods", response_model=PayrollPeriodListResponse)
async def get_payroll_periods(
    frequency_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_PERIOD_VIEW"]))
):
    """
    获取工资周期列表，支持分页、搜索和过滤。

    - **frequency_id**: 频率ID，用于过滤特定频率的工资周期
    - **start_date**: 开始日期，用于过滤开始日期大于等于指定日期的工资周期
    - **end_date**: 结束日期，用于过滤结束日期小于等于指定日期的工资周期
    - **search**: 搜索关键字，可以匹配工资周期名称
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取工资周期列表
        periods, total = crud.get_payroll_periods(
            db=db,
            frequency_id=frequency_id,
            start_date=start_date,
            end_date=end_date,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": periods,
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.get("/payroll-periods/{period_id}", response_model=Dict[str, PayrollPeriod])
async def get_payroll_period(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_PERIOD_VIEW"]))
):
    """
    根据ID获取工资周期详情。

    - **period_id**: 工资周期ID
    """
    try:
        # 获取工资周期
        period = crud.get_payroll_period(db, period_id)
        if not period:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll period with ID {period_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": period}
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.post("/payroll-periods", response_model=Dict[str, PayrollPeriod], status_code=status.HTTP_201_CREATED)
async def create_payroll_period(
    period: PayrollPeriodCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_PERIOD_MANAGE"]))
):
    """
    创建新工资周期。

    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 创建工资周期
        db_period = crud.create_payroll_period(db, period)

        # 返回标准响应格式
        return {"data": db_period}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.put("/payroll-periods/{period_id}", response_model=Dict[str, PayrollPeriod])
async def update_payroll_period(
    period_id: int,
    period: PayrollPeriodUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_PERIOD_MANAGE"]))
):
    """
    更新工资周期信息。

    - **period_id**: 工资周期ID
    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 更新工资周期
        db_period = crud.update_payroll_period(db, period_id, period)
        if not db_period:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll period with ID {period_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_period}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.delete("/payroll-periods/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payroll_period(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_PERIOD_MANAGE"]))
):
    """
    删除工资周期。

    - **period_id**: 工资周期ID
    - 需要Super Admin角色
    """
    try:
        # 删除工资周期
        success = crud.delete_payroll_period(db, period_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll period with ID {period_id} not found"
                )
            )

        # 返回204 No Content
        return None
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=create_error_response(
                status_code=409,
                message="Conflict",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


# PayrollRun endpoints
@router.get("/payroll-runs", response_model=PayrollRunListResponse)
async def get_payroll_runs(
    period_id: Optional[int] = None,
    status_id: Optional[int] = None,
    initiated_by_user_id: Optional[int] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_RUN_VIEW"]))
):
    """
    获取工资运行批次列表，支持分页和过滤。

    - **period_id**: 工资周期ID，用于过滤特定工资周期的运行批次
    - **status_id**: 状态ID，用于过滤特定状态的运行批次
    - **initiated_by_user_id**: 发起用户ID，用于过滤特定用户发起的运行批次
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取工资运行批次列表
        runs, total = crud.get_payroll_runs(
            db=db,
            period_id=period_id,
            status_id=status_id,
            initiated_by_user_id=initiated_by_user_id,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": runs,
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.get("/payroll-runs/{run_id}", response_model=Dict[str, PayrollRun])
async def get_payroll_run(
    run_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_RUN_VIEW"]))
):
    """
    根据ID获取工资运行批次详情。

    - **run_id**: 工资运行批次ID
    """
    try:
        # 获取工资运行批次
        run = crud.get_payroll_run(db, run_id)
        if not run:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll run with ID {run_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": run}
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.post("/payroll-runs", response_model=Dict[str, PayrollRun], status_code=status.HTTP_201_CREATED)
async def create_payroll_run(
    run: PayrollRunCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_RUN_MANAGE"]))
):
    """
    创建新工资运行批次。

    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 创建工资运行批次
        db_run = crud.create_payroll_run(db, run, current_user.id)

        # 返回标准响应格式
        return {"data": db_run}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.put("/payroll-runs/{run_id}", response_model=Dict[str, PayrollRun])
async def update_payroll_run(
    run_id: int,
    run: PayrollRunUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_RUN_MANAGE"]))
):
    """
    更新工资运行批次信息。

    - **run_id**: 工资运行批次ID
    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 更新工资运行批次
        db_run = crud.update_payroll_run(db, run_id, run)
        if not db_run:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll run with ID {run_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_run}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.patch("/payroll-runs/{run_id}", response_model=Dict[str, PayrollRun])
async def patch_payroll_run_endpoint(
    run_id: int,
    run_data: PayrollRunPatch,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_RUN_MARK_AS_PAID"]))
):
    """
    部分更新工资计算批次信息，例如标记为已发放。

    - **run_id**: 工资计算批次ID
    - 需要 Super Admin, Payroll Admin, 或 Finance Admin 角色
    """
    try:
        db_payroll_run = crud.patch_payroll_run(db, run_id, run_data)
        if not db_payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll run with ID {run_id} not found"
                )
            )
        
        # Audit log placeholder
        # audit_logger.info(f"User {current_user.username} patched payroll run {run_id}. Data: {run_data.model_dump(exclude_unset=True)}")
        
        return {"data": db_payroll_run}
    except ValueError as e: 
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except HTTPException:
        raise # Re-raise HTTPException directly
    except Exception as e:
        # logger.error(f"Error patching payroll run {run_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details="An unexpected error occurred while updating the payroll run."
            )
        )


@router.delete("/payroll-runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payroll_run(
    run_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_RUN_MANAGE"]))
):
    """
    删除工资运行批次。

    - **run_id**: 工资运行批次ID
    - 需要Super Admin角色
    """
    try:
        # 删除工资运行批次
        success = crud.delete_payroll_run(db, run_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll run with ID {run_id} not found"
                )
            )

        # 返回204 No Content
        return None
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=create_error_response(
                status_code=409,
                message="Conflict",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.get("/payroll-runs/{run_id}/bank-export", response_class=StreamingResponse)
async def export_payroll_run_bank_file(
    run_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_RUN_EXPORT_BANK_FILE"]))
):
    """
    为指定的工资计算批次生成银行代发文件 (CSV格式)。

    - **run_id**: 工资计算批次ID
    - 需要 Super Admin, Payroll Admin, 或 Finance Admin 角色
    """
    try:
        export_data = crud.get_payroll_entries_for_bank_export(db, run_id=run_id)
        
        if not export_data:
            # Return an empty CSV with headers if no data
            csv_buffer_empty = io.StringIO()
            headers_empty = ["员工工号", "员工姓名", "银行账号", "开户行名称", "实发金额"]
            csv_buffer_empty.write(','.join(headers_empty) + '\n')
            empty_csv_string = csv_buffer_empty.getvalue()
            csv_buffer_empty.close()
            return StreamingResponse(iter([empty_csv_string]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=bank_export_run_{run_id}_empty.csv"})

        csv_buffer = io.StringIO()
        headers = [
            "员工工号", "员工姓名", "银行账号", "开户行名称", "实发金额"
            # Potentially: "币种", "备注", "身份证号" etc.
        ]
        csv_buffer.write(','.join(headers) + '\n')

        # Expected tuple: (PayrollEntry_obj, employee_code, employee_full_name, bank_account_number, bank_name)
        for entry_tuple in export_data:
            payroll_entry_obj, emp_code, emp_name, acc_number, bank_name_val = entry_tuple
            
            row = [
                str(emp_code or ''),
                str(emp_name or ''),
                str(acc_number or ''),       # This is primary_account_number from subquery
                str(bank_name_val or ''),   # This is primary_bank_name from subquery
                str(payroll_entry_obj.net_pay or '0.00')
            ]
            csv_buffer.write(','.join(row) + '\n')
        
        csv_string = csv_buffer.getvalue()
        csv_buffer.close()

        response = StreamingResponse(iter([csv_string]), media_type="text/csv")
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        response.headers["Content-Disposition"] = f"attachment; filename=bank_export_run_{run_id}_{timestamp}.csv"
        
        return response

    except Exception as e:
        # logger.error(f"Error exporting bank file for run {run_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"An unexpected error occurred while generating the bank export file: {str(e)}"
            )
        )


# PayrollEntry endpoints
@router.get("/payroll-entries", response_model=PayrollEntryListResponse)
async def get_payroll_entries(
    period_id: Optional[int] = None,
    run_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    status_id: Optional[int] = None,
    include_employee_details: bool = Query(False, description="是否包含员工姓名等详细信息"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_ENTRY_VIEW"]))
):
    """
    获取工资明细列表，支持分页和过滤。

    - **period_id**: 工资周期ID，用于过滤特定工资周期的明细
    - **run_id**: 工资运行批次ID，用于过滤特定运行批次的明细
    - **employee_id**: 员工ID，用于过滤特定员工的明细
    - **status_id**: 状态ID，用于过滤特定状态的明细
    - **include_employee_details**: 是否包含员工姓名等详细信息
    - **search**: 搜索关键词，用于按员工姓名、工号等信息搜索
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取工资明细列表
        entries, total = crud.get_payroll_entries(
            db=db,
            period_id=period_id,
            run_id=run_id,
            employee_id=employee_id,
            status_id=status_id,
            search=search,
            include_employee_details=include_employee_details,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": entries,
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.get("/payroll-entries/{entry_id}", response_model=Dict[str, PayrollEntry])
async def get_payroll_entry(
    entry_id: int,
    include_employee_details: bool = Query(True, description="是否包含员工姓名等详细信息"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_ENTRY_VIEW"]))
):
    """
    根据ID获取工资明细详情。

    - **entry_id**: 工资明细ID
    - **include_employee_details**: 是否包含员工姓名等详细信息
    """
    try:
        # 获取工资明细
        entry = crud.get_payroll_entry(db, entry_id, include_employee_details=include_employee_details)
        if not entry:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll entry with ID {entry_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": entry}
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.post("/payroll-entries", response_model=Dict[str, PayrollEntry], status_code=status.HTTP_201_CREATED)
async def create_payroll_entry(
    entry: PayrollEntryCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_ENTRY_MANAGE"]))
):
    """
    创建新工资明细。

    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 创建工资明细
        db_entry = crud.create_payroll_entry(db, entry)

        # 返回标准响应格式
        return {"data": db_entry}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.patch("/payroll-entries/{entry_id}", response_model=Dict[str, PayrollEntry])
async def patch_payroll_entry_details(
    entry_id: int,
    entry_data: PayrollEntryPatch,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_ENTRY_EDIT_DETAILS"]))
):
    """
    部分更新工资条目详情（例如，调整金额、备注）。
    需要 P_PAYROLL_ENTRY_EDIT_DETAILS 权限。
    """
    try:
        # Ensure PayrollEntryPatch is defined and crud.patch_payroll_entry exists
        db_entry = crud.patch_payroll_entry(db, entry_id, entry_data)
        if not db_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll entry with ID {entry_id} not found"
                )
            )
        return {"data": db_entry}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(status_code=422, message="Unprocessable Entity", details=str(e))
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(status_code=500, message="Internal Server Error", details=str(e))
        )


@router.put("/payroll-entries/{entry_id}", response_model=Dict[str, PayrollEntry])
async def update_payroll_entry(
    entry_id: int,
    entry: PayrollEntryUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_ENTRY_MANAGE"]))
):
    """
    更新工资明细信息。

    - **entry_id**: 工资明细ID
    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 更新工资明细
        db_entry = crud.update_payroll_entry(db, entry_id, entry)
        if not db_entry:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll entry with ID {entry_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_entry}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.delete("/payroll-entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payroll_entry(
    entry_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_ENTRY_MANAGE"]))
):
    """
    删除工资明细。

    - **entry_id**: 工资明细ID
    - 需要Super Admin角色
    """
    try:
        # 删除工资明细
        success = crud.delete_payroll_entry(db, entry_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll entry with ID {entry_id} not found"
                )
            )

        # 返回204 No Content
        return None
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=create_error_response(
                status_code=409,
                message="Conflict",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )
