import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Row, Col, Space, DatePicker, InputNumber, Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

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
    work_start_date?: dayjs.Dayjs | null;
    employment_status?: string | null;
    remarks?: string | null;
    gender?: string | null;
    ethnicity?: string | null;
    date_of_birth?: dayjs.Dayjs | null;
    education_level?: string | null;
    service_interruption_years?: number | string | null;
    continuous_service_years?: number | string | null;
    actual_position?: string | null;
    actual_position_start_date?: dayjs.Dayjs | null;
    position_level_start_date?: dayjs.Dayjs | null;
    email?: string | null;
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
            const formData: Partial<EmployeeFormData> = {
                ...initialValues,
                date_of_birth: initialValues.date_of_birth ? dayjs(initialValues.date_of_birth) : null,
                work_start_date: initialValues.work_start_date ? dayjs(initialValues.work_start_date) : null,
                actual_position_start_date: initialValues.actual_position_start_date ? dayjs(initialValues.actual_position_start_date) : null,
                position_level_start_date: initialValues.position_level_start_date ? dayjs(initialValues.position_level_start_date) : null,
            };
            console.log("Setting form initial values (with Dayjs objects):", formData);
            form.setFieldsValue(formData);
        } else {
            form.resetFields();
        }
    }, [initialValues, form]);

    const handleFinish = (values: EmployeeFormData) => {
        const submitValues = {
            ...values,
            date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
            work_start_date: values.work_start_date ? values.work_start_date.format('YYYY-MM-DD') : null,
            actual_position_start_date: values.actual_position_start_date ? values.actual_position_start_date.format('YYYY-MM-DD') : null,
            position_level_start_date: values.position_level_start_date ? values.position_level_start_date.format('YYYY-MM-DD') : null,
            service_interruption_years: values.service_interruption_years != null ? Number(values.service_interruption_years) : null,
            continuous_service_years: values.continuous_service_years != null ? Number(values.continuous_service_years) : null,
        };
        console.log('Submitting formatted values:', submitValues);
        onSubmit(submitValues as EmployeeFormData);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
        >
            {/* 个人信息版块 */}
            <Card
                title={<Typography.Title level={4} style={{ margin: 0 }}>个人信息</Typography.Title>}
                style={{ marginBottom: 24 }}
            >
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="name"
                            label={t('employeeForm.labels.name')}
                            rules={[{ required: true, message: t('employeeForm.validation.nameRequired') }]}
                        >
                            <Input id="name" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="employee_unique_id"
                            label={t('employeeForm.labels.employeeId')}
                        >
                            <Input id="employee_unique_id" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="id_card_number"
                            label={t('employeeForm.labels.idCard')}
                            rules={[{ required: true, message: t('employeeForm.validation.idCardRequired') }]}
                        >
                            <Input id="id_card_number" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="email"
                            label={t('employeeForm.labels.email')}
                            rules={[
                                {
                                    type: 'email',
                                    message: t('employeeForm.validation.emailInvalid'),
                                },
                            ]}
                        >
                            <Input id="email" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="gender"
                            label={t('employeeForm.labels.gender')}
                        >
                            <Select id="gender" placeholder={t('employeeForm.placeholders.gender')} allowClear>
                                <Select.Option value="男">{t('gender.male')}</Select.Option>
                                <Select.Option value="女">{t('gender.female')}</Select.Option>
                                <Select.Option value="其他">{t('gender.other')}</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ethnicity"
                            label={t('employeeForm.labels.ethnicity')}
                        >
                            <Input id="ethnicity" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="date_of_birth"
                            label={t('employeeForm.labels.dob')}
                        >
                            <DatePicker id="date_of_birth" style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="education_level"
                            label={t('employeeForm.labels.education')}
                        >
                            <Input id="education_level" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            {/* 银行账户信息版块 */}
            <Card
                title={<Typography.Title level={4} style={{ margin: 0 }}>银行账户信息</Typography.Title>}
                style={{ marginBottom: 24 }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="bank_account_number"
                            label={t('employeeForm.labels.bankAccount')}
                        >
                            <Input id="bank_account_number" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="bank_name"
                            label={t('employeeForm.labels.bankName')}
                        >
                            <Input id="bank_name" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            {/* 工作信息版块 */}
            <Card
                title={<Typography.Title level={4} style={{ margin: 0 }}>工作信息</Typography.Title>}
                style={{ marginBottom: 24 }}
            >
                <Row gutter={16}>
                    <Col span={8}>
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
                    <Col span={8}>
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
                    <Col span={8}>
                        <Form.Item
                            name="employment_status"
                            label={t('employeeForm.labels.employmentStatus')}
                        >
                            <Select id="employment_status" placeholder={t('employeeForm.placeholders.employmentStatus')} allowClear>
                                <Select.Option value="在职">{t('status.active')}</Select.Option>
                                <Select.Option value="离职">{t('status.inactive')}</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="work_start_date"
                            label={t('employeeForm.labels.workStartDate')}
                        >
                            <DatePicker id="work_start_date" style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="service_interruption_years"
                            label={t('employeeForm.labels.serviceInterruption')}
                        >
                            <InputNumber id="service_interruption_years" precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="continuous_service_years"
                            label={t('employeeForm.labels.continuousService')}
                        >
                            <InputNumber id="continuous_service_years" precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="actual_position"
                            label={t('employeeForm.labels.actualPosition')}
                        >
                            <Input id="actual_position" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="actual_position_start_date"
                            label={t('employeeForm.labels.actualPosStartDate')}
                        >
                            <DatePicker id="actual_position_start_date" style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="position_level_start_date"
                            label={t('employeeForm.labels.posLevelStartDate')}
                        >
                            <DatePicker id="position_level_start_date" style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="remarks"
                    label={t('employeeForm.labels.remarks')}
                >
                    <Input.TextArea id="remarks" rows={3} />
                </Form.Item>
            </Card>

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