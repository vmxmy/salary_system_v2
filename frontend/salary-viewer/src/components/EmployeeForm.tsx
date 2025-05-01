import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Row, Col, Space } from 'antd';
import { useTranslation } from 'react-i18next';

// Replicate or import these interfaces (ideally import from a shared types file)
interface Department {
    id: number;
    name: string;
}

interface EstablishmentType {
    id: number;
    name: string;
}

interface EmployeeFormProps {
    initialValues?: Partial<EmployeeFormData & { id: number }>;
    departments: Department[];
    onSubmit: (values: EmployeeFormData) => void;
    onCancel: () => void;
    loadingDepartments: boolean;
    submitLoading?: boolean;
    establishmentTypes: EstablishmentType[];
    loadingEstablishmentTypes: boolean;
}

// Define the shape of the data the form will submit
interface EmployeeFormData {
    name: string;
    id_card_number: string;
    employee_unique_id?: string | null;
    department_id?: number | null;
    establishment_type_id?: number | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
    initialValues, 
    departments, 
    onSubmit, 
    onCancel, 
    loadingDepartments, 
    submitLoading,
    establishmentTypes,
    loadingEstablishmentTypes
}) => {
    const [form] = Form.useForm<EmployeeFormData>();
    const { t } = useTranslation();

    useEffect(() => {
        if (initialValues) {
            const formData: EmployeeFormData = {
                name: initialValues.name ?? '',
                id_card_number: initialValues.id_card_number ?? '',
                employee_unique_id: initialValues.employee_unique_id ?? null,
                department_id: initialValues.department_id ?? null,
                establishment_type_id: initialValues.establishment_type_id ?? null,
                bank_account_number: initialValues.bank_account_number ?? null,
                bank_name: initialValues.bank_name ?? null,
            };
            console.log("Setting form initial values:", formData);
            form.setFieldsValue(formData);
        } else {
            form.resetFields();
        }
    }, [initialValues, form]);

    const handleFinish = (values: EmployeeFormData) => {
        console.log('Form finished with values:', values);
        onSubmit(values);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="name"
                        label={t('employeeForm.labels.name')}
                        rules={[{ required: true, message: t('employeeForm.validation.nameRequired') }]}
                    >
                        <Input id="name" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="employee_unique_id"
                        label={t('employeeForm.labels.employeeId')}
                    >
                        <Input id="employee_unique_id" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="id_card_number"
                        label={t('employeeForm.labels.idCard')}
                        rules={[{ required: true, message: t('employeeForm.validation.idCardRequired') }]}
                    >
                        <Input id="id_card_number" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="department_id"
                        label={t('employeeForm.labels.department')}
                        rules={[{ required: true, message: t('employeeForm.validation.departmentRequired') }]}
                    >
                        <Select 
                            id="department_id"
                            placeholder={t('employeeForm.placeholders.department')}
                            loading={loadingDepartments}
                            allowClear
                        >
                            {departments.map(dept => (
                                <Select.Option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>
            
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="establishment_type_id"
                        label={t('employeeForm.labels.establishment')}
                    >
                        <Select 
                            id="establishment_type_id"
                            placeholder={t('employeeForm.placeholders.establishment')}
                            loading={loadingEstablishmentTypes}
                            allowClear
                        >
                            {establishmentTypes.map(et => (
                                <Select.Option key={et.id} value={et.id}>
                                    {et.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="bank_account_number"
                        label={t('employeeForm.labels.bankAccount')}
                    >
                        <Input id="bank_account_number" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="bank_name"
                        label={t('employeeForm.labels.bankName')}
                    >
                        <Input id="bank_name" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
                <Space>
                    <Button onClick={onCancel} disabled={submitLoading}>
                        {t('employeeForm.buttons.cancel')}
                    </Button>
                    <Button type="primary" htmlType="submit" loading={submitLoading}>
                        {t('employeeForm.buttons.submit')}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default EmployeeForm; 