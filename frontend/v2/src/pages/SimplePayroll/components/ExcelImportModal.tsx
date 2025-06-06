import React, { useState, useRef } from 'react';
import {
  Modal,
  Upload,
  Button,
  Steps,
  Table,
  Alert,
  Space,
  Progress,
  Typography,
  Divider,
  Tag,
  message,
  Spin
} from 'antd';
import {
  CloudUploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { PayrollGenerationRequest } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';

const { Step } = Steps;
const { Title, Text } = Typography;
const { Dragger } = Upload;

interface ExcelImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  periodId: number;
  periodName: string;
}

interface ImportData {
  employee_code: string;
  employee_name: string;
  department: string;
  basic_salary: number;
  position_salary: number;
  overtime_pay: number;
  bonus: number;
  allowances: number;
  social_security: number;
  personal_tax: number;
  other_deductions: number;
  gross_pay: number;
  net_pay: number;
  [key: string]: any;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data: ImportData[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  periodId,
  periodName
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
  const [previewData, setPreviewData] = useState<ImportData[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<any>(null);

  // 重置状态
  const resetState = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setPreviewData([]);
    setValidationResult(null);
    setImportProgress(0);
    setLoading(false);
  };

  // 处理文件上传
  const handleFileUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess: onUploadSuccess, onError } = options;
    
