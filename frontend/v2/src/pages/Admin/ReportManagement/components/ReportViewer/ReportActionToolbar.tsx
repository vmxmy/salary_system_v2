import React from 'react';
import { Button, Space, Dropdown } from 'antd';
import {
  FilterOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  TableOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';
import type { ReportActionToolbarProps } from './types';

const ReportActionToolbar: React.FC<ReportActionToolbarProps> = ({
  selectedTemplate,
  reportData,
  onFilter,
  onExport,
  onPrint,
  onShare,
  isMobile = false
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);

  // 导出菜单项
  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Excel',
      onClick: () => onExport('excel'),
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'PDF',
      onClick: () => onExport('pdf'),
    },
    {
      key: 'csv',
      icon: <TableOutlined />,
      label: 'CSV',
      onClick: () => onExport('csv'),
    },
  ];

  // 如果没有选中模板或数据，不显示工具栏
  if (!selectedTemplate || !reportData) {
    return null;
  }

  return (
    <Space wrap size={isMobile ? 'small' : 'middle'}>
      <Button
        icon={<FilterOutlined />}
        onClick={onFilter}
        size={isMobile ? 'small' : 'middle'}
      >
        {t('filter', '筛选')}
      </Button>
      
      <Dropdown menu={{ items: exportMenuItems }}>
        <Button 
          icon={<DownloadOutlined />}
          size={isMobile ? 'small' : 'middle'}
        >
          {t('export', '导出')}
        </Button>
      </Dropdown>
      
      {!isMobile && (
        <Button
          icon={<PrinterOutlined />}
          onClick={onPrint}
          size="middle"
        >
          {t('print', '打印')}
        </Button>
      )}
      
      <Button
        icon={<ShareAltOutlined />}
        onClick={onShare}
        size={isMobile ? 'small' : 'middle'}
      >
        {t('share', '分享')}
      </Button>
    </Space>
  );
};

export default ReportActionToolbar; 