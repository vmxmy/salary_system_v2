import React, { useState, useEffect, useCallback } from 'react';
import { Table, Form, Input, Select, Button, Spin, Alert, Space, DatePicker, Tag } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import apiClient, { fetchEstablishmentTypes, fetchDepartments, fetchUnits } from '../services/api'; // Corrected import if api.ts uses export default
import type { TableProps, TablePaginationConfig, TableColumnsType } from 'antd'; // Import TableProps and ColumnsType
import type { Dayjs } from 'dayjs'; // Import Dayjs type if using DatePicker
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Define the interface for the salary record (should match backend Pydantic model)
// Add all relevant fields based on your backend 'SalaryRecord' model
interface SalaryRecord {
    employee_id: number;
    pay_period_identifier: string;
    employee_name?: string | null;
    id_card_number?: string | null;
    department_name?: string | null;
    unit_name?: string | null;
    establishment_type_name?: string | null;
    // Add other salary components, deductions, contributions etc.
    // Example:
    salary_post_salary?: number | null;
    deduct_self_pension_contribution?: number | null;
    calc_net_pay?: number | null;
    // ... add all other fields you want to display or filter
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
    department_name?: string;
    unit_name?: string;
    establishment_type_name?: string; // Select might return empty string or a specific value for "All"
}

// Define interface for ACTUAL filter parameters sent to API (excluding pagination)
interface FilterParams {
    pay_period?: string; // Expecting YYYY-MM string
    employee_name?: string;
    department_name?: string;
    unit_name?: string;
    establishment_type_name?: string;
}

