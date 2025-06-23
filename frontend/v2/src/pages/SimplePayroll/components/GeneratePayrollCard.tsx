import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Modal, 
  Select, 
  Input, 
  message,
  Spin,
  Alert,
  Form
} from 'antd';
import { 
  PlusOutlined, 
  CopyOutlined, 
  CloudUploadOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollPeriodResponse, PayrollGenerationRequest } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';
import { ExcelImportModal } from './ExcelImportModal';
import SmartCopyConfirmModal from './SmartCopyConfirmModal';
import styles from '../styles/SimplePayrollStyles.module.less';

const { Text } = Typography;

interface GeneratePayrollCardProps {
  currentPeriod?: PayrollPeriodResponse;
  onRefresh: () => void;
}

const GeneratePayrollCard: React.FC<GeneratePayrollCardProps> = ({
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

  // 获取可复制的期间列表
  const fetchSourcePeriods = async () => {
    if (!currentPeriod) return;
    
    try {
      setLoading(true);
      const response = await simplePayrollApi.getPayrollPeriods({});
      // 过滤掉当前期间，只显示有数据的历史期间
      const availablePeriods = response.data.filter(p => 
        p.id !== currentPeriod.id && 
        p.status_name !== 'empty' &&
        p.runs_count > 0
      );
      setSourcePeriods(availablePeriods);
    } catch (error) {
      message.error(t('simplePayroll:errors.fetchSourcePeriods'));
    } finally {
      setLoading(false);
    }
  };

  // 处理复制上月数据
  const handleCopyPrevious = async (values: any) => {
    if (!currentPeriod) return;

    try {
      setLoading(true);
      
      // 保存复制参数，准备可能的确认流程
      const copyParams = {
        target_period_id: currentPeriod.id,
        source_period_id: values.source_period_id,
        description: values.description || `复制 ${values.source_period_name} 数据`
      };
      setPendingCopyParams({ ...copyParams, source_period_name: values.source_period_name });

      await simplePayrollApi.copyPreviousPayroll(copyParams);
      
      message.success(t('simplePayroll:messages.copySuccess'));
      setCopyModalVisible(false);
      form.resetFields();
      onRefresh();
    } catch (error: any) {
      console.log('🚨 [GeneratePayrollCard] 复制过程中遇到错误:', error);
      
      // 检查是否是需要确认的情况
      if (error.response?.status === 409 && error.response?.data?.error?.code === 'CONFIRMATION_REQUIRED') {
        console.log('🔍 [GeneratePayrollCard] 检测到需要用户确认的情况');
        setExistingDataInfo(error.response.data.error.existing_data);
        setCopyModalVisible(false);
        setSmartConfirmVisible(true);
        return;
      }
      
      // 普通错误处理
      console.error('❌ [GeneratePayrollCard] 复制失败:', error);
      message.error(error.response?.data?.error?.message || error.message || t('simplePayroll:errors.copyFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 处理智能确认结果
  const handleSmartConfirm = async (forceOverwrite: boolean) => {
    if (!pendingCopyParams) return;

    try {
      setLoading(true);
      console.log('🎯 [GeneratePayrollCard] 执行确认后的复制:', { 
        ...pendingCopyParams, 
        force_overwrite: forceOverwrite 
      });

      await simplePayrollApi.copyPreviousPayroll({
        ...pendingCopyParams,
        force_overwrite: forceOverwrite
      });
      
      message.success(
        forceOverwrite 
          ? '复制并覆盖薪资配置成功！' 
          : '复制并创建新版本成功！'
      );
      
      setSmartConfirmVisible(false);
      setPendingCopyParams(null);
      setExistingDataInfo(null);
      form.resetFields();
      onRefresh();
    } catch (error: any) {
      console.error('❌ [GeneratePayrollCard] 确认后复制失败:', error);
      message.error(error.response?.data?.error?.message || error.message || '复制操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理智能确认取消
  const handleSmartConfirmCancel = () => {
    setSmartConfirmVisible(false);
    setPendingCopyParams(null);
    setExistingDataInfo(null);
    // 重新打开原有的复制对话框
    setCopyModalVisible(true);
  };

  // 处理手动创建
  const handleManualCreate = () => {
    if (!currentPeriod) return;

    Modal.confirm({
      title: t('simplePayroll:generate.manualCreate.title'),
      content: t('simplePayroll:generate.manualCreate.content'),
      icon: <ExclamationCircleOutlined />,
      okText: t('common:confirm'),
      cancelText: t('common:cancel'),
      onOk: async () => {
        try {
          setLoading(true);
          const request: PayrollGenerationRequest = {
            period_id: currentPeriod.id,
            generation_type: 'manual',
            source_data: {
              initial_entries: []
            },
            description: `手动创建 ${currentPeriod.name} 工资数据`
          };
          
          await simplePayrollApi.generatePayroll(request);
          message.success(t('simplePayroll:messages.createSuccess'));
          onRefresh();
        } catch (error: any) {
          message.error(error.message || t('simplePayroll:errors.createFailed'));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 打开复制对话框
  const openCopyModal = () => {
    setCopyModalVisible(true);
    fetchSourcePeriods();
  };

  // 下载模板
  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/payroll_import_template.xlsx';
    link.download = 'payroll_import_template.xlsx';
    link.click();
    message.info(t('simplePayroll:excel.templateDownloadStarted'));
  };

  return (
    <>
      <Card className={`${styles.baseCard} ${styles.actionCard}`}>
        <div className={`${styles.baseHeader} ${styles.actionHeader}`}>
          <div className={styles.headerTitle}>
            <span className={`${styles.headerIcon} ${styles.purple}`}>
              <PlusOutlined />
            </span>
            <span className={styles.headerText}>
              {t('simplePayroll:generate.title')}
              {currentPeriod && (
                <span className={styles.headerSubtext}>
                  当前期间：{currentPeriod.name}
                </span>
              )}
            </span>
          </div>
          {currentPeriod && (
            <div className={styles.headerExtra}>
              <span className={`${styles.headerBadge} ${styles.success}`}>
                {currentPeriod.name}
              </span>
            </div>
          )}
        </div>
        <div className={styles.actionCardContent}>
          <p className={styles.actionDescription}>
            {t('simplePayroll:generate.description')}
          </p>

          <Space direction="vertical" size="middle" className="w-full">
            {/* Excel导入 */}
            <Button
              type="primary"
              size="large"
              icon={<CloudUploadOutlined />}
              block
              onClick={() => setExcelModalVisible(true)}
              disabled={!currentPeriod}
            >
              {t('simplePayroll:generate.excelImport')}
            </Button>

            {/* 复制上月数据 */}
            <Button
              type="default"
              size="large"
              icon={<CopyOutlined />}
              block
              onClick={openCopyModal}
              disabled={!currentPeriod}
            >
              {t('simplePayroll:generate.copyPrevious')}
            </Button>

            {/* 手动创建 */}
            <Button
              type="dashed"
              size="large"
              icon={<PlusOutlined />}
              block
              onClick={handleManualCreate}
              disabled={!currentPeriod}
            >
              {t('simplePayroll:generate.manualCreate.button')}
            </Button>

            {/* 下载模板 */}
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={downloadTemplate}
              className="p-0"
            >
              {t('simplePayroll:generate.downloadTemplate')}
            </Button>
          </Space>

          {!currentPeriod && (
            <div className="no-period-tip">
              {t('simplePayroll:generate.noPeriodSelected')}
            </div>
          )}
        </div>
      </Card>

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
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCopyPrevious}
          >
            <Form.Item
              name="source_period_id"
              label={t('simplePayroll:generate.copyModal.sourcePeriod')}
              rules={[{ required: true, message: t('simplePayroll:generate.copyModal.sourcePeriodRequired') }]}
            >
              <Select
                placeholder={t('simplePayroll:generate.copyModal.sourcePeriodPlaceholder')}
                showSearch
                optionFilterProp="label"
                onChange={(value, option: any) => {
                  form.setFieldsValue({ source_period_name: option.label });
                }}
              >
                {sourcePeriods.map(period => (
                  <Select.Option 
                    key={period.id} 
                    value={period.id}
                    label={period.name}
                  >
                    <div>
                      <div>{period.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {t('simplePayroll:generate.copyModal.periodInfo', {
                          runs: period.runs_count,
                          status: period.status_name
                        })}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="source_period_name" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label={t('simplePayroll:generate.copyModal.description')}
            >
              <Input.TextArea
                rows={3}
                placeholder={t('simplePayroll:generate.copyModal.descriptionPlaceholder')}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button 
                  onClick={() => {
                    setCopyModalVisible(false);
                    form.resetFields();
                  }}
                >
                  {t('common:cancel')}
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                >
                  {t('simplePayroll:generate.copyModal.confirm')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* Excel导入弹窗 */}
      {currentPeriod && (
        <ExcelImportModal
          visible={excelModalVisible}
          onCancel={() => setExcelModalVisible(false)}
          onSuccess={() => {
            setExcelModalVisible(false);
            onRefresh();
          }}
          periodId={currentPeriod.id}
          periodName={currentPeriod.name}
        />
      )}

      {/* 智能复制确认对话框 */}
      {existingDataInfo && pendingCopyParams && (
        <SmartCopyConfirmModal
          visible={smartConfirmVisible}
          onCancel={handleSmartConfirmCancel}
          onConfirm={handleSmartConfirm}
          existingData={existingDataInfo}
          sourcePeriodName={pendingCopyParams.source_period_name}
          loading={loading}
        />
      )}
    </>
  );
};

export default GeneratePayrollCard; 