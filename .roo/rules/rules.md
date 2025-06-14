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

# 🚀 通用批量导入工具改造任务

## 🎯 任务目标
将现有的薪资批量导入页面改造成通用批量导入数据工具，支持：
1. **工资数据导入** (现有功能增强)
2. **员工信息导入** (新增功能)
3. **可扩展架构** (未来支持更多导入模式)

## 📋 详细任务清单

### 阶段1：架构设计和基础重构 🏗️
- [X] **1.1** 分析现有薪资导入组件结构和依赖关系 ✅
- [X] **1.2** 设计通用导入架构 (策略模式 + 配置驱动) ✅
- [X] **1.3** 创建基础抽象类和接口 ✅
  - [X] `BaseImportStrategy.ts` - 导入策略基类 ✅
  - [X] `ImportModeConfig` - 导入模式配置接口 ✅
  - [X] `UniversalImportTypes.ts` - 通用类型定义 ✅
  - [X] `ImportModeSelector.tsx` - 模式选择器组件 ✅
- [ ] **1.4** 重构目录结构
  - [ ] 重命名为 `UniversalBulkImportPage/`
  - [ ] 创建 `strategies/`, `configs/`, `adapters/` 目录

### 阶段2：导入策略实现 📝
- [X] **2.1** 实现薪资导入策略 ✅
  - [X] `PayrollImportStrategy.ts` - 封装现有薪资导入逻辑 ✅
  - [X] 薪资字段配置和映射规则 ✅
  - [X] 迁移现有验证和执行逻辑 ✅
- [ ] **2.2** 实现员工导入策略
  - [ ] `EmployeeImportStrategy.ts` - 员工导入策略
  - [ ] `employeeImportConfig.ts` - 员工字段配置
  - [ ] 集成员工批量创建API
  - [ ] 实现员工数据验证逻辑

### 阶段3：通用组件改造 🔧
- [ ] **3.1** 改造模式选择器
  - [ ] `ImportModeSelector.tsx` - 创建导入模式选择组件
  - [ ] 支持薪资和员工两种模式切换
- [ ] **3.2** 改造数据上传组件
  - [ ] `DataUpload.tsx` - 通用化数据上传
  - [ ] 支持不同模式的模板下载
  - [ ] 动态字段验证
- [ ] **3.3** 改造智能映射组件
  - [ ] `SmartMapping.tsx` - 支持不同字段类型
  - [ ] 动态字段映射配置
  - [ ] 根据模式显示不同的可选字段
- [ ] **3.4** 改造数据预览组件
  - [ ] `DataPreview.tsx` - 支持不同数据结构
  - [ ] 动态列表显示
  - [ ] 不同类型的验证结果展示

### 阶段4：流程控制和状态管理 ⚙️
- [ ] **4.1** 重构导入流程Hook
  - [ ] `useImportFlow.ts` - 通用导入流程管理
  - [ ] `useImportStrategy.ts` - 策略选择和切换
  - [ ] 支持不同模式的状态管理
- [ ] **4.2** 实现导入执行组件
  - [ ] `ImportExecution.tsx` - 支持不同结果格式
  - [ ] 统一的错误处理和结果展示
  - [ ] 不同模式的后续操作

### 阶段5：用户界面和体验优化 🎨
- [ ] **5.1** 页面布局优化
  - [ ] 响应式设计支持
  - [ ] 清晰的步骤指示器
  - [ ] 模式切换的视觉反馈
- [ ] **5.2** 帮助和指导
  - [ ] 不同模式的帮助文档
  - [ ] 字段映射提示
  - [ ] 错误处理指导
- [ ] **5.3** 国际化支持
  - [ ] 新增组件的i18n配置
  - [ ] 不同模式的翻译文本

### 阶段6：集成测试和优化 🧪
- [ ] **6.1** 功能测试
  - [ ] 薪资导入完整流程测试
  - [ ] 员工导入完整流程测试
  - [ ] 模式切换测试
- [ ] **6.2** 边界情况测试
  - [ ] 大量数据导入测试
  - [ ] 错误数据处理测试
  - [ ] 网络异常处理测试
- [ ] **6.3** 性能优化
  - [ ] 大文件处理优化
  - [ ] 内存使用优化
  - [ ] 响应速度优化

### 阶段7：文档和部署 📚
- [ ] **7.1** 技术文档
  - [ ] 架构设计文档
  - [ ] 扩展指南 (如何添加新的导入模式)
  - [ ] API接口文档
- [ ] **7.2** 用户手册
  - [ ] 导入流程说明
  - [ ] 常见问题解答
  - [ ] 模板格式说明
- [ ] **7.3** 部署验证
  - [ ] 生产环境测试
  - [ ] 用户验收测试
  - [ ] 性能监控

## 🛠️ 当前进度状态
📍 **准备阶段** - 任务规划完成，准备开始实施

## 💡 技术要点
- **策略模式**: 不同导入类型使用独立策略，便于扩展
- **配置驱动**: 字段定义、验证规则完全配置化
- **类型安全**: 全TypeScript支持，确保类型安全
- **向后兼容**: 保持现有薪资导入功能完整性
- **高扩展性**: 轻松添加新的导入模式 (考勤、绩效等)

