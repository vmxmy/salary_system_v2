import { useState, useCallback } from 'react';
import { Form } from 'antd';
import type { Dayjs } from 'dayjs';
import { FilterGroup } from '../components/table/AdvancedFilterDrawer';
import { FilterParams, RawFilterValues } from '../components/SalaryDataViewer/SalaryContext';

/**
 * 自定义Hook，用于管理表格筛选逻辑
 */
export const useTableFilters = () => {
    const [form] = Form.useForm<RawFilterValues>();
    const [tableFilters, setTableFilters] = useState<FilterParams>({});
    const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
    const [advancedFilterVisible, setAdvancedFilterVisible] = useState<boolean>(false);

    /**
     * 更新筛选条件并重置页码
     * @param newFilter 新的筛选条件
     */
    const updateFilterAndResetPage = useCallback((newFilter: Partial<FilterParams>) => {
        setTableFilters(prevFilters => ({ ...prevFilters, ...newFilter }));
    }, []);

    /**
     * 处理工资发放周期变化
     * @param date 日期对象
     */
    const handlePayPeriodChange = useCallback((date: Dayjs | null) => {
        updateFilterAndResetPage({ pay_period: date ? date.format('YYYY-MM') : undefined });
    }, [updateFilterAndResetPage]);

    /**
     * 处理姓名搜索
     */
    const handleNameSearch = useCallback(() => {
        const nameValue = form.getFieldValue('employee_name');
        updateFilterAndResetPage({ employee_name: nameValue || undefined });
    }, [form, updateFilterAndResetPage]);

    /**
     * 处理部门筛选
     */
    const handleDepartmentChange = useCallback((value: string) => {
        updateFilterAndResetPage({ sal_department_name: value || undefined });
    }, [updateFilterAndResetPage]);

    /**
     * 处理单位筛选
     */
    const handleOrganizationChange = useCallback((value: string) => {
        updateFilterAndResetPage({ sal_organization_name: value || undefined });
    }, [updateFilterAndResetPage]);

    /**
     * 处理编制类型筛选
     */
    const handleEstablishmentTypeChange = useCallback((value: string) => {
        updateFilterAndResetPage({ sal_establishment_type_name: value || undefined });
    }, [updateFilterAndResetPage]);

    /**
     * 重置所有筛选条件
     */
    const resetFilters = useCallback(() => {
        form.resetFields();
        setTableFilters({});
    }, [form]);

    /**
     * 应用高级筛选条件
     * @param filters 筛选条件组
     */
    const applyAdvancedFilters = useCallback((filters: FilterGroup[]) => {
        setAdvancedFilters(filters);
        setAdvancedFilterVisible(false);
    }, []);

    /**
     * 清除高级筛选条件
     */
    const clearAdvancedFilters = useCallback(() => {
        setAdvancedFilters([]);
    }, []);

    return {
        form,
        tableFilters,
        advancedFilters,
        advancedFilterVisible,
        updateFilterAndResetPage,
        handlePayPeriodChange,
        handleNameSearch,
        handleDepartmentChange,
        handleOrganizationChange,
        handleEstablishmentTypeChange,
        resetFilters,
        applyAdvancedFilters,
        clearAdvancedFilters,
        setTableFilters,
        setAdvancedFilters,
        setAdvancedFilterVisible,
    };
};

export default useTableFilters;
