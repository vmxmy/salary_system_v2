import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { ColumnConfig } from '../components/table/ColumnSettingsDrawer';
import { SalaryFieldDefinition } from '../services/api';
import { SalaryRecord } from '../components/SalaryDataViewer/SalaryContext';
import { convertColumnsToConfig, convertConfigToColumns, loadTableSetting, saveTableSetting } from '../utils/tableUtils';
import { fetchTableLayouts, createTableLayout } from '../services/tableConfigsApi';

/**
 * 自定义Hook，用于管理表格列配置
 */
export const useTableColumns = (data: SalaryRecord[]) => {
    const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
    const [currentLayoutId, setCurrentLayoutId] = useState<string | undefined>(undefined);
    const [currentLayoutName, setCurrentLayoutName] = useState<string>('');
    const [isColumnDraggable, setIsColumnDraggable] = useState<boolean>(false);
    const { t } = useTranslation();
    const { message } = App.useApp();

    /**
     * 动态生成表格列
     * @param fieldDefinitions 字段定义
     * @param isDraggable 是否启用拖拽
     */
    const generateColumns = useCallback((
        fieldDefinitions: SalaryFieldDefinition[],
        isDraggable: boolean = false
    ): TableColumnsType<SalaryRecord> => {
        console.log('Generating columns with fieldDefinitions:', fieldDefinitions.length);

        // 如果启用了拖拽，添加拖拽手柄列
        const columns: TableColumnsType<SalaryRecord> = [];

        if (isDraggable) {
            columns.push({
                title: '',
                dataIndex: 'dragHandle',
                key: 'dragHandle',
                width: 30,
                fixed: 'left',
                render: () => <MenuOutlined style={{ cursor: 'grab' }} />,
            });
        }

        // 添加ID列
        columns.push({
            title: 'ID',
            dataIndex: '_consolidated_data_id',
            key: '_consolidated_data_id',
            width: 80,
            fixed: 'left',
            sorter: (a, b) => a._consolidated_data_id - b._consolidated_data_id,
        });

        // 添加姓名列
        columns.push({
            title: t('dataViewer.columns.employeeName'),
            dataIndex: 'employee_name',
            key: 'employee_name',
            width: 120,
            fixed: 'left',
            sorter: (a, b) => {
                const nameA = a.employee_name || '';
                const nameB = b.employee_name || '';
                return nameA.localeCompare(nameB);
            },
        });

        // 从字段定义生成其他列
        fieldDefinitions.forEach(field => {
            // 跳过已添加的列
            if (field.key === '_consolidated_data_id' || field.key === 'employee_name') {
                return;
            }

            // 创建列配置
            const column: any = {
                title: field.title,
                dataIndex: field.dataIndex,
                key: field.key,
                width: field.width || 120,
                align: field.align || 'left',
            };

            // 添加排序功能
            if (field.sortable) {
                column.sorter = (a: any, b: any) => {
                    const valueA = a[field.dataIndex] || 0;
                    const valueB = b[field.dataIndex] || 0;
                    
                    if (typeof valueA === 'number' && typeof valueB === 'number') {
                        return valueA - valueB;
                    }
                    
                    return String(valueA).localeCompare(String(valueB));
                };
            }

            // 添加筛选功能（如果需要）
            if (field.key.includes('type') || field.key.includes('category') || field.key.includes('level')) {
                column.filters = [];
                column.onFilter = (value: string, record: any) => {
                    return record[field.dataIndex] === value;
                };
            }

            // 添加固定列设置
            if (field.fixed) {
                column.fixed = field.fixed;
            }

            columns.push(column);
        });

        // 添加实发合计列（固定在右侧）
        columns.push({
            title: t('dataViewer.columns.netPay'),
            dataIndex: 'calc_net_pay',
            key: 'calc_net_pay',
            width: 120,
            fixed: 'right',
            align: 'right',
            sorter: (a, b) => {
                const valueA = a.calc_net_pay || 0;
                const valueB = b.calc_net_pay || 0;
                return valueA - valueB;
            },
        });

        return columns;
    }, [t]);

    /**
     * 从数据生成默认列配置
     */
    const generateDefaultColumnsFromData = useCallback((): ColumnConfig[] => {
        if (data.length === 0) {
            return [];
        }

        const firstRecord = data[0];
        return Object.keys(firstRecord).map(key => {
            // 为一些特殊字段设置固定位置和宽度
            let fixed: 'left' | 'right' | undefined = undefined;
            let width = 120;
            let align: 'left' | 'right' | 'center' | undefined = undefined;

            if (key === '_consolidated_data_id') {
                fixed = 'left';
                width = 80;
            } else if (key === 'employee_name') {
                fixed = 'left';
                width = 120;
            } else if (key === 'calc_net_pay') {
                fixed = 'right';
                width = 120;
                align = 'right';
            } else if (key.startsWith('calc_') || key.includes('amount') || key.includes('salary') || key.includes('pay')) {
                align = 'right';
            }

            // 生成标题
            let title: string;
            if (key === '_consolidated_data_id') {
                title = 'ID';
            } else if (key === 'employee_name') {
                title = t('dataViewer.columns.employeeName');
            } else if (key === 'calc_net_pay') {
                title = t('dataViewer.columns.netPay');
            } else if (key.startsWith('calc_')) {
                title = key.replace('calc_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                align = 'right';
            } else {
                title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }

            return {
                key: key,
                title: title,
                visible: true,
                fixed: fixed,
                width: width,
                dataIndex: key,
                align: align
            };
        });
    }, [data, t]);

    /**
     * 加载服务器端默认布局
     */
    const loadServerDefaultLayout = useCallback(async (): Promise<boolean> => {
        try {
            // 获取服务器端布局
            const layouts = await fetchTableLayouts('salaryTable');

            // 查找默认布局
            const defaultLayout = layouts.find(layout => layout.is_default);

            if (defaultLayout) {
                console.log('Found default server layout:', defaultLayout.name);

                // 确保config_data存在且包含columns
                let configData;

                // 检查config_data是否为字符串，如果是则尝试解析
                if (typeof defaultLayout.config_data === 'string') {
                    try {
                        configData = JSON.parse(defaultLayout.config_data);
                    } catch (error) {
                        console.error('Failed to parse config_data string:', error);
                        configData = {};
                    }
                } else {
                    configData = defaultLayout.config_data || {};
                }

                let columns = Array.isArray(configData.columns) ? configData.columns : [];

                // 设置列配置
                setColumnConfigs(columns);
                
                // 保存当前加载的布局ID和名称
                setCurrentLayoutId(`server-${defaultLayout.id}`);
                setCurrentLayoutName(defaultLayout.name);

                // 保存到本地存储
                saveTableSetting('salaryTable_columnConfigs', columns);

                // 显示成功消息
                const successMsg = t('tableLayout.defaultLayoutLoaded').replace('{name}', defaultLayout.name);
                message.success(successMsg);
                return true;
            } else {
                // 如果没有默认布局，创建一个新的默认布局
                console.log('No default layout found, creating a new one');

                // 从数据中生成默认列配置
                const defaultColumns = generateDefaultColumnsFromData();

                if (defaultColumns.length > 0) {
                    try {
                        const newLayout = await createTableLayout({
                            table_id: 'salaryTable',
                            name: '默认布局',
                            config_data: {
                                columns: defaultColumns,
                                filters: []
                            },
                            is_default: true,
                            is_shared: true
                        });

                        console.log('Created new default layout:', newLayout);

                        // 设置列配置
                        setColumnConfigs(defaultColumns);
                        
                        // 保存当前加载的布局ID和名称
                        setCurrentLayoutId(`server-${newLayout.id}`);
                        setCurrentLayoutName(newLayout.name);

                        // 保存到本地存储
                        saveTableSetting('salaryTable_columnConfigs', defaultColumns);

                        return true;
                    } catch (error) {
                        console.error('Failed to create default layout:', error);
                        return false;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading server default layout:', error);
        }

        return false;
    }, [generateDefaultColumnsFromData, message, t]);

    /**
     * 切换列拖拽功能
     */
    const toggleColumnDraggable = useCallback(() => {
        setIsColumnDraggable(prev => !prev);
    }, []);

    return {
        columnConfigs,
        currentLayoutId,
        currentLayoutName,
        isColumnDraggable,
        generateColumns,
        generateDefaultColumnsFromData,
        loadServerDefaultLayout,
        toggleColumnDraggable,
        setColumnConfigs,
        setCurrentLayoutId,
        setCurrentLayoutName,
    };
};

export default useTableColumns;
