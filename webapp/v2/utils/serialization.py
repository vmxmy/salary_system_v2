"""
Serialization utilities and custom SQLAlchemy types
"""
from sqlalchemy.orm import class_mapper
from sqlalchemy.orm.collections import InstrumentedList # For list-based relationships
from datetime import date, datetime # Added import for date, datetime
from decimal import Decimal # Added import for Decimal
import json # Ensure json is imported

from sqlalchemy.types import TypeDecorator, TEXT # Use TEXT as underlying for custom JSON
from sqlalchemy.dialects.postgresql import JSONB # Import the dialect-specific JSONB

def orm_to_dict(obj: object, visited: set = None) -> dict:
    """
    Converts a SQLAlchemy ORM object (and its relationships) to a dictionary,
    excluding internal SQLAlchemy attributes.
    Handles simple relationships but might need adjustments for complex cyclic cases
    or very deep nesting if performance becomes an issue.
    """
    if obj is None:
        return None

    if visited is None:
        visited = set()

    if obj in visited:
        return f"<Circular reference to {obj.__class__.__name__} id={getattr(obj, 'id', 'N/A')}>"
    
    visited.add(obj)

    mapper = class_mapper(obj.__class__)
    result = {}

    for column in mapper.columns:
        result[column.key] = getattr(obj, column.key)

    # Handle relationships (simple one-level deep for now)
    for name, prop in mapper.relationships.items():
        if name.startswith('_'): # Skip private/internal relationships
            continue
        
        related_obj = getattr(obj, name)
        if related_obj is None:
            result[name] = None
        elif isinstance(related_obj, InstrumentedList): # One-to-many or many-to-many
            result[name] = [orm_to_dict(item, visited.copy()) for item in related_obj]
        else: # One-to-one or many-to-one
            result[name] = orm_to_dict(related_obj, visited.copy())
            
    # Remove SQLAlchemy internal state if it somehow got in
    result.pop('_sa_instance_state', None)
    
    # Clean up visited set for the current object before returning,
    # so sibling objects at the same level are not incorrectly flagged as circular
    # if they are not actually part of a cycle with the current obj.
    # This is a simplification; a more robust cycle detection might be needed for complex graphs.
    # For now, we rely on passing copies of visited for recursive calls.
    
    return result

def orm_to_dict_flat(obj: object) -> dict:
    """
    Converts a SQLAlchemy ORM object to a flat dictionary,
    containing only its column values, excluding relationships and internal attributes.
    Handles date, datetime, and Decimal types for JSON serialization.
    """
    if obj is None:
        return None
        
    mapper = class_mapper(obj.__class__)
    result = {}
    for column in mapper.columns:
        value = getattr(obj, column.key)
        if isinstance(value, (datetime, date)):
            result[column.key] = value.isoformat()
        elif isinstance(value, Decimal):
            result[column.key] = str(value)
        else:
            result[column.key] = value
    return result 

def alchemy_json_serializer(obj):
    """
    JSON serializer for SQLAlchemy JSONB type, handles Decimal, date, datetime.
    To be used as the `default` for json.dumps.
    """
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

# If you need to pass json.dumps directly to JSONB with this serializer,
# you might need a wrapper, or ensure your SQLAlchemy version supports passing `default` to `json_serializer`.
# For simplicity, we'll pass the `default` function directly if possible, or wrap json.dumps.

def custom_json_dumps(data, **kwargs):
    """Wrapper for json.dumps with our custom serializer as default."""
    return json.dumps(data, default=alchemy_json_serializer, **kwargs) 

