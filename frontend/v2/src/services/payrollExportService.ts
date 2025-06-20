import { message } from 'antd';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { type ProColumns } from '@ant-design/pro-components';
import { processValue, extractTextFromRender, cleanValue } from '../utils/payrollDataUtils';
import type { ComprehensivePayrollDataView } from '../pages/Payroll/services/payrollViewsApi';

// 工资数据类型定义
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number;
}

// 导出选项接口
export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  autoWidth?: boolean;
  maxColumnWidth?: number;
  dateFormat?: string;
  numberFormat?: string;
}

// 导出结果接口
export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  recordCount?: number;
  columnCount?: number;
}

// 默认导出选项
const defaultExportOptions: Required<ExportOptions> = {
  filename: '',
  sheetName: '工资数据',
  includeHeaders: true,
  autoWidth: true,
  maxColumnWidth: 50,
  dateFormat: 'YYYY年MM月',
  numberFormat: '#,##0.00'
};

/**
 * 生成导出文件名
 */
export const generateExportFilename = (periodName?: string, customName?: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const period = periodName || '导出';
  const name = customName || '工资数据';
  
  return `${name}_${period}_${timestamp}.xlsx`;
};

/**
 * 处理导出数据
 */
export const processExportData = (
  data: PayrollData[],
  columns: ProColumns<PayrollData>[]
): { headers: string[]; processedData: any[]; stats: { recordCount: number; columnCount: number } } => {
  // 获取可见列并排序
  const visibleColumns = columns
    .filter(col => !col.hideInTable)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // 生成表头
  const headers = visibleColumns.map(col => col.title as string);

  // 处理数据
  const processedData = data.map((record, index) => {
    const row: any = {};
    
    visibleColumns.forEach(col => {
      const fieldName = col.dataIndex as string;
      const rawValue = (record as any)[fieldName];
      
      // 使用与表格相同的处理逻辑
      const processedValue = processValue(rawValue, col, record, index);
      row[col.title as string] = processedValue;
    });
    
    return row;
  });

  return {
    headers,
    processedData,
    stats: {
      recordCount: data.length,
      columnCount: visibleColumns.length
    }
  };
};

/**
 * 设置Excel列宽
 */
export const calculateColumnWidths = (
  headers: string[],
  data: any[],
  options: { autoWidth: boolean; maxColumnWidth: number }
): XLSX.ColInfo[] => {
  if (!options.autoWidth) {
    return headers.map(() => ({ wch: 15 }));
  }

  return headers.map(header => {
    // 计算标题长度
    const titleLength = header.length;
    
    // 计算数据的最大长度（取前100行样本）
    const sampleData = data.slice(0, 100);
    const maxDataLength = Math.max(
      ...sampleData.map(row => {
        const value = row[header];
        return value ? String(value).length : 0;
      })
    );
    
    // 取标题和数据的最大长度，加上一些边距
    const calculatedWidth = Math.max(titleLength, maxDataLength) + 2;
    
    // 限制最大宽度
    const finalWidth = Math.min(calculatedWidth, options.maxColumnWidth);
    
    return { wch: Math.max(finalWidth, 8) }; // 最小宽度为8
  });
};

/**
 * 创建Excel工作簿
 */
export const createWorkbook = (
  headers: string[],
  data: any[],
  options: Required<ExportOptions>
): XLSX.WorkBook => {
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  
  // 创建工作表数据
  const worksheetData = options.includeHeaders 
    ? [headers, ...data.map(row => headers.map(header => row[header]))]
    : data.map(row => headers.map(header => row[header]));
  
  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // 设置列宽
  if (options.autoWidth) {
    worksheet['!cols'] = calculateColumnWidths(headers, data, {
      autoWidth: options.autoWidth,
      maxColumnWidth: options.maxColumnWidth
    });
  }
  
  // 设置行高
  worksheet['!rows'] = [];
  if (options.includeHeaders) {
    worksheet['!rows'][0] = { hpt: 20, hpx: 20 }; // 表头行高
  }
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName);
  
  return workbook;
};

/**
 * 导出到Excel文件
 */
