"""
人力资源管理服务 - 基于视图的HR API服务
提供统一的人力资源数据访问接口，基于核心视图实现
"""

from typing import List, Dict, Any, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from .base import BaseViewService, BaseCRUDService, BusinessService

class EmployeesViewService(BaseViewService):
    """员工视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "v_employees_basic")
    
    def get_employees_with_details(self, **filters) -> List[Dict[str, Any]]:
        """获取员工详细信息"""
        query = text("""
            SELECT 
                e.*,
                d.name as department_name,
                d.code as department_code,
                p.title as position_title,
                p.level as position_level,
                pc.name as personnel_category_name,
                lv_status.name as status_name,
                lv_level.name as level_name
            FROM v_employees_basic e
            LEFT JOIN hr.departments d ON e.department_id = d.id
            LEFT JOIN hr.positions p ON e.actual_position_id = p.id
            LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
            LEFT JOIN config.lookup_values lv_status ON e.employee_status_lookup_value_id = lv_status.id
            LEFT JOIN config.lookup_values lv_level ON e.job_position_level_lookup_value_id = lv_level.id
            WHERE (:department_id IS NULL OR e.department_id = :department_id)
            AND (:personnel_category_id IS NULL OR e.personnel_category_id = :personnel_category_id)
            AND (:employee_status IS NULL OR lv_status.code = :employee_status)
            AND (:is_active IS NULL OR e.is_active = :is_active)
            AND (:search_term IS NULL OR (
                e.name ILIKE '%' || :search_term || '%' OR
                e.employee_number ILIKE '%' || :search_term || '%' OR
                e.id_number ILIKE '%' || :search_term || '%'
            ))
            ORDER BY e.employee_number, e.name
        """)
        
        params = {
            'department_id': filters.get('department_id'),
            'personnel_category_id': filters.get('personnel_category_id'),
            'employee_status': filters.get('employee_status'),
            'is_active': filters.get('is_active'),
            'search_term': filters.get('search_term')
        }
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]
    
    def get_employee_statistics(self) -> Dict[str, Any]:
        """获取员工统计信息"""
        query = text("""
            SELECT 
                COUNT(*) as total_employees,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_employees,
                COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_employees,
                COUNT(DISTINCT department_id) as departments_count,
                COUNT(DISTINCT personnel_category_id) as categories_count,
                AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))) as avg_age
            FROM v_employees_basic
        """)
        
        result = self.db.execute(query)
        return dict(result.mappings().first())

class DepartmentsViewService(BaseViewService):
    """部门视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "hr.departments")
    
    def get_departments_with_stats(self, **filters) -> List[Dict[str, Any]]:
        """获取部门及统计信息"""
        query = text("""
            SELECT 
                d.*,
                parent.name as parent_name,
                COUNT(e.id) as employee_count,
                COUNT(CASE WHEN e.is_active = true THEN 1 END) as active_employee_count,
                COUNT(p.id) as position_count
            FROM hr.departments d
            LEFT JOIN hr.departments parent ON d.parent_id = parent.id
            LEFT JOIN hr.employees e ON d.id = e.department_id
            LEFT JOIN hr.positions p ON d.id = p.department_id
            WHERE (:is_active IS NULL OR d.is_active = :is_active)
            AND (:parent_id IS NULL OR d.parent_id = :parent_id)
            GROUP BY d.id, parent.name
            ORDER BY d.code, d.name
        """)
        
        params = {
            'is_active': filters.get('is_active'),
            'parent_id': filters.get('parent_id')
        }
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]
    
    def get_department_hierarchy(self) -> List[Dict[str, Any]]:
        """获取部门层级结构"""
        query = text("""
            WITH RECURSIVE dept_hierarchy AS (
                -- 根部门
                SELECT 
                    id, name, code, parent_id, is_active,
                    0 as level,
                    ARRAY[id] as path,
                    name as full_path
                FROM hr.departments 
                WHERE parent_id IS NULL AND is_active = true
                
                UNION ALL
                
                -- 子部门
                SELECT 
                    d.id, d.name, d.code, d.parent_id, d.is_active,
                    dh.level + 1,
                    dh.path || d.id,
                    dh.full_path || ' > ' || d.name
                FROM hr.departments d
                JOIN dept_hierarchy dh ON d.parent_id = dh.id
                WHERE d.is_active = true
            )
            SELECT 
                dh.*,
                COUNT(e.id) as employee_count
            FROM dept_hierarchy dh
            LEFT JOIN hr.employees e ON dh.id = e.department_id AND e.is_active = true
            GROUP BY dh.id, dh.name, dh.code, dh.parent_id, dh.is_active, dh.level, dh.path, dh.full_path
            ORDER BY dh.path
        """)
        
        result = self.db.execute(query)
        return [dict(row) for row in result.mappings()]

