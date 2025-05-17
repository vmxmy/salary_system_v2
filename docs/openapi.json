{
    "openapi": "3.1.0",
    "info": {
        "title": "薪资管理系统API",
        "version": "1.0.0"
    },
    "paths": {
        "/": {
            "get": {
                "summary": "Read Root",
                "description": "Root endpoint providing a welcome message.",
                "operationId": "read_root__get",
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {}
                            }
                        }
                    }
                }
            }
        },
        "/converter": {
            "get": {
                "summary": "Get Converter Page",
                "description": "Serves the Excel to CSV converter HTML page.",
                "operationId": "get_converter_page_converter_get",
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "text/html": {
                                "schema": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/debug/field-config/{employee_type_key}": {
            "get": {
                "tags": [
                    "Debugging"
                ],
                "summary": "Fetch raw field config from DB for a type key",
                "description": "Debug endpoint to directly query the field configuration for a given employee type key.",
                "operationId": "debug_get_field_config_api_debug_field_config__employee_type_key__get",
                "parameters": [
                    {
                        "name": "employee_type_key",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "title": "Employee Type Key"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "additionalProperties": true
                                    },
                                    "title": "Response Debug Get Field Config Api Debug Field Config  Employee Type Key  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/auth/token": {
            "post": {
                "tags": [
                    "Authentication",
                    "Authentication"
                ],
                "summary": "Login For Access Token",
                "description": "获取JWT令牌。\n\n- **username**: 用户名\n- **password**: 密码",
                "operationId": "login_for_access_token_v2_auth_token_post",
                "requestBody": {
                    "content": {
                        "application/x-www-form-urlencoded": {
                            "schema": {
                                "$ref": "#/components/schemas/Body_login_for_access_token_v2_auth_token_post"
                            }
                        }
                    },
                    "required": true
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/TokenResponseWithFullUser"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/employees/": {
            "get": {
                "tags": [
                    "Employees",
                    "Employees"
                ],
                "summary": "Get Employees",
                "description": "获取员工列表，支持分页、搜索和过滤。\n\n- **search**: 搜索关键字，可以匹配员工代码、姓名、身份证号、邮箱、电话号码、部门名称或职位名称\n- **status_id**: 员工状态ID，用于过滤特定状态的员工\n- **department_id**: 部门ID，用于过滤特定部门的员工\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_employees_v2_employees__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "status_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Status Id"
                        }
                    },
                    {
                        "name": "department_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Department Id"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/EmployeeListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Employees",
                    "Employees"
                ],
                "summary": "Create Employee",
                "description": "创建新员工。\n\n- 需要SUPER_ADMIN或HR_ADMIN角色",
                "operationId": "create_employee_v2_employees__post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/EmployeeCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Employee"
                                    },
                                    "title": "Response Create Employee V2 Employees  Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/employees/{employee_id}": {
            "get": {
                "tags": [
                    "Employees",
                    "Employees"
                ],
                "summary": "Get Employee",
                "operationId": "get_employee_v2_employees__employee_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "employee_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "title": "The ID of the employee to get"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/Employee"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Employees",
                    "Employees"
                ],
                "summary": "Update Employee",
                "description": "更新员工信息。\n\n- **employee_id**: 员工ID\n- 需要SUPER_ADMIN或HR_ADMIN角色",
                "operationId": "update_employee_v2_employees__employee_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "employee_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Employee Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/EmployeeUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Employee"
                                    },
                                    "title": "Response Update Employee V2 Employees  Employee Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Employees",
                    "Employees"
                ],
                "summary": "Delete Employee",
                "description": "删除员工。\n\n- **employee_id**: 员工ID\n- 需要SUPER_ADMIN角色",
                "operationId": "delete_employee_v2_employees__employee_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "employee_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Employee Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/departments/": {
            "get": {
                "tags": [
                    "Departments",
                    "Departments"
                ],
                "summary": "Get Departments",
                "description": "获取部门列表，支持分页、搜索和过滤。\n\n- **parent_id**: 父部门ID，用于获取特定部门的子部门\n- **is_active**: 是否激活，用于过滤激活或未激活的部门\n- **search**: 搜索关键字，可以匹配部门代码或名称\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_departments_v2_departments__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "parent_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Parent Id"
                        }
                    },
                    {
                        "name": "is_active",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "boolean"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Is Active"
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/DepartmentListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Departments",
                    "Departments"
                ],
                "summary": "Create Department",
                "description": "创建新部门。\n\n- 需要 P_DEPARTMENT_MANAGE 权限",
                "operationId": "create_department_v2_departments__post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/DepartmentCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Department"
                                    },
                                    "title": "Response Create Department V2 Departments  Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/departments/{department_id}": {
            "get": {
                "tags": [
                    "Departments",
                    "Departments"
                ],
                "summary": "Get Department",
                "description": "根据ID获取部门详情。\n\n- **department_id**: 部门ID",
                "operationId": "get_department_v2_departments__department_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "department_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Department Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Department"
                                    },
                                    "title": "Response Get Department V2 Departments  Department Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Departments",
                    "Departments"
                ],
                "summary": "Update Department",
                "description": "更新部门信息。\n\n- **department_id**: 部门ID\n- 需要 P_DEPARTMENT_MANAGE 权限",
                "operationId": "update_department_v2_departments__department_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "department_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Department Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/DepartmentUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Department"
                                    },
                                    "title": "Response Update Department V2 Departments  Department Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Departments",
                    "Departments"
                ],
                "summary": "Delete Department",
                "description": "删除部门。\n\n- **department_id**: 部门ID\n- 需要 P_DEPARTMENT_MANAGE 权限",
                "operationId": "delete_department_v2_departments__department_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "department_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Department Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/job-titles/": {
            "get": {
                "tags": [
                    "Job Titles",
                    "Job Titles"
                ],
                "summary": "Get Job Titles",
                "description": "获取职位列表，支持分页、搜索和过滤。\n\n- **parent_id**: 父职位ID，用于获取特定职位的子职位\n- **is_active**: 是否激活，用于过滤激活或未激活的职位\n- **search**: 搜索关键字，可以匹配职位代码、名称或描述\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_job_titles_v2_job_titles__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "parent_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Parent Id"
                        }
                    },
                    {
                        "name": "is_active",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "boolean"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Is Active"
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/JobTitleListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Job Titles",
                    "Job Titles"
                ],
                "summary": "Create Job Title",
                "description": "创建新职位。\n\n- 需要 P_JOB_TITLE_MANAGE 权限",
                "operationId": "create_job_title_v2_job_titles__post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/JobTitleCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/JobTitle"
                                    },
                                    "title": "Response Create Job Title V2 Job Titles  Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/job-titles/{job_title_id}": {
            "get": {
                "tags": [
                    "Job Titles",
                    "Job Titles"
                ],
                "summary": "Get Job Title",
                "description": "根据ID获取职位详情。\n\n- **job_title_id**: 职位ID",
                "operationId": "get_job_title_v2_job_titles__job_title_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "job_title_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Job Title Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/JobTitle"
                                    },
                                    "title": "Response Get Job Title V2 Job Titles  Job Title Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Job Titles",
                    "Job Titles"
                ],
                "summary": "Update Job Title",
                "description": "更新职位信息。\n\n- **job_title_id**: 职位ID\n- 需要 P_JOB_TITLE_MANAGE 权限",
                "operationId": "update_job_title_v2_job_titles__job_title_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "job_title_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Job Title Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/JobTitleUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/JobTitle"
                                    },
                                    "title": "Response Update Job Title V2 Job Titles  Job Title Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Job Titles",
                    "Job Titles"
                ],
                "summary": "Delete Job Title",
                "description": "删除职位。\n\n- **job_title_id**: 职位ID\n- 需要 P_JOB_TITLE_MANAGE 权限",
                "operationId": "delete_job_title_v2_job_titles__job_title_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "job_title_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Job Title Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/lookup/types": {
            "get": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Get Lookup Types",
                "description": "获取查找类型列表，支持分页和搜索。\n\n- **search**: 搜索关键字，可以匹配代码、名称或描述\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_lookup_types_v2_lookup_types_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/LookupTypeListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Create Lookup Type",
                "description": "创建新查找类型。\n\n- 需要Super Admin或Config Admin角色",
                "operationId": "create_lookup_type_v2_lookup_types_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/LookupTypeCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/LookupType"
                                    },
                                    "title": "Response Create Lookup Type V2 Lookup Types Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/lookup/types/{lookup_type_id}": {
            "get": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Get Lookup Type",
                "description": "根据ID获取查找类型详情。\n\n- **lookup_type_id**: 查找类型ID",
                "operationId": "get_lookup_type_v2_lookup_types__lookup_type_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "lookup_type_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Lookup Type Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/LookupType"
                                    },
                                    "title": "Response Get Lookup Type V2 Lookup Types  Lookup Type Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Update Lookup Type",
                "description": "更新查找类型信息。\n\n- **lookup_type_id**: 查找类型ID\n- 需要Super Admin或Config Admin角色",
                "operationId": "update_lookup_type_v2_lookup_types__lookup_type_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "lookup_type_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Lookup Type Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/LookupTypeUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/LookupType"
                                    },
                                    "title": "Response Update Lookup Type V2 Lookup Types  Lookup Type Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Delete Lookup Type",
                "description": "删除查找类型。\n\n- **lookup_type_id**: 查找类型ID\n- 需要Super Admin角色",
                "operationId": "delete_lookup_type_v2_lookup_types__lookup_type_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "lookup_type_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Lookup Type Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/lookup/values": {
            "get": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Get Lookup Values",
                "description": "获取查找值列表，支持分页、搜索和过滤。\n\n- **type_code**: 查找类型代码，用于过滤特定类型的查找值\n- **is_active**: 是否激活，用于过滤激活或未激活的查找值\n- **search**: 搜索关键字，可以匹配代码、名称或描述\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_lookup_values_v2_lookup_values_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "type_code",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "description": "Filter by lookup type code",
                            "title": "Type Code"
                        },
                        "description": "Filter by lookup type code"
                    },
                    {
                        "name": "is_active",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "boolean"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Is Active"
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/LookupValueListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Create Lookup Value",
                "description": "创建新查找值。\n\n- 需要Super Admin或Config Admin角色",
                "operationId": "create_lookup_value_v2_lookup_values_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/LookupValueCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/LookupValue"
                                    },
                                    "title": "Response Create Lookup Value V2 Lookup Values Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/lookup/values/{lookup_value_id}": {
            "get": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Get Lookup Value",
                "description": "根据ID获取查找值详情。\n\n- **lookup_value_id**: 查找值ID",
                "operationId": "get_lookup_value_v2_lookup_values__lookup_value_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "lookup_value_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Lookup Value Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/LookupValue"
                                    },
                                    "title": "Response Get Lookup Value V2 Lookup Values  Lookup Value Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Update Lookup Value",
                "description": "更新查找值信息。\n\n- **lookup_value_id**: 查找值ID\n- 需要Super Admin或Config Admin角色",
                "operationId": "update_lookup_value_v2_lookup_values__lookup_value_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "lookup_value_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Lookup Value Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/LookupValueUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/LookupValue"
                                    },
                                    "title": "Response Update Lookup Value V2 Lookup Values  Lookup Value Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Lookup",
                    "Lookup"
                ],
                "summary": "Delete Lookup Value",
                "description": "删除查找值。\n\n- **lookup_value_id**: 查找值ID\n- 需要Super Admin角色",
                "operationId": "delete_lookup_value_v2_lookup_values__lookup_value_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "lookup_value_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Lookup Value Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/config/parameters": {
            "get": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Get System Parameters",
                "description": "获取系统参数列表，支持分页和搜索。\n\n- **search**: 搜索关键字，可以匹配参数键、值或描述\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_system_parameters_v2_config_parameters_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/SystemParameterListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Create System Parameter",
                "description": "创建新系统参数。\n\n- 需要Super Admin或Config Admin角色",
                "operationId": "create_system_parameter_v2_config_parameters_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/SystemParameterCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/SystemParameter"
                                    },
                                    "title": "Response Create System Parameter V2 Config Parameters Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/config/parameters/{parameter_id}": {
            "get": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Get System Parameter",
                "description": "根据ID或键获取系统参数详情。\n\n- **parameter_id**: 系统参数ID或键",
                "operationId": "get_system_parameter_v2_config_parameters__parameter_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "parameter_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "title": "Parameter Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/SystemParameter"
                                    },
                                    "title": "Response Get System Parameter V2 Config Parameters  Parameter Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Update System Parameter",
                "description": "更新系统参数信息。\n\n- **parameter_id**: 系统参数ID或键\n- 需要Super Admin或Config Admin角色",
                "operationId": "update_system_parameter_v2_config_parameters__parameter_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "parameter_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "title": "Parameter Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/SystemParameterUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/SystemParameter"
                                    },
                                    "title": "Response Update System Parameter V2 Config Parameters  Parameter Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Delete System Parameter",
                "description": "删除系统参数。\n\n- **parameter_id**: 系统参数ID或键\n- 需要Super Admin角色",
                "operationId": "delete_system_parameter_v2_config_parameters__parameter_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "parameter_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "title": "Parameter Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/config/payroll-components": {
            "get": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Get Payroll Components",
                "description": "获取工资组件定义列表，支持分页、搜索和过滤。\n\n- **component_type**: 组件类型，可以是 'Earning' 或 'Deduction'\n- **is_active**: 是否激活，用于过滤激活或未激活的组件\n- **search**: 搜索关键字，可以匹配代码、名称或描述\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_payroll_components_v2_config_payroll_components_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "component_type",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Component Type"
                        }
                    },
                    {
                        "name": "is_active",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "boolean"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Is Active"
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PayrollComponentDefinitionListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Create Payroll Component",
                "description": "创建新工资组件定义。\n\n- 需要Super Admin或Config Admin角色",
                "operationId": "create_payroll_component_v2_config_payroll_components_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollComponentDefinitionCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollComponentDefinition"
                                    },
                                    "title": "Response Create Payroll Component V2 Config Payroll Components Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/config/payroll-components/{component_id}": {
            "get": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Get Payroll Component",
                "description": "根据ID获取工资组件定义详情。\n\n- **component_id**: 工资组件定义ID",
                "operationId": "get_payroll_component_v2_config_payroll_components__component_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "component_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Component Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollComponentDefinition"
                                    },
                                    "title": "Response Get Payroll Component V2 Config Payroll Components  Component Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Update Payroll Component",
                "description": "更新工资组件定义信息。\n\n- **component_id**: 工资组件定义ID\n- 需要Super Admin或Config Admin角色",
                "operationId": "update_payroll_component_v2_config_payroll_components__component_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "component_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Component Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollComponentDefinitionUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollComponentDefinition"
                                    },
                                    "title": "Response Update Payroll Component V2 Config Payroll Components  Component Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Delete Payroll Component",
                "description": "删除工资组件定义。\n\n- **component_id**: 工资组件定义ID\n- 需要Super Admin角色",
                "operationId": "delete_payroll_component_v2_config_payroll_components__component_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "component_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Component Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/config/tax-brackets": {
            "get": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Get Tax Brackets",
                "description": "获取税率档位列表，支持分页、搜索和过滤。\n\n- **region_code**: 地区代码，用于过滤特定地区的税率档位\n- **tax_type**: 税种类型，用于过滤特定税种的税率档位\n- **effective_date**: 生效日期，用于过滤在指定日期有效的税率档位\n- **search**: 搜索关键字\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_tax_brackets_v2_config_tax_brackets_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "region_code",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Region Code"
                        }
                    },
                    {
                        "name": "tax_type",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Tax Type"
                        }
                    },
                    {
                        "name": "effective_date",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string",
                                    "format": "date"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Effective Date"
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/TaxBracketListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Create Tax Bracket",
                "description": "创建新税率档位。\n\n- 需要Super Admin或Config Admin角色",
                "operationId": "create_tax_bracket_v2_config_tax_brackets_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/TaxBracketCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/TaxBracket"
                                    },
                                    "title": "Response Create Tax Bracket V2 Config Tax Brackets Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/config/tax-brackets/{bracket_id}": {
            "get": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Get Tax Bracket",
                "description": "根据ID获取税率档位详情。\n\n- **bracket_id**: 税率档位ID",
                "operationId": "get_tax_bracket_v2_config_tax_brackets__bracket_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "bracket_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Bracket Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/TaxBracket"
                                    },
                                    "title": "Response Get Tax Bracket V2 Config Tax Brackets  Bracket Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Update Tax Bracket",
                "description": "更新税率档位信息。\n\n- **bracket_id**: 税率档位ID\n- 需要Super Admin或Config Admin角色",
                "operationId": "update_tax_bracket_v2_config_tax_brackets__bracket_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "bracket_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Bracket Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/TaxBracketUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/TaxBracket"
                                    },
                                    "title": "Response Update Tax Bracket V2 Config Tax Brackets  Bracket Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Delete Tax Bracket",
                "description": "删除税率档位。\n\n- **bracket_id**: 税率档位ID\n- 需要Super Admin角色",
                "operationId": "delete_tax_bracket_v2_config_tax_brackets__bracket_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "bracket_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Bracket Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/config/social-security-rates": {
            "get": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Get Social Security Rates",
                "description": "获取社保费率列表，支持分页、搜索和过滤。\n\n- **region_code**: 地区代码，用于过滤特定地区的社保费率\n- **rate_type**: 费率类型，用于过滤特定费率类型的社保费率\n- **effective_date**: 生效日期，用于过滤在指定日期有效的社保费率\n- **search**: 搜索关键字\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_social_security_rates_v2_config_social_security_rates_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "region_code",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Region Code"
                        }
                    },
                    {
                        "name": "rate_type",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Rate Type"
                        }
                    },
                    {
                        "name": "effective_date",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string",
                                    "format": "date"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Effective Date"
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/SocialSecurityRateListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Create Social Security Rate",
                "description": "创建新社保费率。\n\n- 需要Super Admin或Config Admin角色",
                "operationId": "create_social_security_rate_v2_config_social_security_rates_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/SocialSecurityRateCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/SocialSecurityRate"
                                    },
                                    "title": "Response Create Social Security Rate V2 Config Social Security Rates Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/config/social-security-rates/{rate_id}": {
            "get": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Get Social Security Rate",
                "description": "根据ID获取社保费率详情。\n\n- **rate_id**: 社保费率ID",
                "operationId": "get_social_security_rate_v2_config_social_security_rates__rate_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "rate_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Rate Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/SocialSecurityRate"
                                    },
                                    "title": "Response Get Social Security Rate V2 Config Social Security Rates  Rate Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Update Social Security Rate",
                "description": "更新社保费率信息。\n\n- **rate_id**: 社保费率ID\n- 需要Super Admin或Config Admin角色",
                "operationId": "update_social_security_rate_v2_config_social_security_rates__rate_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "rate_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Rate Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/SocialSecurityRateUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/SocialSecurityRate"
                                    },
                                    "title": "Response Update Social Security Rate V2 Config Social Security Rates  Rate Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Configuration",
                    "Configuration"
                ],
                "summary": "Delete Social Security Rate",
                "description": "删除社保费率。\n\n- **rate_id**: 社保费率ID\n- 需要Super Admin角色",
                "operationId": "delete_social_security_rate_v2_config_social_security_rates__rate_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "rate_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Rate Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/payroll-periods": {
            "get": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Get Payroll Periods",
                "description": "获取工资周期列表，支持分页、搜索和过滤。\n\n- **frequency_id**: 频率ID，用于过滤特定频率的工资周期\n- **start_date**: 开始日期，用于过滤开始日期大于等于指定日期的工资周期\n- **end_date**: 结束日期，用于过滤结束日期小于等于指定日期的工资周期\n- **search**: 搜索关键字，可以匹配工资周期名称\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_payroll_periods_v2_payroll_periods_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "frequency_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Frequency Id"
                        }
                    },
                    {
                        "name": "start_date",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string",
                                    "format": "date"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Start Date"
                        }
                    },
                    {
                        "name": "end_date",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string",
                                    "format": "date"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "End Date"
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PayrollPeriodListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Create Payroll Period",
                "description": "创建新工资周期。\n\n- 需要Super Admin或Payroll Admin角色",
                "operationId": "create_payroll_period_v2_payroll_periods_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollPeriodCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollPeriod"
                                    },
                                    "title": "Response Create Payroll Period V2 Payroll Periods Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/payroll-periods/{period_id}": {
            "get": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Get Payroll Period",
                "description": "根据ID获取工资周期详情。\n\n- **period_id**: 工资周期ID",
                "operationId": "get_payroll_period_v2_payroll_periods__period_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "period_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Period Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollPeriod"
                                    },
                                    "title": "Response Get Payroll Period V2 Payroll Periods  Period Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Update Payroll Period",
                "description": "更新工资周期信息。\n\n- **period_id**: 工资周期ID\n- 需要Super Admin或Payroll Admin角色",
                "operationId": "update_payroll_period_v2_payroll_periods__period_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "period_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Period Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollPeriodUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollPeriod"
                                    },
                                    "title": "Response Update Payroll Period V2 Payroll Periods  Period Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Delete Payroll Period",
                "description": "删除工资周期。\n\n- **period_id**: 工资周期ID\n- 需要Super Admin角色",
                "operationId": "delete_payroll_period_v2_payroll_periods__period_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "period_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Period Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/payroll-runs": {
            "get": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Get Payroll Runs",
                "description": "获取工资运行批次列表，支持分页和过滤。\n\n- **period_id**: 工资周期ID，用于过滤特定工资周期的运行批次\n- **status_id**: 状态ID，用于过滤特定状态的运行批次\n- **initiated_by_user_id**: 发起用户ID，用于过滤特定用户发起的运行批次\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_payroll_runs_v2_payroll_runs_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "period_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Period Id"
                        }
                    },
                    {
                        "name": "status_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Status Id"
                        }
                    },
                    {
                        "name": "initiated_by_user_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Initiated By User Id"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PayrollRunListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Create Payroll Run",
                "description": "创建新工资运行批次。\n\n- 需要Super Admin或Payroll Admin角色",
                "operationId": "create_payroll_run_v2_payroll_runs_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollRunCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollRun"
                                    },
                                    "title": "Response Create Payroll Run V2 Payroll Runs Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/payroll-runs/{run_id}": {
            "get": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Get Payroll Run",
                "description": "根据ID获取工资运行批次详情。\n\n- **run_id**: 工资运行批次ID",
                "operationId": "get_payroll_run_v2_payroll_runs__run_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "run_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Run Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollRun"
                                    },
                                    "title": "Response Get Payroll Run V2 Payroll Runs  Run Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Update Payroll Run",
                "description": "更新工资运行批次信息。\n\n- **run_id**: 工资运行批次ID\n- 需要Super Admin或Payroll Admin角色",
                "operationId": "update_payroll_run_v2_payroll_runs__run_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "run_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Run Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollRunUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollRun"
                                    },
                                    "title": "Response Update Payroll Run V2 Payroll Runs  Run Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "patch": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Patch Payroll Run Endpoint",
                "description": "部分更新工资计算批次信息，例如标记为已发放。\n\n- **run_id**: 工资计算批次ID\n- 需要 Super Admin, Payroll Admin, 或 Finance Admin 角色",
                "operationId": "patch_payroll_run_endpoint_v2_payroll_runs__run_id__patch",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "run_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Run Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollRunPatch"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollRun"
                                    },
                                    "title": "Response Patch Payroll Run Endpoint V2 Payroll Runs  Run Id  Patch"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Delete Payroll Run",
                "description": "删除工资运行批次。\n\n- **run_id**: 工资运行批次ID\n- 需要Super Admin角色",
                "operationId": "delete_payroll_run_v2_payroll_runs__run_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "run_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Run Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/payroll-runs/{run_id}/bank-export": {
            "get": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Export Payroll Run Bank File",
                "description": "为指定的工资计算批次生成银行代发文件 (CSV格式)。\n\n- **run_id**: 工资计算批次ID\n- 需要 Super Admin, Payroll Admin, 或 Finance Admin 角色",
                "operationId": "export_payroll_run_bank_file_v2_payroll_runs__run_id__bank_export_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "run_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Run Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/payroll-entries": {
            "get": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Get Payroll Entries",
                "description": "获取工资明细列表，支持分页和过滤。\n\n- **period_id**: 工资周期ID，用于过滤特定工资周期的明细\n- **run_id**: 工资运行批次ID，用于过滤特定运行批次的明细\n- **employee_id**: 员工ID，用于过滤特定员工的明细\n- **status_id**: 状态ID，用于过滤特定状态的明细\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_payroll_entries_v2_payroll_entries_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "period_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Period Id"
                        }
                    },
                    {
                        "name": "run_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Run Id"
                        }
                    },
                    {
                        "name": "employee_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Employee Id"
                        }
                    },
                    {
                        "name": "status_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Status Id"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PayrollEntryListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Create Payroll Entry",
                "description": "创建新工资明细。\n\n- 需要Super Admin或Payroll Admin角色",
                "operationId": "create_payroll_entry_v2_payroll_entries_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollEntryCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollEntry"
                                    },
                                    "title": "Response Create Payroll Entry V2 Payroll Entries Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/payroll-entries/{entry_id}": {
            "get": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Get Payroll Entry",
                "description": "根据ID获取工资明细详情。\n\n- **entry_id**: 工资明细ID",
                "operationId": "get_payroll_entry_v2_payroll_entries__entry_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "entry_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Entry Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollEntry"
                                    },
                                    "title": "Response Get Payroll Entry V2 Payroll Entries  Entry Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "patch": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Patch Payroll Entry Details",
                "description": "部分更新工资条目详情（例如，调整金额、备注）。\n需要 P_PAYROLL_ENTRY_EDIT_DETAILS 权限。",
                "operationId": "patch_payroll_entry_details_v2_payroll_entries__entry_id__patch",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "entry_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Entry Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollEntryPatch"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollEntry"
                                    },
                                    "title": "Response Patch Payroll Entry Details V2 Payroll Entries  Entry Id  Patch"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Update Payroll Entry",
                "description": "更新工资明细信息。\n\n- **entry_id**: 工资明细ID\n- 需要Super Admin或Payroll Admin角色",
                "operationId": "update_payroll_entry_v2_payroll_entries__entry_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "entry_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Entry Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PayrollEntryUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/PayrollEntry"
                                    },
                                    "title": "Response Update Payroll Entry V2 Payroll Entries  Entry Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Payroll",
                    "Payroll"
                ],
                "summary": "Delete Payroll Entry",
                "description": "删除工资明细。\n\n- **entry_id**: 工资明细ID\n- 需要Super Admin角色",
                "operationId": "delete_payroll_entry_v2_payroll_entries__entry_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "entry_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Entry Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/users": {
            "get": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Get Users",
                "description": "获取用户列表，支持分页、搜索和过滤。\n\n- **is_active**: 是否激活，用于过滤激活或未激活的用户\n- **role_id**: 角色ID，用于过滤特定角色的用户\n- **search**: 搜索关键字，可以匹配用户名\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100\n- 需要SUPER_ADMIN角色",
                "operationId": "get_users_v2_users_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "is_active",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "boolean"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Is Active"
                        }
                    },
                    {
                        "name": "role_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "integer"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Role Id"
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/UserListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Create User",
                "description": "创建新用户。\n\n- 需要SUPER_ADMIN角色",
                "operationId": "create_user_v2_users_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/UserCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/User"
                                    },
                                    "title": "Response Create User V2 Users Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/users/{user_id}": {
            "get": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Get User",
                "description": "根据ID获取用户详情。\n\n- **user_id**: 用户ID\n- 需要SUPER_ADMIN角色",
                "operationId": "get_user_v2_users__user_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "user_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "User Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/User"
                                    },
                                    "title": "Response Get User V2 Users  User Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Update User",
                "description": "更新用户信息。\n\n- **user_id**: 用户ID\n- 需要SUPER_ADMIN角色",
                "operationId": "update_user_v2_users__user_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "user_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "User Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/UserUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/User"
                                    },
                                    "title": "Response Update User V2 Users  User Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Delete User",
                "description": "删除用户。\n\n- **user_id**: 用户ID\n- 需要SUPER_ADMIN角色",
                "operationId": "delete_user_v2_users__user_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "user_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "User Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/users/{user_id}/roles": {
            "post": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Assign Roles To User Endpoint",
                "description": "为指定用户分配角色列表，替换其现有所有角色。\n\n- **user_id**: 用户ID\n- 请求体包含 `role_ids: List[int]`\n- 需要SUPER_ADMIN角色",
                "operationId": "assign_roles_to_user_endpoint_v2_users__user_id__roles_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "user_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "User Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/UserRoleAssignRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/User"
                                    },
                                    "title": "Response Assign Roles To User Endpoint V2 Users  User Id  Roles Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Get User Roles",
                "description": "获取指定用户拥有的所有角色。\n\n- **user_id**: 用户ID\n- 需要SUPER_ADMIN角色 (可根据需求调整)",
                "operationId": "get_user_roles_v2_users__user_id__roles_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "user_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "User Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "$ref": "#/components/schemas/Role"
                                    },
                                    "title": "Response Get User Roles V2 Users  User Id  Roles Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/roles": {
            "get": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Get Roles",
                "description": "获取角色列表，支持分页和搜索。\n\n- **search**: 搜索关键字，可以匹配角色代码或名称\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_roles_v2_roles_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/RoleListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Create Role",
                "description": "创建新角色。\n\n- 需要SUPER_ADMIN角色",
                "operationId": "create_role_v2_roles_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/RoleCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Role"
                                    },
                                    "title": "Response Create Role V2 Roles Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/roles/{role_id}": {
            "get": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Get Role",
                "description": "根据ID获取角色详情。\n\n- **role_id**: 角色ID",
                "operationId": "get_role_v2_roles__role_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "role_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Role Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Role"
                                    },
                                    "title": "Response Get Role V2 Roles  Role Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Update Role",
                "description": "更新角色信息。\n\n- **role_id**: 角色ID\n- 需要SUPER_ADMIN角色",
                "operationId": "update_role_v2_roles__role_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "role_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Role Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/RoleUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Role"
                                    },
                                    "title": "Response Update Role V2 Roles  Role Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Delete Role",
                "description": "删除角色。\n\n- **role_id**: 角色ID\n- 需要SUPER_ADMIN角色",
                "operationId": "delete_role_v2_roles__role_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "role_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Role Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/roles/{role_id}/permissions": {
            "post": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Assign Permission To Role",
                "description": "为角色分配权限。\n\n- **role_id**: 角色ID\n- **permission_id**: 权限ID\n- 需要SUPER_ADMIN角色",
                "operationId": "assign_permission_to_role_v2_roles__role_id__permissions_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "role_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Role Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/Body_assign_permission_to_role_v2_roles__role_id__permissions_post"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {}
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Get Role Permissions",
                "description": "获取指定角色所拥有的所有权限。\n\n- **role_id**: 角色ID\n- 任何登录用户均可访问 (可根据需要调整权限)",
                "operationId": "get_role_permissions_v2_roles__role_id__permissions_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "role_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Role Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "$ref": "#/components/schemas/Permission"
                                    },
                                    "title": "Response Get Role Permissions V2 Roles  Role Id  Permissions Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/roles/{role_id}/permissions/{permission_id}": {
            "delete": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Remove Permission From Role",
                "description": "从角色中移除权限。\n\n- **role_id**: 角色ID\n- **permission_id**: 权限ID\n- 需要SUPER_ADMIN角色",
                "operationId": "remove_permission_from_role_v2_roles__role_id__permissions__permission_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "role_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Role Id"
                        }
                    },
                    {
                        "name": "permission_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Permission Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/permissions": {
            "get": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Get Permissions",
                "description": "获取权限列表，支持分页和搜索。\n\n- **search**: 搜索关键字，可以匹配权限代码或描述\n- **page**: 页码，从1开始\n- **size**: 每页记录数，最大100",
                "operationId": "get_permissions_v2_permissions_get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "null"
                                }
                            ],
                            "title": "Search"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Page number",
                            "default": 1,
                            "title": "Page"
                        },
                        "description": "Page number"
                    },
                    {
                        "name": "size",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "maximum": 100,
                            "minimum": 1,
                            "description": "Page size",
                            "default": 10,
                            "title": "Size"
                        },
                        "description": "Page size"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PermissionListResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Create Permission",
                "description": "创建新权限。\n\n- 需要SUPER_ADMIN角色",
                "operationId": "create_permission_v2_permissions_post",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PermissionCreate"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Permission"
                                    },
                                    "title": "Response Create Permission V2 Permissions Post"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/v2/permissions/{permission_id}": {
            "get": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Get Permission",
                "description": "根据ID获取权限详情。\n\n- **permission_id**: 权限ID",
                "operationId": "get_permission_v2_permissions__permission_id__get",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "permission_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Permission Id"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Permission"
                                    },
                                    "title": "Response Get Permission V2 Permissions  Permission Id  Get"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Update Permission",
                "description": "更新权限信息。\n\n- **permission_id**: 权限ID\n- 需要SUPER_ADMIN角色",
                "operationId": "update_permission_v2_permissions__permission_id__put",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "permission_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Permission Id"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PermissionUpdate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "$ref": "#/components/schemas/Permission"
                                    },
                                    "title": "Response Update Permission V2 Permissions  Permission Id  Put"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "tags": [
                    "Security",
                    "Security"
                ],
                "summary": "Delete Permission",
                "description": "删除权限。\n\n- **permission_id**: 权限ID\n- 需要SUPER_ADMIN角色",
                "operationId": "delete_permission_v2_permissions__permission_id__delete",
                "security": [
                    {
                        "HTTPBearer": []
                    }
                ],
                "parameters": [
                    {
                        "name": "permission_id",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "title": "Permission Id"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Successful Response"
                    },
                    "422": {
                        "description": "Validation Error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/HTTPValidationError"
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "Body_assign_permission_to_role_v2_roles__role_id__permissions_post": {
                "properties": {
                    "permission_id": {
                        "type": "integer",
                        "title": "Permission Id"
                    }
                },
                "type": "object",
                "required": [
                    "permission_id"
                ],
                "title": "Body_assign_permission_to_role_v2_roles__role_id__permissions_post"
            },
            "Body_login_for_access_token_v2_auth_token_post": {
                "properties": {
                    "grant_type": {
                        "anyOf": [
                            {
                                "type": "string",
                                "pattern": "^password$"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Grant Type"
                    },
                    "username": {
                        "type": "string",
                        "title": "Username"
                    },
                    "password": {
                        "type": "string",
                        "title": "Password"
                    },
                    "scope": {
                        "type": "string",
                        "title": "Scope",
                        "default": ""
                    },
                    "client_id": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Client Id"
                    },
                    "client_secret": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Client Secret"
                    }
                },
                "type": "object",
                "required": [
                    "username",
                    "password"
                ],
                "title": "Body_login_for_access_token_v2_auth_token_post"
            },
            "Department": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique department code"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Department name"
                    },
                    "parent_department_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Parent Department Id",
                        "description": "Foreign key to parent department"
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Department definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Department definition end date"
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether the department is currently active",
                        "default": true
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "name",
                    "effective_date",
                    "id"
                ],
                "title": "Department",
                "description": "部门响应模型"
            },
            "DepartmentCreate": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique department code"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Department name"
                    },
                    "parent_department_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Parent Department Id",
                        "description": "Foreign key to parent department"
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Department definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Department definition end date"
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether the department is currently active",
                        "default": true
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "name",
                    "effective_date"
                ],
                "title": "DepartmentCreate",
                "description": "创建部门模型"
            },
            "DepartmentListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/Department"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "DepartmentListResponse",
                "description": "部门列表响应模型"
            },
            "DepartmentUpdate": {
                "properties": {
                    "code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Code",
                        "description": "Unique department code"
                    },
                    "name": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Name",
                        "description": "Department name"
                    },
                    "parent_department_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Parent Department Id",
                        "description": "Foreign key to parent department"
                    },
                    "effective_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Effective Date",
                        "description": "Department definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Department definition end date"
                    },
                    "is_active": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Active",
                        "description": "Whether the department is currently active"
                    }
                },
                "type": "object",
                "title": "DepartmentUpdate",
                "description": "更新部门模型"
            },
            "Employee": {
                "properties": {
                    "employee_code": {
                        "type": "string",
                        "title": "Employee Code",
                        "description": "Unique employee ID/Code"
                    },
                    "first_name": {
                        "type": "string",
                        "title": "First Name",
                        "description": "Employee's first name"
                    },
                    "last_name": {
                        "type": "string",
                        "title": "Last Name",
                        "description": "Employee's last name"
                    },
                    "date_of_birth": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Date Of Birth",
                        "description": "Employee's date of birth"
                    },
                    "gender_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Gender Lookup Value Id",
                        "description": "Foreign key to gender lookup value"
                    },
                    "id_number": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Id Number",
                        "description": "National ID or passport number"
                    },
                    "nationality": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Nationality",
                        "description": "Employee's nationality"
                    },
                    "hire_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Hire Date",
                        "description": "Employee's hire date"
                    },
                    "status_lookup_value_id": {
                        "type": "integer",
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to employee status lookup value"
                    },
                    "employment_type_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employment Type Lookup Value Id",
                        "description": "Foreign key to employment type lookup value"
                    },
                    "education_level_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Education Level Lookup Value Id",
                        "description": "Foreign key to education level lookup value"
                    },
                    "marital_status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Marital Status Lookup Value Id",
                        "description": "Foreign key to marital status lookup value"
                    },
                    "political_status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Political Status Lookup Value Id",
                        "description": "Foreign key to political status lookup value"
                    },
                    "contract_type_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Contract Type Lookup Value Id",
                        "description": "Foreign key to contract type lookup value"
                    },
                    "email": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "email"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Email",
                        "description": "Employee's email address"
                    },
                    "phone_number": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Phone Number",
                        "description": "Employee's phone number"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    },
                    "created_at": {
                        "type": "string",
                        "format": "date-time",
                        "title": "Created At",
                        "description": "Record creation timestamp"
                    },
                    "updated_at": {
                        "type": "string",
                        "format": "date-time",
                        "title": "Updated At",
                        "description": "Record last update timestamp"
                    }
                },
                "type": "object",
                "required": [
                    "employee_code",
                    "first_name",
                    "last_name",
                    "hire_date",
                    "status_lookup_value_id",
                    "id",
                    "created_at",
                    "updated_at"
                ],
                "title": "Employee",
                "description": "员工响应模型"
            },
            "EmployeeCreate": {
                "properties": {
                    "employee_code": {
                        "type": "string",
                        "title": "Employee Code",
                        "description": "Unique employee ID/Code"
                    },
                    "first_name": {
                        "type": "string",
                        "title": "First Name",
                        "description": "Employee's first name"
                    },
                    "last_name": {
                        "type": "string",
                        "title": "Last Name",
                        "description": "Employee's last name"
                    },
                    "date_of_birth": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Date Of Birth",
                        "description": "Employee's date of birth"
                    },
                    "gender_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Gender Lookup Value Id",
                        "description": "Foreign key to gender lookup value"
                    },
                    "id_number": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Id Number",
                        "description": "National ID or passport number"
                    },
                    "nationality": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Nationality",
                        "description": "Employee's nationality"
                    },
                    "hire_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Hire Date",
                        "description": "Employee's hire date"
                    },
                    "status_lookup_value_id": {
                        "type": "integer",
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to employee status lookup value"
                    },
                    "employment_type_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employment Type Lookup Value Id",
                        "description": "Foreign key to employment type lookup value"
                    },
                    "education_level_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Education Level Lookup Value Id",
                        "description": "Foreign key to education level lookup value"
                    },
                    "marital_status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Marital Status Lookup Value Id",
                        "description": "Foreign key to marital status lookup value"
                    },
                    "political_status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Political Status Lookup Value Id",
                        "description": "Foreign key to political status lookup value"
                    },
                    "contract_type_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Contract Type Lookup Value Id",
                        "description": "Foreign key to contract type lookup value"
                    },
                    "email": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "email"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Email",
                        "description": "Employee's email address"
                    },
                    "phone_number": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Phone Number",
                        "description": "Employee's phone number"
                    }
                },
                "type": "object",
                "required": [
                    "employee_code",
                    "first_name",
                    "last_name",
                    "hire_date",
                    "status_lookup_value_id"
                ],
                "title": "EmployeeCreate",
                "description": "创建员工模型"
            },
            "EmployeeListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/EmployeeWithNames"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "EmployeeListResponse",
                "description": "员工列表响应模型"
            },
            "EmployeeUpdate": {
                "properties": {
                    "employee_code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employee Code",
                        "description": "Unique employee ID/Code"
                    },
                    "first_name": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "First Name",
                        "description": "Employee's first name"
                    },
                    "last_name": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Last Name",
                        "description": "Employee's last name"
                    },
                    "date_of_birth": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Date Of Birth",
                        "description": "Employee's date of birth"
                    },
                    "gender_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Gender Lookup Value Id",
                        "description": "Foreign key to gender lookup value"
                    },
                    "id_number": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Id Number",
                        "description": "National ID or passport number"
                    },
                    "nationality": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Nationality",
                        "description": "Employee's nationality"
                    },
                    "hire_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Hire Date",
                        "description": "Employee's hire date"
                    },
                    "status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to employee status lookup value"
                    },
                    "employment_type_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employment Type Lookup Value Id",
                        "description": "Foreign key to employment type lookup value"
                    },
                    "education_level_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Education Level Lookup Value Id",
                        "description": "Foreign key to education level lookup value"
                    },
                    "marital_status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Marital Status Lookup Value Id",
                        "description": "Foreign key to marital status lookup value"
                    },
                    "political_status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Political Status Lookup Value Id",
                        "description": "Foreign key to political status lookup value"
                    },
                    "contract_type_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Contract Type Lookup Value Id",
                        "description": "Foreign key to contract type lookup value"
                    },
                    "email": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "email"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Email",
                        "description": "Employee's email address"
                    },
                    "phone_number": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Phone Number",
                        "description": "Employee's phone number"
                    }
                },
                "type": "object",
                "title": "EmployeeUpdate",
                "description": "更新员工模型"
            },
            "EmployeeWithNames": {
                "properties": {
                    "employee_code": {
                        "type": "string",
                        "title": "Employee Code",
                        "description": "Unique employee ID/Code"
                    },
                    "first_name": {
                        "type": "string",
                        "title": "First Name",
                        "description": "Employee's first name"
                    },
                    "last_name": {
                        "type": "string",
                        "title": "Last Name",
                        "description": "Employee's last name"
                    },
                    "date_of_birth": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Date Of Birth",
                        "description": "Employee's date of birth"
                    },
                    "gender_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Gender Lookup Value Id",
                        "description": "Foreign key to gender lookup value"
                    },
                    "id_number": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Id Number",
                        "description": "National ID or passport number"
                    },
                    "nationality": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Nationality",
                        "description": "Employee's nationality"
                    },
                    "hire_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Hire Date",
                        "description": "Employee's hire date"
                    },
                    "status_lookup_value_id": {
                        "type": "integer",
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to employee status lookup value"
                    },
                    "employment_type_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employment Type Lookup Value Id",
                        "description": "Foreign key to employment type lookup value"
                    },
                    "education_level_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Education Level Lookup Value Id",
                        "description": "Foreign key to education level lookup value"
                    },
                    "marital_status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Marital Status Lookup Value Id",
                        "description": "Foreign key to marital status lookup value"
                    },
                    "political_status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Political Status Lookup Value Id",
                        "description": "Foreign key to political status lookup value"
                    },
                    "contract_type_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Contract Type Lookup Value Id",
                        "description": "Foreign key to contract type lookup value"
                    },
                    "email": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "email"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Email",
                        "description": "Employee's email address"
                    },
                    "phone_number": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Phone Number",
                        "description": "Employee's phone number"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    },
                    "created_at": {
                        "type": "string",
                        "format": "date-time",
                        "title": "Created At",
                        "description": "Record creation timestamp"
                    },
                    "updated_at": {
                        "type": "string",
                        "format": "date-time",
                        "title": "Updated At",
                        "description": "Record last update timestamp"
                    },
                    "departmentName": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Departmentname",
                        "description": "Current department name"
                    },
                    "positionName": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Positionname",
                        "description": "Current job title name"
                    }
                },
                "type": "object",
                "required": [
                    "employee_code",
                    "first_name",
                    "last_name",
                    "hire_date",
                    "status_lookup_value_id",
                    "id",
                    "created_at",
                    "updated_at"
                ],
                "title": "EmployeeWithNames",
                "description": "员工响应模型，包含部门和职位名称"
            },
            "HTTPValidationError": {
                "properties": {
                    "detail": {
                        "items": {
                            "$ref": "#/components/schemas/ValidationError"
                        },
                        "type": "array",
                        "title": "Detail"
                    }
                },
                "type": "object",
                "title": "HTTPValidationError"
            },
            "JobTitle": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique job title code"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Job title name"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the job title"
                    },
                    "parent_job_title_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Parent Job Title Id",
                        "description": "Foreign key to parent job title"
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Job title definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Job title definition end date"
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether the job title is currently in use",
                        "default": true
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "name",
                    "effective_date",
                    "id"
                ],
                "title": "JobTitle",
                "description": "职位响应模型"
            },
            "JobTitleCreate": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique job title code"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Job title name"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the job title"
                    },
                    "parent_job_title_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Parent Job Title Id",
                        "description": "Foreign key to parent job title"
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Job title definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Job title definition end date"
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether the job title is currently in use",
                        "default": true
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "name",
                    "effective_date"
                ],
                "title": "JobTitleCreate",
                "description": "创建职位模型"
            },
            "JobTitleListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/JobTitle"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "JobTitleListResponse",
                "description": "职位列表响应模型"
            },
            "JobTitleUpdate": {
                "properties": {
                    "code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Code",
                        "description": "Unique job title code"
                    },
                    "name": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Name",
                        "description": "Job title name"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the job title"
                    },
                    "parent_job_title_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Parent Job Title Id",
                        "description": "Foreign key to parent job title"
                    },
                    "effective_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Effective Date",
                        "description": "Job title definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Job title definition end date"
                    },
                    "is_active": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Active",
                        "description": "Whether the job title is currently in use"
                    }
                },
                "type": "object",
                "title": "JobTitleUpdate",
                "description": "更新职位模型"
            },
            "LookupType": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique code for the lookup type"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Human-readable name for the lookup type"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the lookup type"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "name",
                    "id"
                ],
                "title": "LookupType",
                "description": "查找类型响应模型"
            },
            "LookupTypeCreate": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique code for the lookup type"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Human-readable name for the lookup type"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the lookup type"
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "name"
                ],
                "title": "LookupTypeCreate",
                "description": "创建查找类型模型"
            },
            "LookupTypeListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/LookupType"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "LookupTypeListResponse",
                "description": "查找类型列表响应模型"
            },
            "LookupTypeUpdate": {
                "properties": {
                    "code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Code",
                        "description": "Unique code for the lookup type"
                    },
                    "name": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Name",
                        "description": "Human-readable name for the lookup type"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the lookup type"
                    }
                },
                "type": "object",
                "title": "LookupTypeUpdate",
                "description": "更新查找类型模型"
            },
            "LookupValue": {
                "properties": {
                    "lookup_type_id": {
                        "type": "integer",
                        "title": "Lookup Type Id",
                        "description": "Foreign key to lookup_types"
                    },
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique code for the lookup value within its type"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Human-readable name for the lookup value"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the lookup value"
                    },
                    "sort_order": {
                        "type": "integer",
                        "title": "Sort Order",
                        "description": "Order for displaying values",
                        "default": 0
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether the lookup value is active",
                        "default": true
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    },
                    "lookup_type": {
                        "anyOf": [
                            {
                                "$ref": "#/components/schemas/LookupType"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "description": "Lookup type"
                    }
                },
                "type": "object",
                "required": [
                    "lookup_type_id",
                    "code",
                    "name",
                    "id"
                ],
                "title": "LookupValue",
                "description": "查找值响应模型"
            },
            "LookupValueCreate": {
                "properties": {
                    "lookup_type_id": {
                        "type": "integer",
                        "title": "Lookup Type Id",
                        "description": "Foreign key to lookup_types"
                    },
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique code for the lookup value within its type"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Human-readable name for the lookup value"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the lookup value"
                    },
                    "sort_order": {
                        "type": "integer",
                        "title": "Sort Order",
                        "description": "Order for displaying values",
                        "default": 0
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether the lookup value is active",
                        "default": true
                    }
                },
                "type": "object",
                "required": [
                    "lookup_type_id",
                    "code",
                    "name"
                ],
                "title": "LookupValueCreate",
                "description": "创建查找值模型"
            },
            "LookupValueListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/LookupValue"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "LookupValueListResponse",
                "description": "查找值列表响应模型"
            },
            "LookupValueUpdate": {
                "properties": {
                    "lookup_type_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Lookup Type Id",
                        "description": "Foreign key to lookup_types"
                    },
                    "code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Code",
                        "description": "Unique code for the lookup value within its type"
                    },
                    "name": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Name",
                        "description": "Human-readable name for the lookup value"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the lookup value"
                    },
                    "sort_order": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Sort Order",
                        "description": "Order for displaying values"
                    },
                    "is_active": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Active",
                        "description": "Whether the lookup value is active"
                    }
                },
                "type": "object",
                "title": "LookupValueUpdate",
                "description": "更新查找值模型"
            },
            "PayrollComponentDefinition": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique code for the component"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Name of the component (e.g., Basic Salary, Income Tax)"
                    },
                    "type": {
                        "type": "string",
                        "title": "Type",
                        "description": "Component type (Earning or Deduction)"
                    },
                    "calculation_method": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Method",
                        "description": "Method used for calculation (e.g., FixedAmount, Percentage, Formula)"
                    },
                    "calculation_parameters": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Parameters",
                        "description": "Parameters for the calculation method"
                    },
                    "is_taxable": {
                        "type": "boolean",
                        "title": "Is Taxable",
                        "description": "Whether this component is subject to income tax",
                        "default": true
                    },
                    "is_social_security_base": {
                        "type": "boolean",
                        "title": "Is Social Security Base",
                        "description": "Whether this component contributes to social security base",
                        "default": false
                    },
                    "is_housing_fund_base": {
                        "type": "boolean",
                        "title": "Is Housing Fund Base",
                        "description": "Whether this component contributes to housing fund base",
                        "default": false
                    },
                    "display_order": {
                        "type": "integer",
                        "title": "Display Order",
                        "description": "Order for displaying on payslip",
                        "default": 0
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether this component is active",
                        "default": true
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Definition end date"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "name",
                    "type",
                    "effective_date",
                    "id"
                ],
                "title": "PayrollComponentDefinition",
                "description": "工资组件定义响应模型"
            },
            "PayrollComponentDefinitionCreate": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique code for the component"
                    },
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Name of the component (e.g., Basic Salary, Income Tax)"
                    },
                    "type": {
                        "type": "string",
                        "title": "Type",
                        "description": "Component type (Earning or Deduction)"
                    },
                    "calculation_method": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Method",
                        "description": "Method used for calculation (e.g., FixedAmount, Percentage, Formula)"
                    },
                    "calculation_parameters": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Parameters",
                        "description": "Parameters for the calculation method"
                    },
                    "is_taxable": {
                        "type": "boolean",
                        "title": "Is Taxable",
                        "description": "Whether this component is subject to income tax",
                        "default": true
                    },
                    "is_social_security_base": {
                        "type": "boolean",
                        "title": "Is Social Security Base",
                        "description": "Whether this component contributes to social security base",
                        "default": false
                    },
                    "is_housing_fund_base": {
                        "type": "boolean",
                        "title": "Is Housing Fund Base",
                        "description": "Whether this component contributes to housing fund base",
                        "default": false
                    },
                    "display_order": {
                        "type": "integer",
                        "title": "Display Order",
                        "description": "Order for displaying on payslip",
                        "default": 0
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether this component is active",
                        "default": true
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Definition end date"
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "name",
                    "type",
                    "effective_date"
                ],
                "title": "PayrollComponentDefinitionCreate",
                "description": "创建工资组件定义模型"
            },
            "PayrollComponentDefinitionListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/PayrollComponentDefinition"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "PayrollComponentDefinitionListResponse",
                "description": "工资组件定义列表响应模型"
            },
            "PayrollComponentDefinitionUpdate": {
                "properties": {
                    "code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Code",
                        "description": "Unique code for the component"
                    },
                    "name": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Name",
                        "description": "Name of the component (e.g., Basic Salary, Income Tax)"
                    },
                    "type": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Type",
                        "description": "Component type (Earning or Deduction)"
                    },
                    "calculation_method": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Method",
                        "description": "Method used for calculation (e.g., FixedAmount, Percentage, Formula)"
                    },
                    "calculation_parameters": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Parameters",
                        "description": "Parameters for the calculation method"
                    },
                    "is_taxable": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Taxable",
                        "description": "Whether this component is subject to income tax"
                    },
                    "is_social_security_base": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Social Security Base",
                        "description": "Whether this component contributes to social security base"
                    },
                    "is_housing_fund_base": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Housing Fund Base",
                        "description": "Whether this component contributes to housing fund base"
                    },
                    "display_order": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Display Order",
                        "description": "Order for displaying on payslip"
                    },
                    "is_active": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Active",
                        "description": "Whether this component is active"
                    },
                    "effective_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Effective Date",
                        "description": "Definition effective date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Definition end date"
                    }
                },
                "type": "object",
                "title": "PayrollComponentDefinitionUpdate",
                "description": "更新工资组件定义模型"
            },
            "PayrollEntry": {
                "properties": {
                    "employee_id": {
                        "type": "integer",
                        "title": "Employee Id",
                        "description": "Foreign key to employees"
                    },
                    "payroll_period_id": {
                        "type": "integer",
                        "title": "Payroll Period Id",
                        "description": "Foreign key to the payroll period"
                    },
                    "payroll_run_id": {
                        "type": "integer",
                        "title": "Payroll Run Id",
                        "description": "Foreign key to the specific payroll run this result belongs to"
                    },
                    "gross_pay": {
                        "type": "string",
                        "title": "Gross Pay",
                        "description": "Total gross pay (應發合計)",
                        "default": 0
                    },
                    "total_deductions": {
                        "type": "string",
                        "title": "Total Deductions",
                        "description": "Total deductions (應扣合計)",
                        "default": 0
                    },
                    "net_pay": {
                        "type": "string",
                        "title": "Net Pay",
                        "description": "Total net pay (實發合計)",
                        "default": 0
                    },
                    "earnings_details": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Earnings Details",
                        "description": "JSONB object storing individual earning items",
                        "default": {}
                    },
                    "deductions_details": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Deductions Details",
                        "description": "JSONB object storing individual deduction items",
                        "default": {}
                    },
                    "calculation_inputs": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Inputs",
                        "description": "Optional JSONB for storing calculation input values"
                    },
                    "calculation_log": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Log",
                        "description": "Optional JSONB for storing calculation log/details"
                    },
                    "status_lookup_value_id": {
                        "type": "integer",
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to payroll entry status"
                    },
                    "remarks": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Remarks",
                        "description": "Remarks for this payroll entry"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    },
                    "calculated_at": {
                        "type": "string",
                        "format": "date-time",
                        "title": "Calculated At",
                        "description": "Timestamp when this entry was calculated"
                    }
                },
                "type": "object",
                "required": [
                    "employee_id",
                    "payroll_period_id",
                    "payroll_run_id",
                    "status_lookup_value_id",
                    "id",
                    "calculated_at"
                ],
                "title": "PayrollEntry",
                "description": "工资明细响应模型"
            },
            "PayrollEntryCreate": {
                "properties": {
                    "employee_id": {
                        "type": "integer",
                        "title": "Employee Id",
                        "description": "Foreign key to employees"
                    },
                    "payroll_period_id": {
                        "type": "integer",
                        "title": "Payroll Period Id",
                        "description": "Foreign key to the payroll period"
                    },
                    "payroll_run_id": {
                        "type": "integer",
                        "title": "Payroll Run Id",
                        "description": "Foreign key to the specific payroll run this result belongs to"
                    },
                    "gross_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            }
                        ],
                        "title": "Gross Pay",
                        "description": "Total gross pay (應發合計)",
                        "default": 0
                    },
                    "total_deductions": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            }
                        ],
                        "title": "Total Deductions",
                        "description": "Total deductions (應扣合計)",
                        "default": 0
                    },
                    "net_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            }
                        ],
                        "title": "Net Pay",
                        "description": "Total net pay (實發合計)",
                        "default": 0
                    },
                    "earnings_details": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Earnings Details",
                        "description": "JSONB object storing individual earning items",
                        "default": {}
                    },
                    "deductions_details": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Deductions Details",
                        "description": "JSONB object storing individual deduction items",
                        "default": {}
                    },
                    "calculation_inputs": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Inputs",
                        "description": "Optional JSONB for storing calculation input values"
                    },
                    "calculation_log": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Log",
                        "description": "Optional JSONB for storing calculation log/details"
                    },
                    "status_lookup_value_id": {
                        "type": "integer",
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to payroll entry status"
                    },
                    "remarks": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Remarks",
                        "description": "Remarks for this payroll entry"
                    }
                },
                "type": "object",
                "required": [
                    "employee_id",
                    "payroll_period_id",
                    "payroll_run_id",
                    "status_lookup_value_id"
                ],
                "title": "PayrollEntryCreate",
                "description": "创建工资明细模型"
            },
            "PayrollEntryListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/PayrollEntry"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "PayrollEntryListResponse",
                "description": "工资明细列表响应模型"
            },
            "PayrollEntryPatch": {
                "properties": {
                    "employee_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employee Id",
                        "description": "Foreign key to employees"
                    },
                    "payroll_period_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Payroll Period Id",
                        "description": "Foreign key to the payroll period"
                    },
                    "payroll_run_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Payroll Run Id",
                        "description": "Foreign key to the specific payroll run this result belongs to"
                    },
                    "gross_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Gross Pay",
                        "description": "Total gross pay (應發合計)"
                    },
                    "total_deductions": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Deductions",
                        "description": "Total deductions (應扣合計)"
                    },
                    "net_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Net Pay",
                        "description": "Total net pay (實發合計)"
                    },
                    "earnings_details": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Earnings Details",
                        "description": "JSONB object storing individual earning items"
                    },
                    "deductions_details": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Deductions Details",
                        "description": "JSONB object storing individual deduction items"
                    },
                    "calculation_inputs": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Inputs",
                        "description": "Optional JSONB for storing calculation input values"
                    },
                    "calculation_log": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Log",
                        "description": "Optional JSONB for storing calculation log/details"
                    },
                    "status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to payroll entry status"
                    },
                    "remarks": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Remarks",
                        "description": "Remarks for this payroll entry"
                    }
                },
                "type": "object",
                "title": "PayrollEntryPatch",
                "description": "部分更新工资明细模型 (for PATCH operations)"
            },
            "PayrollEntryUpdate": {
                "properties": {
                    "employee_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employee Id",
                        "description": "Foreign key to employees"
                    },
                    "payroll_period_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Payroll Period Id",
                        "description": "Foreign key to the payroll period"
                    },
                    "payroll_run_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Payroll Run Id",
                        "description": "Foreign key to the specific payroll run this result belongs to"
                    },
                    "gross_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Gross Pay",
                        "description": "Total gross pay (應發合計)"
                    },
                    "total_deductions": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Deductions",
                        "description": "Total deductions (應扣合計)"
                    },
                    "net_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Net Pay",
                        "description": "Total net pay (實發合計)"
                    },
                    "earnings_details": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Earnings Details",
                        "description": "JSONB object storing individual earning items"
                    },
                    "deductions_details": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Deductions Details",
                        "description": "JSONB object storing individual deduction items"
                    },
                    "calculation_inputs": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Inputs",
                        "description": "Optional JSONB for storing calculation input values"
                    },
                    "calculation_log": {
                        "anyOf": [
                            {
                                "additionalProperties": true,
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Calculation Log",
                        "description": "Optional JSONB for storing calculation log/details"
                    },
                    "status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to payroll entry status"
                    },
                    "remarks": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Remarks",
                        "description": "Remarks for this payroll entry"
                    }
                },
                "type": "object",
                "title": "PayrollEntryUpdate",
                "description": "更新工资明细模型"
            },
            "PayrollPeriod": {
                "properties": {
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Payroll period name (e.g., 2024-01 Monthly)"
                    },
                    "start_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Start Date",
                        "description": "Period start date"
                    },
                    "end_date": {
                        "type": "string",
                        "format": "date",
                        "title": "End Date",
                        "description": "Period end date"
                    },
                    "pay_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Pay Date",
                        "description": "Date when payment is scheduled/made"
                    },
                    "frequency_lookup_value_id": {
                        "type": "integer",
                        "title": "Frequency Lookup Value Id",
                        "description": "Foreign key to pay frequency lookup value"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "name",
                    "start_date",
                    "end_date",
                    "pay_date",
                    "frequency_lookup_value_id",
                    "id"
                ],
                "title": "PayrollPeriod",
                "description": "工资周期响应模型"
            },
            "PayrollPeriodCreate": {
                "properties": {
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Payroll period name (e.g., 2024-01 Monthly)"
                    },
                    "start_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Start Date",
                        "description": "Period start date"
                    },
                    "end_date": {
                        "type": "string",
                        "format": "date",
                        "title": "End Date",
                        "description": "Period end date"
                    },
                    "pay_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Pay Date",
                        "description": "Date when payment is scheduled/made"
                    },
                    "frequency_lookup_value_id": {
                        "type": "integer",
                        "title": "Frequency Lookup Value Id",
                        "description": "Foreign key to pay frequency lookup value"
                    }
                },
                "type": "object",
                "required": [
                    "name",
                    "start_date",
                    "end_date",
                    "pay_date",
                    "frequency_lookup_value_id"
                ],
                "title": "PayrollPeriodCreate",
                "description": "创建工资周期模型"
            },
            "PayrollPeriodListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/PayrollPeriod"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "PayrollPeriodListResponse",
                "description": "工资周期列表响应模型"
            },
            "PayrollPeriodUpdate": {
                "properties": {
                    "name": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Name",
                        "description": "Payroll period name (e.g., 2024-01 Monthly)"
                    },
                    "start_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Start Date",
                        "description": "Period start date"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Period end date"
                    },
                    "pay_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Pay Date",
                        "description": "Date when payment is scheduled/made"
                    },
                    "frequency_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Frequency Lookup Value Id",
                        "description": "Foreign key to pay frequency lookup value"
                    }
                },
                "type": "object",
                "title": "PayrollPeriodUpdate",
                "description": "更新工资周期模型"
            },
            "PayrollRun": {
                "properties": {
                    "payroll_period_id": {
                        "type": "integer",
                        "title": "Payroll Period Id",
                        "description": "Foreign key to the payroll period"
                    },
                    "status_lookup_value_id": {
                        "type": "integer",
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to run status lookup value"
                    },
                    "initiated_by_user_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Initiated By User Id",
                        "description": "Foreign key to user who initiated the run"
                    },
                    "total_employees": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Employees",
                        "description": "Total number of employees processed in this run"
                    },
                    "total_net_pay": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Net Pay",
                        "description": "Total net pay amount for this run"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    },
                    "run_date": {
                        "type": "string",
                        "format": "date-time",
                        "title": "Run Date",
                        "description": "Timestamp of the payroll run execution"
                    }
                },
                "type": "object",
                "required": [
                    "payroll_period_id",
                    "status_lookup_value_id",
                    "id",
                    "run_date"
                ],
                "title": "PayrollRun",
                "description": "工资运行批次响应模型"
            },
            "PayrollRunCreate": {
                "properties": {
                    "payroll_period_id": {
                        "type": "integer",
                        "title": "Payroll Period Id",
                        "description": "Foreign key to the payroll period"
                    },
                    "status_lookup_value_id": {
                        "type": "integer",
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to run status lookup value"
                    },
                    "initiated_by_user_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Initiated By User Id",
                        "description": "Foreign key to user who initiated the run"
                    },
                    "total_employees": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Employees",
                        "description": "Total number of employees processed in this run"
                    },
                    "total_net_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Net Pay",
                        "description": "Total net pay amount for this run"
                    }
                },
                "type": "object",
                "required": [
                    "payroll_period_id",
                    "status_lookup_value_id"
                ],
                "title": "PayrollRunCreate",
                "description": "创建工资运行批次模型"
            },
            "PayrollRunListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/PayrollRun"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "PayrollRunListResponse",
                "description": "工资运行批次列表响应模型"
            },
            "PayrollRunPatch": {
                "properties": {
                    "payroll_period_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Payroll Period Id",
                        "description": "Foreign key to the payroll period"
                    },
                    "status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to run status lookup value"
                    },
                    "initiated_by_user_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Initiated By User Id",
                        "description": "Foreign key to user who initiated the run"
                    },
                    "total_employees": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Employees",
                        "description": "Total number of employees processed in this run"
                    },
                    "total_net_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Net Pay",
                        "description": "Total net pay amount for this run"
                    }
                },
                "type": "object",
                "title": "PayrollRunPatch",
                "description": "部分更新工资运行批次模型 (for PATCH operations)"
            },
            "PayrollRunUpdate": {
                "properties": {
                    "payroll_period_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Payroll Period Id",
                        "description": "Foreign key to the payroll period"
                    },
                    "status_lookup_value_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Status Lookup Value Id",
                        "description": "Foreign key to run status lookup value"
                    },
                    "initiated_by_user_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Initiated By User Id",
                        "description": "Foreign key to user who initiated the run"
                    },
                    "total_employees": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Employees",
                        "description": "Total number of employees processed in this run"
                    },
                    "total_net_pay": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Total Net Pay",
                        "description": "Total net pay amount for this run"
                    }
                },
                "type": "object",
                "title": "PayrollRunUpdate",
                "description": "更新工资运行批次模型"
            },
            "Permission": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique permission code (e.g., payroll:view, employee:edit)"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the permission"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "code",
                    "id"
                ],
                "title": "Permission",
                "description": "权限响应模型"
            },
            "PermissionCreate": {
                "properties": {
                    "code": {
                        "type": "string",
                        "title": "Code",
                        "description": "Unique permission code (e.g., payroll:view, employee:edit)"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the permission"
                    }
                },
                "type": "object",
                "required": [
                    "code"
                ],
                "title": "PermissionCreate",
                "description": "创建权限模型"
            },
            "PermissionListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/Permission"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "PermissionListResponse",
                "description": "权限列表响应模型"
            },
            "PermissionUpdate": {
                "properties": {
                    "code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Code",
                        "description": "Unique permission code (e.g., payroll:view, employee:edit)"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the permission"
                    }
                },
                "type": "object",
                "title": "PermissionUpdate",
                "description": "更新权限模型"
            },
            "Role": {
                "properties": {
                    "name": {
                        "type": "string",
                        "maxLength": 50,
                        "minLength": 1,
                        "title": "Name",
                        "description": "角色名称"
                    },
                    "code": {
                        "type": "string",
                        "maxLength": 50,
                        "minLength": 1,
                        "title": "Code",
                        "description": "角色代码,唯一"
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "default": true
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    },
                    "permissions": {
                        "items": {
                            "$ref": "#/components/schemas/Permission"
                        },
                        "type": "array",
                        "title": "Permissions",
                        "default": []
                    }
                },
                "type": "object",
                "required": [
                    "name",
                    "code",
                    "id"
                ],
                "title": "Role",
                "description": "角色响应模型"
            },
            "RoleCreate": {
                "properties": {
                    "name": {
                        "type": "string",
                        "maxLength": 50,
                        "minLength": 1,
                        "title": "Name",
                        "description": "角色名称"
                    },
                    "code": {
                        "type": "string",
                        "maxLength": 50,
                        "minLength": 1,
                        "title": "Code",
                        "description": "角色代码,唯一"
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "default": true
                    },
                    "permission_ids": {
                        "anyOf": [
                            {
                                "items": {
                                    "type": "integer"
                                },
                                "type": "array"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Permission Ids"
                    }
                },
                "type": "object",
                "required": [
                    "name",
                    "code"
                ],
                "title": "RoleCreate",
                "description": "创建角色模型"
            },
            "RoleListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/Role"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "RoleListResponse",
                "description": "角色列表响应模型"
            },
            "RoleUpdate": {
                "properties": {
                    "name": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 50,
                                "minLength": 1
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Name",
                        "description": "角色名称"
                    },
                    "code": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 50,
                                "minLength": 1
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Code",
                        "description": "角色代码,唯一"
                    },
                    "is_active": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Active"
                    },
                    "permission_ids": {
                        "anyOf": [
                            {
                                "items": {
                                    "type": "integer"
                                },
                                "type": "array"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Permission Ids"
                    }
                },
                "type": "object",
                "title": "RoleUpdate",
                "description": "更新角色模型"
            },
            "SocialSecurityRate": {
                "properties": {
                    "region_code": {
                        "type": "string",
                        "title": "Region Code",
                        "description": "Region code (e.g., country or province code)"
                    },
                    "contribution_type": {
                        "type": "string",
                        "title": "Contribution Type",
                        "description": "Contribution type (e.g., Pension, Medical, Unemployment)"
                    },
                    "participant_type": {
                        "type": "string",
                        "title": "Participant Type",
                        "description": "Participant type (Employee or Employer)"
                    },
                    "rate": {
                        "type": "number",
                        "title": "Rate",
                        "description": "Contribution rate (e.g., 0.08 for 8%)"
                    },
                    "base_min": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Base Min",
                        "description": "Minimum base amount for calculation"
                    },
                    "base_max": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Base Max",
                        "description": "Maximum base amount for calculation"
                    },
                    "fixed_amount": {
                        "type": "number",
                        "title": "Fixed Amount",
                        "description": "Fixed amount contribution (if applicable)",
                        "default": 0
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Date when this rate becomes effective"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Date when this rate expires (null if still active)"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "region_code",
                    "contribution_type",
                    "participant_type",
                    "rate",
                    "effective_date",
                    "id"
                ],
                "title": "SocialSecurityRate",
                "description": "社保费率响应模型"
            },
            "SocialSecurityRateCreate": {
                "properties": {
                    "region_code": {
                        "type": "string",
                        "title": "Region Code",
                        "description": "Region code (e.g., country or province code)"
                    },
                    "contribution_type": {
                        "type": "string",
                        "title": "Contribution Type",
                        "description": "Contribution type (e.g., Pension, Medical, Unemployment)"
                    },
                    "participant_type": {
                        "type": "string",
                        "title": "Participant Type",
                        "description": "Participant type (Employee or Employer)"
                    },
                    "rate": {
                        "type": "number",
                        "title": "Rate",
                        "description": "Contribution rate (e.g., 0.08 for 8%)"
                    },
                    "base_min": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Base Min",
                        "description": "Minimum base amount for calculation"
                    },
                    "base_max": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Base Max",
                        "description": "Maximum base amount for calculation"
                    },
                    "fixed_amount": {
                        "type": "number",
                        "title": "Fixed Amount",
                        "description": "Fixed amount contribution (if applicable)",
                        "default": 0
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Date when this rate becomes effective"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Date when this rate expires (null if still active)"
                    }
                },
                "type": "object",
                "required": [
                    "region_code",
                    "contribution_type",
                    "participant_type",
                    "rate",
                    "effective_date"
                ],
                "title": "SocialSecurityRateCreate",
                "description": "创建社保费率模型"
            },
            "SocialSecurityRateListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/SocialSecurityRate"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "SocialSecurityRateListResponse",
                "description": "社保费率列表响应模型"
            },
            "SocialSecurityRateUpdate": {
                "properties": {
                    "region_code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Region Code",
                        "description": "Region code (e.g., country or province code)"
                    },
                    "contribution_type": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Contribution Type",
                        "description": "Contribution type (e.g., Pension, Medical, Unemployment)"
                    },
                    "participant_type": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Participant Type",
                        "description": "Participant type (Employee or Employer)"
                    },
                    "rate": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Rate",
                        "description": "Contribution rate (e.g., 0.08 for 8%)"
                    },
                    "base_min": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Base Min",
                        "description": "Minimum base amount for calculation"
                    },
                    "base_max": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Base Max",
                        "description": "Maximum base amount for calculation"
                    },
                    "fixed_amount": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Fixed Amount",
                        "description": "Fixed amount contribution (if applicable)"
                    },
                    "effective_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Effective Date",
                        "description": "Date when this rate becomes effective"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Date when this rate expires (null if still active)"
                    }
                },
                "type": "object",
                "title": "SocialSecurityRateUpdate",
                "description": "更新社保费率模型"
            },
            "SystemParameter": {
                "properties": {
                    "key": {
                        "type": "string",
                        "title": "Key",
                        "description": "Unique parameter key"
                    },
                    "value": {
                        "type": "string",
                        "title": "Value",
                        "description": "Parameter value"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the parameter"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "key",
                    "value",
                    "id"
                ],
                "title": "SystemParameter",
                "description": "系统参数响应模型"
            },
            "SystemParameterCreate": {
                "properties": {
                    "key": {
                        "type": "string",
                        "title": "Key",
                        "description": "Unique parameter key"
                    },
                    "value": {
                        "type": "string",
                        "title": "Value",
                        "description": "Parameter value"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the parameter"
                    }
                },
                "type": "object",
                "required": [
                    "key",
                    "value"
                ],
                "title": "SystemParameterCreate",
                "description": "创建系统参数模型"
            },
            "SystemParameterListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/SystemParameter"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "SystemParameterListResponse",
                "description": "系统参数列表响应模型"
            },
            "SystemParameterUpdate": {
                "properties": {
                    "key": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Key",
                        "description": "Unique parameter key"
                    },
                    "value": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Value",
                        "description": "Parameter value"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "Description of the parameter"
                    }
                },
                "type": "object",
                "title": "SystemParameterUpdate",
                "description": "更新系统参数模型"
            },
            "TaxBracket": {
                "properties": {
                    "region_code": {
                        "type": "string",
                        "title": "Region Code",
                        "description": "Region code (e.g., country or province code)"
                    },
                    "tax_type": {
                        "type": "string",
                        "title": "Tax Type",
                        "description": "Tax type (e.g., Individual Income Tax, Corporate Tax)"
                    },
                    "income_range_start": {
                        "type": "number",
                        "title": "Income Range Start",
                        "description": "Start of income range for this bracket"
                    },
                    "income_range_end": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Income Range End",
                        "description": "End of income range for this bracket (null for highest bracket)"
                    },
                    "tax_rate": {
                        "type": "number",
                        "title": "Tax Rate",
                        "description": "Tax rate for this bracket (e.g., 0.03 for 3%)"
                    },
                    "quick_deduction": {
                        "type": "number",
                        "title": "Quick Deduction",
                        "description": "Quick deduction amount for this bracket",
                        "default": 0
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Date when this tax bracket becomes effective"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Date when this tax bracket expires (null if still active)"
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    }
                },
                "type": "object",
                "required": [
                    "region_code",
                    "tax_type",
                    "income_range_start",
                    "tax_rate",
                    "effective_date",
                    "id"
                ],
                "title": "TaxBracket",
                "description": "税率档位响应模型"
            },
            "TaxBracketCreate": {
                "properties": {
                    "region_code": {
                        "type": "string",
                        "title": "Region Code",
                        "description": "Region code (e.g., country or province code)"
                    },
                    "tax_type": {
                        "type": "string",
                        "title": "Tax Type",
                        "description": "Tax type (e.g., Individual Income Tax, Corporate Tax)"
                    },
                    "income_range_start": {
                        "type": "number",
                        "title": "Income Range Start",
                        "description": "Start of income range for this bracket"
                    },
                    "income_range_end": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Income Range End",
                        "description": "End of income range for this bracket (null for highest bracket)"
                    },
                    "tax_rate": {
                        "type": "number",
                        "title": "Tax Rate",
                        "description": "Tax rate for this bracket (e.g., 0.03 for 3%)"
                    },
                    "quick_deduction": {
                        "type": "number",
                        "title": "Quick Deduction",
                        "description": "Quick deduction amount for this bracket",
                        "default": 0
                    },
                    "effective_date": {
                        "type": "string",
                        "format": "date",
                        "title": "Effective Date",
                        "description": "Date when this tax bracket becomes effective"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Date when this tax bracket expires (null if still active)"
                    }
                },
                "type": "object",
                "required": [
                    "region_code",
                    "tax_type",
                    "income_range_start",
                    "tax_rate",
                    "effective_date"
                ],
                "title": "TaxBracketCreate",
                "description": "创建税率档位模型"
            },
            "TaxBracketListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/TaxBracket"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "TaxBracketListResponse",
                "description": "税率档位列表响应模型"
            },
            "TaxBracketUpdate": {
                "properties": {
                    "region_code": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Region Code",
                        "description": "Region code (e.g., country or province code)"
                    },
                    "tax_type": {
                        "anyOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Tax Type",
                        "description": "Tax type (e.g., Individual Income Tax, Corporate Tax)"
                    },
                    "income_range_start": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Income Range Start",
                        "description": "Start of income range for this bracket"
                    },
                    "income_range_end": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Income Range End",
                        "description": "End of income range for this bracket (null for highest bracket)"
                    },
                    "tax_rate": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Tax Rate",
                        "description": "Tax rate for this bracket (e.g., 0.03 for 3%)"
                    },
                    "quick_deduction": {
                        "anyOf": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Quick Deduction",
                        "description": "Quick deduction amount for this bracket"
                    },
                    "effective_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Effective Date",
                        "description": "Date when this tax bracket becomes effective"
                    },
                    "end_date": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "date"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "End Date",
                        "description": "Date when this tax bracket expires (null if still active)"
                    }
                },
                "type": "object",
                "title": "TaxBracketUpdate",
                "description": "更新税率档位模型"
            },
            "TokenResponseWithFullUser": {
                "properties": {
                    "access_token": {
                        "type": "string",
                        "title": "Access Token"
                    },
                    "token_type": {
                        "type": "string",
                        "title": "Token Type",
                        "default": "bearer"
                    },
                    "user": {
                        "$ref": "#/components/schemas/User"
                    }
                },
                "type": "object",
                "required": [
                    "access_token",
                    "user"
                ],
                "title": "TokenResponseWithFullUser"
            },
            "User": {
                "properties": {
                    "username": {
                        "type": "string",
                        "title": "Username",
                        "description": "Unique username"
                    },
                    "employee_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employee Id",
                        "description": "Optional link to an employee"
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "default": true
                    },
                    "id": {
                        "type": "integer",
                        "title": "Id",
                        "description": "Primary key"
                    },
                    "created_at": {
                        "type": "string",
                        "format": "date-time",
                        "title": "Created At",
                        "description": "User creation timestamp"
                    },
                    "roles": {
                        "items": {
                            "$ref": "#/components/schemas/Role"
                        },
                        "type": "array",
                        "title": "Roles",
                        "default": []
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 255
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "用户描述"
                    },
                    "all_permission_codes": {
                        "anyOf": [
                            {
                                "items": {
                                    "type": "string"
                                },
                                "type": "array"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "All Permission Codes",
                        "description": "用户通过其角色获得的所有唯一权限代码列表"
                    }
                },
                "type": "object",
                "required": [
                    "username",
                    "id",
                    "created_at"
                ],
                "title": "User",
                "description": "用户响应模型"
            },
            "UserCreate": {
                "properties": {
                    "username": {
                        "type": "string",
                        "title": "Username",
                        "description": "Unique username"
                    },
                    "employee_id": {
                        "anyOf": [
                            {
                                "type": "integer"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employee Id",
                        "description": "Optional link to an employee"
                    },
                    "is_active": {
                        "type": "boolean",
                        "title": "Is Active",
                        "description": "Whether the user account is active",
                        "default": true
                    },
                    "password": {
                        "type": "string",
                        "minLength": 6,
                        "title": "Password",
                        "description": "用户密码"
                    }
                },
                "type": "object",
                "required": [
                    "username",
                    "password"
                ],
                "title": "UserCreate",
                "description": "创建用户模型"
            },
            "UserListResponse": {
                "properties": {
                    "data": {
                        "items": {
                            "$ref": "#/components/schemas/User"
                        },
                        "type": "array",
                        "title": "Data"
                    },
                    "meta": {
                        "additionalProperties": true,
                        "type": "object",
                        "title": "Meta"
                    }
                },
                "type": "object",
                "required": [
                    "data"
                ],
                "title": "UserListResponse",
                "description": "用户列表响应模型"
            },
            "UserRoleAssignRequest": {
                "properties": {
                    "role_ids": {
                        "items": {
                            "type": "integer"
                        },
                        "type": "array",
                        "title": "Role Ids",
                        "description": "要分配给用户的角色ID列表"
                    }
                },
                "type": "object",
                "required": [
                    "role_ids"
                ],
                "title": "UserRoleAssignRequest"
            },
            "UserUpdate": {
                "properties": {
                    "username": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 50,
                                "minLength": 3
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Username",
                        "description": "用户名"
                    },
                    "email": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "email"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Email",
                        "description": "用户邮箱"
                    },
                    "full_name": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 50
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Full Name",
                        "description": "用户全名"
                    },
                    "employee_id": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 20
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Employee Id",
                        "description": "工号"
                    },
                    "department": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 100
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Department",
                        "description": "所属部门"
                    },
                    "position": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 100
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Position",
                        "description": "职位"
                    },
                    "description": {
                        "anyOf": [
                            {
                                "type": "string",
                                "maxLength": 255
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Description",
                        "description": "用户描述"
                    },
                    "is_active": {
                        "anyOf": [
                            {
                                "type": "boolean"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Is Active"
                    },
                    "password": {
                        "anyOf": [
                            {
                                "type": "string",
                                "minLength": 6
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Password",
                        "description": "新密码，仅在需要更改密码时提供"
                    },
                    "role_ids": {
                        "anyOf": [
                            {
                                "items": {
                                    "type": "integer"
                                },
                                "type": "array"
                            },
                            {
                                "type": "null"
                            }
                        ],
                        "title": "Role Ids",
                        "description": "角色ID列表，用于（重新）分配用户角色"
                    }
                },
                "type": "object",
                "title": "UserUpdate",
                "description": "更新用户模型"
            },
            "ValidationError": {
                "properties": {
                    "loc": {
                        "items": {
                            "anyOf": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "integer"
                                }
                            ]
                        },
                        "type": "array",
                        "title": "Location"
                    },
                    "msg": {
                        "type": "string",
                        "title": "Message"
                    },
                    "type": {
                        "type": "string",
                        "title": "Error Type"
                    }
                },
                "type": "object",
                "required": [
                    "loc",
                    "msg",
                    "type"
                ],
                "title": "ValidationError"
            }
        },
        "securitySchemes": {
            "HTTPBearer": {
                "type": "http",
                "scheme": "bearer"
            }
        }
    }
}