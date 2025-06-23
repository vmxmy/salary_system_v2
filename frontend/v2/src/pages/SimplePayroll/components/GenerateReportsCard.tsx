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
import styles from '../styles/SimplePayrollStyles.module.less';

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
    <Card className={`${styles.baseCard} ${styles.reportCard}`} hoverable>
      <div className={`${styles.baseHeader} ${styles.dataHeader}`}>
        <div className={styles.headerTitle}>
          <span className={`${styles.headerIcon} ${styles.purple}`}>
            <BarChartOutlined />
          </span>
          <span className={styles.headerText}>
            {t('simplePayroll:reports.title')}
            {selectedPeriod && selectedVersion && (
              <span className={styles.headerSubtext}>
                版本 v{selectedVersion.version_number}
              </span>
            )}
          </span>
        </div>
        <div className={styles.headerExtra}>
          {selectedPeriod && (
            <span className={`${styles.headerBadge} ${selectedVersion ? 'success' : 'warning'}`}>
              {selectedVersion ? '可生成' : '未选择版本'}
            </span>
          )}
        </div>
      </div>
      <div className={styles.reportCardBody}>
        {/* 功能描述 */}
        <div className={styles.reportDescription}>
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
                  <Text type="secondary" className={styles.versionText}>
                    {t('simplePayroll:reports.version')}: v{selectedVersion.version_number} 
                    ({selectedVersion.total_entries} {t('simplePayroll:common.entries')})
                  </Text>
                )}
              </Space>
            }
            type="info"
            showIcon
            className={styles.reportAlert}
          />
        )}

        <Divider className={styles.reportDivider} />

        {/* 快速生成按钮 */}
        <div className={styles.reportActions}>
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
        <div className={styles.reportStatus}>
          {!selectedPeriod ? (
            <Text type="secondary" className={`${styles.statusText} ${styles.secondary}`}>
              {t('simplePayroll:reports.selectPeriodHint')}
            </Text>
          ) : !selectedVersion ? (
            <Text type="warning" className={`${styles.statusText} ${styles.warning}`}>
              ⚠️ {t('simplePayroll:reports.noVersionSelected')}
            </Text>
          ) : (
            <Text type="success" className={`${styles.statusText} ${styles.success}`}>
              ✅ {t('simplePayroll:reports.readyToGenerate')}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GenerateReportsCard; 