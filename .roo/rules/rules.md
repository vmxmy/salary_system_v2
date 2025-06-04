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
- When editing TypeScript files with JSX syntax, ensure the file extension is .tsx, not .ts
- For Ant Design Pro StatisticCard component, the trend property expects "up" | "down" | undefined, not an object
- TableActionButton component requires actionType property to be specified
- DirectoryTree component from Ant Design doesn't support loading property directly

# Scratchpad

## 薪资工作流页面开发任务 🚀 正在进行

### 总体目标
开发完整的五步薪资工作流页面，实现从数据准备到最终发放的完整业务流程。

### 最新完成 ✅ 刚完成

#### 第二步预览表格功能
- [X] **发现问题**：用户反馈第二步缺少预览表格界面
- [X] **添加数据预览**：在 `AutoCalculationStep.tsx` 中添加了完整的预览表格
- [X] **功能特性**：
  - 📊 **薪资数据预览表格**：显示员工姓名、部门、职位、基本工资、津贴补贴、预计扣除、预计应发、预计实发
  - 🔄 **动态加载**：根据选择的薪资周期自动加载预览数据
  - 📈 **数据汇总**：表格底部显示总计金额
  - 🎨 **美观界面**：小尺寸表格，操作按钮，加载状态
  - ⚡️ **性能优化**：仅在计算前显示，避免重复渲染
- [X] **技术实现**：
  - 新增 `PayrollDataPreview` 接口定义
  - 异步加载预览数据逻辑
  - ProTable 组件集成和汇总行功能
  - 响应式设计和交互优化

#### 第三步复核功能完整实现
- [X] **完整组件创建**：`PayrollReviewStep.tsx`（585行）包含所有复核功能
- [X] **核心功能**：
  - 📊 **复核概览**：显示总条目数、已复核、有异常、待复核的统计
  - 📋 **数据表格**：完整的薪资条目表格，包含选择、查看、复核、调整操作
  - 🔍 **异常处理**：异常类型标记、异常备注提示、异常数据警告
  - ✅ **批量操作**：支持批量选择和批量复核功能
  - ⚙️ **单条调整**：支持单个条目的金额调整和原因记录
  - 📝 **复核记录**：完整的复核意见和结果记录
- [X] **交互设计**：
  - 模态框表单进行复核操作
  - 状态标签和颜色区分
  - 工具提示显示异常信息
  - 操作按钮和权限控制
- [X] **集成到主页面**：已集成到 `PayrollWorkflowPage.tsx` 中
- [X] **类型安全**：解决了所有 TypeScript 编译错误

### 当前进度状态

#### 各步骤完成情况
- **第一步（数据审核与准备）**：✅ **100% 完成**
  - 薪资周期选择器（优化版）
  - 数据检查和验证
  - 数据初始化功能
  - 批量导入跳转
  
- **第二步（工资自动计算）**：✅ **100% 完成**
  - 计算参数配置
  - 模块化计算选择
  - 进度监控和状态显示
  - **新增**：数据预览表格
  - 计算结果汇总展示
  
- **第三步（工资周期复核）**：✅ **100% 完成**
  - 复核数据展示表格
  - 异常数据标记和处理
  - 批量复核功能
  - 单条调整功能
  - 复核意见记录
  
- **第四步（工资周期批准）**：⌛️ **0% 待开发**
  
- **第五步（工资发放与归档）**：⌛️ **0% 待开发**

#### 技术架构状态
- [X] **组件架构**：完整的步骤组件拆分，代码结构清晰
- [X] **状态管理**：使用组合钩子模式，状态管理完善
- [X] **类型定义**：完整的 TypeScript 类型系统
- [X] **UI组件**：统一使用 ProComponents，界面一致性良好
- [X] **编译验证**：所有代码通过 TypeScript 编译检查

### 下一步计划 📋

#### 第四步：工资周期批准
- [ ] **批准者权限验证**：检查用户是否有批准权限
- [ ] **批准前检查**：确保所有数据已复核完成
- [ ] **批准操作界面**：批准决策、意见记录、批准时间
- [ ] **批准结果处理**：状态更新、通知发送、流程推进

#### 第五步：工资发放与归档
- [ ] **发放准备**：银行文件生成、工资条制作
- [ ] **发放执行**：发放状态跟踪、异常处理
- [ ] **数据归档**：历史数据存档、报表生成

### 总体进度
- **完成度**：✅ **60%**（3/5 步骤完成）
- **代码行数**：约 1,500+ 行高质量代码
- **技术质量**：架构清晰、类型安全、性能优化
- **用户体验**：界面美观、交互流畅、功能完整
