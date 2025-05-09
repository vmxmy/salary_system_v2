import React, { useState } from 'react';
import { Modal, Radio, Checkbox, Button, Space, Typography, App } from 'antd';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ColumnConfig } from './ColumnSettingsDrawer';
import * as XLSX from 'xlsx';

const { Text, Title } = Typography;
const { Group: RadioGroup } = Radio;
const { Group: CheckboxGroup } = Checkbox;

interface ExportTableModalProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  data: any[];
  fileName?: string;
}

type ExportFormat = 'csv' | 'excel';

/**
 * 表格导出模态框组件，用于导出表格数据
 */
const ExportTableModal: React.FC<ExportTableModalProps> = ({
  open,
  onClose,
  columns,
  data,
  fileName = 'table-export',
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp(); // 使用 App.useApp() 钩子获取 message 实例
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(
    columns.filter(col => col.visible).map(col => col.key)
  );
  const [loading, setLoading] = useState(false);

  // 处理导出格式变更
  const handleFormatChange = (e: any) => {
    setExportFormat(e.target.value);
  };

  // 处理列选择变更
  const handleColumnSelectionChange = (checkedValues: string[]) => {
    setSelectedColumnKeys(checkedValues);
  };

  // 全选/取消全选
  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedColumnKeys(columns.map(col => col.key));
    } else {
      setSelectedColumnKeys([]);
    }
  };

  // 导出数据
  const handleExport = async () => {
    if (selectedColumnKeys.length === 0) {
      message.warning(t('exportTable.selectColumnsWarning'));
      return;
    }

    setLoading(true);

    try {
      // 使用 setTimeout 将耗时操作放到下一个事件循环中，避免阻塞 UI
      setTimeout(() => {
        try {
          // 筛选选中的列
          const selectedColumns = columns.filter(col => selectedColumnKeys.includes(col.key));

          // 准备导出数据 - 使用更高效的方式
          const exportData = [];
          const dataLength = data.length;
          const colLength = selectedColumns.length;

          // 预先创建列映射，避免在循环中重复计算
          const columnMappings = selectedColumns.map(col => ({
            dataIndex: col.dataIndex || col.key,
            title: typeof col.title === 'string' ? col.title : col.key
          }));

          // 分批处理数据，每批 1000 条
          const batchSize = 1000;
          for (let i = 0; i < dataLength; i += batchSize) {
            const endIndex = Math.min(i + batchSize, dataLength);

            for (let j = i; j < endIndex; j++) {
              const record = data[j];
              const row: Record<string, any> = {};

              for (let k = 0; k < colLength; k++) {
                const { dataIndex, title } = columnMappings[k];
                row[title] = record[dataIndex];
              }

              exportData.push(row);
            }
          }

          // 根据选择的格式导出
          if (exportFormat === 'csv') {
            exportToCSV(exportData, fileName);
          } else {
            exportToExcel(exportData, fileName);
          }

          message.success(t('exportTable.exportSuccess'));
          onClose();
        } catch (innerError) {
          console.error('Export processing failed:', innerError);
          message.error(t('exportTable.exportFailed'));
        } finally {
          setLoading(false);
        }
      }, 0);
    } catch (error) {
      console.error('Export failed:', error);
      message.error(t('exportTable.exportFailed'));
      setLoading(false);
    }
  };

  // 导出为CSV
  const exportToCSV = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

    // 创建Blob并下载
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 导出为Excel
  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // 写入并下载
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <Modal
      title={t('exportTable.title')}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={loading ? <LoadingOutlined /> : <DownloadOutlined />}
          onClick={handleExport}
          loading={loading}
          disabled={selectedColumnKeys.length === 0}
        >
          {t('exportTable.export')}
        </Button>,
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 导出格式选择 */}
        <div>
          <Title level={5}>{t('exportTable.format')}</Title>
          <RadioGroup value={exportFormat} onChange={handleFormatChange}>
            <Radio value="excel">Excel (.xlsx)</Radio>
            <Radio value="csv">CSV (.csv)</Radio>
          </RadioGroup>
        </div>

        {/* 列选择 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Title level={5}>{t('exportTable.selectColumns')}</Title>
            <Checkbox
              onChange={handleSelectAll}
              checked={selectedColumnKeys.length === columns.length}
              indeterminate={selectedColumnKeys.length > 0 && selectedColumnKeys.length < columns.length}
            >
              {t('exportTable.selectAll')}
            </Checkbox>
          </div>

          <CheckboxGroup
            options={columns.map(col => ({
              label: typeof col.title === 'string' ? col.title : col.key,
              value: col.key,
            }))}
            value={selectedColumnKeys}
            onChange={handleColumnSelectionChange}
          />
        </div>

        {/* 导出提示 */}
        <Text type="secondary">
          {t('exportTable.exportNote')}
        </Text>
      </Space>
    </Modal>
  );
};

export default ExportTableModal;
