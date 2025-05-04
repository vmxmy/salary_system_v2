import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Checkbox, Spin, Alert, message, Popconfirm, Typography, Tag, Tabs } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import apiClient from '../services/api';
import { useTranslation } from 'react-i18next';
import type { RowSelectionType } from 'antd/es/table/interface';

const { TextArea } = Input;
const { Title } = Typography;

// Interface matching the backend Pydantic model FieldMappingInDB
interface FieldMapping {
    id: number;
    source_name: string;
    target_name: string;
    is_intermediate?: boolean | null;
    is_final?: boolean | null;
    description?: string | null;
    data_type?: string | null;
}

// --- Interfaces for API Payloads --- START
// For creating a new mapping (matches backend FieldMappingCreate)
interface FieldMappingCreate {
    source_name: string;
    target_name: string;
    is_intermediate?: boolean | null;
    is_final?: boolean | null;
    description?: string | null;
    data_type?: string | null;
}

// For updating a mapping (matches backend FieldMappingUpdate - all optional except key)
// We only need the fields that CAN be updated.
interface FieldMappingUpdate {
    target_name?: string;
    is_intermediate?: boolean | null;
    is_final?: boolean | null;
    description?: string | null;
    data_type?: string | null;
}
// --- Interfaces for API Payloads --- END

// Type for the form values, matching FieldMapping but booleans might be undefined initially
type FormValues = Omit<FieldMapping, 'is_intermediate' | 'is_final'> & {
    is_intermediate?: boolean;
    is_final?: boolean;
};

// --- 新增：员工类型字段规则相关类型 ---
interface EmployeeTypeFieldRule {
    rule_id: number;
    employee_type_key: string;
    field_db_name: string;
    is_required: boolean;
}
interface EmployeeTypeFieldRuleCreate {
    employee_type_key: string;
    field_db_name: string;
    is_required: boolean;
}
interface EmployeeTypeFieldRuleUpdate {
    employee_type_key?: string;
    field_db_name?: string;
    is_required?: boolean;
}
interface EmployeeTypeOption {
    employee_type_key: string;
    name: string;
}
interface FieldMappingOption {
    target_name: string;
    source_name: string;
}

