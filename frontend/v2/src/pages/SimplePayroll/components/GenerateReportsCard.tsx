import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Alert,
  message,
  Divider
} from 'antd';
import { 
  BarChartOutlined, 
  FilePdfOutlined, 
  FileExcelOutlined, 
  SettingOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { 
  PayrollPeriodResponse, 
  PayrollRunResponse
} from '../types/simplePayroll';

const { Text } = Typography;

interface GenerateReportsCardProps {
  selectedPeriod: PayrollPeriodResponse | null;
  selectedVersion: PayrollRunResponse | null;
}

const GenerateReportsCard: React.FC<GenerateReportsCardProps> = ({
  selectedPeriod,
  selectedVersion
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [generating, setGenerating] = useState(false);

  // 快速生成常用报表
  const handleQuickGenerate = async (reportType: 'salary_summary' | 'tax_declaration') => {
    if (!selectedPeriod) {
      message.warning(t('simplePayroll:reports.selectPeriodFirst'));
      return;
    }

    setGenerating(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success(t('simplePayroll:reports.generateCompleted'));
    } catch (error) {
      message.error(t('simplePayroll:reports.generateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined style={{ color: '#722ed1' }} />
          <span>{t('simplePayroll:reports.title')}</span>
        </Space>
      }
      style={{ height: '400px' }}
      bodyStyle={{ padding: '16px' }}
      hoverable
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 功能描述 */}
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            {t('simplePayroll:reports.description')}
          </Text>
        </div>

        {/* 当前状态信息 */}
        {selectedPeriod && (
          <Alert
            message={
              <Space direction="vertical" size={4}>
                <Text strong>
                  {t('simplePayroll:reports.currentPeriod')}: {selectedPeriod.name}
                </Text>
                {selectedVersion && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {t('simplePayroll:reports.version')}: v{selectedVersion.version_number} 
                    ({selectedVersion.total_entries} {t('simplePayroll:common.entries')})
                  </Text>
                )}
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Divider style={{ margin: '8px 0' }} />

        {/* 快速生成按钮 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={() => handleQuickGenerate('salary_summary')}
            disabled={!selectedPeriod}
            loading={generating}
            block
          >
            {t('simplePayroll:reports.quickGenerate.salaryTable')}
          </Button>

          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleQuickGenerate('tax_declaration')}
            disabled={!selectedPeriod}
            loading={generating}
            block
          >
            {t('simplePayroll:reports.quickGenerate.taxDeclaration')}
          </Button>

          <Button
            icon={<SettingOutlined />}
            disabled={!selectedPeriod}
            block
          >
            {t('simplePayroll:reports.customGenerate')}
          </Button>
        </div>

        {/* 状态提示 */}
        <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
          {!selectedPeriod ? (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('simplePayroll:reports.selectPeriodHint')}
            </Text>
          ) : !selectedVersion ? (
            <Text type="warning" style={{ fontSize: '12px' }}>
              ⚠️ {t('simplePayroll:reports.noVersionSelected')}
            </Text>
          ) : (
            <Text type="success" style={{ fontSize: '12px' }}>
              ✅ {t('simplePayroll:reports.readyToGenerate')}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GenerateReportsCard; 