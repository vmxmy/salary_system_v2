import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip } from 'antd';
import type { ButtonProps } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  PrinterOutlined
} from '@ant-design/icons';

interface TableActionButtonProps extends ButtonProps {
  actionType: 'edit' | 'delete' | 'add' | 'view' | 'upload' | 'download' | 'approve' | 'copy' | 'print';
  tooltipTitle?: string;
}

/**
 * 表格操作按钮组件，基于链接型样式，用于表格的操作列
 * 与员工档案页面风格一致的无背景透明按钮样式
 */
const TableActionButton: React.FC<TableActionButtonProps> = ({ 
  actionType, 
  tooltipTitle, 
  onClick,
  disabled,
  ...rest 
}) => {
  // 根据类型确定图标
  let icon;
  switch (actionType) {
    case 'edit':
      icon = <EditOutlined />;
      break;
    case 'delete':
      icon = <DeleteOutlined />;
      break;
    case 'add':
      icon = <PlusOutlined />;
      break;
    case 'view':
      icon = <EyeOutlined />;
      break;
    case 'upload':
      icon = <UploadOutlined />;
      break;
    case 'download':
      icon = <DownloadOutlined />;
      break;
    case 'approve':
      icon = <CheckCircleOutlined />;
      break;
    case 'copy':
      icon = <CopyOutlined />;
      break;
    case 'print':
      icon = <PrinterOutlined />;
      break;
    default:
      icon = <EditOutlined />;
  }

  // 如果没有提供tooltipTitle，根据actionType生成默认提示
  const { t } = useTranslation(['common', 'components']);

  const defaultTooltip: Record<TableActionButtonProps['actionType'], string> = {
    edit: 'common:button.edit',
    delete: 'common:button.delete',
    add: 'common:button.add',
    view: 'common:button.view',
    upload: 'common:button.upload',
    download: 'common:button.download',
    approve: 'common:button.approve',
    copy: 'common:button.copy',
    print: 'common:button.print',
  };
  
  const finalTooltipTitle = tooltipTitle || t(defaultTooltip[actionType]);
  
  // 如果是删除按钮，自动添加danger属性
  const isDanger = actionType === 'delete';
  
  // 为某些特定操作类型设置自定义颜色
  let customStyle = {};
  if (actionType === 'approve') {
    customStyle = { color: '#52c41a' }; // 使用Ant Design的成功色
  }

  return (
    <Tooltip title={finalTooltipTitle}>
      <Button
        type="link"
        icon={icon}
        onClick={onClick}
        disabled={disabled}
        danger={isDanger}
        style={customStyle}
        {...rest}
      />
    </Tooltip>
  );
};

export default TableActionButton; 