## 🎯 里程碑目标
1. **Week 1**: 完成架构设计和基础重构 (阶段1-2)
2. **Week 2**: 完成组件改造和流程控制 (阶段3-4)  
3. **Week 3**: 完成UI优化和测试 (阶段5-6)
4. **Week 4**: 完成文档和部署 (阶段7)

---
*任务启动时间：2025-01-17*
*预计完成时间：2025-02-14*

# 缴费基数批量验证API实施任务 🚀 第二阶段进行中

## 目标
为缴费基数导入创建专用的批量验证API，确保数据质量和业务合规性。

## 实施计划

### 第一阶段：后端API开发 ✅ 已完成
- [X] 创建Pydantic模型（SalaryBaseUpdate, SalaryBaseBatchValidationRequest）
- [X] 实现批量验证服务方法
- [X] 添加API路由端点
- [X] 集成到现有服务架构
- [X] API测试验证通过

### 第二阶段：前端策略更新 🚀 进行中
- [X] 创建缴费基数导入策略（SalaryBaseImportStrategy）
- [X] 创建基础导入策略抽象类（BaseImportStrategy）
- [X] 创建薪资导入策略（PayrollImportStrategy）
- [X] 创建策略工厂（ImportStrategyFactory）
- [X] 更新通用类型定义（universal.ts）
- [X] 创建通用导入页面（UniversalImportPage）
- [ ] 测试前端策略集成

### 第三阶段：集成测试 ⌛️
- [ ] API功能测试
- [ ] 前端集成测试
- [ ] 端到端测试

## 第二阶段完成成果 ✅

### 2.1 策略模式架构 ✅
- **BaseImportStrategy**：抽象基类，定义通用接口和默认实现
- **SalaryBaseImportStrategy**：缴费基数导入策略，完整实现验证和执行方法
- **PayrollImportStrategy**：薪资导入策略，支持现有薪资数据导入
- **ImportStrategyFactory**：策略工厂，管理所有导入策略

### 2.2 通用导入系统 ✅
- **ImportModeSelector**：模式选择器组件，支持多种导入模式
- **UniversalImportPage**：通用导入页面，整合策略模式
- **通用类型定义**：完整的TypeScript类型定义

### 2.3 缴费基数导入功能 ✅
- **字段配置**：员工姓名、身份证号、社保缴费基数、公积金缴费基数
- **验证规则**：员工身份验证、数据格式验证、业务逻辑验证
- **API集成**：调用后端批量验证和执行API
- **智能映射**：支持字段自动映射和手动调整

### 2.4 前端架构优化 ✅
- **策略模式**：支持多种导入类型的扩展
- **组件复用**：通用组件支持不同导入模式
- **类型安全**：完整的TypeScript类型定义
- **错误处理**：统一的错误处理和用户反馈

## 验证内容设计 ✅
1. **员工身份验证**：匹配、状态、存在性
2. **数据格式验证**：必填字段、数据类型、数值范围
3. **业务逻辑验证**：重复记录、期间有效性、基数合理性
4. **数据一致性验证**：配置冲突、批次重复、历史一致性

## 第一阶段完成成果 ✅
- **Pydantic模型**：完整的请求/响应模型定义
- **服务方法**：`batch_validate_salary_bases()` 完整实现
- **API端点**：`POST /v2/simple-payroll/salary-configs/batch-validate`
- **验证功能**：
  - ✅ 员工身份验证（ID匹配、姓名+身份证匹配）
  - ✅ 数据格式验证（数值类型、范围检查）
  - ✅ 业务逻辑验证（重复配置检查、覆盖模式支持）
  - ✅ 详细错误和警告信息

## API测试结果 ✅
- **非覆盖模式**：正确识别已存在配置并报错
- **覆盖模式**：正确验证通过并给出警告
- **员工匹配**：成功匹配员工ID 303（汪琳）
- **数据验证**：正确验证缴费基数数值

## 当前进度
- [X] 需求分析和验证内容设计
- [X] 后端API开发完成
- [X] 前端策略架构完成
- [ ] 前端集成测试

---

## 422 错误修复任务 ✅ 已完成

### 问题分析：
- [X] **根本原因**：前端 API 调用中 `size=200` 超出了后端验证限制（最大 100）
- [X] **次要问题**：payroll 路由转发到 config 模块时参数名不匹配

### 修复措施：
- [X] **修复参数验证问题**：将 `payrollBulkImportApi.ts` 中的 `size: 200` 改为 `size: 100`
- [X] **修复路由转发问题**：
  - 将 payroll 路由中的 `is_enabled` 参数改为 `is_active`
  - 修正所有转发函数的导入路径和参数映射
  - 确保正确调用 config 模块的具体路由函数

### 验证结果：
- [X] API 调用 `GET /v2/config/payroll-component-definitions?is_active=true&size=100` 现在返回正常数据
- [X] 前端薪资批量导入页面应该可以正常加载初始数据

**结论**：422 错误已完全解决，前端可以正常获取薪资组件定义数据。
