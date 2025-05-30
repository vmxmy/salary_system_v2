# 导出所有CRUD操作
from .config import *

# 从 hr/ 包导入员工相关函数
from .hr import (
    get_employees,
    get_employee,
    get_employee_by_code,
    get_employee_by_id_number,
    get_employee_by_name_and_id_number,
    create_employee,
    update_employee,
    delete_employee
)

from .payroll import *
from .security import *

# 导入重命名后的 hr_crud.py 文件中的函数
from .hr_crud import (
    # Department functions
    get_departments,
    get_department,
    get_department_by_code,
    create_department,
    update_department,
    delete_department,
    
    # Personnel category functions
    get_personnel_categories,
    get_personnel_category,
    get_personnel_category_by_code,
    create_personnel_category,
    update_personnel_category,
    delete_personnel_category,
    
    # Position functions
    get_positions,
    
    # Bulk operations
    create_bulk_employees
)
