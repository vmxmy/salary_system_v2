import { message } from 'antd';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { type ProColumns } from '@ant-design/pro-components';
import { processValue, extractTextFromRender, cleanValue, isStringOnlyField } from '../utils/payrollDataUtils';
import type { ComprehensivePayrollDataView } from '../pages/Payroll/services/payrollViewsApi';

// 工资数据类型定义
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number;
}

// 导出选项接口
export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  presetName?: string;
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
  presetName: '默认预设',
  includeHeaders: true,
  autoWidth: true,
  maxColumnWidth: 50,
  dateFormat: 'YYYY年MM月',
  numberFormat: '#,##0.00'
};

/**
 * 生成导出文件名
 * 格式：薪资周期+预设名称+当前日期时间
 */
export const generateExportFilename = (
  periodName?: string, 
  presetName?: string, 
  customName?: string
): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
  
  const period = periodName || '薪资数据';
  const preset = presetName || '默认预设';
  const name = customName || '';
  
  // 构建文件名：薪资周期_预设名称_日期时间.xlsx
  const parts = [period, preset, timestamp];
  if (name) {
    parts.splice(2, 0, name); // 在时间戳前插入自定义名称
  }
  
  return `${parts.join('_')}.xlsx`;
};

/**
 * 处理导出数据 - 严格按照表格显示的列顺序和格式
 */
