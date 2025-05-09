import React, { useState, useEffect, useCallback } from 'react';
import { Table, Form, Input, Button, Spin, Alert, Space, DatePicker, Tag, App, Typography } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import apiClient, {
    fetchSalaryFieldDefinitions,
    SalaryFieldDefinition
} from '../services/api';
import type { TablePaginationConfig, TableColumnsType } from 'antd';
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
        showTotal: (total, range) => {
            // 使用模板字符串直接构建消息，避免翻译占位符问题
            return t('common.pagination.showTotal')
                .replace('{rangeStart}', range[0].toString())
                .replace('{rangeEnd}', range[1].toString())
                .replace('{total}', total.toString());
        },
    });
    // 移除了未使用的状态变量
    const [fieldDefinitions, setFieldDefinitions] = useState<SalaryFieldDefinition[]>([]);

    // 新增状态
    const [columnSettingsVisible, setColumnSettingsVisible] = useState<boolean>(false);
    const [advancedFilterVisible, setAdvancedFilterVisible] = useState<boolean>(false);
    const [tableLayoutVisible, setTableLayoutVisible] = useState<boolean>(false);
    const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
    const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
    const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
    const [filteredData, setFilteredData] = useState<SalaryRecord[]>([]);
    const [currentLayoutId, setCurrentLayoutId] = useState<string | undefined>(undefined);
    const [currentLayoutName, setCurrentLayoutName] = useState<string>(t('tableLayout.defaultLayoutName'));

    // 动态生成表格列
    const generateColumns = (): TableColumnsType<SalaryRecord> => {
        console.log('Generating columns with fieldDefinitions:', fieldDefinitions.length);

        if (fieldDefinitions.length === 0) {
            console.log('No field definitions available, returning basic columns');
            // 如果还没有获取到字段定义，返回一个基本的列定义
            return [
                { title: t('dataViewer.table.colId'), dataIndex: '_consolidated_data_id', key: '_consolidated_data_id', fixed: 'left', width: 80 },
                { title: t('dataViewer.table.colName'), dataIndex: 'employee_name', key: 'employee_name', fixed: 'left', width: 120 },
                { title: t('dataViewer.table.colNetPay'), dataIndex: 'calc_net_pay', key: 'calc_net_pay', width: 120, fixed: 'right', align: 'right' }
            ];
        }

        console.log('Data records available for filtering columns:', data.length);

        // 过滤掉一些不常用的列，减少列数量
        let columnsToShow = fieldDefinitions;

        // 如果列数量超过 100，尝试过滤掉一些不常用的列
        if (fieldDefinitions.length > 100 && data.length > 0) {
            // 创建一个集合，记录所有在数据中实际有值的字段
            const fieldsWithValues = new Set<string>();

            // 遍历数据，最多检查 100 条记录
            const recordsToCheck = Math.min(data.length, 100);
            for (let i = 0; i < recordsToCheck; i++) {
                const record = data[i];
                // 使用类型断言解决 TypeScript 索引签名问题
                const recordAny = record as Record<string, any>;
                for (const key in recordAny) {
                    if (recordAny[key] !== null && recordAny[key] !== undefined && recordAny[key] !== '') {
                        fieldsWithValues.add(key);
                    }
                }
            }

            // 过滤出有值的列和一些重要的列
            columnsToShow = fieldDefinitions.filter(field => {
                const dataIndex = field.dataIndex || field.key;

                // 始终保留这些重要列
                const importantFields = [
                    '_consolidated_data_id', 'employee_name', 'id_card_number',
                    'pay_period_identifier', 'sal_department_name', 'sal_organization_name',
                    'sal_establishment_type_name', 'sal_employee_type_key',
                    'calc_xiaoji', 'calc_personal_deductions', 'calc_total_payable', 'calc_net_pay'
                ];

                return importantFields.includes(dataIndex) || fieldsWithValues.has(dataIndex);
            });

            console.log(`Filtered columns: showing ${columnsToShow.length} of ${fieldDefinitions.length} columns with data`);
        } else {
            console.log(`Showing all ${fieldDefinitions.length} columns, including those with no data`);
        }

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

    // 生成表格列 - 确保至少显示一些列
    const columns = (() => {
        // 如果有列配置，使用它
        if (columnConfigs.length > 0) {
            console.log(`Using column configs: ${columnConfigs.length} columns`);
            return convertConfigToColumns(columnConfigs);
        }

        // 否则生成列
        const generatedColumns = generateColumns();
        console.log(`Generated columns: ${generatedColumns.length} columns`);

        // 如果生成的列太少，可能是数据还没加载完成，使用所有字段定义
        if (generatedColumns.length < 3 && fieldDefinitions.length > 0) {
            console.log(`Generated too few columns, using all ${fieldDefinitions.length} field definitions`);
            return fieldDefinitions.map(field => ({
                title: t(`dataViewer.table.${field.key}`, field.title),
                dataIndex: field.dataIndex,
                key: field.key,
                width: field.width || 120
            }));
        }

        return generatedColumns;
    })();

    // 加载服务器端默认布局
    const loadServerDefaultLayout = useCallback(async () => {
        try {
            // 导入fetchTableLayouts和createTableLayout函数
            const { fetchTableLayouts, createTableLayout } = await import('../services/tableConfigsApi');

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
                        console.log('Successfully parsed config_data from string');
                    } catch (error) {
                        console.error('Failed to parse config_data string:', error);
                        configData = {};
                    }
                } else {
                    configData = defaultLayout.config_data || {};
                }

                console.log('Config data type:', typeof configData);
                console.log('Config data:', configData);

                let columns = Array.isArray(configData.columns) ? configData.columns : [];
                const filters = configData.filters || [];

                console.log('Columns from config_data:', columns.length);

                // 检查列配置是否为空或者列数量太少（少于10列）
                if (columns.length < 10) {
                    console.log('Default layout has too few columns, generating default columns and updating server layout');
                    console.log('Default layout details:', JSON.stringify(defaultLayout, null, 2));

                    // 生成默认列 - 使用所有字段定义
                    if (fieldDefinitions.length > 0) {
                        console.log('Field definitions available:', fieldDefinitions.length);
                        // 使用所有字段定义生成列配置，与本地布局配置使用相同的方式
                        columns = fieldDefinitions.map(field => ({
                            key: field.key,
                            title: field.title,
                            visible: true,
                            fixed: field.fixed,
                            width: field.width || 120,
                            dataIndex: field.dataIndex
                        }));
                        console.log(`Generated ${columns.length} columns from field definitions`);
                    } else {
                        console.warn('字段定义尚未加载，使用基本列配置');
                        // 提供基本的列配置
                        columns = [
                            {
                                key: '_consolidated_data_id',
                                title: 'ID',
                                visible: true,
                                fixed: 'left' as 'left',
                                width: 80,
                                dataIndex: '_consolidated_data_id'
                            },
                            {
                                key: 'employee_name',
                                title: '姓名',
                                visible: true,
                                fixed: 'left' as 'left',
                                width: 120,
                                dataIndex: 'employee_name'
                            },
                            {
                                key: 'calc_net_pay',
                                title: '实发合计',
                                visible: true,
                                fixed: 'right' as 'right',
                                width: 120,
                                dataIndex: 'calc_net_pay'
                            }
                        ] as ColumnConfig[];
                    }

                    console.log('Generated columns count:', columns.length);

                    // 确保生成了至少一些列
                    if (columns.length === 0) {
                        console.warn('无法生成列配置，使用基本列配置');
                        // 提供基本的列配置
                        columns = [
                            {
                                key: '_consolidated_data_id',
                                title: 'ID',
                                visible: true,
                                fixed: 'left' as 'left',
                                width: 80,
                                dataIndex: '_consolidated_data_id'
                            },
                            {
                                key: 'employee_name',
                                title: '姓名',
                                visible: true,
                                fixed: 'left' as 'left',
                                width: 120,
                                dataIndex: 'employee_name'
                            },
                            {
                                key: 'calc_net_pay',
                                title: '实发合计',
                                visible: true,
                                fixed: 'right' as 'right',
                                width: 120,
                                dataIndex: 'calc_net_pay'
                            }
                        ] as ColumnConfig[];
                    }

                    // 更新服务器端默认布局
                    try {
                        console.log('Attempting to update server layout with ID:', defaultLayout.id);
                        const result = await updateServerDefaultLayout(defaultLayout.id, columns, filters);
                        console.log('Server default layout update result:', result);
                    } catch (updateError) {
                        console.error('Failed to update server default layout:', updateError);
                        // 即使更新失败，也继续使用生成的列配置
                    }

                    message.warning(t('tableLayout.generatedDefaultColumns'));
                }

                // 设置列配置
                setColumnConfigs(columns);

                // 处理筛选条件，兼容旧版本格式
                if (filters && filters.length > 0) {
                    if ('conditions' in filters[0]) {
                        // 新格式：FilterGroup[]
                        setAdvancedFilters(filters as FilterGroup[]);
                    } else {
                        // 旧格式：FilterCondition[]，转换为一个组
                        const group: FilterGroup = {
                            id: `group-${Date.now()}`,
                            conditions: filters as any
                        };
                        setAdvancedFilters([group]);
                    }
                }

                // 保存当前加载的布局ID和名称
                setCurrentLayoutId(`server-${defaultLayout.id}`);
                setCurrentLayoutName(defaultLayout.name);

                // 保存到本地存储
                saveTableSetting('salaryTable_columnConfigs', columns);

                // 使用模板字符串直接构建消息，避免翻译占位符问题
                const successMsg = t('tableLayout.defaultLayoutLoaded').replace('{name}', defaultLayout.name);
                message.success(successMsg);
                return true;
            } else {
                // 如果没有默认布局，创建一个新的默认布局
                console.log('No default layout found, creating a new one');

                // 生成默认列 - 使用所有字段定义
                let defaultColumns;
                if (fieldDefinitions.length > 0) {
                    // 使用所有字段定义生成列配置，与本地布局配置使用相同的方式
                    defaultColumns = fieldDefinitions.map(field => ({
                        key: field.key,
                        title: field.title,
                        visible: true,
                        fixed: field.fixed,
                        width: field.width || 120,
                        dataIndex: field.dataIndex
                    }));
                    console.log(`Generated ${defaultColumns.length} columns from field definitions`);
                } else {
                    console.warn('字段定义尚未加载，使用基本列配置');
                    // 提供基本的列配置
                    defaultColumns = [
                        {
                            key: '_consolidated_data_id',
                            title: 'ID',
                            visible: true,
                            fixed: 'left',
                            width: 80,
                            dataIndex: '_consolidated_data_id'
                        },
                        {
                            key: 'employee_name',
                            title: '姓名',
                            visible: true,
                            fixed: 'left' as 'left',
                            width: 120,
                            dataIndex: 'employee_name'
                        },
                        {
                            key: 'calc_net_pay',
                            title: '实发合计',
                            visible: true,
                            fixed: 'right' as 'right',
                            width: 120,
                            dataIndex: 'calc_net_pay'
                        }
                    ] as ColumnConfig[];
                }

                console.log('Generated default columns count:', defaultColumns.length);

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

                    if (newLayout) {
                        console.log('Created new default layout:', newLayout);

                        // 将新创建的服务器布局转换为TableLayout格式
                        const serverLayout = {
                            id: `server-${newLayout.id}`,
                            name: newLayout.name,
                            columns: defaultColumns,
                            filters: [],
                            createdAt: newLayout.created_at,
                            isServerStored: true,
                            serverId: newLayout.id,
                            isShared: newLayout.is_shared,
                            isDefault: newLayout.is_default
                        };

                        setColumnConfigs(defaultColumns);
                        setCurrentLayoutId(`server-${newLayout.id}`);
                        setCurrentLayoutName(newLayout.name);
                        saveTableSetting('salaryTable_columnConfigs', defaultColumns);
                        saveTableSetting('salaryTable_currentLayout', serverLayout);
                        message.success(t('tableLayout.defaultLayoutCreated'));
                        return true;
                    }
                } catch (createError) {
                    console.error('Failed to create default layout:', createError);
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to load server default layout:', error);
            return false;
        }
    }, [t, message]);

    // 更新服务器端默认布局
    const updateServerDefaultLayout = async (layoutId: number, columns: ColumnConfig[], filters: any[]) => {
        try {
            console.log(`Updating server layout ${layoutId} with ${columns.length} columns`);
            const { updateTableLayout } = await import('../services/tableConfigsApi');

            const result = await updateTableLayout(layoutId, {
                config_data: {
                    columns: columns,
                    filters: filters
                }
            });

            console.log('Update layout API response:', result);
            return result;
        } catch (error) {
            console.error('Error in updateServerDefaultLayout function:', error);
            throw error;
        }
    };

    // 初始化列配置
    useEffect(() => {
        console.log('初始化列配置 useEffect 触发，fieldDefinitions:', fieldDefinitions.length, 'columnConfigs:', columnConfigs.length);

        if (fieldDefinitions.length > 0 && columnConfigs.length === 0) {
            // 首先尝试加载服务器端默认布局
            loadServerDefaultLayout().then(hasDefaultLayout => {
                console.log('服务器默认布局加载结果:', hasDefaultLayout);

                // 如果没有默认布局，则尝试从localStorage加载
                if (!hasDefaultLayout) {
                    const savedConfigs = loadTableSetting<ColumnConfig[]>('salaryTable_columnConfigs', []);
                    console.log('从localStorage加载的配置:', savedConfigs.length);

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
            });
        }
    }, [fieldDefinitions, loadServerDefaultLayout]);

    // 应用高级筛选
    useEffect(() => {
        if (data.length > 0) {
            if (advancedFilters.length > 0) {
                console.log('useEffect - Applying advanced filters:', JSON.stringify(advancedFilters, null, 2));

                // 在全部数据上应用筛选
                const filtered = applyFilters(data, advancedFilters);
                console.log('useEffect - Filter result:', filtered.length, 'of', data.length, 'records');

                setFilteredData(filtered);

                // 更新分页信息以反映筛选后的记录数
                setPagination(prev => ({
                    ...prev,
                    current: 1, // 重置到第一页
                    total: filtered.length // 使用筛选后的记录数
                }));

                // 如果筛选结果为0，记录警告日志
                if (filtered.length === 0) {
                    console.warn('Advanced filter returned 0 results. Filter conditions:', advancedFilters);
                }
            } else {
                // 没有筛选条件时，显示全部数据
                console.log('useEffect - No advanced filters, showing all data');
                setFilteredData(data);

                // 更新分页信息以反映全部数据
                setPagination(prev => ({
                    ...prev,
                    total: data.length
                }));
            }
        } else {
            console.log('useEffect - No data available yet');
        }
    }, [data, advancedFilters]);

    // 生成导出文件名（布局名称+当前时间戳，精确到秒）
    const generateExportFileName = () => {
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
    };

    // Function to fetch data from API
    const fetchData = useCallback(async () => {
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

            const allRecords = response.data.data || [];
            setData(allRecords);

            // 如果有高级筛选条件，立即应用
            if (advancedFilters.length > 0) {
                const filtered = applyFilters(allRecords, advancedFilters);
                setFilteredData(filtered);

                // 更新分页信息以反映筛选后的数据
                setPagination(prev => ({
                    ...prev,
                    current: 1,
                    total: filtered.length
                }));
            } else {
                setFilteredData(allRecords);

                // 更新分页信息以反映全部数据
                setPagination(prev => ({
                    ...prev,
                    current: 1,
                    total: allRecords.length
                }));
            }
        } catch (err: any) {
            console.error("Failed to fetch salary data:", err);
            setError(err.response?.data?.detail || err.message || t('dataViewer.errors.fetchFailed'));
            setData([]);
            setFilteredData([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    }, [tableFilters, advancedFilters, t]);

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
                console.log("Field definitions raw data:", fields.slice(0, 3)); // 只显示前3个字段，避免日志过长

                // 设置字段定义
                setFieldDefinitions(fields);
                console.log("Field definitions loaded:", {
                    fieldCount: fields.length
                });

            } catch (error) {
                console.error("Failed to load field definitions:", error);
                console.error("Error details:", error);
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

    // 表格分页变化处理函数 - 已由本地分页处理，不再需要此函数
    // 但保留注释以便将来可能需要恢复服务器端分页时参考

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
                onExportClick={(format) => {
                    console.log('Export format selected:', format);
                    setExportFormat(format || 'excel');
                    setExportModalVisible(true);
                }}
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
                    // 使用本地分页
                    pagination={{
                        ...pagination,
                        // 本地分页处理
                        onChange: (page, pageSize) => {
                            console.log('Pagination changed to page', page, 'size', pageSize);
                            setPagination(prev => ({
                                ...prev,
                                current: page,
                                pageSize: pageSize
                            }));
                        },
                        // 确保分页控件显示正确的总记录数
                        total: advancedFilters.length > 0 ? filteredData.length : data.length
                    }}
                    // 移除原来的onChange处理器，因为我们现在使用本地分页
                    // onChange={handleTableChange}
                    loading={loading}
                    scroll={{ x: 'max-content', y: 600 }}
                    bordered
                    size="small"
                    className="zebra-striped-table"
                    sticky
                    // 添加空数据提示
                    locale={{
                        emptyText: advancedFilters.length > 0
                            ? t('dataViewer.table.noFilteredData')
                            : t('dataViewer.table.noData')
                    }}
                    // 添加表格标题行，显示当前布局配置名称
                    title={() => (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 8px',
                            borderBottom: '1px solid #e8e8e8',
                            backgroundColor: '#fafafa'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {currentLayoutName && (
                                    <Typography.Title level={3} style={{
                                        margin: 0,
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#1677ff' // 使用蓝色，与 Ant Design 主题色一致
                                    }}>
                                        {currentLayoutName}
                                    </Typography.Title>
                                )}
                            </div>
                            <div>
                                <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                                    {t('common.pagination.showTotal')
                                        .replace('{rangeStart}', '1')
                                        .replace('{rangeEnd}', Math.min(pagination.pageSize || 10, (advancedFilters.length > 0 ? filteredData.length : data.length)).toString())
                                        .replace('{total}', (advancedFilters.length > 0 ? filteredData.length : data.length).toString())}
                                </Typography.Text>
                            </div>
                        </div>
                    )}
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
                tableId="salaryTable"
                onApplyFilter={(groups) => {
                    console.log('SalaryDataViewer - Received filter groups:', JSON.stringify(groups, null, 2));

                    // 保存筛选条件
                    setAdvancedFilters(groups);

                    // 立即应用筛选并更新分页
                    if (groups.length > 0) {
                        // 确保数据已加载
                        if (data.length === 0) {
                            message.warning(t('advancedFilter.noDataToFilter'));
                            return;
                        }

                        // 应用筛选条件
                        console.log('Applying filters to', data.length, 'records');
                        const filtered = applyFilters(data, groups);
                        console.log('Filter result:', filtered.length, 'records matched');

                        // 如果筛选结果为0，显示警告
                        if (filtered.length === 0) {
                            message.warning(t('advancedFilter.noMatchingRecords'));
                        }

                        setFilteredData(filtered);

                        // 更新分页信息
                        setPagination(prev => ({
                            ...prev,
                            current: 1, // 重置到第一页
                            total: filtered.length // 使用筛选后的记录数
                        }));

                        // 使用模板字符串直接构建消息，避免翻译占位符问题
                        const successMsg = t('advancedFilter.applySuccess').replace('{count}', filtered.length.toString());
                        message.success(successMsg);
                    } else {
                        // 没有筛选条件，恢复显示全部数据
                        setFilteredData(data);
                        setPagination(prev => ({
                            ...prev,
                            total: data.length
                        }));

                        message.success(t('advancedFilter.cleared'));
                    }
                }}
                initialConditions={advancedFilters}
            />

            {/* 表格布局管理器 */}
            <TableLayoutManager
                open={tableLayoutVisible}
                onClose={() => setTableLayoutVisible(false)}
                onSaveLayout={(name) => {
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

                    // 使用模板字符串直接构建消息，避免翻译占位符问题
                    const successMsg = t('tableLayout.saveSuccess').replace('{name}', name);
                    message.success(successMsg);
                }}
                onLoadLayout={(layout) => {
                    console.log('SalaryDataViewer - Loading layout:', layout);

                    // 检查布局是否有有效的列配置
                    if (!layout.columns || layout.columns.length === 0) {
                        console.warn('Layout has empty columns, generating default columns');

                        // 生成默认列配置
                        const defaultColumns = convertColumnsToConfig(generateColumns());
                        setColumnConfigs(defaultColumns);

                        // 更新布局中的列配置
                        layout.columns = defaultColumns;

                        message.warning(t('tableLayout.generatedDefaultColumns'));
                    } else {
                        setColumnConfigs(layout.columns);
                    }

                    // 处理筛选条件，兼容旧版本格式
                    if (layout.filters && layout.filters.length > 0) {
                        console.log('Processing filters from layout:', layout.filters);

                        if (layout.filters.length > 0 && 'conditions' in layout.filters[0]) {
                            // 新格式：FilterGroup[]
                            console.log('Using new format (FilterGroup[])');
                            setAdvancedFilters(layout.filters as FilterGroup[]);
                        } else {
                            // 旧格式：FilterCondition[]，转换为一个组
                            console.log('Using old format (FilterCondition[]), converting to group');
                            const group: FilterGroup = {
                                id: `group-${Date.now()}`,
                                conditions: layout.filters as any
                            };
                            setAdvancedFilters([group]);
                        }
                    } else {
                        console.log('No filters in layout, clearing filters');
                        setAdvancedFilters([]);
                    }

                    // 保存当前加载的布局ID和名称
                    setCurrentLayoutId(layout.id);
                    setCurrentLayoutName(layout.name);

                    // 保存到本地存储
                    saveTableSetting('salaryTable_columnConfigs', layout.columns);

                    // 使用模板字符串直接构建消息，避免翻译占位符问题
                    const successMsg = t('tableLayout.loadSuccess').replace('{name}', layout.name);
                    message.success(successMsg);
                }}
                onUpdateLayout={(layout) => {
                    console.log('Updated layout:', layout);
                    // 更新布局后，保存列配置和布局名称
                    saveTableSetting('salaryTable_columnConfigs', layout.columns);
                    setCurrentLayoutName(layout.name);
                    // 使用模板字符串直接构建消息，避免翻译占位符问题
                    const successMsg = t('tableLayout.updateSuccess').replace('{name}', layout.name);
                    message.success(successMsg);
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
                fileName={generateExportFileName()}
                defaultFormat={exportFormat}
            />
        </Space>
    );
};

export default SalaryDataViewer;