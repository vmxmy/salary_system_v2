import React, { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, Select, Switch, InputNumber,
    message, Space, Typography, Checkbox, Tooltip, Tag, Row, Col
} from 'antd';
import type { PaginationProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
// Assuming i18n setup exists
import { useTranslation } from 'react-i18next';

// Import API service and types
import {
    getRules,
    createRule,
    updateRule,
    deleteRule,
    getFormulas, // Need this for the form select
    CalculationRule,
    CalculationRuleCreate,
    CalculationRuleUpdate,
    CalculationFormula,
    CalculationRuleConditionCreate,
    PaginatedResponse
} from '../../services/calculationAdminService'; // Adjust path as needed

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Define operators for conditions
const conditionOperators = [
    { value: '==', label: '==' },
    { value: '!=', label: '!=' },
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '>=', label: '>=' },
    { value: '<=', label: '<=' },
    { value: 'contains', label: 'Contains' },
    { value: 'not contains', label: 'Not Contains' },
    { value: 'in', label: 'In (comma-sep)' }, // Indicate format needed
    { value: 'not in', label: 'Not In (comma-sep)' },
];

const RuleConfigPage: React.FC = () => {
    const { t } = useTranslation();

    const [rules, setRules] = useState<CalculationRule[]>([]);
    const [formulas, setFormulas] = useState<CalculationFormula[]>([]); // For dropdown
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [editingRule, setEditingRule] = useState<CalculationRule | null>(null);
    const [form] = Form.useForm<CalculationRuleCreate | CalculationRuleUpdate>();
    const [pagination, setPagination] = useState<PaginationProps>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
    });
    // Add state for filters if needed
    // const [filters, setFilters] = useState({});

    // --- Data Fetching ---
    const fetchRules = async (currentPage = pagination.current ?? 1, currentPageSize = pagination.pageSize ?? 10, currentFilters = {}) => {
        setLoading(true);
        try {
            const limit = currentPageSize;
            const skip = (currentPage - 1) * limit;
            const response = await getRules({ skip, limit, ...currentFilters });
            setRules(response.items);
            setPagination(prev => ({
                ...prev,
                current: currentPage,
                pageSize: currentPageSize,
                total: response.total,
            }));
        } catch (error) {
            message.error(t('config.rules.messages.loadFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormulasForSelect = async () => {
        // Usually, we don't need pagination for selects, fetch all active ones?
        // Assuming getFormulas fetches all here, adjust if needed
        try {
            const response = await getFormulas(); // Fetch all
            setFormulas(response.items);
        } catch (error) {
            message.error(t('config.rules.messages.formulasLoadFailed'));
            console.error(error);
        }
    };

    // Initial load
    useEffect(() => {
        fetchRules();
        fetchFormulasForSelect(); // Fetch formulas for the modal dropdown
    }, []);

    // Handle pagination/filter change
    const handleTableChange = (
        newPagination: PaginationProps,
        // filters: Record<string, FilterValue | null>, // Add filters if implemented
        // sorter: SorterResult<CalculationRule> | SorterResult<CalculationRule>[], // Add sorter if implemented
    ) => {
         fetchRules(newPagination.current, newPagination.pageSize /*, currentFilters */);
    };

    // --- Modal and Form Logic ---
    const showModal = (rule: CalculationRule | null = null) => {
        setEditingRule(rule);
        if (rule) {
            // Prepare form values, especially conditions which are nested
            form.setFieldsValue({
                ...rule,
                // 'conditions' field in Form.List is handled separately
                conditions: rule.conditions || [],
            });
        } else {
            form.resetFields();
            // Set default values if needed, e.g., priority, is_active
            form.setFieldsValue({ priority: 100, is_active: true, conditions: [{}] }); // Start with one empty condition
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
             // Clean up conditions: remove empty/incomplete conditions if necessary
            const cleanedValues = {
                 ...values,
                 conditions: (values.conditions || []).filter(
                     (cond: CalculationRuleConditionCreate) =>
                         cond && cond.context_field_name && cond.operator && cond.comparison_value !== undefined
                 ),
             };

            setLoading(true);

            if (editingRule) {
                await updateRule(editingRule.rule_id, cleanedValues);
                message.success(t('config.rules.messages.updateSuccess'));
            } else {
                await createRule(cleanedValues as CalculationRuleCreate);
                message.success(t('config.rules.messages.createSuccess'));
            }
            setIsModalVisible(false);
            setEditingRule(null);
            form.resetFields();
            fetchRules(pagination.current ?? 1, pagination.pageSize ?? 10); // Refresh list
        } catch (error) {
            message.error(t('config.rules.messages.saveFailed'));
            console.error('Form validation/save error:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Delete Logic ---
    const handleDelete = (id: number) => {
        Modal.confirm({
            title: t('common.confirmDelete.title'),
            content: t('common.confirmDelete.contentRule'),
            okText: t('common.delete'),
            cancelText: t('common.cancel'),
            onOk: async () => {
                try {
                    setLoading(true);
                    await deleteRule(id);
                    message.success(t('config.rules.messages.deleteSuccess'));
                    fetchRules(pagination.current ?? 1, pagination.pageSize ?? 10); // Refresh list
                } catch (error) {
                    message.error(t('config.rules.messages.deleteFailed'));
                    console.error('Delete error:', error);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    // --- Table Columns ---
    const columns = [
        { title: t('common.table.columns.id'), dataIndex: 'rule_id', key: 'rule_id', sorter: (a: CalculationRule, b: CalculationRule) => a.rule_id - b.rule_id, width: 80 },
        { title: t('common.table.columns.name'), dataIndex: 'name', key: 'name', sorter: (a: CalculationRule, b: CalculationRule) => a.name.localeCompare(b.name) },
        { title: t('common.table.columns.priority'), dataIndex: 'priority', key: 'priority', sorter: (a: CalculationRule, b: CalculationRule) => a.priority - b.priority, width: 100 },
        { title: t('common.table.columns.targetField'), dataIndex: 'target_field_db_name', key: 'target_field_db_name' },
        {
            title: t('common.table.columns.actionType'),
            dataIndex: 'action_type',
            key: 'action_type',
            render: (type: string) => <Tag color={type === 'APPLY_FORMULA' ? 'blue' : 'green'}>{type}</Tag>,
            width: 150
        },
         {
             title: t('common.table.columns.actionDetail'),
             key: 'action_detail',
             render: (_:any, record: CalculationRule) => {
                 if (record.action_type === 'APPLY_FORMULA') {
                     return `${t('config.rules.table.actionDetail.formulaPrefix')}: ${record.formula?.name || `ID ${record.formula_id}` || 'N/A'}`;
                 } else if (record.action_type === 'SET_FIXED_VALUE') {
                     return `${t('config.rules.table.actionDetail.valuePrefix')}: ${record.fixed_value}`;
                 }
                 return 'N/A';
             }
         },
        {
             title: t('common.table.columns.conditions'),
             key: 'conditions_summary',
             render: (_:any, record: CalculationRule) => (
                <Tooltip title={
                    <ul>
                        {(record.conditions || []).map((cond, index) => (
                            <li key={index}>{`${cond.context_field_name} ${cond.operator} ${cond.comparison_value}`}</li>
                        ))}
                    </ul>
                }>
                     {t('config.rules.table.conditionsCount', { count: record.conditions?.length || 0 })}
                 </Tooltip>
             )
         },
        {
            title: t('common.table.columns.active'),
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => <Checkbox checked={isActive} disabled />,
            width: 80,
             // TODO: Add filter dropdown
        },
        {
            title: t('common.table.columns.action'),
            key: 'action',
            width: 120,
            render: (_: any, record: CalculationRule) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.rule_id)} />
                </Space>
            ),
        },
    ];

    // --- Render Component ---
    return (
        <div>
            <Title level={2}>{t('config.rules.title')}</Title>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                style={{ marginBottom: 16 }}
            >
                {t('config.rules.buttons.add')}
            </Button>

            {/* TODO: Add filtering UI if needed */}

            <Table
                columns={columns}
                dataSource={rules}
                loading={loading}
                rowKey="rule_id"
                pagination={pagination}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }} // Ensure horizontal scroll if content overflows
            />

            <Modal
                title={editingRule ? t('config.rules.modal.titleEdit') : t('config.rules.modal.titleAdd')}
                open={isModalVisible} // Use 'open' instead of 'visible' for Antd v5+
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading}
                width={800} // Adjust width as needed
                destroyOnClose // Reset form state when modal closes
            >
                {/* Pass the form instance to the Form component */}
                <Form form={form} layout="vertical" name="ruleForm">
                    {/* Basic Info */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label={t('config.rules.form.name.label')}
                                rules={[{ required: true, message: t('config.rules.form.name.required') }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="priority"
                                label={t('config.rules.form.priority.label')}
                                rules={[{ required: true, type: 'number', message: t('config.rules.form.priority.required') }]}
                                initialValue={100}
                            >
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                             <Form.Item
                                 name="is_active"
                                 label={t('config.rules.form.isActive.label')}
                                 valuePropName="checked"
                                 initialValue={true}
                             >
                                 <Switch />
                             </Form.Item>
                        </Col>
                    </Row>
                     <Form.Item
                         name="description"
                         label={t('config.rules.form.description.label')}
                     >
                         <TextArea rows={2} />
                     </Form.Item>

                    {/* Target and Action */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="target_field_db_name"
                                label={t('config.rules.form.targetField.label')}
                                rules={[{ required: true, message: t('config.rules.form.targetField.required') }]}
                                // TODO: Consider fetching available field names for a Select dropdown
                            >
                                <Input placeholder={t('config.rules.form.targetField.placeholder')} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="action_type"
                                label={t('config.rules.form.actionType.label')}
                                rules={[{ required: true, message: t('config.rules.form.actionType.required') }]}
                                initialValue="APPLY_FORMULA"
                            >
                                <Select>
                                    <Option value="APPLY_FORMULA">{t('config.rules.form.actionType.options.applyFormula')}</Option>
                                    <Option value="SET_FIXED_VALUE">{t('config.rules.form.actionType.options.setFixedValue')}</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Action Details - Conditional Fields */}
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.action_type !== currentValues.action_type}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('action_type') === 'APPLY_FORMULA' ? (
                                <Form.Item
                                    name="formula_id"
                                    label={t('config.rules.form.formula.label')}
                                    rules={[{ required: true, message: t('config.rules.form.formula.required') }]}
                                >
                                    <Select showSearch optionFilterProp="children" placeholder={t('config.rules.form.formula.placeholder')}>
                                        {formulas.map(f => (
                                            <Option key={f.formula_id} value={f.formula_id}>{f.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : getFieldValue('action_type') === 'SET_FIXED_VALUE' ? (
                                <Form.Item
                                    name="fixed_value"
                                    label={t('config.rules.form.fixedValue.label')}
                                    rules={[{ required: true, message: t('config.rules.form.fixedValue.required') }]}
                                >
                                    {/* Keep as Input for now, backend converts. Could use InputNumber if strictly numeric */}
                                    <Input placeholder={t('config.rules.form.fixedValue.placeholder')} />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    {/* Conditions List */}
                    <Title level={5} style={{ marginTop: '20px' }}>{t('config.rules.form.conditions.title')}</Title>
                    <Form.List name="conditions">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8, border: '1px dashed #d9d9d9', padding: '10px' }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'context_field_name']}
                                            rules={[{ required: true, message: t('config.rules.form.conditions.contextField.required') }]}
                                            style={{ flex: 2, marginBottom: 0 }}
                                        >
                                            <Input placeholder={t('config.rules.form.conditions.contextField.placeholder')} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'operator']}
                                            rules={[{ required: true, message: t('config.rules.form.conditions.operator.required') }]}
                                            style={{ flex: 1, marginBottom: 0 }}
                                        >
                                            <Select options={conditionOperators} placeholder={t('config.rules.form.conditions.operator.placeholder')} style={{ minWidth: 120 }}/>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'comparison_value']}
                                            rules={[{ required: true, message: t('config.rules.form.conditions.value.required') }]}
                                             style={{ flex: 2, marginBottom: 0 }}
                                        >
                                            <Input placeholder={t('config.rules.form.conditions.value.placeholder')} />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }}/>
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        {t('config.rules.form.conditions.addCondition')}
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </div>
    );
};

export default RuleConfigPage; 