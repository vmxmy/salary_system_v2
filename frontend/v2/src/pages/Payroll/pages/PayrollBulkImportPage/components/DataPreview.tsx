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
  Tag
} from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import type { 
  ValidationResult,
  ImportData,
  ImportSettings,
  PayrollPeriod,
  ValidatedPayrollEntryData
} from '../types/index';

const { Text } = Typography;

interface DataPreviewProps {
  validationResult: ValidationResult;
  importData: ImportData;
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId: number | null;
  importSettings: ImportSettings;
  processedData: ValidatedPayrollEntryData[];
  onSettingsChange: (settings: ImportSettings) => void;
  onExecuteImport: () => void;
  onBackToMapping: () => void;
  loading: boolean;
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
  loading
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
              {getImportButtonText()}
            </Button>
          </Space>
          
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