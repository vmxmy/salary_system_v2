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
  const [excelModalVisible, setExcelModalVisible] = useState(false);
  const [sourcePeriods, setSourcePeriods] = useState<PayrollPeriodResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 获取可复制的期间列表
  const fetchSourcePeriods = async () => {
    if (!currentPeriod) return;
    
    try {
      setLoading(true);
      const periods = await simplePayrollApi.getPayrollPeriods();
      // 过滤掉当前期间，只显示有数据的历史期间
      const availablePeriods = periods.filter(p => 
        p.id !== currentPeriod.id && 
        p.status !== 'empty' &&
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
      await simplePayrollApi.copyPreviousPayroll({
        target_period_id: currentPeriod.id,
        source_period_id: values.source_period_id,
        description: values.description || `复制 ${values.source_period_name} 数据`
      });
      
      message.success(t('simplePayroll:messages.copySuccess'));
      setCopyModalVisible(false);
      form.resetFields();
      onRefresh();
    } catch (error: any) {
      message.error(error.message || t('simplePayroll:errors.copyFailed'));
    } finally {
      setLoading(false);
    }
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
      <Card 
        title={
          <Space>
            <PlusOutlined />
            {t('simplePayroll:generate.title')}
          </Space>
        }
        className="simple-payroll-card"
        extra={
          currentPeriod && (
            <span className="period-badge">
              {currentPeriod.name}
            </span>
          )
        }
      >
        <div className="card-content">
          <p className="card-description">
            {t('simplePayroll:generate.description')}
          </p>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
              style={{ padding: 0 }}
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
                          status: period.status
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
    </>
  );
};

export default GeneratePayrollCard; 