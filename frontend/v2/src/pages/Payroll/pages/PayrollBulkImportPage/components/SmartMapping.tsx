import React from 'react';
import {
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Tag,
  Alert,
  Button,
  Form,
  Select,
  Switch
} from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import PayrollPeriodSelector from './PayrollPeriodSelector';
import type { 
  MappingRule, 
  PayrollPeriod, 
  ImportSettings,
  ImportData 
} from '../types/index';
import { FIELD_TYPE_CONFIG } from '../types/constants';
import { getFieldDisplayName } from '../utils/fieldMapping';

const { Option, OptGroup } = Select;

interface SmartMappingProps {
  importData: ImportData;
  mappingRules: MappingRule[];
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId: number | null;
  importSettings: ImportSettings;
  loading: boolean;
  onMappingRulesChange: (rules: MappingRule[]) => void;
  onPeriodChange: (periodId: number) => void;
  onSettingsChange: (settings: ImportSettings) => void;
  onValidateData: () => void;
  onBackToUpload: () => void;
}

const SmartMapping: React.FC<SmartMappingProps> = ({
  importData,
  mappingRules,
  payrollPeriods,
  selectedPeriodId,
  importSettings,
  loading,
  onMappingRulesChange,
  onPeriodChange,
  onSettingsChange,
  onValidateData,
  onBackToUpload
}) => {
  // 计算映射统计
  const categoryStats = mappingRules.reduce((acc, rule) => {
    acc[rule.category] = (acc[rule.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highConfidenceCount = mappingRules.filter(r => r.confidence >= 0.8).length;
  const lowConfidenceCount = mappingRules.filter(r => r.confidence < 0.6).length;

  // 处理映射规则变更
  const handleMappingChange = (sourceField: string, targetField: string) => {
    const newRules = mappingRules.map(r => 
      r.sourceField === sourceField 
        ? { ...r, targetField: targetField }
        : r
    );
    onMappingRulesChange(newRules);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 映射统计 */}
      <Card title="映射分析概况">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总字段数"
              value={mappingRules.length}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="高置信度"
              value={highConfidenceCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="需确认"
              value={lowConfidenceCount}
              valueStyle={{ color: lowConfidenceCount > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<QuestionCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="映射成功率"
              value={Math.round((highConfidenceCount / mappingRules.length) * 100)}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 字段分类统计 */}
      <Card title="字段分类统计">
        <Row gutter={16}>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                {categoryStats.base || 0}
              </div>
              <Tag color="blue">基础信息</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                {categoryStats.earning || 0}
              </div>
              <Tag color="green">收入项</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
                {categoryStats.deduction || 0}
              </div>
              <Tag color="orange">扣除项</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
                {categoryStats.calculated || 0}
              </div>
              <Tag color="purple">计算项</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#13c2c2' }}>
                {categoryStats.stat || 0}
              </div>
              <Tag color="cyan">统计项</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#eb2f96' }}>
                {categoryStats.other || 0}
              </div>
              <Tag color="magenta">其他</Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 映射详情表格 */}
      <Card title="字段映射详情">
        <Table
          dataSource={mappingRules}
          rowKey="sourceField"
          pagination={false}
          columns={[
            {
              title: '源字段',
              dataIndex: 'sourceField',
              width: 150,
            },
            {
              title: '目标字段',
              dataIndex: 'targetField',
              width: 200,
              render: (text, record) => (
                <div>
                  {/* 显示层：显示中文名称 */}
                  <div style={{ 
                    marginBottom: 4, 
                    fontSize: '12px', 
                    color: text ? '#1890ff' : '#999',
                    fontWeight: text ? 'bold' : 'normal'
                  }}>
                    {text ? getFieldDisplayName(text) : '请选择目标字段'}
                  </div>
                  
                  {/* 选择层：用于修改映射 */}
                  <Select
                    style={{ width: '100%' }}
                    value={text}
                    placeholder="请选择目标字段"
                    showSearch
                    allowClear
                    size="small"
                    filterOption={(input, option) => {
                      const value = option?.value?.toString().toLowerCase() || '';
                      const children = option?.children?.toString().toLowerCase() || '';
                      const searchText = input.toLowerCase();
                      return value.includes(searchText) || children.includes(searchText);
                    }}
                    optionFilterProp="children"
                    onChange={(value) => handleMappingChange(record.sourceField, value)}
                >
                  {/* 基础信息字段 */}
                  <OptGroup label="👤 基础信息">
                    <Option value="employee_full_name">{getFieldDisplayName('employee_full_name')}</Option>
                    <Option value="employee_code">{getFieldDisplayName('employee_code')}</Option>
                    <Option value="department">{getFieldDisplayName('department')}</Option>
                    <Option value="id_number">{getFieldDisplayName('id_number')}</Option>
                    <Option value="employee_category">{getFieldDisplayName('employee_category')}</Option>
                    <Option value="job_level">{getFieldDisplayName('job_level')}</Option>
                  </OptGroup>
                  
                  {/* 收入字段组 - EARNING */}
                  <OptGroup label="💰 收入项目">
                    <Option value="earnings_details.BASIC_SALARY.amount">{getFieldDisplayName('earnings_details.BASIC_SALARY.amount')}</Option>
                    <Option value="earnings_details.POSITION_SALARY_GENERAL.amount">{getFieldDisplayName('earnings_details.POSITION_SALARY_GENERAL.amount')}</Option>
                    <Option value="earnings_details.GRADE_SALARY.amount">{getFieldDisplayName('earnings_details.GRADE_SALARY.amount')}</Option>
                    <Option value="earnings_details.SALARY_GRADE.amount">{getFieldDisplayName('earnings_details.SALARY_GRADE.amount')}</Option>
                    <Option value="earnings_details.PERFORMANCE_SALARY.amount">{getFieldDisplayName('earnings_details.PERFORMANCE_SALARY.amount')}</Option>
                    <Option value="earnings_details.PERFORMANCE_BONUS.amount">{getFieldDisplayName('earnings_details.PERFORMANCE_BONUS.amount')}</Option>
                    <Option value="earnings_details.BASIC_PERFORMANCE_SALARY.amount">{getFieldDisplayName('earnings_details.BASIC_PERFORMANCE_SALARY.amount')}</Option>
                    <Option value="earnings_details.BASIC_PERFORMANCE.amount">{getFieldDisplayName('earnings_details.BASIC_PERFORMANCE.amount')}</Option>
                    <Option value="earnings_details.BASIC_PERFORMANCE_AWARD.amount">{getFieldDisplayName('earnings_details.BASIC_PERFORMANCE_AWARD.amount')}</Option>
                    <Option value="earnings_details.GENERAL_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.GENERAL_ALLOWANCE.amount')}</Option>
                    <Option value="earnings_details.ALLOWANCE_GENERAL.amount">{getFieldDisplayName('earnings_details.ALLOWANCE_GENERAL.amount')}</Option>
                    <Option value="earnings_details.TRAFFIC_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.TRAFFIC_ALLOWANCE.amount')}</Option>
                    <Option value="earnings_details.TOWNSHIP_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.TOWNSHIP_ALLOWANCE.amount')}</Option>
                    <Option value="earnings_details.CIVIL_STANDARD_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.CIVIL_STANDARD_ALLOWANCE.amount')}</Option>
                    <Option value="earnings_details.POSITION_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.POSITION_ALLOWANCE.amount')}</Option>
                    <Option value="earnings_details.PETITION_ALLOWANCE.amount">{getFieldDisplayName('earnings_details.PETITION_ALLOWANCE.amount')}</Option>
                    <Option value="earnings_details.ONLY_CHILD_PARENT_BONUS.amount">{getFieldDisplayName('earnings_details.ONLY_CHILD_PARENT_BONUS.amount')}</Option>
                    <Option value="earnings_details.REFORM_ALLOWANCE_1993.amount">{getFieldDisplayName('earnings_details.REFORM_ALLOWANCE_1993.amount')}</Option>
                    <Option value="earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount">{getFieldDisplayName('earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount')}</Option>
                    <Option value="earnings_details.PROBATION_SALARY.amount">{getFieldDisplayName('earnings_details.PROBATION_SALARY.amount')}</Option>
                    <Option value="earnings_details.BACK_PAY.amount">{getFieldDisplayName('earnings_details.BACK_PAY.amount')}</Option>
                    <Option value="earnings_details.PERFORMANCE_BONUS_BACK_PAY.amount">{getFieldDisplayName('earnings_details.PERFORMANCE_BONUS_BACK_PAY.amount')}</Option>
                    <Option value="earnings_details.POSITION_TECH_GRADE_SALARY.amount">{getFieldDisplayName('earnings_details.POSITION_TECH_GRADE_SALARY.amount')}</Option>
                    <Option value="earnings_details.GRADE_POSITION_LEVEL_SALARY.amount">{getFieldDisplayName('earnings_details.GRADE_POSITION_LEVEL_SALARY.amount')}</Option>
                    <Option value="earnings_details.MONTHLY_PERFORMANCE_BONUS.amount">{getFieldDisplayName('earnings_details.MONTHLY_PERFORMANCE_BONUS.amount')}</Option>
                    <Option value="earnings_details.STAFF_SALARY_GRADE.amount">{getFieldDisplayName('earnings_details.STAFF_SALARY_GRADE.amount')}</Option>
                  </OptGroup>
                  
                  {/* 个人扣除字段组 - PERSONAL_DEDUCTION */}
                  <OptGroup label="📉 个人扣除项">
                    <Option value="deductions_details.PERSONAL_INCOME_TAX.amount">{getFieldDisplayName('deductions_details.PERSONAL_INCOME_TAX.amount')}</Option>
                    <Option value="deductions_details.HOUSING_FUND_PERSONAL.amount">{getFieldDisplayName('deductions_details.HOUSING_FUND_PERSONAL.amount')}</Option>
                    <Option value="deductions_details.PENSION_PERSONAL_AMOUNT.amount">{getFieldDisplayName('deductions_details.PENSION_PERSONAL_AMOUNT.amount')}</Option>
                    <Option value="deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount">{getFieldDisplayName('deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount')}</Option>
                    <Option value="deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount">{getFieldDisplayName('deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount')}</Option>
                    <Option value="deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount">{getFieldDisplayName('deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount')}</Option>
                    <Option value="deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount')}</Option>
                    <Option value="deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount')}</Option>
                    <Option value="deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount')}</Option>
                    <Option value="deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount')}</Option>
                    <Option value="deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount')}</Option>
                    <Option value="deductions_details.ONE_TIME_ADJUSTMENT.amount">{getFieldDisplayName('deductions_details.ONE_TIME_ADJUSTMENT.amount')}</Option>
                  </OptGroup>
                  
                  {/* 单位缴费字段组 - EMPLOYER_DEDUCTION */}
                  <OptGroup label="🏢 单位缴费项">
                    <Option value="employer_deductions.HOUSING_FUND_EMPLOYER.amount">{getFieldDisplayName('employer_deductions.HOUSING_FUND_EMPLOYER.amount')}</Option>
                    <Option value="employer_deductions.PENSION_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.PENSION_EMPLOYER_AMOUNT.amount')}</Option>
                    <Option value="employer_deductions.MEDICAL_INS_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.MEDICAL_INS_EMPLOYER_AMOUNT.amount')}</Option>
                    <Option value="employer_deductions.UNEMPLOYMENT_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.UNEMPLOYMENT_EMPLOYER_AMOUNT.amount')}</Option>
                    <Option value="employer_deductions.OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT.amount')}</Option>
                    <Option value="employer_deductions.INJURY_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.INJURY_EMPLOYER_AMOUNT.amount')}</Option>
                    <Option value="employer_deductions.SERIOUS_ILLNESS_EMPLOYER_AMOUNT.amount">{getFieldDisplayName('employer_deductions.SERIOUS_ILLNESS_EMPLOYER_AMOUNT.amount')}</Option>
                  </OptGroup>
                  
                  {/* 计算结果字段组 - CALCULATION_RESULT */}
                  <OptGroup label="📊 计算结果项">
                    <Option value="calculation_results.TAXABLE_INCOME.amount">{getFieldDisplayName('calculation_results.TAXABLE_INCOME.amount')}</Option>
                    <Option value="calculation_results.TAX_DEDUCTION_AMOUNT.amount">{getFieldDisplayName('calculation_results.TAX_DEDUCTION_AMOUNT.amount')}</Option>
                    <Option value="calculation_results.TAX_EXEMPT_AMOUNT.amount">{getFieldDisplayName('calculation_results.TAX_EXEMPT_AMOUNT.amount')}</Option>
                    <Option value="calculation_results.QUICK_DEDUCTION.amount">{getFieldDisplayName('calculation_results.QUICK_DEDUCTION.amount')}</Option>
                    <Option value="calculation_results.AFTER_TAX_SALARY.amount">{getFieldDisplayName('calculation_results.AFTER_TAX_SALARY.amount')}</Option>
                  </OptGroup>
                  
                  {/* 统计字段组 - STAT */}
                  <OptGroup label="📈 统计项">
                    <Option value="stats.ANNUAL_FIXED_SALARY_TOTAL.amount">{getFieldDisplayName('stats.ANNUAL_FIXED_SALARY_TOTAL.amount')}</Option>
                    <Option value="stats.QUARTERLY_PERFORMANCE_Q1.amount">{getFieldDisplayName('stats.QUARTERLY_PERFORMANCE_Q1.amount')}</Option>
                  </OptGroup>
                  
                  {/* 其他字段 */}
                  <OptGroup label="🏷️ 其他字段">
                    <Option value="other_fields.UNIFIED_PAYROLL_FLAG">{getFieldDisplayName('other_fields.UNIFIED_PAYROLL_FLAG')}</Option>
                    <Option value="other_fields.FISCAL_SUPPORT_FLAG">{getFieldDisplayName('other_fields.FISCAL_SUPPORT_FLAG')}</Option>
                  </OptGroup>
                  
                  {/* 特殊标记字段 */}
                  <OptGroup label="🔧 特殊字段">
                    <Option value="__CALCULATED_FIELD__">{getFieldDisplayName('__CALCULATED_FIELD__')}</Option>
                    <Option value="__SOCIAL_INSURANCE_GROUP__">{getFieldDisplayName('__SOCIAL_INSURANCE_GROUP__')}</Option>
                    <Option value="__IGNORE_FIELD__">{getFieldDisplayName('__IGNORE_FIELD__')}</Option>
                    <Option value="__ROW_NUMBER__">{getFieldDisplayName('__ROW_NUMBER__')}</Option>
                  </OptGroup>
                </Select>
              </div>
              ),
            },
            {
              title: '置信度',
              dataIndex: 'confidence',
              width: 120,
              render: (value) => (
                <div>
                  <Progress
                    percent={Math.round(value * 100)}
                    size="small"
                    status={value >= 0.8 ? 'success' : value >= 0.6 ? 'normal' : 'exception'}
                  />
                </div>
              ),
            },
            {
              title: '字段类型',
              dataIndex: 'category',
              width: 100,
              render: (category: string) => {
                const config = FIELD_TYPE_CONFIG[category as keyof typeof FIELD_TYPE_CONFIG] || FIELD_TYPE_CONFIG.base;
                return <Tag color={config.color}>{config.text}</Tag>;
              },
            },
            {
              title: '必填',
              dataIndex: 'required',
              width: 80,
              render: (required) => required ? <Tag color="red">必填</Tag> : <Tag>可选</Tag>,
            },
          ]}
        />
      </Card>

      {/* 导入设置和操作区域 */}
      <Card title="导入设置">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="选择薪资期间" required>
                <PayrollPeriodSelector
                  periods={payrollPeriods}
                  selectedPeriodId={selectedPeriodId}
                  onChange={onPeriodChange}
                  placeholder="请选择薪资期间"
                  showRecordCount={true}
                  showDateRange={true}
                  size="middle"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="跳过无效记录">
                <Switch
                  checked={importSettings.skipInvalidRecords}
                  onChange={(checked) => onSettingsChange({
                    ...importSettings,
                    skipInvalidRecords: checked
                  })}
                />
                <span style={{ marginLeft: 8 }}>
                  {importSettings.skipInvalidRecords ? '是' : '否'}
                </span>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="覆盖已存在记录">
                <Switch
                  checked={importSettings.overwriteExisting}
                  onChange={(checked) => onSettingsChange({
                    ...importSettings,
                    overwriteExisting: checked
                  })}
                />
                <span style={{ marginLeft: 8 }}>
                  {importSettings.overwriteExisting ? '是' : '否'}
                </span>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {/* 操作按钮 */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space size="large">
            <Button onClick={onBackToUpload}>
              返回上传
            </Button>
            <Button 
              type="primary" 
              onClick={onValidateData}
              loading={loading}
              disabled={!selectedPeriodId}
            >
              下一步：数据验证
            </Button>
          </Space>
        </div>
      </Card>
    </Space>
  );
};

export default SmartMapping;
