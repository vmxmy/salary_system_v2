"""
配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import date
import logging

from ..database import get_db_v2
from ..crud import config as crud
from ..pydantic_models.config import (
    SystemParameterCreate, SystemParameterUpdate, SystemParameter, SystemParameterListResponse,
    PayrollComponentDefinitionCreate, PayrollComponentDefinitionUpdate, PayrollComponentDefinitionListResponse,
    TaxBracketCreate, TaxBracketUpdate, TaxBracket, TaxBracketListResponse,
    SocialSecurityRateCreate, SocialSecurityRateUpdate, SocialSecurityRate, SocialSecurityRateListResponse,
    LookupTypeListResponse, LookupType, LookupTypeCreate, LookupTypeUpdate,
    LookupValueListResponse, LookupValue, LookupValueCreate, LookupValueUpdate,
    ReportTemplateResponse, ReportTemplateWithFields, ReportTemplateCreate, ReportTemplateUpdate,
    ReportFieldResponse, ReportFieldCreate, ReportFieldUpdate,
    CalculatedFieldResponse, CalculatedFieldCreate, CalculatedFieldUpdate,
    ReportDataSourceResponse, ReportDataSourceCreate, ReportDataSourceUpdate
)
# 从payroll模块导入PayrollComponentDefinition
from ..pydantic_models.payroll import PayrollComponentDefinition
from ..pydantic_models.common import DataResponse
from ..pydantic_models.security import User
from ...auth import get_current_user, require_permissions
from ..utils import create_error_response

# 创建logger实例
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/config",
    tags=["Configuration"],
)


# SystemParameter endpoints
@router.get("/parameters", response_model=SystemParameterListResponse)
async def get_system_parameters(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:view"]))
):
    """
    获取系统参数列表，支持分页和搜索。

    - **search**: 搜索关键字，可以匹配参数键、值或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取系统参数列表
        parameters, total = crud.get_system_parameters(
            db=db,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": parameters,
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


@router.get("/parameters/{parameter_id}", response_model=DataResponse[SystemParameter])
async def get_system_parameter(
    parameter_id: str,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:view"]))
):
    """
    根据ID或键获取系统参数详情。

    - **parameter_id**: 系统参数ID或键
    """
    try:
        # 尝试将参数ID转换为整数
        try:
            id_value = int(parameter_id)
            # 获取系统参数
            parameter = crud.get_system_parameter_by_id(db, id_value)
        except ValueError:
            # 如果无法转换为整数，则假设它是一个键
            parameter = crud.get_system_parameter_by_key(db, parameter_id)

        if not parameter:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"System parameter with ID or key '{parameter_id}' not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[SystemParameter](data=parameter)
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


@router.post("/parameters", response_model=DataResponse[SystemParameter], status_code=status.HTTP_201_CREATED)
async def create_system_parameter(
    parameter: SystemParameterCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:manage"]))
):
    """
    创建新系统参数。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建系统参数
        db_parameter = crud.create_system_parameter(db, parameter)

        # 返回标准响应格式
        return DataResponse[SystemParameter](data=db_parameter)
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


@router.put("/parameters/{parameter_id}", response_model=DataResponse[SystemParameter])
async def update_system_parameter(
    parameter_id: str,
    parameter: SystemParameterUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:manage"]))
):
    """
    更新系统参数信息。

    - **parameter_id**: 系统参数ID或键
    - 需要Super Admin或Config Admin角色
    """
    try:
        # 尝试将参数ID转换为整数
        try:
            id_value = int(parameter_id)
            # 获取系统参数
            db_parameter = crud.get_system_parameter_by_id(db, id_value)
            if db_parameter:
                # 更新系统参数
                update_data = parameter.model_dump(exclude_unset=True)
                for key, value in update_data.items():
                    setattr(db_parameter, key, value)
                db.commit()
                db.refresh(db_parameter)
            else:
                db_parameter = None
        except ValueError:
            # 如果无法转换为整数，则假设它是一个键
            db_parameter = crud.update_system_parameter(db, parameter_id, parameter)

        if not db_parameter:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"System parameter with ID or key '{parameter_id}' not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[SystemParameter](data=db_parameter)
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


@router.delete("/parameters/{parameter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_system_parameter(
    parameter_id: str,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:manage"]))
):
    """
    删除系统参数。

    - **parameter_id**: 系统参数ID或键
    - 需要Super Admin角色
    """
    try:
        # 尝试将参数ID转换为整数
        try:
            id_value = int(parameter_id)
            # 获取系统参数
            db_parameter = crud.get_system_parameter_by_id(db, id_value)
            if db_parameter:
                # 删除系统参数
                db.delete(db_parameter)
                db.commit()
                success = True
            else:
                success = False
        except ValueError:
            # 如果无法转换为整数，则假设它是一个键
            success = crud.delete_system_parameter(db, parameter_id)

        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"System parameter with ID or key '{parameter_id}' not found"
                )
            )

        # 返回204 No Content
        return None
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


# PayrollComponentDefinition endpoints
@router.get("/payroll-component-definitions", response_model=PayrollComponentDefinitionListResponse)
async def get_payroll_components(
    component_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:view"]))
):
    """
    获取工资组件定义列表，支持分页、搜索和过滤。

    - **component_type**: 组件类型，可以是 'Earning' 或 'Deduction'
    - **is_active**: 是否激活，用于过滤激活或未激活的组件
    - **search**: 搜索关键字，可以匹配代码、名称或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        try:
            # 获取工资组件定义列表
            result = crud.get_payroll_component_definitions(
                db=db,
                component_type=component_type,
                is_active=is_active,
                search=search,
                skip=skip,
                limit=size
            )

            # 返回标准响应格式
            return result
        except Exception as e:
            # 如果发生错误，返回空列表
            logging.error(f"Error getting payroll components: {str(e)}")
            return {
                "data": [],
                "meta": {
                    "page": page,
                    "size": size,
                    "total": 0,
                    "totalPages": 1
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


@router.get("/payroll-component-definitions/{component_id}", response_model=DataResponse[PayrollComponentDefinition])
async def get_payroll_component(
    component_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:view"]))
):
    """
    根据ID获取工资组件定义详情。

    - **component_id**: 工资组件定义ID
    """
    try:
        # 获取工资组件定义
        component = crud.get_payroll_component_definition(db, component_id)
        if not component:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll component definition with ID {component_id} not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[PayrollComponentDefinition](data=component)
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


@router.post("/payroll-component-definitions", response_model=DataResponse[PayrollComponentDefinition], status_code=status.HTTP_201_CREATED)
async def create_payroll_component(
    component: PayrollComponentDefinitionCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:manage"]))
):
    """
    创建新工资组件定义。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 将Pydantic模型转换为字典
        component_data = component.model_dump()
        
        # 创建工资组件定义
        db_component = crud.create_payroll_component_definition(db, component_data)

        # 返回标准响应格式
        return DataResponse[PayrollComponentDefinition](data=db_component)
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


@router.put("/payroll-component-definitions/{component_id}", response_model=DataResponse[PayrollComponentDefinition])
async def update_payroll_component(
    component_id: int,
    component: PayrollComponentDefinitionUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:manage"]))
):
    """
    更新工资组件定义信息。

    - **component_id**: 工资组件定义ID
    - 需要Super Admin或Config Admin角色
    """
    try:
        # 更新工资组件定义
        update_data = component.model_dump(exclude_unset=True)
        updated_component = crud.update_payroll_component_definition(
            db=db,
            component_id=component_id,
            component_data=update_data
        )
        if not updated_component:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll component definition with ID {component_id} not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[PayrollComponentDefinition](data=updated_component)
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


@router.delete("/payroll-component-definitions/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payroll_component(
    component_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:manage"]))
):
    """
    删除工资组件定义。

    - **component_id**: 工资组件定义ID
    - 需要Super Admin角色
    """
    try:
        # 删除工资组件定义
        success = crud.delete_payroll_component_definition(db, component_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll component definition with ID {component_id} not found"
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


# TaxBracket endpoints
@router.get("/tax-brackets", response_model=TaxBracketListResponse)
async def get_tax_brackets(
    region_code: Optional[str] = None,
    tax_type: Optional[str] = None,
    effective_date: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:view"]))
):
    """
    获取税率档位列表，支持分页、搜索和过滤。

    - **region_code**: 地区代码，用于过滤特定地区的税率档位
    - **tax_type**: 税种类型，用于过滤特定税种的税率档位
    - **effective_date**: 生效日期，用于过滤在指定日期有效的税率档位
    - **search**: 搜索关键字
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取税率档位列表
        tax_brackets, total = crud.get_tax_brackets(
            db=db,
            region_code=region_code,
            tax_type=tax_type,
            effective_date=effective_date,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": tax_brackets,
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


@router.get("/tax-brackets/{bracket_id}", response_model=DataResponse[TaxBracket])
async def get_tax_bracket(
    bracket_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:view"]))
):
    """
    根据ID获取税率档位详情。

    - **bracket_id**: 税率档位ID
    """
    try:
        # 获取税率档位
        tax_bracket = crud.get_tax_bracket(db, bracket_id)
        if not tax_bracket:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Tax bracket with ID {bracket_id} not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[TaxBracket](data=tax_bracket)
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


@router.post("/tax-brackets", response_model=DataResponse[TaxBracket], status_code=status.HTTP_201_CREATED)
async def create_tax_bracket(
    tax_bracket: TaxBracketCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:manage"]))
):
    """
    创建新税率档位。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建税率档位
        db_tax_bracket = crud.create_tax_bracket(db, tax_bracket)

        # 返回标准响应格式
        return DataResponse[TaxBracket](data=db_tax_bracket)
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


@router.put("/tax-brackets/{bracket_id}", response_model=DataResponse[TaxBracket])
async def update_tax_bracket(
    bracket_id: int,
    tax_bracket: TaxBracketUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:manage"]))
):
    """
    更新税率档位信息。

    - **bracket_id**: 税率档位ID
    - 需要Super Admin或Config Admin角色
    """
    try:
        # 更新税率档位
        db_tax_bracket = crud.update_tax_bracket(db, bracket_id, tax_bracket)
        if not db_tax_bracket:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Tax bracket with ID {bracket_id} not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[TaxBracket](data=db_tax_bracket)
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


@router.delete("/tax-brackets/{bracket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tax_bracket(
    bracket_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:manage"]))
):
    """
    删除税率档位。

    - **bracket_id**: 税率档位ID
    - 需要Super Admin角色
    """
    try:
        # 删除税率档位
        success = crud.delete_tax_bracket(db, bracket_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Tax bracket with ID {bracket_id} not found"
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


# SocialSecurityRate endpoints
@router.get("/social-security-rates", response_model=SocialSecurityRateListResponse)
async def get_social_security_rates(
    region_code: Optional[str] = None,
    rate_type: Optional[str] = None,
    effective_date: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:view"]))
):
    """
    获取社保费率列表，支持分页、搜索和过滤。

    - **region_code**: 地区代码，用于过滤特定地区的社保费率
    - **rate_type**: 费率类型，用于过滤特定费率类型的社保费率
    - **effective_date**: 生效日期，用于过滤在指定日期有效的社保费率
    - **search**: 搜索关键字
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        try:
            # 获取社保费率列表
            rates, total = crud.get_social_security_rates(
                db=db,
                region_code=region_code,
                rate_type=rate_type,
                effective_date=effective_date,
                search=search,
                skip=skip,
                limit=size
            )

            # 计算总页数
            total_pages = (total + size - 1) // size if total > 0 else 1

            # 返回标准响应格式
            return {
                "data": rates,
                "meta": {
                    "page": page,
                    "size": size,
                    "total": total,
                    "totalPages": total_pages
                }
            }
        except Exception as e:
            # 如果发生错误，返回空列表
            logging.error(f"Error getting social security rates: {str(e)}")
            return {
                "data": [],
                "meta": {
                    "page": page,
                    "size": size,
                    "total": 0,
                    "totalPages": 1
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


@router.get("/social-security-rates/{rate_id}", response_model=DataResponse[SocialSecurityRate])
async def get_social_security_rate(
    rate_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:view"]))
):
    """
    根据ID获取社保费率详情。

    - **rate_id**: 社保费率ID
    """
    try:
        # 获取社保费率
        rate = crud.get_social_security_rate(db, rate_id)
        if not rate:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Social security rate with ID {rate_id} not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[SocialSecurityRate](data=rate)
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


@router.post("/social-security-rates", response_model=DataResponse[SocialSecurityRate], status_code=status.HTTP_201_CREATED)
async def create_social_security_rate(
    rate: SocialSecurityRateCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:manage"]))
):
    """
    创建新社保费率。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建社保费率
        db_rate = crud.create_social_security_rate(db, rate)

        # 返回标准响应格式
        return DataResponse[SocialSecurityRate](data=db_rate)
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


@router.put("/social-security-rates/{rate_id}", response_model=DataResponse[SocialSecurityRate])
async def update_social_security_rate(
    rate_id: int,
    rate: SocialSecurityRateUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:manage"]))
):
    """
    更新社保费率信息。

    - **rate_id**: 社保费率ID
    - 需要Super Admin或Config Admin角色
    """
    try:
        # 更新社保费率
        db_rate = crud.update_social_security_rate(db, rate_id, rate)
        if not db_rate:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Social security rate with ID {rate_id} not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[SocialSecurityRate](data=db_rate)
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


@router.delete("/social-security-rates/{rate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_social_security_rate(
    rate_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:manage"]))
):
    """
    删除社保费率。

    - **rate_id**: 社保费率ID
    - 需要Super Admin角色
    """
    try:
        # 删除社保费率
        success = crud.delete_social_security_rate(db, rate_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Social security rate with ID {rate_id} not found"
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


# 添加获取薪资字段类型的API端点
@router.get("/payroll-component-types", response_model=LookupValueListResponse)
async def get_payroll_component_types(
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user),
):
    """获取薪资字段类型列表"""
    # 首先获取PAYROLL_COMPONENT_TYPE的type_id
    lookup_type = crud.get_lookup_type_by_code(db, "PAYROLL_COMPONENT_TYPE")
    if not lookup_type:
        return {"data": [], "meta": {"total": 0}}
    
    # 使用type_id获取lookup值
    lookup_values, total = crud.get_lookup_values(
        db=db, 
        lookup_type_id=lookup_type.id,
        is_active=True
    )
    return {"data": lookup_values, "meta": {"total": total}}


# 报表管理相关路由

@router.get("/report-templates", response_model=List[ReportTemplateResponse])
async def get_report_templates(
    user_id: Optional[int] = Query(None, description="用户ID"),
    category: Optional[str] = Query(None, description="报表分类"),
    is_active: Optional[bool] = Query(None, description="是否激活"),
    is_public: Optional[bool] = Query(None, description="是否公开"),
    search: Optional[str] = Query(None, description="搜索关键字"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板列表"""
    try:
        # 如果没有指定用户ID，使用当前用户ID
        if user_id is None:
            user_id = current_user.id
        
        templates, total = crud.get_report_templates(
            db=db,
            user_id=user_id,
            category=category,
            is_active=is_active,
            is_public=is_public,
            search=search,
            skip=skip,
            limit=limit
        )
        return templates
    except Exception as e:
        logger.error(f"Error getting report templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/report-templates/{template_id}", response_model=ReportTemplateWithFields)
async def get_report_template(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板详情（包含字段）"""
    try:
        template = crud.get_report_template_with_fields(db=db, template_id=template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Report template not found")
        
        # 检查权限
        if not template.is_public and template.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/report-templates", response_model=ReportTemplateResponse)
async def create_report_template(
    template: ReportTemplateCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表模板"""
    try:
        created_template = crud.create_report_template(
            db=db,
            template=template,
            user_id=current_user.id
        )
        return created_template
    except Exception as e:
        logger.error(f"Error creating report template: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/report-templates/{template_id}", response_model=ReportTemplateResponse)
async def update_report_template(
    template_id: int,
    template: ReportTemplateUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新报表模板"""
    try:
        updated_template = crud.update_report_template(
            db=db,
            template_id=template_id,
            template=template,
            user_id=current_user.id
        )
        if not updated_template:
            raise HTTPException(status_code=404, detail="Report template not found or access denied")
        
        return updated_template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/report-templates/{template_id}")
async def delete_report_template(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除报表模板"""
    try:
        success = crud.delete_report_template(
            db=db,
            template_id=template_id,
            user_id=current_user.id
        )
        if not success:
            raise HTTPException(status_code=404, detail="Report template not found or access denied")
        
        return {"message": "Report template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# 报表字段相关路由
@router.get("/report-templates/{template_id}/fields", response_model=List[ReportFieldResponse])
async def get_report_fields(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表字段列表"""
    try:
        # 检查模板是否存在和权限
        template = crud.get_report_template(db=db, template_id=template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Report template not found")
        
        if not template.is_public and template.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        fields = crud.get_report_fields(db=db, template_id=template_id)
        return fields
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report fields for template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/report-fields", response_model=ReportFieldResponse)
async def create_report_field(
    field: ReportFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表字段"""
    try:
        # 检查模板权限
        template = crud.get_report_template(db=db, template_id=field.template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Report template not found")
        
        if template.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        created_field = crud.create_report_field(db=db, field=field)
        return created_field
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating report field: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/report-fields/{field_id}", response_model=ReportFieldResponse)
async def update_report_field(
    field_id: int,
    field: ReportFieldUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新报表字段"""
    try:
        # 检查字段和模板权限
        existing_field = crud.get_report_field(db=db, field_id=field_id)
        if not existing_field:
            raise HTTPException(status_code=404, detail="Report field not found")
        
        template = crud.get_report_template(db=db, template_id=existing_field.template_id)
        if template.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        updated_field = crud.update_report_field(db=db, field_id=field_id, field=field)
        return updated_field
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report field {field_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/report-fields/{field_id}")
async def delete_report_field(
    field_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除报表字段"""
    try:
        # 检查字段和模板权限
        existing_field = crud.get_report_field(db=db, field_id=field_id)
        if not existing_field:
            raise HTTPException(status_code=404, detail="Report field not found")
        
        template = crud.get_report_template(db=db, template_id=existing_field.template_id)
        if template.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        success = crud.delete_report_field(db=db, field_id=field_id)
        if not success:
            raise HTTPException(status_code=404, detail="Report field not found")
        
        return {"message": "Report field deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report field {field_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# 计算字段相关路由
@router.get("/calculated-fields", response_model=List[CalculatedFieldResponse])
async def get_calculated_fields(
    user_id: Optional[int] = Query(None, description="用户ID"),
    is_global: Optional[bool] = Query(None, description="是否全局字段"),
    is_active: Optional[bool] = Query(None, description="是否激活"),
    category: Optional[str] = Query(None, description="字段分类"),
    search: Optional[str] = Query(None, description="搜索关键字"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取计算字段列表"""
    try:
        # 如果没有指定用户ID，使用当前用户ID
        if user_id is None:
            user_id = current_user.id
        
        fields, total = crud.get_calculated_fields(
            db=db,
            user_id=user_id,
            is_global=is_global,
            is_active=is_active,
            category=category,
            search=search,
            skip=skip,
            limit=limit
        )
        return fields
    except Exception as e:
        logger.error(f"Error getting calculated fields: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/calculated-fields", response_model=CalculatedFieldResponse)
async def create_calculated_field(
    field: CalculatedFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建计算字段"""
    try:
        created_field = crud.create_calculated_field(
            db=db,
            field=field,
            user_id=current_user.id
        )
        return created_field
    except Exception as e:
        logger.error(f"Error creating calculated field: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/calculated-fields/{field_id}", response_model=CalculatedFieldResponse)
async def update_calculated_field(
    field_id: int,
    field: CalculatedFieldUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新计算字段"""
    try:
        updated_field = crud.update_calculated_field(
            db=db,
            field_id=field_id,
            field=field,
            user_id=current_user.id
        )
        if not updated_field:
            raise HTTPException(status_code=404, detail="Calculated field not found or access denied")
        
        return updated_field
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating calculated field {field_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/calculated-fields/{field_id}")
async def delete_calculated_field(
    field_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除计算字段"""
    try:
        success = crud.delete_calculated_field(
            db=db,
            field_id=field_id,
            user_id=current_user.id
        )
        if not success:
            raise HTTPException(status_code=404, detail="Calculated field not found or access denied")
        
        return {"message": "Calculated field deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting calculated field {field_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# 数据源相关路由
@router.get("/report-data-sources", response_model=List[ReportDataSourceResponse])
async def get_report_data_sources(
    is_active: Optional[bool] = Query(None, description="是否激活"),
    schema_name: Optional[str] = Query(None, description="模式名"),
    search: Optional[str] = Query(None, description="搜索关键字"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表数据源列表"""
    try:
        sources, total = crud.get_report_data_sources(
            db=db,
            is_active=is_active,
            schema_name=schema_name,
            search=search,
            skip=skip,
            limit=limit
        )
        return sources
    except Exception as e:
        logger.error(f"Error getting report data sources: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/report-data-sources", response_model=ReportDataSourceResponse)
async def create_report_data_source(
    source: ReportDataSourceCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表数据源"""
    try:
        created_source = crud.create_report_data_source(db=db, source=source)
        return created_source
    except Exception as e:
        logger.error(f"Error creating report data source: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/report-data-sources/{source_id}", response_model=ReportDataSourceResponse)
async def update_report_data_source(
    source_id: int,
    source: ReportDataSourceUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新报表数据源"""
    try:
        updated_source = crud.update_report_data_source(
            db=db,
            source_id=source_id,
            source=source
        )
        if not updated_source:
            raise HTTPException(status_code=404, detail="Report data source not found")
        
        return updated_source
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report data source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/report-data-sources/{source_id}")
async def delete_report_data_source(
    source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除报表数据源"""
    try:
        success = crud.delete_report_data_source(db=db, source_id=source_id)
        if not success:
            raise HTTPException(status_code=404, detail="Report data source not found")
        
        return {"message": "Report data source deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report data source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
