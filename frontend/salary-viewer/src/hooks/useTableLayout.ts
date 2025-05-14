import { useState, useCallback } from 'react';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { ColumnConfig } from '../components/table/ColumnSettingsDrawer';
import { FilterGroup } from '../components/table/AdvancedFilterDrawer';
import { saveTableSetting, loadTableSetting } from '../utils/tableUtils';
import { TableLayout } from '../components/table/TableLayoutManager';

/**
 * 自定义Hook，用于管理表格布局
 */
export const useTableLayout = () => {
    const [tableLayoutVisible, setTableLayoutVisible] = useState<boolean>(false);
    const [currentLayoutId, setCurrentLayoutId] = useState<string | undefined>(undefined);
    const [currentLayoutName, setCurrentLayoutName] = useState<string>('');
    const { t } = useTranslation();
    const { message } = App.useApp();

    /**
     * 保存表格布局
     * @param name 布局名称
     * @param columnConfigs 列配置
     * @param advancedFilters 高级筛选条件
     */
    const saveLayout = useCallback((
        name: string,
        columnConfigs: ColumnConfig[],
        advancedFilters: FilterGroup[]
    ) => {
        // 创建一个新的布局对象
        const newLayout = {
            id: `local-${Date.now()}`,
            name: name,
            columns: columnConfigs,
            filters: advancedFilters,
            createdAt: new Date().toISOString(),
            isServerStored: false
        };

        // 保存到本地存储
        saveTableSetting(`salaryTable_layout_${name}`, newLayout);

        // 更新当前布局信息
        setCurrentLayoutId(newLayout.id);
        setCurrentLayoutName(name);

        // 显示成功消息
        const successMsg = t('tableLayout.saveSuccess').replace('{name}', name);
        message.success(successMsg);

        // 关闭布局管理器
        setTableLayoutVisible(false);
    }, [message, t]);

    /**
     * 加载表格布局
     * @param layout 布局对象
     */
    const loadLayout = useCallback((
        layout: TableLayout,
        setColumnConfigs: (configs: ColumnConfig[]) => void,
        setAdvancedFilters: (filters: FilterGroup[]) => void
    ) => {
        console.log('Loading layout:', layout);

        // 检查布局是否有有效的列配置
        if (!layout.columns || layout.columns.length === 0) {
            console.warn('Layout has empty columns');
            return;
        }

        // 设置列配置
        setColumnConfigs(layout.columns);

        // 设置高级筛选条件（如果有）
        if (layout.filters && layout.filters.length > 0) {
            setAdvancedFilters(layout.filters as FilterGroup[]);
        }

        // 保存当前加载的布局ID和名称
        setCurrentLayoutId(layout.id);
        setCurrentLayoutName(layout.name);

        // 保存到本地存储
        saveTableSetting('salaryTable_columnConfigs', layout.columns);

        // 显示成功消息
        const successMsg = t('tableLayout.loadSuccess').replace('{name}', layout.name);
        message.success(successMsg);

        // 关闭布局管理器
        setTableLayoutVisible(false);
    }, [message, t]);

    /**
     * 更新表格布局
     * @param layout 布局对象
     */
    const updateLayout = useCallback((
        layout: TableLayout,
        columnConfigs: ColumnConfig[]
    ) => {
        console.log('Updating layout:', layout);

        // 保存列配置
        saveTableSetting('salaryTable_columnConfigs', columnConfigs);

        // 更新布局名称
        setCurrentLayoutName(layout.name);

        // 显示成功消息
        const successMsg = t('tableLayout.updateSuccess').replace('{name}', layout.name);
        message.success(successMsg);
    }, [message, t]);

    /**
     * 从本地存储加载布局
     */
    const loadLayoutFromLocalStorage = useCallback((
        setColumnConfigs: (configs: ColumnConfig[]) => void
    ) => {
        const savedConfigs = loadTableSetting<ColumnConfig[]>('salaryTable_columnConfigs', []);
        if (savedConfigs.length > 0) {
            setColumnConfigs(savedConfigs);
            return true;
        }
        return false;
    }, []);

    /**
     * 生成导出文件名
     */
    const generateExportFileName = useCallback(() => {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            ('0' + (now.getMonth() + 1)).slice(-2) +
            ('0' + now.getDate()).slice(-2) +
            '_' +
            ('0' + now.getHours()).slice(-2) +
            ('0' + now.getMinutes()).slice(-2) +
            ('0' + now.getSeconds()).slice(-2);

        // 使用布局名称（如果有）和时间戳
        const layoutPart = currentLayoutName ?
            currentLayoutName.replace(/[\\/:*?"<>|]/g, '_') : // 替换文件名中不允许的字符
            'salary-data';

        return `${layoutPart}_${timestamp}`;
    }, [currentLayoutName]);

    return {
        tableLayoutVisible,
        currentLayoutId,
        currentLayoutName,
        saveLayout,
        loadLayout,
        updateLayout,
        loadLayoutFromLocalStorage,
        generateExportFileName,
        setTableLayoutVisible,
        setCurrentLayoutId,
        setCurrentLayoutName,
    };
};

export default useTableLayout;
