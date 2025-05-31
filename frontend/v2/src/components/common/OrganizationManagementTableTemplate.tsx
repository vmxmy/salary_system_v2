import React from 'react';
import { Button, Space, Typography, Modal, message, App } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import EnhancedProTable from './EnhancedProTable';
import type { EnhancedProTableProps } from './EnhancedProTable';
import pageStyles from '../../pages/Admin/Organization/PersonnelCategoriesPage.module.less';

const { Title } = Typography;

interface OrganizationManagementTableTemplateProps<T extends Record<string, any>> extends EnhancedProTableProps<T> {
  /** 页面标题 */
  pageTitle: string;
  /** 添加按钮文本 */
  addButtonText: string;
  /** 添加按钮点击事件 */
  onAddClick: () => void;
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
  enableAdvancedFeatures = true,
  showToolbar = true,
  customToolbarButtons: existingCustomButtons,
  title,
  rowSelection,
  ...tableProps
}: OrganizationManagementTableTemplateProps<T>) {
  
  const { modal } = App.useApp();
  
  // 批量删除处理函数
  const handleBatchDelete = async () => {
    if (!batchDelete || !rowSelection?.selectedRowKeys || rowSelection.selectedRowKeys.length === 0) {
      message.warning(batchDelete?.noSelectionMessage || {t('components:auto_text_e8afb7')});
      return;
    }

    modal.confirm({
      title: batchDelete.confirmTitle,
      content: batchDelete.confirmContent.replace('{count}', String(rowSelection.selectedRowKeys.length)),
      okText: batchDelete.confirmOkText,
      okType: 'danger',
      cancelText: batchDelete.confirmCancelText,
      onOk: async () => {
        try {
          await batchDelete.onBatchDelete(rowSelection.selectedRowKeys);
          message.success(batchDelete.successMessage.replace('{count}', String(rowSelection.selectedRowKeys.length)));
        } catch (error) {
          message.error(batchDelete.errorMessage);
          console.error('Batch delete failed:', error);
        }
      },
    });
  };

  // 构建自定义工具栏按钮
  const customToolbarButtons = [];
  
  // 添加主要的新增按钮
  if (showAddButton) {
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
  
  // 添加批量删除按钮
  if (batchDelete?.enabled && rowSelection?.selectedRowKeys && rowSelection.selectedRowKeys.length > 0) {
    customToolbarButtons.push(
      <Button
        key="batch-delete"
        danger
        icon={<DeleteOutlined />}
        onClick={handleBatchDelete}
        shape="round"
      >
        {batchDelete.buttonText.replace('{count}', String(rowSelection.selectedRowKeys.length))}
      </Button>
    );
  }
  
  // 添加额外的自定义按钮
  if (extraButtons.length > 0) {
    customToolbarButtons.push(...extraButtons);
  }
  
  // 添加已存在的自定义按钮
  if (existingCustomButtons && existingCustomButtons.length > 0) {
    customToolbarButtons.push(...existingCustomButtons);
  }

  return (
    <>
      {showPageTitle && (
        <div className={pageStyles.sectionHeader}>
          <Title level={3} className={pageStyles.sectionHeaderTitle}>{pageTitle}</Title>
        </div>
      )}
      
      <EnhancedProTable<T>
        enableAdvancedFeatures={true}
        showToolbar={true}
        title={pageTitle}
        customToolbarButtons={customToolbarButtons}
        rowSelection={rowSelection}
        {...tableProps}
      />
    </>
  );
}

export default OrganizationManagementTableTemplate;
export type { OrganizationManagementTableTemplateProps }; 