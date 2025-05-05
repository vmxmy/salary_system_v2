import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Typography, Pagination } from 'antd';
import type { PaginationProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
// Assuming i18n setup exists
import { useTranslation } from 'react-i18next';

// Import API service and types
import {
    getFormulas,
    createFormula,
    updateFormula,
    deleteFormula,
    CalculationFormula,
    CalculationFormulaCreate,
    CalculationFormulaUpdate,
    PaginatedResponse
} from '../../services/calculationAdminService'; // Adjust path as needed

const { Title } = Typography;
const { TextArea } = Input;

const FormulaConfigPage: React.FC = () => {
    const { t } = useTranslation(); // Initialize translation hook

    const [formulas, setFormulas] = useState<CalculationFormula[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [editingFormula, setEditingFormula] = useState<CalculationFormula | null>(null);
    const [form] = Form.useForm<CalculationFormulaCreate | CalculationFormulaUpdate>();
    const [pagination, setPagination] = useState<PaginationProps>({
        current: 1,
        pageSize: 10, // Default page size
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
    });

    // Function to fetch formulas
    const fetchFormulas = async (currentPage: number = pagination.current ?? 1, currentPageSize: number = pagination.pageSize ?? 10) => {
        setLoading(true);
        try {
            // TODO: Adapt if backend supports pagination via skip/limit
            const limit: number = currentPageSize; // Ensure limit is number
            const skip = (currentPage - 1) * limit;
            // For now, we fetch all and paginate client-side, assuming getFormulas returns all
            const response = await getFormulas(); // Pass {skip, limit} if backend supports
            setFormulas(response.items);
            setPagination(prev => ({
                ...prev,
                current: currentPage,
                pageSize: currentPageSize,
                total: response.total, // Use total from response
            }));
        } catch (error) {
            message.error(t('config.formulas.messages.loadFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchFormulas();
    }, []); // Empty dependency array means run once on mount

    // Handle pagination change
    const handleTableChange: PaginationProps['onChange'] = (page, pageSize) => {
        // Currently fetches all, so pagination is client-side
        // If backend paginates, call fetchFormulas(page, pageSize);
         setPagination(prev => ({ ...prev, current: page, pageSize: pageSize }));
         // Refetch if backend pagination is implemented
         // fetchFormulas(page, pageSize);
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
                await updateFormula(editingFormula.formula_id, values);
                message.success(t('config.formulas.messages.updateSuccess'));
            } else {
                // Create new formula
                await createFormula(values as CalculationFormulaCreate);
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
                    await deleteFormula(id);
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
    const columns = [
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

    // Client-side pagination logic (if needed because backend doesn't paginate)
    const paginatedData = formulas.slice(
        ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10),
        ((pagination.current ?? 1) * (pagination.pageSize ?? 10))
    );


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
                dataSource={formulas} // Use full list if backend paginates, else use paginatedData
                rowKey="formula_id"
                loading={loading}
                pagination={{...pagination, onChange: handleTableChange}} // Use AntD pagination handler
                // Remove pagination if using client-side slicing above
                // pagination={false}
            />
            {/* Add Pagination component manually if using client-side slicing */}
             {/* <Pagination {...pagination} onChange={handleTableChange} style={{ marginTop: 16, textAlign: 'right' }}/> */}


            <Modal
                title={editingFormula ? t('config.formulas.modal.title.edit') : t('config.formulas.modal.title.create')}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading} // Show loading state on OK button
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