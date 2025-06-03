import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ProTable } from '@ant-design/pro-components';
import { Card, Typography, Row, Col, Space, Button, Dropdown, Menu, message, Divider, Tooltip } from 'antd';
import type { ProColumns, ProTableProps, ActionType } from '@ant-design/pro-components';
import {
  PrinterOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTableExport } from './TableUtils';

const { Title, Text } = Typography;

const ReportContainer = styled.div`
  .report-header {
    background: #fff;
    padding: 24px;
    margin-bottom: 16px;
    border-radius: 6px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
    border: 1px solid #f0f0f0;
  }
  
  .report-title {
    font-size: 24px;
    font-weight: 600;
    color: #262626;
    margin: 0 0 8px 0;
    text-align: center;
  }
  
  .report-description {
    font-size: 14px;
    color: #8c8c8c;
    margin: 0;
    text-align: center;
    line-height: 1.5;
  }
  
  .report-actions {
    margin-top: 16px;
    text-align: right;
  }
`;

const StyledProTable = styled(ProTable)`
  .ant-pro-table-list-toolbar {
    padding: 0;
    margin-bottom: 16px;
  }
  .ant-table-thead > tr > th {
    background-color: #fafafa;
    font-weight: 500;
  }
` as any;

export type ExportFormat = 'excel' | 'pdf' | 'csv';

export interface ReportTableProps<T> extends Omit<ProTableProps<T, any, any>, 'headerTitle' | 'toolbar'> {
  reportTitle?: string;
  reportDescription?: string | string[]; // 支持字符串或字符串数组
  reportConfig?: {
    reportTitle?: string;
    reportDescription?: string;
    reportDescriptionLines?: string[];
  }; // 从报表模板配置中读取
  columns: ProColumns<T>[];
  bordered?: boolean;
  extraActions?: React.ReactNode;
  showSearch?: boolean;
  showToolbar?: boolean;
  exportConfig?: {
    enabled?: boolean;
    filename?: string;
    formats?: ExportFormat[];
    onExport?: (format: ExportFormat, data: T[]) => Promise<void>;
  };
  printConfig?: {
    enabled?: boolean;
    title?: string;
    onPrint?: (data: T[]) => Promise<void>;
  };
  tableConfig?: {
    showIndex?: boolean;
    showSelection?: boolean;
    bordered?: boolean;
    size?: 'small' | 'middle' | 'large';
    showPagination?: boolean;
    pagination?: {
      pageSize?: number;
      showSizeChanger?: boolean;
      showQuickJumper?: boolean;
      showTotal?: boolean;
    };
    showToolbar?: boolean;
    showDensity?: boolean;
    showColumnSetting?: boolean;
    showFullscreen?: boolean;
    showRefresh?: boolean;
  };
}

