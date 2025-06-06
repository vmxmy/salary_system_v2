"""
配置管理服务 - 基于视图的配置API服务
提供统一的配置数据访问接口，基于核心视图实现
"""

from typing import List, Dict, Any, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from .base import BaseViewService, BaseCRUDService, BusinessService

class LookupTypesViewService(BaseViewService):
    """查找类型视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "config.lookup_types")
    
    def get_all_types(self, **filters) -> List[Dict[str, Any]]:
        """获取所有查找类型"""
        query = text(f"""
            SELECT 
                id,
                code,
                name,
                description,
                is_active,
                created_at,
                updated_at,
                (SELECT COUNT(*) FROM config.lookup_values lv WHERE lv.lookup_type_id = lt.id) as value_count
            FROM {self.table_name} lt
            WHERE (:is_active IS NULL OR is_active = :is_active)
            ORDER BY code
        """)
        
        params = {
            'is_active': filters.get('is_active')
        }
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]

class LookupValuesViewService(BaseViewService):
    """查找值视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "config.lookup_values")
    
    def get_by_type_code(self, type_code: str, **filters) -> List[Dict[str, Any]]:
        """根据类型代码获取查找值"""
        query = text("""
            SELECT 
                lv.id,
                lv.code,
                lv.name,
                lv.description,
                lv.sort_order,
                lv.is_active,
                lv.created_at,
                lv.updated_at,
                lt.code as type_code,
                lt.name as type_name
            FROM config.lookup_values lv
            JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
            WHERE lt.code = :type_code
            AND (:is_active IS NULL OR lv.is_active = :is_active)
            ORDER BY lv.sort_order, lv.code
        """)
        
        params = {
            'type_code': type_code,
            'is_active': filters.get('is_active')
        }
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]

class PayrollComponentsViewService(BaseViewService):
    """薪资组件视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "v_payroll_components_basic")
    
    def get_components_with_usage(self, **filters) -> List[Dict[str, Any]]:
        """获取薪资组件及使用统计"""
        query = text("""
            SELECT 
                pc.*,
                COALESCE(usage.usage_count, 0) as usage_count,
                COALESCE(usage.last_used_date, pc.created_at) as last_used_date
            FROM v_payroll_components_basic pc
            LEFT JOIN (
                SELECT 
                    component_id,
                    COUNT(*) as usage_count,
                    MAX(created_at) as last_used_date
                FROM payroll.payroll_entries
                GROUP BY component_id
            ) usage ON pc.id = usage.component_id
            WHERE (:component_type IS NULL OR pc.component_type = :component_type)
            AND (:is_active IS NULL OR pc.is_active = :is_active)
            ORDER BY pc.component_type, pc.sort_order, pc.name
        """)
        
        params = {
            'component_type': filters.get('component_type'),
            'is_active': filters.get('is_active')
        }
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]

class TaxBracketsViewService(BaseViewService):
    """税率表视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "config.tax_brackets")
    
    def get_current_brackets(self, tax_type: str = None) -> List[Dict[str, Any]]:
        """获取当前有效的税率表"""
        query = text("""
            SELECT 
                id,
                tax_type,
                income_min,
                income_max,
                tax_rate,
                quick_deduction,
                effective_date,
                expiry_date,
                is_active,
                created_at,
                updated_at
            FROM config.tax_brackets
            WHERE is_active = true
            AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
            AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
            AND (:tax_type IS NULL OR tax_type = :tax_type)
            ORDER BY tax_type, income_min
        """)
        
        params = {'tax_type': tax_type}
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]

