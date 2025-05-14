# API测试脚本

这个目录包含用于测试v2版本API接口的脚本工具。

## api_tester.py

这是一个灵活的API测试脚本，可以通过命令行参数指定要测试的API接口，支持所有v2版本的接口测试。

### 依赖安装

在使用脚本之前，请确保安装了必要的依赖：

```bash
pip install requests tabulate colorama
```

### 使用方法

#### 列出所有可用的API端点

```bash
python api_tester.py --list-endpoints
```

#### 测试所有API端点

```bash
python api_tester.py --test-all
```

#### 测试特定分类的API端点

```bash
python api_tester.py --test-all --categories employees,departments
```

#### 测试单个API端点

```bash
# GET请求
python api_tester.py --endpoint /v2/employees --method GET

# GET请求带参数
python api_tester.py --endpoint /v2/employees --method GET --params '{"page": 1, "size": 10}'

# GET请求获取单个资源
python api_tester.py --endpoint /v2/employees/{id} --method GET --id 1

# POST请求
python api_tester.py --endpoint /v2/employees --method POST --data '{"employee_code": "E001", "first_name": "John", "last_name": "Doe", "hire_date": "2023-01-01"}'

# PUT请求
python api_tester.py --endpoint /v2/employees/{id} --method PUT --id 1 --data '{"first_name": "Jane"}'

# DELETE请求
python api_tester.py --endpoint /v2/employees/{id} --method DELETE --id 1
```

#### 生成测试报告

```bash
python api_tester.py --test-all --report test_report.json
```

### 环境变量

脚本支持通过环境变量配置基础URL和认证信息：

- `API_BASE_URL`: API基础URL，默认为`http://localhost:8080`
- `API_USERNAME`: API用户名，默认为`admin`
- `API_PASSWORD`: API密码，默认为`admin`

也可以通过命令行参数指定这些值：

```bash
python api_tester.py --base-url http://localhost:8080 --username admin --password admin --test-all
```

### 支持的API分类

脚本支持测试以下分类的API端点：

1. `employees`: 员工相关API
2. `departments`: 部门相关API
3. `job_titles`: 职位相关API
4. `lookup`: 查找值相关API
5. `config`: 配置相关API
6. `payroll`: 工资相关API
7. `security`: 安全相关API

### 测试报告

测试报告以JSON格式保存，包含以下信息：

- 测试时间戳
- 基础URL
- 总测试数
- 通过测试数
- 详细测试结果，包括每个端点的请求和响应信息

### 示例输出

```
测试: GET /v2/employees
描述: 获取员工列表
✓ 状态码: 200
响应时间: 0.1234秒
响应内容:
{
  "data": [
    {
      "id": 1,
      "employee_code": "E001",
      "first_name": "John",
      "last_name": "Doe",
      ...
    },
    ...
  ],
  "meta": {
    "page": 1,
    "size": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 故障排除

### 认证失败

如果遇到认证失败的问题，请确保提供了正确的用户名和密码。可以通过环境变量或命令行参数设置：

```bash
export API_USERNAME=your_username
export API_PASSWORD=your_password
python api_tester.py --test-all
```

或者：

```bash
python api_tester.py --username your_username --password your_password --test-all
```

### 连接错误

如果遇到连接错误，请确保API服务器正在运行，并且基础URL正确：

```bash
python api_tester.py --base-url http://your-api-server:8080 --test-all
```

### 请求超时

默认请求超时时间为10秒。如果API响应时间较长，可能会导致请求超时。这种情况下，可以修改脚本中的`timeout`参数：

```python
self.session = requests.Session()
self.session.timeout = 30  # 设置超时时间为30秒
```
