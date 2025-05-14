import { useState, useCallback } from 'react';
import { ColumnConfig } from '../components/table/ColumnSettingsDrawer';
import { SalaryRecord } from '../components/SalaryDataViewer/SalaryContext';

/**
 * 自定义Hook，用于管理表格导出功能
 */
export const useTableExport = () => {
    const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');

    /**
     * 打开导出模态框
     * @param format 导出格式
     */
    const openExportModal = useCallback((format: 'excel' | 'csv' = 'excel') => {
        setExportFormat(format);
        setExportModalVisible(true);
    }, []);

    /**
     * 关闭导出模态框
     */
    const closeExportModal = useCallback(() => {
        setExportModalVisible(false);
    }, []);

    /**
     * 生成导出文件名
     * @param layoutName 布局名称
     */
    const generateExportFileName = useCallback((layoutName?: string) => {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            ('0' + (now.getMonth() + 1)).slice(-2) +
            ('0' + now.getDate()).slice(-2) +
            '_' +
            ('0' + now.getHours()).slice(-2) +
            ('0' + now.getMinutes()).slice(-2) +
            ('0' + now.getSeconds()).slice(-2);

        // 使用布局名称（如果有）和时间戳
        const layoutPart = layoutName ?
            layoutName.replace(/[\\/:*?"<>|]/g, '_') : // 替换文件名中不允许的字符
            'salary-data';

        return `${layoutPart}_${timestamp}`;
    }, []);

    /**
     * 准备导出数据
     * @param data 原始数据
     * @param columns 列配置
     * @param selectedColumnKeys 选中的列键
     */
    const prepareExportData = useCallback((
        data: SalaryRecord[],
        columns: ColumnConfig[],
        selectedColumnKeys: string[]
    ) => {
        // 筛选选中的列
        const selectedColumns = columns.filter(col => selectedColumnKeys.includes(col.key));

        // 准备导出数据
        const exportData = [];
        const dataLength = data.length;
        const colLength = selectedColumns.length;

        // 预先创建列映射，避免在循环中重复计算
        const columnMappings = selectedColumns.map(col => ({
            dataIndex: col.dataIndex || col.key,
            title: typeof col.title === 'string' ? col.title : col.key
        }));

        // 分批处理数据，每批 1000 条
        const batchSize = 1000;
        for (let i = 0; i < dataLength; i += batchSize) {
            const endIndex = Math.min(i + batchSize, dataLength);

            for (let j = i; j < endIndex; j++) {
                const record = data[j];
                const row: Record<string, any> = {};

                for (let k = 0; k < colLength; k++) {
                    const { dataIndex, title } = columnMappings[k];
                    row[title] = record[dataIndex];
                }

                exportData.push(row);
            }
        }

        return exportData;
    }, []);

    return {
        exportModalVisible,
        exportFormat,
        openExportModal,
        closeExportModal,
        generateExportFileName,
        prepareExportData,
        setExportModalVisible,
        setExportFormat,
    };
};

export default useTableExport;
