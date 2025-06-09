"""
高性能视图路由 - 专门用于替换慢接口
使用简化查询进行数据访问，确保极速响应
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from ..database import get_db_v2
from webapp.auth import smart_require_permissions, get_current_user
from ..utils.common import create_error_response
from ..pydantic_models.common import SuccessResponse, OptimizedResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/views-optimized", tags=["高性能视图API"])

# ==================== 用户相关优化接口 ====================

@router.get("/users/{user_id}")
async def get_user_optimized(
    user_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """高性能用户查询 - 简化版"""
    try:
        query = text("""
            SELECT 
                u.id, u.username, u.email, u.full_name, u.is_active,
                u.created_at, u.updated_at
            FROM security.users u
            WHERE u.id = :user_id
        """)
        
        result = db.execute(query, {"user_id": user_id})
        user_data = result.fetchone()
        
        if not user_data:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        return OptimizedResponse(
            success=True,
            data=dict(user_data._mapping),
            message="用户信息获取成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取用户信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取用户信息失败: {str(e)}")

# ==================== 配置相关优化接口 ====================

@router.get("/payroll-component-definitions")
async def get_payroll_component_definitions_optimized(
    is_active: Optional[bool] = Query(True, description="是否活跃"),
    component_type: Optional[str] = Query(None, description="组件类型"),
    size: int = Query(100, le=100, description="返回数量"),
    db: Session = Depends(get_db_v2)
):
    """🚀 高性能薪资组件定义查询 - 简化版"""
    try:
        query = text("""
            SELECT 
                id, code, name, type as component_type, is_active, 
                display_order, calculation_method, is_taxable,
                is_social_security_base, is_housing_fund_base
            FROM config.payroll_component_definitions
            WHERE (:is_active IS NULL OR is_active = :is_active)
              AND (:component_type IS NULL OR type = :component_type)
            ORDER BY display_order ASC, code ASC
            LIMIT :size
        """)
        
        result = db.execute(query, {
            "is_active": is_active,
            "component_type": component_type,
            "size": size
        })
        
        components = [dict(row._mapping) for row in result]
        
        return OptimizedResponse(
            success=True,
            data=components,
            message=f"成功获取 {len(components)} 个薪资组件定义"
        )
        
    except Exception as e:
        logger.error(f"获取薪资组件定义失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取薪资组件定义失败: {str(e)}")

@router.get("/lookup-values-public")
async def get_lookup_values_public_optimized(
    lookup_type_code: str = Query(..., description="查找类型代码"),
    is_active: Optional[bool] = Query(True, description="是否活跃"),
    db: Session = Depends(get_db_v2)
):
    """🚀 高性能公共lookup查询 - 简化版"""
    try:
        safe_lookup_types = {
            'GENDER', 'EMPLOYEE_STATUS', 'EMPLOYMENT_TYPE', 'CONTRACT_TYPE', 
            'CONTRACT_STATUS', 'MARITAL_STATUS', 'EDUCATION_LEVEL', 
            'LEAVE_TYPE', 'PAY_FREQUENCY', 'JOB_POSITION_LEVEL'
        }
        
        if lookup_type_code not in safe_lookup_types:
            raise HTTPException(status_code=400, detail=f"不允许查询的lookup类型: {lookup_type_code}")
        
        query = text("""
            SELECT 
                lv.id, lv.code, lv.name, lv.description, lv.sort_order, lv.is_active
            FROM config.lookup_values lv
            JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
            WHERE lt.code = :type_code
              AND (:is_active IS NULL OR lv.is_active = :is_active)
            ORDER BY lv.sort_order ASC, lv.code ASC
            LIMIT 50
        """)
        
        result = db.execute(query, {
            "type_code": lookup_type_code,
            "is_active": is_active
        })
        
        values = [dict(row._mapping) for row in result]
        
        return OptimizedResponse(
            success=True,
            data=values,
            message=f"成功获取 {len(values)} 个lookup值"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取lookup值失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取lookup值失败: {str(e)}")

@router.get("/lookup-types")
async def get_lookup_types_optimized(
    db: Session = Depends(get_db_v2)
):
    """🚀 高性能lookup类型查询 - 简化版"""
    try:
        query = text("""
            SELECT 
                id, code, name, description
            FROM config.lookup_types
            ORDER BY code ASC
        """)
        
        result = db.execute(query)
        types = [dict(row._mapping) for row in result]
        
        return OptimizedResponse(
            success=True,
            data=types,
            message=f"成功获取 {len(types)} 个lookup类型"
        )
        
    except Exception as e:
        logger.error(f"获取lookup类型失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取lookup类型失败: {str(e)}")

# ==================== HR相关优化接口 ====================

@router.get("/departments")
async def get_departments_optimized(
    is_active: Optional[bool] = Query(True, description="是否活跃"),
    db: Session = Depends(get_db_v2)
):
    """🚀 高性能部门查询 - 简化版"""
    try:
        query = text("""
            SELECT 
                id, name, code, is_active, parent_department_id
            FROM hr.departments
            WHERE (:is_active IS NULL OR is_active = :is_active)
            ORDER BY code ASC
        """)
        
        result = db.execute(query, {"is_active": is_active})
        departments = [dict(row._mapping) for row in result]
        
        return OptimizedResponse(
            success=True,
            data=departments,
            message=f"成功获取 {len(departments)} 个部门信息"
        )
        
    except Exception as e:
        logger.error(f"获取部门信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取部门信息失败: {str(e)}")

@router.get("/personnel-categories")
async def get_personnel_categories_optimized(
    is_active: Optional[bool] = Query(True, description="是否活跃"),
    db: Session = Depends(get_db_v2)
):
    """🚀 高性能人员类别查询 - 简化版"""
    try:
        query = text("""
            SELECT 
                id, name, code, description, is_active, parent_category_id
            FROM hr.personnel_categories
            WHERE (:is_active IS NULL OR is_active = :is_active)
            ORDER BY code ASC
        """)
        
        result = db.execute(query, {"is_active": is_active})
        categories = [dict(row._mapping) for row in result]
        
        return OptimizedResponse(
            success=True,
            data=categories,
            message=f"成功获取 {len(categories)} 个人员类别"
        )
        
    except Exception as e:
        logger.error(f"获取人员类别失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取人员类别失败: {str(e)}")

# ==================== 薪资相关优化接口 ====================

@router.get("/simple-payroll/periods")
async def get_payroll_periods_optimized(
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    year: Optional[int] = Query(None, description="年份"),
    db: Session = Depends(get_db_v2)
):
    """🚀 高性能薪资周期查询 - 简化版"""
    try:
        query = text("""
            SELECT 
                id, name, start_date, end_date, pay_date,
                frequency_lookup_value_id, status_lookup_value_id
            FROM payroll.payroll_periods
            WHERE (:year IS NULL OR EXTRACT(YEAR FROM start_date) = :year)
            ORDER BY start_date DESC
            LIMIT 50
        """)
        
        result = db.execute(query, {"year": year})
        periods = [dict(row._mapping) for row in result]
        
        return OptimizedResponse(
            success=True,
            data=periods,
            message=f"成功获取 {len(periods)} 个薪资周期"
        )
        
    except Exception as e:
        logger.error(f"获取薪资周期失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取薪资周期失败: {str(e)}")

@router.get("/simple-payroll/versions")
async def get_payroll_versions_optimized(
    db: Session = Depends(get_db_v2)
):
    """🚀 高性能薪资版本查询 - 简化版"""
    try:
        query = text("""
            SELECT 
                id, payroll_period_id, run_date, status_lookup_value_id,
                total_employees, total_gross_pay, total_net_pay, total_deductions
            FROM payroll.payroll_runs
            ORDER BY run_date DESC
            LIMIT 20
        """)
        
        result = db.execute(query)
        versions = [dict(row._mapping) for row in result]
        
        return OptimizedResponse(
            success=True,
            data=versions,
            message=f"成功获取 {len(versions)} 个薪资版本"
        )
        
    except Exception as e:
        logger.error(f"获取薪资版本失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取薪资版本失败: {str(e)}")

# ==================== 批量查询接口 ====================

@router.post("/batch-lookup")
async def batch_lookup_optimized(
    lookup_types: List[str],
    db: Session = Depends(get_db_v2)
):
    """🚀 批量lookup查询 - 简化版"""
    try:
        safe_lookup_types = {
            'GENDER', 'EMPLOYEE_STATUS', 'EMPLOYMENT_TYPE', 'CONTRACT_TYPE', 
            'CONTRACT_STATUS', 'MARITAL_STATUS', 'EDUCATION_LEVEL', 
            'LEAVE_TYPE', 'PAY_FREQUENCY', 'JOB_POSITION_LEVEL'
        }
        
        invalid_types = set(lookup_types) - safe_lookup_types
        if invalid_types:
            raise HTTPException(status_code=400, detail=f"不允许查询的lookup类型: {invalid_types}")
        
        result_data = {}
        for lookup_type in lookup_types:
            query = text("""
                SELECT 
                    lv.id, lv.code, lv.name, lv.description, lv.sort_order, lv.is_active
                FROM config.lookup_values lv
                JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
                WHERE lt.code = :type_code AND lv.is_active = true
                ORDER BY lv.sort_order ASC, lv.code ASC
            """)
            
            result = db.execute(query, {"type_code": lookup_type})
            values = [dict(row._mapping) for row in result]
            result_data[lookup_type] = values
        
        return OptimizedResponse(
            success=True,
            data=result_data,
            message=f"成功批量获取 {len(lookup_types)} 种lookup数据"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"批量lookup查询失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量lookup查询失败: {str(e)}")

# ==================== 健康检查 ====================

@router.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "message": "高性能视图API运行正常",
        "timestamp": datetime.now().isoformat()
    } 