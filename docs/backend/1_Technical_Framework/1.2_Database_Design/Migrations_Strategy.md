# 数据库迁移策略

## 1. 迁移工具

- **Alembic:** (版本号)
  - 描述：一个轻量级的数据库迁移工具，与 SQLAlchemy 配合使用。
  - 选型原因：集成良好，功能强大，社区支持广泛。

## 2. 迁移流程

1.  **环境初始化:**
    ```bash
    # 初始化 Alembic 环境 (通常在项目早期执行一次)
    # alembic init alembic # (此处的 alembic 是指存放迁移脚本的目录名)
    ```
    - 修改 `alembic.ini` 配置文件，设置数据库连接等。
    - 修改 `env.py` 文件，使其能够识别项目中的数据模型 (SQLAlchemy models)。

2.  **生成迁移脚本:**
    - 当数据模型发生变更后，自动生成迁移脚本：
      ```bash
      alembic revision -m " descriptive_message_for_the_change "
      ```
    - 手动编辑生成的迁移脚本，确保 `upgrade()` 和 `downgrade()` 函数正确实现了 schema 的变更。

3.  **应用迁移:**
    ```bash
    # 应用所有未应用的迁移到最新版本
    alembic upgrade head
    
    # 回滚到上一个版本
    # alembic downgrade -1
    
    # 查看当前数据库版本
    # alembic current
    ```

## 3. 最佳实践

- 迁移脚本应尽可能原子化，一个脚本对应一个逻辑变更。
- 编写清晰的迁移消息 (revision message)。
- 在开发和测试环境中充分测试迁移脚本。
- 对于生产环境的迁移，制定详细的回滚计划。
- 避免在迁移脚本中进行数据迁移操作，如果需要，请创建单独的数据迁移脚本或程序。

*此文档可参考 `docs/v2/alembc 脚本.md`。* 