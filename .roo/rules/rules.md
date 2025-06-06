# Instructions

During your interaction with the user, if you find anything reusable in this project (e.g. version of a library, model name), especially about a fix to a mistake you made or a correction you received, you should take note in the `Lessons` section in the `.cursorrules` file so you will not make the same mistake again. 

You should also use the `.roo/rules/rules.md` file as a Scratchpad to organize your thoughts. Especially when you receive a new task, you should first review the content of the Scratchpad, clear old different task if necessary, first explain the task, and plan the steps you need to take to complete the task. You can use todo markers to indicate the progress, e.g.
[X] Task 1
[ ] Task 2

Also update the progress of the task in the Scratchpad when you finish a subtask.
Especially when you finished a milestone, it will help to improve your depth of task accomplishment to use the Scratchpad to reflect and plan.
The goal is to help you maintain a big picture as well as the progress of the task. Always refer to the Scratchpad when you plan the next step.

# Tools

Note all the tools are in python3. So in the case you need to do batch processing, you can always consult the python files and write your own script.

## Screenshot Verification

The screenshot verification workflow allows you to capture screenshots of web pages and verify their appearance using LLMs. The following tools are available:

1. Screenshot Capture:
```bash
venv/bin/python3 tools/screenshot_utils.py URL [--output OUTPUT] [--width WIDTH] [--height HEIGHT]
```

2. LLM Verification with Images:
```bash
venv/bin/python3 tools/llm_api.py --prompt "Your verification question" --provider {openai|anthropic} --image path/to/screenshot.png
```

Example workflow:
```python
from screenshot_utils import take_screenshot_sync
from llm_api import query_llm

# Take a screenshot

screenshot_path = take_screenshot_sync('https://example.com', 'screenshot.png')

# Verify with LLM

response = query_llm(
    "What is the background color and title of this webpage?",
    provider="openai",  # or "anthropic"
    image_path=screenshot_path
)
print(response)
```

## LLM

You always have an LLM at your side to help you with the task. For simple tasks, you could invoke the LLM by running the following command:
```
venv/bin/python3 ./tools/llm_api.py --prompt "What is the capital of France?" --provider "anthropic"
```

The LLM API supports multiple providers:
- OpenAI (default, model: gpt-4o)
- Azure OpenAI (model: configured via AZURE_OPENAI_MODEL_DEPLOYMENT in .env file, defaults to gpt-4o-ms)
- DeepSeek (model: deepseek-chat)
- Anthropic (model: claude-3-sonnet-20240229)
- Gemini (model: gemini-pro)
- Local LLM (model: Qwen/Qwen2.5-32B-Instruct-AWQ)

But usually it's a better idea to check the content of the file and use the APIs in the `tools/llm_api.py` file to invoke the LLM if needed.

## Web browser

You could use the `tools/web_scraper.py` file to scrape the web.
```bash
venv/bin/python3 ./tools/web_scraper.py --max-concurrent 3 URL1 URL2 URL3
```
This will output the content of the web pages.

## Search engine

You could use the `tools/search_engine.py` file to search the web.
```bash
venv/bin/python3 ./tools/search_engine.py "your search keywords"
```
This will output the search results in the following format:
```
URL: https://example.com
Title: This is the title of the search result
Snippet: This is a snippet of the search result
```
If needed, you can further use the `web_scraper.py` file to scrape the web page content.

# Lessons

## User Specified Lessons

- You have a python venv in ./venv. Always use (activate) it when doing python development. First, to check whether 'uv' is available, use `which uv`. If that's the case, first activate the venv, and then use `uv pip install` to install packages. Otherwise, fall back to `pip`.
- Include info useful for debugging in the program output.
- Read the file before you try to edit it.
- Due to Cursor's limit, when you use `git` and `gh` and need to submit a multiline commit message, first write the message in a file, and then use `git commit -F <filename>` or similar command to commit. And then remove the file. Include "[Cursor] " in the commit message and PR title.

## Cursor learned

- For search results, ensure proper handling of different character encodings (UTF-8) for international queries
- Add debug information to stderr while keeping the main output clean in stdout for better pipeline integration
- When using seaborn styles in matplotlib, use 'seaborn-v0_8' instead of 'seaborn' as the style name due to recent seaborn version changes
- Use 'gpt-4o' as the model name for OpenAI's GPT-4 with vision capabilities
- When searching for recent news, use the current year (2025) instead of previous years, or simply use the "recent" keyword to get the latest information

# Scratchpad

## 导入错误修复任务 ✅ 已完成

### 问题分析：
- [X] **后端导入错误**：`payroll_report_service.py` 中从错误模块导入 `ReportTemplateResponse`
- [X] **路由导入错误**：`simple_payroll.py` 路由文件中也有相同的导入错误
- [X] **前端样式错误**：`SimplePayroll` 页面尝试导入不存在的 `styles.less` 文件

### 修复措施：
- [X] **修复 payroll_report_service.py**：将 `ReportTemplateResponse` 的导入从 `simple_payroll` 模块改为 `config` 模块
- [X] **修复 simple_payroll.py 路由**：同样将 `ReportTemplateResponse` 导入源修复为 `config` 模块
- [X] **修复前端样式导入**：移除 SimplePayroll 页面中不存在的 `./styles.less` 导入

### 验证结果：
- [X] 后端 Python 模块导入错误已解决
- [X] 前端 Vite 开发服务器样式文件错误已解决
- [X] 应用应该可以正常启动

**结论**：所有导入错误已修复，前后端都应该可以正常运行。