export const exportToExcel = async (
  data: PayrollData[],
  columns: ProColumns<PayrollData>[],
  periodName?: string,
  customOptions?: Partial<ExportOptions>
): Promise<ExportResult> => {
  try {
    // 显示加载提示
    message.loading({ content: '正在生成Excel文件...', key: 'export' });

    // 合并选项
    const options: Required<ExportOptions> = {
      ...defaultExportOptions,
      ...customOptions,
      filename: customOptions?.filename || generateExportFilename(periodName, customOptions?.sheetName)
    };

    // 处理数据
    const { headers, processedData, stats } = processExportData(data, columns);
    
    if (processedData.length === 0) {
      message.warning({ content: '没有数据可导出', key: 'export' });
      return { success: false, error: '没有数据可导出' };
    }

    // 创建工作簿
    const workbook = createWorkbook(headers, processedData, options);

    // 生成二进制数据
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true
    });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, options.filename);

    // 显示成功提示
    message.success({ 
      content: `导出完成！文件：${options.filename}`, 
      key: 'export',
      duration: 5
    });

    return {
      success: true,
      filename: options.filename,
      recordCount: stats.recordCount,
      columnCount: stats.columnCount
    };

  } catch (error) {
    console.error('导出Excel失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    message.error({ 
      content: `导出失败：${errorMessage}`, 
      key: 'export',
      duration: 10
    });

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * 导出选中行数据
 */
export const exportSelectedRows = async (
  selectedRows: PayrollData[],
  columns: ProColumns<PayrollData>[],
  periodName?: string,
  customOptions?: Partial<ExportOptions>
): Promise<ExportResult> => {
  if (selectedRows.length === 0) {
    message.warning('请先选择要导出的数据行');
    return { success: false, error: '没有选中任何数据' };
  }

  const options = {
    ...customOptions,
    sheetName: `选中数据_${selectedRows.length}条`,
    filename: generateExportFilename(periodName, `选中数据_${selectedRows.length}条`)
  };

  return exportToExcel(selectedRows, columns, periodName, options);
};

/**
 * 批量导出多个工作表
 */
export const exportMultipleSheets = async (
  sheets: Array<{
    name: string;
    data: PayrollData[];
    columns: ProColumns<PayrollData>[];
  }>,
  filename?: string
): Promise<ExportResult> => {
  try {
    message.loading({ content: '正在生成多表格Excel文件...', key: 'export' });

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    let totalRecords = 0;
    let totalColumns = 0;

    // 处理每个工作表
    for (const sheet of sheets) {
      const { headers, processedData, stats } = processExportData(sheet.data, sheet.columns);
      
      if (processedData.length > 0) {
        const options: Required<ExportOptions> = {
          ...defaultExportOptions,
          sheetName: sheet.name,
          filename: ''
        };

        // 创建工作表数据
        const worksheetData = [headers, ...processedData.map(row => headers.map(header => row[header]))];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // 设置列宽
        worksheet['!cols'] = calculateColumnWidths(headers, processedData, {
          autoWidth: true,
          maxColumnWidth: 50
        });

        // 添加到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        
        totalRecords += stats.recordCount;
        totalColumns += stats.columnCount;
      }
    }

    if (workbook.SheetNames.length === 0) {
      message.warning({ content: '没有数据可导出', key: 'export' });
      return { success: false, error: '没有数据可导出' };
    }

    // 生成文件名
    const exportFilename = filename || generateExportFilename(undefined, '多表格数据');

    // 导出文件
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true
    });

    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, exportFilename);

    message.success({ 
      content: `多表格导出完成！文件：${exportFilename}`, 
      key: 'export',
      duration: 5
    });

    return {
      success: true,
      filename: exportFilename,
      recordCount: totalRecords,
      columnCount: totalColumns
    };

  } catch (error) {
    console.error('多表格导出失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    message.error({ 
      content: `多表格导出失败：${errorMessage}`, 
      key: 'export',
      duration: 10
    });

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * 验证导出数据
 */
export const validateExportData = (
  data: PayrollData[],
  columns: ProColumns<PayrollData>[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data || data.length === 0) {
    errors.push('数据为空');
  }

  if (!columns || columns.length === 0) {
    errors.push('列配置为空');
  }

  const visibleColumns = columns.filter(col => !col.hideInTable);
  if (visibleColumns.length === 0) {
    errors.push('没有可见的列');
  }

  // 检查数据完整性
  if (data && data.length > 0) {
    const sampleRecord = data[0];
    const missingFields = visibleColumns.filter(col => 
      !(col.dataIndex as string in sampleRecord)
    );
    
    if (missingFields.length > 0) {
      errors.push(`缺少字段：${missingFields.map(col => col.title).join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};