class PositionsViewService(BaseViewService):
    """职位视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "hr.positions")
    
    def get_positions_with_details(self, **filters) -> List[Dict[str, Any]]:
        """获取职位详细信息"""
        query = text("""
            SELECT 
                p.*,
                d.name as department_name,
                d.code as department_code,
                lv.name as level_name,
                COUNT(e.id) as employee_count,
                COUNT(CASE WHEN e.is_active = true THEN 1 END) as active_employee_count
            FROM hr.positions p
            LEFT JOIN hr.departments d ON p.department_id = d.id
            LEFT JOIN config.lookup_values lv ON p.level_lookup_value_id = lv.id
            LEFT JOIN hr.employees e ON p.id = e.actual_position_id
            WHERE (:department_id IS NULL OR p.department_id = :department_id)
            AND (:level IS NULL OR lv.code = :level)
            AND (:is_active IS NULL OR p.is_active = :is_active)
            GROUP BY p.id, d.name, d.code, lv.name
            ORDER BY d.code, p.title
        """)
        
        params = {
            'department_id': filters.get('department_id'),
            'level': filters.get('level'),
            'is_active': filters.get('is_active')
        }
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]

class PersonnelCategoriesViewService(BaseViewService):
    """人员类别视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "hr.personnel_categories")
    
    def get_categories_with_stats(self, **filters) -> List[Dict[str, Any]]:
        """获取人员类别及统计信息"""
        query = text("""
            SELECT 
                pc.*,
                COUNT(e.id) as employee_count,
                COUNT(CASE WHEN e.is_active = true THEN 1 END) as active_employee_count,
                AVG(CASE WHEN e.is_active = true THEN 
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) 
                END) as avg_age
            FROM hr.personnel_categories pc
            LEFT JOIN hr.employees e ON pc.id = e.personnel_category_id
            WHERE (:is_active IS NULL OR pc.is_active = :is_active)
            GROUP BY pc.id
            ORDER BY pc.name
        """)
        
        params = {
            'is_active': filters.get('is_active')
        }
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]

