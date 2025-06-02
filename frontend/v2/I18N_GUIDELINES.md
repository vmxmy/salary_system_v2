# i18n (国际化) 使用规则与最佳实践

本文档旨在为项目前端部分的国际化 (i18n) 提供一套统一的规则和最佳实践，以确保代码的可维护性、可读性和翻译工作的效率。本项目使用 `i18next`及其相关库。

## 1. 核心配置文件 (`frontend/v2/src/i18n.ts`)

当前的配置要点如下，请在后续开发中遵循：

*   **`keySeparator: '.'`**: 键分隔符。这意味着所有翻译 JSON 文件都**必须**使用**嵌套结构**。
*   **`nsSeparator: ':'`**: 命名空间分隔符。
*   **`returnObjects: false` (默认)**: `t()` 函数默认不返回对象。如果确实需要返回一个 JavaScript 对象或数组（而非字符串），必须在调用 `t()` 函数时明确传递选项 `{ returnObjects: true }`。
*   **`interpolation.escapeValue: false`**: 对于 React 项目是推荐设置，因为 React 默认会进行 XSS 转义。
*   **`debug: import.meta.env.DEV`**: 在开发模式下启用 i18next 的调试日志，有助于快速定位翻译问题。
*   **`fallbackLng`**: 配置了回退语言 (如 `zh-CN`, `en`)，确保在特定语言翻译缺失时，应用能优雅地显示备用语言的文本。
*   **`ns` (命名空间列表)** 和 **`defaultNS` (默认命名空间)**:
    *   所有项目中使用的命名空间都需要在 `ns` 数组中声明。
    *   `common` 通常作为默认命名空间 (`defaultNS`)，用于存放全局共享的翻译文本。

## 2. 翻译 Key 命名规范

*   **层级与结构**:
    *   推荐使用小写字母和下划线 `_` (snake_case) 来组织 key，以反映其在用户界面中的层级关系或功能归属。例如：
        *   页面级别: `login_page.form.username_label`, `user_profile.tabs.personal_info`
        *   组件级别: `confirmation_modal.title`, `status_tag.approved_text`
        *   通用操作/状态: `common_actions.save`, `common_status.active`, `common_errors.network_error`
*   **一致性**: 在整个项目中，Key 的命名风格（如蛇形命名法）应保持统一。
*   **清晰性**: Key 名称应尽可能清晰地表达其所代表内容的含义和上下文。
*   **长度适中**: 避免使用过长导致难以输入的 Key，或过短导致含义模糊不清的 Key。

## 3. 命名空间 (Namespaces)

*   **按功能/模块划分**: 将翻译资源按照应用的主要功能模块、页面或大型组件集来划分命名空间。例如：`auth`, `payroll`, `employee_management`, `admin_settings`, `dashboard_widgets`。
*   **`common` 命名空间**: 用于存放那些在应用中多个模块都可能共享的通用词汇，如“保存”、“取消”、“加载中...”、“错误”、“成功”等。
*   **加载命名空间**:
    *   在 React 组件中，使用 `useTranslation()` hook 来加载所需的命名空间。
    *   推荐同时加载组件特定的命名空间和 `common` 命名空间，例如: `const { t } = useTranslation(['my_feature_namespace', 'common']);` 这样可以优先从特定命名空间查找，找不到再从 `common` 查找。

## 4. 翻译 JSON 文件

*   **路径**: 翻译文件通常存放于 `/frontend/v2/public/locales/{lng}/{ns}.json` (例如, `/frontend/v2/public/locales/zh-CN/payroll.json`)。
*   **嵌套结构**: **必须**使用嵌套的 JSON 格式来组织翻译内容，以匹配 `keySeparator: '.'` 的配置。

    ```json
    // 正确示例 (嵌套结构 for payroll.json)
    {
      "page_title": "薪资管理",
      "runs_table": {
        "header_employee_name": "员工姓名",
        "header_status": "状态",
        "actions": {
          "view_details": "查看详情",
          "calculate": "计算"
        }
      },
      "status_enums": {
        "pending_calculation": "待计算",
        "approved": "已批准"
      }
    }
    ```

    ```json
    // 错误示例 (扁平结构, 会导致 'flat JSON' 警告)
    // {
    //   "page_title": "薪资管理",
    //   "runs_table.header_employee_name": "员工姓名",
    //   "runs_table.header_status": "状态",
    //   ...
    // }
    ```
