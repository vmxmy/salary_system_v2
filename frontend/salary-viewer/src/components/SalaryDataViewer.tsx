import React, { useState, useEffect, useCallback } from 'react';
import { Table, Form, Input, Button, Spin, Alert, Space, DatePicker, Tag, App } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import apiClient, {
    fetchSalaryFieldDefinitions,
    SalaryFieldDefinition
} from '../services/api';
import type { TableProps, TablePaginationConfig, TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';

// 导入自定义组件
import TableToolbar from './table/TableToolbar';
import ColumnSettingsDrawer, { ColumnConfig } from './table/ColumnSettingsDrawer';
import AdvancedFilterDrawer, { FilterGroup } from './table/AdvancedFilterDrawer';
import TableLayoutManager from './table/TableLayoutManager';
import ExportTableModal from './table/ExportTableModal';

// 导入工具函数
import {
    convertColumnsToConfig,
    convertConfigToColumns,
    applyFilters,
    loadTableSetting,
    saveTableSetting
} from '../utils/tableUtils';

// Define the interface for the salary record (should match backend Pydantic model)
interface SalaryRecord {
    _consolidated_data_id: number;
    employee_name?: string | null;
    pay_period_identifier?: string | null;
    id_card_number?: string | null;

    // 年金相关字段
    ann_annuity_contribution_base_salary?: number | null;
    ann_annuity_contribution_base?: number | null;
    ann_annuity_employer_rate?: number | null;
    ann_annuity_employer_contribution?: number | null;
    ann_annuity_employee_rate?: number | null;
    ann_annuity_employee_contribution?: number | null;
    ann_employee_type_key?: string | null;

    // 住房公积金相关字段
    hf_housingfund_contribution_base_salary?: number | null;
    hf_housingfund_contribution_base?: number | null;
    hf_housingfund_employer_rate?: number | null;
    hf_housingfund_employer_contribution?: number | null;
    hf_housingfund_employee_rate?: number | null;
    hf_housingfund_employee_contribution?: number | null;
    hf_employee_type_key?: string | null;

    // 医疗保险相关字段
    med_contribution_base_salary?: number | null;
    med_contribution_base?: number | null;
    med_employer_medical_rate?: number | null;
    med_employer_medical_contribution?: number | null;
    med_employee_medical_rate?: number | null;
    med_employee_medical_contribution?: number | null;
    med_employer_critical_illness_rate?: number | null;
    med_employer_critical_illness_contribution?: number | null;
    med_medical_total_employer_contribution?: number | null;
    med_medical_total_employee_contribution?: number | null;
    med_employee_type_key?: string | null;

    // 养老保险相关字段
    pen_pension_contribution_base?: number | null;
    pen_pension_total_amount?: number | null;
    pen_pension_employer_rate?: number | null;
    pen_pension_employer_contribution?: number | null;
    pen_pension_employee_rate?: number | null;
    pen_pension_employee_contribution?: number | null;
    pen_unemployment_contribution_base?: number | null;
    pen_unemployment_total_amount?: number | null;
    pen_unemployment_employer_rate?: number | null;
    pen_unemployment_employer_contribution?: number | null;
    pen_unemployment_employee_rate?: number | null;
    pen_unemployment_employee_contribution?: number | null;
    pen_injury_contribution_base?: number | null;
    pen_injury_total_amount?: number | null;
    pen_injury_employer_rate?: number | null;
    pen_injury_employer_contribution?: number | null;
    pen_ss_total_employer_contribution?: number | null;
    pen_ss_total_employee_contribution?: number | null;
    pen_employee_type_key?: string | null;

    // 薪资相关字段
    sal_remarks?: string | null;
    sal_subsidy?: number | null;
    sal_allowance?: number | null;
    sal_post_salary?: number | null;
    sal_salary_step?: number | null;
    sal_basic_salary?: number | null;
    sal_tax_adjustment?: number | null;
    sal_salary_grade?: string | null;
    sal_salary_level?: string | null;
    sal_salary_backpay?: number | null;
    sal_post_category?: string | null;
    sal_other_allowance?: number | null;
    sal_other_deductions?: number | null;
    sal_employee_type_key?: string | null;
    sal_personnel_rank?: string | null;
    sal_living_allowance?: number | null;
    sal_probation_salary?: number | null;
    sal_one_time_deduction?: number | null;
    sal_performance_salary?: number | null;
    sal_personnel_identity?: string | null;
    sal_total_backpay_amount?: number | null;
    sal_individual_income_tax?: number | null;
    sal_housing_fund_adjustment?: number | null;
    sal_basic_performance_bonus?: number | null;
    sal_petition_post_allowance?: number | null;
    sal_post_position_allowance?: number | null;
    sal_salary_transportation_allowance?: number | null;
    sal_self_annuity_contribution?: number | null;
    sal_self_medical_contribution?: number | null;
    sal_self_pension_contribution?: number | null;
    sal_monthly_basic_performance?: number | null;
    sal_only_child_parents_reward?: number | null;
    sal_rank_or_post_grade_salary?: number | null;
    sal_salary_step_backpay_total?: number | null;
    sal_ref_official_salary_step?: string | null;
    sal_monthly_reward_performance?: number | null;
    sal_total_deduction_adjustment?: number | null;
    sal_social_insurance_adjustment?: number | null;
    sal_quarterly_performance_bonus?: number | null;
    sal_annual_fixed_salary_amount?: number | null;
    sal_position_or_technical_salary?: number | null;
    sal_reform_1993_reserved_subsidy?: number | null;
    sal_reward_performance_deduction?: number | null;
    sal_employer_annuity_contribution?: number | null;
    sal_employer_medical_contribution?: number | null;
    sal_employer_pension_contribution?: number | null;
    sal_self_housing_fund_contribution?: number | null;
    sal_self_unemployment_contribution?: number | null;
    sal_petition_worker_post_allowance?: number | null;
    sal_ref_official_post_salary_level?: string | null;
    sal_basic_performance_bonus_deduction?: number | null;
    sal_salary_civil_servant_normative_allowance?: number | null;
    sal_employer_housing_fund_contribution?: number | null;
    sal_employer_unemployment_contribution?: number | null;
    sal_employer_critical_illness_contribution?: number | null;
    sal_bank_account_number?: string | null;
    sal_bank_branch_name?: string | null;
    sal_employment_start_date?: string | null;
    sal_employment_status?: string | null;
    sal_organization_name?: string | null;
    sal_department_name?: string | null;
    sal_basic_performance_salary?: number | null;
    sal_incentive_performance_salary?: number | null;
    sal_self_injury_contribution?: number | null;
    sal_employer_injury_contribution?: number | null;
    sal_position_or_post_wage?: number | null;
    sal_rank_or_step_wage?: number | null;
    sal_is_leader?: boolean | null;
    sal_pay_period?: string | null;
    sal_employee_unique_id?: string | null;
    sal_establishment_type_name?: string | null;
    sal_position_rank?: string | null;
    sal_gender?: string | null;
    sal_ethnicity?: string | null;
    sal_date_of_birth?: string | null;
    sal_education_level?: string | null;
    sal_service_interruption_years?: number | null;
    sal_continuous_service_years?: number | null;
    sal_actual_position?: string | null;
    sal_actual_position_start_date?: string | null;
    sal_position_level_start_date?: string | null;

    // 税务相关字段
    tax_period_identifier?: string | null;
    tax_income_period_start?: string | null;
    tax_income_period_end?: string | null;
    tax_current_period_income?: number | null;
    tax_current_period_tax_exempt_income?: number | null;
    tax_deduction_basic_pension?: number | null;
    tax_deduction_basic_medical?: number | null;
    tax_deduction_unemployment?: number | null;
    tax_deduction_housing_fund?: number | null;
    tax_deduction_child_edu_cumulative?: number | null;
    tax_deduction_cont_edu_cumulative?: number | null;
    tax_deduction_housing_loan_interest_cumulative?: number | null;
    tax_deduction_housing_rent_cumulative?: number | null;
    tax_deduction_support_elderly_cumulative?: number | null;
    tax_deduction_infant_care_cumulative?: number | null;
    tax_deduction_private_pension_cumulative?: number | null;
    tax_deduction_annuity?: number | null;
    tax_deduction_commercial_health_insurance?: number | null;
    tax_deduction_deferred_pension_insurance?: number | null;
    tax_deduction_other?: number | null;
    tax_deduction_donations?: number | null;
    tax_total_deductions_pre_tax?: number | null;
    tax_reduction_amount?: number | null;
    tax_standard_deduction?: number | null;
    tax_calculated_income_tax?: number | null;
    tax_remarks?: string | null;
    tax_employee_type_key?: string | null;

    // 其他字段
    _import_batch_id?: number | null;
    _consolidation_timestamp?: string | null;

    // 计算总额
    calc_xiaoji?: number | null;
    calc_personal_deductions?: number | null;
    calc_total_payable?: number | null;
    calc_net_pay?: number | null;
}

// Define the interface for the API response
interface SalaryDataResponse {
    data: SalaryRecord[];
    total: number;
}

// Define the interface for filter values (raw form values)
interface RawFilterValues {
    pay_period?: Dayjs | null; // DatePicker returns Dayjs object
    employee_name?: string;
    sal_department_name?: string;
    sal_organization_name?: string;
    sal_establishment_type_name?: string; // Select might return empty string or a specific value for "All"
}

// Define interface for ACTUAL filter parameters sent to API (excluding pagination)
interface FilterParams {
    pay_period?: string; // Expecting YYYY-MM string
    employee_name?: string;
    sal_department_name?: string;
    sal_organization_name?: string;
    sal_establishment_type_name?: string;
}

const SalaryDataViewer: React.FC = () => {
    const [data, setData] = useState<SalaryRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const { message } = App.useApp(); // 使用 App.useApp() 钩子获取 message 实例
    const [form] = Form.useForm<RawFilterValues>();
    const [tableFilters, setTableFilters] = useState<FilterParams>({});
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total, range) => t('common.pagination.showTotal', { rangeStart: range[0], rangeEnd: range[1], total }),
    });
    // 移除了未使用的状态变量
    const [fieldDefinitions, setFieldDefinitions] = useState<SalaryFieldDefinition[]>([]);

    // 新增状态
    const [columnSettingsVisible, setColumnSettingsVisible] = useState<boolean>(false);
    const [advancedFilterVisible, setAdvancedFilterVisible] = useState<boolean>(false);
    const [tableLayoutVisible, setTableLayoutVisible] = useState<boolean>(false);
    const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
    const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
    const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
    const [filteredData, setFilteredData] = useState<SalaryRecord[]>([]);
    const [currentLayoutId, setCurrentLayoutId] = useState<string | undefined>(undefined);

    // 动态生成表格列
    const generateColumns = (): TableColumnsType<SalaryRecord> => {
        if (fieldDefinitions.length === 0) {
            // 如果还没有获取到字段定义，返回一个基本的列定义
            return [
                { title: t('dataViewer.table.colId'), dataIndex: '_consolidated_data_id', key: '_consolidated_data_id', fixed: 'left', width: 80 },
                { title: t('dataViewer.table.colName'), dataIndex: 'employee_name', key: 'employee_name', fixed: 'left', width: 120 },
                { title: t('dataViewer.table.colNetPay'), dataIndex: 'calc_net_pay', key: 'calc_net_pay', width: 120, fixed: 'right', align: 'right' }
            ];
        }

        // Filter out columns where all data is null or undefined
        const columnsToShow = fieldDefinitions.filter(field => {
            // Check if any record has a non-null/undefined value for this field
            return data.some(record => record[field.dataIndex as keyof SalaryRecord] !== null && record[field.dataIndex as keyof SalaryRecord] !== undefined);
        });

        return columnsToShow.map(field => {
            const column: any = {
                title: t(`dataViewer.table.${field.key}`, field.title), // 尝试使用翻译，如果没有则使用默认标题
                dataIndex: field.dataIndex,
                key: field.key,
                width: field.width,
                sorter: field.sortable
            };

            // 设置对齐方式
            if (field.align) {
                column.align = field.align;
            }

            // 设置固定列
            if (field.fixed) {
                column.fixed = field.fixed;
            }

            // 设置渲染函数
            if (field.render_type === 'tag') {
                column.render = (value: string | null | undefined) => {
                    if (!value) return '-';
                    let color = 'default';
                    switch (value) {
                        case '公务员': color = 'blue'; break;
                        case '参公': color = 'green'; break;
                        case '事业': color = 'purple'; break;
                        case '专技': color = 'cyan'; break;
                        case '专项': color = 'gold'; break;
                        case '区聘': color = 'orange'; break;
                        case '原投服': color = 'magenta'; break;
                        default: color = 'default'; break;
                    }
                    return <Tag color={color}>{value}</Tag>;
                };
            } else if (field.render_type === 'datetime') {
                column.render = (val: any) => val ? new Date(val).toLocaleString() : '-';
            } else if (field.render === 'toFixed(2)') {
                column.render = (val: any) => val?.toFixed(2);
            }

            return column;
        });
    };

    // 生成表格列
    const columns = columnConfigs.length > 0
        ? convertConfigToColumns(columnConfigs)
        : generateColumns();

    // 初始化列配置
    useEffect(() => {
        if (fieldDefinitions.length > 0 && columnConfigs.length === 0) {
            // 尝试从localStorage加载列配置
            const savedConfigs = loadTableSetting<ColumnConfig[]>('salaryTable_columnConfigs', []);

            if (savedConfigs.length > 0) {
                // 验证保存的配置是否与当前字段定义匹配
                const currentKeys = fieldDefinitions.map(field => field.key);
                const savedKeys = savedConfigs.map(config => config.key);

                // 如果有新增字段或删除字段，重新生成配置
                if (!currentKeys.every(key => savedKeys.includes(key)) ||
                    !savedKeys.every(key => currentKeys.includes(key))) {
                    const newConfigs = convertColumnsToConfig(generateColumns());
                    setColumnConfigs(newConfigs);
                } else {
                    setColumnConfigs(savedConfigs);
                }
            } else {
                // 没有保存的配置，生成新的
                const newConfigs = convertColumnsToConfig(generateColumns());
                setColumnConfigs(newConfigs);
            }
        }
    }, [fieldDefinitions]);

    // 应用高级筛选
    useEffect(() => {
        if (advancedFilters.length > 0) {
            setFilteredData(applyFilters(data, advancedFilters));
        } else {
            setFilteredData(data);
        }
    }, [data, advancedFilters]);

    // Function to fetch data from API
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const current = pagination.current || 1;
        const pageSize = pagination.pageSize || 10;
        const offset = (current - 1) * pageSize;

        // Correctly include filter parameters
        const queryParams: Record<string, any> = {
            limit: pageSize,
            offset: offset,
        };
        // Add filters to params only if they have a value
        Object.entries(tableFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams[key] = value;
            }
        });

        console.log("Fetching data with params:", queryParams);
        try {
            const response = await apiClient.get<SalaryDataResponse>('/api/salary_data', {
                params: queryParams
            });
            setData(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                current,
                pageSize,
                total: response.data.total || 0
            }));
        } catch (err: any) {
            console.error("Failed to fetch salary data:", err);
            setError(err.response?.data?.detail || err.message || t('dataViewer.errors.fetchFailed'));
            setData([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize, tableFilters, t]);

    // useEffect for fetching data when filters or pagination change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Effect to fetch all dropdown data and field definitions on mount
    useEffect(() => {
        const loadDropdownData = async () => {
            console.log("Fetching field definitions...");
            try {
                // 只获取字段定义
                const fields = await fetchSalaryFieldDefinitions();
                setFieldDefinitions(fields);
                console.log("Field definitions loaded:", {
                    fieldCount: fields.length
                });
            } catch (error) {
                console.error("Failed to load field definitions:", error);
                setError(t('dataViewer.errors.filterOptionsFailed'));
                setFieldDefinitions([]);
            } finally {
                // 移除了未使用的状态更新
            }
        };

        loadDropdownData();
    }, [t]);

    // --- Specific Filter Change Handlers --- START
    const updateFilterAndResetPage = (newFilter: Partial<FilterParams>) => {
        setTableFilters(prevFilters => ({ ...prevFilters, ...newFilter }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handlePayPeriodChange = (date: Dayjs | null) => {
        updateFilterAndResetPage({ pay_period: date ? date.format('YYYY-MM') : undefined });
    };

    // 移除了未使用的处理函数

    const handleNameSearch = () => {
        const nameValue = form.getFieldValue('employee_name');
        console.log("Handling name search for:", nameValue)
        updateFilterAndResetPage({ employee_name: nameValue || undefined });
    };
    // --- Specific Filter Change Handlers --- END

    const handleTableChange: TableProps<SalaryRecord>['onChange'] = (
        newPagination,
        _filters,
        _sorter
    ) => {
        setPagination({
            ...pagination,
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        });
        // Handle server-side sorting if needed based on sorter argument
    };

    // Function to reset filters
    const resetFilters = () => {
        form.resetFields();
        setTableFilters({});
        setPagination(prev => ({ ...prev, current: 1 }));
        // Fetch data is called automatically by useEffect due to filter/pagination change
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Add CSS rules directly here for demonstration.
                In a real application, place these in a global CSS file (e.g., index.css)
                or use CSS Modules. */}
            <style>
                {`
                    .zebra-striped-table .ant-table-tbody > tr:nth-child(even) > td {
                        background-color: #fafafa; /* Very light grey for even rows */
                    }
                    /* Optional: slightly adjust hover background for even rows if needed */
                    /*
                    .zebra-striped-table .ant-table-tbody > tr:nth-child(even):hover > td {
                        background-color: #f0f0f0;
                    }
                    */
                `}
            </style>

            <h2>{t('dataViewer.title')}</h2>

            {/* Filter Form Implementation - Use Space for layout */}
            <Form
                form={form}
                layout="inline"
                style={{ marginBottom: 16 }}
            >
                <Space wrap size="middle">
                    <Form.Item
                        label={t('dataViewer.filters.payPeriodLabel')}
                        style={{ margin: 0 }}
                        htmlFor="pay_period_filter"
                        name="pay_period" // Added name attribute
                    >
                        <DatePicker
                            id="pay_period_filter"
                            picker="month"
                            format="YYYY-MM"
                            style={{ width: 140 }}
                            placeholder={t('dataViewer.filters.payPeriodPlaceholder')}
                            onChange={handlePayPeriodChange}
                        />
                    </Form.Item>
                    <Form.Item
                        label={t('dataViewer.filters.employeeNameLabel')}
                        style={{ margin: 0 }}
                        htmlFor="employee_name_filter"
                        name="employee_name" // Added name attribute
                    >
                        <Input
                            id="employee_name_filter"
                            placeholder={t('dataViewer.filters.employeeNamePlaceholder')}
                            style={{ width: 160 }}
                            allowClear
                            onPressEnter={handleNameSearch}
                        />
                    </Form.Item>
                    <Space>
                        <Button
                            type="primary"
                            onClick={handleNameSearch}
                        >
                            {t('common.search')}
                        </Button>
                        <Button
                            onClick={resetFilters}
                            icon={<ClearOutlined />}
                        >
                            {t('common.reset')}
                        </Button>
                    </Space>
                </Space>
            </Form>

            {/* 工具栏 */}
            <TableToolbar
                onColumnSettingsClick={() => setColumnSettingsVisible(true)}
                onAdvancedFilterClick={() => setAdvancedFilterVisible(true)}
                onSaveLayoutClick={() => setTableLayoutVisible(true)}
                onExportClick={() => setExportModalVisible(true)}
                onRefreshClick={fetchData}
                loading={loading}
            />

            {error && <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }}/>}

            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    rowKey={(record) => {
                        const id = record._consolidated_data_id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                        const period = record.pay_period_identifier || 'no-period';
                        return `${id}-${period}`;
                    }}
                    dataSource={advancedFilters.length > 0 ? filteredData : data}
                    pagination={pagination}
                    loading={loading}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content', y: 600 }}
                    bordered
                    size="small"
                    className="zebra-striped-table"
                    sticky
                />
            </Spin>

            {/* 列设置抽屉 */}
            <ColumnSettingsDrawer
                open={columnSettingsVisible}
                onClose={() => setColumnSettingsVisible(false)}
                columns={generateColumns()}
                onColumnsChange={(newColumns) => {
                    setColumnConfigs(newColumns);
                    saveTableSetting('salaryTable_columnConfigs', newColumns);
                    message.success(t('columnSettings.saveSuccess'));
                }}
                defaultVisibleKeys={columnConfigs.filter(col => col.visible).map(col => col.key)}
                currentColumnConfigs={columnConfigs}
            />

            {/* 高级筛选抽屉 */}
            <AdvancedFilterDrawer
                open={advancedFilterVisible}
                onClose={() => setAdvancedFilterVisible(false)}
                columns={generateColumns()}
                onApplyFilter={(groups) => {
                    setAdvancedFilters(groups);
                    message.success(t('advancedFilter.applySuccess'));
                }}
                initialConditions={advancedFilters}
            />

            {/* 表格布局管理器 */}
            <TableLayoutManager
                open={tableLayoutVisible}
                onClose={() => setTableLayoutVisible(false)}
                onSaveLayout={(name) => {
                    message.success(t('tableLayout.saveSuccess', { name }));
                }}
                onLoadLayout={(layout) => {
                    setColumnConfigs(layout.columns);

                    // 处理筛选条件，兼容旧版本格式
                    if (layout.filters && layout.filters.length > 0) {
                        if ('conditions' in layout.filters[0]) {
                            // 新格式：FilterGroup[]
                            setAdvancedFilters(layout.filters as FilterGroup[]);
                        } else {
                            // 旧格式：FilterCondition[]，转换为一个组
                            const group: FilterGroup = {
                                id: `group-${Date.now()}`,
                                conditions: layout.filters as any
                            };
                            setAdvancedFilters([group]);
                        }
                    } else {
                        setAdvancedFilters([]);
                    }

                    // 保存当前加载的布局ID
                    setCurrentLayoutId(layout.id);

                    saveTableSetting('salaryTable_columnConfigs', layout.columns);
                    message.success(t('tableLayout.loadSuccess', { name: layout.name }));
                }}
                onUpdateLayout={(layout) => {
                    // 更新布局后，保存列配置
                    saveTableSetting('salaryTable_columnConfigs', layout.columns);
                    message.success(t('tableLayout.updateSuccess', { name: layout.name }));
                }}
                tableId="salaryTable"
                currentColumns={columnConfigs}
                currentFilters={advancedFilters}
                currentLayoutId={currentLayoutId}
            />

            {/* 导出表格模态框 */}
            <ExportTableModal
                open={exportModalVisible}
                onClose={() => setExportModalVisible(false)}
                columns={columnConfigs}
                data={advancedFilters.length > 0 ? filteredData : data}
                fileName="salary-data-export"
            />
        </Space>
    );
};

export default SalaryDataViewer;