const EmployeeTypeFieldRulesPage: React.FC = () => {
    const { t } = useTranslation();
    const [rules, setRules] = useState<EmployeeTypeFieldRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<EmployeeTypeFieldRule | null>(null);
    const [form] = Form.useForm<EmployeeTypeFieldRuleCreate>();
    const [isSaving, setIsSaving] = useState(false);
    const [employeeTypes, setEmployeeTypes] = useState<EmployeeTypeOption[]>([]);
    const [fieldMappings, setFieldMappings] = useState<FieldMappingOption[]>([]);
    const [filterType, setFilterType] = useState<string | undefined>(undefined);
    const [selectedRuleKeys, setSelectedRuleKeys] = useState<React.Key[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);

    // 加载规则
    const fetchRules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get<{ data: EmployeeTypeFieldRule[] }>(
                '/api/config/employee-type-field-rules'
            );
            setRules(res.data.data ? res.data.data.map(r => ({ ...r, employee_type_key: String(r.employee_type_key) })) : []);
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    }, []);

    // 加载员工类型
    const fetchEmployeeTypes = useCallback(async () => {
        try {
            const res = await apiClient.get<EmployeeTypeOption[]>(
                '/api/establishment-types-list'
            );
            setEmployeeTypes(res.data || []);
        } catch (err) {
            // 忽略错误
        }
    }, []);

    // 加载字段名
    const fetchFieldMappings = useCallback(async () => {
        try {
            const res = await apiClient.get<{ data: FieldMappingOption[] }>('/api/config/mappings');
            setFieldMappings(res.data.data || []);
        } catch (err) {
            // 忽略错误
        }
    }, []);

    useEffect(() => {
        fetchRules();
        fetchEmployeeTypes();
        fetchFieldMappings();
    }, [fetchRules, fetchEmployeeTypes, fetchFieldMappings]);

    // 新增/编辑弹窗
    const showModal = (rule: EmployeeTypeFieldRule | null = null) => {
        setEditingRule(rule);
        if (rule) {
            form.setFieldsValue({
                employee_type_key: rule.employee_type_key,
                field_db_name: rule.field_db_name,
                is_required: rule.is_required,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ is_required: false });
        }
        setIsModalVisible(true);
    };
    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingRule(null);
        form.resetFields();
    };
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setIsSaving(true);
            setError(null);
            if (editingRule) {
                // 编辑
                await apiClient.put(`/api/config/employee-type-field-rules/${editingRule.rule_id}`, values);
                message.success('更新成功');
            } else {
                // 新增
                await apiClient.post('/api/config/employee-type-field-rules', values);
                message.success('新增成功');
            }
            handleCancel();
            fetchRules();
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || '保存失败');
        } finally {
            setIsSaving(false);
        }
    };
    // 删除
    const handleDelete = async (rule_id: number) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/api/config/employee-type-field-rules/${rule_id}`);
            message.success('删除成功');
            fetchRules();
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || '删除失败');
        } finally {
            setLoading(false);
        }
    };
    // 新增：批量删除规则处理函数
    const handleBatchDeleteRules = async () => {
        if (selectedRuleKeys.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            const deletePromises = selectedRuleKeys.map(key =>
                apiClient.delete(`/api/config/employee-type-field-rules/${key}`)
            );
            await Promise.all(deletePromises);
            message.success(`成功删除 ${selectedRuleKeys.length} 条规则`);
            setSelectedRuleKeys([]); // 清空选中
            fetchRules(); // 刷新列表
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || '批量删除失败');
            message.error('批量删除失败');
        } finally {
            setLoading(false);
        }
    };
    // 表格列
    const columns: TableColumnsType<EmployeeTypeFieldRule> = [
        {
            title: '员工类型',
            dataIndex: 'employee_type_key',
            key: 'employee_type_key',
            render: (key: string | number) => {
                if (!employeeTypes || employeeTypes.length === 0) return key;
                const found = employeeTypes.find(et => String(et.employee_type_key) === String(key));
                return found ? found.name : key;
            },
            filters: employeeTypes.map((et) => ({ text: et.name, value: String(et.employee_type_key) })),
            onFilter: (value, record) => String(record.employee_type_key) === String(value),
        },
        {
            title: '字段名',
            dataIndex: 'field_db_name',
            key: 'field_db_name',
            render: (db: string) => {
                const mapping = fieldMappings.find(fm => fm.target_name === db);
                if (mapping) {
                    return mapping.source_name;
                } else {
                    return <span style={{ color: 'red', fontWeight: 600 }} title={`未映射到中文名，原字段：${db}`}>未映射</span>;
                }
            },
        },
        {
            title: '是否必填',
            dataIndex: 'is_required',
            key: 'is_required',
            align: 'center',
            render: (v: boolean) => v ? <Tag color="green">是</Tag> : <Tag color="gray">否</Tag>,
            filters: [
                { text: '是', value: true },
                { text: '否', value: false },
            ],
            onFilter: (value, record) => record.is_required === value,
        },
        {
            title: '操作',
            key: 'action',
            align: 'center',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)} size="small">编辑</Button>
                    <Popconfirm title="确定要删除该规则吗？" onConfirm={() => handleDelete(record.rule_id)} okText="删除" cancelText="取消">
                        <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];
    // 过滤
    const filteredRules = filterType ? rules.filter(r => String(r.employee_type_key) === String(filterType)) : rules;

    // 新增：规则表格 rowSelection 配置
    const ruleRowSelection = {
        selectedRowKeys: selectedRuleKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRuleKeys(selectedKeys);
            console.log('Selected Rule Keys:', selectedKeys);
        },
    };

    // 新增：表格分页、筛选、排序变化处理
    const handleTableChange = (pagination: TablePaginationConfig) => {
        setCurrentPage(pagination.current || 1);
        setPageSize(pagination.pageSize || 20);
    };

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                        <span>筛选员工类型：</span>
                        <Space.Compact>
                            <select
                                style={{ width: 200 }}
                                value={filterType || ''}
                                onChange={e => setFilterType(e.target.value || undefined)}
                            >
                                <option value="">全部</option>
                                {employeeTypes.map((et, idx) => (
                                    <option key={`${et.employee_type_key}-${idx}`} value={et.employee_type_key}>
                                        {et.name}
                                    </option>
                                ))}
                            </select>
                        </Space.Compact>
                    </Space>
                    <Space>
                        <Popconfirm
                            title={`确定要删除选中的 ${selectedRuleKeys.length} 条规则吗？`}
                            onConfirm={handleBatchDeleteRules}
                            okText="确认删除"
                            cancelText="取消"
                            disabled={selectedRuleKeys.length === 0}
                        >
                            <Button
                                type="primary"
                                danger
                                disabled={selectedRuleKeys.length === 0}
                                icon={<DeleteOutlined />}
                            >
                                批量删除 ({selectedRuleKeys.length})
                            </Button>
                        </Popconfirm>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(null)}>
                            新增规则
                        </Button>
                    </Space>
                </Space>
                {error && <Alert message="错误" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredRules}
                        rowKey="rule_id"
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: filteredRules.length,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} 条`,
                        }}
                        bordered
                        size="small"
                        rowSelection={ruleRowSelection}
                        onChange={handleTableChange}
                    />
                </Spin>
            </Space>
            <Modal
                title={editingRule ? '编辑规则' : '新增规则'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={isSaving}
                destroyOnClose
                forceRender
            >
                <Spin spinning={isSaving}>
                    <Form form={form} layout="vertical" name={editingRule ? 'edit_rule_form' : 'add_rule_form'}>
                        <Form.Item
                            name="employee_type_key"
                            label="员工类型"
                            rules={[{ required: true, message: '请选择员工类型' }]}
                        >
                            <Input list="employee-type-list" placeholder="输入或选择员工类型ID" />
                        </Form.Item>
                        <datalist id="employee-type-list">
                            {employeeTypes.map((et, idx) => (
                                <option key={`${et.employee_type_key}-${idx}`} value={et.employee_type_key}>{et.name}</option>
                            ))}
                        </datalist>
                        <Form.Item
                            name="field_db_name"
                            label="字段名"
                            rules={[{ required: true, message: '请选择字段名' }]}
                        >
                            <Input list="field-mapping-list" placeholder="输入或选择字段名" />
                        </Form.Item>
                        <datalist id="field-mapping-list">
                            {fieldMappings.map((fm, idx) => (
                                <option key={`${fm.target_name}-${idx}`} value={fm.target_name}>{fm.source_name}</option>
                            ))}
                        </datalist>
                        <Form.Item name="is_required" label="是否必填" valuePropName="checked">
                            <Checkbox>必填</Checkbox>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

const MappingConfigurator: React.FC = () => {
    const { t } = useTranslation();
    const [mappings, setMappings] = useState<FieldMapping[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // --- State for Modal and Form --- START
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<FieldMapping | null>(null);
    const [form] = Form.useForm<FormValues>();
    const [isSaving, setIsSaving] = useState<boolean>(false); // Loading state for save button
    const [searchTerm, setSearchTerm] = useState<string>(''); // <-- Add search term state
    const [currentPage, setCurrentPage] = useState<number>(1); // Added for pagination
    const [pageSize, setPageSize] = useState<number>(15);     // Added for pagination
    const [activeTab, setActiveTab] = useState<'mapping' | 'rules'>('mapping');
    const [selectedMappingKeys, setSelectedMappingKeys] = useState<React.Key[]>([]); // 新增：映射表格选中 key state
    // --- State for Modal and Form --- END

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<{ data: FieldMapping[] }>('/api/config/mappings');
            setMappings(response.data.data || []);
            console.log("Fetched mappings:", response.data.data);
        } catch (err: any) {
            console.error("Failed to fetch mappings:", err);
            const errorMsg = err.response?.data?.detail || err.message || t('mappingConfigurator.messages.loadFailed');
            setError(errorMsg);
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Modal Handling --- START
    const showModal = (record: FieldMapping | null = null) => {
        setEditingRecord(record);
        console.log('Form instance in showModal:', form);
        if (record) {
            console.log('Editing record data:', record);
            // Editing: Set form values from record
            // Ensure boolean nulls are treated correctly (initialValue doesn't handle null well)
            form.setFieldsValue({
                ...record,
                is_intermediate: record.is_intermediate ?? false, // Default to false if null/undefined
                is_final: record.is_final ?? true, // Default to true if null/undefined
            });
            console.log('Source Name value after setFieldsValue:', form.getFieldValue('source_name'));
        } else {
            // Adding: Reset form (default booleans to sensible values)
            form.resetFields();
            form.setFieldsValue({
                is_intermediate: false,
                is_final: true,
            });
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingRecord(null);
        form.resetFields();
    };

    const handleOk = async () => {
        try {
            const values: FormValues = await form.validateFields();
            setIsSaving(true);
            setError(null);
            // 新增或编辑时都校验 source_name 唯一性
            const exists = mappings.some(
                m => m.source_name === values.source_name && (!editingRecord || m.source_name !== editingRecord.source_name)
            );
            if (exists) {
                setError('来源名称已存在，请输入唯一的名称。');
                setIsSaving(false);
                return;
            }
            if (editingRecord) {
                // 编辑
                const payload: FieldMappingUpdate = {
                    target_name: values.target_name,
                    is_intermediate: values.is_intermediate ?? false,
                    is_final: values.is_final ?? true,
                    description: values.description || null,
                    data_type: values.data_type || null,
                };
                await apiClient.put(`/api/config/mappings/${editingRecord.id}`, payload);
                message.success(t('mappingConfigurator.messages.updateSuccess'));
            } else {
                // 新增
                const payload: FieldMappingCreate = {
                    source_name: values.source_name,
                    target_name: values.target_name,
                    is_intermediate: values.is_intermediate ?? false,
                    is_final: values.is_final ?? true,
                    description: values.description || null,
                    data_type: values.data_type || null,
                };
                await apiClient.post('/api/config/mappings', payload);
                message.success(t('mappingConfigurator.messages.createSuccess'));
            }
            handleCancel();
            fetchData();
        } catch (err: any) {
            const errorMsg = err?.response?.data?.detail || err?.message || t('mappingConfigurator.messages.saveFailed');
            setError(errorMsg);
            message.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };
    // --- Modal Handling --- END

    // Define Table Columns
    const columns: TableColumnsType<FieldMapping> = [
        {
            title: t('mappingConfigurator.table.colSourceName'),
            dataIndex: 'source_name',
            key: 'source_name',
            sorter: (a, b) => a.source_name.localeCompare(b.source_name),
            filteredValue: null,
        },
        {
            title: t('mappingConfigurator.table.colTargetName'),
            dataIndex: 'target_name',
            key: 'target_name',
            sorter: (a, b) => a.target_name.localeCompare(b.target_name),
            filteredValue: null,
        },
        {
            title: t('mappingConfigurator.table.colIsIntermediate'),
            dataIndex: 'is_intermediate',
            key: 'is_intermediate',
            width: 120,
            align: 'center',
            render: (value: boolean | null | undefined) => {
                if (value === null || value === undefined) return '-';
                return <Tag color={value ? 'green' : 'gray'}>{value ? t('mappingConfigurator.table.renderYes') : t('mappingConfigurator.table.renderNo')}</Tag>;
            },
            filters: [
                { text: t('mappingConfigurator.table.filterYes'), value: true },
                { text: t('mappingConfigurator.table.filterNo'), value: false },
            ],
            onFilter: (value, record) => record.is_intermediate === value,
            filteredValue: null,
        },
        {
            title: t('mappingConfigurator.table.colIsFinal'),
            dataIndex: 'is_final',
            key: 'is_final',
            width: 120,
            align: 'center',
            render: (value: boolean | null | undefined) => {
                if (value === null || value === undefined) return '-';
                return <Tag color={value ? 'green' : 'gray'}>{value ? t('mappingConfigurator.table.renderYes') : t('mappingConfigurator.table.renderNo')}</Tag>;
            },
            filters: [
                { text: t('mappingConfigurator.table.filterYes'), value: true },
                { text: t('mappingConfigurator.table.filterNo'), value: false },
            ],
            onFilter: (value, record) => record.is_final === value,
            filteredValue: null,
        },
        {
            title: t('mappingConfigurator.table.colDescription'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            filteredValue: null,
        },
        {
            title: t('mappingConfigurator.table.colDataType'),
            dataIndex: 'data_type',
            key: 'data_type',
            width: 100,
            filteredValue: null,
        },
        {
            title: t('mappingConfigurator.table.colAction'),
            key: 'action',
            width: 150,
            align: 'center',
            fixed: 'right',
            filteredValue: null,
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(record)}
                        size="small"
                    >
                        {t('mappingConfigurator.table.actionEdit')}
                    </Button>
                    <Popconfirm 
                        title={t('mappingConfigurator.deleteConfirm.title')} 
                        onConfirm={() => handleDelete(record.id)} 
                        okText={t('mappingConfigurator.deleteConfirm.okText')} 
                        cancelText={t('mappingConfigurator.deleteConfirm.cancelText')}
                    >
                        <Button 
                            type="link" 
                            danger 
                            icon={<DeleteOutlined />}
                            size="small"
                        >
                            {t('mappingConfigurator.table.actionDelete')}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleDelete = async (id: number) => {
        console.log('Delete button clicked for:', id);
        setLoading(true); // Use main loading indicator for delete
        setError(null);
        try {
            await apiClient.delete(`/api/config/mappings/${id}`);
            message.success(t('mappingConfigurator.messages.deleteSuccess'));
            fetchData(); // Refresh data
        } catch (err: any) {
            console.error("Failed to delete mapping:", err);
            const errorMsg = err.response?.data?.detail || err.message || t('mappingConfigurator.messages.deleteFailed');
            setError(errorMsg);
            message.error(errorMsg);
            setLoading(false); // Ensure loading is stopped on error
        } 
        // No finally block needed here as fetchData will set loading to false on success
    };

    // --- Filter Logic --- START
    const filteredMappings = mappings.filter(mapping => {
        const term = searchTerm.toLowerCase();
        if (!term) return true; // Show all if search term is empty
        return (
            mapping.source_name.toLowerCase().includes(term) ||
            mapping.target_name.toLowerCase().includes(term) ||
            (mapping.description && mapping.description.toLowerCase().includes(term))
        );
    });
    // --- Filter Logic --- END

    // Added handler for Table changes (pagination, filters, sorter)
    const handleTableChange = (page: number, pageSize: number) => {
        setCurrentPage(page);
        setPageSize(pageSize);
    };

    // 新增：批量删除映射处理函数
    const handleBatchDeleteMapping = async () => {
        if (selectedMappingKeys.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            const deletePromises = selectedMappingKeys.map(key =>
                apiClient.delete(`/api/config/mappings/${key}`)
            );
            await Promise.all(deletePromises);
            message.success(`成功删除 ${selectedMappingKeys.length} 条映射`);
            setSelectedMappingKeys([]); // 清空选中
            fetchData(); // 刷新列表
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || '批量删除失败');
            message.error('批量删除失败');
        } finally {
            setLoading(false);
        }
    };

    // 新增：映射表格 rowSelection 配置
    const mappingRowSelection = {
        selectedRowKeys: selectedMappingKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedMappingKeys(selectedKeys);
            console.log('Selected Mapping Keys:', selectedKeys);
        },
    };

    return (
        <div>
            <Tabs
                activeKey={activeTab}
                onChange={key => setActiveTab(key as 'mapping' | 'rules')}
                items={[
                    {
                        key: 'mapping',
                        label: t('tabs.fieldMapping'),
                        children: (
                            <div>
                                <style>
                                    {`
                                        .zebra-striped-table .ant-table-tbody > tr:nth-child(even) > td {
                                            background-color: #fafafa; 
                                        }
                                    `}
                                </style>
                                <Space direction="vertical" style={{ width: '100%' }} size="large">
                                    <Title level={2}>{t('breadcrumb.fieldMappings')}</Title>
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Input.Search
                                            aria-label={t('mappingConfigurator.searchPlaceholder')}
                                            placeholder={t('mappingConfigurator.searchPlaceholder')}
                                            allowClear
                                            enterButton={<SearchOutlined />}
                                            style={{ width: 300 }}
                                            onSearch={(value) => setSearchTerm(value)}
                                            onChange={(e) => !e.target.value && setSearchTerm('')}
                                        />
                                        <Space>
                                            <Popconfirm
                                                title={`确定要删除选中的 ${selectedMappingKeys.length} 条映射吗？`}
                                                onConfirm={handleBatchDeleteMapping}
                                                okText="确认删除"
                                                cancelText="取消"
                                                disabled={selectedMappingKeys.length === 0}
                                            >
                                                <Button
                                                    type="primary"
                                                    danger
                                                    disabled={selectedMappingKeys.length === 0}
                                                    icon={<DeleteOutlined />}
                                                >
                                                    批量删除 ({selectedMappingKeys.length})
                                                </Button>
                                            </Popconfirm>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={() => showModal(null)}
                                            >
                                                {t('mappingConfigurator.addButton')}
                                            </Button>
                                        </Space>
                                    </Space>
                                    {error && <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }}/>}
                                    <Spin spinning={loading}>
                                        <Table
                                            columns={columns}
                                            dataSource={filteredMappings}
                                            rowKey="id"
                                            pagination={{
                                                current: currentPage,
                                                pageSize: pageSize,
                                                onChange: handleTableChange,
                                                pageSizeOptions: ['15', '30', '50', '100'],
                                                showSizeChanger: true,
                                                showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} 条`,
                                            }}
                                            scroll={{ x: 'max-content' }}
                                            bordered
                                            size="small"
                                            className="zebra-striped-table"
                                            sticky
                                            rowSelection={mappingRowSelection}
                                        />
                                    </Spin>
                                </Space>
                                <Modal
                                    title={
                                        <Title level={4}>
                                            {editingRecord 
                                                ? t('mappingConfigurator.modal.editTitle', { sourceName: editingRecord.source_name }) 
                                                : t('mappingConfigurator.modal.addTitle')
                                            }
                                        </Title>
                                    }
                                    open={isModalVisible}
                                    onOk={handleOk}
                                    onCancel={handleCancel}
                                    confirmLoading={isSaving}
                                    okText={t('mappingConfigurator.modal.okText')}
                                    cancelText={t('mappingConfigurator.modal.cancelText')}
                                    destroyOnClose
                                    forceRender
                                >
                                    <Spin spinning={isSaving}>
                                        <Form 
                                            form={form} 
                                            layout="vertical" 
                                            name={editingRecord ? "edit_mapping_form" : "add_mapping_form"}
                                        >
                                            <Form.Item
                                                name="source_name"
                                                label={t('mappingConfigurator.modal.fieldSourceName')}
                                                rules={[{ required: true, message: t('mappingConfigurator.modal.validation.sourceRequired') }]}
                                            >
                                                <Input id="mapping_source_name" />
                                            </Form.Item>
                                            <Form.Item
                                                name="target_name"
                                                label={t('mappingConfigurator.modal.fieldTargetName')}
                                                rules={[{ required: true, message: t('mappingConfigurator.modal.validation.targetRequired') }]}
                                            >
                                                <Input id="mapping_target_name" />
                                            </Form.Item>
                                            <Space style={{ marginBottom: '16px' }}>
                                                <Form.Item name="is_intermediate" valuePropName="checked" noStyle>
                                                    <Checkbox id="mapping_is_intermediate">
                                                        {t('mappingConfigurator.modal.fieldIsIntermediate')}
                                                    </Checkbox>
                                                </Form.Item>
                                                <Form.Item name="is_final" valuePropName="checked" noStyle>
                                                    <Checkbox id="mapping_is_final">
                                                        {t('mappingConfigurator.modal.fieldIsFinal')}
                                                    </Checkbox>
                                                </Form.Item>
                                            </Space>
                                            <Form.Item
                                                name="description"
                                                label={t('mappingConfigurator.modal.fieldDescription')}
                                            >
                                                <TextArea id="mapping_description" rows={2} />
                                            </Form.Item>
                                            <Form.Item
                                                name="data_type"
                                                label={t('mappingConfigurator.modal.fieldDataType')}
                                            >
                                                <Input id="mapping_data_type" />
                                            </Form.Item>
                                        </Form>
                                    </Spin>
                                </Modal>
                            </div>
                        )
                    },
                    {
                        key: 'rules',
                        label: t('tabs.rules'),
                        children: <EmployeeTypeFieldRulesPage />
                    }
                ]}
            />
        </div>
    );
};

export default MappingConfigurator; 