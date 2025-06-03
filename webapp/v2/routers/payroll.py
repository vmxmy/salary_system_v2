"""
工资相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
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
    PayrollRunPatch, PayrollEntryPatch, PayrollComponentDefinitionListResponse,
    PayrollComponentDefinition, PayrollComponentDefinitionCreate, PayrollComponentDefinitionUpdate,
    BulkValidatePayrollEntriesPayload, BulkValidatePayrollEntriesResult,
    BulkCreatePayrollEntriesPayload, BulkCreatePayrollEntriesResult
)
from ..pydantic_models.common import DataResponse, PaginationResponse, PaginationMeta
from ...auth import require_permissions, get_current_user
from ..utils import create_error_response

router = APIRouter(
    tags=["Payroll"],
)


# PayrollPeriod endpoints
@router.get("/payroll-periods", response_model=PaginationResponse[PayrollPeriod])
async def get_payroll_periods(
    frequency_id: Optional[int] = None,
    status_lookup_value_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=200, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:view"]))
):
    """
    获取工资周期列表，支持分页、搜索和过滤。

    - **frequency_id**: 频率ID，用于过滤特定频率的工资周期
    - **status_lookup_value_id**: 状态ID，用于过滤特定状态的工资周期
    - **start_date**: 开始日期，用于过滤开始日期大于等于指定日期的工资周期
    - **end_date**: 结束日期，用于过滤结束日期小于等于指定日期的工资周期
    - **search**: 搜索关键字，可以匹配工资周期名称
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大200
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取工资周期列表
        periods, total = crud.get_payroll_periods(
            db=db,
            frequency_id=frequency_id,
            status_lookup_value_id=status_lookup_value_id,
            start_date=start_date,
            end_date=end_date,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        pagination_meta = PaginationMeta(
            page=page,
            size=size,
            total=total,
            totalPages=total_pages
        )
        return PaginationResponse[PayrollPeriod](
            data=periods,
            meta=pagination_meta
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


@router.get("/payroll-periods/{period_id}", response_model=DataResponse[PayrollPeriod])
async def get_payroll_period(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:view"]))
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
        return DataResponse[PayrollPeriod](data=period)
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


@router.post("/payroll-periods", response_model=DataResponse[PayrollPeriod], status_code=status.HTTP_201_CREATED)
async def create_payroll_period(
    period: PayrollPeriodCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:manage"]))
):
    """
    创建新工资周期。

    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 创建工资周期
        db_period = crud.create_payroll_period(db, period)

        # 返回标准响应格式
        return DataResponse[PayrollPeriod](data=db_period)
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


@router.put("/payroll-periods/{period_id}", response_model=DataResponse[PayrollPeriod])
async def update_payroll_period(
    period_id: int,
    period: PayrollPeriodUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:manage"]))
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
        return DataResponse[PayrollPeriod](data=db_period)
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
    current_user = Depends(require_permissions(["payroll_period:manage"]))
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
    current_user = Depends(require_permissions(["payroll_run:view"]))
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
        pagination_meta = PaginationMeta(
            page=page,
            size=size,
            total=total,
            totalPages=total_pages
        )
        return PaginationResponse[PayrollRun](
            data=runs,
            meta=pagination_meta
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



@router.get("/payroll-runs/{run_id}", response_model=DataResponse[PayrollRun])
async def get_payroll_run(
    run_id: int,
    include_employee_details: bool = Query(False, description="是否包含员工详细信息"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """
    根据ID获取工资运行批次详情。

    - **run_id**: 工资运行批次ID
    - **include_employee_details**: 是否包含员工详细信息 (默认: false)
:start_line:353
-------
    """
    try:
        # 获取工资运行批次，根据需要包含员工详细信息
        print(f"ROUTER: Calling crud.get_payroll_run with run_id={run_id}, include_employee_details={include_employee_details}")
        print(f"ROUTER: crud module is: {crud}")
        print(f"ROUTER: crud.get_payroll_run is: {crud.get_payroll_run}")
        run = crud.get_payroll_run(db, run_id, include_employee_details)
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
        return DataResponse[PayrollRun](data=run)
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


@router.post("/payroll-runs", response_model=DataResponse[PayrollRun], status_code=status.HTTP_201_CREATED)
async def create_payroll_run(
    run: PayrollRunCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    创建新工资运行批次。

    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 创建工资运行批次
        db_run = crud.create_payroll_run(db, run, current_user.id)

        # 返回标准响应格式
        return DataResponse[PayrollRun](data=db_run)
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


@router.put("/payroll-runs/{run_id}", response_model=DataResponse[PayrollRun])
async def update_payroll_run(
    run_id: int,
    run: PayrollRunUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
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
        return DataResponse[PayrollRun](data=db_run)
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


@router.patch("/payroll-runs/{run_id}", response_model=DataResponse[PayrollRun])
async def patch_payroll_run_endpoint(
    run_id: int,
    run_data: PayrollRunPatch,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:mark_paid"]))
):
    """
    部分更新薪资审核信息，例如标记为已发放。

    - **run_id**: 薪资审核ID
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
        
        return DataResponse[PayrollRun](data=db_payroll_run)
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
    current_user = Depends(require_permissions(["payroll_run:manage"]))
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
    current_user = Depends(require_permissions(["payroll_run:export_bank"]))
):
    """
    为指定的薪资审核生成银行代发文件 (CSV格式)。

    - **run_id**: 薪资审核ID
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
@router.get("/payroll-entries", response_model=PaginationResponse[PayrollEntry])
async def get_payroll_entries(
    period_id: Optional[int] = None,
    actual_run_id: Optional[int] = Query(None, alias="payroll_run_id"),
    employee_id: Optional[int] = None,
    status_id: Optional[int] = None,
    department_name: Optional[str] = Query(None, description="部门名称筛选"),
    personnel_category_name: Optional[str] = Query(None, description="人员类别筛选"),
    min_gross_pay: Optional[float] = Query(None, description="最小应发工资"),
    max_gross_pay: Optional[float] = Query(None, description="最大应发工资"),
    min_net_pay: Optional[float] = Query(None, description="最小实发工资"),
    max_net_pay: Optional[float] = Query(None, description="最大实发工资"),
    sort_by: Optional[str] = Query(None, description="排序字段"),
    sort_order: Optional[str] = Query("asc", description="排序方向: asc 或 desc"),
    include_employee_details: bool = Query(False, description="是否包含员工姓名等详细信息"),
    include_payroll_period: bool = Query(False, description="是否包含工资周期信息"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:view"]))
):
    """
    获取工资明细列表，支持分页和过滤。

    - **period_id**: 工资周期ID，用于过滤特定工资周期的明细
    - **run_id**: 工资运行批次ID，用于过滤特定运行批次的明细
    - **employee_id**: 员工ID，用于过滤特定员工的明细
    - **status_id**: 状态ID，用于过滤特定状态的明细
    - **department_name**: 部门名称筛选
    - **personnel_category_name**: 人员类别筛选
    - **min_gross_pay**: 最小应发工资
    - **max_gross_pay**: 最大应发工资
    - **min_net_pay**: 最小实发工资
    - **max_net_pay**: 最大实发工资
    - **sort_by**: 排序字段
    - **sort_order**: 排序方向
    - **include_employee_details**: 是否包含员工姓名等详细信息
    - **include_payroll_period**: 是否包含工资周期信息
    - **search**: 搜索关键词，用于按员工姓名、工号等信息搜索
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        skip = (page - 1) * size
        
        entries_orm, total = crud.get_payroll_entries(
            db=db,
            skip=skip,
            limit=size,
            period_id=period_id,
            run_id=actual_run_id,
            employee_id=employee_id,
            status_id=status_id,
            search_term=search,
            department_name=department_name,
            personnel_category_name=personnel_category_name,
            min_gross_pay=min_gross_pay,
            max_gross_pay=max_gross_pay,
            min_net_pay=min_net_pay,
            max_net_pay=max_net_pay,
            sort_by=sort_by,
            sort_order=sort_order,
            include_employee_details=include_employee_details,
            include_payroll_period=include_payroll_period
        )

        data = []
        for entry_orm in entries_orm:
            entry_pydantic = PayrollEntry.model_validate(entry_orm)
            data.append(entry_pydantic)

        total_pages = (total + size - 1) // size if total > 0 else 1
        pagination_meta = PaginationMeta(
            page=page,
            size=size,
            total=total,
            totalPages=total_pages
        )
        return PaginationResponse[PayrollEntry](
            data=data,
            meta=pagination_meta
        )
        return {
            "data": data,
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


@router.get("/payroll-entries/{entry_id}", response_model=DataResponse[PayrollEntry])
async def get_payroll_entry(
    entry_id: int,
    include_employee_details: bool = Query(True, description="是否包含员工姓名等详细信息"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:view"]))
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
        return DataResponse[PayrollEntry](data=entry)
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


@router.post("/payroll-entries", response_model=DataResponse[PayrollEntry], status_code=status.HTTP_201_CREATED)
async def create_payroll_entry(
    entry: PayrollEntryCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:manage"]))
):
    """
    创建新工资明细。

    - 需要Super Admin或Payroll Admin角色
    """
    try:
        # 创建工资明细
        db_entry = crud.create_payroll_entry(db, entry)

        # 返回标准响应格式
        return DataResponse[PayrollEntry](data=db_entry)
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


@router.patch("/payroll-entries/{entry_id}", response_model=DataResponse[PayrollEntry])
async def patch_payroll_entry_details(
    entry_id: int,
    entry_data: PayrollEntryPatch,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:edit_details"]))
):
    """
    部分更新工资条目详情（例如，调整金额、备注）。
    需要 payroll_entry:edit_details 权限。
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
        return DataResponse[PayrollEntry](data=db_entry)
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


@router.put("/payroll-entries/{entry_id}", response_model=DataResponse[PayrollEntry])
async def update_payroll_entry(
    entry_id: int,
    entry: PayrollEntryUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:manage"]))
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
        return DataResponse[PayrollEntry](data=db_entry)
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
    current_user = Depends(require_permissions(["payroll_entry:manage"]))
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


@router.post("/payroll-entries/bulk/validate", response_model=BulkValidatePayrollEntriesResult, status_code=status.HTTP_200_OK)
async def bulk_validate_payroll_entries(
    payload: BulkValidatePayrollEntriesPayload,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:bulk_import"]))
):
    """
    批量验证薪资明细数据。

    - **payload**: 包含薪资周期ID和薪资明细列表的请求数据
    - 需要批量导入权限
    - 返回验证结果，包含统计信息和详细的验证错误
    """
    try:
        # 批量验证薪资明细
        validation_result = crud.bulk_validate_payroll_entries(
            db=db,
            payroll_period_id=payload.payroll_period_id,
            entries=payload.entries
        )

        # 构建响应
        result = BulkValidatePayrollEntriesResult(
            total=validation_result["total"],
            valid=validation_result["valid"],
            invalid=validation_result["invalid"],
            warnings=validation_result["warnings"],
            errors=validation_result["errors"],
            validatedData=validation_result["validatedData"]
        )

        return result
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


@router.post("/payroll-entries/bulk", response_model=BulkCreatePayrollEntriesResult, status_code=status.HTTP_201_CREATED)
async def bulk_create_payroll_entries(
    payload: BulkCreatePayrollEntriesPayload,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:bulk_import"]))
):
    """
    批量创建工资明细。

    - **payload**: 包含工资周期ID、工资明细列表和覆盖模式的请求数据
    - 需要批量导入权限
    """
    try:
        # 批量创建工资明细
        created_entries, errors = crud.bulk_create_payroll_entries(
            db=db,
            payroll_period_id=payload.payroll_period_id,
            entries=payload.entries,
            overwrite_mode=payload.overwrite_mode
        )

        # 构建响应
        result = BulkCreatePayrollEntriesResult(
            success_count=len(created_entries),
            error_count=len(errors),
            errors=errors,
            created_entries=created_entries
        )

        return result
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


# 添加薪资字段定义的API转发路由
@router.get(
    "/payroll-component-definitions",
    response_model=PaginationResponse[PayrollComponentDefinition],
    summary="获取薪资字段定义列表",
    description="获取所有薪资字段定义，支持按类型和启用状态过滤，以及自定义排序"
)
def get_payroll_component_definitions(
    type: Optional[str] = Query(None, description="组件类型，如'EARNING'、'DEDUCTION'等"),
    is_active: Optional[bool] = Query(None, description="是否启用"),
    sort_by: str = Query("display_order", description="排序字段"),
    sort_order: str = Query("asc", description="排序方向，asc或desc"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页记录数"),
    current_user = Depends(require_permissions(["payroll_component:view"])),
    db: Session = Depends(get_db_v2)
):
    """
    获取薪资字段定义列表，转发到config模块API
    """
    from ..routers.config.payroll_component_router import get_payroll_components
    
    # 转发请求到config模块的API，参数名要对应
    return get_payroll_components(
        component_type=type,
        is_active=is_active,
        search=None,  # 没有search参数
        page=page,
        size=size,
        current_user=current_user,
        db=db
    )

@router.get(
    "/payroll-component-definitions/{component_id}",
    response_model=PayrollComponentDefinition,
    summary="获取单个薪资字段定义",
    description="根据ID获取特定薪资字段定义的详细信息"
)
def get_payroll_component_definition(
    component_id: int = Path(..., description="薪资字段定义ID"),
    current_user = Depends(require_permissions(["payroll_component:view"])),
    db: Session = Depends(get_db_v2)
):
    """
    获取单个薪资字段定义，转发到config模块API
    """
    from ..routers.config.payroll_component_router import get_payroll_component
    
    # 获取组件定义
    return get_payroll_component(
        component_id=component_id,
        current_user=current_user,
        db=db
    )

@router.post(
    "/payroll-component-definitions",
    response_model=DataResponse[PayrollComponentDefinition],
    status_code=status.HTTP_201_CREATED,
    summary="创建薪资字段定义",
    description="创建新的薪资字段定义"
)
def create_payroll_component_definition(
    component: PayrollComponentDefinitionCreate,
    current_user = Depends(require_permissions(["payroll_component:manage"])),
    db: Session = Depends(get_db_v2)
):
    """
    创建薪资字段定义，转发到config模块API
    """
    from ..routers.config.payroll_component_router import create_payroll_component
    
    # 转发请求到config模块
    return create_payroll_component(
        component=component,
        current_user=current_user,
        db=db
    )

@router.put(
    "/payroll-component-definitions/{component_id}",
    response_model=DataResponse[PayrollComponentDefinition],
    summary="更新薪资字段定义",
    description="更新指定ID的薪资字段定义"
)
def update_payroll_component_definition(
    component_id: int,
    component: PayrollComponentDefinitionUpdate,
    current_user = Depends(require_permissions(["payroll_component:manage"])),
    db: Session = Depends(get_db_v2)
):
    """
    更新薪资字段定义，转发到config模块API
    """
    from ..routers.config.payroll_component_router import update_payroll_component
    
    # 转发请求到config模块
    return update_payroll_component(
        component_id=component_id,
        component=component,
        current_user=current_user,
        db=db
    )

@router.delete(
    "/payroll-component-definitions/{component_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除薪资字段定义",
    description="删除指定ID的薪资字段定义"
)
def delete_payroll_component_definition(
    component_id: int,
    current_user = Depends(require_permissions(["payroll_component:manage"])),
    db: Session = Depends(get_db_v2)
):
    """
    删除薪资字段定义，转发到config模块API
    """
    from ..routers.config.payroll_component_router import delete_payroll_component
    
    # 转发请求到config模块
    return delete_payroll_component(
        component_id=component_id,
        current_user=current_user,
        db=db
    )

@router.get("/calculation-logs", response_model=PaginationResponse[Dict[str, Any]])
async def get_calculation_logs(
    payroll_run_id: Optional[int] = Query(None, description="薪资运行ID筛选"),
    employee_id: Optional[int] = Query(None, description="员工ID筛选"), 
    component_code: Optional[str] = Query(None, description="组件代码筛选"),
    status: Optional[str] = Query(None, description="状态筛选: SUCCESS, ERROR, WARNING"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页记录数"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """
    获取计算日志列表，支持分页和筛选。
    这些日志记录了薪资计算的详细过程和结果。
    """
    try:
        from ..models.calculation_rules import CalculationLog
        from ..models.hr import Employee
        from ..models.payroll import PayrollRun
        from sqlalchemy import and_, desc, func
        
        # 构建查询
        query = db.query(
            CalculationLog.id.label("calculation_log_id"),
            CalculationLog.payroll_run_id,
            CalculationLog.employee_id,
            CalculationLog.component_code,
            CalculationLog.calculation_method,
            CalculationLog.result_amount,
            CalculationLog.status,
            CalculationLog.error_message,
            CalculationLog.execution_time_ms,
            CalculationLog.created_at,
            func.concat(Employee.first_name, ' ', Employee.last_name).label("employee_name"),
            PayrollRun.run_date,
            PayrollRun.status_lookup_value_id.label("run_status")
        ).join(
            Employee, CalculationLog.employee_id == Employee.id
        ).outerjoin(
            PayrollRun, CalculationLog.payroll_run_id == PayrollRun.id
        )
        
        # 应用筛选条件
        filters = []
        if payroll_run_id is not None:
            filters.append(CalculationLog.payroll_run_id == payroll_run_id)
        if employee_id is not None:
            filters.append(CalculationLog.employee_id == employee_id)
        if component_code:
            filters.append(CalculationLog.component_code.ilike(f"%{component_code}%"))
        if status:
            filters.append(CalculationLog.status == status)
            
        if filters:
            query = query.filter(and_(*filters))
        
        # 获取总数
        total = query.count()
        
        # 计算跳过的记录数并应用分页
        skip = (page - 1) * size
        logs = query.order_by(desc(CalculationLog.created_at)).offset(skip).limit(size).all()
        
        # 转换为字典格式
        result = []
        for log in logs:
            result.append({
                "calculation_log_id": log.calculation_log_id,
                "payroll_run_id": log.payroll_run_id,
                "employee_id": log.employee_id,
                "employee_name": log.employee_name,
                "component_code": log.component_code,
                "calculation_method": log.calculation_method,
                "result_amount": float(log.result_amount) if log.result_amount else 0.0,
                "status": log.status,
                "error_message": log.error_message,
                "execution_time_ms": log.execution_time_ms,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "run_date": log.run_date.isoformat() if log.run_date else None,
                "run_status": log.run_status
            })
        
        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1
        pagination_meta = PaginationMeta(
            page=page,
            size=size,
            total=total,
            totalPages=total_pages
        )
        return PaginationResponse[Dict[str, Any]](
            data=result,
            meta=pagination_meta
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )

@router.delete("/calculation-logs", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calculation_logs(
    payroll_run_id: Optional[int] = Query(None, description="删除指定薪资运行的计算日志"),
    employee_id: Optional[int] = Query(None, description="删除指定员工的计算日志"),
    confirm: bool = Query(False, description="确认删除操作"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    删除计算日志记录。
    
    - **payroll_run_id**: 删除指定薪资运行的所有计算日志
    - **employee_id**: 删除指定员工的所有计算日志  
    - **confirm**: 必须设置为true才能执行删除操作
    
    注意：删除操作不可逆，请谨慎使用。
    """
    try:
        if not confirm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="Bad Request",
                    details="必须设置 confirm=true 参数才能执行删除操作"
                )
            )
        
        from ..models.calculation_rules import CalculationLog
        from sqlalchemy import and_
        
        # 构建删除查询
        query = db.query(CalculationLog)
        
        filters = []
        if payroll_run_id is not None:
            filters.append(CalculationLog.payroll_run_id == payroll_run_id)
        if employee_id is not None:
            filters.append(CalculationLog.employee_id == employee_id)
            
        if not filters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="Bad Request", 
                    details="必须指定 payroll_run_id 或 employee_id 筛选条件"
                )
            )
        
        query = query.filter(and_(*filters))
        
        # 获取将要删除的记录数
        count = query.count()
        
        if count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details="未找到符合条件的计算日志记录"
                )
            )
        
        # 执行删除
        query.delete(synchronize_session=False)
        db.commit()
        
        return {"message": f"已成功删除 {count} 条计算日志记录"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )
