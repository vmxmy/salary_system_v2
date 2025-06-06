"""
查找数据服务 - 查找类型和查找值的视图服务
提供查找数据的统一访问接口
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..base import BaseViewService

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
    
    def get_all_values(self, **filters) -> List[Dict[str, Any]]:
        """获取所有查找值"""
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
            WHERE (:is_active IS NULL OR lv.is_active = :is_active)
            AND (:type_code IS NULL OR lt.code = :type_code)
            ORDER BY lt.code, lv.sort_order, lv.code
        """)
        
        params = {
            'is_active': filters.get('is_active'),
            'type_code': filters.get('type_code')
        }
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result.mappings()] 