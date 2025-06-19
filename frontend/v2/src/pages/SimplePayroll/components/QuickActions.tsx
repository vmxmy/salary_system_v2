import React, { useState } from 'react';
import { Button, Space, message, Modal, Form, Input, Select, DatePicker, Row, Col, Spin, Checkbox } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { AppstoreOutlined, PlusOutlined, DollarOutlined, ReloadOutlined, EyeOutlined, BankOutlined, DeleteOutlined, UserAddOutlined, FileAddOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { simplePayrollApi } from '../services/simplePayrollApi';
import { deletePayrollPeriod } from '../../Payroll/services/payrollApi';
import PayrollEntryFormModal from '../../Payroll/components/PayrollEntryFormModal';
import { employeeManagementApi } from '../../EmployeeManagement/services/employeeManagementApi';
import type { CreateEmployeeData } from '../../EmployeeManagement/types';
import styles from './QuickActions.module.css';

const { Option } = Select;

interface QuickActionsProps {
  selectedPeriodId?: number;
  selectedVersionId?: number;
  handleNavigateToBulkImport: () => void;
  handleImportTaxData: () => void;
  setPayrollDataModalVisible: (visible: boolean) => void;
  onRefresh?: () => void; // 用于一般刷新数据
  onRefreshAfterDelete?: () => void; // 用于删除后的安全刷新
}

// 简化的员工创建模态框组件
const QuickEmployeeCreateModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ visible, onClose, onSuccess }) => {
  const { t } = useTranslation(['employeeManagement', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [personnelCategories, setPersonnelCategories] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [positions, setPositions] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [jobPositionLevelOptions, setJobPositionLevelOptions] = useState<Array<{ id: number; value: string; label: string }>>([]);
  const [genderOptions, setGenderOptions] = useState<Array<{ id: number; value: string; label: string }>>([]);
  const [statusOptions, setStatusOptions] = useState<Array<{ id: number; value: string; label: string }>>([]);

  // 加载下拉选项数据
  React.useEffect(() => {
    if (visible) {
              const loadOptions = async () => {
          setLoading(true);
          try {
            const [departmentsData, personnelCategoriesData, positionsData, jobPositionLevelData, genderData, statusData] = await Promise.all([
              employeeManagementApi.getDepartments(),
              employeeManagementApi.getPersonnelCategories(),
              employeeManagementApi.getPositions(),
              employeeManagementApi.getLookupValues('JOB_POSITION_LEVEL'),
              employeeManagementApi.getLookupValues('GENDER'),
              employeeManagementApi.getLookupValues('EMPLOYEE_STATUS'),
            ]);
            setDepartments(departmentsData);
            setPersonnelCategories(personnelCategoriesData);
            setPositions(positionsData);
            setJobPositionLevelOptions(jobPositionLevelData);
            setGenderOptions(genderData);
            setStatusOptions(statusData);
        } catch (error) {
          console.error('加载选项失败:', error);
          message.error('加载选项失败');
        } finally {
          setLoading(false);
        }
      };
      loadOptions();
    }
  }, [visible]);

  // 处理部门变化，更新人员类别选项
  const handleDepartmentChange = async (departmentId: number) => {
    try {
      const personnelCategoriesData = await employeeManagementApi.getPersonnelCategories(departmentId);
      setPersonnelCategories(personnelCategoriesData);
      // 清空人员类别选择
      form.setFieldValue('personnel_category_id', undefined);
    } catch (error) {
      console.error('加载人员类别失败:', error);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

              const submitData: CreateEmployeeData = {
          first_name: values.first_name,
          last_name: values.last_name,
          employee_code: values.employee_code,
          gender_lookup_value_id: values.gender_lookup_value_id,
          hire_date: values.hire_date ? values.hire_date.format('YYYY-MM-DD') : undefined,
          department_id: values.department_id,
          personnel_category_id: values.personnel_category_id,
          actual_position_id: values.actual_position_id,
          job_position_level_lookup_value_id: values.job_position_level_lookup_value_id,
          status_lookup_value_id: values.status_lookup_value_id,
          email: values.email,
          phone_number: values.phone_number,
          is_active: true,
        };

      await employeeManagementApi.createEmployee(submitData);
      message.success('员工创建成功');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('创建员工失败:', error);
      message.error('创建员工失败：' + (error.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="快速添加员工"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          创建员工
        </Button>
      ]}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: true,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="姓"
                rules={[{ required: true, message: '请输入姓' }]}
              >
                <Input placeholder="请输入姓" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="名"
                rules={[{ required: true, message: '请输入名' }]}
              >
                <Input placeholder="请输入名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employee_code"
                label="员工编号"
              >
                <Input placeholder="请输入员工编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender_lookup_value_id"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别" loading={loading}>
                  {genderOptions.map(option => (
                    <Option key={option.id} value={option.id}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone_number"
                label="电话号码"
              >
                <Input placeholder="请输入电话号码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hire_date"
                label="入职日期"
                rules={[{ required: true, message: '请选择入职日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department_id"
                label="部门"
              >
                <Select 
                  placeholder="请选择部门" 
                  loading={loading}
                  onChange={handleDepartmentChange}
                >
                  {departments.map(option => (
                    <Option key={option.id} value={option.id}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="personnel_category_id"
                label="人员身份"
              >
                <Select placeholder="请选择人员身份" loading={loading}>
                  {personnelCategories.map(option => (
                    <Option key={option.id} value={option.id}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="actual_position_id"
                label="实际任职"
              >
                <Select placeholder="请选择实际任职" loading={loading}>
                  {positions.map(option => (
                    <Option key={option.id} value={option.id}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="job_position_level_lookup_value_id"
                label="职务级别"
              >
                <Select placeholder="请选择职务级别" loading={loading}>
                  {jobPositionLevelOptions.map(option => (
                    <Option key={option.id} value={option.id}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="status_lookup_value_id"
                label="员工状态"
                rules={[{ required: true, message: '请选择员工状态' }]}
              >
                <Select placeholder="请选择员工状态" loading={loading}>
                  {statusOptions.map(option => (
                    <Option key={option.id} value={option.id}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  selectedPeriodId,
  selectedVersionId,
  handleNavigateToBulkImport,
  handleImportTaxData,
  setPayrollDataModalVisible,
  onRefresh,
  onRefreshAfterDelete
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [payrollEntryModalVisible, setPayrollEntryModalVisible] = useState(false);
  const [employeeCreateModalVisible, setEmployeeCreateModalVisible] = useState(false);

  // 🎯 复制上月工资记录数据（只复制薪资条目，不复制配置）
  const handleCopyPreviousPayrollEntries = async () => {
    if (!selectedPeriodId) {
      message.error('请先选择一个工资期间');
      return;
    }

    // 使用Modal.confirm替换为自定义对话框
    Modal.confirm({
      title: '复制上月数据',
      icon: <ReloadOutlined style={{ color: '#1890ff' }} />,
      content: (
        <div style={{ marginTop: 16 }}>
          <p>请选择要复制的数据类型：</p>
          <Form layout="vertical">
            <Form.Item>
              <Checkbox defaultChecked>工资记录</Checkbox>
            </Form.Item>
            <Form.Item>
              <Checkbox defaultChecked>缴费基数（社保、公积金、职业年金）</Checkbox>
            </Form.Item>
          </Form>
          <p style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
            将从上月复制选中的数据到当前期间
          </p>
        </div>
      ),
      okText: '确认复制',
      cancelText: '取消',
      onOk: async () => {
        // 获取选中的复制选项 (通过DOM查询，因为Modal.confirm不支持Form的常规数据获取方式)
        const checkboxes = document.querySelectorAll('.ant-modal-content .ant-checkbox-wrapper');
        const copyPayroll = checkboxes[0]?.querySelector('input')?.checked !== false;
        const copyInsuranceBase = checkboxes[1]?.querySelector('input')?.checked !== false;
        
        if (!copyPayroll && !copyInsuranceBase) {
          message.warning('请至少选择一种数据类型进行复制');
          return;
        }

        // 声明变量在更高的作用域，确保在catch块中可以访问
        let currentPeriod: any = null;
        let previousPeriod: any = null;

        try {
          setLoading(prev => ({ 
            ...prev, 
            copy_payroll_entries: copyPayroll,
            copy_base_amounts: copyInsuranceBase
          }));

          console.log('🚀 [复制数据] 开始获取期间列表');
          
          // 获取所有期间列表
          const periodsResponse = await simplePayrollApi.getPayrollPeriods({});
          const allPeriods = periodsResponse.data;
          
          // 找到当前期间
          currentPeriod = allPeriods.find(p => p.id === selectedPeriodId);
          if (!currentPeriod) {
            message.error('无法找到当前期间信息');
            return;
          }

          console.log('📋 [复制数据] 当前期间:', currentPeriod);
          console.log('📋 [复制数据] 所有期间:', allPeriods.map(p => ({ id: p.id, name: p.name })));

          // 如果需要复制工资记录，先检查当前期间是否已有工资记录
          if (copyPayroll) {
            console.log('🔍 [复制数据] 检查当前期间是否已有工资记录');
            const existingDataCheck = await simplePayrollApi.checkExistingData(selectedPeriodId);
            
            if (existingDataCheck.data.summary.total_payroll_entries > 0) {
              const summary = existingDataCheck.data.summary;
              message.warning({
                content: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 当前期间已有工资记录</div>
                    <div>📋 期间：{currentPeriod.name}</div>
                    <div>👥 工资记录：{summary.total_payroll_entries} 条</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>请先删除现有工资记录或选择其他期间</div>
                  </div>
                ),
                duration: 8
              });
              return;
            }
          }

          // 如果需要复制缴费基数，检查当前期间是否已有缴费基数配置
          if (copyInsuranceBase) {
            console.log('🔍 [复制数据] 检查当前期间是否已有缴费基数配置');
            const existingBaseCheck = await simplePayrollApi.checkExistingInsuranceBase(selectedPeriodId);
            
            if (existingBaseCheck.data.has_insurance_base_data) {
              const baseConfigs = existingBaseCheck.data.base_configs;
              message.warning({
                content: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 当前期间已有缴费基数配置</div>
                    <div>📋 期间：{currentPeriod.name}</div>
                    <div>👥 涉及员工：{baseConfigs.unique_employees} 人</div>
                    {baseConfigs.employees_with_social_base > 0 && <div>🏥 有社保基数：{baseConfigs.employees_with_social_base} 人</div>}
                    {baseConfigs.employees_with_housing_base > 0 && <div>🏠 有公积金基数：{baseConfigs.employees_with_housing_base} 人</div>}
                    {/* 职业年金基数信息 - 后端API可能尚未更新返回此字段 */}
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>包含社保、公积金和职业年金基数</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {existingBaseCheck.data.recommendation.message}
                    </div>
                  </div>
                ),
                duration: 8
              });
              return;
            }
          }

          // 按时间降序排序，找到比当前期间时间更早的最近期间（真正的上个月）
          const parseYearMonth = (name: string) => {
            console.log('🔍 [parseYearMonth] 解析期间名称:', name);
            
            // 支持中文格式：2025年06月、2025年6月
            let match = name.match(/(\d{4})年(\d{1,2})月/);
            if (match) {
              const result = { year: parseInt(match[1]), month: parseInt(match[2]) };
              console.log('✅ [parseYearMonth] 中文格式解析成功:', result);
              return result;
            }
            
            // 支持英文格式：2025-06、2025-6
            match = name.match(/(\d{4})-(\d{1,2})/);
            if (match) {
              const result = { year: parseInt(match[1]), month: parseInt(match[2]) };
              console.log('✅ [parseYearMonth] 英文格式解析成功:', result);
              return result;
            }
            
            console.log('❌ [parseYearMonth] 解析失败，不支持的格式:', name);
            return null;
          };
          
          const sortedPeriods = allPeriods
            .filter(p => {
              const currentYearMonth = parseYearMonth(currentPeriod.name);
              const pYearMonth = parseYearMonth(p.name);
              
              if (!currentYearMonth || !pYearMonth) return false;
              
              // 比较年月：确保是更早的期间
              if (pYearMonth.year < currentYearMonth.year) return true;
              if (pYearMonth.year === currentYearMonth.year && pYearMonth.month < currentYearMonth.month) return true;
              return false;
            })
            .sort((a, b) => {
              const aYearMonth = parseYearMonth(a.name);
              const bYearMonth = parseYearMonth(b.name);
              
              if (!aYearMonth || !bYearMonth) return 0;
              
              if (aYearMonth.year !== bYearMonth.year) return bYearMonth.year - aYearMonth.year;
              return bYearMonth.month - aYearMonth.month;
            });
          
          if (sortedPeriods.length === 0) {
            message.warning('没有找到更早的期间，无法复制工资记录');
            return;
          }

          previousPeriod = sortedPeriods[0];

          console.log('🎯 [复制工资记录] 选择源期间:', {
            从: previousPeriod.name,
            到: currentPeriod.name,
            sourcePeriodId: previousPeriod.id,
            targetPeriodId: selectedPeriodId
          });

          // 🎯 调用复制薪资条目API（完整复制工资记录数据）
          const result = await simplePayrollApi.copyPreviousPayroll({
            target_period_id: selectedPeriodId,
            source_period_id: previousPeriod.id,
            description: `复制 ${previousPeriod.name} 工资记录到 ${currentPeriod.name}`,
            force_overwrite: false
          });

          console.log('✅ [复制工资记录] 复制完成:', result);

          let payrollCopySuccess = false;
          let insuranceBaseCopySuccess = false;

          if (result.data) {
            payrollCopySuccess = true;
            if (!copyInsuranceBase) {
              // 如果只复制工资记录，直接显示成功消息
              message.success({
                content: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎉 工资记录复制成功</div>
                    <div>📋 从 {previousPeriod.name} 复制到 {currentPeriod.name}</div>
                    <div>✅ 运行ID: {result.data.id}</div>
                    <div>📊 版本: {result.data.version_number}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>薪资条目记录已复制，可以运行计算引擎</div>
                  </div>
                ),
                duration: 6
              });
            }
          } else {
            message.error('复制工资记录失败');
          }

          // 如果需要复制缴费基数，调用缴费基数复制API
          if (copyInsuranceBase) {
            try {
              console.log('🚀 [复制缴费基数] 开始复制缴费基数');
              
              // 调用专门的缴费基数复制API
              const baseResult = await simplePayrollApi.copyInsuranceBaseAmounts({
                source_period_id: previousPeriod.id,
                target_period_id: selectedPeriodId
              });
              
              console.log('✅ [复制缴费基数] 复制完成:', baseResult);
              
              if (baseResult.data && baseResult.data.success) {
                insuranceBaseCopySuccess = true;
                
                if (!payrollCopySuccess) {
                  // 如果只复制了缴费基数，显示缴费基数复制成功消息
                  message.success({
                    content: (
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎉 缴费基数复制成功</div>
                        <div>📋 从 {previousPeriod.name} 复制到 {currentPeriod.name}</div>
                        <div>✅ 新建: {baseResult.data.copied_count} 条</div>
                        <div>🔄 更新: {baseResult.data.updated_count} 条</div>
                        <div>⏭ 跳过: {baseResult.data.skipped_count} 条</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>包含社保、公积金和职业年金基数</div>
                      </div>
                    ),
                    duration: 6
                  });
                }
              } else {
                message.error('复制缴费基数失败');
              }
            } catch (baseError: any) {
              console.error('❌ [复制缴费基数] 复制失败:', baseError);
              const errorMessage = baseError?.response?.data?.detail?.message || baseError?.message || '复制缴费基数失败';
              message.error({
                content: (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>❌ 复制缴费基数失败</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{errorMessage}</div>
                  </div>
                ),
                duration: 6
              });
            }
          }
          
          // 如果两种数据都复制成功，显示综合成功消息
          if (payrollCopySuccess && insuranceBaseCopySuccess) {
            message.success({
              content: (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎉 数据复制成功</div>
                  <div>📋 从 {previousPeriod.name} 复制到 {currentPeriod.name}</div>
                  <div>✅ 工资记录和缴费基数已成功复制</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>包含社保、公积金和职业年金基数</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>现在可以运行计算引擎</div>
                </div>
              ),
              duration: 6
            });
          }

          // 刷新数据
          onRefresh?.();
        } catch (error: any) {
          console.error('❌ [复制工资记录] 复制失败:', error);
          console.log('🔍 [复制工资记录] 错误详情:', {
            status: error.response?.status,
            data: error.response?.data,
            errorCode: error.response?.data?.detail?.error?.code
          });
          
          // 检查是否是需要确认的情况（409或422状态码，包含CONFIRMATION_REQUIRED错误码）
          if ((error.response?.status === 409 || error.response?.status === 422) && 
              error.response?.data?.detail?.error?.code === 'CONFIRMATION_REQUIRED') {
            console.log('🔍 [复制工资记录] 检测到需要用户确认的情况');
            const existingData = error.response.data.detail.error.existing_data;
            
            // 显示确认对话框
            Modal.confirm({
              title: '目标期间已有数据',
              content: (
                <div>
                  <p>期间 <strong>{existingData.target_period_name}</strong> 已有数据：</p>
                  <ul>
                    <li>工资运行: {existingData.summary.total_payroll_runs} 个</li>
                    <li>工资条目: {existingData.summary.total_payroll_entries} 条</li>
                    <li>薪资配置: {existingData.summary.total_salary_configs} 条</li>
                  </ul>
                  <p>是否要强制覆盖现有数据？</p>
                </div>
              ),
              okText: '强制覆盖',
              cancelText: '取消',
              onOk: async () => {
                // 用户确认后，重新调用API并设置force_overwrite为true
                try {
                  setLoading(prev => ({ ...prev, copy_payroll_entries: true }));
                  
                  const result = await simplePayrollApi.copyPreviousPayroll({
                    target_period_id: selectedPeriodId,
                    source_period_id: previousPeriod.id,
                    description: `复制 ${previousPeriod.name} 工资记录到 ${currentPeriod.name}`,
                    force_overwrite: true  // 强制覆盖
                  });

                  if (result.data) {
                    message.success({
                      content: (
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎉 工资记录复制成功（已覆盖）</div>
                          <div>📋 从 {previousPeriod.name} 复制到 {currentPeriod.name}</div>
                          <div>✅ 运行ID: {result.data.id}</div>
                          <div>📊 条目数: {result.data.total_entries}</div>
                        </div>
                      ),
                      duration: 6
                    });
                    onRefresh?.();
                  }
                } catch (retryError: any) {
                  console.error('❌ [复制工资记录] 强制覆盖失败:', retryError);
                  const retryErrorMessage = retryError?.response?.data?.detail?.message || retryError?.message || '强制覆盖失败';
                  message.error(`强制覆盖失败: ${retryErrorMessage}`);
                } finally {
                  setLoading(prev => ({ ...prev, copy_payroll_entries: false }));
                }
              }
            });
            return;
          }
          
          // 普通错误处理
          const errorDetails = error?.response?.data?.detail;
          let errorMessage = '复制工资记录失败';
          let detailMessage = '';
          
          if (errorDetails) {
            if (errorDetails.error) {
              errorMessage = errorDetails.error.message || errorMessage;
              detailMessage = errorDetails.error.details || '';
            } else if (errorDetails.message) {
              errorMessage = errorDetails.message;
              detailMessage = errorDetails.details || '';
            }
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          message.error({
            content: (
              <div>
                <div style={{ fontWeight: 'bold' }}>❌ 复制工资记录失败</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{errorMessage}</div>
                {detailMessage && (
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{detailMessage}</div>
                )}
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  状态码: {error?.response?.status || 'Unknown'}
                </div>
              </div>
            ),
            duration: 8
          });
        } finally {
          setLoading(prev => ({ 
            ...prev, 
            copy_payroll_entries: false,
            copy_base_amounts: false
          }));
        }
      }
    });
  };

  // 🔥 删除本月数据（删除薪资周期、工资运行、薪资记录、缴费基数）
  const handleDeleteCurrentMonthData = async () => {
    if (!selectedPeriodId) {
      message.error('请先选择一个工资期间');
      return;
    }

    try {
      console.log('🔍 [删除本月数据] 开始检查期间数据:', selectedPeriodId);

      // 获取当前期间信息
      const periodsResponse = await simplePayrollApi.getPayrollPeriods({});
      const currentPeriod = periodsResponse.data.find(p => p.id === selectedPeriodId);
      if (!currentPeriod) {
        message.error('无法找到当前期间信息');
        return;
      }

      // 检查期间是否有数据
      const existingDataCheck = await simplePayrollApi.checkExistingData(selectedPeriodId);
      const hasPayrollData = existingDataCheck.data.summary.total_payroll_entries > 0 || 
                            existingDataCheck.data.summary.total_payroll_runs > 0;

      const existingBaseCheck = await simplePayrollApi.checkExistingInsuranceBase(selectedPeriodId);
      const hasBaseData = existingBaseCheck.data.has_insurance_base_data;

      // 🔍 添加详细的调试信息
      console.log('🔍 [删除本月数据] 数据检查结果:', {
        selectedPeriodId,
        periodName: currentPeriod.name,
        existingDataCheck: existingDataCheck.data,
        hasPayrollData,
        payrollSummary: existingDataCheck.data.summary,
        existingBaseCheck: existingBaseCheck.data,
        hasBaseData,
        baseSummary: existingBaseCheck.data.base_configs
      });

      if (!hasPayrollData && !hasBaseData) {
        message.warning({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 当前期间无数据</div>
              <div>📋 期间：{currentPeriod.name}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>当前期间没有薪资数据或缴费基数，无需删除</div>
            </div>
          ),
          duration: 6
        });
        return;
      }

      // 显示确认删除对话框
      Modal.confirm({
        title: '🔥 删除本月数据',
        icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
        content: (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <strong>⚠️ 确认要删除 {currentPeriod.name} 的所有数据吗？</strong>
            </div>
            <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
              <div style={{ color: '#d46b08', fontWeight: 'bold', marginBottom: '8px' }}>将删除以下数据：</div>
              {hasPayrollData && (
                <div>
                  <div>🗂️ 薪资周期记录</div>
                  <div>💼 工资运行批次：{existingDataCheck.data.summary.total_payroll_runs} 个</div>
                  <div>💰 薪资条目记录：{existingDataCheck.data.summary.total_payroll_entries} 条</div>
                  <div>📊 审计记录和计算日志</div>
                </div>
              )}
              {hasBaseData && (
                <div style={{ marginTop: hasPayrollData ? '8px' : '0' }}>
                  <div>🏦 员工缴费基数：{existingBaseCheck.data.base_configs.unique_employees} 人</div>
                  {existingBaseCheck.data.base_configs.employees_with_social_base > 0 && (
                    <div>　　社保基数：{existingBaseCheck.data.base_configs.employees_with_social_base} 人</div>
                  )}
                  {existingBaseCheck.data.base_configs.employees_with_housing_base > 0 && (
                    <div>　　公积金基数：{existingBaseCheck.data.base_configs.employees_with_housing_base} 人</div>
                  )}
                </div>
              )}
            </div>
            <div style={{ backgroundColor: '#fff1f0', padding: '12px', borderRadius: '6px' }}>
              <div style={{ color: '#cf1322', fontWeight: 'bold' }}>⚠️ 此操作不可撤销！</div>
              <div style={{ color: '#cf1322', fontSize: '12px' }}>所有相关数据将被永久删除</div>
            </div>
          </div>
        ),
        okText: '确认删除',
        cancelText: '取消',
        okType: 'danger',
        width: 500,
        onOk: async () => {
          try {
            setLoading(prev => ({ ...prev, delete_month_data: true }));

            // 1. 如果有薪资数据，删除薪资周期（级联删除所有相关数据）
            if (hasPayrollData) {
              console.log('🗂️ [删除本月数据] 开始删除薪资周期:', selectedPeriodId);
              await deletePayrollPeriod(selectedPeriodId);
            } else if (hasBaseData) {
              // 2. 如果只有缴费基数，单独删除缴费基数
              console.log('🏦 [删除本月数据] 删除缴费基数:', selectedPeriodId);
              await simplePayrollApi.deleteInsuranceBaseForPeriod(selectedPeriodId);
            }

            message.success({
              content: (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎉 删除成功</div>
                  <div>📋 期间 {currentPeriod.name} 的数据已被删除</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {hasPayrollData ? '包括薪资周期、工资运行、薪资记录' : ''}
                    {hasBaseData ? '包括缴费基数配置' : ''}
                  </div>
                </div>
              ),
              duration: 6
            });

            // 延迟刷新数据，确保后端删除操作完全完成
            // 删除期间后需要特殊处理，因为当前选择的期间/版本已被删除
            setTimeout(() => {
              console.log('🔄 [删除本月数据] 开始刷新，当前选择的期间/版本已被删除');
              
              // 清除当前选择状态（避免404错误）
              const url = new URL(window.location.href);
              url.searchParams.delete('periodId');
              url.searchParams.delete('versionId');
              window.history.replaceState({}, '', url.toString());
              
              // 触发删除后的安全刷新
              if (onRefreshAfterDelete) {
                console.log('🔄 [删除本月数据] 使用删除后安全刷新');
                onRefreshAfterDelete();
              } else if (onRefresh) {
                console.log('🔄 [删除本月数据] 使用普通刷新（可能有错误）');
                onRefresh();
              }
            }, 1000);

          } catch (error: any) {
            console.error('❌ [删除本月数据] 删除失败:', error);
            const errorMessage = error?.response?.data?.detail?.message || error?.message || '删除失败';
            message.error({
              content: (
                <div>
                  <div style={{ fontWeight: 'bold' }}>❌ 删除失败</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{errorMessage}</div>
                </div>
              ),
              duration: 8
            });
          } finally {
            setLoading(prev => ({ ...prev, delete_month_data: false }));
          }
        }
      });

    } catch (error: any) {
      console.error('❌ [删除本月数据] 检查数据失败:', error);
      message.error('检查数据时出错，请稍后重试');
    }
  };

  // 🧑‍💼 添加员工
  const handleAddEmployee = () => {
    // 打开员工创建模态框
    setEmployeeCreateModalVisible(true);
  };

  // 💰 添加工资记录
  const handleAddPayrollRecord = () => {
    if (!selectedPeriodId) {
      message.error('请先选择一个工资期间');
      return;
    }
    
    // 打开工资记录创建模态框
    setPayrollEntryModalVisible(true);
  };

  // 处理员工创建成功回调
  const handleEmployeeCreateSuccess = () => {
    setEmployeeCreateModalVisible(false);
    message.success('员工创建成功，您现在可以为该员工创建工资记录');
  };

  // 处理工资记录模态框成功回调
  const handlePayrollEntrySuccess = () => {
    setPayrollEntryModalVisible(false);
    onRefresh?.();
  };

  if (!selectedPeriodId) {
    return null;
  }

  return (
    <ProCard
      title={
        <Space>
          <AppstoreOutlined />
          {t('simplePayroll:quickActions.title')}
        </Space>
      }
      bordered
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Button 
          onClick={() => setPayrollDataModalVisible(true)}
          block 
          size="large"
          icon={<EyeOutlined />}
          disabled={!selectedVersionId}
        >
          浏览工资数据
        </Button>

        <Button 
          onClick={handleNavigateToBulkImport} 
          block 
          size="large"
          icon={<PlusOutlined />}
        >
          {t('simplePayroll:quickActions.bulkImport')}
        </Button>

        <Button 
          onClick={handleCopyPreviousPayrollEntries}
          block 
          size="large"
          icon={<ReloadOutlined />}
          loading={loading.copy_payroll_entries}
        >
          {t('simplePayroll:quickActions.copyLastMonth')}
        </Button>

        <Button 
          onClick={handleDeleteCurrentMonthData}
          block 
          size="large"
          icon={<DeleteOutlined />}
          loading={loading.delete_month_data}
          type="primary"
          danger
          className={styles.dangerButton}
        >
          删除本月数据
        </Button>

        <Button 
          onClick={handleAddEmployee}
          block 
          size="large"
          icon={<UserAddOutlined />}
        >
          {t('simplePayroll:quickActions.addEmployee')}
        </Button>

        <Button 
          onClick={handleAddPayrollRecord}
          block 
          size="large"
          icon={<FileAddOutlined />}
        >
          {t('simplePayroll:quickActions.addPayrollRecord')}
        </Button>
      </Space>

      {/* 工资记录创建模态框 */}
      <PayrollEntryFormModal
        visible={payrollEntryModalVisible}
        payrollPeriodId={selectedPeriodId || null}
        payrollRunId={selectedVersionId || null}
        entry={null}
        onClose={() => setPayrollEntryModalVisible(false)}
        onSuccess={handlePayrollEntrySuccess}
      />

      {/* 员工创建模态框 */}
      <QuickEmployeeCreateModal
        visible={employeeCreateModalVisible}
        onClose={() => setEmployeeCreateModalVisible(false)}
        onSuccess={handleEmployeeCreateSuccess}
      />
    </ProCard>
  );
}; 