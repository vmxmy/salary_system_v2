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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 验证结果统计 */}
      <Card title="数据验证结果">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总记录数"
              value={validationResult.total}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="有效记录"
              value={validationResult.valid}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="无效记录"
              value={validationResult.invalid}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="成功率"
              value={successRate}
              suffix="%"
              valueStyle={{ color: successRate >= 90 ? '#3f8600' : '#fa8c16' }}
            />
          </Col>
        </Row>
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
        <Space>
          <Button onClick={onBackToMapping}>返回映射</Button>
          <Button 
            type="primary" 
            size="large" 
            onClick={onExecuteImport}
            loading={loading}
            disabled={validationResult.valid === 0}
          >
            开始导入 ({validationResult.valid} 条记录)
          </Button>
          
          {validationResult.invalid > 0 && (
            <Alert
              type="info"
              showIcon
              message="操作提示"
              description="您可以直接导入有效记录，或使用上方的'丢弃无效记录'按钮清理数据后再导入"
              style={{ marginTop: 16, textAlign: 'left' }}
            />
          )}
        </Space>
      </div>
    </Space>
  );
};

export default DataPreview; 