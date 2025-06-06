import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Space, Typography, Modal, message, App } from 'antd'; // `message` is directly imported for convenience, but `App.useApp().message` is also used. Using one consistent approach is better.
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import EnhancedProTable from './EnhancedProTable';
import type { EnhancedProTableProps } from './EnhancedProTable';
// 移除已删除的样式文件引用

const { Title } = Typography;

interface OrganizationManagementTableTemplateProps<T extends Record<string, any>> extends EnhancedProTableProps<T> {
  /** 页面标题 */
  pageTitle?: string;
  /** 添加按钮文本 */
  addButtonText?: string;
  /** 添加按钮点击事件 */
  onAddClick?: () => void;
  /** 是否显示添加按钮 */
  showAddButton?: boolean;
  /** 额外的自定义按钮 */
  extraButtons?: React.ReactNode[];
  /** 是否在页面顶部显示标题（默认false，只在工具栏显示） */
  showPageTitle?: boolean;
  /** 批量删除功能配置 */
  batchDelete?: {
    /** 是否启用批量删除 */
    enabled: boolean;
    /** 批量删除按钮文本 */
    buttonText: string;
    /** 确认对话框标题 */
    confirmTitle: string;
    /** 确认对话框内容 */
    confirmContent: string;
    /** 确认按钮文本 */
    confirmOkText: string;
    /** 取消按钮文本 */
    confirmCancelText: string;
    /** 批量删除处理函数 */
    onBatchDelete: (selectedKeys: React.Key[]) => Promise<void>;
    /** 成功消息 */
    successMessage: string;
    /** 失败消息 */
    errorMessage: string;
    /** 未选择项目时的警告消息 */
    noSelectionMessage: string;
  };
}

function OrganizationManagementTableTemplate<T extends Record<string, any>>({
  pageTitle,
  addButtonText,
  onAddClick,
  showAddButton = true,
  extraButtons = [],
  showPageTitle = false,
  batchDelete,
  // The following props are destructured but then passed directly to EnhancedProTable, which is fine.
  // enableAdvancedFeatures = true, // This is always true when passed to EnhancedProTable below
  // showToolbar = true, // This is always true when passed to EnhancedProTable below
  customToolbarButtons: existingCustomButtons, // Renamed to avoid shadowing
  // title, // This prop is passed as `pageTitle` to the EnhancedProTable's `title` prop
  rowSelection,
  ...tableProps
}: OrganizationManagementTableTemplateProps<T>) {

  const { modal } = App.useApp();
  const { t } = useTranslation('components'); // Assuming 'components' namespace for translations

  // 批量删除处理函数
  const handleBatchDelete = async () => {
    // Check if batchDelete is enabled and if there are selected items
    if (!batchDelete?.enabled || rowSelection === false || !rowSelection?.selectedRowKeys || rowSelection.selectedRowKeys.length === 0) {
      message.warning(batchDelete?.noSelectionMessage || t('table_template.no_selection_warning', 'Please select items to delete.'));
      return;
    }

    // Now, TypeScript knows rowSelection is not false and selectedRowKeys is not undefined
    const selectedKeys = rowSelection.selectedRowKeys; // Destructure here to satisfy TypeScript

    // Show confirmation modal
    modal.confirm({
      title: batchDelete.confirmTitle,
      content: batchDelete.confirmContent.replace('{count}', String(selectedKeys.length)),
      okText: batchDelete.confirmOkText,
      okType: 'danger',
      cancelText: batchDelete.confirmCancelText,
      onOk: async () => {
        try {
          await batchDelete.onBatchDelete(selectedKeys);
          message.success(batchDelete.successMessage.replace('{count}', String(selectedKeys.length)));
          // Optionally, clear row selection after successful deletion
          if (rowSelection && rowSelection.onChange) {
            // Corrected: Pass a valid type for the third argument
            rowSelection.onChange([], [], { type: 'none' }); 
          }
        } catch (error) {
          message.error(batchDelete.errorMessage);
        }
      },
    });
  };

  // Build custom toolbar buttons dynamically
  const customToolbarButtons: React.ReactNode[] = [];

  // Add primary add button
  if (showAddButton && onAddClick && addButtonText) {
    customToolbarButtons.push(
      <Button
        key="create"
        type="primary"
        icon={<PlusOutlined />}
        onClick={onAddClick}
        shape="round"
      >
        {addButtonText}
      </Button>
    );
  }

  // 批量删除按钮现在移到了行选择工具栏中，不在这里添加

  // Add any extra custom buttons provided
  if (extraButtons.length > 0) {
    customToolbarButtons.push(...extraButtons);
  }

  // Add any existing custom buttons passed from EnhancedProTable's props
  if (existingCustomButtons && existingCustomButtons.length > 0) {
    customToolbarButtons.push(...existingCustomButtons);
  }

  return (
    <>
      {showPageTitle && (
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>{pageTitle}</Title>
        </div>
      )}

      <EnhancedProTable<T>
        enableAdvancedFeatures={true} // Always true as per original logic
        showToolbar={true} // Always true as per original logic
        title={pageTitle} // Use pageTitle as the table's toolbar title
        customToolbarButtons={customToolbarButtons}
        rowSelection={rowSelection}
        tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => {
          // 自定义行选择工具栏右侧操作按钮
          const actions = [];
          
          // 添加批量删除按钮
          if (batchDelete?.enabled && selectedRowKeys && selectedRowKeys.length > 0) {
            actions.push(
              <Button
                key="batch-delete"
                type="link"
                danger
                size="small"
                onClick={handleBatchDelete}
              >
                {batchDelete.buttonText}
              </Button>
            );
          }
          
          // 添加取消选择按钮
          actions.push(
            <Button
              key="clear-selection"
              type="link"
              size="small"
              onClick={onCleanSelected}
            >
              {t('table_template.clear_selection', '取消选择')}
            </Button>
          );
          
          return actions;
        }}
        {...tableProps}
      />
    </>
  );
}

export default OrganizationManagementTableTemplate;
export type { OrganizationManagementTableTemplateProps };