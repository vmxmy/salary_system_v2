import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ProTable } from '@ant-design/pro-components';
import { Card, Typography, Row, Col, Space, Button, Dropdown, Menu, message, Divider, Tooltip } from 'antd';
import type { ProColumns, ProTableProps, ActionType } from '@ant-design/pro-components';
import type { ColumnsType } from 'antd/es/table';
import {
  PrinterOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTableExport } from './TableUtils';

const { Title, Text } = Typography;

const ReportContainer = styled.div`
  .report-header {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 16px;
  }

  .report-content {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .description-list {
    list-style: none;
    padding: 0;
    margin: 8px 0;
    
    li {
      margin: 4px 0;
      color: #666;
      font-size: 14px;
    }
  }

  .toolbar-button {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    
    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
  }
`;

// 导出格式枚举
export type ExportFormat = 'excel' | 'csv' | 'pdf';

// 报表配置接口
export interface ReportConfig {
  reportTitle?: string;
  reportDescription?: string;
  reportDescriptionLines?: string[];
}

// 导出配置接口
export interface ExportConfig {
  formats?: ExportFormat[];
  filename?: string;
  enabled?: boolean; // 添加启用/禁用导出功能的选项
}

// 打印配置接口
export interface PrintConfig {
  enabled?: boolean;
  title?: string;
}

// 表格配置接口
export interface TableConfig {
  scroll?: { x?: number; y?: number };
  size?: 'small' | 'middle' | 'large';
  showIndex?: boolean; // 是否显示序号列
  showSelection?: boolean; // 是否显示选择列
  showPagination?: boolean; // 是否显示分页
  showToolbar?: boolean; // 是否显示工具栏
  showDensity?: boolean; // 是否显示密度设置
  showColumnSetting?: boolean; // 是否显示列设置
  showFullscreen?: boolean; // 是否显示全屏按钮
  showRefresh?: boolean; // 是否显示刷新按钮
  pagination?: {
    pageSize?: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: boolean;
  };
}

// 主组件 Props 接口
export interface ReportTableProps<T extends Record<string, any>> extends ProTableProps<T, any> {
  reportTitle?: string;
  reportDescription?: string | string[];
  reportConfig?: ReportConfig;
  showSearch?: boolean;
  showToolbar?: boolean;
  exportConfig?: ExportConfig;
  printConfig?: PrintConfig;
  tableConfig?: TableConfig;
}

