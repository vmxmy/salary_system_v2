import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { App, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TablePaginationConfig } from 'antd';
import type { Dayjs } from 'dayjs';
import { ColumnConfig } from '../table/ColumnSettingsDrawer';
import { FilterGroup } from '../table/AdvancedFilterDrawer';
import { SalaryFieldDefinition, fetchSalaryFieldDefinitions, SalaryRecordUpdateData } from '../../services/api';
import { applyFilters } from '../../utils/tableUtils';
import { useTour } from '../../context/TourContext';
import { SALARY_DATA_VIEWER_TOUR } from '../../tours';
import useSalaryData from '../../hooks/useSalaryData';

// 定义薪资记录接口
export interface SalaryRecord {
    _consolidated_data_id: number;
    employee_name?: string | null;
    pay_period_identifier?: string | null;
    id_card_number?: string | null;
    // 其他字段根据实际数据结构定义
    [key: string]: any;
}

// 定义筛选值接口
export interface RawFilterValues {
    pay_period?: Dayjs | null;
    employee_name?: string;
    sal_department_name?: string;
    sal_organization_name?: string;
    sal_establishment_type_name?: string;
}

// 定义API筛选参数接口
export interface FilterParams {
    pay_period?: string;
    employee_name?: string;
    sal_department_name?: string;
    sal_organization_name?: string;
    sal_establishment_type_name?: string;
}

// 定义上下文接口
interface SalaryContextType {
    // 数据状态
    data: SalaryRecord[];
    filteredData: SalaryRecord[];
    loading: boolean;
    error: string | null;

    // 表格配置状态
    fieldDefinitions: SalaryFieldDefinition[];
    columnConfigs: ColumnConfig[];
    advancedFilters: FilterGroup[];
    pagination: TablePaginationConfig;

    // 筛选状态
    tableFilters: FilterParams;
    form: any; // Form 实例

    // 布局状态
    currentLayoutId?: string;
    currentLayoutName: string;

    // 可见性状态
    columnSettingsVisible: boolean;
    advancedFilterVisible: boolean;
    tableLayoutVisible: boolean;
    exportModalVisible: boolean;

    // 拖拽状态
    isDraggable: boolean;
    isColumnDraggable: boolean;

    // 导出状态
    exportFormat: 'excel' | 'csv';

    // 引导状态
    tourVisible: boolean;

    // 编辑状态
    editingKey: number | null;
    editableFields: string[];

    // 方法
    setData: React.Dispatch<React.SetStateAction<SalaryRecord[]>>;
    setFilteredData: React.Dispatch<React.SetStateAction<SalaryRecord[]>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setColumnConfigs: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
    setAdvancedFilters: React.Dispatch<React.SetStateAction<FilterGroup[]>>;
    setPagination: React.Dispatch<React.SetStateAction<TablePaginationConfig>>;
    setTableFilters: React.Dispatch<React.SetStateAction<FilterParams>>;
    setCurrentLayoutId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setCurrentLayoutName: React.Dispatch<React.SetStateAction<string>>;
    setColumnSettingsVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setAdvancedFilterVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setTableLayoutVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setExportModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setExportFormat: React.Dispatch<React.SetStateAction<'excel' | 'csv'>>;
    setIsDraggable: React.Dispatch<React.SetStateAction<boolean>>;
    setIsColumnDraggable: React.Dispatch<React.SetStateAction<boolean>>;
    setTourVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setEditingKey: React.Dispatch<React.SetStateAction<number | null>>;

    // 功能方法
    fetchData?: (tableFilters: FilterParams, advancedFilters: FilterGroup[]) => Promise<SalaryRecord[]>; // 添加fetchData方法
    updateFilterAndResetPage: (newFilter: Partial<FilterParams>) => void;
    handlePayPeriodChange: (date: Dayjs | null) => void;
    handleNameSearch: () => void;
    resetFilters: () => void;
    toggleDraggable: () => void;
    toggleColumnDraggable: () => void;
    generateExportFileName: () => string;

    // 编辑相关方法
    isEditing: (record: SalaryRecord) => boolean;
    startEdit: (recordId: number) => void;
    cancelEdit: () => void;
    saveEdit: (recordId: number, data: SalaryRecordUpdateData) => Promise<void>;
    updateRecord?: (recordId: number, data: SalaryRecordUpdateData) => Promise<any>;
}

// 创建上下文
const SalaryContext = createContext<SalaryContextType | undefined>(undefined);

