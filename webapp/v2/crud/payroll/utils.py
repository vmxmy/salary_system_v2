"""
工资相关的工具函数。
"""
from decimal import Decimal
from typing import Dict, List, Any, Union


def convert_decimals_to_float(obj: Union[Dict, List, Decimal, Any]) -> Union[Dict, List, float, Any]:
    """
    递归地将对象中的所有Decimal类型转换为float类型，以解决JSON序列化问题
    
    Args:
        obj: 需要转换的对象
        
    Returns:
        转换后的对象，其中所有Decimal类型都被转换为float
    """
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {key: convert_decimals_to_float(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals_to_float(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_decimals_to_float(item) for item in obj)
    else:
        return obj 