export default function ReportTable<T extends Record<string, any>>({
  columns = [],
  reportTitle,
  reportDescription,
  reportConfig,
  showSearch = false,
  showToolbar = true,
  exportConfig,
  printConfig,
  tableConfig,
  ...restProps
}: ReportTableProps<T>) {
  const actionRef = useRef<ActionType>(null);
  const { t } = useTranslation();

  // 优先使用 reportConfig 中的配置，然后是直接传入的 props
  const finalTitle = reportConfig?.reportTitle || reportTitle || '报表';
  const finalDescription = reportConfig?.reportDescriptionLines || 
                          reportDescription || 
                          (reportConfig?.reportDescription ? [reportConfig.reportDescription] : []);

  // 自定义导出功能，包含标题和说明行
  const handleCustomExport = (format: ExportFormat) => {
    if (format === 'excel') {
      exportToExcelWithHeader();
    } else if (format === 'csv') {
      exportToCSV();
    }
  };

  // 使用自定义导出钩子
  const exportUtils = useTableExport<Record<string, any>>(
    // 传递正确的参数类型
    (restProps.dataSource || []) as Record<string, any>[],
    columns as ColumnsType<Record<string, any>>,
    {
      filename: exportConfig?.filename || finalTitle,
      onExportRequest: handleCustomExport, // 使用自定义导出回调
    }
  );

  // Excel 导出实现（包含标题和说明行）
  const exportToExcelWithHeader = () => {
    try {
      // 动态导入 exceljs（支持样式）
      import('exceljs').then((ExcelJS) => {
        const dataSource = restProps.dataSource || [];
        
        // 先定义表头
        const headers = columns
          .filter(col => col.dataIndex && col.title)
          .map(col => col.title as string);
        
        // 创建工作簿和工作表
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
        
        // 设置工作簿属性
        workbook.creator = 'Report System';
        workbook.lastModifiedBy = 'Report System';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        let currentRow = 1;
        
        // 添加标题行
        const titleCell = worksheet.getCell(currentRow, 1);
        titleCell.value = finalTitle;
        titleCell.font = { name: '微软雅黑', size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        
        // 合并标题行
        worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
        worksheet.getRow(currentRow).height = 30;
        currentRow++;
        
        // 添加说明行
        if (finalDescription && finalDescription.length > 0) {
          if (Array.isArray(finalDescription)) {
            // 如果是数组，将每个说明项放在不同的单元格中
            finalDescription.forEach((desc, index) => {
              if (index < headers.length) {
                const cell = worksheet.getCell(currentRow, index + 1);
                cell.value = desc;
                cell.font = { name: '微软雅黑', size: 11, color: { argb: 'FF666666' } };
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
              }
            });
          } else {
            // 如果是字符串，放在第一个单元格并合并
            const descCell = worksheet.getCell(currentRow, 1);
            descCell.value = finalDescription;
            descCell.font = { name: '微软雅黑', size: 11, color: { argb: 'FF666666' } };
            descCell.alignment = { horizontal: 'left', vertical: 'middle' };
            worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
          }
          worksheet.getRow(currentRow).height = 20;
          currentRow++;
        }
        
        // 添加表头
        headers.forEach((header, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = header;
          cell.font = { name: '微软雅黑', size: 12, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        worksheet.getRow(currentRow).height = 25;
        currentRow++;
        
        // 添加数据行
        dataSource.forEach(row => {
          const rowData = columns
            .filter(col => col.dataIndex)
            .map(col => {
              const value = row[col.dataIndex as string];
              // 处理特殊值类型
              if (col.valueType === 'money') {
                return typeof value === 'number' ? value : 0;
              }
              return value || '';
            });
          
          rowData.forEach((data, index) => {
            const cell = worksheet.getCell(currentRow, index + 1);
            cell.value = data;
            cell.font = { name: '微软雅黑', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
          currentRow++;
        });
        
        // 设置列宽
        headers.forEach((_, index) => {
          worksheet.getColumn(index + 1).width = 15;
        });
        
        // 生成文件名
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const fileName = `${exportConfig?.filename || finalTitle}_${timestamp}.xlsx`;
        
        // 下载文件
        workbook.xlsx.writeBuffer().then((buffer) => {
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          window.URL.revokeObjectURL(url);
          message.success(t('common.export_success', '导出成功'));
        });
        
      }).catch(err => {
        console.error('Excel export failed:', err);
        message.error('导出失败，请重试');
      });
    } catch (error) {
      console.error('Excel export error:', error);
      message.error('导出失败，请重试');
    }
  };

  // CSV 导出实现
  const exportToCSV = () => {
    try {
      const dataSource = restProps.dataSource || [];
      
      // 先定义表头
      const headers = columns
        .filter(col => col.dataIndex && col.title)
        .map(col => col.title as string);
      
      // 创建 CSV 内容
      let csvContent = '';
      
      // 添加标题行
      csvContent += `"${finalTitle}"\n`;
      
      // 添加说明行
      if (finalDescription && finalDescription.length > 0) {
        if (Array.isArray(finalDescription)) {
          csvContent += finalDescription.map(desc => `"${desc}"`).join(',') + '\n';
        } else {
          csvContent += `"${finalDescription}"\n`;
        }
      }
      
      // 添加表头
      csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
      
      // 添加数据行
      dataSource.forEach(row => {
        const rowData = columns
          .filter(col => col.dataIndex)
          .map(col => {
            const value = row[col.dataIndex as string];
            return value ? `"${value}"` : '""';
          });
        csvContent += rowData.join(',') + '\n';
      });
      
      // 生成文件名并下载
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `${exportConfig?.filename || finalTitle}_${timestamp}.csv`;
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      
      message.success(t('common.export_success', '导出成功'));
    } catch (error) {
      console.error('CSV export error:', error);
      message.error('导出失败，请重试');
    }
  };

  // 导出菜单项
  const exportMenuItems = [
    {
      key: 'excel',
      label: (
        <Space>
          <span>Excel 格式</span>
        </Space>
      ),
      onClick: () => handleCustomExport('excel'),
    },
    {
      key: 'csv', 
      label: (
        <Space>
          <span>CSV 格式</span>
        </Space>
      ),
      onClick: () => handleCustomExport('csv'),
    },
  ];

  // 打印功能
  const handlePrint = () => {
    window.print();
  };

  // 工具栏组件
  const renderToolbar = () => {
    if (!showToolbar) return null;

    return (
      <Space style={{ marginBottom: 16 }}>
        <Dropdown 
          menu={{ items: exportMenuItems }}
          placement="bottomLeft"
        >
          <Button className="toolbar-button">
            导出数据
          </Button>
        </Dropdown>
        
        {printConfig?.enabled !== false && (
          <Tooltip title="打印报表">
            <Button 
              className="toolbar-button"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              打印
            </Button>
          </Tooltip>
        )}
      </Space>
    );
  };

  // 渲染说明信息
  const renderDescription = () => {
    if (!finalDescription || finalDescription.length === 0) return null;

    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          {Array.isArray(finalDescription) ? (
            <ul className="description-list">
              {finalDescription.map((desc, index) => (
                <li key={index}>{desc}</li>
              ))}
            </ul>
          ) : (
            <Text type="secondary" style={{ fontSize: 14 }}>
              {finalDescription}
            </Text>
          )}
        </Col>
      </Row>
    );
  };

  return (
    <ReportContainer>
      <Card className="report-header" bordered={false}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={3} style={{ margin: 0, fontSize: 20 }}>
              {finalTitle}
            </Title>
          </Col>
          <Col>
            {renderToolbar()}
          </Col>
        </Row>
        {renderDescription()}
      </Card>

      <Card className="report-content" bordered={false}>
        <ProTable<T>
          {...restProps}
          actionRef={actionRef}
          columns={columns}
          search={showSearch ? restProps.search : false}
          options={false}
          pagination={restProps.pagination}
          scroll={tableConfig?.scroll || { x: 'max-content' }}
          size={tableConfig?.size || 'middle'}
        />
      </Card>
    </ReportContainer>
  );
}