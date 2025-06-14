import React, { useMemo, useState } from 'react';
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
  Spin,
  Modal,
  List,
  Card,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DatabaseOutlined,
  ArrowLeftOutlined,
  CloudUploadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { ProCard, ProTable, ProForm, ProFormSelect, ProFormSwitch } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { 
  ValidatedPayrollEntryData, 
  PayrollPeriod, 
  PayrollComponentDefinition 
} from '../../../types/payrollTypes';
import type { ValidationSummary } from '../types/constants';
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

  // 添加状态来管理错误详情模态框
  const [errorDetailModalVisible, setErrorDetailModalVisible] = useState(false);
  const [selectedRecordErrors, setSelectedRecordErrors] = useState<{
    record: any;
    errors: string[];
  } | null>(null);

  // 格式化货币显示
  const formatCurrency = (value: any): string => {
    if (value == null || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? String(value) : `¥${num.toFixed(2)}`;
  };

  // 渲染验证错误
  const renderValidationErrors = (errors: any, record?: any) => {
    // 确保errors是数组类型
    const errorArray = Array.isArray(errors) ? errors : [];
    
    if (errorArray.length === 0) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>有效</Tag>;
    }
    
    return (
      <Space>
        <Tag color="red" icon={<CloseCircleOutlined />}>
          {errorArray.length} 个错误
        </Tag>
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRecordErrors({ record, errors: errorArray });
            setErrorDetailModalVisible(true);
          }}
          style={{ padding: 0, height: 'auto' }}
        >
          查看详情
        </Button>
      </Space>
    );
  };

  // 错误详情模态框
  const renderErrorDetailModal = () => (
    <Modal
      title="验证错误详情"
      open={errorDetailModalVisible}
      onCancel={() => {
        setErrorDetailModalVisible(false);
        setSelectedRecordErrors(null);
      }}
      footer={[
        <Button key="close" onClick={() => {
          setErrorDetailModalVisible(false);
          setSelectedRecordErrors(null);
        }}>
          关闭
        </Button>
      ]}
      width={800}
    >
      {selectedRecordErrors && (
        <div>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Typography.Title level={5}>📄 记录信息</Typography.Title>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Typography.Text strong>员工编号：</Typography.Text>
                <Typography.Text>{selectedRecordErrors.record?.employee_id || '-'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>员工姓名：</Typography.Text>
                <Typography.Text>{selectedRecordErrors.record?.employee_name || selectedRecordErrors.record?.employee_full_name || '-'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>身份证号：</Typography.Text>
                <Typography.Text>{selectedRecordErrors.record?.id_number || '-'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>应发合计：</Typography.Text>
                <Typography.Text>{formatCurrency(selectedRecordErrors.record?.gross_pay)}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>实发合计：</Typography.Text>
                <Typography.Text>{formatCurrency(selectedRecordErrors.record?.net_pay)}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>扣除合计：</Typography.Text>
                <Typography.Text>{formatCurrency(selectedRecordErrors.record?.total_deductions)}</Typography.Text>
              </Col>
            </Row>
          </Card>

          <Card size="small">
            <Typography.Title level={5}>❌ 验证错误列表 ({selectedRecordErrors.errors.length} 个)</Typography.Title>
            <List
              dataSource={selectedRecordErrors.errors}
              renderItem={(error, index) => {
                // 解析错误类型
                let errorType = '其他错误';
                let errorColor = 'default';
                
                if (typeof error === 'string') {
                  if (error.includes('重复') || error.includes('duplicate') || error.includes('已存在')) {
                    errorType = '重复记录';
                    errorColor = 'orange';
                  } else if (error.includes('必填') || error.includes('required') || error.includes('不能为空')) {
                    errorType = '必填项缺失';
                    errorColor = 'red';
                  } else if (error.includes('格式') || error.includes('format') || error.includes('无效')) {
                    errorType = '格式错误';
                    errorColor = 'volcano';
                  } else if (error.includes('计算') || error.includes('金额') || error.includes('数值')) {
                    errorType = '计算错误';
                    errorColor = 'magenta';
                  } else if (error.includes('员工') || error.includes('employee') || error.includes('找不到')) {
                    errorType = '员工信息错误';
                    errorColor = 'blue';
                  }
                }

                return (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color={errorColor}>{errorType}</Tag>
                        <Typography.Text style={{ fontSize: 12, color: '#999' }}>
                          错误 #{index + 1}
                        </Typography.Text>
                      </div>
                      <Typography.Text type="danger">
                        {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
                      </Typography.Text>
                    </div>
                  </List.Item>
                );
              }}
              size="small"
            />
            
            {/* 错误解决建议 */}
            <Alert
              style={{ marginTop: 16 }}
              type="info"
              showIcon
              message="💡 错误解决建议"
              description={
                <div>
                  <p><strong>常见解决方案：</strong></p>
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li><strong>重复记录错误：</strong>启用"覆盖已有记录"选项，或删除重复数据</li>
                    <li><strong>必填项缺失：</strong>补充完整的员工信息（编号、姓名等）</li>
                    <li><strong>格式错误：</strong>检查日期格式(YYYY-MM-DD)、数值格式等</li>
                    <li><strong>计算错误：</strong>验证应发=收入合计，实发=应发-扣除合计</li>
                    <li><strong>员工信息错误：</strong>确认员工编号在系统中存在且有效</li>
                  </ul>
                </div>
              }
            />
          </Card>
        </div>
      )}
    </Modal>
  );

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
        title: '应发合计',
        dataIndex: 'gross_pay',
        key: 'gross_pay',
        width: 100,
        align: 'right',
        render: (value) => formatCurrency(value),
      },
      {
        title: '实发合计',
        dataIndex: 'net_pay',
        key: 'net_pay',
        width: 100,
        align: 'right',
        render: (value) => formatCurrency(value),
      },
      {
        title: '验证状态',
        dataIndex: 'validationErrors',
        key: 'validation',
        width: 180,
        render: (errors, record) => renderValidationErrors(errors, record),
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

      {/* 错误详情模态框 */}
      {renderErrorDetailModal()}

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