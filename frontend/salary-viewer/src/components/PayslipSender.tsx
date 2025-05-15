import React, { useState, useEffect } from 'react';
import { Button, Select, Form, Input, Card, Typography, Row, Col, message, Spin, Alert, Checkbox, Space } from 'antd';
import { SendOutlined, UserOutlined, TeamOutlined, BankOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
// 假设API服务已经创建好
// import { getUnits, getDepartments, searchEmployees, sendPayslip } from '@/services/payslipService';
// import { getEmailConfigs } from '@/services/emailConfigService'; // 获取邮件配置列表

// 模拟API服务 - 后续替换为真实API调用
const mockPayslipApi = {
    getUnits: async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [{ id: 1, name: '单位A' }, { id: 2, name: '单位B' }];
    },
    getDepartments: async (unitId?: number) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (unitId === 1) return [{ id: 101, name: '部门X (单位A)' }, { id: 102, name: '部门Y (单位A)' }];
        if (unitId === 2) return [{ id: 201, name: '部门Z (单位B)' }];
        return [{ id: 101, name: '部门X' }, { id: 102, name: '部门Y' }, { id: 201, name: '部门Z' }];
    },
    searchEmployees: async (query: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const allEmployees = [
            { id: 1, name: '张三', department: '部门X', unit: '单位A' },
            { id: 2, name: '李四', department: '部门Y', unit: '单位A' },
            { id: 3, name: '王五', department: '部门Z', unit: '单位B' },
            { id: 4, name: '赵六', department: '部门X', unit: '单位A' },
        ];
        return allEmployees.filter(emp => emp.name.includes(query) || emp.department.includes(query) || emp.unit.includes(query));
    },
    sendPayslip: async (data: PayslipSendData) => {
        console.log('Sending payslip with data:', data);
        await new Promise(resolve => setTimeout(resolve, 2000));
        // 模拟发送结果
        const totalRecipients = (data.employee_ids?.length || 0) + (data.department_ids?.length || 0) * 5 + (data.unit_ids?.length || 0) * 10; // 粗略估计
        const successCount = Math.floor(totalRecipients * (Math.random() * 0.5 + 0.5)); // 50% - 100% success
        const failureCount = totalRecipients - successCount;
        let errors: string[] = [];
        if (failureCount > 0) {
            errors = Array.from({ length: Math.min(failureCount, 3) }, (_, i) => `Failed for recipient ${i + 1} due to mock error.`);
        }
        return {
            message: `Payslips sent. Success: ${successCount}, Failed: ${failureCount}.`,
            success_count: successCount,
            failure_count: failureCount,
            errors: errors,
        };
    },
    getEmailConfigs: async () => { // 模拟获取邮件配置
        await new Promise(resolve => setTimeout(resolve, 300));
        return [
            { id: 1, name: 'Default SMTP', host: 'smtp.example.com', is_default: true },
            { id: 2, name: 'Backup SMTP', host: 'smtp.backup.com', is_default: false },
        ];
    }
};
// END 模拟API服务

