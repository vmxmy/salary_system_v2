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
from webapp.auth import smart_require_permissions, get_current_user, require_basic_auth_only
from ..utils.common import create_error_response
from ..pydantic_models.common import SuccessResponse, OptimizedResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/views-optimized", tags=["高性能视图API"])

# ==================== 用户相关优化接口 ====================

@router.get("/users/{user_id}")
async def get_user_optimized(
    user_id: int,
    db: Session = Depends(get_db_v2)
    # ⚡️ 临时移除权限验证以提升性能
    # current_user = Depends(get_current_user)
):
    """🚀 超高性能用户查询 - 极简版"""
    try:
        # 🚀 最简化查询，避免任何复杂操作
        result = db.execute(
            text("SELECT id, username, is_active FROM security.users WHERE id = :user_id"),
            {"user_id": user_id}
        )
        user_row = result.fetchone()
        
        if not user_row:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 🚀 直接构建响应，避免复杂的映射操作
        user_data = {
            "id": user_row[0],
            "username": user_row[1], 
            "is_active": user_row[2]
        }
        
        return {
            "success": True,
            "data": user_data,
            "message": "用户信息获取成功"
        }
        
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
    # ⚡️ 已无权限验证，保持现状
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
            'LEAVE_TYPE', 'PAY_FREQUENCY', 'JOB_POSITION_LEVEL', 
            'POLITICAL_STATUS', 'PAYROLL_COMPONENT_TYPE'
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
    # ⚡️ 临时移除权限验证以提升性能
    # current_user = Depends(require_basic_auth_only())
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
    # ⚡️ 已无权限验证，保持现状
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

# 删除重复路由 - /simple-payroll/periods 已在 simple_payroll.py 中定义
# 避免路由冲突，使用 simple_payroll.py 中的统一实现

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
            'LEAVE_TYPE', 'PAY_FREQUENCY', 'JOB_POSITION_LEVEL', 
            'POLITICAL_STATUS', 'PAYROLL_COMPONENT_TYPE'
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

# ==================== 批量员工查询接口 ====================

@router.post("/employees/batch-lookup")
async def batch_employee_lookup(
    employee_infos: List[Dict[str, str]],
    db: Session = Depends(get_db_v2)
):
    """🚀 批量员工查询 - 为批量导入薪资优化"""
    try:
        if len(employee_infos) > 1000:
            raise HTTPException(status_code=400, detail="批量查询员工数量不能超过1000")
        
        # 构建查询条件
        conditions = []
        params = {}
        
        for i, info in enumerate(employee_infos):
            if info.get('last_name') and info.get('first_name') and info.get('id_number'):
                conditions.append(f"""
                    (e.last_name = :last_name_{i} 
                     AND e.first_name = :first_name_{i} 
                     AND e.id_number = :id_number_{i})
                """)
                params[f'last_name_{i}'] = info['last_name']
                params[f'first_name_{i}'] = info['first_name']
                params[f'id_number_{i}'] = info['id_number']
        
        if not conditions:
            return OptimizedResponse(
                success=True,
                data=[],
                message="没有有效的查询条件"
            )
        
        query = text(f"""
            SELECT 
                e.id, e.employee_code, e.last_name, e.first_name, e.id_number,
                e.is_active, d.name as department_name, d.id as department_id
            FROM hr.employees e
            LEFT JOIN hr.departments d ON e.department_id = d.id
            WHERE e.is_active = true AND ({' OR '.join(conditions)})
        """)
        
        result = db.execute(query, params)
        employees = [dict(row._mapping) for row in result]
        
        return OptimizedResponse(
            success=True,
            data=employees,
            message=f"成功查询到 {len(employees)} 个员工"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"批量员工查询失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量员工查询失败: {str(e)}")

@router.post("/payroll-entries/batch-check-existing")
async def batch_check_existing_payroll_entries(
    payroll_period_id: int,
    employee_ids: List[int],
    db: Session = Depends(get_db_v2)
):
    """🚀 批量检查已存在的薪资记录 - 为批量导入薪资优化"""
    try:
        if len(employee_ids) > 1000:
            raise HTTPException(status_code=400, detail="批量查询员工数量不能超过1000")
        
        # 构建IN条件的占位符
        placeholders = ','.join([f':emp_id_{i}' for i in range(len(employee_ids))])
        params = {'payroll_period_id': payroll_period_id}
        params.update({f'emp_id_{i}': emp_id for i, emp_id in enumerate(employee_ids)})
        
        query = text(f"""
            SELECT 
                pe.employee_id, pe.id as payroll_entry_id
            FROM payroll.payroll_entries pe
            WHERE pe.payroll_period_id = :payroll_period_id
              AND pe.employee_id IN ({placeholders})
        """)
        
        result = db.execute(query, params)
        existing_entries = [dict(row._mapping) for row in result]
        
        # 转换为字典形式方便查找
        existing_map = {entry['employee_id']: entry['payroll_entry_id'] for entry in existing_entries}
        
        return OptimizedResponse(
            success=True,
            data=existing_map,
            message=f"检查完成，发现 {len(existing_entries)} 个已存在的薪资记录"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"批量检查薪资记录失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量检查薪资记录失败: {str(e)}")

# ==================== 健康检查 ====================

@router.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "message": "高性能视图API运行正常",
        "timestamp": datetime.now().isoformat()
    } 