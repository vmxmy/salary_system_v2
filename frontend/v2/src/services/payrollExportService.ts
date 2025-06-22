import { message } from 'antd';
import * as ExcelJS from 'exceljs';
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
 * 使用ExcelJS处理导出数据 - 严格按照表格显示的列顺序和格式
 */
export const processExportDataWithExcelJS = (
  data: PayrollData[],
  columns: ProColumns<PayrollData>[]
): { 
  orderedColumns: Array<{ header: string; key: string; width: number; column: ProColumns<PayrollData> }>; 
  processedData: any[]; 
  stats: { recordCount: number; columnCount: number } 
} => {
  console.log('📊 [ExcelJS Export] 开始处理导出数据', {
    dataCount: data.length,
    totalColumns: columns.length,
    columnTitles: columns.map(col => col.title).slice(0, 10)
  });

  // 🎯 严格按照传入的列顺序，移除 action 列和隐藏列
  const exportColumns = columns.filter(col => {
    const isActionColumn = col.key === 'action' || col.dataIndex === 'action' || col.title === '操作';
    const isHidden = col.hideInTable === true;
    const result = !isActionColumn && !isHidden;
    
    if (!result) {
      console.log('📊 [ExcelJS Export] 跳过列:', col.title, { 
        isActionColumn, 
        isHidden, 
        key: col.key, 
        dataIndex: col.dataIndex 
      });
    }
    
    return result;
  });

  console.log('📊 [ExcelJS Export] 原始导出列顺序:', exportColumns.map((col, index) => ({
    index,
    title: col.title,
    fixed: col.fixed
  })));

  // 🎯 重要：保持数组的原始顺序，不进行任何排序！
  // 因为 columns 已经是按照表格显示顺序传入的
  const orderedColumns = exportColumns.map((col, index) => {
    const header = col.title as string;
    const key = `col_${index}`; // 使用索引作为key确保顺序
    
    // 根据标题计算列宽
    let width = Math.max(header.length * 2, 12); // 基础宽度
    if (header.includes('姓名')) width = Math.max(width, 15);
    if (header.includes('编号')) width = Math.max(width, 18);
    if (header.includes('金额') || header.includes('工资') || header.includes('合计')) width = Math.max(width, 16);
    
    return {
      header,
      key,
      width,
      column: col
    };
  });

  console.log('📊 [ExcelJS Export] 最终列配置顺序:', orderedColumns.map((col, index) => ({
    index,
    header: col.header,
    key: col.key,
    fixed: col.column.fixed
  })));

  // 🎯 处理数据 - 按照列的精确顺序
  const processedData = data.map((record, rowIndex) => {
    const row: any = {};
    
    orderedColumns.forEach((colConfig, colIndex) => {
      const col = colConfig.column;
      const fieldName = col.dataIndex as string;
      const rawValue = (record as any)[fieldName];
      
      try {
        let processedValue: any;
        
        if (col.render && typeof col.render === 'function') {
          // 调用列的渲染函数获取格式化结果
          const renderResult = col.render(rawValue, record, rowIndex, {} as any, {} as any);
          const textContent = extractTextFromRender(renderResult);
          
          // 对于数字字段，尝试保持数字格式
          if (fieldName && !isStringOnlyField(fieldName)) {
            const cleanText = textContent.replace(/[,\s]/g, '');
            const numValue = parseFloat(cleanText);
            if (!isNaN(numValue) && isFinite(numValue) && cleanText !== 'N/A' && cleanText !== '-') {
              processedValue = numValue;
            } else {
              processedValue = textContent || '-';
            }
          } else {
            processedValue = textContent || '-';
          }
        } else {
          processedValue = processValue(rawValue, col, record, rowIndex);
        }
        
        // 🎯 关键：使用列的key（基于索引）确保顺序
        row[colConfig.key] = processedValue;
        
      } catch (error) {
        console.warn(`[ExcelJS Export] 处理第${rowIndex}行第${colIndex}列失败:`, error);
        row[colConfig.key] = '-';
      }
    });
    
    return row;
  });

  console.log('✅ [ExcelJS Export] 数据处理完成', {
    processedRows: processedData.length,
    columnsCount: orderedColumns.length,
    sampleRowKeys: processedData[0] ? Object.keys(processedData[0]) : []
  });

  return {
    orderedColumns,
    processedData,
    stats: {
      recordCount: data.length,
      columnCount: orderedColumns.length
    }
  };
};

