import React, { useRef, useState, useEffect } from 'react';
import { Button, Input, Space, Dropdown, Checkbox, Tooltip, Divider, App, Menu } from 'antd';
import { SearchOutlined, DownloadOutlined, SettingOutlined, DownOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import type { ColumnType } from 'antd/es/table';
import Highlighter from 'react-highlight-words';
import type { ColumnsType } from 'antd/es/table';
import { useLocalStorage } from 'react-use';
import { useTranslation } from 'react-i18next';

/**
 * 通用表格增强工具 (TableUtils)
 * * 提供一套完整的表格增强功能，简化在系统中添加表格搜索、排序、导出和列控制等功能。
 * * @使用指南
 * * 1. 搜索与排序:
 * ```typescript
 * // 在组件中:
 * const { getColumnSearch } = useTableSearch();
 * * // 在列定义中:
 * const columns = [
 * {
 * title: t('components:name'), // Using a translated key
 * dataIndex: 'name',
 * ...getColumnSearch('name'),
 * sorter: stringSorter<DataType>('name'),
 * }
 * ];
 * ```
 * * 2. 导出Excel:
 * ```typescript
 * // 在组件中:
 * const { ExportButton } = useTableExport(dataSource, columns, {
 * filename: t('components:export_filename'), // Using a translated key
 * sheetName: t('components:export_sheetname'), // Using a translated key
 * });
 * * // 在组件渲染中:
 * return (
 * <>
 * <ExportButton />
 * <Table columns={columns} dataSource={dataSource} />
 * </>
 * );
 * ```
 * * 3. 列控制:
 * ```typescript
 * // 在组件中:
 * const { visibleColumns, ColumnControl } = useColumnControl(columns, {
 * storageKeyPrefix: 'my_table',
 * requiredColumns: ['id', 'actions'],
 * });
 * * // 在组件渲染中:
 * return (
 * <>
 * <ColumnControl />
 * <Table columns={visibleColumns} dataSource={dataSource} />
 * </>
 * );
 * ```
 * * 4. 完整集成示例:
 * ```typescript
 * const MyTable = () => {
 * const { getColumnSearch } = useTableSearch();
 * const { t } = useTranslation(); // Assuming t is available here
 * * const columns = [
 * {
 * title: 'ID',
 * dataIndex: 'id',
 * sorter: numberSorter<DataType>('id'),
 * },
 * {
 * title: t('components:name'), // Using a translated key
 * dataIndex: 'name',
 * ...getColumnSearch('name'),
 * sorter: stringSorter<DataType>('name'),
 * },
 * // 其他列...
 * ];
 * * const { ExportButton } = useTableExport(dataSource, columns);
 * const { visibleColumns, ColumnControl } = useColumnControl(columns);
 * * return (
 * <>
 * <Space>
 * <ExportButton />
 * <ColumnControl />
 * </Space>
 * <Table 
 * columns={visibleColumns} 
 * dataSource={dataSource}
 * pagination={{ 
 * showSizeChanger: true, 
 * showQuickJumper: true,
 * showTotal: (total) => t('components:total_items', { total }), // Using a translated key
 * }} 
 * />
 * </>
 * );
 * };
 * ```
 */

/**
 * 处理搜索操作
 */
const handleSearch = (
  selectedKeys: string[],
  confirm: () => void,
  dataIndex: string,
  setSearchText: React.Dispatch<React.SetStateAction<string>>,
  setSearchedColumn: React.Dispatch<React.SetStateAction<string>>
) => {
  confirm();
  setSearchText(selectedKeys[0]);
  setSearchedColumn(dataIndex);
};

/**
 * 处理重置搜索条件
 */
const handleReset = (
  clearFilters: () => void,
  setSearchText: React.Dispatch<React.SetStateAction<string>>
) => {
  clearFilters();
  setSearchText('');
};

/**
 * 为表格列添加搜索功能的工具函数
 * @param dataIndex 数据索引，用于指定搜索哪个字段
 * @param searchText 当前搜索文本
 * @param setSearchText 设置搜索文本的函数
 * @param searchedColumn 当前搜索的列
 * @param setSearchedColumn 设置当前搜索列的函数
 * @param searchInputRef 搜索输入框的引用
 * @param translations 翻译文本对象
 * @returns 表格列搜索配置
 */
export const getColumnSearchProps = <T extends object>(
  dataIndex: keyof T,
  searchText: string,
  setSearchText: React.Dispatch<React.SetStateAction<string>>,
  searchedColumn: string,
  setSearchedColumn: React.Dispatch<React.SetStateAction<string>>,
  searchInputRef: React.RefObject<InputRef | null>,
  translations: {
    placeholder: string;
    searchButton: string;
    resetButton: string;
    closeButton: string;
  }
): ColumnType<T> => {
  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInputRef as React.RefObject<InputRef>}
          placeholder={translations.placeholder}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex as string, setSearchText, setSearchedColumn)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex as string, setSearchText, setSearchedColumn)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {translations.searchButton}
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, setSearchText)}
            size="small"
            style={{ width: 90 }}
          >
            {translations.resetButton}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm();
              close();
            }}
          >
            {translations.closeButton}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      return recordValue
        ? String(recordValue).toLowerCase().includes((value as string).toLowerCase())
        : false;
    },
    filterDropdownProps: {
      onOpenChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInputRef.current?.select(), 100);
        }
      },
    },
    render: (text) =>
      searchedColumn === dataIndex as string ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  };
};

