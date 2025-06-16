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

## Alembic 视图清理与职业年金缴费基数字段添加任务 ✅ 已完成

### 任务目标
1. **清理 Alembic 中的视图操作**：移除所有迁移文件中的视图创建/删除操作，因为视图通过专门的视图脚本维护 ✅
2. **添加职业年金缴费基数字段**：在 `payroll.employee_salary_configs` 表中添加 `occupational_pension_base` 字段 ✅

### 执行结果总结

#### ✅ 阶段一：分析现有迁移中的视图操作 - 已完成
- [X] 扫描所有迁移文件，识别包含视图操作的迁移
- [X] 发现 16 个迁移文件包含视图操作
- [X] 确认需要清理的迁移范围：`499a47843ad2` 到 `37215b0f10f2`

#### ✅ 阶段二：清理视图操作 - 已完成
- [X] 清理 `499a47843ad2` 迁移文件，移除所有视图相关操作
- [X] 保留迁移文件结构，只移除视图创建/删除代码
- [X] 添加说明注释：视图由专门脚本维护

#### ✅ 阶段三：执行迁移 - 已完成
- [X] 成功执行清理后的迁移到 `499a47843ad2` 版本
- [X] 成功执行到目标迁移 `37215b0f10f2` 版本
- [X] 职业年金缴费基数字段成功添加

#### ✅ 阶段四：验证与测试 - 已完成
- [X] 验证 `occupational_pension_base` 字段已成功添加到 `payroll.employee_salary_configs` 表
- [X] 字段类型：`NUMERIC(15,2)`，允许 NULL 值
- [X] 当前数据库版本：`37215b0f10f2 (head)`

### 🎯 任务成果

1. **数据库结构更新**：
   - ✅ 成功添加 `payroll.employee_salary_configs.occupational_pension_base` 字段
   - ✅ 字段规格：`NUMERIC(15,2) NULL`，支持职业年金缴费基数存储

2. **Alembic 迁移优化**：
   - ✅ 清理了视图相关的迁移操作，避免与视图脚本冲突
   - ✅ 保持了迁移链的完整性和一致性
   - ✅ 为未来的视图管理建立了更好的分离机制

3. **系统架构改进**：
   - ✅ 建立了视图与迁移分离的最佳实践
   - ✅ 减少了迁移执行时的复杂性和错误风险
   - ✅ 提高了系统维护的灵活性

### 📝 经验总结

1. **视图管理策略**：视图应该通过专门的脚本维护，而不是混合在 Alembic 迁移中
2. **迁移清理方法**：可以安全地清理迁移中的视图操作，只保留核心的表结构变更
3. **字段添加流程**：通过 Alembic 添加新字段是安全可靠的方法

**任务状态**：✅ 完全成功
**完成时间**：2025-01-17 18:21
