import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input/*, Spin, Alert*/, message, Space, Typography/*, Pagination*/ } from 'antd';
// import type { /*PaginationProps,*/ TablePaginationConfig } from 'antd'; // PaginationProps unused
import type { TablePaginationConfig } from 'antd'; // Keep only used type
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
// Assuming i18n setup exists
import { useTranslation } from 'react-i18next';
// Correct import if calculationAdminService uses named exports
import * as calculationAdminService from '../../services/calculationAdminService';
import type { TableColumnsType } from 'antd';
// Temporarily comment out type import if path is wrong or file doesn't exist yet
// import { CalculationFormula, FormulaCreate, FormulaUpdate } from '../../types/calculationEngine';

const { Title } = Typography;
const { TextArea } = Input;

// Define types locally for now if import fails
interface CalculationFormula {
    formula_id: number;
    name: string;
    description?: string | null;
    formula_expression: string;
    created_at: string;
    updated_at: string;
}
interface FormulaCreate {
    name: string;
    description?: string | null;
    formula_expression: string;
}
interface FormulaUpdate {
    name?: string;
    description?: string | null;
    formula_expression?: string;
}

const FormulaConfigPage: React.FC = () => {
    const { t } = useTranslation(); // Initialize translation hook

    const [formulas, setFormulas] = useState<CalculationFormula[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [editingFormula, setEditingFormula] = useState<CalculationFormula | null>(null);
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
    });
    // const [error, setError] = useState<string | null>(null); // error unused
    const [form] = Form.useForm<FormulaCreate | FormulaUpdate>();

    const fetchFormulas = useCallback(async (page: number, pageSize: number) => {
        setLoading(true);
        // setError(null);
        try {
            // Use named export for the API call
            const response = await calculationAdminService.getFormulas({ // Pass params as object if needed
                skip: (page - 1) * pageSize,
                limit: pageSize
            });
            setFormulas(response.items); // Assuming response structure is { items: [], total: number }
            setPagination(prev => ({ ...prev, current: page, pageSize: pageSize, total: response.total }));
        } catch (err: any) { // Use 'any' or a more specific error type
            // setError(err.message || 'Failed to fetch formulas');
            console.error("Fetch error:", err.message || 'Failed to fetch formulas'); // Log error instead
            message.error(t('formulaConfigPage.errors.fetch'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchFormulas(pagination.current ?? 1, pagination.pageSize ?? 10);
    }, [fetchFormulas, pagination.current, pagination.pageSize]);

    const handleTableChange = (newPagination: TablePaginationConfig) => {
        setPagination(prev => ({ ...prev, current: newPagination.current ?? 1, pageSize: newPagination.pageSize ?? 10 }));
    };

    // Modal handling
    const showModal = (formula: CalculationFormula | null = null) => {
        setEditingFormula(formula);
        if (formula) {
            form.setFieldsValue(formula);
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingFormula(null);
        form.resetFields();
    };

    // Form submission
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true); // Indicate loading during save

            if (editingFormula) {
                // Update existing formula
                await calculationAdminService.updateFormula(editingFormula.formula_id, values);
                message.success(t('config.formulas.messages.updateSuccess'));
            } else {
                // Create new formula
                await calculationAdminService.createFormula(values as FormulaCreate);
                message.success(t('config.formulas.messages.createSuccess'));
            }
            setIsModalVisible(false);
            setEditingFormula(null);
            form.resetFields();
            fetchFormulas(pagination.current ?? 1, pagination.pageSize ?? 10); // Refresh list
        } catch (error) {
            message.error(t('config.formulas.messages.saveFailed')); // Use translated message
            console.error('Form validation/save error:', error);
        } finally {
             setLoading(false);
        }
    };

    // Delete handling
    const handleDelete = (id: number) => {
        Modal.confirm({
            title: t('common.confirmDelete.title'),
            content: t('common.confirmDelete.contentFormula'),
            okText: t('common.delete'),
            cancelText: t('common.cancel'),
            onOk: async () => {
                try {
                    setLoading(true);
                    await calculationAdminService.deleteFormula(id);
                    message.success(t('config.formulas.messages.deleteSuccess'));
                    fetchFormulas(pagination.current ?? 1, pagination.pageSize ?? 10); // Refresh list
                } catch (error) {
                    message.error(t('config.formulas.messages.deleteFailed'));
                    console.error('Delete error:', error);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    // Table columns definition
    const columns: TableColumnsType<CalculationFormula> = [
        { title: t('common.table.columns.id'), dataIndex: 'formula_id', key: 'formula_id', sorter: (a: CalculationFormula, b: CalculationFormula) => a.formula_id - b.formula_id },
        { title: t('common.table.columns.name'), dataIndex: 'name', key: 'name', sorter: (a: CalculationFormula, b: CalculationFormula) => a.name.localeCompare(b.name) },
        { title: t('common.table.columns.description'), dataIndex: 'description', key: 'description' },
        { title: t('common.table.columns.expression'), dataIndex: 'formula_expression', key: 'formula_expression' },
        { title: t('common.table.columns.createdAt'), dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString() },
        { title: t('common.table.columns.updatedAt'), dataIndex: 'updated_at', key: 'updated_at', render: (text: string) => new Date(text).toLocaleString() },
        {
            title: t('common.table.columns.action'),
            key: 'action',
            render: (_: any, record: CalculationFormula) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.formula_id)} />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={2}>{t('config.formulas.title')}</Title>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                style={{ marginBottom: 16 }}
            >
                {t('config.formulas.createButton')}
            </Button>

            <Table
                columns={columns}
                dataSource={formulas}
                rowKey="formula_id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title={editingFormula ? t('config.formulas.modal.title.edit') : t('config.formulas.modal.title.create')}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading}
                width={720}
            >
                <Form form={form} layout="vertical" name="formula_form">
                    <Form.Item
                        name="name"
                        label={t('config.formulas.modal.labels.name')}
                        rules={[{ required: true, message: t('config.formulas.validation.nameRequired') }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label={t('config.formulas.modal.labels.description')}
                    >
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item
                        name="formula_expression"
                        label={t('config.formulas.modal.labels.expression')}
                        rules={[{ required: true, message: t('config.formulas.validation.expressionRequired') }]}
                    >
                        <TextArea rows={4} placeholder={t('config.formulas.modal.placeholders.expression')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default FormulaConfigPage; 