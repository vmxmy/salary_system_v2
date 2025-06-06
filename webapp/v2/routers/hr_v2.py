"""
人力资源管理API路由 V2 - 基于视图的HR API
提供统一的人力资源数据访问接口，基于核心视图实现高性能HR管理
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db_v2
from webapp.auth import require_permissions
from ..services.hr import HRBusinessService
from ..utils.common import create_error_response
from ..pydantic_models.common import PaginationResponse, DataResponse, SuccessResponse

router = APIRouter()

@router.get("/employees",
           response_model=SuccessResponse,
           summary="获取员工列表",
           description="获取员工详细信息列表，支持多种过滤条件")
async def get_employees(
    department_id: Optional[int] = Query(None, description="部门ID"),
    personnel_category_id: Optional[int] = Query(None, description="人员类别ID"),
    employee_status: Optional[str] = Query(None, description="员工状态"),
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    search_term: Optional[str] = Query(None, description="搜索关键词"),
    db: Session = Depends(get_db_v2)
):
    """获取员工列表"""
    try:
        service = HRBusinessService(db)
        employees = service.employees.get_employees_with_details(
            department_id=department_id,
            personnel_category_id=personnel_category_id,
            employee_status=employee_status,
            is_active=is_active,
            search_term=search_term
        )
        
        return SuccessResponse(
            success=True,
            data=employees,
            message=f"成功获取 {len(employees)} 个员工信息"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取员工列表失败: {str(e)}")

@router.get("/employees/search",
           response_model=SuccessResponse,
           summary="搜索员工",
           description="根据关键词搜索员工")
async def search_employees(
    q: str = Query(..., description="搜索关键词"),
    department_id: Optional[int] = Query(None, description="部门ID"),
    personnel_category_id: Optional[int] = Query(None, description="人员类别ID"),
    employee_status: Optional[str] = Query(None, description="员工状态"),
    db: Session = Depends(get_db_v2)
):
    """搜索员工"""
    try:
        service = HRBusinessService(db)
        filters = {
            'department_id': department_id,
            'personnel_category_id': personnel_category_id,
            'employee_status': employee_status
        }
        employees = service.search_employees(q, filters)
        
        return SuccessResponse(
            success=True,
            data=employees,
            message=f"搜索到 {len(employees)} 个匹配的员工"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索员工失败: {str(e)}")

@router.get("/employees/statistics",
           response_model=SuccessResponse,
           summary="获取员工统计",
           description="获取员工统计信息")
async def get_employee_statistics(db: Session = Depends(get_db_v2)):
    """获取员工统计"""
    try:
        service = HRBusinessService(db)
        statistics = service.employees.get_employee_statistics()
        
        return SuccessResponse(
            success=True,
            data=statistics,
            message="成功获取员工统计信息"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取员工统计失败: {str(e)}")

@router.get("/departments",
           response_model=SuccessResponse,
           summary="获取部门列表",
           description="获取部门列表及统计信息")
async def get_departments(
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    parent_id: Optional[int] = Query(None, description="上级部门ID"),
    db: Session = Depends(get_db_v2)
):
    """获取部门列表"""
    try:
        service = HRBusinessService(db)
        departments = service.departments.get_departments_with_stats(
            is_active=is_active,
            parent_id=parent_id
        )
        
        return SuccessResponse(
            success=True,
            data=departments,
            message=f"成功获取 {len(departments)} 个部门信息"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取部门列表失败: {str(e)}")

@router.get("/departments/hierarchy",
           response_model=SuccessResponse,
           summary="获取部门层级结构",
           description="获取完整的部门层级结构")
async def get_department_hierarchy(db: Session = Depends(get_db_v2)):
    """获取部门层级结构"""
    try:
        service = HRBusinessService(db)
        hierarchy = service.departments.get_department_hierarchy()
        
        return SuccessResponse(
            success=True,
            data=hierarchy,
            message=f"成功获取部门层级结构，共 {len(hierarchy)} 个部门"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取部门层级结构失败: {str(e)}")

@router.get("/departments/tree",
           response_model=SuccessResponse,
           summary="获取部门树形结构",
           description="获取部门的树形结构数据")
async def get_department_tree(db: Session = Depends(get_db_v2)):
    """获取部门树形结构"""
    try:
        service = HRBusinessService(db)
        tree = service.get_department_tree()
        
        return SuccessResponse(
            success=True,
            data=tree,
            message="成功获取部门树形结构"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取部门树形结构失败: {str(e)}")

@router.get("/positions",
           response_model=SuccessResponse,
           summary="获取职位列表",
           description="获取职位详细信息列表")
async def get_positions(
    department_id: Optional[int] = Query(None, description="部门ID"),
    level: Optional[str] = Query(None, description="职位级别"),
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    db: Session = Depends(get_db_v2)
):
    """获取职位列表"""
    try:
        service = HRBusinessService(db)
        positions = service.positions.get_positions_with_details(
            department_id=department_id,
            level=level,
            is_active=is_active
        )
        
        return SuccessResponse(
            success=True,
            data=positions,
            message=f"成功获取 {len(positions)} 个职位信息"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取职位列表失败: {str(e)}")

@router.get("/personnel-categories",
           response_model=SuccessResponse,
           summary="获取人员类别",
           description="获取人员类别及统计信息")
async def get_personnel_categories(
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    db: Session = Depends(get_db_v2)
):
    """获取人员类别"""
    try:
        service = HRBusinessService(db)
        categories = service.personnel_categories.get_categories_with_stats(
            is_active=is_active
        )
        
        return SuccessResponse(
            success=True,
            data=categories,
            message=f"成功获取 {len(categories)} 个人员类别"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取人员类别失败: {str(e)}")

@router.get("/organization/overview",
           response_model=SuccessResponse,
           summary="获取组织架构概览",
           description="获取完整的组织架构概览数据")
async def get_organization_overview(db: Session = Depends(get_db_v2)):
    """获取组织架构概览"""
    try:
        service = HRBusinessService(db)
        overview = service.get_organization_overview()
        
        return SuccessResponse(
            success=True,
            data=overview,
            message="成功获取组织架构概览"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取组织架构概览失败: {str(e)}")

@router.get("/organization/distribution",
           response_model=SuccessResponse,
           summary="获取员工分布情况",
           description="获取员工在各维度的分布情况")
async def get_employee_distribution(db: Session = Depends(get_db_v2)):
    """获取员工分布情况"""
    try:
        service = HRBusinessService(db)
        distribution = service.get_employee_distribution()
        
        return SuccessResponse(
            success=True,
            data=distribution,
            message="成功获取员工分布情况"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取员工分布情况失败: {str(e)}")

@router.get("/validation/integrity",
           response_model=SuccessResponse,
           summary="验证HR数据完整性",
           description="检查HR数据的完整性和一致性")
async def validate_hr_data_integrity(db: Session = Depends(get_db_v2)):
    """验证HR数据完整性"""
    try:
        service = HRBusinessService(db)
        result = service.validate_hr_data_integrity()
        
        return SuccessResponse(
            success=result['is_valid'],
            data=result,
            message="HR数据验证完成" if result['is_valid'] else f"发现 {len(result['issues'])} 个数据问题"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HR数据验证失败: {str(e)}")

@router.get("/dashboard",
           response_model=SuccessResponse,
           summary="HR管理仪表板",
           description="获取HR管理仪表板数据")
async def get_hr_dashboard(db: Session = Depends(get_db_v2)):
    """获取HR管理仪表板数据"""
    try:
        service = HRBusinessService(db)
        
        # 获取组织概览
        overview = service.get_organization_overview()
        
        # 获取员工分布
        distribution = service.get_employee_distribution()
        
        # 获取数据完整性检查
        integrity = service.validate_hr_data_integrity()
        
        # 获取最新统计
        employee_stats = service.employees.get_employee_statistics()
        
        dashboard_data = {
            'overview': overview,
            'distribution': distribution,
            'integrity': integrity,
            'quick_stats': {
                'total_employees': employee_stats['total_employees'],
                'active_employees': employee_stats['active_employees'],
                'departments_count': employee_stats['departments_count'],
                'categories_count': employee_stats['categories_count'],
                'avg_age': round(employee_stats.get('avg_age', 0), 1)
            },
            'alerts': []
        }
        
        # 生成警告信息
        if not integrity['is_valid']:
            dashboard_data['alerts'].extend([
                {'type': 'warning', 'message': issue['message']} 
                for issue in integrity['issues']
            ])
        
        # 组织健康度警告
        health = overview['organization_health']
        if health['score'] < 70:
            dashboard_data['alerts'].append({
                'type': 'warning',
                'message': f"组织健康度较低 ({health['score']}分)，建议关注组织结构优化"
            })
        
        return SuccessResponse(
            success=True,
            data=dashboard_data,
            message="成功获取HR管理仪表板数据"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取仪表板数据失败: {str(e)}") 