const SalaryDataViewer: React.FC = () => {
    const [data, setData] = useState<SalaryRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation(); // Use the hook
    const [form] = Form.useForm<RawFilterValues>();
    const [tableFilters, setTableFilters] = useState<FilterParams>({}); 
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total, range) => t('common.pagination.showTotal', { rangeStart: range[0], rangeEnd: range[1], total }),
    });
    const [establishmentTypes, setEstablishmentTypes] = useState<string[]>([]);
    const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
    const [units, setUnits] = useState<string[]>([]);
    const [loadingUnits, setLoadingUnits] = useState<boolean>(false);

    // Define table columns with explicit type and use t()
    const columns: TableColumnsType<SalaryRecord> = [
        { title: t('dataViewer.table.colId'), dataIndex: 'employee_id', key: 'employee_id', fixed: 'left', width: 80, sorter: (a, b) => a.employee_id - b.employee_id },
        { title: t('dataViewer.table.colName'), dataIndex: 'employee_name', key: 'employee_name', fixed: 'left', width: 120, sorter: true },
        { title: t('dataViewer.table.colPayPeriod'), dataIndex: 'pay_period_identifier', key: 'pay_period_identifier', width: 120, sorter: true },
        { title: t('dataViewer.table.colIdCard'), dataIndex: 'id_card_number', key: 'id_card_number', width: 180 },
        { title: t('dataViewer.table.colDepartment'), dataIndex: 'department_name', key: 'department_name', width: 150, sorter: true },
        { title: t('dataViewer.table.colUnit'), dataIndex: 'unit_name', key: 'unit_name', width: 150, sorter: true },
        {
            title: t('dataViewer.table.colEstablishment'),
            dataIndex: 'establishment_type_name',
            key: 'establishment_type_name',
            width: 180,
            sorter: true,
            render: (value: string | null | undefined) => {
                if (!value) return '-';
                
                let color = 'default';
                
                switch (value) {
                    case '公务员':
                        color = 'blue';
                        break;
                    case '参公':
                        color = 'green';
                        break;
                    case '事业':
                        color = 'purple';
                        break;
                    case '专技':
                        color = 'cyan';
                        break;
                    case '专项':
                        color = 'gold';
                        break;
                    case '区聘':
                        color = 'orange';
                        break;
                    case '原投服':
                        color = 'magenta';
                        break;
                    default:
                        color = 'default';
                        break;
                }

                return <Tag color={color}>{value}</Tag>;
            }
        },
        { title: t('dataViewer.table.colPostSalary'), dataIndex: 'salary_post_salary', key: 'salary_post_salary', width: 120, align: 'right', render: (val) => val?.toFixed(2) },
        { title: t('dataViewer.table.colPensionSelf'), dataIndex: 'deduct_self_pension_contribution', key: 'deduct_self_pension_contribution', width: 130, align: 'right', render: (val) => val?.toFixed(2) },
        { title: t('dataViewer.table.colNetPay'), dataIndex: 'calc_net_pay', key: 'calc_net_pay', width: 120, fixed: 'right', align: 'right', render: (val) => val?.toFixed(2), sorter: true },
    ];

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

    // Effect to fetch all dropdown data on mount
    useEffect(() => {
        const loadDropdownData = async () => {
            console.log("Fetching all dropdown data...");
            setLoadingTypes(true);
            setLoadingDepartments(true);
            setLoadingUnits(true);
            
            try {
                // Fetch all in parallel
                const [types, depts, unitsData] = await Promise.all([
                    fetchEstablishmentTypes(),
                    fetchDepartments(),
                    fetchUnits()
                ]);
                setEstablishmentTypes(types);
                setDepartments(depts);
                setUnits(unitsData);
                console.log("Dropdown data loaded:", { types, depts, units: unitsData });
            } catch (error) {
                console.error("Failed to load dropdown data:", error);
                setError(t('dataViewer.errors.filterOptionsFailed'));
                setEstablishmentTypes([]);
                setDepartments([]);
                setUnits([]);
            } finally {
                setLoadingTypes(false);
                setLoadingDepartments(false);
                setLoadingUnits(false);
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

    const handleDepartmentChange = (value: string) => {
        updateFilterAndResetPage({ department_name: value === '' ? undefined : value });
    };

    const handleUnitChange = (value: string) => {
        updateFilterAndResetPage({ unit_name: value === '' ? undefined : value });
    };

    const handleEstablishmentChange = (value: string) => {
        updateFilterAndResetPage({ establishment_type_name: value === '' ? undefined : value });
    };

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
                    >
                        <Input 
                            id="employee_name_filter" 
                            placeholder={t('dataViewer.filters.employeeNamePlaceholder')}
                            style={{ width: 160 }} 
                            allowClear 
                            onPressEnter={handleNameSearch}
                        />
                    </Form.Item>
                    <Form.Item 
                        label={t('dataViewer.filters.departmentLabel')} 
                        style={{ margin: 0 }} 
                        htmlFor="department_filter"
                    >
                        <Select
                            id="department_filter" 
                            style={{ width: 160 }}
                            placeholder={t('dataViewer.filters.departmentPlaceholder')}
                            onChange={handleDepartmentChange}
                            loading={loadingDepartments}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) => 
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            <Select.Option value="">{t('common.allOption')}</Select.Option>
                            {departments.map((dept) => (
                                <Select.Option key={dept} value={dept}>{dept}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item 
                        label={t('dataViewer.filters.unitLabel')} 
                        style={{ margin: 0 }} 
                        htmlFor="unit_filter"
                    >
                        <Select
                            id="unit_filter" 
                            style={{ width: 160 }}
                            placeholder={t('dataViewer.filters.unitPlaceholder')}
                            onChange={handleUnitChange}
                            loading={loadingUnits}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) => 
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            <Select.Option value="">{t('common.allOption')}</Select.Option>
                            {units.map((unit) => (
                                <Select.Option key={unit} value={unit}>{unit}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item 
                        label={t('dataViewer.filters.establishmentLabel')} 
                        style={{ margin: 0 }} 
                        htmlFor="establishment_type_filter"
                    >
                        <Select
                            id="establishment_type_filter" 
                            style={{ width: 160 }}
                            placeholder={t('dataViewer.filters.establishmentPlaceholder')}
                            onChange={handleEstablishmentChange}
                            loading={loadingTypes}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) => 
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            <Select.Option value="">{t('common.allOption')}</Select.Option>
                            {establishmentTypes.map((type) => (
                                <Select.Option key={type} value={type}>{type}</Select.Option>
                            ))}
                        </Select>
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
            
            {error && <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }}/>}
            
            <Spin spinning={loading}>
                <Table 
                    columns={columns} 
                    rowKey={(record) => `${record.employee_id}-${record.pay_period_identifier}`}
                    dataSource={data} 
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
        </Space>
    );
};

export default SalaryDataViewer; 