# --- Custom SQLAlchemy JSONB Type with proper serialization --- 
class CustomJSONB(TypeDecorator):
    """Custom JSONB type that handles Decimal, date, and datetime serialization.
    
    Ensures that data written to and read from JSONB columns is correctly
    serialized/deserialized using our custom logic.
    """
    impl = JSONB # Use PostgreSQL JSONB as the underlying implementation
    cache_ok = True # Indicates this type is safe to cache

    def process_bind_param(self, value, dialect):
        """Process the value for binding to a database query (Python -> DB)."""
        if value is not None:
            # 调试日志：跟踪JSONB转换过程
            import logging
            logger = logging.getLogger(__name__)
            
            # 检查是否包含手动调整数据
            if isinstance(value, dict):
                manual_components = []
                for key, val in value.items():
                    if isinstance(val, dict) and val.get('is_manual'):
                        manual_components.append(key)
                if manual_components:
                    logger.info(f"🔧 [CustomJSONB] 转换前包含手动调整组件: {manual_components}")
            
            # 不要在这里进行JSON序列化！PostgreSQL的JSONB会自动处理
            # 只需要确保Decimal等类型被转换为JSON兼容的类型
            converted = self._convert_for_jsonb(value)
            
            # 检查转换后的数据
            if isinstance(converted, dict):
                manual_components_after = []
                for key, val in converted.items():
                    if isinstance(val, dict) and val.get('is_manual'):
                        manual_components_after.append(key)
                if manual_components_after:
                    logger.info(f"✅ [CustomJSONB] 转换后保留手动调整组件: {manual_components_after}")
                elif any(isinstance(val, dict) and val.get('is_manual') for val in value.values() if isinstance(value, dict)):
                    logger.warning(f"❌ [CustomJSONB] 手动调整数据在转换中丢失！")
            
            return converted
        return value

    def _convert_for_jsonb(self, obj):
        """递归转换对象中的非JSON兼容类型为JSON兼容类型"""
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, bool):
            return obj  # 确保布尔值保持为布尔值
        elif isinstance(obj, int):
            return obj  # 保持整数不变，特别重要对于公积金进位后的整数
        elif isinstance(obj, dict):
            result = {}
            for key, value in obj.items():
                converted_value = self._convert_for_jsonb(value)
                result[key] = converted_value
                # 调试特定字段
                if key == 'is_manual' and value is not None:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.info(f"🔧 [CustomJSONB] 转换 is_manual: {value} ({type(value)}) -> {converted_value} ({type(converted_value)})")
            return result
        elif isinstance(obj, list):
            return [self._convert_for_jsonb(item) for item in obj]
        elif isinstance(obj, tuple):
            return tuple(self._convert_for_jsonb(item) for item in obj)
        else:
            return obj

    def process_result_value(self, value, dialect):
        """Process the value received from the database (DB -> Python)."""
        if value is not None:
            # 调试日志：跟踪JSONB读取过程
            import logging
            logger = logging.getLogger(__name__)
            
            # 检查是否包含手动调整数据（读取时）
            if isinstance(value, dict):
                manual_components = []
                for key, val in value.items():
                    if isinstance(val, dict) and val.get('is_manual'):
                        manual_components.append(key)
                if manual_components:
                    logger.info(f"🔧 [CustomJSONB读取] 从数据库读取到手动调整组件: {manual_components}")
                    
                    # 详细检查住房公积金数据
                    housing_data = value.get('HOUSING_FUND_PERSONAL', {})
                    if isinstance(housing_data, dict) and housing_data.get('is_manual'):
                        logger.info(f"🔧 [CustomJSONB读取] HOUSING_FUND_PERSONAL 手动调整数据: {housing_data}")
            
            # PostgreSQL JSONB values are already parsed by psycopg2/SQLAlchemy
            # 如果是字符串（说明是旧的双重编码数据），尝试解析
            if isinstance(value, str):
                try:
                    parsed = json.loads(value)
                    logger.info(f"🔧 [CustomJSONB读取] 解析字符串格式数据")
                    return parsed
                except (json.JSONDecodeError, TypeError):
                    logger.warning(f"🔧 [CustomJSONB读取] 字符串解析失败，返回原值")
                    return value
            # 如果已经是dict/list，直接返回
            logger.info(f"🔧 [CustomJSONB读取] 直接返回dict/list格式数据")
            return value
        return value

    @property
    def python_type(self):
        """Specifies the Python type this custom type represents."""
        return dict # Or list, depending on common usage, dict is typical for JSONB 