    try {
      setLoading(true);
      
      // 模拟文件解析
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟解析结果
      const mockData: ImportData[] = [
        {
          employee_code: 'EMP001',
          employee_name: '张三',
          department: '技术部',
          basic_salary: 8000,
          position_salary: 2000,
          overtime_pay: 500,
          bonus: 1000,
          allowances: 300,
          social_security: 800,
          personal_tax: 200,
          other_deductions: 100,
          gross_pay: 11800,
          net_pay: 10700
        },
        {
          employee_code: 'EMP002',
          employee_name: '李四',
          department: '销售部',
          basic_salary: 6000,
          position_salary: 1500,
          overtime_pay: 300,
          bonus: 2000,
          allowances: 200,
          social_security: 600,
          personal_tax: 150,
          other_deductions: 50,
          gross_pay: 10000,
          net_pay: 9200
        }
      ];

      setPreviewData(mockData);
      setUploadedFile(file as UploadFile);
      setCurrentStep(1);
      
      // 自动验证数据
      validateData(mockData);
      
      onUploadSuccess?.(file);
    } catch (error) {
      onError?.(error as Error);
      message.error(t('simplePayroll:excel.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 验证数据
  const validateData = (data: ImportData[]) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    data.forEach((row, index) => {
      // 必填字段检查
      if (!row.employee_code) {
        errors.push(t('simplePayroll:excel.validation.missingEmployeeCode', { row: index + 1 }));
      }
      if (!row.employee_name) {
        errors.push(t('simplePayroll:excel.validation.missingEmployeeName', { row: index + 1 }));
      }

      // 数值检查
      if (row.basic_salary < 0) {
        errors.push(t('simplePayroll:excel.validation.negativeBasicSalary', { row: index + 1 }));
      }

      // 计算检查
      const calculatedGross = row.basic_salary + row.position_salary + row.overtime_pay + row.bonus + row.allowances;
      if (Math.abs(calculatedGross - row.gross_pay) > 0.01) {
        warnings.push(t('simplePayroll:excel.validation.grossPayMismatch', { row: index + 1 }));
      }

      const calculatedNet = row.gross_pay - row.social_security - row.personal_tax - row.other_deductions;
      if (Math.abs(calculatedNet - row.net_pay) > 0.01) {
        warnings.push(t('simplePayroll:excel.validation.netPayMismatch', { row: index + 1 }));
      }
    });

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      data
    };

    setValidationResult(result);
    setCurrentStep(2);
  };

  // 执行导入
  const handleImport = async () => {
    if (!validationResult || !validationResult.valid) {
      message.error(t('simplePayroll:excel.validationRequired'));
      return;
    }

    try {
      setLoading(true);
      setCurrentStep(3);

      // 模拟导入进度
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const request: PayrollGenerationRequest = {
        period_id: periodId,
        generation_type: 'import',
        source_data: {
          file_data: validationResult.data
        },
        description: `Excel导入 ${periodName} 工资数据`
      };

      await simplePayrollApi.generatePayroll(request);
      
      message.success(t('simplePayroll:excel.importSuccess'));
      onSuccess();
      handleModalClose();
    } catch (error: any) {
      message.error(error.message || t('simplePayroll:excel.importFailed'));
      setCurrentStep(2); // 回到验证步骤
    } finally {
      setLoading(false);
    }
  };

  // 关闭弹窗
  const handleModalClose = () => {
    resetState();
    onCancel();
  };

  // 下载模板
  const downloadTemplate = () => {
    // 模拟下载Excel模板
    const link = document.createElement('a');
    link.href = '/templates/payroll_import_template.xlsx';
    link.download = 'payroll_import_template.xlsx';
    link.click();
    message.info(t('simplePayroll:excel.templateDownloadStarted'));
  };

  // 表格列定义
  const tableColumns = [
    {
      title: t('simplePayroll:excel.columns.employeeCode'),
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 100,
    },
    {
      title: t('simplePayroll:excel.columns.employeeName'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120,
    },
    {
      title: t('simplePayroll:excel.columns.department'),
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: t('simplePayroll:excel.columns.basicSalary'),
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      render: (value: number) => `¥${value.toFixed(2)}`,
      width: 100,
    },
    {
      title: t('simplePayroll:excel.columns.grossPay'),
      dataIndex: 'gross_pay',
      key: 'gross_pay',
      render: (value: number) => `¥${value.toFixed(2)}`,
      width: 100,
    },
    {
      title: t('simplePayroll:excel.columns.netPay'),
      dataIndex: 'net_pay',
      key: 'net_pay',
      render: (value: number) => `¥${value.toFixed(2)}`,
      width: 100,
    },
  ];

  return (
    <Modal
      title={t('simplePayroll:excel.title')}
      open={visible}
      onCancel={handleModalClose}
      width={1000}
      footer={null}
      maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
        {/* 步骤指示器 */}
        <Steps current={currentStep} style={{ marginBottom: '30px' }}>
          <Step title={t('simplePayroll:excel.steps.upload')} icon={<CloudUploadOutlined />} />
          <Step title={t('simplePayroll:excel.steps.preview')} icon={<EyeOutlined />} />
          <Step title={t('simplePayroll:excel.steps.validate')} icon={<CheckCircleOutlined />} />
          <Step title={t('simplePayroll:excel.steps.import')} icon={<FileExcelOutlined />} />
        </Steps>

        {/* 步骤 1: 文件上传 */}
        {currentStep === 0 && (
          <div>
            <Alert
              type="info"
              message={t('simplePayroll:excel.uploadTips.title')}
              description={
                <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                  <li>{t('simplePayroll:excel.uploadTips.format')}</li>
                  <li>{t('simplePayroll:excel.uploadTips.encoding')}</li>
                  <li>{t('simplePayroll:excel.uploadTips.size')}</li>
                </ul>
              }
              style={{ marginBottom: '20px' }}
            />

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={downloadTemplate}
              >
                {t('simplePayroll:excel.downloadTemplate')}
              </Button>

              <Dragger
                ref={fileInputRef}
                customRequest={handleFileUpload}
                accept=".xlsx,.xls"
                maxCount={1}
                showUploadList={false}
                disabled={loading}
              >
                <Spin spinning={loading}>
                  <div style={{ padding: '40px' }}>
                    <CloudUploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    <Title level={4} style={{ marginTop: '16px' }}>
                      {t('simplePayroll:excel.dragUpload')}
                    </Title>
                    <Text type="secondary">
                      {t('simplePayroll:excel.uploadHint')}
                    </Text>
                  </div>
                </Spin>
              </Dragger>
            </Space>
          </div>
        )}

        {/* 步骤 2: 数据预览 */}
        {currentStep === 1 && (
          <div>
            <Alert
              type="success"
              message={t('simplePayroll:excel.uploadSuccess')}
              description={t('simplePayroll:excel.previewDescription', { 
                count: previewData.length,
                filename: uploadedFile?.name 
              })}
              style={{ marginBottom: '20px' }}
            />

            <Table
              columns={tableColumns}
              dataSource={previewData}
              rowKey="employee_code"
              pagination={{ pageSize: 5, showSizeChanger: false }}
              scroll={{ x: 800 }}
              size="small"
            />

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>
                  {t('common:back')}
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => validateData(previewData)}
                >
                  {t('simplePayroll:excel.continueValidation')}
                </Button>
              </Space>
            </div>
          </div>
        )}

        {/* 步骤 3: 数据验证 */}
        {currentStep === 2 && validationResult && (
          <div>
            {validationResult.errors.length > 0 && (
              <Alert
                type="error"
                message={t('simplePayroll:excel.validationErrors', { count: validationResult.errors.length })}
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                }
                style={{ marginBottom: '16px' }}
              />
            )}

            {validationResult.warnings.length > 0 && (
              <Alert
                type="warning"
                message={t('simplePayroll:excel.validationWarnings', { count: validationResult.warnings.length })}
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                }
                style={{ marginBottom: '16px' }}
              />
            )}

            {validationResult.valid && (
              <Alert
                type="success"
                message={t('simplePayroll:excel.validationPassed')}
                description={t('simplePayroll:excel.readyToImport', { count: validationResult.data.length })}
                style={{ marginBottom: '16px' }}
              />
            )}

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <Space>
                <Button onClick={() => setCurrentStep(1)}>
                  {t('common:back')}
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleImport}
                  disabled={!validationResult.valid}
                >
                  {t('simplePayroll:excel.startImport')}
                </Button>
              </Space>
            </div>
          </div>
        )}

        {/* 步骤 4: 导入进度 */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin spinning={loading} size="large">
              <FileExcelOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '20px' }} />
              <Title level={3}>{t('simplePayroll:excel.importing')}</Title>
              <Progress 
                percent={importProgress}
                status={importProgress === 100 ? 'success' : 'active'}
                style={{ marginTop: '20px' }}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: '16px' }}>
                {t('simplePayroll:excel.importProgress', { progress: importProgress })}
              </Text>
            </Spin>
          </div>
        )}
      </div>
    </Modal>
  );
}; 