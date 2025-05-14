import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient, { SalaryRecordUpdateData, updateSalaryRecord } from '../services/api';
import { FilterGroup } from '../components/table/AdvancedFilterDrawer';
import { applyFilters } from '../utils/tableUtils';
import { SalaryRecord, FilterParams } from '../components/SalaryDataViewer/SalaryContext';

// 定义API响应接口
interface SalaryDataResponse {
    data: SalaryRecord[];
    total: number;
}

/**
 * 自定义Hook，用于获取和处理薪资数据
 */
export const useSalaryData = () => {
    const [data, setData] = useState<SalaryRecord[]>([]);
    const [filteredData, setFilteredData] = useState<SalaryRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState<number>(0);
    const { t } = useTranslation();

    /**
     * 获取薪资数据
     * @param tableFilters 表格筛选条件
     * @param advancedFilters 高级筛选条件
     */
    const fetchData = useCallback(async (
        tableFilters: FilterParams,
        advancedFilters: FilterGroup[]
    ) => {
        console.log("useSalaryData.fetchData called with filters:", { tableFilters, advancedFilters });
        setLoading(true);
        setError(null);

        try {
            // 构建查询参数（只包含筛选条件，不包含分页参数）
            const queryParams: Record<string, any> = {};

            // 添加基本筛选条件
            Object.entries(tableFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams[key] = value;
                }
            });

            // 由于数据量小，直接请求所有数据（不使用分页）
            queryParams.limit = 1000; // 设置一个足够大的值
            queryParams.offset = 0;

            console.log("Fetching all data with params:", queryParams);

            const response = await apiClient.get<SalaryDataResponse>('/api/salary_data', {
                params: queryParams
            });

            console.log("API response status:", response.status);
            console.log("API response headers:", response.headers);

            const allRecords = response.data.data || [];
            console.log(`Received ${allRecords.length} records, total count: ${response.data.total}`);

            if (allRecords.length > 0) {
                console.log("Sample record:", allRecords[0]);
            } else {
                console.warn("No records received from API");
            }

            setData(allRecords);
            setTotal(response.data.total || allRecords.length);

            // 如果有高级筛选条件，立即应用
            if (advancedFilters.length > 0) {
                console.log("Applying advanced filters...");
                const filtered = applyFilters(allRecords, advancedFilters);
                console.log(`After filtering: ${filtered.length} records`);
                setFilteredData(filtered);
            } else {
                console.log("No advanced filters, using all records");
                setFilteredData(allRecords);
            }

            return allRecords; // 返回获取的数据，以便在Promise链中使用
        } catch (err: any) {
            console.error("Failed to fetch salary data:", err);
            console.error("Error details:", err.response?.data || err.message);
            setError(err.response?.data?.detail || err.message || t('dataViewer.errors.fetchFailed'));
            setData([]);
            setFilteredData([]);
            setTotal(0);
            throw err; // 重新抛出错误，以便在Promise链中捕获
        } finally {
            setLoading(false);
        }
    }, [t]);

    /**
     * 应用高级筛选条件
     * @param sourceData 源数据
     * @param filters 筛选条件
     */
    const applyAdvancedFilters = useCallback((
        sourceData: SalaryRecord[],
        filters: FilterGroup[]
    ) => {
        if (filters.length === 0) {
            setFilteredData(sourceData);
            return sourceData;
        }

        const filtered = applyFilters(sourceData, filters);
        setFilteredData(filtered);
        return filtered;
    }, []);

    /**
     * 获取字段的所有唯一值
     * @param fieldName 字段名
     */
    const getFieldUniqueValues = useCallback((fieldName: string): Set<string> => {
        const values = new Set<string>();
        data.forEach(record => {
            const value = record[fieldName];
            if (value !== undefined && value !== null && value !== '') {
                values.add(String(value));
            }
        });
        return values;
    }, [data]);

    /**
     * 获取所有字段的唯一值映射
     */
    const getAllFieldValueMaps = useCallback((): Map<string, Set<string>> => {
        const fieldValueMap = new Map<string, Set<string>>();

        if (data.length === 0) return fieldValueMap;

        // 获取第一条记录的所有字段
        const firstRecord = data[0];
        const fieldNames = Object.keys(firstRecord);

        // 为每个字段创建唯一值集合
        fieldNames.forEach(fieldName => {
            fieldValueMap.set(fieldName, getFieldUniqueValues(fieldName));
        });

        return fieldValueMap;
    }, [data, getFieldUniqueValues]);

    /**
     * 更新薪资记录
     * @param recordId 记录ID
     * @param updateData 更新数据
     */
    const updateRecord = useCallback(async (
        recordId: number,
        updateData: SalaryRecordUpdateData
    ) => {
        setLoading(true);
        setError(null);

        try {
            console.log(`Updating salary record ${recordId} with data:`, updateData);

            // 调用API更新记录
            const updatedRecord = await updateSalaryRecord(recordId, updateData);
            console.log(`Successfully updated record ${recordId}:`, updatedRecord);

            // 更新本地数据
            setData(prevData => {
                const newData = [...prevData];
                const index = newData.findIndex(record => record._consolidated_data_id === recordId);

                if (index !== -1) {
                    // 合并更新的数据
                    newData[index] = { ...newData[index], ...updatedRecord };
                }

                return newData;
            });

            // 更新筛选后的数据
            setFilteredData(prevData => {
                const newData = [...prevData];
                const index = newData.findIndex(record => record._consolidated_data_id === recordId);

                if (index !== -1) {
                    // 合并更新的数据
                    newData[index] = { ...newData[index], ...updatedRecord };
                }

                return newData;
            });

            return updatedRecord;
        } catch (err: any) {
            console.error(`Failed to update salary record ${recordId}:`, err);
            setError(err.response?.data?.detail || err.message || t('dataViewer.errors.updateFailed'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, [t]);

    return {
        data,
        filteredData,
        loading,
        error,
        total,
        fetchData,
        updateRecord,
        applyAdvancedFilters,
        getFieldUniqueValues,
        getAllFieldValueMaps,
        setData,
        setFilteredData,
        setLoading,
        setError,
    };
};

export default useSalaryData;
