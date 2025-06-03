import React, { useMemo } from 'react';
import {
  Alert,
  Typography,
  Space,
  Button,
  Select,
  Switch,
  Row,
  Col,
  Statistic,
  Tag,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DatabaseOutlined,
  ArrowLeftOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { ProCard, ProTable, ProForm, ProFormSelect, ProFormSwitch } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { 
  ValidatedPayrollEntryData, 
  PayrollPeriod, 
  PayrollComponentDefinition 
} from '../../../types/payrollTypes';
import type { ValidationSummary } from '../hooks/usePayrollImport';
import bulkImportStyles from '../../../../../styles/payroll-bulk-import.module.less';

const { Title, Text } = Typography;
const { Option } = Select;

interface ImportPreviewStepProps {
  parsedData: ValidatedPayrollEntryData[] | null;
  validationSummary: ValidationSummary;
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId: number | null;
  onPeriodChange: (value: number | null) => void;
  overwriteMode: boolean;
  onOverwriteModeChange: (value: boolean) => void;
  validationEnabled: boolean;
  onValidationEnabledChange: (value: boolean) => void;
  showDetailedErrors: boolean;
  onShowDetailedErrorsChange: (value: boolean) => void;
  componentDefinitions: PayrollComponentDefinition[];
  onUpload: () => void;
  onBack: () => void;
  loadingPeriods: boolean;
}

const ImportPreviewStep: React.FC<ImportPreviewStepProps> = ({
  parsedData,
  validationSummary,
  payrollPeriods,
  selectedPeriodId,
  onPeriodChange,
  overwriteMode,
  onOverwriteModeChange,
  validationEnabled,
  onValidationEnabledChange,
  showDetailedErrors,
  onShowDetailedErrorsChange,
  componentDefinitions,
  onUpload,
  onBack,
  loadingPeriods
}) => {
  const { t } = useTranslation(['payroll', 'common']);

  // 渲染验证错误
  const renderValidationErrors = (errors: any) => {
    // 确保errors是数组类型
    const errorArray = Array.isArray(errors) ? errors : [];
    
    if (errorArray.length === 0) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>有效</Tag>;
    }
    
    if (!showDetailedErrors) {
      return <Tag color="red" icon={<CloseCircleOutlined />}>有错误</Tag>;
    }
    
    return (
      <Space direction="vertical" size={2}>
        {errorArray.map((error: string, index: number) => (
          <Tag key={index} color="red" className={bulkImportStyles.statusTag}>
            {error}
          </Tag>
        ))}
      </Space>
    );
  };

  // ProTable列定义
  const columns: ProColumns<ValidatedPayrollEntryData>[] = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];
    
    const baseColumns: ProColumns<ValidatedPayrollEntryData>[] = [
      {
        title: '序号',
        dataIndex: 'originalIndex',
        key: 'index',
        width: 60,
        align: 'center',
        render: (_, __, index) => index + 1,
      },
      {
        title: '员工姓名',
        dataIndex: 'employee_full_name',
        key: 'employee_full_name',
        width: 120,
        ellipsis: true,
        copyable: true,
      },
      {
        title: '身份证号',
        dataIndex: 'id_number',
        key: 'id_number',
        width: 140,
        ellipsis: true,
        copyable: true,
      },
      {
        title: '应发工资',
        dataIndex: 'gross_pay',
        key: 'gross_pay',
        width: 100,
        align: 'right',
        render: (value) => typeof value === 'number' ? `¥${value.toFixed(2)}` : value,
      },
      {
        title: '实发工资',
        dataIndex: 'net_pay',
        key: 'net_pay',
        width: 100,
        align: 'right',
        render: (value) => typeof value === 'number' ? `¥${value.toFixed(2)}` : value,
      },
      {
        title: '验证状态',
        dataIndex: 'validationErrors',
        key: 'validation',
        width: 120,
        render: (errors) => renderValidationErrors(errors),
      }
    ];

    return baseColumns;
  }, [parsedData, showDetailedErrors]);

  // 渲染统计信息
  const renderStatistics = () => (
    <Row gutter={16} className={bulkImportStyles.mb24}>
      <Col span={6}>
        <ProCard>
          <Statistic
            title="总记录数"
            value={validationSummary.totalRecords}
            prefix={<DatabaseOutlined className={bulkImportStyles.textInfo} />}
          />
        </ProCard>
      </Col>
      <Col span={6}>
        <ProCard>
          <Statistic
            title="有效记录"
            value={validationSummary.validRecords}
            valueStyle={{ color: '#3f8600' }}
            prefix={<CheckCircleOutlined />}
          />
        </ProCard>
      </Col>
      <Col span={6}>
        <ProCard>
          <Statistic
            title="无效记录"
            value={validationSummary.invalidRecords}
            valueStyle={{ color: '#cf1322' }}
            prefix={<CloseCircleOutlined />}
          />
        </ProCard>
      </Col>
      <Col span={6}>
        <ProCard>
          <Statistic
            title="成功率"
            value={validationSummary.totalRecords > 0 
              ? Math.round((validationSummary.validRecords / validationSummary.totalRecords) * 100)
              : 0
            }
            suffix="%"
            valueStyle={{ 
              color: validationSummary.invalidRecords === 0 ? '#3f8600' : '#cf1322' 
            }}
            prefix={validationSummary.invalidRecords === 0 
              ? <CheckCircleOutlined /> 
              : <WarningOutlined />
            }
          />
        </ProCard>
      </Col>
    </Row>
  );

  // 渲染配置选项
  const renderConfigOptions = () => (
    <ProCard 
      title="导入配置" 
      headerBordered
      style={{ marginBottom: 24 }}
    >
      <ProForm
        layout="horizontal"
        submitter={false}
        colon={false}
      >
        <Row gutter={24}>
          <Col span={12}>
            <ProFormSelect
              name="payroll_period"
              label="薪资周期"
              placeholder="请选择薪资周期"
              options={payrollPeriods.map(period => ({
                label: `${period.name} (${period.start_date} - ${period.end_date})`,
                value: period.id
              }))}
              fieldProps={{
                value: selectedPeriodId,
                onChange: onPeriodChange,
                loading: loadingPeriods
              }}
              rules={[{ required: true, message: '请选择薪资周期' }]}
            />
          </Col>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <ProFormSwitch
                name="overwrite_mode"
                label="覆盖模式"
                checkedChildren="启用"
                unCheckedChildren="禁用"
                fieldProps={{
                  checked: overwriteMode,
                  onChange: onOverwriteModeChange
                }}
                extra="启用后将覆盖已存在的薪资记录"
              />
              <ProFormSwitch
                name="validation_enabled"
                label="数据验证"
                checkedChildren="启用"
                unCheckedChildren="禁用"
                fieldProps={{
                  checked: validationEnabled,
                  onChange: onValidationEnabledChange
                }}
                extra="启用后将进行数据有效性检查"
              />
              <ProFormSwitch
                name="show_detailed_errors"
                label="详细错误"
                checkedChildren="显示"
                unCheckedChildren="隐藏"
                fieldProps={{
                  checked: showDetailedErrors,
                  onChange: onShowDetailedErrorsChange
                }}
                extra="显示详细的验证错误信息"
              />
            </Space>
          </Col>
        </Row>
      </ProForm>
    </ProCard>
  );

  // 渲染验证提醒
  const renderValidationAlert = () => {
    if (validationSummary.invalidRecords === 0) {
      return (
        <Alert
          message="数据验证通过"
          description="所有记录都通过了验证，可以安全导入。"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }

    return (
      <Alert
        message="发现数据问题"
        description={
          <div>
            <p>有 <strong>{validationSummary.invalidRecords}</strong> 条记录存在验证错误。</p>
            <p>建议：</p>
            <ul>
              <li>检查并修正数据错误后重新导入</li>
              <li>或者启用"忽略错误记录"选项，仅导入有效记录</li>
            </ul>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  return (
    <ProCard>
      {/* 统计信息 */}
      <ProCard 
        title="数据统计概览" 
        headerBordered
        style={{ marginBottom: 24 }}
      >
        {renderStatistics()}
      </ProCard>

      {/* 配置选项 */}
      {renderConfigOptions()}

      {/* 验证提醒 */}
      {renderValidationAlert()}

      {/* 数据预览表格 */}
      <ProCard 
        title={`数据预览 (${parsedData?.length || 0} 条记录)`}
        headerBordered
        style={{ marginBottom: 24 }}
      >
        {parsedData && parsedData.length > 0 ? (
          <ProTable<ValidatedPayrollEntryData>
            columns={columns}
            dataSource={parsedData}
            rowKey={(record, index) => `${record.employee_full_name}-${index}`}
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条记录`
            }}
            search={false}
            toolBarRender={false}
            options={{
              density: true,
              fullScreen: true,
              reload: false,
              setting: true
            }}
            scroll={{ x: 800, y: 400 }}
            rowClassName={(record) => 
              record.validationErrors && record.validationErrors.length > 0 
                ? 'table-row-error' 
                : 'table-row-success'
            }
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Text type="secondary">暂无数据</Text>
          </div>
        )}
      </ProCard>

      {/* 操作按钮 */}
      <ProCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          >
            返回上一步
          </Button>
          
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<CloudUploadOutlined />}
              onClick={onUpload}
              disabled={!selectedPeriodId || validationSummary.validRecords === 0}
            >
              开始导入 ({validationSummary.validRecords} 条有效记录)
            </Button>
          </Space>
        </div>
      </ProCard>

      <style>{`
        .table-row-error {
          background-color: #fff2f0 !important;
        }
        .table-row-success {
          background-color: #f6ffed !important;
        }
      `}</style>
    </ProCard>
  );
};

export default ImportPreviewStep; 