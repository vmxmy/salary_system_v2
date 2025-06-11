import React from 'react';
import {
  Card,
  Form,
  Row,
  Col,
  Switch,
  Select,
  Button,
  Space,
  Tooltip
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import PayrollPeriodSelector from './PayrollPeriodSelector';
import { OverwriteMode } from '../../../types/payrollTypes';
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
            <Form.Item 
              label={
                <Space>
                  覆写模式
                  <Tooltip title="选择如何处理已存在的薪资记录">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Select
                value={importSettings.overwriteMode}
                onChange={(value) => onSettingsChange({
                  ...importSettings,
                  overwriteMode: value
                })}
                style={{ width: '100%' }}
              >
                <Select.Option value={OverwriteMode.NONE}>
                  不覆写 (重复记录报错)
                </Select.Option>
                <Select.Option value={OverwriteMode.PARTIAL}>
                  部分覆写 (只更新导入的字段)
                </Select.Option>
                <Select.Option value={OverwriteMode.FULL}>
                  全量覆写 (完全替换现有记录)
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* 操作按钮 */}
      <Space style={{ marginTop: 16 }}>
        <Button onClick={onBackToUpload}>
          返回上传
        </Button>
        <Button 
          type="primary" 
          onClick={onValidateData}
          loading={loading}
          disabled={!selectedPeriodId}
        >
          验证数据
        </Button>
      </Space>
    </Card>
  );
};

export default ImportSettings; 