/**
 * 创建表格的搜索和排序状态及函数的钩子
 * @returns 返回表格搜索所需的状态和函数
 */
export const useTableSearch = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [searchedColumn, setSearchedColumn] = useState<string>('');
  const searchInput = useRef<InputRef>(null);
  const { t } = useTranslation(['common', 'components']);

  const getColumnSearch = <T extends object>(dataIndex: keyof T): ColumnType<T> =>
    getColumnSearchProps<T>(
      dataIndex,
      searchText,
      setSearchText,
      searchedColumn,
      setSearchedColumn,
      searchInput,
      {
        placeholder: t('common:search.placeholder'),
        searchButton: t('common:button.search'),
        resetButton: t('common:button.reset'),
        closeButton: t('common:button.close'),
      }
    );

  return {
    searchText,
    setSearchText,
    searchedColumn,
    setSearchedColumn,
    searchInput,
    getColumnSearch,
  };
};

/**
 * 表格数据导出功能
 * @param dataSource 表格数据源
 * @param columns 表格列配置
 * @param options 导出选项
 * @returns 导出相关函数和组件
 */
export interface ExportOptions {
  /** 文件名（不含扩展名） */
  filename?: string;
  /** 工作表名称 */
  sheetName?: string;
  /** 是否包含表头 */
  withHeader?: boolean;
  /** 按钮文本 - 如果是单一按钮模式 */
  buttonText?: string;
  /** 导出成功提示文本 */
  successMessage?: string;
  /** 支持的导出格式列表，例如 ['excel', 'csv'] */
  supportedFormats?: ExportFormat[];
  /** 导出请求回调，如果提供，则优先使用此回调进行导出 */
  onExportRequest?: (format: ExportFormat) => void;
  /** 主按钮文本（当有多种格式时，作为下拉按钮的文本） */
  dropdownButtonText?: string;
}

export type ExportFormat = 'excel' | 'csv' | 'pdf'; // 定义支持的格式类型

// 辅助函数，获取格式对应的显示文本
const getFormatLabel = (format: ExportFormat, t: (key: string, defaultText: string) => string): string => {
  switch (format) {
    case 'excel': return t('common:export.formatExcel', 'Excel (.xlsx)');
    case 'csv': return t('common:export.formatCsv', 'CSV (.csv)');
    case 'pdf': return t('common:export.formatPdf', 'PDF (.pdf)');
    default:
      // Type safety: this should not be reached if ExportFormat is exhaustive
      const _exhaustiveCheck: never = format;
      return String(_exhaustiveCheck).toUpperCase();
  }
};