export const processExportData = (
  data: PayrollData[],
  columns: ProColumns<PayrollData>[]
): { headers: string[]; processedData: any[]; stats: { recordCount: number; columnCount: number } } => {
  console.log('📊 [Export] 开始处理导出数据', {
    dataCount: data.length,
    totalColumns: columns.length,
    columnTitles: columns.map(col => col.title).slice(0, 10) // 显示前10列标题
  });

  // 🎯 严格按照传入的列顺序，移除 action 列和隐藏列
  const exportColumns = columns.filter(col => {
    const isActionColumn = col.key === 'action' || col.dataIndex === 'action' || col.title === '操作';
    const isHidden = col.hideInTable === true;
    const result = !isActionColumn && !isHidden;
    
    if (!result) {
      console.log('📊 [Export] 跳过列:', col.title, { 
        isActionColumn, 
        isHidden, 
        key: col.key, 
        dataIndex: col.dataIndex 
      });
    }
    
    return result;
  });

  console.log('📊 [Export] 可导出列数:', exportColumns.length);
  console.log('📊 [Export] 导出列详情:', exportColumns.map((col, index) => ({
    index,
    title: col.title,
    dataIndex: col.dataIndex,
    key: col.key,
    fixed: col.fixed,
    hideInTable: col.hideInTable
  })));

  // 🎯 额外检查：确保员工姓名列在最前面（因为它有fixed: 'left'）
  const hasEmployeeNameColumn = exportColumns.some(col => 
    col.fixed === 'left' && (
      col.title === '员工姓名' || 
      col.dataIndex === '员工姓名' || 
      col.dataIndex === 'employee_name'
    )
  );
  
  if (hasEmployeeNameColumn) {
    console.log('📊 [Export] 检测到员工姓名列有固定属性，当前顺序应该正确');
  }

  // 🎯 确保遵循ProTable的列排序逻辑（固定列在前）
  // ProTable会将fixed: 'left'的列排在最前面，fixed: 'right'的列排在最后面
  const sortedExportColumns = [...exportColumns].sort((a, b) => {
    // 左固定列排在最前面
    if (a.fixed === 'left' && b.fixed !== 'left') return -1;
    if (b.fixed === 'left' && a.fixed !== 'left') return 1;
    
    // 右固定列排在最后面（但由于我们已经过滤掉了action列，这里应该不会有）
    if (a.fixed === 'right' && b.fixed !== 'right') return 1;
    if (b.fixed === 'right' && a.fixed !== 'right') return -1;
    
    // 其他列保持原有顺序
    return 0;
  });

  // 🎯 严格按照排序后的列顺序生成表头
  const headers = sortedExportColumns.map(col => col.title as string);

  console.log('📊 [Export] 排序后的导出列:', sortedExportColumns.map(col => ({
    title: col.title,
    fixed: col.fixed
  })));
  console.log('📊 [Export] 最终表头顺序:', headers);

  // 🎯 处理数据 - 使用与表格完全相同的渲染逻辑
  const processedData = data.map((record, index) => {
    const row: any = {};
    
    sortedExportColumns.forEach((col, colIndex) => {
      const fieldName = col.dataIndex as string;
      const rawValue = (record as any)[fieldName];
      const headerName = col.title as string;
      
      try {
        // 🎯 使用完全相同的处理逻辑确保格式一致
        let processedValue: any;
        
        if (col.render && typeof col.render === 'function') {
          // 调用列的渲染函数获取格式化结果
          const renderResult = col.render(rawValue, record, index, {} as any, {} as any);
          
          // 提取文本内容
          const textContent = extractTextFromRender(renderResult);
          
          // 对于数字字段，尝试保持数字格式用于Excel排序
          const fieldName = col.dataIndex as string;
          if (fieldName && !isStringOnlyField(fieldName)) {
            // 尝试提取数字
            const cleanText = textContent.replace(/[,\s]/g, ''); // 移除千分位分隔符和空格
            const numValue = parseFloat(cleanText);
            if (!isNaN(numValue) && isFinite(numValue) && cleanText !== 'N/A' && cleanText !== '-') {
              processedValue = numValue;
            } else {
              processedValue = textContent || '-';
            }
          } else {
            // 字符串字段直接使用文本内容
            processedValue = textContent || '-';
          }
        } else {
          // 没有渲染函数，直接处理原始值
          processedValue = processValue(rawValue, col, record, index);
        }
        
        // 🎯 按照表头名称设置值，确保顺序一致
        row[headerName] = processedValue;
        
      } catch (error) {
        console.warn(`[Export] 处理第${index}行第${colIndex}列失败:`, error);
        row[headerName] = '-';
      }
    });
    
    return row;
  });

  console.log('✅ [Export] 数据处理完成', {
    processedRows: processedData.length,
    sampleRow: processedData[0] ? Object.keys(processedData[0]) : []
  });

  return {
    headers,
    processedData,
    stats: {
      recordCount: data.length,
      columnCount: sortedExportColumns.length
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
 * 创建Excel工作簿 - 严格保持列顺序
 */
export const createWorkbook = (
  headers: string[],
  data: any[],
  options: Required<ExportOptions>
): XLSX.WorkBook => {
  console.log('📊 [Excel] 创建工作簿', {
    headers: headers,
    dataCount: data.length,
    includeHeaders: options.includeHeaders
  });

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  
  // 🎯 严格按照headers的顺序创建工作表数据
  const worksheetData: any[][] = [];
  
  // 添加表头行
  if (options.includeHeaders) {
    worksheetData.push([...headers]); // 创建副本确保顺序
  }
  
  // 🎯 按照headers的确切顺序添加数据行
  data.forEach(row => {
    const dataRow: any[] = [];
    headers.forEach(header => {
      const cellValue = row[header];
      // 确保单元格值的格式正确
      if (cellValue === null || cellValue === undefined) {
        dataRow.push('-');
      } else if (typeof cellValue === 'number') {
        // 保持数字格式用于Excel排序和计算
        dataRow.push(cellValue);
      } else {
        // 字符串值
        dataRow.push(String(cellValue));
      }
    });
    worksheetData.push(dataRow);
  });
  
  console.log('📊 [Excel] 工作表数据创建完成', {
    totalRows: worksheetData.length,
    sampleHeaderRow: worksheetData[0],
    sampleDataRow: worksheetData[1]
  });
  
  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // 🎯 设置列宽 - 改进的自动列宽计算
  if (options.autoWidth) {
    worksheet['!cols'] = calculateColumnWidths(headers, data, {
      autoWidth: options.autoWidth,
      maxColumnWidth: options.maxColumnWidth
    });
  }
  
  // 🎯 设置表头行样式
  if (options.includeHeaders && worksheetData.length > 0) {
    worksheet['!rows'] = [];
    worksheet['!rows'][0] = { hpt: 25, hpx: 25 }; // 表头行高
    
    // 设置表头单元格样式（加粗）
    headers.forEach((header, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
      worksheet[cellAddress].s.font = { bold: true };
    });
  }
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName);
  
  console.log('✅ [Excel] 工作簿创建完成');
  
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
      filename: customOptions?.filename || generateExportFilename(
        periodName, 
        customOptions?.presetName || defaultExportOptions.presetName, 
        customOptions?.sheetName !== defaultExportOptions.sheetName ? customOptions?.sheetName : undefined
      )
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
    filename: generateExportFilename(
      periodName, 
      customOptions?.presetName || '默认预设', 
      `选中数据_${selectedRows.length}条`
    )
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
    const exportFilename = filename || generateExportFilename(undefined, '默认预设', '多表格数据');

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