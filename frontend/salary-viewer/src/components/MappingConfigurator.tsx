import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Checkbox, Spin, Alert, message, Popconfirm, Typography, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import apiClient from '../services/api';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;
const { Title } = Typography;

// Interface matching the backend Pydantic model FieldMappingInDB
interface FieldMapping {
    source_name: string;
    target_name: string;
    is_intermediate?: boolean | null;
    is_final?: boolean | null;
    description?: string | null;
    data_type?: string | null;
}

// --- Interfaces for API Payloads --- START
// For creating a new mapping (matches backend FieldMappingCreate)
interface FieldMappingCreate extends FieldMapping {}

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
            console.log('Form instance before validateFields:', form);
            console.log('Source Name value before validation:', form.getFieldValue('source_name'));
            // Validate fields from the form
            const values: FormValues = await form.validateFields();
            setIsSaving(true);
            setError(null);
            
            if (editingRecord) {
                // Update: Prepare payload matching FieldMappingUpdate
                // Only include fields that might have changed
                const payload: FieldMappingUpdate = {
                    target_name: values.target_name,
                    is_intermediate: values.is_intermediate ?? false,
                    is_final: values.is_final ?? true,
                    description: values.description || null, // Ensure null if empty
                    data_type: values.data_type || null,     // Ensure null if empty
                };
                console.log("Updating mapping:", editingRecord.source_name, payload);
                await apiClient.put(`/api/config/mappings/${editingRecord.source_name}`, payload);
                message.success(t('mappingConfigurator.messages.updateSuccess'));
            } else {
                // Create: Prepare payload matching FieldMappingCreate
                // source_name comes from the form for creation
                const payload: FieldMappingCreate = {
                    source_name: values.source_name, // Required for create
                    target_name: values.target_name,
                    is_intermediate: values.is_intermediate ?? false,
                    is_final: values.is_final ?? true,
                    description: values.description || null,
                    data_type: values.data_type || null,
                };
                console.log("Creating mapping:", payload);
                await apiClient.post('/api/config/mappings', payload);
                message.success(t('mappingConfigurator.messages.createSuccess'));
            }
            
            handleCancel(); // Close modal
            fetchData(); // Refresh data

        } catch (err: any) {
            console.error("Failed to save mapping (raw error object):", err); // Log the whole error object
            const errorMsg = err?.response?.data?.detail || err?.message || t('mappingConfigurator.messages.saveFailed');
            console.error("Failed to save mapping (extracted message):", errorMsg); // Log the extracted message
            // Display error inside the modal maybe? Or top level is fine
            setError(errorMsg); 
            message.error(errorMsg);
            // Keep modal open on error
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
                        onConfirm={() => handleDelete(record.source_name)} 
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

    const handleDelete = async (source_name: string) => {
        console.log('Delete button clicked for:', source_name);
        setLoading(true); // Use main loading indicator for delete
        setError(null);
        try {
            await apiClient.delete(`/api/config/mappings/${source_name}`);
            message.success(t('mappingConfigurator.messages.deleteSuccess', { sourceName: source_name }));
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

    return (
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
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => showModal(null)}
                    >
                        {t('mappingConfigurator.addButton')}
                    </Button>
                </Space>

                {error && <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }}/>}

                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredMappings}
                        rowKey="source_name"
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
                            <Input id="mapping_source_name" disabled={!!editingRecord} />
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
                            <TextArea id="mapping_description" rows={3} />
                        </Form.Item>
                        <Form.Item
                            name="data_type"
                            label={t('mappingConfigurator.modal.fieldDataType')}
                        >
                            <Input id="mapping_data_type" />
                        </Form.Item>
                        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }}/>}
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default MappingConfigurator; 