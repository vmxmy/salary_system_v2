import React, { useState } from 'react';
import { 
  Button, 
  Space, 
  Typography, 
  Modal, 
  message,
  Alert,
  Form
} from 'antd';
import { 
  PlusOutlined, 
  CopyOutlined, 
  CloudUploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollPeriodResponse } from '../types/simplePayroll';
import ModernCard from './ModernCard';
import styles from '../styles/SimplePayrollStyles.module.less';

const { Text } = Typography;

interface GeneratePayrollCardModernProps {
  currentPeriod?: PayrollPeriodResponse;
  onRefresh: () => void;
}

const GeneratePayrollCardModern: React.FC<GeneratePayrollCardModernProps> = ({
  currentPeriod,
  onRefresh
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [smartConfirmVisible, setSmartConfirmVisible] = useState(false);
  const [excelModalVisible, setExcelModalVisible] = useState(false);
  const [sourcePeriods, setSourcePeriods] = useState<PayrollPeriodResponse[]>([]);
  const [existingDataInfo, setExistingDataInfo] = useState<any>(null);
  const [pendingCopyParams, setPendingCopyParams] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // ... 其他函数保持不变 ...

  return (
    <>
      <ModernCard 
        icon={<PlusOutlined />}
        title={t('simplePayroll:generate.title')}
        subtitle={currentPeriod ? `当前期间：${currentPeriod.name}` : undefined}
        badge={currentPeriod ? {
          text: currentPeriod.name,
          type: 'success'
        } : undefined}
        headerMode="default"
        className={styles.generateCard}
      >
        <div className={styles.generateContent}>
          <p className={styles.generateDescription}>
            {t('simplePayroll:generate.description')}
          </p>

          <Space direction="vertical" size="large" className="w-full">
            {/* Excel导入 - 主要操作 */}
            <Button
              type="primary"
              size="large"
              icon={<CloudUploadOutlined />}
              block
              onClick={() => setExcelModalVisible(true)}
              disabled={!currentPeriod}
              className={styles.primaryAction}
            >
              {t('simplePayroll:generate.excelImport')}
            </Button>

            <div className={styles.secondaryActions}>
              {/* 复制上月数据 */}
              <Button
                type="default"
                icon={<CopyOutlined />}
                block
                onClick={() => setCopyModalVisible(true)}
                disabled={!currentPeriod}
              >
                {t('simplePayroll:generate.copyPrevious')}
              </Button>

              {/* 手动创建 */}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                block
                onClick={() => message.info('手动创建功能')}
                disabled={!currentPeriod}
              >
                {t('simplePayroll:generate.manualCreate.button')}
              </Button>
            </div>

            {/* 下载模板 - 辅助功能 */}
            <div className={styles.helperActions}>
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => message.info('下载模板功能')}
                size="small"
              >
                {t('simplePayroll:generate.downloadTemplate')}
              </Button>
            </div>
          </Space>

          {!currentPeriod && (
            <Alert
              message={t('simplePayroll:generate.noPeriodSelected')}
              type="warning"
              showIcon
              className={styles.noPeriodAlert}
            />
          )}
        </div>
      </ModernCard>

      {/* 复制上月数据弹窗 */}
      <Modal
        title={t('simplePayroll:generate.copyModal.title')}
        open={copyModalVisible}
        onCancel={() => {
          setCopyModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {/* Modal 内容保持不变 */}
      </Modal>

      {/* 其他 Modal 保持不变 */}
    </>
  );
};

export default GeneratePayrollCardModern;