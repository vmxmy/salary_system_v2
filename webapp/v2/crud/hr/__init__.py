# Tämä tiedosto määrittelee hr-kansion Python-paketiksi 

# HR module CRUD operations - Employee functions only
from .employee import (
    get_employees,
    get_employee,
    get_employee_by_code,
    get_employee_by_id_number,
    get_employee_by_name_and_id_number,
    delete_employee,
    create_employee,
    update_employee
)

# Employee bulk operations
from .employee_bulk import (
    batch_validate_employees,
    batch_import_employees
)

# Export employee functions only
__all__ = [
    "get_employees",
    "get_employee", 
    "get_employee_by_code",
    "get_employee_by_id_number",
    "get_employee_by_name_and_id_number",
    "delete_employee",
    "create_employee",
    "update_employee",
    "batch_validate_employees",
    "batch_import_employees"
] 