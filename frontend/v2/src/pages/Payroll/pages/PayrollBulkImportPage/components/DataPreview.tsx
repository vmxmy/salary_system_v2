import React from 'react';
import {
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Alert,
  Button,
  Form,
  Switch,
  Typography,
  Tag,
  Collapse,
  Badge,
  Progress
} from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { 
  ValidationResult,
  ImportData,
  ImportSettings,
  PayrollPeriod,
  ValidatedPayrollEntryData,
  BulkImportValidationResult
} from '../types/index';

const { Text } = Typography;
const { Panel } = Collapse;

interface DataPreviewProps {
  validationResult: BulkImportValidationResult;
  importData: ImportData;
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId: number | null;
  importSettings: ImportSettings;
  processedData: ValidatedPayrollEntryData[];
  onSettingsChange: (settings: ImportSettings) => void;
  onExecuteImport: () => void;
  onBackToMapping: () => void;
  loading: boolean;
  progress?: {
    current: number;
    total: number;
    message: string;
    stage: string;
  };
}

const DataPreview: React.FC<DataPreviewProps> = ({
  validationResult,
  importData,
  payrollPeriods,
  selectedPeriodId,
  importSettings,
  processedData,
  onSettingsChange,
  onExecuteImport,
  onBackToMapping,
  loading,
  progress
}) => {
  const successRate = Math.round((validationResult.valid / validationResult.total) * 100);
  
  // 添加调试信息
  console.log('🔍 DataPreview 验证结果:', {
    validationResult,
    overwriteMode: importSettings.overwriteExisting
  });
  
  // 计算是否可以导入：有有效记录且没有阻止性错误
  const canImport = validationResult.valid > 0 && 
                   (!validationResult.errors || validationResult.errors.length === 0);
  
  // 计算导入按钮的状态文本
  const getImportButtonText = () => {
    if (validationResult.valid === 0) {
      return "无有效记录可导入";
    }
    if (validationResult.errors && validationResult.errors.length > 0) {
      return "存在错误，无法导入";
    }
    return `开始导入 (${validationResult.valid} 条记录)`;
  };
  
  console.log('🔍 DataPreview 按钮状态:', {
    canImport,
    buttonText: getImportButtonText(),
    validCount: validationResult.valid,
    errorCount: validationResult.errors?.length || 0,
    warningCount: validationResult.warnings || 0
  });

  // 筛选出有验证错误的记录
  const invalidRecords = validationResult.validatedData?.filter(record => 
    record.validationErrors && record.validationErrors.length > 0
  ) || [];

  // 渲染验证错误详情表格
  const renderValidationErrorsTable = () => {
    if (invalidRecords.length === 0) {
      return null;
    }

    const columns = [
      {
        title: '序号',
        dataIndex: 'originalIndex',
        key: 'index',
        width: 60,
        render: (index: number) => index + 1,
      },
      {
        title: '员工信息',
        key: 'employee',
        width: 200,
        render: (record: any) => (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.employee_full_name || record.employee_name || '未知员工'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.id_number && `身份证: ${record.id_number}`}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.employee_code && `工号: ${record.employee_code}`}
            </div>
          </div>
        ),
      },
      {
        title: '应发工资',
        dataIndex: 'gross_pay',
        key: 'gross_pay',
        width: 100,
        align: 'right' as const,
        render: (value: number) => `¥${(value || 0).toFixed(2)}`,
      },
      {
        title: '实发工资',
        dataIndex: 'net_pay',
        key: 'net_pay',
        width: 100,
        align: 'right' as const,
        render: (value: number) => `¥${(value || 0).toFixed(2)}`,
      },
      {
        title: '验证错误',
        dataIndex: 'validationErrors',
        key: 'validationErrors',
        render: (errors: string[]) => (
          <div>
            <Badge count={errors.length} style={{ marginBottom: 8 }}>
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                {errors.length} 个错误
              </Tag>
            </Badge>
            <div style={{ marginTop: 8 }}>
              {errors.map((error, index) => (
                <div key={index} style={{ 
                  marginBottom: 4, 
                  fontSize: '12px',
                  color: '#cf1322',
                  padding: '2px 6px',
                  backgroundColor: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: '4px'
                }}>
                  {error}
                </div>
              ))}
            </div>
          </div>
        ),
      }
    ];

    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: '#cf1322' }} />
            <span>验证错误详情 ({invalidRecords.length} 条记录)</span>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Alert
          type="error"
          showIcon
          message="发现数据验证错误"
          description={`共 ${invalidRecords.length} 条记录存在验证错误，请查看下方详情并修正数据后重新导入。`}
          style={{ marginBottom: 16 }}
        />
        
        <Table
          dataSource={invalidRecords}
          columns={columns}
          rowKey={(record) => `error-${record.originalIndex || record._clientId}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条错误记录`,
          }}
          size="small"
          scroll={{ x: 800 }}
          bordered
          rowClassName={(record) => 'error-record-row'}
        />
        
        {/* 内联样式 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .error-record-row {
              background-color: #fff2f0 !important;
            }
            .error-record-row:hover {
              background-color: #ffece6 !important;
            }
          `
        }} />
      </Card>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 验证结果统计 */}
      <Card title="数据验证结果">
        <Row gutter={16}>
          <Col span={5}>
            <Statistic
              title="总记录数"
              value={validationResult.total}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="有效记录"
              value={validationResult.valid}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="无效记录"
              value={validationResult.invalid}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="警告数"
              value={validationResult.warnings || 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="成功率"
              value={successRate}
              suffix="%"
              valueStyle={{ color: successRate >= 90 ? '#3f8600' : '#fa8c16' }}
            />
          </Col>
        </Row>
        
        {/* 覆盖模式提示 */}
        {importSettings.overwriteExisting && validationResult.warnings > 0 && (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="覆盖模式已启用"
            description={`检测到 ${validationResult.warnings} 条重复记录，启用覆盖模式后这些记录将被更新而不是报错。`}
          />
        )}
        
        {/* 错误详情 */}
        {validationResult.errors && validationResult.errors.length > 0 && (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message="数据验证错误"
            description={
              <div>
                <div style={{ marginBottom: 8 }}>发现以下错误，需要修正后才能导入：</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationResult.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {validationResult.errors.length > 5 && (
                    <li>... 还有 {validationResult.errors.length - 5} 个错误</li>
                  )}
                </ul>
              </div>
            }
          />
        )}
      </Card>

      {/* 验证错误详情表格 */}
      {renderValidationErrorsTable()}

      {/* 数据样本预览 */}
      <Card title="数据样本预览">
        <div style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: 6,
          overflow: 'hidden'
        }}>
          <Table
            dataSource={importData.rows.slice(0, 5).map((row, index) => {
              const record: any = { key: index };
              importData.headers.forEach((header, i) => {
                record[header] = row[i];
              });
              return record;
            })}
            columns={importData.headers.map((header, colIndex) => ({
              title: header,
              dataIndex: header,
              key: `col-${colIndex}`,
              width: 120,
              ellipsis: {
                showTitle: false
              },
              render: (value) => (
                <span title={value || '(空)'} style={{ 
                  display: 'inline-block',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {value === null || value === '' ? (
                    <Text type="secondary" italic>(空)</Text>
                  ) : (
                    value
                  )}
                </span>
              )
            }))}
            pagination={false}
            size="small"
            scroll={{ 
              x: Math.max(800, importData.headers.length * 120),
              y: 240
            }}
            bordered
          />
        </div>
        {importData.totalRecords > 5 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              显示前5条记录，共 {importData.totalRecords} 条记录
            </Text>
          </div>
        )}
        
        <Alert
          style={{ marginTop: 12 }}
          message="预览说明"
          description="表格支持水平和垂直滚动，可以查看所有字段内容。空单元格显示为「(空)」，鼠标悬停可查看完整内容。"
          type="info"
          showIcon
          closable
        />
      </Card>

      {/* 导入设置 */}
      <Card title="导入设置">
        <Form layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="当前选择的薪资周期">
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#f6ffed', 
                  border: '1px solid #b7eb8f',
                  borderRadius: '6px'
                }}>
                  <Text strong>
                    {payrollPeriods.find(p => p.id === selectedPeriodId)?.name || '未选择周期'}
                  </Text>
                  {selectedPeriodId && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {payrollPeriods.find(p => p.id === selectedPeriodId)?.start_date} ~ {payrollPeriods.find(p => p.id === selectedPeriodId)?.end_date}
                    </div>
                  )}
                </div>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="导入选项">
                <Space direction="vertical">
                  <div>
                    <Switch 
                      checked={importSettings.skipInvalidRecords}
                      onChange={(checked) => onSettingsChange({...importSettings, skipInvalidRecords: checked})}
                    /> 跳过无效记录
                  </div>
                  <div>
                    <Switch 
                      checked={importSettings.overwriteExisting}
                      onChange={(checked) => onSettingsChange({...importSettings, overwriteExisting: checked})}
                    /> 覆盖已存在记录
                  </div>
                  <div>
                    <Switch 
                      checked={importSettings.sendNotification}
                      onChange={(checked) => onSettingsChange({...importSettings, sendNotification: checked})}
                    /> 发送完成通知
                  </div>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button onClick={onBackToMapping}>返回映射</Button>
            <Button 
              type="primary" 
              size="large" 
              onClick={onExecuteImport}
              loading={loading}
              disabled={!canImport}
            >
              {loading ? `正在导入 ${validationResult.valid} 条记录，请稍候...` : getImportButtonText()}
            </Button>
          </Space>
          
          {/* 导入进度条 */}
          {loading && progress && (
            <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
              <Progress 
                percent={progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}
                status={progress.stage === 'completed' ? 'success' : 'active'}
                format={(percent) => `${progress.current}/${progress.total} (${percent}%)`}
                strokeColor={{
                  '0%': progress.stage === 'validating' ? '#1890ff' : '#52c41a',
                  '100%': progress.stage === 'validating' ? '#40a9ff' : '#73d13d',
                }}
              />
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: '14px', color: '#666' }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {progress.message}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {progress.stage === 'validating' && '正在验证数据完整性和员工信息...'}
                  {progress.stage === 'importing' && '正在写入数据库，请耐心等待...'}
                  {progress.stage === 'completed' && '处理完成！'}
                  {!progress.stage && '准备中...'}
                </div>
                {progress.total > 100 && (
                  <div style={{ fontSize: '11px', color: '#ccc', marginTop: 4 }}>
                    大批量数据处理可能需要几分钟时间
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 操作提示 */}
          {validationResult.invalid > 0 && !importSettings.overwriteExisting && (
            <Alert
              type="info"
              showIcon
              message="操作提示"
              description="您可以直接导入有效记录，或返回映射步骤修正数据后再导入。"
              style={{ textAlign: 'left' }}
            />
          )}
          
          {validationResult.warnings > 0 && importSettings.overwriteExisting && (
            <Alert
              type="success"
              showIcon
              message="覆盖模式提示"
              description={`覆盖模式已启用，${validationResult.warnings} 条重复记录将被更新。点击"开始导入"继续执行。`}
              style={{ textAlign: 'left' }}
            />
          )}
          
          {validationResult.errors && validationResult.errors.length > 0 && (
            <Alert
              type="error"
              showIcon
              message="无法导入"
              description="存在数据错误，请返回映射步骤修正后重新验证。"
              style={{ textAlign: 'left' }}
            />
          )}
        </Space>
      </div>
    </Space>
  );
};

export default DataPreview; 