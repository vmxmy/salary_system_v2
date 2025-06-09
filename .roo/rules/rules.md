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
- When fixing TypeScript errors with `calculationProgress?.status`, use explicit type annotations and type assertions to resolve `never` type inference issues
- For optional fields in TypeScript interfaces, always use `|| 0` or similar fallbacks when performing arithmetic operations to avoid "possibly undefined" errors
- When TypeScript interfaces extend other interfaces but don't have certain properties, check the base interface definition and use the correct property names (e.g., `payroll_period_id` instead of `period_id`)

# Scratchpad

## 核心业务视图优化任务 🚀

### 任务概述
基于之前完成的数据库优化（索引优化、性能测试），现在优化核心业务视图以进一步提升系统性能和开发效率。

### Phase 1: 性能分析结果 ✅ 已完成

**性能测试结果 (18个视图测试)**:
- ✅ 平均执行时间: 2.71ms (表现优秀)
- ⚠️ 最慢视图: `v_payroll_component_usage` (33.30ms) - 需要物化视图优化
- 📊 次慢视图: `audit_overview` (2.31ms) - 可考虑缓存
- 💾 综合视图: `v_comprehensive_employee_payroll` (1.52-1.54ms) - 已优化

### Phase 2: v_comprehensive_employee_payroll 优化 ✅ 已完成

**优化成果**:
- [X] **创建优化视图**: `reports.v_comprehensive_employee_payroll_optimized`
- [X] **创建辅助视图**: `reports.v_personnel_hierarchy_simple` 
- [X] **性能分析**: 瓶颈识别完成 (递归CTE: 0.23ms, JSONB: 0.12ms, JOIN: 0.39ms)
- [X] **性能对比**: 平均提升 0.2% (中等样本+1.9%, 部门过滤+2.5%)
- [X] **动态字段**: 支持86个薪资组件 (65应发+21扣除)
- [X] **优化报告**: comprehensive_payroll_view_optimization_report_20250609_082239.json

**优化技术**:
- ✅ 分离递归CTE到独立辅助视图
- ✅ 优化JOIN顺序和索引利用
- ✅ JSONB字段访问优化
- ✅ 添加COALESCE防止NULL值
- ✅ 动态字段生成支持

### Phase 3: 下一步优化计划 📋

**优先级排序**:
1. **🔥 高优先级**: 
   - [ ] `v_payroll_component_usage` 物化视图优化 (33.30ms → 目标<5ms)
   
2. **📋 中优先级**:
   - [ ] `audit_overview` 缓存策略优化 (2.31ms → 目标<1ms)
   - [ ] 创建常用查询的物化视图
   
3. **📝 低优先级**:
   - [ ] 其他视图微调优化
   - [ ] 定期维护脚本

**技术策略**:
- 🔄 物化视图 + 定时刷新
- 📊 查询结果缓存
- 🔍 索引进一步优化
- 📈 监控和维护自动化

### 总体进度
- [X] **数据库索引优化** (已完成)
- [X] **核心视图性能分析** (已完成) 
- [X] **综合薪资视图优化** (已完成)
- [ ] **薪资组件使用统计优化** (下一步)
- [ ] **审计视图优化** (后续)
- [ ] **物化视图维护策略** (后续)
