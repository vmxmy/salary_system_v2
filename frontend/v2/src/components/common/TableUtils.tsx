import React, { useRef, useState, useEffect } from 'react';
import { Button, Input, Space, message, Dropdown, Checkbox, Tooltip, Divider } from 'antd';
import { SearchOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import type { ColumnType } from 'antd/es/table';
import Highlighter from 'react-highlight-words';
import * as XLSX from 'xlsx';
import type { ColumnsType } from 'antd/es/table';
import type { CheckboxOptionType } from 'antd/es/checkbox/Group';
import { useLocalStorage } from 'react-use';
import { useTranslation } from 'react-i18next';

/**
 * 通用表格增强工具 (TableUtils)
 * 
 * 提供一套完整的表格增强功能，简化在系统中添加表格搜索、排序、导出和列控制等功能。
 * 
 * @使用指南
 * 
 * 1. 搜索与排序:
 *    ```typescript
 *    // 在组件中:
 *    const { getColumnSearch } = useTableSearch();
 *    
 *    // 在列定义中:
 *    const columns = [
 *      {
 *        title: '名称',
 *        dataIndex: 'name',
 *        ...getColumnSearch('name'),
 *        sorter: stringSorter<DataType>('name'),
 *      }
 *    ];
 *    ```
 * 
 * 2. 导出Excel:
 *    ```typescript
 *    // 在组件中:
 *    const { ExportButton } = useTableExport(dataSource, columns, {
 *      filename: '导出数据',
 *      sheetName: '工作表1',
 *    });
 *    
 *    // 在组件渲染中:
 *    return (
 *      <>
 *        <ExportButton />
 *        <Table columns={columns} dataSource={dataSource} />
 *      </>
 *    );
 *    ```
 * 
 * 3. 列控制:
 *    ```typescript
 *    // 在组件中:
 *    const { visibleColumns, ColumnControl } = useColumnControl(columns, {
 *      storageKeyPrefix: 'my_table',
 *      requiredColumns: ['id', 'actions'],
 *    });
 *    
 *    // 在组件渲染中:
 *    return (
 *      <>
 *        <ColumnControl />
 *        <Table columns={visibleColumns} dataSource={dataSource} />
 *      </>
 *    );
 *    ```
 * 
 * 4. 完整集成示例:
 *    ```typescript
 *    const MyTable = () => {
 *      const { getColumnSearch } = useTableSearch();
 *      
 *      const columns = [
 *        {
 *          title: 'ID',
 *          dataIndex: 'id',
 *          sorter: numberSorter<DataType>('id'),
 *        },
 *        {
 *          title: '名称',
 *          dataIndex: 'name',
 *          ...getColumnSearch('name'),
 *          sorter: stringSorter<DataType>('name'),
 *        },
 *        // 其他列...
 *      ];
 *      
 *      const { ExportButton } = useTableExport(dataSource, columns);
 *      const { visibleColumns, ColumnControl } = useColumnControl(columns);
 *      
 *      return (
 *        <>
 *          <Space>
 *            <ExportButton />
 *            <ColumnControl />
 *          </Space>
 *          <Table 
 *            columns={visibleColumns} 
 *            dataSource={dataSource}
 *            pagination={{ 
 *              showSizeChanger: true, 
 *              showQuickJumper: true,
 *              showTotal: (total) => `共 ${total} 条记录`,
 *            }} 
 *          />
 *        </>
 *      );
 *    };
 *    ```
 */

/**
 * 为表格列添加搜索功能的工具函数
 * @param dataIndex 数据索引，用于指定搜索哪个字段
 * @param searchText 当前搜索文本
 * @param setSearchText 设置搜索文本的函数
 * @param searchedColumn 当前搜索的列
 * @param setSearchedColumn 设置当前搜索列的函数
 * @param searchInputRef 搜索输入框的引用
 * @returns 表格列搜索配置
 */
export const getColumnSearchProps = <T extends object>(
  dataIndex: keyof T,
  searchText: string,
  setSearchText: React.Dispatch<React.SetStateAction<string>>,
  searchedColumn: string,
  setSearchedColumn: React.Dispatch<React.SetStateAction<string>>,
  searchInputRef: React.RefObject<InputRef | null>
): ColumnType<T> => {
  const { t } = useTranslation(['common']);
  
  return {
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
      <Input
        ref={searchInputRef as React.RefObject<InputRef>}
        placeholder={t('common:search.placeholder', { field: String(dataIndex) })}
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
          {t('common:button.search', '搜索')}
        </Button>
        <Button
          onClick={() => clearFilters && handleReset(clearFilters, setSearchText)}
          size="small"
          style={{ width: 90 }}
        >
          {t('common:button.reset', '重置')}
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => {
            confirm();
            close();
          }}
        >
          {t('common:button.close', '关闭')}
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
 * 创建表格的搜索和排序状态及函数的钩子
 * @returns 返回表格搜索所需的状态和函数
 */
export const useTableSearch = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [searchedColumn, setSearchedColumn] = useState<string>('');
  const searchInput = useRef<InputRef>(null);

  const getColumnSearch = <T extends object>(dataIndex: keyof T): ColumnType<T> => 
    getColumnSearchProps<T>(
      dataIndex, 
      searchText, 
      setSearchText, 
      searchedColumn, 
      setSearchedColumn, 
      searchInput
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
 * @param filename 导出的文件名（不含扩展名）
 * @param sheetName 工作表名称
 * @returns 导出相关函数和组件
 */
export interface ExportOptions {
  /** 文件名（不含扩展名） */
  filename?: string;
  /** 工作表名称 */
  sheetName?: string;
  /** 是否包含表头 */
  withHeader?: boolean;
  /** 按钮文本 */
  buttonText?: string;
  /** 导出成功提示文本 */
  successMessage?: string;
}

export const useTableExport = <T extends object>(
  dataSource: T[],
  columns: ColumnsType<T>,
  options?: ExportOptions
) => {
  const { t } = useTranslation(['common']);
  
  const defaultOptions: ExportOptions = {
    filename: t('common:export.filename', '导出数据'),
    sheetName: t('common:export.sheetName', 'Sheet1'),
    withHeader: true,
    buttonText: t('common:button.export_excel', '导出Excel'),
    successMessage: t('common:export.success_message', '导出成功'),
  };

  const mergedOptions = { ...defaultOptions, ...options };

  /**
   * 导出表格数据到Excel
   */
  const exportToExcel = () => {
    try {
      // 转换数据为Excel兼容格式
      const excelData = dataSource.map(record => {
        const row: Record<string, any> = {};
        
        columns.forEach(column => {
          // 处理ColumnGroup的情况
          if ('dataIndex' in column && column.dataIndex && column.title) {
            const dataIndex = column.dataIndex as keyof T;
            // 获取列显示的值
            let cellValue: any = record[dataIndex];
            
            // 处理自定义渲染
            if (column.render && typeof cellValue !== 'undefined') {
              const renderResult = column.render(cellValue, record, 0);
              // 如果渲染结果是React元素，尝试提取文本内容
              if (React.isValidElement(renderResult)) {
                // 安全地访问props
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

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, mergedOptions.sheetName);
      
      // 导出文件
      XLSX.writeFile(workbook, `${mergedOptions.filename}.xlsx`);
      
      // 显示成功消息
      message.success(mergedOptions.successMessage);
    } catch (error) {
      console.error(t('common:export.error_log', '导出Excel失败:'), error);
      message.error(t('common:export.error_message', '导出失败，请重试'));
    }
  };

  /**
   * 导出按钮组件
   */
  const ExportButton: React.FC = () => (
    <Tooltip title={mergedOptions.buttonText || t('common:tooltip.export_data', '导出数据')}> 
      <Button 
        icon={<DownloadOutlined />} 
        onClick={exportToExcel}
        shape="round"
        type="default"
      >
        {mergedOptions.buttonText}
      </Button>
    </Tooltip>
  );

  return {
    exportToExcel,
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
 * @param storageKey 本地存储的键名，用于保存用户的列选择
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
  const { t } = useTranslation(['common']);
  
  const defaultOptions: ColumnControlOptions = {
    storageKeyPrefix: 'table_columns',
    showReset: true,
    buttonText: t('common:column_control.button_text', '列设置'),
    tooltipTitle: t('common:column_control.tooltip_title', '自定义显示列'),
    dropdownTitle: t('common:column_control.dropdown_title', '列显示'),
    resetText: t('common:button.reset', '重置'),
    requiredColumns: [],
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const storageKey = `${mergedOptions.storageKeyPrefix}_${window.location.pathname}`;

  // 确保每列都有唯一的key，而且是确定性的
  const getColumnKey = (col: ColumnType<T>, index: number): string => {
    // 首先尝试获取key
    if (col.key) return col.key as string;
    // 如果没有key，尝试获取dataIndex
    if ('dataIndex' in col) {
      if (Array.isArray(col.dataIndex)) {
        return col.dataIndex.join('.');
      }
      return String(col.dataIndex);
    }
    // 如果都没有，尝试使用title作为fallback
    if (col.title) {
      if (typeof col.title === 'string') {
        return col.title.replace(/\s+/g, '_').toLowerCase();
      }
      // 非字符串标题，生成一个基于索引的key
      return `column_${index}`;
    }
    // 最后的后备方案，生成一个基于索引的key
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

  // 添加调试日志
  useEffect(() => {
    console.log('TableUtils: Column Control Debug Info', {
      storageKey,
      allColumnKeys,
      requiredColumnKeys,
      visibleColumnKeys: visibleColumnKeys || allColumnKeys
    });
  }, [storageKey, allColumnKeys, requiredColumnKeys, visibleColumnKeys]);

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
    const { t } = useTranslation(['common']);
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
      console.log('TableUtils: Applying column settings', {
        tempSelectedKeys,
        allColumnKeys,
        requiredColumnKeys
      });
      
      // 确保至少有一列被选中，如果全部取消，则恢复所有列
      const keysToSave = tempSelectedKeys.length > 0 ? tempSelectedKeys : allColumnKeys;
      
      setSelectedKeys(keysToSave);
      setVisibleColumnKeys(keysToSave);
      
      // 在下一个微任务中再次记录最终保存的列状态
      setTimeout(() => {
        console.log('TableUtils: Saved column settings', {
          storageKey,
          savedKeys: keysToSave,
          storageKeys: window.localStorage.getItem(storageKey)
        });
      }, 0);
      
      message.success(t('common:message.column_settings_applied', '列设置已应用'));
    };

    const handleReset = () => {
      setSelectedKeys(allColumnKeys);
      setTempSelectedKeys(allColumnKeys);
      setVisibleColumnKeys(allColumnKeys);
      message.success(t('common:message.column_settings_reset', '列设置已重置'));
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
                {t('common:button.apply', '应用')}
              </Button>
            </Space>
          </div>
        ),
      }
    ];

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Tooltip title={mergedOptions.tooltipTitle || t('common:tooltip.column_settings', '列设置')}> 
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
      console.log(`清除了列设置本地存储: ${storageKey}`);
    }
  };
}; 