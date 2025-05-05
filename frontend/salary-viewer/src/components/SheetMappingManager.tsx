import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Spin, Alert, message, Popconfirm, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import apiClient from '../services/api';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;
const { Option } = Select;

// Interface for the data displayed in the table
interface SheetMapping {
    sheet_name: string;
    employee_type_key: string;
    target_staging_table: string;
}

// Interface for the data used in the form
interface SheetMappingFormData {
    sheet_name: string;
    employee_type_key: string;
    target_staging_table: string;
}

// Added interface definitions for API payloads
interface SheetMappingCreate {
    sheet_name: string;
    employee_type_key: string;
    target_staging_table: string;
}

interface SheetMappingUpdate {
    employee_type_key?: string; // Optional for update
    target_staging_table?: string; // Optional for update
}

// Interface for employee types fetched for dropdown
interface EmployeeTypeOption {
    employee_type_key: string;
    name: string;
    // Add other fields if needed, like id
    id?: number;
}

const SheetMappingManager: React.FC = () => {
    const { t } = useTranslation();
    const [mappings, setMappings] = useState<SheetMapping[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [editingMapping, setEditingMapping] = useState<SheetMapping | null>(null);
    const [form] = Form.useForm<SheetMappingFormData>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [employeeTypes, setEmployeeTypes] = useState<EmployeeTypeOption[]>([]);
    const [loadingTypes, setLoadingTypes] = useState<boolean>(false);

    // Implement fetchMappings function
    const fetchMappings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<{ data: SheetMapping[] }>('/api/config/sheet-mappings');
            setMappings(response.data.data || []);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || t('sheetMappingManager.errors.loadFailed');
            setError(errorMsg);
            message.error(errorMsg);
            setMappings([]); // Clear data on error
        } finally {
            setLoading(false);
        }
    }, [t]);

    // Implement fetchEmployeeTypes function
    const fetchEmployeeTypes = useCallback(async () => {
        setLoadingTypes(true);
        try {
            // Assuming the API returns the same structure used before, including id which might not be needed here
            const response = await apiClient.get<EmployeeTypeOption[]>('/api/establishment-types-list');
            setEmployeeTypes(response.data || []);
        } catch (err: any) {
            // Avoid showing error message for this helper data load? Optional.
            console.error("Failed to fetch employee types for dropdown:", err);
            setEmployeeTypes([]); 
        } finally {
            setLoadingTypes(false);
        }
    }, []);

    useEffect(() => {
        fetchMappings();
        fetchEmployeeTypes();
    }, [fetchMappings, fetchEmployeeTypes]);

    // TODO: Implement showModal, handleCancel, handleOk, handleDelete
    const showModal = (mapping: SheetMapping | null = null) => {
        console.log("Show modal for:", mapping);
        setEditingMapping(mapping);
        // form.setFieldsValue(mapping ? mapping : { sheet_name: '', employee_type_key: '', target_staging_table: '' });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingMapping(null);
        form.resetFields();
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setIsSaving(true);
            setError(null);
            if (editingMapping) {
                // Update existing mapping
                const updatePayload: SheetMappingUpdate = {
                    employee_type_key: values.employee_type_key,
                    target_staging_table: values.target_staging_table
                };
                await apiClient.put(`/api/config/sheet-mappings/${encodeURIComponent(editingMapping.sheet_name)}`, updatePayload);
                message.success(t('sheetMappingManager.messages.updateSuccess'));
            } else {
                // Create new mapping
                const createPayload: SheetMappingCreate = {
                    sheet_name: values.sheet_name,
                    employee_type_key: values.employee_type_key,
                    target_staging_table: values.target_staging_table
                };
                await apiClient.post('/api/config/sheet-mappings', createPayload);
                message.success(t('sheetMappingManager.messages.createSuccess'));
            }
            handleCancel();
            fetchMappings(); // Refresh after save
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || t('sheetMappingManager.errors.saveFailed');
            setError(errorMsg);
            message.error(errorMsg);
            // Keep modal open on error for user to see/correct
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (sheetName: string) => {
        setLoading(true); // Use main loading as delete is quick
        setError(null);
        try {
            await apiClient.delete(`/api/config/sheet-mappings/${encodeURIComponent(sheetName)}`);
            message.success(t('sheetMappingManager.messages.deleteSuccess'));
            fetchMappings(); // Refresh after delete
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || t('sheetMappingManager.errors.deleteFailed');
            setError(errorMsg);
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Define table columns
    const columns: TableColumnsType<SheetMapping> = [
        {
            title: 'Sheet 名称',
            dataIndex: 'sheet_name',
            key: 'sheet_name',
        },
        {
            title: '员工类型 Key',
            dataIndex: 'employee_type_key',
            key: 'employee_type_key',
        },
        {
            title: '目标暂存表',
            dataIndex: 'target_staging_table',
            key: 'target_staging_table',
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)} size="small">编辑</Button>
                    <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.sheet_name)}>
                        <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>导入表适配管理</Title>
            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(null)}>
                    新增映射
                </Button>
            </Space>
            {error && <Alert message="错误" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}
            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={mappings}
                    rowKey="sheet_name" // Use sheet_name as the key
                    bordered
                    size="small"
                />
            </Spin>
            <Modal
                title={editingMapping ? '编辑映射' : '新增映射'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={isSaving}
                destroyOnClose
                forceRender
            >
                <Spin spinning={isSaving}>
                    <Form form={form} layout="vertical" name="sheet_mapping_form">
                        <Form.Item
                            name="sheet_name"
                            label="Sheet 名称"
                            rules={[{ required: true, message: '请输入 Excel 中的 Sheet 名称' }]}
                        >
                            <Input placeholder="例如：工资明细-公务员" disabled={!!editingMapping} />
                        </Form.Item>
                        <Form.Item
                            name="employee_type_key"
                            label="员工类型 Key"
                            rules={[{ required: true, message: '请选择或输入员工类型 Key' }]}
                        >
                            <Select 
                                placeholder="选择或输入 Key (如: gwy)" 
                                loading={loadingTypes}
                                showSearch
                            >
                                {employeeTypes.map(et => (
                                    <Option key={et.employee_type_key} value={et.employee_type_key}>
                                        {et.name} ({et.employee_type_key})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="target_staging_table"
                            label="目标暂存表名"
                            rules={[{ required: true, message: '请输入目标暂存表名' }]}
                        >
                            <Input placeholder="例如：raw_salary_data_staging" />
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default SheetMappingManager; 