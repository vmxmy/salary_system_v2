from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import text
import sqlalchemy.exc as sa_exc
import logging

# 导入现有模块，保持与main.py相同的依赖
from .. import auth, models_db, schemas, models
from ..database import get_db
# 导入新的pydantic模型，逐步迁移
from ..pydantic_models.employee import EmployeeResponse, EmployeeListResponse, EmployeeCreate, EmployeeUpdate

# 配置logger
logger = logging.getLogger(__name__)

# 创建路由器实例
router = APIRouter(prefix="/api/employees", tags=["Employees"])

@router.get("/", response_model=EmployeeListResponse)
async def get_employees(
    # 分页参数
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    # 过滤参数
    name: Optional[str] = Query(None, description="Filter by employee name (case-insensitive partial match)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    employee_unique_id: Optional[str] = Query(None, description="Filter by employee unique ID (工号, exact match)"),
    establishment_type_id: Optional[int] = Query(None, description="Filter by establishment type ID"),
    db: Session = Depends(get_db),
    # 验证用户
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取员工列表，支持分页和过滤。"""
    logger.info(f"获取员工列表: page={page}, size={size}, name={name}, department_id={department_id}")
    
    # 转换页码为偏移量
    limit = size
    skip = (page - 1) * size
    
    try:
        # 调用ORM函数获取数据
        employees, total = models_db.get_employees(
            db=db,
            skip=skip,
            limit=limit,
            name=name,
            department_id=department_id,
            employee_unique_id=employee_unique_id,
            establishment_type_id=establishment_type_id
        )
        
        # 正确处理关联数据
        employees_data = []
        for employee in employees:
            # 创建基础数据字典
            employee_dict = {
                "id": employee.id,
                "name": employee.name,
                "id_card_number": employee.id_card_number,
                "department_id": employee.department_id,
                "employee_unique_id": employee.employee_unique_id,
                "bank_account_number": employee.bank_account_number,
                "bank_name": employee.bank_name,
                "establishment_type_id": employee.establishment_type_id,
                "created_at": employee.created_at,
                "updated_at": employee.updated_at,
                "email": employee.email, # Added email
                # 默认值
                "department_name": None,
                "unit_name": None,
                "establishment_type_name": None
            }
            
            # 添加关联数据
            if employee.department:
                employee_dict["department_name"] = employee.department.name
                if employee.department.unit:
                    employee_dict["unit_name"] = employee.department.unit.name
            
            if employee.establishment_type:
                employee_dict["establishment_type_name"] = employee.establishment_type.name
                
            # 转换为Pydantic模型
            employees_data.append(EmployeeResponse.model_validate(employee_dict))
        
        # 返回带分页信息的响应
        return EmployeeListResponse(data=employees_data, total=total)
        
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"数据库错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"数据库错误: {str(e)}")
    except Exception as e:
        logger.error(f"获取员工列表出错: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """根据ID获取单个员工详情。"""
    try:
        employee = models_db.get_employee_by_id(db, employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="员工不存在")
            
        # 创建基础数据字典
        employee_dict = {
            "id": employee.id,
            "name": employee.name,
            "id_card_number": employee.id_card_number,
            "department_id": employee.department_id,
            "employee_unique_id": employee.employee_unique_id,
            "bank_account_number": employee.bank_account_number,
            "bank_name": employee.bank_name,
            "establishment_type_id": employee.establishment_type_id,
            "created_at": employee.created_at,
            "updated_at": employee.updated_at,
            "email": employee.email, # Added email
            # 默认值
            "department_name": None,
            "unit_name": None,
            "establishment_type_name": None
        }
        
        # 添加关联数据
        if employee.department:
            employee_dict["department_name"] = employee.department.name
            if employee.department.unit:
                employee_dict["unit_name"] = employee.department.unit.name
        
        if employee.establishment_type:
            employee_dict["establishment_type_name"] = employee.establishment_type.name
            
        # 转换为Pydantic模型并返回
        return EmployeeResponse.model_validate(employee_dict)
        
    except Exception as e:
        logger.error(f"获取员工详情出错: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

# --- CRUD Endpoints for Employees ---

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """创建新员工。"""
    try:
        logger.info(f"创建新员工: {employee_in.name}")
        db_employee = models_db.create_employee(db=db, employee=employee_in)
        
        # Manually construct the response dictionary to include related fields
        employee_dict = {
            "id": db_employee.id,
            "name": db_employee.name,
            "id_card_number": db_employee.id_card_number,
            "department_id": db_employee.department_id,
            "employee_unique_id": db_employee.employee_unique_id,
            "bank_account_number": db_employee.bank_account_number,
            "bank_name": db_employee.bank_name,
            "establishment_type_id": db_employee.establishment_type_id,
            "email": db_employee.email,
            "created_at": db_employee.created_at,
            "updated_at": db_employee.updated_at,
            "department_name": db_employee.department.name if db_employee.department else None,
            "unit_name": db_employee.department.unit.name if db_employee.department and db_employee.department.unit else None,
            "establishment_type_name": db_employee.establishment_type.name if db_employee.establishment_type else None,
        }
        return EmployeeResponse.model_validate(employee_dict)
    except HTTPException as http_exc: # Re-raise HTTPException to preserve status code and detail
        raise http_exc
    except Exception as e:
        logger.error(f"创建员工失败: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"创建员工失败: {str(e)}")

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_in: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """更新员工信息。"""
    try:
        logger.info(f"更新员工 ID: {employee_id}")
        db_employee = models_db.update_employee(db=db, employee_id=employee_id, employee_update=employee_in)
        if db_employee is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="员工不存在")
        
        # Manually construct the response dictionary
        employee_dict = {
            "id": db_employee.id,
            "name": db_employee.name,
            "id_card_number": db_employee.id_card_number,
            "department_id": db_employee.department_id,
            "employee_unique_id": db_employee.employee_unique_id,
            "bank_account_number": db_employee.bank_account_number,
            "bank_name": db_employee.bank_name,
            "establishment_type_id": db_employee.establishment_type_id,
            "email": db_employee.email,
            "created_at": db_employee.created_at,
            "updated_at": db_employee.updated_at,
            "department_name": db_employee.department.name if db_employee.department else None,
            "unit_name": db_employee.department.unit.name if db_employee.department and db_employee.department.unit else None,
            "establishment_type_name": db_employee.establishment_type.name if db_employee.establishment_type else None,
        }
        return EmployeeResponse.model_validate(employee_dict)
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"更新员工失败 ID {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"更新员工失败: {str(e)}")

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Only Super Admin can delete
):
    """删除员工。"""
    try:
        logger.info(f"删除员工 ID: {employee_id}")
        success = models_db.delete_employee(db=db, employee_id=employee_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="员工不存在")
        return None # FastAPI will return 204 No Content
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"删除员工失败 ID {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"删除员工失败: {str(e)}")

# 这里可以添加其他员工相关端点