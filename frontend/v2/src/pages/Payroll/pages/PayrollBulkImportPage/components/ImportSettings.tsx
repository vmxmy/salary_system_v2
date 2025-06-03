import React from 'react';
import {
  Card,
  Form,
  Row,
  Col,
  Switch,
  Button,
  Space
} from 'antd';
import PayrollPeriodSelector from './PayrollPeriodSelector';
import type { 
  PayrollPeriod, 
  ImportSettings as ImportSettingsType 
} from '../types/index';

interface ImportSettingsProps {
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId: number | null;
  importSettings: ImportSettingsType;
  loading: boolean;
  onPeriodChange: (periodId: number) => void;
  onSettingsChange: (settings: ImportSettingsType) => void;
  onValidateData: () => void;
  onBackToUpload: () => void;
}

const ImportSettings: React.FC<ImportSettingsProps> = ({
  payrollPeriods,
  selectedPeriodId,
  importSettings,
  loading,
  onPeriodChange,
  onSettingsChange,
  onValidateData,
  onBackToUpload
}) => {
  return (
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
  );
};

export default ImportSettings; 