/**
 * 使用ExcelJS创建工作簿 - 严格保持列顺序
 */
export const createWorkbookWithExcelJS = async (
  orderedColumns: Array<{ header: string; key: string; width: number; column: ProColumns<PayrollData> }>,
  data: any[],
  options: Required<ExportOptions>
): Promise<ExcelJS.Workbook> => {
  console.log('📊 [ExcelJS] 创建工作簿', {
    columnsCount: orderedColumns.length,
    dataCount: data.length,
    sheetName: options.sheetName
  });

  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Payroll System';
  workbook.lastModifiedBy = 'Payroll System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 添加工作表
  const worksheet = workbook.addWorksheet(options.sheetName);

  // 🎯 严格按照顺序设置列配置
  console.log('📊 [ExcelJS] 设置列配置，严格保持顺序:', orderedColumns.map(col => col.header));
  
  worksheet.columns = orderedColumns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  // 🎯 设置表头样式
  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // 添加边框
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // 🎯 按照严格的列顺序添加数据
  console.log('📊 [ExcelJS] 开始添加数据行，列顺序:', orderedColumns.map(col => col.key));
  
  data.forEach((rowData, rowIndex) => {
    const excelRow: any = {};
    
    // 🎯 关键：严格按照orderedColumns的顺序设置每个单元格
    orderedColumns.forEach((colConfig) => {
      const value = rowData[colConfig.key];
      excelRow[colConfig.key] = value;
    });
    
    const addedRow = worksheet.addRow(excelRow);
    
    // 设置数据行样式
    addedRow.eachCell((cell, colNumber) => {
      const colConfig = orderedColumns[colNumber - 1];
      
      if (colConfig) {
        // 根据数据类型设置对齐方式
        if (typeof cell.value === 'number') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          // 对于数字，设置数字格式
          if (colConfig.column.dataIndex && !isStringOnlyField(colConfig.column.dataIndex as string)) {
            cell.numFmt = '#,##0.00'; // 千分位分隔符，2位小数
          }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
        
        // 添加边框
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  });

  // 自动调整行高
  worksheet.eachRow((row) => {
    if (row.number > 1) { // 跳过表头行
      row.height = 20;
    }
  });

  console.log('✅ [ExcelJS] 工作簿创建完成', {
    totalRows: worksheet.rowCount,
    totalColumns: worksheet.columnCount
  });

  return workbook;
};

/**
 * 使用ExcelJS导出到Excel文件 - 严格保持列顺序
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

    console.log('📤 [ExcelJS Export] 开始导出', {
      filename: options.filename,
      dataCount: data.length,
      columnsCount: columns.length
    });

    // 🎯 使用新的ExcelJS处理函数
    const { orderedColumns, processedData, stats } = processExportDataWithExcelJS(data, columns);
    
    if (processedData.length === 0) {
      message.warning({ content: '没有数据可导出', key: 'export' });
      return { success: false, error: '没有数据可导出' };
    }

    // 🎯 使用ExcelJS创建工作簿
    const workbook = await createWorkbookWithExcelJS(orderedColumns, processedData, options);

    // 🎯 生成Excel文件Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 创建Blob并下载
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, options.filename);

    // 显示成功提示
    message.success({ 
      content: `导出完成！文件：${options.filename}`, 
      key: 'export',
      duration: 5
    });

    console.log('✅ [ExcelJS Export] 导出成功', {
      filename: options.filename,
      recordCount: stats.recordCount,
      columnCount: stats.columnCount
    });

    return {
      success: true,
      filename: options.filename,
      recordCount: stats.recordCount,
      columnCount: stats.columnCount
    };

  } catch (error) {
    console.error('❌ [ExcelJS Export] 导出失败:', error);
    
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
 * 导出选中行数据 - 使用ExcelJS
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

  console.log('📤 [ExcelJS BatchExport] 批量导出选中行', {
    selectedRowsCount: selectedRows.length,
    presetName: customOptions?.presetName
  });

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
 * 使用ExcelJS批量导出多个工作表
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

    console.log('📤 [ExcelJS MultiSheet] 开始多表格导出', {
      sheetsCount: sheets.length,
      filename
    });

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Payroll System';
    workbook.lastModifiedBy = 'Payroll System';
    workbook.created = new Date();
    workbook.modified = new Date();

    let totalRecords = 0;
    let totalColumns = 0;

    // 处理每个工作表
    for (const sheet of sheets) {
      console.log(`📄 [ExcelJS MultiSheet] 处理工作表: ${sheet.name}`);
      
      const { orderedColumns, processedData, stats } = processExportDataWithExcelJS(sheet.data, sheet.columns);
      
      if (processedData.length > 0) {
        // 添加工作表
        const worksheet = workbook.addWorksheet(sheet.name);

        // 设置列配置
        worksheet.columns = orderedColumns.map(col => ({
          header: col.header,
          key: col.key,
          width: col.width
        }));

        // 设置表头样式
        const headerRow = worksheet.getRow(1);
        headerRow.height = 25;
        headerRow.font = { bold: true, size: 12 };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // 添加数据
        processedData.forEach((rowData) => {
          const excelRow: any = {};
          orderedColumns.forEach((colConfig) => {
            excelRow[colConfig.key] = rowData[colConfig.key];
          });
          worksheet.addRow(excelRow);
        });

        // 设置样式
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // 跳过表头
          
          row.eachCell((cell, colNumber) => {
            const colConfig = orderedColumns[colNumber - 1];
            if (colConfig) {
              if (typeof cell.value === 'number') {
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                if (colConfig.column.dataIndex && !isStringOnlyField(colConfig.column.dataIndex as string)) {
                  cell.numFmt = '#,##0.00';
                }
              } else {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
              }
              
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            }
          });
        });
        
        totalRecords += stats.recordCount;
        totalColumns += stats.columnCount;
      }
    }

    if (workbook.worksheets.length === 0) {
      message.warning({ content: '没有数据可导出', key: 'export' });
      return { success: false, error: '没有数据可导出' };
    }

    // 生成文件名
    const exportFilename = filename || generateExportFilename(undefined, '默认预设', '多表格数据');

    // 导出文件
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, exportFilename);

    message.success({ 
      content: `多表格导出完成！文件：${exportFilename}`, 
      key: 'export',
      duration: 5
    });

    console.log('✅ [ExcelJS MultiSheet] 多表格导出成功', {
      filename: exportFilename,
      totalRecords,
      totalColumns
    });

    return {
      success: true,
      filename: exportFilename,
      recordCount: totalRecords,
      columnCount: totalColumns
    };

  } catch (error) {
    console.error('❌ [ExcelJS MultiSheet] 多表格导出失败:', error);
    
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
 * 验证导出数据 - 兼容ExcelJS
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

  const visibleColumns = columns.filter(col => {
    const isActionColumn = col.key === 'action' || col.dataIndex === 'action' || col.title === '操作';
    const isHidden = col.hideInTable === true;
    return !isActionColumn && !isHidden;
  });
  
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

  console.log('📊 [Export Validation] 验证结果:', {
    isValid: errors.length === 0,
    errors,
    dataCount: data?.length || 0,
    visibleColumnsCount: visibleColumns.length
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};