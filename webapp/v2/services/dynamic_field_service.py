"""
动态字段服务 - 直接从数据库视图获取字段信息
避免维护冗余的字段元数据表
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from webapp.v2.pydantic_models.reports import DetectedField


class DynamicFieldService:
    """动态字段服务 - 实时获取视图字段信息"""
    
    @staticmethod
    def get_view_fields(db: Session, schema_name: str, view_name: str) -> List[Dict[str, Any]]:
        """
        动态获取视图字段信息，包括中文别名
        """
        try:
            # 检查视图是否存在
            view_exists_query = text("""
                SELECT COUNT(*) as view_count
                FROM information_schema.views 
                WHERE table_schema = :schema_name 
                AND table_name = :view_name
            """)
            
            result = db.execute(view_exists_query, {
                'schema_name': schema_name,
                'view_name': view_name
            })
            view_exists = result.fetchone()[0] > 0
            
            if not view_exists:
                raise ValueError(f"视图 {schema_name}.{view_name} 不存在")
            
            # 获取字段信息
            fields_query = text("""
                SELECT 
                    column_name as field_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale,
                    ordinal_position,
                    COALESCE(col_description(pgc.oid, cols.ordinal_position), '') as column_comment
                FROM information_schema.columns cols
                LEFT JOIN pg_class pgc ON pgc.relname = cols.table_name
                LEFT JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = cols.table_schema
                WHERE cols.table_name = :view_name 
                AND cols.table_schema = :schema_name
                ORDER BY cols.ordinal_position
            """)
            
            result = db.execute(fields_query, {
                'schema_name': schema_name,
                'view_name': view_name
            })
            
            fields = []
            for row in result:
                # 构建字段类型信息
                field_type = row.data_type.upper()
                if row.character_maximum_length:
                    field_type += f"({row.character_maximum_length})"
                elif row.numeric_precision and row.numeric_scale:
                    field_type += f"({row.numeric_precision},{row.numeric_scale})"
                elif row.numeric_precision:
                    field_type += f"({row.numeric_precision})"
                
                # 判断是否为中文字段名
                field_name = row.field_name
                is_chinese = any('\u4e00' <= char <= '\u9fff' for char in field_name)
                
                field_info = {
                    "id": row.ordinal_position,  # 使用序号作为临时ID
                    "field_name": field_name,
                    "field_type": field_type,
                    "data_type": row.data_type,
                    "is_nullable": row.is_nullable == 'YES',
                    "is_primary_key": False,
                    "is_foreign_key": False,
                    "is_indexed": False,
                    "is_visible": True,
                    "is_searchable": True,
                    "is_sortable": True,
                    "is_filterable": True,
                    "is_exportable": True,
                    "sort_order": row.ordinal_position,
                    "comment": row.column_comment or None,
                    # 动态设置显示名称
                    "display_name_zh": field_name if is_chinese else None,
                    "display_name_en": field_name if not is_chinese else None,
                    "description": f"{'中文字段' if is_chinese else '英文字段'}：{field_name}",
                    # 根据字段名推断分组
                    "field_group": DynamicFieldService._infer_field_group(field_name),
                    "field_category": DynamicFieldService._infer_field_category(field_name)
                }
                
                fields.append(field_info)
            
            return fields
            
        except Exception as e:
            raise ValueError(f"获取视图字段失败: {str(e)}")
    
    @staticmethod
    def _infer_field_group(field_name: str) -> str:
        """根据字段名推断字段分组"""
        field_lower = field_name.lower()
        
        # 基础信息
        if any(keyword in field_lower for keyword in ['员工', '姓名', '编号', '部门', '职位', 'employee', 'name', 'code', 'department']):
            return "基础信息"
        
        # 薪资信息
        if any(keyword in field_lower for keyword in ['工资', '薪级', '津贴', '奖金', '绩效', 'salary', 'allowance', 'bonus']):
            return "薪资信息"
        
        # 扣除信息
        if any(keyword in field_lower for keyword in ['扣除', '保险', '公积金', '税', 'deduction', 'insurance', 'tax']):
            return "扣除信息"
        
        # 计算信息
        if any(keyword in field_lower for keyword in ['应发', '实发', '合计', '基数', '费率', 'gross', 'net', 'total', 'base', 'rate']):
            return "计算信息"
        
        # 审计信息
        if any(keyword in field_lower for keyword in ['审计', '时间', '版本', 'audit', 'time', 'version']):
            return "审计信息"
        
        return "其他"
    
    @staticmethod
    def _infer_field_category(field_name: str) -> str:
        """根据字段名推断字段分类"""
        field_lower = field_name.lower()
        
        if any(keyword in field_lower for keyword in ['id', 'ID', '编号']):
            return "标识符"
        elif any(keyword in field_lower for keyword in ['金额', '工资', '薪', '费', 'amount', 'salary', 'pay']):
            return "金额"
        elif any(keyword in field_lower for keyword in ['时间', '日期', 'time', 'date']):
            return "时间"
        elif any(keyword in field_lower for keyword in ['状态', '标志', 'status', 'flag']):
            return "状态"
        else:
            return "文本"


class DynamicDataSourceService:
    """动态数据源服务"""
    
    @staticmethod
    def get_data_source_fields_dynamic(db: Session, data_source_id: int) -> List[Dict[str, Any]]:
        """
        动态获取数据源字段，不依赖 report_data_source_fields 表
        """
        # 首先获取数据源信息
        data_source_query = text("""
            SELECT schema_name, table_name, view_name, source_type
            FROM config.report_data_sources 
            WHERE id = :data_source_id
        """)
        
        result = db.execute(data_source_query, {'data_source_id': data_source_id})
        data_source = result.fetchone()
        
        if not data_source:
            raise ValueError(f"数据源 {data_source_id} 不存在")
        
        # 确定表名或视图名
        table_name = data_source.table_name or data_source.view_name
        if not table_name:
            raise ValueError("数据源缺少表名或视图名")
        
        # 动态获取字段信息
        return DynamicFieldService.get_view_fields(
            db=db,
            schema_name=data_source.schema_name,
            view_name=table_name
        ) 