class SocialSecurityRatesViewService(BaseViewService):
    """社保费率视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "config.social_security_rates")
    
    def get_current_rates(self, region_code: str = None) -> List[Dict[str, Any]]:
        """获取当前有效的社保费率"""
        query = text("""
            SELECT 
                id,
                region_code,
                insurance_type,
                employee_rate,
                employer_rate,
                base_min,
                base_max,
                effective_date,
                expiry_date,
                is_active,
                created_at,
                updated_at
            FROM config.social_security_rates
            WHERE is_active = true
            AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
            AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
            AND (:region_code IS NULL OR region_code = :region_code)
            ORDER BY region_code, insurance_type
        """)
        
        params = {'region_code': region_code}
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]

class SystemParametersViewService(BaseViewService):
    """系统参数视图服务"""
    
    def __init__(self, db: Session):
        super().__init__(db, "config.system_parameters")
    
    def get_parameters_by_category(self, category: str = None) -> List[Dict[str, Any]]:
        """根据分类获取系统参数"""
        query = text("""
            SELECT 
                id,
                parameter_key,
                parameter_value,
                parameter_type,
                category,
                description,
                is_active,
                created_at,
                updated_at
            FROM config.system_parameters
            WHERE is_active = true
            AND (:category IS NULL OR category = :category)
            ORDER BY category, parameter_key
        """)
        
        params = {'category': category}
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()]
    
    def get_parameter_value(self, key: str) -> Optional[str]:
        """获取单个参数值"""
        query = text("""
            SELECT parameter_value
            FROM config.system_parameters
            WHERE parameter_key = :key AND is_active = true
        """)
        
        result = self.db.execute(query, {'key': key})
        row = result.first()
        return row[0] if row else None

class ConfigBusinessService(BusinessService):
    """配置业务服务 - 统一配置管理入口"""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.lookup_types = LookupTypesViewService(db)
        self.lookup_values = LookupValuesViewService(db)
        self.payroll_components = PayrollComponentsViewService(db)
        self.tax_brackets = TaxBracketsViewService(db)
        self.social_security_rates = SocialSecurityRatesViewService(db)
        self.system_parameters = SystemParametersViewService(db)
    
    def get_lookup_data(self, type_codes: List[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """获取查找数据字典"""
        if not type_codes:
            # 获取所有活跃的查找类型
            types = self.lookup_types.get_all_types(is_active=True)
            type_codes = [t['code'] for t in types]
        
        result = {}
        for type_code in type_codes:
            result[type_code] = self.lookup_values.get_by_type_code(
                type_code, is_active=True
            )
        
        return result
    
    def get_payroll_config(self) -> Dict[str, Any]:
        """获取薪资配置数据"""
        return {
            'components': self.payroll_components.get_components_with_usage(is_active=True),
            'tax_brackets': self.tax_brackets.get_current_brackets(),
            'social_security_rates': self.social_security_rates.get_current_rates(),
            'parameters': self.system_parameters.get_parameters_by_category('PAYROLL')
        }
    
    def get_system_config(self) -> Dict[str, Any]:
        """获取系统配置数据"""
        return {
            'parameters': self.system_parameters.get_parameters_by_category(),
            'lookup_types': self.lookup_types.get_all_types(is_active=True)
        }
    
    def validate_config_integrity(self) -> Dict[str, Any]:
        """验证配置完整性"""
        issues = []
        
        # 检查必需的查找类型
        required_types = [
            'EMPLOYEE_STATUS', 'POSITION_LEVEL', 'DEPARTMENT_TYPE',
            'PAYROLL_STATUS', 'COMPONENT_TYPE'
        ]
        
        existing_types = {t['code'] for t in self.lookup_types.get_all_types(is_active=True)}
        missing_types = set(required_types) - existing_types
        
        if missing_types:
            issues.append({
                'type': 'missing_lookup_types',
                'message': f'缺少必需的查找类型: {", ".join(missing_types)}'
            })
        
        # 检查薪资组件配置
        components = self.payroll_components.get_components_with_usage(is_active=True)
        if not components:
            issues.append({
                'type': 'no_payroll_components',
                'message': '没有配置任何薪资组件'
            })
        
        # 检查税率表配置
        tax_brackets = self.tax_brackets.get_current_brackets()
        if not tax_brackets:
            issues.append({
                'type': 'no_tax_brackets',
                'message': '没有配置当前有效的税率表'
            })
        
        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'checked_at': func.now()
        } 