class HRBusinessService(BusinessService):
    """人力资源业务服务 - 统一HR管理入口"""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.employees = EmployeesViewService(db)
        self.departments = DepartmentsViewService(db)
        self.positions = PositionsViewService(db)
        self.personnel_categories = PersonnelCategoriesViewService(db)
    
    def get_organization_overview(self) -> Dict[str, Any]:
        """获取组织架构概览"""
        # 员工统计
        employee_stats = self.employees.get_employee_statistics()
        
        # 部门统计
        departments = self.departments.get_departments_with_stats(is_active=True)
        dept_stats = {
            'total_departments': len(departments),
            'departments_with_employees': len([d for d in departments if d['employee_count'] > 0]),
            'avg_employees_per_dept': sum(d['employee_count'] for d in departments) / len(departments) if departments else 0
        }
        
        # 职位统计
        positions = self.positions.get_positions_with_details(is_active=True)
        position_stats = {
            'total_positions': len(positions),
            'positions_with_employees': len([p for p in positions if p['employee_count'] > 0]),
            'avg_employees_per_position': sum(p['employee_count'] for p in positions) / len(positions) if positions else 0
        }
        
        # 人员类别统计
        categories = self.personnel_categories.get_categories_with_stats(is_active=True)
        category_stats = {
            'total_categories': len(categories),
            'categories_with_employees': len([c for c in categories if c['employee_count'] > 0])
        }
        
        return {
            'employee_statistics': employee_stats,
            'department_statistics': dept_stats,
            'position_statistics': position_stats,
            'category_statistics': category_stats,
            'organization_health': self._calculate_organization_health(
                employee_stats, dept_stats, position_stats, category_stats
            )
        }
    
    def get_employee_distribution(self) -> Dict[str, Any]:
        """获取员工分布情况"""
        # 按部门分布
        dept_distribution = self.departments.get_departments_with_stats(is_active=True)
        
        # 按人员类别分布
        category_distribution = self.personnel_categories.get_categories_with_stats(is_active=True)
        
        # 按职位级别分布
        query = text("""
            SELECT 
                lv.name as level_name,
                lv.code as level_code,
                COUNT(e.id) as employee_count
            FROM config.lookup_values lv
            JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
            LEFT JOIN hr.employees e ON lv.id = e.job_position_level_lookup_value_id AND e.is_active = true
            WHERE lt.code = 'JOB_POSITION_LEVEL' AND lv.is_active = true
            GROUP BY lv.id, lv.name, lv.code, lv.sort_order
            ORDER BY lv.sort_order
        """)
        
        result = self.db.execute(query)
        level_distribution = [dict(row) for row in result.mappings()]
        
        return {
            'by_department': dept_distribution,
            'by_category': category_distribution,
            'by_level': level_distribution
        }
    
    def search_employees(self, search_term: str, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """搜索员工"""
        if filters is None:
            filters = {}
        
        filters['search_term'] = search_term
        return self.employees.get_employees_with_details(**filters)
    
    def get_department_tree(self) -> List[Dict[str, Any]]:
        """获取部门树形结构"""
        hierarchy = self.departments.get_department_hierarchy()
        
        # 构建树形结构
        tree = []
        node_map = {}
        
        for item in hierarchy:
            node = {
                'id': item['id'],
                'name': item['name'],
                'code': item['code'],
                'level': item['level'],
                'employee_count': item['employee_count'],
                'children': []
            }
            node_map[item['id']] = node
            
            if item['level'] == 0:
                tree.append(node)
            else:
                parent_id = item['path'][-2] if len(item['path']) > 1 else None
                if parent_id and parent_id in node_map:
                    node_map[parent_id]['children'].append(node)
        
        return tree
    
    def validate_hr_data_integrity(self) -> Dict[str, Any]:
        """验证HR数据完整性"""
        issues = []
        
        # 检查员工数据完整性
        query = text("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN department_id IS NULL THEN 1 END) as no_department,
                COUNT(CASE WHEN actual_position_id IS NULL THEN 1 END) as no_position,
                COUNT(CASE WHEN personnel_category_id IS NULL THEN 1 END) as no_category,
                COUNT(CASE WHEN employee_status_lookup_value_id IS NULL THEN 1 END) as no_status
            FROM hr.employees
            WHERE is_active = true
        """)
        
        result = self.db.execute(query)
        employee_check = dict(result.mappings().first())
        
        if employee_check['no_department'] > 0:
            issues.append({
                'type': 'employees_without_department',
                'count': employee_check['no_department'],
                'message': f'{employee_check["no_department"]} 个员工没有分配部门'
            })
        
        if employee_check['no_position'] > 0:
            issues.append({
                'type': 'employees_without_position',
                'count': employee_check['no_position'],
                'message': f'{employee_check["no_position"]} 个员工没有分配职位'
            })
        
        # 检查部门层级完整性
        query = text("""
            SELECT COUNT(*) as orphaned_departments
            FROM hr.departments d
            WHERE d.parent_id IS NOT NULL 
            AND d.parent_id NOT IN (SELECT id FROM hr.departments WHERE is_active = true)
            AND d.is_active = true
        """)
        
        result = self.db.execute(query)
        orphaned_count = result.scalar()
        
        if orphaned_count > 0:
            issues.append({
                'type': 'orphaned_departments',
                'count': orphaned_count,
                'message': f'{orphaned_count} 个部门的上级部门不存在或已停用'
            })
        
        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'employee_check': employee_check,
            'checked_at': func.now()
        }
    
    def _calculate_organization_health(self, employee_stats, dept_stats, position_stats, category_stats) -> Dict[str, Any]:
        """计算组织健康度"""
        health_score = 100
        issues = []
        
        # 检查员工分布是否均衡
        if dept_stats['avg_employees_per_dept'] > 50:
            health_score -= 10
            issues.append("部门平均人数过多，建议拆分大部门")
        
        if dept_stats['avg_employees_per_dept'] < 3:
            health_score -= 5
            issues.append("部门平均人数过少，建议合并小部门")
        
        # 检查职位配置
        if position_stats['avg_employees_per_position'] > 10:
            health_score -= 10
            issues.append("职位平均人数过多，建议细化职位设置")
        
        # 检查年龄结构
        avg_age = employee_stats.get('avg_age', 0)
        if avg_age > 50:
            health_score -= 15
            issues.append("员工平均年龄偏高，建议加强年轻人才引进")
        elif avg_age < 25:
            health_score -= 10
            issues.append("员工平均年龄偏低，建议引进经验丰富的人才")
        
        return {
            'score': max(0, health_score),
            'level': 'excellent' if health_score >= 90 else 'good' if health_score >= 70 else 'fair' if health_score >= 50 else 'poor',
            'issues': issues
        } 