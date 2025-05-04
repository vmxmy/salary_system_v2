from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import text
import sqlalchemy.exc as sa_exc
import logging

# 导入现有模块，保持与main.py相同的依赖
from .. import auth, models_db, schemas, models
from ..database import get_db
# 导入新的pydantic模型
from ..pydantic_models import (
    SalaryRecord, PaginatedSalaryResponse, PayPeriodsResponse,
    EstablishmentTypeInfo
)

# 配置logger
logger = logging.getLogger(__name__)

# 创建路由器实例
router = APIRouter(tags=["Salary Data"])

@router.get("/api/salary_data/pay_periods", response_model=PayPeriodsResponse)
async def get_available_pay_periods(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user) # 需要登录
):
    """获取薪资数据中可用的发薪期（YYYY-MM格式）列表。"""
    try:
        # 使用text()执行原始SQL查询
        query = text("""
            SELECT DISTINCT pay_period_identifier 
            FROM raw_salary_data_staging 
            WHERE pay_period_identifier IS NOT NULL
            ORDER BY pay_period_identifier DESC;
        """)
        result = db.execute(query)
        # 使用mappings().all()获取RowMapping对象列表
        results_rows = result.mappings().all()
        
        # 提取标识符到列表
        periods_list = [row['pay_period_identifier'] for row in results_rows]
        
        return PayPeriodsResponse(data=periods_list)
        
    except sa_exc.SQLAlchemyError as error: # 捕获SQLAlchemy错误
        logger.error(f"获取发薪期数据库错误: {error}", exc_info=True)
        # SELECT操作不需要回滚
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="从数据库获取发薪期失败。"
        )
    except Exception as e: # 捕获任何其他意外错误
        logger.error(f"获取发薪期意外错误: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取发薪期时发生意外服务器错误。"
        )

@router.get("/api/salary_data", response_model=PaginatedSalaryResponse)
async def get_salary_data(
    limit: int = 100, 
    offset: int = 0, 
    pay_period: Optional[str] = None,
    employee_name: Optional[str] = None,
    department_name: Optional[str] = None,
    unit_name: Optional[str] = None,
    establishment_type_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取薪资数据，支持分页和各种过滤条件。"""
    try:
        # 使用ORM版本
        items, total = models_db.get_salary_data_orm(
            db=db, 
            limit=limit, 
            skip=offset, 
            pay_period=pay_period,
            employee_name=employee_name,
            department_name=department_name,
            unit_name=unit_name, 
            establishment_type_name=establishment_type_name
        )
        
        # 转换字典项为SalaryRecord Pydantic模型
        salary_records = [SalaryRecord.model_validate(item) for item in items]

        return PaginatedSalaryResponse(data=salary_records, total=total)
        
    except sa_exc.SQLAlchemyError as e: # 捕获SQLAlchemy特定错误
        logger.error(f"获取薪资数据数据库错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"数据库错误: {str(e)}")
    except Exception as e:
        logger.error(f"获取薪资数据错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"错误: {str(e)}")

@router.get("/api/establishment-types", response_model=List[str], tags=["Helper Lists"])
async def get_establishment_types(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取所有编制类型名称列表。"""
    try:
        # 使用SQLAlchemy ORM查询
        results = db.query(models.EstablishmentType.name).distinct().order_by(models.EstablishmentType.name).all()
        # results是元组列表，例如[('Type A',), ('Type B',)]
        types = [row[0] for row in results if row[0]] # 提取第一个元素并过滤None/空
        return types
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"获取编制类型数据库错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="获取编制类型时发生数据库错误。")
    except Exception as e:
        logger.error(f"获取编制类型意外错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="发生意外服务器错误。")

@router.get("/api/establishment-types-list", response_model=List[dict], tags=["Helper Lists"])
async def get_establishment_types_list(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取所有编制类型及其key和中文名的列表。"""
    try:
        # 查询 key 和 name
        results = db.execute(text("SELECT employee_type_key, name FROM establishment_types ORDER BY name")).mappings().all()
        logger.info(f"获取到{len(results)}个编制类型。")
        return [dict(row) for row in results]
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"获取编制类型列表数据库错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="获取编制类型列表时发生数据库错误。")
    except Exception as e:
        logger.error(f"获取编制类型列表意外错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="发生意外服务器错误。")

# 辅助列表端点，放在这里因为它们与薪资数据相关
@router.get("/api/departments", response_model=List[str], tags=["Helper Lists"])
async def get_distinct_department_names(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取所有部门名称列表。"""
    try:
         # 使用SQLAlchemy ORM查询
        results = db.query(models.Department.name).distinct().order_by(models.Department.name).all()
        departments = [row[0] for row in results if row[0]] # 提取名称，过滤None/空
        return departments
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"获取部门名称数据库错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="获取部门名称时发生数据库错误。")
    except Exception as e:
        logger.error(f"获取部门名称意外错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="发生意外服务器错误。")

@router.get("/api/units", response_model=List[str], tags=["Helper Lists"])
async def get_distinct_unit_names(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取所有单位名称列表。"""
    try:
        # 使用SQLAlchemy ORM查询
        results = db.query(models.Unit.name).distinct().order_by(models.Unit.name).all()
        units = [row[0] for row in results if row[0]] # 提取名称，过滤None/空
        return units
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"获取单位名称数据库错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="获取单位名称时发生数据库错误。")
    except Exception as e:
        logger.error(f"获取单位名称意外错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="发生意外服务器错误。")

@router.get("/api/departments-list", response_model=List[schemas.DepartmentInfo], tags=["Helper Lists"])
async def get_departments_list(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取所有部门及其ID的列表。"""
    try:
        # 使用SQLAlchemy ORM查询
        results = db.query(
            models.Department.id,
            models.Department.name
        ).order_by(models.Department.name).all()
        logger.info(f"获取到{len(results)}个部门。")
        return results
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"获取部门列表数据库错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="获取部门列表时发生数据库错误。")
    except Exception as e:
        logger.error(f"获取部门列表意外错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="发生意外服务器错误。") 