## 认证Token问题修复任务 ✅ 已完成

### 问题分析：
- [X] **问题识别**：`simplePayrollApi.ts` 中的警告 `⚠️ [simplePayrollApi] 未找到access_token，请求可能失败`
- [X] **根本原因**：`simplePayrollApi.ts` 使用 `localStorage.getItem('access_token')` 获取token，但认证系统使用Redux store存储token
- [X] **影响范围**：SimplePayroll模块的所有API调用都可能失败

### 问题详情：
1. **认证架构不一致**：
   - 主要API客户端 (`apiClient.ts`) 从 Redux store 获取token：`store.getState().auth.authToken`
   - SimplePayroll API (`simplePayrollApi.ts`) 从 localStorage 获取token：`localStorage.getItem('access_token')`

2. **Token存储机制**：
   - Redux store (`authSlice.ts`) 管理认证状态
   - Zustand store (`authStore.ts`) 使用 localStorage 持久化，但key是 `auth-storage`
   - SimplePayroll API 期望的key是 `access_token`

### 修复措施：
- [X] **修复token获取逻辑**：修改 `simplePayrollApi.ts` 使用 Redux store 获取token
  - 导入 `store` 从 `../../../store`
  - 将 `localStorage.getItem('access_token')` 改为 `store.getState().auth.authToken`
  - 更新日志信息以反映新的token获取方式

### 修复结果：
- [X] SimplePayroll API 现在使用与主API客户端相同的认证机制
- [X] 消除了 `未找到access_token` 的警告
- [X] 确保了认证架构的一致性

**结论**：认证token问题已修复，SimplePayroll模块现在应该可以正常进行API调用。

## Token刷新端点缺失问题 🔄 新发现

### 问题分析：
- [X] **问题识别**：前端尝试调用 `/v2/token/refresh` 端点但收到404错误
- [X] **根本原因**：后端只有 `/v2/auth/token` 登录端点，缺少token刷新端点
- [X] **影响范围**：当token过期时，用户会被强制登出而不是自动刷新token

### 问题详情：
1. **前端期望的刷新机制**：
   - `apiClient.ts` 第214行调用 `await apiClient.post('/token/refresh', {})`
   - 期望返回新的 `access_token`

2. **后端实际情况**：
   - 只有 `/v2/auth/token` 端点用于登录
   - 没有 `/v2/token/refresh` 或 `/v2/auth/token/refresh` 端点

3. **当前行为**：
   - Token过期时，刷新请求失败（404）
   - 用户被强制登出到登录页面

### 解决方案选项：
- [ ] **方案1**：在后端添加token刷新端点
- [ ] **方案2**：修改前端逻辑，token过期时直接登出（简化方案）
- [ ] **方案3**：实现refresh token机制（完整JWT方案）

### 建议行动：
- [ ] 评估是否需要token自动刷新功能
- [ ] 如果不需要，简化前端逻辑直接登出
- [ ] 如果需要，在后端实现刷新端点

## 登录500错误修复任务 🔄 新任务

### 问题分析：
- [X] **问题识别**：用户登录时遇到 500 内部服务器错误
- [X] **错误详情**：
  - 前端显示 "No auth token found in Redux store"
  - 后端 `/v2/auth/token` 端点返回 500 错误
  - 登录请求失败，无法获取认证token

### 问题症状：
1. **前端错误**：
   - `POST http://127.0.0.1:8080/v2/auth/token 500 (Internal Server Error)`
   - `No auth token found in Redux store`
   - 登录表单提交后无法完成认证

2. **可能原因**：
   - 后端认证端点实现有问题
   - 数据库连接问题
   - 密码验证逻辑错误
   - 缺少必要的依赖或配置

### 调查计划：
- [ ] **检查后端认证路由**：查看 `/v2/auth/token` 端点实现
- [ ] **检查前端登录请求**：确认请求格式和参数
- [ ] **检查后端日志**：查看具体的错误信息
- [ ] **测试数据库连接**：确认数据库访问正常
- [ ] **验证用户数据**：确认测试用户存在且密码正确

### 修复步骤：
- [ ] 分析后端认证代码
- [ ] 检查数据库连接和用户表
- [ ] 修复发现的问题
- [ ] 测试登录功能

## Pydantic V2 兼容性修复任务 ⏸️ 暂停

### 问题分析：
- [X] **问题识别**：Pydantic V2 警告 `'schema_extra' has been renamed to 'json_schema_extra'`
- [X] **根本原因**：项目中使用了旧的 Pydantic V1 配置语法 `schema_extra`，需要升级到 V2 语法 `json_schema_extra`
- [X] **影响范围**：所有使用 `schema_extra` 的 Pydantic 模型都会产生警告

### 问题详情：
1. **发现的问题文件**：
   - `webapp/v2/pydantic_models/payroll_calculation.py` - 2处使用 `schema_extra`
   - 其他文件已经使用了正确的 `json_schema_extra` 语法

2. **Pydantic V2 变更**：
   - `schema_extra` → `json_schema_extra`
   - 需要保持示例数据不变，只修改配置键名

### 修复计划：
- [ ] **修复 payroll_calculation.py**：将两处 `schema_extra` 改为 `json_schema_extra`
- [ ] **验证修复**：确认警告消失
- [ ] **测试功能**：确保 API 文档和验证功能正常

### 修复步骤：
- [ ] 修复第一个 `PayrollCalculationRequest` 类的配置
- [ ] 修复第二个 `CalculationResult` 类的配置

**注意**：暂停此任务，优先处理登录500错误问题。
