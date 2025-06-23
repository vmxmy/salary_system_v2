import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { message } from 'antd';
import dayjs from 'dayjs';
import type { ProColumns } from '@ant-design/pro-components';

// Export format types
export type ExportFormat = 'excel' | 'csv' | 'json' | 'pdf';

// Export options interface
export interface ExportOptions {
  filename?: string;
  format?: ExportFormat;
  includeHeaders?: boolean;
  timestamp?: boolean;
  creator?: string;
  title?: string;
  description?: string;
  sheetName?: string;
  maxRows?: number;
  compression?: boolean;
}

// Default export options
const defaultExportOptions: Required<ExportOptions> = {
  filename: 'data_export',
  format: 'excel',
  includeHeaders: true,
  timestamp: true,
  creator: 'Universal Data Browser',
  title: 'Data Export',
  description: 'Exported data from Universal Data Browser',
  sheetName: 'Data',
  maxRows: 100000,
  compression: true,
};

// Column information for export
interface ExportColumn {
  key: string;
  title: string;
  dataIndex: string | string[];
  width?: number;
  type?: 'text' | 'number' | 'date' | 'boolean';
}

/**
 * Universal Export Service
 * Provides standardized data export functionality for various formats
 */
export class UniversalExportService {
  private options: Required<ExportOptions>;

  constructor(options: Partial<ExportOptions> = {}) {
    this.options = { ...defaultExportOptions, ...options };
  }

