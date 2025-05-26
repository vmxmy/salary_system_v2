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
    LookupValueListResponse, LookupValue, LookupValueCreate, LookupValueUpdate
)
# 从payroll模块导入PayrollComponentDefinition
from ..pydantic_models.payroll import PayrollComponentDefinition
from ..pydantic_models.security import User
from ...auth import get_current_user, require_permissions
from ..utils import create_error_response

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
    current_user = Depends(require_permissions(["P_SYSTEM_PARAMETER_VIEW"]))
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


@router.get("/parameters/{parameter_id}", response_model=Dict[str, SystemParameter])
async def get_system_parameter(
    parameter_id: str,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_SYSTEM_PARAMETER_VIEW"]))
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
        return {"data": parameter}
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


@router.post("/parameters", response_model=Dict[str, SystemParameter], status_code=status.HTTP_201_CREATED)
async def create_system_parameter(
    parameter: SystemParameterCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_SYSTEM_PARAMETER_MANAGE"]))
):
    """
    创建新系统参数。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建系统参数
        db_parameter = crud.create_system_parameter(db, parameter)

        # 返回标准响应格式
        return {"data": db_parameter}
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


@router.put("/parameters/{parameter_id}", response_model=Dict[str, SystemParameter])
async def update_system_parameter(
    parameter_id: str,
    parameter: SystemParameterUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_SYSTEM_PARAMETER_MANAGE"]))
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
        return {"data": db_parameter}
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
    current_user = Depends(require_permissions(["P_SYSTEM_PARAMETER_MANAGE"]))
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
@router.get("/payroll-components", response_model=PayrollComponentDefinitionListResponse)
async def get_payroll_components(
    component_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_COMPONENT_VIEW"]))
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


@router.get("/payroll-components/{component_id}", response_model=Dict[str, PayrollComponentDefinition])
async def get_payroll_component(
    component_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_COMPONENT_VIEW"]))
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
        return {"data": component}
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


@router.post("/payroll-components", response_model=Dict[str, PayrollComponentDefinition], status_code=status.HTTP_201_CREATED)
async def create_payroll_component(
    component: PayrollComponentDefinitionCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_COMPONENT_MANAGE"]))
):
    """
    创建新工资组件定义。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建工资组件定义
        db_component = crud.create_payroll_component_definition(db, component)

        # 返回标准响应格式
        return {"data": db_component}
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


@router.put("/payroll-components/{component_id}", response_model=Dict[str, PayrollComponentDefinition])
async def update_payroll_component(
    component_id: int,
    component: PayrollComponentDefinitionUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_COMPONENT_MANAGE"]))
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
        return {"data": updated_component}
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


@router.delete("/payroll-components/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payroll_component(
    component_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PAYROLL_COMPONENT_MANAGE"]))
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
    current_user = Depends(require_permissions(["P_TAX_BRACKET_VIEW"]))
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


@router.get("/tax-brackets/{bracket_id}", response_model=Dict[str, TaxBracket])
async def get_tax_bracket(
    bracket_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_TAX_BRACKET_VIEW"]))
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
        return {"data": tax_bracket}
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


@router.post("/tax-brackets", response_model=Dict[str, TaxBracket], status_code=status.HTTP_201_CREATED)
async def create_tax_bracket(
    tax_bracket: TaxBracketCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_TAX_BRACKET_MANAGE"]))
):
    """
    创建新税率档位。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建税率档位
        db_tax_bracket = crud.create_tax_bracket(db, tax_bracket)

        # 返回标准响应格式
        return {"data": db_tax_bracket}
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


@router.put("/tax-brackets/{bracket_id}", response_model=Dict[str, TaxBracket])
async def update_tax_bracket(
    bracket_id: int,
    tax_bracket: TaxBracketUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_TAX_BRACKET_MANAGE"]))
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
        return {"data": db_tax_bracket}
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
    current_user = Depends(require_permissions(["P_TAX_BRACKET_MANAGE"]))
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
    current_user = Depends(require_permissions(["P_SOCIAL_SECURITY_RATE_VIEW"]))
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


@router.get("/social-security-rates/{rate_id}", response_model=Dict[str, SocialSecurityRate])
async def get_social_security_rate(
    rate_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_SOCIAL_SECURITY_RATE_VIEW"]))
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
        return {"data": rate}
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


@router.post("/social-security-rates", response_model=Dict[str, SocialSecurityRate], status_code=status.HTTP_201_CREATED)
async def create_social_security_rate(
    rate: SocialSecurityRateCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_SOCIAL_SECURITY_RATE_MANAGE"]))
):
    """
    创建新社保费率。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建社保费率
        db_rate = crud.create_social_security_rate(db, rate)

        # 返回标准响应格式
        return {"data": db_rate}
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


@router.put("/social-security-rates/{rate_id}", response_model=Dict[str, SocialSecurityRate])
async def update_social_security_rate(
    rate_id: int,
    rate: SocialSecurityRateUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_SOCIAL_SECURITY_RATE_MANAGE"]))
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
        return {"data": db_rate}
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
    current_user = Depends(require_permissions(["P_SOCIAL_SECURITY_RATE_MANAGE"]))
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


@router.get(
    "/v2/payroll-component-definitions",
    response_model=PayrollComponentDefinitionListResponse,
    summary="获取薪资组件定义列表",
    description="获取所有薪资组件定义，支持按类型和启用状态过滤，以及自定义排序"
)
def get_payroll_component_definitions(
    type: Optional[str] = Query(None, description="组件类型，如'EARNING'、'DEDUCTION'等"),
    is_enabled: Optional[bool] = Query(None, description="是否启用"),
    search: Optional[str] = Query(None, description="搜索关键字，可匹配代码、名称或描述"),
    sort_by: str = Query("display_order", description="排序字段"),
    sort_order: str = Query("asc", description="排序方向，asc或desc"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页记录数"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_v2)
):
    """
    获取薪资组件定义列表，支持分页、过滤和排序
    """
    # 调整数据库字段与API字段的映射
    db_sort_by = sort_by
    if sort_by == "sort_order":
        db_sort_by = "display_order"
    elif sort_by == "is_enabled":
        db_sort_by = "is_active"
        
    # 调用CRUD方法获取数据
    result = crud.get_payroll_component_definitions(
        db=db,
        component_type=type,
        is_active=is_enabled,
        search=search,
        sort_by=db_sort_by,
        sort_order=sort_order,
        skip=(page - 1) * size,
        limit=size
    )
    
    # 处理返回数据，将数据库模型映射为前端期望的格式
    data = []
    for item in result["data"]:
        data.append(
            PayrollComponentDefinition.model_validate(item)
        )
    
    return {
        "data": data,
        "meta": result["meta"]
    }

@router.get(
    "/v2/payroll-component-definitions/{component_id}",
    response_model=PayrollComponentDefinition,
    summary="获取单个薪资组件定义",
    description="根据ID获取特定薪资组件定义的详细信息"
)
def get_payroll_component_definition(
    component_id: int = Path(..., description="薪资组件定义ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_v2)
):
    """
    获取特定薪资组件定义
    """
    component = crud.get_payroll_component_definition_by_id(db, component_id)
    if not component:
        raise HTTPException(status_code=404, detail="薪资组件定义不存在")
    
    return PayrollComponentDefinition.model_validate(component)

# 添加获取薪资组件类型的API端点
@router.get("/payroll-component-types", response_model=LookupValueListResponse)
async def get_payroll_component_types(
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user),
):
    """获取薪资组件类型列表"""
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
