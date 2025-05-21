# UI组件使用指南

## 通用组件

### TableActionButton 表格操作按钮组件

`TableActionButton` 是一个用于表格操作列的标准按钮组件，提供了统一的表格操作按钮风格。

#### 示例用法

```tsx
import TableActionButton from '../../../components/common/TableActionButton';

// 在表格操作列中使用
{
  title: '操作',
  key: 'actions',
  render: (_, record) => (
    <Space size="small">
      <TableActionButton 
        actionType="view" 
        tooltipTitle="查看详情" 
        onClick={() => handleView(record)} 
      />
      <TableActionButton 
        actionType="edit" 
        tooltipTitle="编辑" 
        onClick={() => handleEdit(record)} 
      />
      <Popconfirm
        title="确认删除？"
        onConfirm={() => handleDelete(record.id)}
      >
        <TableActionButton 
          actionType="delete" 
          tooltipTitle="删除" 
          danger 
        />
      </Popconfirm>
    </Space>
  )
}
```

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|-------|------|------|-------|------|
| actionType | string | 是 | - | 按钮类型，决定显示的图标 |
| tooltipTitle | string | 否 | 根据actionType自动选择 | 鼠标悬停时显示的提示文本 |
| onClick | function | 否 | - | 点击事件处理函数 |
| disabled | boolean | 否 | false | 是否禁用 |
| danger | boolean | 否 | 当actionType为delete时自动为true | 是否显示为危险按钮(红色) |

#### 支持的actionType类型

| actionType | 图标 | 默认提示文本 | 说明 |
|------------|-----|-------------|------|
| edit | EditOutlined | 编辑 | 编辑操作 |
| delete | DeleteOutlined | 删除 | 删除操作，自动应用danger样式 |
| add | PlusOutlined | 添加 | 添加操作 |
| view | EyeOutlined | 查看详情 | 查看详情操作 |
| upload | UploadOutlined | 上传 | 上传操作 |
| download | DownloadOutlined | 下载 | 下载操作 |
| approve | CheckCircleOutlined | 审批 | 审批操作，使用绿色 |
| copy | CopyOutlined | 复制 | 复制操作 |
| print | PrinterOutlined | 打印 | 打印操作 |

#### 特点

- 统一风格：使用 `type="link"` 样式，无背景透明按钮
- 纯图标：只显示图标，没有文本内容
- 自动提示：通过Tooltip提供交互提示
- 自动图标：根据actionType自动选择合适的图标
- 自动danger：当actionType为delete时自动应用danger样式 