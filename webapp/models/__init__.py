# webapp/models/__init__.py

from .role import *
from .user import *
from .employee import *
from .unit import *
from .department import *
from .report_link import *
from .user_table_config import *

# It's generally good practice to define __all__ to specify what gets imported with 'from .models import *'
# However, for this specific refactoring of models_db.py, directly importing all from submodules
# will achieve the goal of making all functions available as they were before.

# If you want to be more explicit and control the namespace:
# __all__ = (
#     role.__all__ +
#     user.__all__ +
#     employee.__all__ +
#     unit.__all__ +
#     department.__all__ +
#     report_link.__all__ +
#     user_table_config.__all__
# )
# This would require each submodule to also define __all__.
# For simplicity and direct replacement of models_db.py functionality,
# the wildcard imports above are sufficient for now. 