from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from sqlalchemy import text, inspect
import sqlalchemy.exc as sa_exc
import logging

# 导入现有模块，保持与main.py相同的依赖
from .. import auth, models_db, schemas, models
from ..database import get_db
# 导入新的pydantic模型
from ..pydantic_models import (
    SalaryRecord, PaginatedSalaryResponse, PayPeriodsResponse,
    EstablishmentTypeInfo, SalaryRecordUpdate
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
        # 使用text()执行原始SQL查询，从consolidated_data表获取数据
        query = text("""
            SELECT DISTINCT pay_period_identifier
            FROM staging.consolidated_data
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
        items, total = models_db.get_salary_data(
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

@router.get("/api/establishment-types-list", response_model=List[schemas.EstablishmentTypeInfo], tags=["Helper Lists"])
async def get_establishment_types_list(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取所有编制类型及其key和中文名的列表 (ORM版本)。"""
    try:
        # 使用 ORM 查询, 添加 id 列
        results = db.query(
            models.EstablishmentType.id, # Added id column
            models.EstablishmentType.employee_type_key,
            models.EstablishmentType.name
        ).order_by(models.EstablishmentType.name).all()

        logger.info(f"获取到{len(results)}个编制类型 (ORM)。")
        # Directly return the result; FastAPI handles Pydantic conversion
        return results

    except sa_exc.SQLAlchemyError as e:
        logger.error(f"获取编制类型列表数据库错误 (ORM): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="获取编制类型列表时发生数据库错误。")
    except Exception as e:
        logger.error(f"获取编制类型列表意外错误 (ORM): {e}", exc_info=True)
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

@router.get("/api/salary_data/fields", response_model=List[Dict[str, Any]], tags=["Salary Data"])
async def get_salary_data_fields(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取薪酬数据的字段定义，用于动态生成表格列。"""
    try:
        # 从SalaryRecord Pydantic模型中获取字段定义
        fields = []
        for field_name, field in SalaryRecord.__annotations__.items():
            # 确定字段类型
            field_type = str(field)
            if "Optional" in field_type:
                field_type = field_type.replace("Optional[", "").replace("]", "")

            # 根据字段名称确定字段分组
            field_group = "其他"
            if field_name.startswith("employee_") or field_name in ["id_card_number"]:
                field_group = "员工信息"
            elif field_name in ["department_name", "unit_name", "establishment_type_name"]:
                field_group = "维度属性"
            elif field_name.startswith("job_attr_"):
                field_group = "工作属性"
            elif field_name.startswith("salary_"):
                field_group = "薪资组成"
            elif field_name.startswith("deduct_"):
                field_group = "个人扣除"
            elif field_name.startswith("contrib_"):
                field_group = "单位缴纳"
            elif field_name.startswith("calc_"):
                field_group = "计算总额"
            elif field_name in ["created_at", "updated_at"]:
                field_group = "时间戳"

            # 创建字段定义
            field_def = {
                "key": field_name,
                "dataIndex": field_name,
                "title": field_name.replace("_", " ").title(),  # 简单的标题转换
                "group": field_group,
                "type": field_type,
                "sortable": field_name in ["employee_id", "pay_period_identifier", "department_name",
                                          "unit_name", "establishment_type_name", "calc_xiaoji",
                                          "calc_personal_deductions", "calc_total_payable",
                                          "calc_net_pay", "created_at", "updated_at"]
            }

            # 为数值类型添加对齐方式
            if "float" in field_type or "int" in field_type:
                field_def["align"] = "right"
                if "float" in field_type:
                    field_def["render"] = "toFixed(2)"  # 前端渲染提示

            # 特殊字段处理
            if field_name == "employee_id" or field_name == "employee_name":
                field_def["fixed"] = "left"
            elif field_name == "calc_net_pay":
                field_def["fixed"] = "right"

            # 设置宽度
            if field_name in ["employee_id"]:
                field_def["width"] = 80
            elif field_name in ["pay_period_identifier", "employee_name"]:
                field_def["width"] = 120
            elif field_name == "id_card_number":
                field_def["width"] = 180
            elif field_name in ["department_name", "unit_name"]:
                field_def["width"] = 150
            elif field_name == "establishment_type_name":
                field_def["width"] = 120
                field_def["render_type"] = "tag"  # 特殊渲染类型
            elif "created_at" in field_name or "updated_at" in field_name:
                field_def["width"] = 170
                field_def["render_type"] = "datetime"  # 日期时间渲染
            elif "float" in field_type:
                field_def["width"] = 120

            fields.append(field_def)

        return fields
    except Exception as e:
        logger.error(f"获取薪酬数据字段定义错误: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取薪酬数据字段定义时发生错误: {str(e)}")

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


@router.put("/api/salary_data/{record_id}", response_model=SalaryRecord, tags=["Salary Data"])
async def update_salary_record(
    record_id: int,
    record_update: SalaryRecordUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """
    更新薪资记录

    需要Super Admin或Data Admin权限
    只能更新薪资相关字段，不能更新员工基本信息和社保缴纳信息
    """
    try:
        logger.info(f"User {current_user.username} attempting to update salary record ID: {record_id}")

        # 调用models_db中的更新函数
        updated_record = models_db.update_salary_record(
            db=db,
            record_id=record_id,
            record_update=record_update
        )

        if not updated_record:
            logger.warning(f"Salary record with ID {record_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"薪资记录 ID {record_id} 不存在"
            )

        # 转换为Pydantic模型并返回
        return SalaryRecord.model_validate(updated_record)

    except HTTPException as e:
        # 重新抛出HTTP异常
        raise e
    except Exception as e:
        logger.error(f"Error updating salary record {record_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新薪资记录时发生错误: {str(e)}"
        )