export function ReportTable<T extends Record<string, any>>({
  reportTitle,
  reportDescription,
  reportConfig,
  columns,
  bordered = true,
  extraActions,
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
      exportToCSVWithHeader();
    } else {
      message.info(t('payroll:pdf_export_not_supported'));
    }
  };

  // 使用现有的导出功能作为基础，但添加自定义回调
  const { ExportButton } = useTableExport(
    restProps.dataSource as T[],
    columns as any,
    {
      filename: exportConfig?.filename || finalTitle,
      sheetName: finalTitle,
      supportedFormats: exportConfig?.formats || ['excel'],
      successMessage: t('payroll:export_success'),
      onExportRequest: handleCustomExport, // 使用自定义导出回调
    }
  );

  // Excel 导出实现（包含标题和说明行）
  const exportToExcelWithHeader = () => {
    try {
      // 动态导入 xlsx-js-style（支持样式）
      import('xlsx-js-style').then((XLSX) => {
                 const dataSource = restProps.dataSource || [];
         const worksheetData: any[][] = [];
         
         // 先定义表头
         const headers = columns
           .filter(col => col.dataIndex && col.title)
           .map(col => col.title as string);
         
         // 添加标题行
         worksheetData.push([finalTitle]);
         
         // 添加说明行
         if (finalDescription && finalDescription.length > 0) {
           if (Array.isArray(finalDescription)) {
             // 如果是数组，将每个说明项放在不同的单元格中
             const descriptionRow = [...finalDescription];
             // 确保说明行的长度至少与表头列数相同
             while (descriptionRow.length < headers.length) {
               descriptionRow.push('');
             }
             worksheetData.push(descriptionRow);
           } else {
             // 如果是字符串，放在第一个单元格并合并
             worksheetData.push([finalDescription]);
           }
         }
         
         // 添加表头
         worksheetData.push(headers);
        
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
          worksheetData.push(rowData);
        });

                 // 创建并下载Excel文件
         const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
         const workbook = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
         
         // 确保工作簿支持样式
         workbook.Props = {
           Title: reportTitle,
           Subject: "Report Export",
           Author: "Report System",
           CreatedDate: new Date()
         };
         
         // 设置列宽
         const colWidths = headers.map(() => ({ wch: 15 }));
         worksheet['!cols'] = colWidths;
         
         // 设置行高
         const rowHeights = [];
         rowHeights[0] = { hpt: 30 }; // 标题行高度
         if (finalDescription && finalDescription.length > 0) {
           rowHeights[1] = { hpt: 20 }; // 说明行高度
           rowHeights[2] = { hpt: 25 }; // 表头行高度
         } else {
           rowHeights[1] = { hpt: 25 }; // 表头行高度
         }
         worksheet['!rows'] = rowHeights;
         
         // 设置标题样式（合并单元格）
         const merges = [
           { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // 标题行合并
         ];
         
         // 只有当说明行是字符串时才合并说明行
         if (finalDescription && !Array.isArray(finalDescription)) {
           merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } });
         }
         
         worksheet['!merges'] = merges;
         
         // 设置单元格样式
         const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
         
         // 创建样式对象（xlsx-js-style 格式）
         const styles = {
           title: {
             font: { 
               name: "微软雅黑", 
               sz: 16, 
               bold: true,
               color: { rgb: "000000" }
             },
             alignment: { 
               horizontal: "center", 
               vertical: "center",
               wrapText: true
             },
             fill: { 
               fgColor: { rgb: "F0F0F0" },
               patternType: "solid"
             }
           },
           description: {
             font: { 
               name: "微软雅黑", 
               sz: 11,
               color: { rgb: "666666" }
             },
             alignment: { 
               horizontal: "left", 
               vertical: "center",
               wrapText: true
             }
           },
           header: {
             font: { 
               name: "微软雅黑", 
               sz: 12, 
               bold: true,
               color: { rgb: "000000" }
             },
             alignment: { 
               horizontal: "center", 
               vertical: "center",
               wrapText: true
             },
             fill: { 
               fgColor: { rgb: "E6F3FF" },
               patternType: "solid"
             },
             border: {
               top: { style: "thin", color: { rgb: "000000" } },
               bottom: { style: "thin", color: { rgb: "000000" } },
               left: { style: "thin", color: { rgb: "000000" } },
               right: { style: "thin", color: { rgb: "000000" } }
             }
           },
           data: {
             font: { 
               name: "微软雅黑", 
               sz: 10,
               color: { rgb: "000000" }
             },
             alignment: { 
               horizontal: "left", 
               vertical: "center",
               wrapText: true
             },
             border: {
               top: { style: "thin", color: { rgb: "CCCCCC" } },
               bottom: { style: "thin", color: { rgb: "CCCCCC" } },
               left: { style: "thin", color: { rgb: "CCCCCC" } },
               right: { style: "thin", color: { rgb: "CCCCCC" } }
             }
           }
         };
         
         // 应用样式到单元格
         for (let R = range.s.r; R <= range.e.r; ++R) {
           for (let C = range.s.c; C <= range.e.c; ++C) {
             const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
             if (!worksheet[cellAddress]) {
               worksheet[cellAddress] = { t: 's', v: '' };
             }
             
             if (R === 0) {
               // 第一行：大标题样式
               worksheet[cellAddress].s = styles.title;
             } else if (R === 1 && finalDescription && finalDescription.length > 0) {
               // 第二行：说明行样式
               worksheet[cellAddress].s = styles.description;
             } else if (R === (finalDescription && finalDescription.length > 0 ? 2 : 1)) {
               // 表头行：小标题样式
               worksheet[cellAddress].s = styles.header;
             } else {
               // 数据行：普通样式
               worksheet[cellAddress].s = styles.data;
             }
           }
         }
        
                 const fileName = `${exportConfig?.filename || finalTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
         
         // 使用支持样式的写入选项
         XLSX.writeFile(workbook, fileName, { 
           bookType: 'xlsx',
           type: 'binary',
           cellStyles: true
         });
         
         message.success(t('payroll:export_success'));
      });
    } catch (error) {
      message.error('导出失败，请重试');
    }
  };

  // CSV 导出实现（包含标题和说明行）
  const exportToCSVWithHeader = () => {
    try {
      const dataSource = restProps.dataSource || [];
      let csvContent = '';
      
             // 添加标题行
       csvContent += `"${finalTitle}"\n`;
       
       // 添加说明行
       if (finalDescription && finalDescription.length > 0) {
         if (Array.isArray(finalDescription)) {
           // 如果是数组，将每个说明项放在不同的单元格中
           const descriptionRow = finalDescription.map(desc => `"${desc}"`);
           csvContent += descriptionRow.join(',') + '\n';
         } else {
           // 如果是字符串，放在第一个单元格
           csvContent += `"${finalDescription}"\n`;
         }
       }
      
      // 添加表头
      const headers = columns
        .filter(col => col.dataIndex && col.title)
        .map(col => `"${col.title}"`);
      csvContent += headers.join(',') + '\n';
      
      // 添加数据行
      dataSource.forEach(row => {
        const rowData = columns
          .filter(col => col.dataIndex)
          .map(col => {
            const value = row[col.dataIndex as string];
            return `"${value || ''}"`;
          });
        csvContent += rowData.join(',') + '\n';
      });

      // 创建并下载CSV文件
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${exportConfig?.filename || finalTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success(t('payroll:export_success'));
    } catch (error) {
      message.error('导出失败，请重试');
    }
  };

  // 打印功能（仅做提示，实际打印逻辑需补充）
  const handlePrint = async () => {
    message.info('打印功能演示');
  };

  const renderToolbar = () => {
    const defaultButtons = [];
    if (exportConfig?.enabled) {
      defaultButtons.push(
        <ExportButton key="export" />
      );
    }
    if (printConfig?.enabled) {
      defaultButtons.push(
        <Tooltip key="print" title="打印报表">
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            shape="round"
            type="default"
          >
            打印
          </Button>
        </Tooltip>
      );
    }
    // 删除重复的刷新和全屏按钮，使用 ProTable 内置的
    return defaultButtons;
  };

  const tableOptions = {
    density: tableConfig?.showDensity,
    setting: tableConfig?.showColumnSetting ? {
      draggable: true,
      checkable: true,
    } : false,
    fullScreen: tableConfig?.showFullscreen, // 恢复内置全屏按钮
    reload: tableConfig?.showRefresh, // 恢复内置刷新按钮
  };

  return (
    <ReportContainer>
      {/* 第一行：大标题 */}
      {/* 第二行：说明文本 */}
      <div className="report-header">
        <div className="report-title">{finalTitle}</div>
        {finalDescription && finalDescription.length > 0 && (
          <div className="report-description">
            {Array.isArray(finalDescription) 
              ? finalDescription.join(' | ') 
              : finalDescription
            }
          </div>
        )}
        {extraActions && (
          <div className="report-actions">
            <Space>{extraActions}</Space>
          </div>
        )}
      </div>
      
      {/* 第三行：表格字段和数据 */}
      <StyledProTable
        {...restProps}
        actionRef={actionRef}
        columns={columns}
        bordered={tableConfig?.bordered ?? bordered}
        search={showSearch}
        toolbar={showToolbar ? { actions: renderToolbar() } : false}
        options={showToolbar ? tableOptions : false}
        pagination={tableConfig?.showPagination ? {
          pageSize: tableConfig.pagination?.pageSize || 10,
          showSizeChanger: tableConfig.pagination?.showSizeChanger,
          showQuickJumper: tableConfig.pagination?.showQuickJumper,
          showTotal: tableConfig.pagination?.showTotal ? (total: number) => `共 ${total} 条` : undefined,
        } : false}
        size={tableConfig?.size}
        rowSelection={tableConfig?.showSelection ? { type: 'checkbox' } : undefined}
      />
    </ReportContainer>
  );
} 