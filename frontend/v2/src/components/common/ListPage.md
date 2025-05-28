# ListPage 通用列表页面组件

## 📝 概述

`ListPage` 是一个高度可配置的通用列表页面组件，它抽象了所有列表页面的通用功能，包括数据展示、搜索、创建、编辑、删除等操作。通过简单的配置即可快速构建功能完整的列表页面。

## ✨ 特性

- 🔍 **智能搜索** - 支持基础搜索和高级搜索，可配置搜索字段
- 📊 **数据表格** - 基于 DataTable 组件，支持排序、筛选、导出等功能
- ➕ **CRUD 操作** - 内置创建、编辑、删除功能，支持模态框或页面跳转
- 🔐 **权限控制** - 细粒度的权限配置，控制各种操作的可见性
- 🌐 **国际化** - 完整的多语言支持
- 🎨 **高度可定制** - 支持自定义列、操作按钮、消息等
- 📱 **响应式设计** - 适配不同屏幕尺寸

## 🚀 快速开始

### 基础用法

```tsx
import React, { useMemo } from 'react';
import { ListPage } from '../../../components/common';
import type { ListPageConfig } from '../../../components/common';

const MyListPage: React.FC = () => {
  const config: ListPageConfig = useMemo(() => ({
    title: '数据列表',
    columns: [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      // 更多列配置...
    ],
    permissions: {
      canViewList: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    },
    service: {
      getList: async (query) => {
        // 获取数据的API调用
        const response = await api.getList(query);
        return { data: response.data, success: true };
      },
      create: async (data) => await api.create(data),
      delete: async (id) => await api.delete(id),
    },
  }), []);

  return <ListPage config={config} />;
};
```

## 📋 配置选项

### ListPageConfig

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | `string` | ✅ | 页面标题 |
| `description` | `string` | ❌ | 页面描述 |
| `columns` | `ProColumns<T>[]` | ✅ | 表格列配置 |
| `searchConfig` | `SearchFormConfig` | ❌ | 搜索表单配置 |
| `createFormConfig` | `ModalFormConfig` | ❌ | 创建表单配置 |
| `editFormConfig` | `ModalFormConfig` | ❌ | 编辑表单配置 |
| `permissions` | `ListPagePermissions` | ✅ | 权限配置 |
| `service` | `ListPageService` | ✅ | 服务接口 |
| `routes` | `ListPageRoutes` | ❌ | 路由配置 |
| `messages` | `ListPageMessages` | ❌ | 消息配置 |
| `deleteConfirm` | `DeleteConfirmConfig` | ❌ | 删除确认配置 |
| `tableConfig` | `object` | ❌ | 表格配置 |

### 权限配置 (ListPagePermissions)

```tsx
interface ListPagePermissions {
  canViewList?: boolean;    // 查看列表
  canViewDetail?: boolean;  // 查看详情
  canCreate?: boolean;      // 创建记录
  canUpdate?: boolean;      // 更新记录
  canDelete?: boolean;      // 删除记录
  canExport?: boolean;      // 导出数据
}
```

### 服务接口 (ListPageService)

```tsx
interface ListPageService<T, Q> {
  getList: (query: Q) => Promise<{ data: T[]; total?: number; success?: boolean }>;
  create?: (data: any) => Promise<T>;
  update?: (id: string | number, data: any) => Promise<T>;
  delete?: (id: string | number) => Promise<void>;
  export?: (format: ExportFormat, data: T[]) => Promise<void>;
}
```

## 🎯 完整示例

以下是员工列表页面的完整实现示例：

```tsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import { ListPage, StatusTag, LookupSelect } from '../../../components/common';
import type { ListPageConfig } from '../../../components/common';

const EmployeeListPage: React.FC = () => {
  const { t } = useTranslation(['employee', 'common']);
  const permissions = useEmployeePermissions();
  const { lookupMaps } = useLookupMaps();

  // 表格列配置
  const columns: ProColumns<Employee>[] = useMemo(() => [
    {
      title: t('employee:table.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: t('employee:table.department'),
      dataIndex: 'department_id',
      key: 'department',
      render: (_, record) => 
        lookupMaps?.departmentMap?.get(record.department_id) || '',
    },
    {
      title: t('employee:table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
  ], [t, lookupMaps]);

  // 页面配置
  const config: ListPageConfig<Employee, EmployeeQuery> = useMemo(() => ({
    title: t('employee:list.title'),
    description: t('employee:list.description'),
    columns,

    // 搜索配置
    searchConfig: {
      basicFields: [
        {
          name: 'keyword',
          label: t('common:search.keyword'),
          type: 'input',
          placeholder: t('employee:search.keyword_placeholder'),
          span: 8,
        },
        {
          name: 'department_id',
          label: t('employee:search.department'),
          type: 'custom',
          span: 8,
          render: () => (
            <LookupSelect
              lookupType="department"
              placeholder={t('common:placeholder.select')}
              allowClear
            />
          ),
        },
      ],
      showReset: true,
      showToggle: true,
    },

    // 创建表单配置
    createFormConfig: {
      fields: [
        {
          name: 'name',
          label: t('employee:form.name'),
          type: 'input',
          required: true,
          span: 12,
        },
        {
          name: 'department_id',
          label: t('employee:form.department'),
          type: 'custom',
          required: true,
          span: 12,
          render: () => (
            <LookupSelect
              lookupType="department"
              placeholder={t('common:placeholder.select')}
            />
          ),
        },
      ],
      titles: {
        create: t('employee:create.title'),
      },
      width: 600,
    },

    // 权限配置
    permissions,

    // 服务接口
    service: {
      getList: async (query) => {
        const response = await employeeService.getEmployees(query);
        return { data: response.data || [], success: true };
      },
      create: async (data) => await employeeService.createEmployee(data),
      delete: async (id) => await employeeService.deleteEmployee(String(id)),
    },

    // 路由配置
    routes: {
      detail: '/employees/:id',
      edit: '/employees/:id/edit',
    },

    // 消息配置
    messages: {
      createSuccess: t('employee:message.create_success'),
      deleteSuccess: t('employee:message.delete_success'),
    },

    // 表格配置
    tableConfig: {
      showIndex: true,
      showSelection: true,
      bordered: true,
      toolbar: {
        showRefresh: true,
        showExport: true,
        showColumnSetting: true,
      },
    },

    // 查询转换
    transformQuery: (params) => ({
      page: 1,
      size: 20,
      ...params,
    }),

    // 记录标识
    getRecordId: (record) => record.id,
    getRecordName: (record) => record.name,
  }), [t, columns, permissions, lookupMaps]);

  return <ListPage<Employee, EmployeeQuery> config={config} />;
};

export default EmployeeListPage;
```

## 🔧 高级配置

### 自定义操作按钮

```tsx
const config: ListPageConfig = {
  // ... 其他配置
  customActions: (record) => (
    <Button
      type="link"
      size="small"
      onClick={() => handleCustomAction(record)}
    >
      自定义操作
    </Button>
  ),
  extraActions: (
    <Button type="primary" icon={<DownloadOutlined />}>
      批量导入
    </Button>
  ),
};
```

### 自定义消息

```tsx
const config: ListPageConfig = {
  // ... 其他配置
  messages: {
    getListFailed: '获取数据失败，请重试',
    createSuccess: '创建成功！',
    deleteSuccess: '删除成功！',
    exportSuccess: '导出完成！',
  },
};
```

### 删除确认自定义

```tsx
const config: ListPageConfig = {
  // ... 其他配置
  deleteConfirm: {
    title: '确认删除',
    content: '删除后无法恢复，确定要删除吗？',
    okText: '确定删除',
    cancelText: '取消',
  },
};
```

## 🎨 样式定制

```tsx
<ListPage
  config={config}
  style={{ padding: '24px' }}
  className="custom-list-page"
/>
```

## 📚 相关组件

- [DataTable](./DataTable.md) - 数据表格组件
- [SearchForm](./SearchForm.md) - 搜索表单组件
- [ModalForm](./ModalForm.md) - 模态框表单组件
- [LookupSelect](./LookupSelect.md) - 查找值选择器
- [StatusTag](./StatusTag.md) - 状态标签组件

## 🤝 最佳实践

1. **配置复用** - 将常用的配置抽取为 hooks 或工具函数
2. **类型安全** - 使用 TypeScript 泛型确保类型安全
3. **权限控制** - 合理配置权限，确保安全性
4. **性能优化** - 使用 useMemo 缓存配置对象
5. **错误处理** - 在服务接口中添加适当的错误处理
6. **国际化** - 所有文本都应该支持国际化

## 🔄 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🎯 支持完整的 CRUD 操作
- 🔍 集成搜索功能
- �� 权限控制系统
- 🌐 国际化支持
