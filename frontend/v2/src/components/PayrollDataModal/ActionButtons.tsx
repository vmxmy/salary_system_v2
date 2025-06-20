import React from 'react';
import { Button, Space, message } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  BookOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import TableActionButton from '../common/TableActionButton';
import type { ComprehensivePayrollDataView } from '../../pages/Payroll/services/payrollViewsApi';

// 工资数据类型定义
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number;
}

// 表格行操作按钮组件属性
interface TableRowActionsProps {
  record: PayrollData;
  onViewDetail: (record: PayrollData) => void;
  onEdit: (record: PayrollData) => void;
  onDelete?: (record: PayrollData) => void;
}

// 表格行操作按钮组件
export const TableRowActions: React.FC<TableRowActionsProps> = ({
  record,
  onViewDetail,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation(['payroll', 'common']);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(record);
    } else {
      console.log('🗑️ [删除操作] 删除记录:', record);
      message.warning('删除功能开发中...');
    }
  };

  return (
    <Space size="small">
      <TableActionButton
        icon={<EyeOutlined />}
        onClick={() => onViewDetail(record)}
        tooltipTitle={t('common:button.view')}
        actionType="view"
      />
      <TableActionButton
        icon={<EditOutlined />}
        onClick={() => onEdit(record)}
        tooltipTitle={t('common:button.edit')}
        actionType="edit"
      />
      <TableActionButton
        icon={<DeleteOutlined />}
        onClick={handleDelete}
        tooltipTitle={t('common:button.delete')}
        actionType="delete"
      />
    </Space>
  );
};

// 工具栏操作按钮组件属性
interface ToolbarActionsProps {
  dataCount: number;
  onExport: () => void;
  onOpenPresets: () => void;
  onRefresh: () => void;
  isExporting?: boolean;
  isRefreshing?: boolean;
}

// 工具栏操作按钮生成函数
export const ToolbarActions = ({
  dataCount,
  onExport,
  onOpenPresets,
  onRefresh,
  isExporting = false,
  isRefreshing = false
}: ToolbarActionsProps): React.ReactNode[] => {
  return [
    <Button
      key="export"
      type="primary"
      icon={<DownloadOutlined />}
      onClick={onExport}
      disabled={dataCount === 0}
      loading={isExporting}
    >
      导出Excel ({dataCount})
    </Button>,
    <Button 
      key="presets" 
      icon={<BookOutlined />} 
      onClick={onOpenPresets}
    >
      预设报表管理
    </Button>,
    <Button
      key="refresh"
      icon={<ReloadOutlined />}
      onClick={onRefresh}
      loading={isRefreshing}
      title="刷新"
    >
      刷新
    </Button>
  ];
};

// 批量操作栏属性
interface BatchActionsProps {
  selectedRowKeys: React.Key[];
  selectedRows: PayrollData[];
  onCleanSelected: () => void;
  onBatchDelete?: (keys: React.Key[]) => void;
  onBatchExport?: (rows: PayrollData[]) => void;
}

// 批量操作提示渲染
export const BatchActionsAlert: React.FC<Pick<BatchActionsProps, 'selectedRowKeys' | 'selectedRows'>> = ({
  selectedRowKeys,
  selectedRows
}) => {
  if (selectedRowKeys.length === 0) return null;

  // 计算统计信息
  const totalGross = selectedRows.reduce((sum, row) => {
    const value = row.应发合计;
    const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
    return sum + (isNaN(numValue) ? 0 : numValue);
  }, 0);

  const totalNet = selectedRows.reduce((sum, row) => {
    const value = row.实发合计;
    const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
    return sum + (isNaN(numValue) ? 0 : numValue);
  }, 0);

  return (
    <div>
      已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 项
      &nbsp;&nbsp;
      <span>
        应发合计: ¥{totalGross.toFixed(2)}
        &nbsp;&nbsp;
        实发合计: ¥{totalNet.toFixed(2)}
      </span>
    </div>
  );
};

// 批量操作选项渲染
export const BatchActionsOptions: React.FC<BatchActionsProps> = ({
  selectedRowKeys,
  selectedRows,
  onCleanSelected,
  onBatchDelete,
  onBatchExport
}) => {
  const { t } = useTranslation(['payroll', 'common']);

  const handleBatchDelete = () => {
    if (onBatchDelete) {
      onBatchDelete(selectedRowKeys);
    } else {
      console.log('批量删除选中的记录:', selectedRowKeys);
      message.warning('批量删除功能开发中...');
    }
  };

  const handleBatchExport = () => {
    if (onBatchExport) {
      onBatchExport(selectedRows);
    } else {
      message.info('批量导出功能开发中...');
    }
  };

  return (
    <Space>
      <a 
        onClick={handleBatchDelete}
        style={{ color: '#ff4d4f' }}
      >
        批量删除
      </a>
      <a onClick={handleBatchExport}>
        批量导出
      </a>
      <a onClick={onCleanSelected}>
        取消选择
      </a>
    </Space>
  );
};

// 模态框底部按钮属性
interface ModalFooterActionsProps {
  onClose: () => void;
  extraActions?: React.ReactNode[];
}

// 模态框底部按钮组件
export const ModalFooterActions: React.FC<ModalFooterActionsProps> = ({
  onClose,
  extraActions = []
}) => {
  const { t } = useTranslation(['common']);

  return [
    ...extraActions,
    <Button key="close" onClick={onClose}>
      {t('common:button.close')}
    </Button>
  ];
};

// 导出所有组件的默认导出
export default {
  TableRowActions,
  ToolbarActions,
  BatchActionsAlert,
  BatchActionsOptions,
  ModalFooterActions
};