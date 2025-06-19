"""
字典类型 (LookupType) 和字典值 (LookupValue) 配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from ...database import get_db_v2
from webapp.v2.crud import config as crud # Assuming crud functions for lookup are in config.py
from ...pydantic_models.config import (
    LookupTypeListResponse, LookupType, LookupTypeCreate, LookupTypeUpdate,
    LookupValueListResponse, LookupValue, LookupValueCreate, LookupValueUpdate
)
from ...pydantic_models.common import DataResponse
from webapp.auth import get_current_user, require_permissions, smart_require_permissions # User for some, permissions for others
from ...utils import create_error_response
from ...pydantic_models import security as v2_security_schemas # Import security schemas for User model
from ...models.config import PayrollComponentDefinition
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    # No common prefix for lookup types and values directly under /config, 
    # so prefix will be set in main app or a higher-level config router if needed.
    # For now, individual prefixes for sub-sections.
    tags=["Configuration - Lookups"],
)

# Existing endpoint from config.py
@router.get("/payroll-component-types", response_model=LookupValueListResponse)
async def get_payroll_component_types(
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user),
):
    """获取薪资字段类型列表 (这是一个特殊的lookup)"""
    try:
        # 从 payroll.payroll_component_definitions 表中直接获取所有唯一的 type 值
        distinct_types_query = db.query(PayrollComponentDefinition.type).distinct().filter(
            PayrollComponentDefinition.type.isnot(None)
        )
        distinct_types = [row[0] for row in distinct_types_query.all() if row[0] is not None]
        
        # 添加调试日志
        logger.info(f"从数据库获取到的PayrollComponentDefinition类型: {distinct_types}")
        
        # 标准化类型名称和显示（简单映射中英文）
        type_display_map = {
            "EARNING": "应发项",
            "DEDUCTION": "扣除项",
            "PERSONAL_DEDUCTION": "个人扣缴项",
            "EMPLOYER_DEDUCTION": "单位扣缴项", 
            "STATUTORY": "法定项目",
            "STAT": "法定项目",
            "BENEFIT": "福利项目",
            "OTHER": "其他项目",
            "REFUND_DEDUCTION_ADJUSTMENT": "补扣（退）款"
        }
        
        if len(distinct_types) == 0:
            # 如果数据库中没有类型，提供默认类型
            logger.warning("数据库中没有找到薪资组件类型，使用默认值")
            distinct_types = ["EARNING", "DEDUCTION", "PERSONAL_DEDUCTION", "EMPLOYER_DEDUCTION", "STATUTORY", "BENEFIT", "OTHER", "REFUND_DEDUCTION_ADJUSTMENT"]

        # 将查询结果转换为前端期望的 LookupValue 格式
        lookup_values_pydantic = []
        for i, type_code in enumerate(distinct_types):
            name = type_display_map.get(type_code, type_code)
            lookup_values_pydantic.append(
                LookupValue(
                    id=i + 1,
                    lookup_type_id=999,
                    code=type_code,
                    name=name,
                    is_active=True
                )
            )

        logger.info(f"返回的薪资组件类型数量: {len(lookup_values_pydantic)}")
        
        return LookupValueListResponse(
            data=lookup_values_pydantic,
            meta={"page":1, "size":len(lookup_values_pydantic), "total": len(lookup_values_pydantic), "totalPages":1}
        )
    except Exception as e:
        logger.error(f"Error getting payroll component types: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(500, "Internal Server Error", str(e))
        )

# --- LookupType Endpoints ---
@router.post("/lookup-types", response_model=DataResponse[LookupType], status_code=status.HTTP_201_CREATED)
async def create_lookup_type_endpoint(
    lookup_type_in: LookupTypeCreate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:manage"]))
):
    try:
        created_lookup_type = crud.create_lookup_type(db, lookup_type_in)
        return DataResponse[LookupType](data=created_lookup_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=create_error_response(422, str(e)))
    except Exception as e:
        logger.error(f"Error creating lookup type: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/lookup-types", response_model=LookupTypeListResponse)
async def get_lookup_types_endpoint(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:view"]))
):
    try:
        skip = (page - 1) * size
        types, total = crud.get_lookup_types(db, search=search, skip=skip, limit=size)
        total_pages = (total + size - 1) // size if total > 0 else 1
        return LookupTypeListResponse(data=types, meta={"page": page, "size": size, "total": total, "totalPages": total_pages})
    except Exception as e:
        logger.error(f"Error getting lookup types: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/lookup-types/{type_id_or_code}", response_model=DataResponse[LookupType])
async def get_lookup_type_endpoint(
    type_id_or_code: str,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:view"]))
):
    try:
        lookup_type = None
        try:
            type_id = int(type_id_or_code)
            lookup_type = crud.get_lookup_type(db, type_id)
        except ValueError:
            lookup_type = crud.get_lookup_type_by_code(db, type_id_or_code)
        
        if not lookup_type:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupType not found"))
        return DataResponse[LookupType](data=lookup_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lookup type {type_id_or_code}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.put("/lookup-types/{type_id}", response_model=DataResponse[LookupType]) # Assuming update by ID only for now
async def update_lookup_type_endpoint(
    type_id: int,
    lookup_type_in: LookupTypeUpdate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:manage"]))
):
    try:
        updated_type = crud.update_lookup_type(db, type_id, lookup_type_in)
        if not updated_type:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupType not found for update"))
        return DataResponse[LookupType](data=updated_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=create_error_response(422, str(e)))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lookup type {type_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.delete("/lookup-types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lookup_type_endpoint(
    type_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:manage"]))
):
    try:
        success = crud.delete_lookup_type(db, type_id)
        if not success:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupType not found or failed to delete"))
        return None
    except ValueError as e: # If it's in use
        raise HTTPException(status_code=409, detail=create_error_response(409, "Conflict", str(e)))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lookup type {type_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

# --- LookupValue Endpoints --- 
@router.post("/lookup-values", response_model=DataResponse[LookupValue], status_code=status.HTTP_201_CREATED)
async def create_lookup_value_endpoint(
    lookup_value_in: LookupValueCreate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:manage"]))
):
    try:
        # Ensure the referenced lookup_type_id exists
        lookup_type = crud.get_lookup_type(db, lookup_value_in.lookup_type_id)
        if not lookup_type:
            raise ValueError(f"LookupType with ID {lookup_value_in.lookup_type_id} not found.")
        created_value = crud.create_lookup_value(db, lookup_value_in)
        return DataResponse[LookupValue](data=created_value)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=create_error_response(422, "Unprocessable Entity", str(e)))
    except Exception as e:
        logger.error(f"Error creating lookup value: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/lookup-values", response_model=LookupValueListResponse)
async def get_lookup_values_endpoint(
    lookup_type_code: Optional[str] = None,
    lookup_type_id: Optional[int] = None,
    is_active: Optional[bool] = True,
    parent_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(smart_require_permissions(["lookup_value:view"]))  # 🚀 使用高性能权限检查
):
    try:
        # Performance optimization: Use direct SQL query instead of ORM
        from sqlalchemy import text
        
        if lookup_type_code:
            # Optimized query for type_code lookup
            query = text("""
                SELECT 
                    lv.id,
                    lv.lookup_type_id,
                    lv.code,
                    lv.name,
                    lv.description,
                    lv.sort_order,
                    lv.is_active,
                    lv.parent_lookup_value_id
                FROM config.lookup_values lv
                JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
                WHERE lt.code = :type_code
                  AND (:is_active IS NULL OR lv.is_active = :is_active)
                  AND (:search IS NULL OR lv.name ILIKE :search_pattern OR lv.code ILIKE :search_pattern)
                ORDER BY lv.sort_order ASC, lv.code ASC
                LIMIT :limit OFFSET :offset
            """)
            
            count_query = text("""
                SELECT COUNT(*)
                FROM config.lookup_values lv
                JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
                WHERE lt.code = :type_code
                  AND (:is_active IS NULL OR lv.is_active = :is_active)
                  AND (:search IS NULL OR lv.name ILIKE :search_pattern OR lv.code ILIKE :search_pattern)
            """)
            
            params = {
                'type_code': lookup_type_code,
                'is_active': is_active,
                'search': search,
                'search_pattern': f"%{search}%" if search else None,
                'limit': size,
                'offset': (page - 1) * size
            }
            
        elif lookup_type_id:
            # Optimized query for type_id lookup
            query = text("""
                SELECT 
                    lv.id,
                    lv.lookup_type_id,
                    lv.code,
                    lv.name,
                    lv.description,
                    lv.sort_order,
                    lv.is_active,
                    lv.parent_lookup_value_id
                FROM config.lookup_values lv
                WHERE lv.lookup_type_id = :type_id
                  AND (:is_active IS NULL OR lv.is_active = :is_active)
                  AND (:search IS NULL OR lv.name ILIKE :search_pattern OR lv.code ILIKE :search_pattern)
                ORDER BY lv.sort_order ASC, lv.code ASC
                LIMIT :limit OFFSET :offset
            """)
            
            count_query = text("""
                SELECT COUNT(*)
                FROM config.lookup_values lv
                WHERE lv.lookup_type_id = :type_id
                  AND (:is_active IS NULL OR lv.is_active = :is_active)
                  AND (:search IS NULL OR lv.name ILIKE :search_pattern OR lv.code ILIKE :search_pattern)
            """)
            
            params = {
                'type_id': lookup_type_id,
                'is_active': is_active,
                'search': search,
                'search_pattern': f"%{search}%" if search else None,
                'limit': size,
                'offset': (page - 1) * size
            }
        else:
            # Return empty result if no type specified
            return LookupValueListResponse(data=[], meta={"page": page, "size": size, "total": 0, "totalPages": 0})
        
        # Execute queries
        result = db.execute(query, params)
        values = [dict(row._mapping) for row in result]
        
        count_result = db.execute(count_query, params)
        total = count_result.scalar()
        
        total_pages = (total + size - 1) // size if total > 0 else 1
        return LookupValueListResponse(data=values, meta={"page": page, "size": size, "total": total, "totalPages": total_pages})
        
    except Exception as e:
        logger.error(f"Error getting lookup values: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/lookup-values/{value_id}", response_model=DataResponse[LookupValue])
async def get_lookup_value_endpoint(
    value_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:view"]))
):
    try:
        lookup_value = crud.get_lookup_value(db, value_id)
        if not lookup_value:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupValue not found"))
        return DataResponse[LookupValue](data=lookup_value)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lookup value {value_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.put("/lookup-values/{value_id}", response_model=DataResponse[LookupValue])
async def update_lookup_value_endpoint(
    value_id: int,
    lookup_value_in: LookupValueUpdate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:manage"]))
):
    try:
        updated_value = crud.update_lookup_value(db, value_id, lookup_value_in)
        if not updated_value:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupValue not found for update"))
        return DataResponse[LookupValue](data=updated_value)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=create_error_response(422, "Unprocessable Entity", str(e)))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lookup value {value_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.delete("/lookup-values/{value_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lookup_value_endpoint(
    value_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:manage"]))
):
    try:
        success = crud.delete_lookup_value(db, value_id)
        if not success:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupValue not found or failed to delete"))
        return None
    except ValueError as e: # If it's in use or other FK constraint
        raise HTTPException(status_code=409, detail=create_error_response(409, "Conflict", str(e)))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lookup value {value_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

# --- 高性能公共 Lookup 端点 (无权限检查) ---
@router.get("/lookup-values-public", response_model=LookupValueListResponse)
async def get_lookup_values_public_endpoint(
    lookup_type_code: str,  # 必须提供type_code
    is_active: Optional[bool] = True,  # 默认只返回活跃的
    db: Session = Depends(get_db_v2)
    # 注意：此端点没有权限检查，仅用于公共lookup数据
):
    """
    高性能公共lookup查询端点
    - 仅支持lookup_type_code查询
    - 默认返回活跃数据
    - 无权限检查，性能优化
    - 专门用于前端初始化时大量lookup数据加载
    """
    try:
        # 直接使用原生SQL，跳过所有ORM开销
        from sqlalchemy import text
        
        # 预定义的安全lookup类型（仅允许查询这些公共数据）
        safe_lookup_types = {
            'GENDER', 'EMPLOYEE_STATUS', 'EMPLOYMENT_TYPE', 'CONTRACT_TYPE', 
            'CONTRACT_STATUS', 'MARITAL_STATUS', 'EDUCATION_LEVEL', 
            'LEAVE_TYPE', 'PAY_FREQUENCY', 'JOB_POSITION_LEVEL', 
            'POLITICAL_STATUS', 'PAYROLL_COMPONENT_TYPE'
        }
        
        if lookup_type_code not in safe_lookup_types:
            raise HTTPException(
                status_code=400, 
                detail=create_error_response(400, "Bad Request", f"Lookup type '{lookup_type_code}' not allowed for public access")
            )
        
        # 超高性能查询：直接SQL，无分页，无复杂条件
        query = text("""
            SELECT 
                lv.id,
                lv.lookup_type_id,
                lv.code,
                lv.name,
                lv.description,
                lv.sort_order,
                lv.is_active,
                lv.parent_lookup_value_id
            FROM config.lookup_values lv
            JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
            WHERE lt.code = :type_code
              AND (:is_active IS NULL OR lv.is_active = :is_active)
            ORDER BY lv.sort_order ASC, lv.code ASC
            LIMIT 100
        """)
        
        params = {
            'type_code': lookup_type_code,
            'is_active': is_active
        }
        
        # 执行查询
        result = db.execute(query, params)
        values = [dict(row._mapping) for row in result]
        
        return LookupValueListResponse(
            data=values, 
            meta={
                "page": 1, 
                "size": len(values), 
                "total": len(values), 
                "totalPages": 1
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting public lookup values for {lookup_type_code}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))
