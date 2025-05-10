import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Spin, Alert, Checkbox, App } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store'; // Adjust path to store
import {
    setFormValue,
    sendPayslipEmailsAsync,
    resetSendTaskStatus,
    fetchDepartmentOptionsAsync,
    fetchEmployeeOptionsAsync,
    // Selectors for options
    selectPayPeriodOptions,
    selectEmailServerConfigOptions,
    selectUnitOptions,
    selectDepartmentOptions,
    selectEmployeeOptions,
    // Selectors for loading status of options
    selectDepartmentsLoadingStatus,
    selectEmployeesLoadingStatus,
    // Selectors for send task status
    selectSendTaskStatus,
    selectSendTaskError,
    selectSendTaskResponse,
    selectEmailSenderFormValues
} from '../../store/slices/emailSenderSlice';
import { SendPayslipRequest, SendPayslipRequestFilters } from '../../pydantic_models/email_sender'; // Adjust path to models
import type { EmailServerConfigOption, UnitOption, DepartmentOption, EmployeeOption } from '../../store/slices/emailSenderSlice'; // Assuming these types are exported from slice

const { Option } = Select;
const { TextArea } = Input;

const EmailSenderForm: React.FC = () => {
    const [form] = Form.useForm<SendPayslipRequest>();
    const dispatch = useDispatch<AppDispatch>();

    // Get options from Redux state
    const payPeriodOptions = useSelector(selectPayPeriodOptions);
    const emailServerConfigOptions = useSelector(selectEmailServerConfigOptions);
    const unitOptions = useSelector(selectUnitOptions);
    const departmentOptions = useSelector(selectDepartmentOptions);
    const employeeOptions = useSelector(selectEmployeeOptions);
    const initialFormValues = useSelector(selectEmailSenderFormValues); // For potential re-hydration or persistence

    // Loading status for dynamic options
    const departmentsLoading = useSelector(selectDepartmentsLoadingStatus) === 'loading';
    const employeesLoading = useSelector(selectEmployeesLoadingStatus) === 'loading';

    // Send task status
    const sendStatus = useSelector(selectSendTaskStatus);
    const sendError = useSelector(selectSendTaskError);
    const sendResponse = useSelector(selectSendTaskResponse);

    // Local state for dynamic fetching based on selection
    const [selectedUnitId, setSelectedUnitId] = useState<number | undefined>(initialFormValues.filters?.unit_ids?.[0]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(initialFormValues.filters?.department_ids?.[0]);

    // Effect to set initial form values (if any) or default values
    useEffect(() => {
        // 查找默认邮件服务器配置
        const defaultEmailConfig = emailServerConfigOptions.find(config => config.is_default);

        form.setFieldsValue({
            pay_period: initialFormValues.pay_period || (payPeriodOptions.length > 0 ? payPeriodOptions[0] : undefined),
            // 如果有默认邮件服务器配置，则使用它；否则使用初始值或第一个配置
            email_config_id: initialFormValues.email_config_id ||
                            (defaultEmailConfig ? defaultEmailConfig.id :
                            (emailServerConfigOptions.length > 0 ? emailServerConfigOptions[0].id : undefined)),
            subject_template: initialFormValues.subject_template || '您的 {pay_period} 工资单 - {employee_name}',
            filters: {
                unit_ids: initialFormValues.filters?.unit_ids || [],
                department_ids: initialFormValues.filters?.department_ids || [],
                employee_ids: initialFormValues.filters?.employee_ids || [],
                employee_specific_data_required: initialFormValues.filters?.employee_specific_data_required === undefined ? true : initialFormValues.filters?.employee_specific_data_required,
            }
        });
    }, [form, initialFormValues, payPeriodOptions, emailServerConfigOptions]);

    // Effect to fetch departments when a unit is selected
    useEffect(() => {
        if (selectedUnitId) {
            dispatch(fetchDepartmentOptionsAsync(selectedUnitId));
            form.setFieldsValue({ filters: { ...form.getFieldValue('filters'), department_ids: [], employee_ids: [] } });
            setSelectedDepartmentId(undefined);
        } else {
             // Clear dependent options if no unit is selected
            dispatch(fetchDepartmentOptionsAsync(undefined)); // Or an action to clear them
            dispatch(fetchEmployeeOptionsAsync(undefined));
        }
    }, [selectedUnitId, dispatch, form]);

    // Effect to fetch employees when a department is selected
    useEffect(() => {
        if (selectedDepartmentId) {
            dispatch(fetchEmployeeOptionsAsync(selectedDepartmentId));
            form.setFieldsValue({ filters: { ...form.getFieldValue('filters'), employee_ids: [] } });
        } else {
            // 当没有选择部门时，清空员工列表
            dispatch(fetchEmployeeOptionsAsync(undefined));
            form.setFieldsValue({ filters: { ...form.getFieldValue('filters'), employee_ids: [] } });
        }
    }, [selectedDepartmentId, dispatch, form]);

    // Handle form submission
    const onFinish = async (values: SendPayslipRequest) => {
        console.log('Submitting payslip send request:', values);
        dispatch(resetSendTaskStatus()); // Reset status before new request, this now also clears the response
        await dispatch(sendPayslipEmailsAsync(values));
    };

    // 使用App.useApp()获取message实例
    const { message } = App.useApp();

    useEffect(() => {
        if (sendStatus === 'succeeded' && sendResponse) {
            message.success(sendResponse.message || '工资单发送任务已成功启动！');
            // Optionally reset form or parts of it
            // form.resetFields(['filters']); // Example: reset filters
        } else if (sendStatus === 'failed' && sendError) {
            message.error(`发送失败: ${sendError}`);
        }
    }, [sendStatus, sendResponse, sendError, dispatch, form, message]);

    // Function to update Redux state on form value changes (debounced or on blur for performance)
    // For simplicity, this example updates on every change. Consider debouncing for text inputs.
    const handleFormValuesChange = (changedValues: any, allValues: SendPayslipRequest) => {
        // More specific handling for filters to merge correctly
        if (changedValues.filters) {
            const currentFilters = form.getFieldValue('filters') as SendPayslipRequestFilters;
            const updatedFilters = { ...currentFilters, ...changedValues.filters };
            dispatch(setFormValue({ field: 'filters', value: updatedFilters }));

            // Handle dynamic fetching based on filter changes
            if (changedValues.filters.unit_ids !== undefined) {
                const newUnitId = changedValues.filters.unit_ids?.[0]; // Assuming single select for now or taking first
                setSelectedUnitId(newUnitId);
            }
            if (changedValues.filters.department_ids !== undefined) {
                const newDeptId = changedValues.filters.department_ids?.[0]; // Assuming single select
                setSelectedDepartmentId(newDeptId);
            }
        } else {
            for (const key in changedValues) {
                if (Object.prototype.hasOwnProperty.call(changedValues, key)) {
                    dispatch(setFormValue({ field: key as keyof SendPayslipRequest, value: changedValues[key] }));
                }
            }
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {sendStatus === 'loading' && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, textAlign: 'center' }}>
                    <Spin />
                    <div style={{ marginTop: '8px' }}>正在提交发送请求...</div>
                </div>
            )}
            <div style={{ opacity: sendStatus === 'loading' ? 0.5 : 1 }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={handleFormValuesChange}
                    // initialValues are set via useEffect to handle dynamic options better
                >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="pay_period" label="薪资周期" rules={[{ required: true, message: '请选择薪资周期' }]}>
                            <Select placeholder="选择薪资周期">
                                {Array.isArray(payPeriodOptions) && payPeriodOptions.filter(period => period != null).map((period: string) => (
                                    <Option key={period} value={period}>{period}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="email_config_id" label="邮件服务器配置" rules={[{ required: true, message: '请选择邮件服务器配置' }]}>
                            <Select placeholder="选择邮件服务器">
                                {Array.isArray(emailServerConfigOptions) && emailServerConfigOptions.filter(config => config && config.id != null).map((config: EmailServerConfigOption) => (
                                    <Option key={config.id} value={config.id}>
                                        {config.server_name} ({config.sender_email}) {config.is_default && <span style={{ color: '#1890ff' }}>[默认]</span>}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="subject_template" label="邮件主题模板" rules={[{ required: true, message: '请输入邮件主题模板' }]}>
                    <Input placeholder="例如: 您的 {pay_period} 工资单 - {employee_name}" />
                </Form.Item>

                <Card title="筛选条件" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item name={['filters', 'unit_ids']} label="选择单位">
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="选择单位 (可多选)"
                                    onChange={(value) => {
                                        // 如果value是空数组或undefined，则设置为undefined
                                        // 否则取第一个值
                                        setSelectedUnitId(value && value.length > 0 ? value[0] : undefined);
                                    }}
                                    loading={false /* unitsLoading is for initial load */}
                                >
                                    {Array.isArray(unitOptions) && unitOptions.filter(unit => unit && unit.id != null).map((unit: UnitOption) => (
                                        <Option key={unit.id} value={unit.id}>{unit.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item name={['filters', 'department_ids']} label="选择部门">
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="选择部门 (可多选)"
                                    loading={departmentsLoading}
                                    onChange={(value) => {
                                        // 如果value是空数组或undefined，则设置为undefined
                                        // 否则取第一个值
                                        setSelectedDepartmentId(value && value.length > 0 ? value[0] : undefined);
                                    }}
                                >
                                    {Array.isArray(departmentOptions) && departmentOptions.filter(dept => dept && dept.id != null).map((dept: DepartmentOption) => (
                                        <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item name={['filters', 'employee_ids']} label="选择员工">
                                <Select mode="multiple" allowClear placeholder="选择员工 (可多选，留空则为部门下所有)" loading={employeesLoading}>
                                    {Array.isArray(employeeOptions) && employeeOptions.filter(emp => emp && emp.id != null).map((emp: EmployeeOption) => (
                                        <Option key={emp.id} value={emp.id}>{emp.name} {emp.email ? `(${emp.email})` : ''}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name={['filters', 'employee_specific_data_required']} valuePropName="checked">
                        <Checkbox>仅处理当期存在有效薪资数据的员工</Checkbox>
                    </Form.Item>
                </Card>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={sendStatus === 'loading'}>
                        发送工资单邮件
                    </Button>
                </Form.Item>

                {/* Displaying response for debugging, can be removed or made conditional */}
                {/* {sendResponse && sendStatus === 'succeeded' && (
                    <Alert message={sendResponse.message} type="success" showIcon style={{marginTop: 16}}/>
                )}
                {sendError && sendStatus === 'failed' && (
                    <Alert message={`错误: ${sendError}`} type="error" showIcon style={{marginTop: 16}}/>
                )} */}
            </Form>
            </div>
        </div>
    );
};

export default EmailSenderForm;