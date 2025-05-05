# salary_system/webapp/utils/formula_parser.py
import logging
from typing import Dict, Any, Optional
try:
    from asteval import Interpreter
    ASTEVAL_AVAILABLE = True
except ImportError:
    ASTEVAL_AVAILABLE = False

logger = logging.getLogger(__name__)

# 不再需要全局解释器实例
# aeval = None
# if ASTEVAL_AVAILABLE:
#     aeval = Interpreter()
#     # 示例：可以预定义一些安全的数学函数，如果需要的话
#     # aeval.symtable['safe_max'] = max 
#     # aeval.symtable['safe_min'] = min
#     # aeval.symtable['safe_round'] = round
# else:
#     logger.warning("asteval library not found. Formula evaluation will be disabled. Please install it: pip install asteval")

def safe_evaluate_formula(
    expression: str,
    context: Dict[str, Any]
) -> Optional[Any]:
    """
    Safely evaluates a formula string using asteval if available.
    Creates a new Interpreter instance for each call for safety.

    Args:
        expression: The formula string to evaluate (e.g., "base * 1.1 + bonus").
        context: A dictionary containing allowed variable names and their values
                 (e.g., {"base": 5000, "bonus": 200}).

    Returns:
        The result of the evaluation, or None if asteval is not available or an error occurs.
    """
    if not ASTEVAL_AVAILABLE:
        logger.error("Cannot evaluate formula: asteval library is not installed.")
        return None

    if not expression:
        logger.warning("Attempted to evaluate an empty formula expression.")
        return None

    # 为每次调用创建一个新的、独立的解释器实例
    local_aeval = Interpreter()

    # 将上下文加载到这个本地解释器的符号表中
    # 注意：这里是直接修改 local_aeval 的 symtable
    for key, value in context.items():
        local_aeval.symtable[key] = value

    # 添加一些默认的安全函数（可选，但推荐）
    # local_aeval.symtable['max'] = max
    # local_aeval.symtable['min'] = min
    # local_aeval.symtable['round'] = round
    # local_aeval.symtable['len'] = len # 如果需要的话

    try:
        # 现在直接调用 eval，它会使用 local_aeval 实例的符号表
        result = local_aeval.eval(expression)
        return result
    except Exception as e:
        # 捕获 asteval 可能抛出的各种计算错误
        logger.error(
            f"Error evaluating formula '{expression}' with context keys {list(context.keys())}: {e}",
            exc_info=True # Include traceback in log for debugging
        )
        # 返回 None 表示计算失败
        return None 