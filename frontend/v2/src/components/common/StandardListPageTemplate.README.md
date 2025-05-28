# StandardListPageTemplate 使用指南

## 概述

`StandardListPageTemplate` 是基于员工列表页面 (`EmployeeListPage.tsx`) 的设计严格创建的通用列表页面模板。它保持了原页面的所有布局、样式、控件和组件设计，可以直接套用到其他列表页面上。

## 特性

✅ **完全基于 EmployeeListPage 设计**
- 严格遵循原页面的布局结构
- 保持相同的样式和控件配置
- 使用相同的组件和交互模式

✅ **内置功能**
- 数据表格展示（基于 OrganizationManagementTableTemplate）
- 搜索和过滤功能
- 排序功能
- 分页功能
- 导出Excel功能（带日期时间文件名）
- 批量删除功能
- 权限控制
- 国际化支持

✅ **高度可配置**
- 灵活的列配置
- 自定义权限设置
- 可配置的删除确认对话框
- 可选的批量操作
- 自定义导出设置

## 使用方法

### 1. 基本用法

```tsx
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';

const MyListPage: React.FC = () => {
  // ... 你的状态和逻辑

  return (
    <StandardListPageTemplate<MyDataType>
      translationNamespaces={['myModule', 'common']}
      pageTitleKey="myModule:list_page.title"
      addButtonTextKey="myModule:list_page.add_button"
      dataSource={dataSource}
      loadingData={loadingData}
      permissions={permissions}
      lookupMaps={lookupMaps}
      loadingLookups={loadingLookups}
      errorLookups={errorLookups}
      fetchData={fetchData}
      deleteItem={deleteItem}
      onAddClick={handleAddClick}
      onEditClick={handleEditClick}
      onViewDetailsClick={handleViewDetailsClick}
      generateTableColumns={generateTableColumns}
      deleteConfirmConfig={deleteConfirmConfig}
      exportConfig={exportConfig}
      lookupErrorMessageKey="myModule:message.load_aux_data_failed"
      lookupLoadingMessageKey="myModule:message.loading_lookups"
      lookupDataErrorMessageKey="myModule:message.lookup_data_error"
    />
  );
};
```

### 2. 必需的配置

#### 数据类型定义
```tsx
interface MyDataType {
  id: string;
  name: string;
  // ... 其他字段
}
```

#### 权限配置
```tsx
const permissions = {
  canViewList: true,
  canViewDetail: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canExport: true,
};
```

#### 表格列配置生成函数
```tsx
const generateTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof MyDataType) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (item: MyDataType) => void,
  onDelete: (id: string) => void,
  onViewDetails: (id: string) => void
): ProColumns<MyDataType>[] => {
  return [
    {
      title: t('myModule:table.column.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: stringSorter<MyDataType>('name'),
      ...getColumnSearch('name'),
    },
    // ... 其他列配置
    {
      title: t('common:table.column.action'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: string, record: MyDataType) => (
        <Space size="small">
          {permissions.canViewDetail && (
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(record.id)} 
              tooltipTitle={t('common:action.view')} 
            />
          )}
          {permissions.canUpdate && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(record)} 
              tooltipTitle={t('common:action.edit')} 
            />
          )}
          {permissions.canDelete && (
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(record.id)} 
              tooltipTitle={t('common:action.delete')} 
            />
          )}
        </Space>
      ),
    },
  ];
};
```

### 3. 配置选项

#### 删除确认配置
```tsx
const deleteConfirmConfig = {
  titleKey: 'myModule:delete_confirm.title',
  contentKey: 'myModule:delete_confirm.content',
  okTextKey: 'myModule:delete_confirm.ok_text',
  cancelTextKey: 'myModule:delete_confirm.cancel_text',
  successMessageKey: 'myModule:message.delete_success',
  errorMessageKey: 'myModule:message.delete_failed',
};
```

#### 批量删除配置（可选）
```tsx
const batchDeleteConfig = {
  enabled: true,
  buttonText: '批量删除 ({count})',
  confirmTitle: '确认批量删除',
  confirmContent: '确定要删除选中的 {count} 个项目吗？此操作不可撤销。',
  confirmOkText: '确定删除',
  confirmCancelText: '取消',
  successMessage: '成功删除 {count} 个项目',
  errorMessage: '批量删除失败',
  noSelectionMessage: '请选择要删除的项目',
};
```

#### 导出配置
```tsx
const exportConfig = {
  filenamePrefix: '我的数据',
  sheetName: '数据列表',
  buttonText: '导出Excel',
  successMessage: '数据导出成功',
};
```

### 4. 事件处理函数

```tsx
const handleAddClick = () => {
  navigate('/my-module/new');
};

const handleEditClick = (item: MyDataType) => {
  navigate(`/my-module/${item.id}/edit`, { state: { itemData: item } });
};

const handleViewDetailsClick = (id: string) => {
  navigate(`/my-module/${id}`);
};

const fetchData = useCallback(async () => {
  setLoadingData(true);
  try {
    const response = await myService.getItems();
    if (response && response.data) {
      setDataSource(response.data);
    } else {
      setDataSource([]);
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
    setDataSource([]);
  } finally {
    setLoadingData(false);
  }
}, []);

const deleteItem = useCallback(async (id: string) => {
  await myService.deleteItem(id);
}, []);
```

## 属性说明

| 属性名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `translationNamespaces` | `string[]` | ✅ | 翻译命名空间数组 |
| `pageTitleKey` | `string` | ✅ | 页面标题翻译键 |
| `addButtonTextKey` | `string` | ✅ | 新增按钮文本翻译键 |
| `dataSource` | `T[]` | ✅ | 数据源 |
| `loadingData` | `boolean` | ✅ | 数据加载状态 |
| `permissions` | `object` | ✅ | 权限配置对象 |
| `lookupMaps` | `any` | ✅ | 查找映射数据 |
| `loadingLookups` | `boolean` | ✅ | 查找数据加载状态 |
| `errorLookups` | `any` | ✅ | 查找数据错误 |
| `fetchData` | `() => Promise<void>` | ✅ | 数据获取函数 |
| `deleteItem` | `(id: string) => Promise<void>` | ✅ | 删除项目函数 |
| `onAddClick` | `() => void` | ✅ | 新增按钮点击处理 |
| `onEditClick` | `(item: T) => void` | ✅ | 编辑按钮点击处理 |
| `onViewDetailsClick` | `(id: string) => void` | ✅ | 查看详情按钮点击处理 |
| `generateTableColumns` | `function` | ✅ | 表格列配置生成函数 |
| `deleteConfirmConfig` | `object` | ✅ | 删除确认对话框配置 |
| `exportConfig` | `object` | ✅ | 导出配置 |
| `batchDeleteConfig` | `object` | ❌ | 批量删除配置（可选） |
| `rowKey` | `string` | ❌ | 行键字段名（默认: 'id'） |

## 注意事项

1. **严格遵循原设计**：模板完全基于 `EmployeeListPage.tsx` 的设计，不要随意修改核心结构
2. **类型安全**：确保传入的数据类型与泛型参数一致
3. **权限控制**：根据实际业务需求配置权限对象
4. **国际化**：确保所有翻译键都已在对应的语言文件中定义
5. **查找数据**：如果页面不需要查找数据，可以传入空对象或 null

## 完整示例

参考 `StandardListPageTemplate.example.tsx` 文件查看完整的使用示例。 