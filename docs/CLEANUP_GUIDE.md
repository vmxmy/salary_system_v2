# 项目清理指南

本文档提供了关于如何清理项目中的临时文件、日志文件、缓存文件和其他不必要文件的指导。

## 自动清理

项目提供了一个自动清理脚本，可以帮助您清理项目中的临时文件和不必要的文件。

### 使用清理脚本

```bash
# 运行清理脚本（交互模式）
./scripts/cleanup.sh

# 自动确认所有操作
./scripts/cleanup.sh -y

# 仅显示将要删除的文件，不实际删除
./scripts/cleanup.sh -n

# 显示帮助信息
./scripts/cleanup.sh -h
```

### 清理脚本会删除的文件

1. **临时文件和日志文件**
   - `temp_run_backend.sh` - 临时脚本文件，由启动脚本生成
   - `temp_run_backend_clean.sh` - 临时脚本文件，由启动脚本生成
   - `frontend.log` - 前端日志文件
   - `frontend-clean.log` - 前端清理模式日志文件
   - `.DS_Store` 和 `memory-bank/.DS_Store` - macOS系统生成的文件

2. **备份和历史文件**
   - `webapp/main.py.bak` - 主应用程序文件的备份

3. **编译的Python缓存文件**
   - 所有 `__pycache__` 目录和 `.pyc` 文件 - 这些是Python编译的缓存文件

4. **空目录**
   - `webapp/import_modules` - 空目录
   - `frontend/salary-viewer/src/components/charts` - 空目录

## 手动清理

如果您想手动清理项目，可以使用以下命令：

### 清理Python缓存文件

```bash
# 删除所有__pycache__目录
find . -type d -name "__pycache__" -exec rm -rf {} +

# 删除所有.pyc文件
find . -type f -name "*.pyc" -exec rm -f {} +
```

### 清理临时文件和日志文件

```bash
# 删除临时脚本文件
rm -f temp_run_backend.sh temp_run_backend_clean.sh

# 删除日志文件
rm -f frontend.log frontend-clean.log

# 删除macOS系统生成的文件
find . -name ".DS_Store" -exec rm -f {} +
```

### 清理备份和历史文件

```bash
# 删除备份文件
rm -f webapp/main.py.bak

# 删除其他备份文件
find . -name "*.bak" -o -name "*.backup" -o -name "*.old" -exec rm -f {} +
```

## 防止生成不必要的文件

为了防止项目中生成不必要的文件，您可以采取以下措施：

1. **添加.gitignore规则**

   确保项目的`.gitignore`文件包含以下规则：

   ```
   # Python缓存文件
   __pycache__/
   *.py[cod]
   *$py.class

   # 日志文件
   *.log

   # 临时文件
   temp_*
   *.tmp

   # macOS系统文件
   .DS_Store
   .AppleDouble
   .LSOverride

   # 编辑器临时文件
   *.swp
   *.swo
   *~
   ```

2. **定期清理**

   定期运行清理脚本，保持项目的整洁：

   ```bash
   ./scripts/cleanup.sh -y
   ```

3. **使用pre-commit钩子**

   您可以设置Git pre-commit钩子，在提交代码前自动清理项目：

   ```bash
   # 在.git/hooks/pre-commit中添加
   #!/bin/bash
   ./scripts/cleanup.sh -y
   ```

## 注意事项

- 清理脚本不会删除任何源代码文件或配置文件。
- 如果您不确定某个文件是否可以删除，请使用`-n`选项运行脚本，查看将要删除的文件列表。
- 如果您添加了新的临时文件或备份文件模式，请更新清理脚本。