export const useTableExport = <T extends object>(
  // dataSource 和 columns 变为可选，因为服务器端导出时不需要它们
  dataSource?: T[],
  columns?: ColumnsType<T>,
  options?: ExportOptions
) => {
  const { message } = App.useApp();
  const { t } = useTranslation(['common']);

  const defaultOptions: Omit<Required<ExportOptions>, 'onExportRequest'> & { onExportRequest?: (format: ExportFormat) => void } = {
    filename: t('common:export.filename_default'), // Adjusted translation key
    sheetName: t('common:export.sheetName_default', 'Sheet1'), // Adjusted translation key
    withHeader: true,
    buttonText: t('common:button.export_excel'),
    successMessage: t('common:export.success_message'),
    supportedFormats: ['excel'],
    dropdownButtonText: t('common:button.export'),
    onExportRequest: undefined, // Explicitly undefined initially
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const clientExportToExcel = async () => {
    if (!dataSource || !columns) {
      message.error(t('common:export.error_no_data_for_client_export'));
      return;
    }
    try {
      // 使用ExcelJS替代xlsx包
      const ExcelJS = await import('exceljs');
      
      const excelData = dataSource.map(record => {
        const row: Record<string, any> = {};
        columns.forEach(column => {
          if ('dataIndex' in column && column.dataIndex && column.title) {
            const dataIndex = column.dataIndex as keyof T;
            let cellValue: any = record[dataIndex];
            if (column.render && typeof cellValue !== 'undefined') {
              const renderResult = column.render(cellValue, record, 0);
              if (React.isValidElement(renderResult)) {
                const props = renderResult.props as any;
                cellValue = props?.children || cellValue;
              } else if (typeof renderResult === 'string' || typeof renderResult === 'number') {
                cellValue = renderResult;
              }
            }
            row[column.title as string] = cellValue;
          }
        });
        return row;
      });
      
      // 使用ExcelJS创建工作簿
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(mergedOptions.sheetName);
      
      if (excelData.length > 0) {
        const headers = Object.keys(excelData[0]);
        worksheet.addRow(headers);
        excelData.forEach(row => {
          worksheet.addRow(headers.map(key => row[key]));
        });
      }
      
      // 导出文件
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${mergedOptions.filename}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(mergedOptions.successMessage);
    } catch (error) {
      message.error(t('common:export.error_message'));
    }
  };

  const ExportButton: React.FC = () => {
    const handleMenuClick = async (e: { key: string }) => {
      const format = e.key as ExportFormat;
      if (mergedOptions.onExportRequest) {
        mergedOptions.onExportRequest(format);
      } else if (format === 'excel') {
        await clientExportToExcel();
      } else {
        message.warning(t('common:export.warn_no_handler'));
      }
    };

    const menuItems = mergedOptions.supportedFormats.map(format => ({
      key: format,
      label: getFormatLabel(format, t),
      onClick: () => handleMenuClick({ key: format }),
    }));

    const exportCallback = mergedOptions.onExportRequest; // Store in a variable for type guarding
    const hasExportCallback = typeof exportCallback === 'function';

    const shouldUseDropdown = hasExportCallback && mergedOptions.supportedFormats.length > 1;
    const singleFormatServerExport = hasExportCallback && mergedOptions.supportedFormats.length === 1;

    if (shouldUseDropdown) {
      return (
        <Dropdown menu={{ items: menuItems }}>
          <Button shape="round" type="default">
            {mergedOptions.dropdownButtonText} <DownOutlined />
          </Button>
        </Dropdown>
      );
    }

    const singleFormatToExport = mergedOptions.supportedFormats[0];
    const singleButtonText = singleFormatServerExport
      ? getFormatLabel(singleFormatToExport, t)
      : (singleFormatToExport === 'excel' && !hasExportCallback)
        ? mergedOptions.buttonText
        : getFormatLabel(singleFormatToExport, t);

    return (
      <Tooltip title={singleButtonText || t('common:tooltip.export_data')}>
        <Button
          icon={<DownloadOutlined />}
          onClick={async () => {
            if (hasExportCallback && exportCallback) { // Check exportCallback directly here
              exportCallback(singleFormatToExport);
            } else if (singleFormatToExport === 'excel' && !hasExportCallback) { // Ensure it's client export
              await clientExportToExcel();
            } else {
              message.warning(t('common:export.warn_no_handler'));
            }
          }}
          shape="round"
          type="default"
        >
          {singleButtonText}
        </Button>
      </Tooltip>
    );
  };

  return {
    ExportButton,
  };
};

/**
 * 为表格列添加排序功能
 * @param dataIndex 数据索引，用于指定排序哪个字段
 * @param sorter 排序函数
 * @returns 表格列排序配置
 */
export const getColumnSorterProps = <T extends object>(
  dataIndex: keyof T,
  sorter: (a: T, b: T) => number
): Partial<ColumnType<T>> => ({
  sorter,
  sortDirections: ['descend', 'ascend'],
});

/**
 * 为数字类型字段创建排序器
 */
export const numberSorter = <T extends object>(dataIndex: keyof T) =>
  (a: T, b: T) => {
    const aVal = a[dataIndex];
    const bVal = b[dataIndex];
    return typeof aVal === 'number' && typeof bVal === 'number'
      ? aVal - bVal
      : 0;
  };

/**
 * 为字符串类型字段创建排序器
 */
export const stringSorter = <T extends object>(dataIndex: keyof T) =>
  (a: T, b: T) => {
    const aVal = a[dataIndex];
    const bVal = b[dataIndex];
    return typeof aVal === 'string' && typeof bVal === 'string'
      ? aVal.localeCompare(bVal)
      : 0;
  };

/**
 * 为日期类型字段创建排序器
 */
export const dateSorter = <T extends object>(dataIndex: keyof T) =>
  (a: T, b: T) => {
    const aVal = a[dataIndex];
    const bVal = b[dataIndex];
    if (aVal && bVal) {
      return new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
    }
    return 0;
  };

/**
 * 表格列控制钩子，允许用户选择显示或隐藏列
 * @param allColumns 所有可用的列
 * @param options 列控制选项
 * @returns 当前显示的列和控制列显示的组件
 */
export interface ColumnControlOptions {
  /** 本地存储的键名前缀，用于保存用户的列选择，默认为 'table_columns' */
  storageKeyPrefix?: string;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 按钮的文本 */
  buttonText?: string;
  /** 按钮提示文本 */
  tooltipTitle?: string;
  /** 弹出层标题 */
  dropdownTitle?: string;
  /** 重置按钮文本 */
  resetText?: string;
  /** 必须显示的列键名数组 */
  requiredColumns?: string[];
}

export const useColumnControl = <T extends object>(
  allColumns: ColumnsType<T>,
  options?: ColumnControlOptions
) => {
  const { message } = App.useApp();
  const { t } = useTranslation(['common']);

  const defaultOptions: ColumnControlOptions = {
    storageKeyPrefix: 'table_columns',
    showReset: true,
    buttonText: t('common:column_control.button_text'),
    tooltipTitle: t('common:column_control.tooltip_title'),
    dropdownTitle: t('common:column_control.dropdown_title'),
    resetText: t('common:button.reset'),
    requiredColumns: [],
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const storageKey = `${mergedOptions.storageKeyPrefix}_${window.location.pathname}`;

  // 确保每列都有唯一的key，而且是确定性的
  const getColumnKey = (col: ColumnType<T>, index: number): string => {
    // 首先尝试获取key
    if (col.key) return col.key as string;
    // If no key, try to get dataIndex
    if ('dataIndex' in col) {
      if (Array.isArray(col.dataIndex)) {
        return col.dataIndex.join('.');
      }
      return String(col.dataIndex);
    }
    // If neither, try to use title as fallback
    if (col.title) {
      if (typeof col.title === 'string') {
        return col.title.replace(/\s+/g, '_').toLowerCase();
      }
      // Non-string title, generate an index-based key
      return `column_${index}`;
    }
    // Final fallback, generate an index-based key
    return `column_${index}`;
  };

  // 获取所有列的key
  const allColumnKeys = allColumns.map((col, index) => getColumnKey(col, index));

  // 获取必须显示的列键名
  const requiredColumnKeys = mergedOptions.requiredColumns || [];

  // 从本地存储加载用户的列选择
  const [visibleColumnKeys, setVisibleColumnKeys] = useLocalStorage<string[]>(
    storageKey,
    allColumnKeys
  );

  // 确保visibleColumnKeys存在，如果不存在则使用所有列
  const safeVisibleColumnKeys = visibleColumnKeys || allColumnKeys;

  // 计算当前应该显示的列
  const visibleColumns = allColumns.filter((col, index) => {
    // 获取列的唯一标识
    const colKey = getColumnKey(col, index);

    // 如果是必须显示的列，或者在可见列列表中，则显示
    return requiredColumnKeys.includes(colKey) || safeVisibleColumnKeys.includes(colKey);
  });

  // 列选项组件
  const ColumnControl: React.FC = () => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(safeVisibleColumnKeys);
    const [tempSelectedKeys, setTempSelectedKeys] = useState<string[]>(safeVisibleColumnKeys);

    useEffect(() => {
      // 当外部 safeVisibleColumnKeys 更新时，同步内部状态
      setSelectedKeys(safeVisibleColumnKeys);
      setTempSelectedKeys(safeVisibleColumnKeys);
    }, [safeVisibleColumnKeys]);

    const handleColumnChange = (checkedValues: string[]) => {
      setTempSelectedKeys(checkedValues);
    };

    const handleApply = () => {
      // 确保至少有一列被选中，如果全部取消，则恢复所有列
      const keysToSave = tempSelectedKeys.length > 0 ? tempSelectedKeys : allColumnKeys;

      setSelectedKeys(keysToSave);
      setVisibleColumnKeys(keysToSave);

      message.success(t('common:message.column_settings_applied'));
    };

    const handleReset = () => {
      setSelectedKeys(allColumnKeys);
      setTempSelectedKeys(allColumnKeys);
      setVisibleColumnKeys(allColumnKeys);
      message.success(t('common:message.column_settings_reset'));
    };

    const stopPropagation = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    const menuItems = [
      {
        key: 'columns',
        label: (
          <div onClick={stopPropagation} style={{ padding: '8px 12px', minWidth: 180, maxWidth: 300, maxHeight: 500, overflow: 'auto' }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>{mergedOptions.dropdownTitle}</div>
            <Checkbox.Group
              options={allColumns.map((col, index) => {
                // 获取列的唯一标识，与上面相同的逻辑
                const colKey = getColumnKey(col, index);

                return {
                  label: col.title as React.ReactNode,
                  value: colKey,
                  // 如果是必须显示的列，则禁用选择框
                  disabled: requiredColumnKeys.includes(colKey)
                };
              })}
              value={tempSelectedKeys}
              onChange={handleColumnChange}
              style={{ display: 'flex', flexDirection: 'column' }}
            />
            <Divider style={{ margin: '8px 0' }} />
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              {mergedOptions.showReset && (
                <Button size="small" onClick={handleReset}>
                  {mergedOptions.resetText}
                </Button>
              )}
              <Button type="primary" size="small" onClick={handleApply}>
                {t('common:button.apply')}
              </Button>
            </Space>
          </div>
        ),
      }
    ];

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Tooltip title={mergedOptions.tooltipTitle || t('common:tooltip.column_settings')}>
          <Button
            icon={<SettingOutlined />}
            shape="round"
            type="default"
          >
            {mergedOptions.buttonText}
          </Button>
        </Tooltip>
      </Dropdown>
    );
  };

  return {
    visibleColumns,
    ColumnControl,
    resetColumns: () => setVisibleColumnKeys(allColumnKeys),
    // 清除列设置本地存储
    clearColumnStorage: () => {
      window.localStorage.removeItem(storageKey);
      setVisibleColumnKeys(allColumnKeys);
    }
  };
};