"""
实际任职 (Positions) 相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from ..database import get_db_v2
from ..crud import get_positions
from ..pydantic_models.hr import Position, PositionListResponse, PositionCreate, PositionUpdate # 添加导入PositionCreate和PositionUpdate
from ...auth import require_permissions # UNCOMMENTED
from ..utils import create_error_response # Added for standardized error responses
from ..models.hr import Position as PositionModel # 导入ORM模型

router = APIRouter(
    prefix="/positions",
    tags=["Positions"],
)

@router.get("/", response_model=PositionListResponse) # Corrected response_model
async def get_all_positions(
    search: Optional[str] = Query(None, description="Search term for name or code"), # UNCOMMENTED
    page: int = Query(1, ge=1, description="Page number"), # UNCOMMENTED
    size: int = Query(10, ge=1, le=1000, description="Page size"), # UNCOMMENTED, changed le to 1000
    is_active: Optional[bool] = Query(None, description="Filter by active status"), # UNCOMMENTED
    db: Session = Depends(get_db_v2), # UNCOMMENTED
    current_user = Depends(require_permissions(["job_title:view"])) # UNCOMMENTED, assuming job_title:view permission
):
    """
    获取实际任职列表，支持分页、搜索和按激活状态过滤。
    """
    try:
        positions_orms, total = get_positions(
            db=db, 
            search=search, 
            skip=(page-1)*size, 
            limit=size, 
            is_active=is_active
        )
        
        # Ensure Pydantic models are validated from ORM objects
        # The Position Pydantic model should have Config.from_attributes = True
        # positions_data = [Position.model_validate(pos) for pos in positions_orms] # This is implicit if response_model is used correctly with from_attributes=True

        total_pages = (total + size - 1) // size if total > 0 else 1
        return {
            "data": positions_orms, # FastAPI will handle validation against Position for list items
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        # Log the exception for debugging purposes
        # logger.error(f"Error fetching positions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error while fetching positions.",
                details=str(e)
            )
        )

@router.post("/", response_model=Position, status_code=status.HTTP_201_CREATED)
async def create_position(
    position_data: PositionCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["job_title:manage"]))
):
    """
    创建新的实际任职。
    """
    try:
        # 检查职位名称是否已存在
        existing_position = db.query(PositionModel).filter(PositionModel.name == position_data.name).first()
        if existing_position:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="Position with this name already exists.",
                    details=f"A position with name '{position_data.name}' already exists."
                )
            )
        
        # 如果提供了code，检查是否唯一
        if position_data.code:
            existing_code = db.query(PositionModel).filter(PositionModel.code == position_data.code).first()
            if existing_code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=create_error_response(
                        status_code=400,
                        message="Position with this code already exists.",
                        details=f"A position with code '{position_data.code}' already exists."
                    )
                )
        
        # 创建新职位
        db_position = PositionModel(**position_data.model_dump(exclude_unset=True))
        db.add(db_position)
        db.commit()
        db.refresh(db_position)
        return db_position
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        db.rollback()  # 回滚事务
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error while creating position.",
                details=str(e)
            )
        )

# --- 高性能公共 Position 端点 (无权限检查) ---
@router.get("/public", response_model=PositionListResponse)
async def get_positions_public(
    is_active: bool = True,  # 默认只返回活跃职位
    db: Session = Depends(get_db_v2)
    # 注意：此端点没有权限检查，仅用于公共position数据
):
    """
    高性能公共职位查询端点
    - 默认返回活跃职位
    - 无权限检查，性能优化
    - 专门用于前端初始化时position数据加载
    """
    try:
        # 直接使用原生SQL，跳过所有ORM开销
        from sqlalchemy import text
        
        # 超高性能查询：直接SQL，无分页，无复杂条件
        query = text("""
            SELECT 
                p.id,
                p.code,
                p.name,
                p.description,
                p.parent_position_id,
                p.effective_date,
                p.end_date,
                p.is_active
            FROM hr.positions p
            WHERE (:is_active IS NULL OR p.is_active = :is_active)
            ORDER BY p.code ASC
            LIMIT 200
        """)
        
        params = {'is_active': is_active}
        
        # 执行查询
        result = db.execute(query, params)
        positions = [dict(row._mapping) for row in result]
        
        return PositionListResponse(
            data=positions, 
            meta={
                "page": 1, 
                "size": len(positions), 
                "total": len(positions), 
                "totalPages": 1
            }
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


@router.get("/{position_id}", response_model=Position)
async def get_position_by_id(
    position_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["job_title:view"]))
):
    """
    根据ID获取实际任职详情。
    """
    try:
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
        if db_position is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Position not found.",
                    details=f"Position with ID {position_id} not found."
                )
            )
        return db_position
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error while fetching position.",
                details=str(e)
            )
        )

@router.put("/{position_id}", response_model=Position)
async def update_position(
    position_id: int,
    position_data: PositionUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["job_title:manage"]))
):
    """
    更新实际任职信息。
    """
    try:
        # 检查职位是否存在
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
        if db_position is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Position not found.",
                    details=f"Position with ID {position_id} not found."
                )
            )
        
        # 如果更新name，检查是否与其他职位冲突
        if position_data.name is not None and position_data.name != db_position.name:
            existing_position = db.query(PositionModel).filter(
                PositionModel.name == position_data.name,
                PositionModel.id != position_id
            ).first()
            if existing_position:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=create_error_response(
                        status_code=400,
                        message="Position with this name already exists.",
                        details=f"A position with name '{position_data.name}' already exists."
                    )
                )
        
        # 如果更新code，检查是否与其他职位冲突
        if position_data.code is not None and position_data.code != db_position.code:
            existing_code = db.query(PositionModel).filter(
                PositionModel.code == position_data.code,
                PositionModel.id != position_id
            ).first()
            if existing_code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=create_error_response(
                        status_code=400,
                        message="Position with this code already exists.",
                        details=f"A position with code '{position_data.code}' already exists."
                    )
                )
        
        # 更新职位信息
        update_data = position_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_position, key, value)
        
        db.commit()
        db.refresh(db_position)
        return db_position
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()  # 回滚事务
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error while updating position.",
                details=str(e)
            )
        )

@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(
    position_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["job_title:manage"]))
):
    """
    删除实际任职。
    """
    try:
        # 检查职位是否存在
        db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
        if db_position is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Position not found.",
                    details=f"Position with ID {position_id} not found."
                )
            )
        
        # 检查是否有依赖关系（如员工引用了该职位）
        from ..models.hr import Employee  # 导入Employee模型
        has_employees = db.query(Employee).filter(
            Employee.actual_position_id == position_id
        ).first()
        
        if has_employees:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="无法删除职位",
                    details=f"该职位仍有员工在任，无法删除。当前在任员工：{has_employees.last_name}{has_employees.first_name}（工号：{has_employees.employee_code or '无'}）"
                )
            )
        
        # 检查工作历史中是否有引用该职位的记录
        from ..models.hr import EmployeeJobHistory  # 导入EmployeeJobHistory模型
        has_job_history = db.query(EmployeeJobHistory).filter(
            EmployeeJobHistory.position_id == position_id
        ).first()
        
        if has_job_history:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="无法删除职位",
                    details="该职位在员工工作历史中被引用，无法删除。如需删除，请先处理相关的工作历史记录。"
                )
            )
        
        # 检查是否有子职位
        has_children = db.query(PositionModel).filter(
            PositionModel.parent_position_id == position_id
        ).first()
        
        if has_children:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="无法删除职位",
                    details=f"该职位包含下级职位，无法删除。请先重新分配或删除下级职位：{has_children.name}"
                )
            )
        
        # 执行删除
        db.delete(db_position)
        db.commit()
        return None  # 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()  # 回滚事务
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error while deleting position.",
                details=str(e)
            )
        )

# --- 高性能公共 Position 端点 (无权限检查) ---
@router.get("/public", response_model=PositionListResponse)
async def get_positions_public(
    is_active: bool = True,  # 默认只返回活跃职位
    db: Session = Depends(get_db_v2)
    # 注意：此端点没有权限检查，仅用于公共position数据
):
    """
    高性能公共职位查询端点
    - 默认返回活跃职位
    - 无权限检查，性能优化
    - 专门用于前端初始化时position数据加载
    """
    try:
        # 直接使用原生SQL，跳过所有ORM开销
        from sqlalchemy import text
        
        # 超高性能查询：直接SQL，无分页，无复杂条件
        query = text("""
            SELECT 
                p.id,
                p.code,
                p.name,
                p.description,
                p.parent_position_id,
                p.effective_date,
                p.end_date,
                p.is_active
            FROM hr.positions p
            WHERE (:is_active IS NULL OR p.is_active = :is_active)
            ORDER BY p.code ASC
            LIMIT 200
        """)
        
        params = {'is_active': is_active}
        
        # 执行查询
        result = db.execute(query, params)
        positions = [dict(row._mapping) for row in result]
        
        return PositionListResponse(
            data=positions, 
            meta={
                "page": 1, 
                "size": len(positions), 
                "total": len(positions), 
                "totalPages": 1
            }
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