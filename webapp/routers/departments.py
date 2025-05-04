from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Type, TypeVar
import logging
from ..database import get_db
from .. import schemas, models_db, auth, models
from ..schemas import (
    Department, DepartmentCreate, DepartmentUpdate, 
    DepartmentListResponse, DepartmentInfo
)
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# 定义泛型类型变量
T = TypeVar('T', bound=BaseModel)

def orm_to_pydantic(orm_object: Any, pydantic_model: Type[T]) -> T:
    """
    将SQLAlchemy ORM对象转换为Pydantic模型。
    如果字段不能转换，将使用自定义转换逻辑或默认值。
    """
    # 转换数据
    if hasattr(orm_object, '__dict__'):
        # SQLAlchemy对象通常有__dict__属性
        data = {}
        for key, value in orm_object.__dict__.items():
            if not key.startswith('_'):  # 跳过SQLAlchemy内部属性
                # 基于字段类型进行安全转换
                data[key] = value
        
        # 处理可能的关系属性
        if isinstance(orm_object, models.Department) and hasattr(orm_object, 'unit') and orm_object.unit:
            data['unit_name'] = orm_object.unit.name if hasattr(orm_object.unit, 'name') else None
        
        # 使用model_validate验证并转换数据
        try:
            return pydantic_model.model_validate(data)
        except Exception as e:
            logger.error(f"Error converting ORM object to {pydantic_model.__name__}: {e}")
            # 回退到仅转换明确存在的字段
            return pydantic_model(**{
                k: v for k, v in data.items() 
                if k in pydantic_model.model_fields
            })
    else:
        # 对于非ORM对象，尝试直接转换
        return pydantic_model.model_validate(orm_object)

router = APIRouter(
    prefix="/api/departments",
    tags=["Departments"]
)

@router.put("/{department_id}", response_model=Department)
async def update_department_endpoint(
    department_id: int,
    department_update: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """Updates a specific department."""
    logger.info(f"User {current_user.username} attempting to update department ID: {department_id} with data: {department_update.model_dump(exclude_unset=True)}")
    try:
        department = models_db.update_department_orm(db, department_id, department_update)
        if not department:
            logger.warning(f"Department with ID {department_id} not found.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Department with ID {department_id} not found.")
        logger.info(f"Successfully updated department ID: {department_id}")
        return department
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (404, 409, etc.)
        logger.warning(f"HTTPException during update for department ID {department_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error updating department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while updating department {department_id}."
        ) from e

@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department_endpoint(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """Deletes a department, returning 204 No Content on success."""
    logger.info(f"User {current_user.username} attempting to delete department ID: {department_id}")
    try:
        deleted = models_db.delete_department_orm(db, department_id)
        if not deleted:
            logger.warning(f"Department with ID {department_id} not found for deletion.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Department with ID {department_id} not found.")
        logger.info(f"Successfully deleted department ID: {department_id}")
        return
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions
        logger.warning(f"HTTPException during deletion of department ID {department_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error deleting department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while deleting department {department_id}."
        ) from e

@router.get("/", response_model=DepartmentListResponse)
async def get_departments(
    unit_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Fetches a paginated list of departments with optional filtering."""
    offset = (page - 1) * page_size
    try:
        departments, total = models_db.get_departments_orm(
            db, 
            unit_id=unit_id,
            search=search,
            skip=offset,
            limit=page_size
        )
        # 将ORM模型列表转换为Pydantic模型列表
        department_models = []
        for dept in departments:
            department_models.append(orm_to_pydantic(dept, Department))
        
        # 使用转换后的模型创建响应
        return DepartmentListResponse(data=department_models, total=total)
    except Exception as e:
        logger.error(f"Error fetching departments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching departments: {str(e)}")

@router.get("/{department_id}", response_model=Department)
async def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Retrieves a single department by ID."""
    try:
        department = models_db.get_department_by_id_orm(db, department_id)
        if not department:
            raise HTTPException(status_code=404, detail=f"Department with ID {department_id} not found")
        return orm_to_pydantic(department, Department)
    except HTTPException as http_exc:
        # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching department {department_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching department: {str(e)}")

@router.post("/", response_model=Department, status_code=status.HTTP_201_CREATED)
async def create_department_endpoint(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """Creates a new department."""
    try:
        created_department = models_db.create_department_orm(db, department)
        return orm_to_pydantic(created_department, Department)
    except HTTPException as http_exc:
        # Re-raise HTTP exceptions from the DB layer
        raise http_exc
    except Exception as e:
        logger.error(f"Error creating department: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating department: {str(e)}")

@router.get("/list/simple", response_model=List[DepartmentInfo])
async def get_simple_departments_list(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Gets a simple list of departments (ID and name only) for dropdowns."""
    try:
        # 获取部门列表
        departments, _ = models_db.get_departments_orm(db, limit=1000)
        
        # 使用orm_to_pydantic函数转换
        result = []
        for dept in departments:
            # 创建一个简单的dict，仅包含ID和name
            simple_dept = {"id": dept.id, "name": dept.name}
            # 转换为DepartmentInfo
            dept_info = DepartmentInfo.model_validate(simple_dept)
            result.append(dept_info)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching departments list: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching departments list: {str(e)}")