*   **UTF-8 编码**: 确保所有 `.json` 翻译文件都以 UTF-8 编码保存。
*   **JSON 格式校验**: 务必确保 JSON 文件拥有严格正确的语法格式，避免因格式错误导致加载失败。

## 5. `t()` 函数使用指南

*   **基本用法**: `t('key_path')` 或 `t('namespace:key_path')`。
    *   如果 `useTranslation()` hook 加载了单个默认命名空间 (e.g., `useTranslation('payroll')`)，则可以直接使用 `t('runs_table.header_status')`。
    *   如果加载了多个命名空间或未指定默认，推荐使用带命名空间前缀的 key: `t('payroll:runs_table.header_status')`。
*   **返回对象/数组**:
    *   当翻译内容本身是一个需要作为 JavaScript 对象或数组在代码中处理的结构时（例如，一个包含多个相关状态文本的对象，供代码逻辑选择），必须使用:
        `t('my_complex_structure_key', { returnObjects: true })`
*   **插值 (Interpolation)**:
    *   JSON 定义: `"user_greeting": "你好, {{name}}! 你有 {{count}} 条未读消息。"`
    *   代码调用: `t('user_greeting', { name: userName, count: unreadMessages })`
*   **复数 (Plurals)**:
    *   遵循 i18next 的复数规则。Key 可以根据数量使用后缀 (e.g., `_one`, `_other`, `_zero`, 或语言特定的后缀)。
    *   JSON (英文示例):
        ```json
        "item_plural": "{{count}} item",
        "item_plural_plural": "{{count}} items"
        ```
    *   代码调用: `t('item_plural', { count: numberOfItems })`
*   **组件插值 (`<Trans>` 组件)**:
    *   对于包含 HTML 标签或 React 组件的复杂翻译内容，应使用 `<Trans>` 组件以确保安全和正确的渲染。
    *   示例: `<Trans i18nKey="terms_and_conditions_link">请阅读我们的<a href="/terms">服务条款</a>。</Trans>`
*   **避免在 `t()` 调用中动态拼接 Key 字符串**:
    *   尽量使用完整的、静态的 key 字符串传递给 `t()` 函数，这有利于静态分析工具（如 i18next-parser）正确提取 key。
    *   如果确实需要根据变量动态选择 key，优先考虑将变量作为插值参数传递，或者预先定义好所有可能的完整 key。
        *   **推荐**: `t(\`error_messages.code_${errorCode}\`, { defaultValue: t('error_messages.unknown') })` (前提是 `error_messages.code_404`, `error_messages.code_500` 等已在 JSON 中定义)
        *   **不推荐**: `t('error_messages.code_' + errorCode)` (可读性差，工具难解析)

## 6. 工具与流程

*   **i18next-parser**:
    *   强烈推荐在项目中配置和使用 `i18next-parser`。它可以扫描源代码，自动提取所有用作翻译 key 的字符串，并将其添加到对应的 JSON 翻译文件中。
    *   这能极大减少手动维护翻译文件的工作量，并防止遗漏新的 key。
*   **Linters (如 ESLint)**:
    *   考虑集成 ESLint 插件 (例如 `eslint-plugin-i18next`) 来帮助检查 `t()` 函数的用法是否正确、key 是否存在于翻译文件中等，从而在编码阶段就发现潜在问题。
*   **代码审查 (Code Review)**:
    *   在代码审查流程中，应特别关注与国际化相关的代码改动，确保新添加或修改的翻译 key 和用法都遵循上述规范。

## 7. 针对当前项目的特别建议

*   **全面检查现有 JSON 文件结构**: 虽然主要的 "flat JSON" 警告已消失，但建议团队抽时间系统性地检查项目中所有命名空间下的 `.json` 翻译文件，确保它们都统一为**嵌套结构**，以符合 `keySeparator: '.'` 的配置。
*   **审视并统一 Key 命名**: 逐步检查项目中现有的翻译 key，评估其是否符合上述的层级、清晰性和一致性原则。对于不规范的 key，应有计划地进行重构。
*   **处理 `TODO` 或硬编码文本**: 项目中任何遗留的硬编码用户可见文本都应尽快替换为通过 `t()` 函数获取的翻译。

通过遵循这些规则和实践，我们可以构建一个更加健壮、易于维护和扩展的国际化系统。