// 上下文提供者组件
export const SalaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 使用useSalaryData钩子获取和处理薪资数据
    const {
        data,
        filteredData,
        loading,
        error,
        fetchData,
        updateRecord,
        setData,
        setFilteredData,
        setLoading,
        setError
    } = useSalaryData();

    const { t } = useTranslation();
    const { message } = App.useApp();
    const [form] = Form.useForm<RawFilterValues>();
    const [tableFilters, setTableFilters] = useState<FilterParams>({});
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total, range) => {
            return t('common.pagination.showTotal')
                .replace('{rangeStart}', range[0].toString())
                .replace('{rangeEnd}', range[1].toString())
                .replace('{total}', total.toString());
        },
    });
    const [fieldDefinitions, setFieldDefinitions] = useState<SalaryFieldDefinition[]>([]);
    const [columnSettingsVisible, setColumnSettingsVisible] = useState<boolean>(false);
    const [advancedFilterVisible, setAdvancedFilterVisible] = useState<boolean>(false);
    const [tableLayoutVisible, setTableLayoutVisible] = useState<boolean>(false);
    const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
    const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
    const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
    const [currentLayoutId, setCurrentLayoutId] = useState<string | undefined>(undefined);
    const [currentLayoutName, setCurrentLayoutName] = useState<string>(t('tableLayout.defaultLayoutName'));
    const [isDraggable, setIsDraggable] = useState<boolean>(false);
    const [isColumnDraggable, setIsColumnDraggable] = useState<boolean>(false);
    const [fieldValueMap, setFieldValueMap] = useState<Map<string, Set<string>>>(new Map());
    const { isTourCompleted } = useTour();
    const [tourVisible, setTourVisible] = useState<boolean>(false);

    // 编辑状态
    const [editingKey, setEditingKey] = useState<number | null>(null);
    const editableFields = [
        'sal_remarks', 'sal_subsidy', 'sal_allowance', 'sal_post_salary',
        'sal_salary_step', 'sal_basic_salary', 'sal_tax_adjustment',
        'sal_salary_grade', 'sal_salary_level', 'sal_salary_backpay',
        'sal_post_category', 'sal_other_allowance', 'sal_other_deductions',
        'sal_living_allowance', 'sal_probation_salary', 'sal_one_time_deduction',
        'sal_performance_salary', 'sal_basic_performance_bonus',
        'sal_petition_post_allowance', 'sal_post_position_allowance',
        'sal_salary_transportation_allowance', 'sal_monthly_basic_performance',
        'sal_only_child_parents_reward', 'sal_rank_or_post_grade_salary',
        'sal_salary_step_backpay_total', 'sal_monthly_reward_performance',
        'sal_total_deduction_adjustment', 'sal_social_insurance_adjustment',
        'sal_quarterly_performance_bonus', 'sal_annual_fixed_salary_amount',
        'sal_position_or_technical_salary', 'sal_reform_1993_reserved_subsidy',
        'sal_reward_performance_deduction', 'sal_basic_performance_salary',
        'sal_incentive_performance_salary', 'sal_position_or_post_wage',
        'sal_rank_or_step_wage', 'tax_remarks'
    ];

    // 组件挂载时加载数据
    useEffect(() => {
        console.log("Component mounted, attempting to fetch initial data...");
        // 使用空的筛选条件初始加载数据
        if (fetchData) {
            fetchData({}, [])
                .then(() => console.log("Initial data fetch completed successfully"))
                .catch(err => console.error("Error fetching initial data:", err));
        } else {
            console.warn("fetchData function is not available on initial mount.");
        }
    }, [fetchData]);

    // 检查是否应该显示引导
    useEffect(() => {
        const shouldShowTour = !isTourCompleted(SALARY_DATA_VIEWER_TOUR.id);
        if (shouldShowTour) {
            const timer = setTimeout(() => {
                setTourVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isTourCompleted]);

    // 当数据或筛选条件变化时，应用筛选
    useEffect(() => {
        if (data.length > 0) {
            if (advancedFilters.length > 0) {
                const filtered = applyFilters(data, advancedFilters);
                setFilteredData(filtered);
                setPagination(prev => ({
                    ...prev,
                    total: filtered.length
                }));
            } else {
                setFilteredData(data);
                setPagination(prev => ({
                    ...prev,
                    total: data.length
                }));
            }
        }
    }, [data, advancedFilters, setFilteredData]);

    // 加载字段定义
    useEffect(() => {
        const loadFieldDefinitions = async () => {
            console.log("Loading field definitions...");
            try {
                const fields = await fetchSalaryFieldDefinitions();
                console.log(`Loaded ${fields.length} field definitions`);
                setFieldDefinitions(fields);

                // 如果没有列配置，自动生成默认列配置
                if (columnConfigs.length === 0 && fields.length > 0) {
                    console.log("Generating default column configs...");
                    const defaultColumns = fields.map(field => ({
                        key: field.key,
                        dataIndex: field.dataIndex,
                        title: field.title,
                        visible: true,
                        fixed: field.fixed,
                        width: field.width,
                    }));
                    console.log(`Generated ${defaultColumns.length} default columns`);
                    setColumnConfigs(defaultColumns);
                }
            } catch (error) {
                console.error("Failed to load field definitions:", error);
                setError(t('dataViewer.errors.filterOptionsFailed'));
                setFieldDefinitions([]);
            }
        };

        loadFieldDefinitions();
    }, [t, columnConfigs.length, setColumnConfigs]);

    // 功能方法
    const updateFilterAndResetPage = useCallback((newFilter: Partial<FilterParams>) => {
        setTableFilters(prevFilters => ({ ...prevFilters, ...newFilter }));
        setPagination(prev => ({ ...prev, current: 1 }));
    }, []);

    const handlePayPeriodChange = useCallback((date: Dayjs | null) => {
        const newFilter = { pay_period: date ? date.format('YYYY-MM') : undefined };
        updateFilterAndResetPage(newFilter);
        // 筛选条件变化后自动加载数据
        if (fetchData) {
            fetchData({ ...tableFilters, ...newFilter }, advancedFilters);
        } else {
            console.warn("fetchData function is not available after pay period change.");
        }
    }, [updateFilterAndResetPage, fetchData, tableFilters, advancedFilters]);

    const handleNameSearch = useCallback(() => {
        const nameValue = form.getFieldValue('employee_name');
        const newFilter = { employee_name: nameValue || undefined };
        updateFilterAndResetPage(newFilter);
        // 筛选条件变化后自动加载数据
        if (fetchData) {
            fetchData({ ...tableFilters, ...newFilter }, advancedFilters);
        } else {
            console.warn("fetchData function is not available after name search.");
        }
    }, [form, updateFilterAndResetPage, fetchData, tableFilters, advancedFilters]);

    const resetFilters = useCallback(() => {
        form.resetFields();
        setTableFilters({});
        setPagination(prev => ({ ...prev, current: 1 }));
        // 重置筛选条件后重新加载数据
        if (fetchData) {
            fetchData({}, []);
        } else {
            console.warn("fetchData function is not available after reset filters.");
        }
    }, [form, fetchData]);

    const toggleDraggable = useCallback(() => {
        setIsDraggable(prev => !prev);
    }, []);

    const toggleColumnDraggable = useCallback(() => {
        setIsColumnDraggable(prev => !prev);
    }, []);

    const generateExportFileName = useCallback(() => {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            ('0' + (now.getMonth() + 1)).slice(-2) +
            ('0' + now.getDate()).slice(-2) +
            '_' +
            ('0' + now.getHours()).slice(-2) +
            ('0' + now.getMinutes()).slice(-2) +
            ('0' + now.getSeconds()).slice(-2);

        const layoutPart = currentLayoutName ?
            currentLayoutName.replace(/[\\/:*?"<>|]/g, '_') :
            'salary-data';

        return `${layoutPart}_${timestamp}`;
    }, [currentLayoutName]);

    // 编辑相关方法
    const isEditing = useCallback((record: SalaryRecord) => {
        return record._consolidated_data_id === editingKey;
    }, [editingKey]);

    const startEdit = useCallback((recordId: number) => {
        setEditingKey(recordId);
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingKey(null);
    }, []);

    const saveEdit = useCallback(async (recordId: number, data: SalaryRecordUpdateData) => {
        try {
            if (!updateRecord) {
                console.error('updateRecord function is not available');
                message.error(t('dataViewer.errors.updateFailed'));
                return;
            }

            // 调用API更新记录
            await updateRecord(recordId, data);

            // 更新成功后清除编辑状态
            setEditingKey(null);

            // 显示成功消息
            message.success(t('dataViewer.messages.updateSuccess'));
        } catch (error: any) {
            console.error('Failed to save record:', error);
            message.error(error.message || t('dataViewer.errors.updateFailed'));
        }
    }, [updateRecord, message, t, setEditingKey]);

    // 提供上下文值
    const contextValue: SalaryContextType = {
        // 数据状态
        data,
        filteredData,
        loading,
        error,

        // 表格配置状态
        fieldDefinitions,
        columnConfigs,
        advancedFilters,
        pagination,

        // 筛选状态
        tableFilters,
        form,

        // 布局状态
        currentLayoutId,
        currentLayoutName,

        // 可见性状态
        columnSettingsVisible,
        advancedFilterVisible,
        tableLayoutVisible,
        exportModalVisible,

        // 拖拽状态
        isDraggable,
        isColumnDraggable,

        // 导出状态
        exportFormat,

        // 引导状态
        tourVisible,

        // 编辑状态
        editingKey,
        editableFields,

        // 状态设置方法
        setData,
        setFilteredData,
        setLoading,
        setError,
        setColumnConfigs,
        setAdvancedFilters,
        setPagination,
        setTableFilters,
        setCurrentLayoutId,
        setCurrentLayoutName,
        setColumnSettingsVisible,
        setAdvancedFilterVisible,
        setTableLayoutVisible,
        setExportModalVisible,
        setExportFormat,
        setIsDraggable,
        setIsColumnDraggable,
        setTourVisible,
        setEditingKey,

        // 功能方法
        fetchData, // 添加fetchData方法
        updateFilterAndResetPage,
        handlePayPeriodChange,
        handleNameSearch,
        resetFilters,
        toggleDraggable,
        toggleColumnDraggable,
        generateExportFileName,

        // 编辑相关方法
        isEditing,
        startEdit,
        cancelEdit,
        saveEdit,
        updateRecord,
    };

    return (
        <SalaryContext.Provider value={contextValue}>
            {children}
        </SalaryContext.Provider>
    );
};

// 自定义 Hook，用于在组件中使用 SalaryContext
export const useSalaryContext = () => {
    const context = useContext(SalaryContext);
    if (context === undefined) {
        throw new Error('useSalaryContext must be used within a SalaryProvider');
    }
    return context;
};