interface Unit {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface Employee {
    id: number;
    name: string;
    department?: string;
    unit?: string;
}

interface EmailConfig {
    id: number;
    name: string;
    is_default?: boolean;
}

interface PayslipFormData {
    target_type: 'all' | 'unit' | 'department' | 'employee';
    unit_ids?: number[];
    department_ids?: number[];
    employee_ids?: number[];
    email_config_id?: number;
    subject: string;
    body: string;
    // month_year: string; // Consider adding if payslips are for a specific period
}

interface PayslipSendData extends PayslipFormData {
    // Potentially more fields for backend
}

interface SendResult {
    message: string;
    success_count: number;
    failure_count: number;
    errors?: string[];
}

const PayslipSender: React.FC = () => {
    const { t } = useTranslation();
    const [form] = Form.useForm<PayslipFormData>();
    const [units, setUnits] = useState<Unit[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [searchingEmployees, setSearchingEmployees] = useState(false);
    const [loadingEmailConfigs, setLoadingEmailConfigs] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<SendResult | null>(null);
    const [targetType, setTargetType] = useState<string>('all'); // 'all', 'unit', 'department', 'employee'

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingUnits(true);
            setLoadingEmailConfigs(true);
            try {
                // const unitData = await getUnits(); // 真实API
                const unitData = await mockPayslipApi.getUnits(); // 模拟API
                setUnits(unitData);

                // const configData = await getEmailConfigs(); // 真实API
                const configData = await mockPayslipApi.getEmailConfigs(); // 模拟API
                setEmailConfigs(configData);
                const defaultConfig = configData.find(c => c.is_default);
                if (defaultConfig) {
                    form.setFieldsValue({ email_config_id: defaultConfig.id });
                }

            } catch (error) {
                message.error(t('payslipSender.messages.loadFailed'));
                console.error("Failed to load initial data:", error);
            } finally {
                setLoadingUnits(false);
                setLoadingEmailConfigs(false);
            }
        };
        loadInitialData();
    }, [t, form]);

    const handleUnitChange = async (unitIds: number[]) => {
        form.setFieldsValue({ department_ids: [], employee_ids: [] }); // Reset dependent fields
        setDepartments([]);
        setEmployees([]);
        if (targetType === 'department' && unitIds && unitIds.length > 0) {
            setLoadingDepartments(true);
            try {
                // For simplicity, fetching all departments if multiple units selected,
                // or filter by a single unit if only one is selected.
                // Backend should ideally support fetching departments for multiple units.
                // const deptData = await getDepartments(unitIds.length === 1 ? unitIds[0] : undefined); // 真实API
                const deptData = await mockPayslipApi.getDepartments(unitIds.length === 1 ? unitIds[0] : undefined); // 模拟API
                setDepartments(deptData);
            } catch (error) {
                message.error(t('payslipSender.messages.loadDepartmentsFailed'));
            } finally {
                setLoadingDepartments(false);
            }
        }
    };

    const handleDepartmentChange = () => {
        form.setFieldsValue({ employee_ids: [] }); // Reset employee field
        setEmployees([]);
    };

    const handleEmployeeSearch = async (query: string) => {
        if (query) {
            setSearchingEmployees(true);
            try {
                // const empData = await searchEmployees(query); // 真实API
                const empData = await mockPayslipApi.searchEmployees(query); // 模拟API
                setEmployees(empData);
            } catch (error) {
                message.error(t('payslipSender.messages.searchEmployeesFailed'));
            } finally {
                setSearchingEmployees(false);
            }
        } else {
            setEmployees([]);
        }
    };

    const onFinish = async (values: PayslipFormData) => {
        setSending(true);
        setSendResult(null);
        const payload: PayslipSendData = { ...values };

        // Ensure only relevant IDs are sent based on targetType
        if (values.target_type !== 'unit') delete payload.unit_ids;
        if (values.target_type !== 'department') delete payload.department_ids;
        if (values.target_type !== 'employee') delete payload.employee_ids;
        if (values.target_type === 'all') { // If 'all', clear specific IDs
            delete payload.unit_ids;
            delete payload.department_ids;
            delete payload.employee_ids;
        }


        try {
            // const result = await sendPayslip(payload); // 真实API
            const result = await mockPayslipApi.sendPayslip(payload); // 模拟API
            setSendResult(result);
            if (result.failure_count === 0) {
                message.success(result.message);
            } else {
                message.warning(result.message);
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || t('payslipSender.messages.sendError');
            setSendResult({
                message: errorMessage,
                success_count: 0,
                failure_count: values.employee_ids?.length || 0, // Estimate
                errors: [errorMessage]
            });
            message.error(errorMessage);
            console.error("Failed to send payslip:", error);
        } finally {
            setSending(false);
        }
    };

    const handleTargetTypeChange = (value: string) => {
        setTargetType(value);
        form.setFieldsValue({
            unit_ids: [],
            department_ids: [],
            employee_ids: [],
        });
        setDepartments([]);
        setEmployees([]);
    };


    return (
        <Card>
            <Typography.Title level={3} style={{ marginBottom: '20px' }}>
                {t('payslipSender.title')}
            </Typography.Title>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ target_type: 'all', subject: t('payslipSender.defaults.subject'), body: t('payslipSender.defaults.body') }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item
                            name="email_config_id"
                            label={t('payslipSender.labels.emailConfig')}
                            rules={[{ required: true, message: t('payslipSender.validation.emailConfigRequired') }]}
                        >
                            <Select
                                placeholder={t('payslipSender.placeholders.emailConfig')}
                                loading={loadingEmailConfigs}
                                allowClear
                            >
                                {emailConfigs.map(config => (
                                    <Select.Option key={config.id} value={config.id}>{config.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label={t('payslipSender.labels.sendTo')} name="target_type" rules={[{ required: true }]}>
                    <Select onChange={handleTargetTypeChange} placeholder={t('payslipSender.placeholders.sendTo')}>
                        <Select.Option value="all">{t('payslipSender.targetTypes.all')}</Select.Option>
                        <Select.Option value="unit">{t('payslipSender.targetTypes.unit')}</Select.Option>
                        <Select.Option value="department">{t('payslipSender.targetTypes.department')}</Select.Option>
                        <Select.Option value="employee">{t('payslipSender.targetTypes.employee')}</Select.Option>
                    </Select>
                </Form.Item>

                {targetType === 'unit' && (
                    <Form.Item
                        name="unit_ids"
                        label={<Space><BankOutlined />{t('payslipSender.labels.units')}</Space>}
                        rules={[{ required: true, message: t('payslipSender.validation.unitRequired') }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder={t('payslipSender.placeholders.units')}
                            loading={loadingUnits}
                            onChange={handleUnitChange}
                            filterOption={(input, option) =>
                                (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            allowClear
                        >
                            {units.map(unit => (
                                <Select.Option key={unit.id} value={unit.id}>{unit.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                {targetType === 'department' && (
                    <>
                        <Form.Item
                            name="unit_ids" // Keep unit_ids for filtering departments if needed, or make optional
                            label={<Space><BankOutlined />{t('payslipSender.labels.filterByUnitOptional')}</Space>}
                        >
                            <Select
                                mode="multiple"
                                placeholder={t('payslipSender.placeholders.filterUnits')}
                                loading={loadingUnits}
                                onChange={handleUnitChange} // This will trigger department loading
                                filterOption={(input, option) =>
                                    (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                allowClear
                            >
                                {units.map(unit => (
                                    <Select.Option key={unit.id} value={unit.id}>{unit.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="department_ids"
                            label={<Space><TeamOutlined />{t('payslipSender.labels.departments')}</Space>}
                            rules={[{ required: true, message: t('payslipSender.validation.departmentRequired') }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder={t('payslipSender.placeholders.departments')}
                                loading={loadingDepartments}
                                onChange={handleDepartmentChange}
                                filterOption={(input, option) =>
                                    (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                allowClear
                            >
                                {departments.map(dept => (
                                    <Select.Option key={dept.id} value={dept.id}>{dept.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </>
                )}

                {targetType === 'employee' && (
                    <Form.Item
                        name="employee_ids"
                        label={<Space><UserOutlined />{t('payslipSender.labels.employees')}</Space>}
                        rules={[{ required: true, message: t('payslipSender.validation.employeeRequired') }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder={t('payslipSender.placeholders.employees')}
                            onSearch={handleEmployeeSearch}
                            loading={searchingEmployees}
                            filterOption={false} // Server-side search
                            showSearch
                            allowClear
                        >
                            {employees.map(emp => (
                                <Select.Option key={emp.id} value={emp.id}>
                                    {emp.name} {emp.department && `(${emp.department})`} {emp.unit && `[${emp.unit}]`}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                <Form.Item
                    name="subject"
                    label={t('payslipSender.labels.subject')}
                    rules={[{ required: true, message: t('payslipSender.validation.subjectRequired') }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="body"
                    label={t('payslipSender.labels.body')}
                    rules={[{ required: true, message: t('payslipSender.validation.bodyRequired') }]}
                >
                    <Input.TextArea rows={8} placeholder={t('payslipSender.placeholders.body')} />
                    {/* Consider a Rich Text Editor or Markdown Editor here */}
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending} disabled={sending}>
                        {t('payslipSender.buttons.sendPayslip')}
                    </Button>
                </Form.Item>
            </Form>

            {sending && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin>
                        <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('payslipSender.messages.sending')}</div>
                    </Spin>
                </div>
            )}

            {sendResult && (
                <Alert
                    message={sendResult.message}
                    description={
                        <div>
                            <p>{t('payslipSender.results.successCount', { count: sendResult.success_count })}</p>
                            <p>{t('payslipSender.results.failureCount', { count: sendResult.failure_count })}</p>
                            {sendResult.errors && sendResult.errors.length > 0 && (
                                <>
                                    <p>{t('payslipSender.results.errorsTitle')}:</p>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        {sendResult.errors.map((err, index) => (
                                            <li key={index}>{err}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    }
                    type={sendResult.failure_count === 0 ? 'success' : 'warning'}
                    showIcon
                    style={{ marginTop: '20px' }}
                />
            )}
        </Card>
    );
};

export default PayslipSender;