  /**
   * Export data to Excel format
   */
  async exportToExcel<T = any>(
    data: T[],
    columns: ProColumns<T>[],
    title?: string,
    customOptions?: Partial<ExportOptions>
  ): Promise<void> {
    const finalOptions = { ...this.options, ...customOptions };
    
    console.log('📤 [UniversalExport] Starting Excel export', {
      dataCount: data.length,
      columnsCount: columns.length,
      title: title || finalOptions.title
    });

    try {
      if (!data || data.length === 0) {
        message.warning('没有数据可以导出');
        return;
      }

      // Validate data size
      if (data.length > finalOptions.maxRows) {
        const shouldContinue = confirm(
          `数据量较大 (${data.length} 行)，可能影响性能。是否继续导出？`
        );
        if (!shouldContinue) return;
      }

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook metadata
      workbook.creator = finalOptions.creator;
      workbook.created = new Date();
      workbook.modified = new Date();
      // Set description in workbook properties
      if (workbook.properties) {
        (workbook.properties as any).description = finalOptions.description;
      }

      const worksheet = workbook.addWorksheet(finalOptions.sheetName, {
        properties: { tabColor: { argb: 'FF1890FF' } }
      });

      // Convert ProColumns to export columns
      const exportColumns = this.convertProColumnsToExportColumns(columns);
      
      // Add title row if specified
      let currentRowIndex = 1;
      if (title || finalOptions.title) {
        const titleRow = worksheet.addRow([title || finalOptions.title]);
        titleRow.font = { size: 16, bold: true };
        titleRow.alignment = { horizontal: 'center' };
        worksheet.mergeCells(1, 1, 1, exportColumns.length);
        currentRowIndex++;
        
        // Add empty row
        worksheet.addRow([]);
        currentRowIndex++;
      }

      // Add metadata rows
      if (finalOptions.timestamp) {
        const metadataRows = [
          ['导出时间', dayjs().format('YYYY-MM-DD HH:mm:ss')],
          ['数据行数', data.length.toString()],
          ['导出列数', exportColumns.length.toString()],
        ];

        metadataRows.forEach(([label, value]) => {
          const row = worksheet.addRow([label, value]);
          row.getCell(1).font = { bold: true };
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
          };
        });

        currentRowIndex += metadataRows.length;
        
        // Add empty row
        worksheet.addRow([]);
        currentRowIndex++;
      }

      // Add headers
      if (finalOptions.includeHeaders) {
        const headerRow = worksheet.addRow(exportColumns.map(col => col.title));
        
        // Style headers
        headerRow.eachCell((cell, colNumber) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1890FF' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        currentRowIndex++;
      }

      // Add data rows
      data.forEach((item, index) => {
        const rowData = exportColumns.map(col => {
          const value = this.extractValueFromItem(item, col.dataIndex);
          return this.formatValueForExport(value, col.type);
        });

        const dataRow = worksheet.addRow(rowData);
        
        // Style data rows
        dataRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          
          // Alternate row colors
          if (index % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFAFAFA' }
            };
          }

          // Align based on data type
          const column = exportColumns[colNumber - 1];
          if (column?.type === 'number') {
            cell.alignment = { horizontal: 'right' };
          } else if (column?.type === 'date') {
            cell.alignment = { horizontal: 'center' };
          }
        });
      });

      // Auto-fit columns
      exportColumns.forEach((col, index) => {
        const columnIndex = index + 1;
        const column = worksheet.getColumn(columnIndex);
        
        // Set column width based on content or specified width
        if (col.width) {
          column.width = col.width / 8; // Convert pixels to Excel character width
        } else {
          // Auto-calculate width
          const headerWidth = col.title.length;
          const maxDataWidth = Math.max(
            ...data.slice(0, 100).map(item => {
              const value = this.extractValueFromItem(item, col.dataIndex);
              return String(value || '').length;
            })
          );
          column.width = Math.min(Math.max(headerWidth, maxDataWidth) + 2, 50);
        }
      });

      // Generate filename
      const timestamp = finalOptions.timestamp ? `_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}` : '';
      const filename = `${finalOptions.filename}${timestamp}.xlsx`;

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      saveAs(blob, filename);
      
      console.log('✅ [UniversalExport] Excel export completed successfully', {
        filename,
        rowsExported: data.length,
        columnsExported: exportColumns.length
      });

      message.success(`数据导出成功：${filename}`);
      
    } catch (error) {
      console.error('❌ [UniversalExport] Excel export failed:', error);
      message.error('导出失败，请重试');
      throw error;
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV<T = any>(
    data: T[],
    columns: ProColumns<T>[],
    title?: string,
    customOptions?: Partial<ExportOptions>
  ): Promise<void> {
    const finalOptions = { ...this.options, ...customOptions };
    
    console.log('📤 [UniversalExport] Starting CSV export', {
      dataCount: data.length,
      columnsCount: columns.length
    });

    try {
      if (!data || data.length === 0) {
        message.warning('没有数据可以导出');
        return;
      }

      const exportColumns = this.convertProColumnsToExportColumns(columns);
      let csvContent = '';

      // Add BOM for Excel compatibility with Chinese characters
      csvContent = '\uFEFF';

      // Add headers
      if (finalOptions.includeHeaders) {
        csvContent += exportColumns.map(col => `"${col.title}"`).join(',') + '\n';
      }

      // Add data rows
      data.forEach(item => {
        const rowData = exportColumns.map(col => {
          const value = this.extractValueFromItem(item, col.dataIndex);
          const formattedValue = this.formatValueForExport(value, col.type);
          // Escape quotes and wrap in quotes
          return `"${String(formattedValue || '').replace(/"/g, '""')}"`;
        });
        csvContent += rowData.join(',') + '\n';
      });

      // Generate filename and download
      const timestamp = finalOptions.timestamp ? `_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}` : '';
      const filename = `${finalOptions.filename}${timestamp}.csv`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, filename);
      
      console.log('✅ [UniversalExport] CSV export completed successfully');
      message.success(`CSV导出成功：${filename}`);
      
    } catch (error) {
      console.error('❌ [UniversalExport] CSV export failed:', error);
      message.error('CSV导出失败，请重试');
      throw error;
    }
  }

  /**
   * Export data to JSON format
   */
  async exportToJSON<T = any>(
    data: T[],
    columns: ProColumns<T>[],
    title?: string,
    customOptions?: Partial<ExportOptions>
  ): Promise<void> {
    const finalOptions = { ...this.options, ...customOptions };
    
    try {
      if (!data || data.length === 0) {
        message.warning('没有数据可以导出');
        return;
      }

      const exportData = {
        metadata: {
          title: title || finalOptions.title,
          exportedAt: dayjs().toISOString(),
          totalRows: data.length,
          creator: finalOptions.creator
        },
        columns: this.convertProColumnsToExportColumns(columns),
        data
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const timestamp = finalOptions.timestamp ? `_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}` : '';
      const filename = `${finalOptions.filename}${timestamp}.json`;
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, filename);
      
      console.log('✅ [UniversalExport] JSON export completed successfully');
      message.success(`JSON导出成功：${filename}`);
      
    } catch (error) {
      console.error('❌ [UniversalExport] JSON export failed:', error);
      message.error('JSON导出失败，请重试');
      throw error;
    }
  }

  /**
   * Convert ProColumns to ExportColumns
   */
  private convertProColumnsToExportColumns<T>(columns: ProColumns<T>[]): ExportColumn[] {
    return columns
      .filter(col => col.key !== 'action' && col.dataIndex) // Exclude action columns
      .map(col => ({
        key: col.key as string,
        title: String(col.title || col.dataIndex || col.key || ''),
        dataIndex: col.dataIndex as string | string[],
        width: col.width as number,
        type: this.detectColumnType(col)
      }));
  }

  /**
   * Detect column data type from ProColumn
   */
  private detectColumnType<T>(column: ProColumns<T>): 'text' | 'number' | 'date' | 'boolean' {
    const title = String(column.title || '').toLowerCase();
    const dataIndex = String(column.dataIndex || '').toLowerCase();
    
    // Check for number patterns
    if (title.includes('数量') || title.includes('金额') || title.includes('价格') ||
        title.includes('amount') || title.includes('price') || title.includes('count') ||
        dataIndex.includes('amount') || dataIndex.includes('price') || dataIndex.includes('count')) {
      return 'number';
    }
    
    // Check for date patterns
    if (title.includes('时间') || title.includes('日期') || title.includes('date') ||
        title.includes('time') || dataIndex.includes('date') || dataIndex.includes('time')) {
      return 'date';
    }
    
    // Check for boolean patterns
    if (title.includes('是否') || title.includes('启用') || title.includes('enabled') ||
        dataIndex.includes('enabled') || dataIndex.includes('active')) {
      return 'boolean';
    }
    
    return 'text';
  }

  /**
   * Extract value from item using dataIndex (supports nested keys)
   */
  private extractValueFromItem(item: any, dataIndex: string | string[]): any {
    if (!item) return '';
    
    if (Array.isArray(dataIndex)) {
      return dataIndex.reduce((obj, key) => obj?.[key], item);
    }
    
    // Support dot notation (e.g., 'user.name')
    if (typeof dataIndex === 'string' && dataIndex.includes('.')) {
      return dataIndex.split('.').reduce((obj, key) => obj?.[key], item);
    }
    
    return item[dataIndex];
  }

  /**
   * Format value for export based on type
   */
  private formatValueForExport(value: any, type?: string): string {
    if (value == null || value === '') return '';
    
    switch (type) {
      case 'number':
        const num = Number(value);
        return isNaN(num) ? String(value) : num.toLocaleString();
        
      case 'date':
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? String(value) : dayjs(date).format('YYYY-MM-DD HH:mm:ss');
        } catch {
          return String(value);
        }
        
      case 'boolean':
        if (typeof value === 'boolean') return value ? '是' : '否';
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (['true', 'yes', '是', '1'].includes(lower)) return '是';
          if (['false', 'no', '否', '0'].includes(lower)) return '否';
        }
        return String(value);
        
      default:
        // Handle React elements and objects
        if (typeof value === 'object') {
          if (value.$$typeof || value.$typeof) return '[React Element]';
          return JSON.stringify(value);
        }
        
        return String(value);
    }
  }

  /**
   * Set default options
   */
  setDefaultOptions(options: Partial<ExportOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): Required<ExportOptions> {
    return { ...this.options };
  }
}

// Create singleton instance
export const universalExportService = new UniversalExportService();

// Export default instance and class
export default UniversalExportService;