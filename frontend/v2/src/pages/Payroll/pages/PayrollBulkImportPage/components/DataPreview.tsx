import React, { useMemo } from 'react';
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
  Tag,
  Collapse,
  Badge,
  Progress,
  Tooltip
} from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { 
  ValidationResult,
  ImportData,
  ImportSettings,
  PayrollPeriod,
  ValidatedPayrollEntryData,
  BulkImportValidationResult,
  RawImportData,
  ImportModeConfig,
  FieldConfig
} from '../types/index';
import { OverwriteMode } from '../../../types/payrollTypes';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { Panel } = Collapse;

interface DataPreviewProps {
  validationResult: BulkImportValidationResult;
  importData: ImportData;
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId: number | null;
  importSettings: ImportSettings;
  processedData: ValidatedPayrollEntryData[];
  onSettingsChange: (settings: ImportSettings) => void;
  onExecuteImport: () => void;
  onBackToMapping: () => void;
  loading: boolean;
  progress?: {
    current: number;
    total: number;
    message: string;
    stage: string;
  };
  rawImportData: RawImportData;
  fieldMapping: Record<string, string>;
  modeConfig: ImportModeConfig;
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
  loading,
  progress,
  rawImportData,
  fieldMapping,
  modeConfig
}) => {
  const { t } = useTranslation('payroll');
  const successRate = Math.round((validationResult.valid / validationResult.total) * 100);
  
  // 添加调试信息
  console.log('🔍 DataPreview 验证结果:', {
    validationResult,
    overwriteMode: importSettings.overwriteMode
  });
  
  // 计算是否可以导入：有有效记录且没有阻止性错误
  const canImport = validationResult.valid > 0 && 
                   (!validationResult.errors || validationResult.errors.length === 0);
  
  // 计算导入按钮的状态文本
  const getImportButtonText = () => {
    if (validationResult.valid === 0) {
      return t('dataPreview.importButton.noValidRecords');
    }
    if (validationResult.errors && validationResult.errors.length > 0) {
      return t('dataPreview.importButton.hasErrors');
    }
    return t('dataPreview.importButton.startImport', { count: validationResult.valid });
  };
  
  console.log('🔍 DataPreview 按钮状态:', {
    canImport,
    buttonText: getImportButtonText(),
    validCount: validationResult.valid,
    errorCount: validationResult.errors?.length || 0,
    warningCount: validationResult.warnings || 0
  });

  // 筛选出有验证错误的记录
  const invalidRecords = validationResult.validatedData?.filter(record => 
    record.validationErrors && record.validationErrors.length > 0
  ) || [];

  // 渲染验证错误详情表格
  const renderValidationErrorsTable = () => {
    if (invalidRecords.length === 0) {
      return null;
    }

    const columns = [
      {
        title: t('dataPreview.errorsTable.columns.index'),
        dataIndex: 'originalIndex',
        key: 'index',
        width: 60,
        render: (index: number) => index + 1,
      },
      {
        title: t('dataPreview.errorsTable.columns.employeeInfo'),
        key: 'employee',
        width: 200,
        render: (record: any) => (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.employee_full_name || record.employee_name || t('common.unknownEmployee', { ns: 'common' })}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.id_number && `${t('common.idNumber', { ns: 'common' })}: ${record.id_number}`}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.employee_code && `${t('common.employeeCode', { ns: 'common' })}: ${record.employee_code}`}
            </div>
          </div>
        ),
      },
      {
        title: t('dataPreview.errorsTable.columns.grossPay'),
        dataIndex: 'gross_pay',
        key: 'gross_pay',
        width: 100,
        align: 'right' as const,
        render: (value: number) => `¥${(value || 0).toFixed(2)}`,
      },
      {
        title: t('dataPreview.errorsTable.columns.netPay'),
        dataIndex: 'net_pay',
        key: 'net_pay',
        width: 100,
        align: 'right' as const,
        render: (value: number) => `¥${(value || 0).toFixed(2)}`,
      },
      {
        title: t('dataPreview.errorsTable.columns.validationErrors'),
        dataIndex: 'validationErrors',
        key: 'validationErrors',
        render: (errors: string[]) => (
          <div>
            <Badge count={errors.length} style={{ marginBottom: 8 }}>
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                {t('dataPreview.errorsTable.errorCount', { count: errors.length })}
              </Tag>
            </Badge>
            <div style={{ marginTop: 8 }}>
              {errors.map((error, index) => (
                <div key={index} style={{ 
                  marginBottom: 4, 
                  fontSize: '12px',
                  color: '#cf1322',
                  padding: '2px 6px',
                  backgroundColor: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: '4px'
                }}>
                  {error}
                </div>
              ))}
            </div>
          </div>
        ),
      }
    ];

    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: '#cf1322' }} />
            <span>{t('dataPreview.errorsTable.title', { count: invalidRecords.length })}</span>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Alert
          type="error"
          showIcon
          message={t('dataPreview.errorsTable.alert.message')}
          description={t('dataPreview.errorsTable.alert.description', { count: invalidRecords.length })}
          style={{ marginBottom: 16 }}
        />
        
        <Table
          dataSource={invalidRecords}
          columns={columns}
          rowKey={(record) => `error-${record.originalIndex || record._clientId}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              t('common.table.pagination', { ns: 'common', rangeStart: range[0], rangeEnd: range[1], total: total })
          }}
          size="small"
          scroll={{ x: 800 }}
          bordered
          rowClassName={(record) => 'error-record-row'}
        />
        
        {/* 内联样式 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .error-record-row {
              background-color: #fff2f0 !important;
            }
            .error-record-row:hover {
              background-color: #ffece6 !important;
            }
          `
        }} />
      </Card>
    );
  };

  // 辅助函数：获取覆写模式的显示文本
  const getOverwriteModeText = (mode: OverwriteMode): string => {
    switch (mode) {
      case OverwriteMode.NONE:
        return t('dataPreview.overwriteModes.none');
      case OverwriteMode.ALL:
        return t('dataPreview.overwriteModes.all');
      case OverwriteMode.EXISTING_ONLY:
        return t('dataPreview.overwriteModes.existingOnly');
      case OverwriteMode.INCREMENTAL:
        return t('dataPreview.overwriteModes.incremental');
      case OverwriteMode.FULL_MONTH:
        return t('dataPreview.overwriteModes.fullMonth');
      case OverwriteMode.SOCIAL_INSURANCE_ONLY:
        return t('dataPreview.overwriteModes.socialInsuranceOnly');
      case OverwriteMode.TAX_ONLY:
        return t('dataPreview.overwriteModes.taxOnly');
      case OverwriteMode.ADJUSTMENTS_ONLY:
        return t('dataPreview.overwriteModes.adjustmentsOnly');
      default:
        return t('common.unknown', { ns: 'common' });
    }
  };

  // 辅助函数：获取覆写模式的说明
  const getOverwriteModeDescription = (mode: OverwriteMode): string => {
    switch (mode) {
      case OverwriteMode.NONE:
        return t('dataPreview.overwriteModeDescriptions.none');
      case OverwriteMode.ALL:
        return t('dataPreview.overwriteModeDescriptions.all');
      case OverwriteMode.EXISTING_ONLY:
        return t('dataPreview.overwriteModeDescriptions.existingOnly');
      case OverwriteMode.INCREMENTAL:
        return t('dataPreview.overwriteModeDescriptions.incremental');
      case OverwriteMode.FULL_MONTH:
        return t('dataPreview.overwriteModeDescriptions.fullMonth');
      case OverwriteMode.SOCIAL_INSURANCE_ONLY:
        return t('dataPreview.overwriteModeDescriptions.socialInsuranceOnly');
      case OverwriteMode.TAX_ONLY:
        return t('dataPreview.overwriteModeDescriptions.taxOnly');
      case OverwriteMode.ADJUSTMENTS_ONLY:
        return t('dataPreview.overwriteModeDescriptions.adjustmentsOnly');
      default:
        return t('common.unknown', { ns: 'common' });
    }
  };

  const { rows, headers } = rawImportData;

  const { processedData: rawProcessedData, columns: rawColumns, errorCount } = useMemo(() => {
    const invertedMapping: Record<string, string> = {};
    for (const key in fieldMapping) {
      invertedMapping[fieldMapping[key]] = key;
    }

    const requiredFields = modeConfig.requiredFields;

    const data = rows.map((row, rowIndex) => {
      const rowData: Record<string, any> = { key: `row-${rowIndex}` };
      const errors: { field: string, message: string }[] = [];
      
      headers.forEach((header, colIndex) => {
        const systemKey = invertedMapping[header];
        if (systemKey) {
          rowData[systemKey] = row[colIndex];
        }
      });

      requiredFields.forEach(field => {
        if (rowData[field.key] === null || rowData[field.key] === undefined || String(rowData[field.key]).trim() === '') {
          errors.push({ field: field.key, message: `${field.name} 是必填项` });
        }
      });
      
      rowData._errors = errors;
      return rowData;
    });

    const allSystemFields = [...modeConfig.requiredFields, ...modeConfig.optionalFields];
    const tableColumns = Object.keys(invertedMapping).map(excelHeader => {
      const systemKey = invertedMapping[excelHeader];
      const fieldConfig = allSystemFields.find(f => f.key === systemKey);
      return {
        title: fieldConfig?.name || systemKey,
        dataIndex: systemKey,
        key: systemKey,
        render: (text: any, record: any) => {
          const fieldError = record._errors.find((e: any) => e.field === systemKey);
          const cellStyle = fieldError ? { color: 'red', border: '1px solid red' } : {};
          return <span style={cellStyle}>{text}</span>;
        },
      };
    });

    tableColumns.push({
      title: '验证状态',
      key: 'status',
      dataIndex: 'status',
      render: (_: any, record: any) => {
        if (record._errors.length > 0) {
          return (
            <Tooltip title={record._errors.map((e: any) => e.message).join(', ')}>
              <Tag color="red">发现 {record._errors.length} 个错误</Tag>
            </Tooltip>
          );
        }
        return <Tag color="green">通过</Tag>;
      },
    });

    const totalErrors = data.filter(d => d._errors.length > 0).length;

    return { processedData: data, columns: tableColumns, errorCount: totalErrors };
  }, [rows, headers, fieldMapping, modeConfig]);

  // 根据导入模式配置决定显示哪些列
  const dynamicColumns = useMemo(() => {
    // 基础列定义
    const baseColumns: any[] = [
      {
        title: t('dataPreview.previewTable.columns.index'),
        dataIndex: 'originalIndex',
        key: 'index',
        width: 60,
        fixed: 'left',
        render: (index: number) => index + 1
      },
      {
        title: t('dataPreview.previewTable.columns.employeeInfo'),
        key: 'employee',
        width: 200,
        fixed: 'left',
        render: (record: ValidatedPayrollEntryData) => (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.employee_full_name || record.employee_name || t('common.unknownEmployee', { ns: 'common' })}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.id_number && `${t('common.idNumber', { ns: 'common' })}: ${record.id_number}`}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.employee_code && `${t('common.employeeCode', { ns: 'common' })}: ${record.employee_code}`}
            </div>
          </div>
        )
      },
      {
        title: t('dataPreview.previewTable.columns.validationStatus'),
        key: 'validation',
        width: 120,
        fixed: 'left',
        render: (record: ValidatedPayrollEntryData) => {
          if (record.validationErrors && record.validationErrors.length > 0) {
            return (
              <Tooltip title={record.validationErrors.join(', ')}>
                <Tag color="red" icon={<ExclamationCircleOutlined />}>
                  {t('dataPreview.validationStatus.error')}
                </Tag>
              </Tooltip>
            );
          }
          if (record.validationWarnings && record.validationWarnings.length > 0) {
            return (
              <Tooltip title={record.validationWarnings.join(', ')}>
                <Tag color="warning" icon={<WarningOutlined />}>
                {t('dataPreview.validationStatus.warning')}
                </Tag>
              </Tooltip>
            );
          }
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {t('dataPreview.validationStatus.valid')}
            </Tag>
          );
        }
      }
    ];

    // 从 fieldMapping 和 modeConfig 动态生成列
    const mappedColumns = Object.keys(fieldMapping)
      .map(fileField => {
        const payrollField = fieldMapping[fileField];
        const fieldConfig = modeConfig.fields.find(f => f.key === payrollField) as FieldConfig;
        
        // 如果字段未在配置中定义，或者被标记为内部专用，则不显示
        if (!fieldConfig || fieldConfig.internal) {
          return null;
        }

        return {
          title: fieldConfig.label ? t(fieldConfig.label, { ns: 'payroll' }) : fieldConfig.name,
          dataIndex: payrollField,
          key: payrollField,
          width: 150,
          align: fieldConfig.type === 'number' ? 'right' : 'left',
          render: (value: any, record: ValidatedPayrollEntryData) => {
            const originalValue = record.originalData?.[fileField];
            
            // 如果转换后的值和原始值不同，则并排显示
            if (value !== undefined && value !== originalValue) {
              return (
                <Tooltip title={`${t('dataPreview.originalValue')}: ${originalValue}`}>
                  <span>{value}</span>
                </Tooltip>
              );
            }
            
            // 对于金额，格式化显示
            if (fieldConfig.type === 'number' && typeof value === 'number') {
              return `¥${value.toFixed(2)}`;
            }
            
            return value;
          }
        };
      })
      .filter(Boolean); // 过滤掉 null

    return [...baseColumns, ...mappedColumns];
  }, [fieldMapping, modeConfig, t]);

  const selectedPeriod = payrollPeriods.find(p => p.id === selectedPeriodId);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 验证结果统计 */}
      <Card title={t('dataPreview.summaryCard.title')}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title={t('dataPreview.summaryCard.selectedPeriod')}
              value={selectedPeriod ? selectedPeriod.name : t('common.none', { ns: 'common' })}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={t('dataPreview.summaryCard.totalRecords')}
              value={validationResult.total}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={t('dataPreview.summaryCard.totalAmount')}
              value={`¥ ${(importData.totalAmount || 0).toFixed(2)}`}
            />
          </Col>
          <Col span={24}>
            <Text>{t('dataPreview.summaryCard.validationProgress')}:</Text>
            <Progress percent={successRate} status={successRate < 100 ? "exception" : "success"} />
          </Col>
        </Row>
      </Card>

      {/* 验证错误详情表格 */}
      {renderValidationErrorsTable()}

      {/* 数据样本预览 */}
      <Card title={t('dataPreview.dataPreviewCard.title')} extra={<Text>{t('dataPreview.dataPreviewCard.subtitle', { count: validationResult.valid })}</Text>}>
        <Alert
          type="info"
          showIcon
          message={t('dataPreview.dataPreviewCard.alert.message')}
          description={t('dataPreview.dataPreviewCard.alert.description')}
          style={{ marginBottom: 16 }}
        />
        <Table
          columns={dynamicColumns}
          dataSource={processedData}
          rowKey={(record) => `preview-${record.originalIndex || record._clientId}`}
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => t('common.table.pagination', { ns: 'common', rangeStart: range[0], rangeEnd: range[1], total: total })
          }}
          size="small"
        />
      </Card>

      {/* 导入设置 */}
      <Card title={t('dataPreview.settingsCard.title')}>
        <Form layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label={t('dataPreview.settingsCard.overwriteMode.label')} tooltip={getOverwriteModeDescription(importSettings.overwriteMode)}>
                <Switch
                  checkedChildren={getOverwriteModeText(importSettings.overwriteMode)}
                  unCheckedChildren={getOverwriteModeText(OverwriteMode.NONE)}
                  checked={importSettings.overwriteMode !== OverwriteMode.NONE}
                  onChange={(checked) => {
                    const newMode = checked ? OverwriteMode.ALL : OverwriteMode.NONE;
                    onSettingsChange({ ...importSettings, overwriteMode: newMode });
                    console.log('模式切换:', { newMode }); // 调试日志
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('dataPreview.settingsCard.skipInvalidRecords.label')}>
                <Switch 
                  checked={importSettings.skipInvalidRecords}
                  onChange={(checked) => onSettingsChange({...importSettings, skipInvalidRecords: checked})}
                /> 跳过无效记录
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('dataPreview.settingsCard.sendNotification.label')}>
                <Switch 
                  checked={importSettings.sendNotification}
                  onChange={(checked) => onSettingsChange({...importSettings, sendNotification: checked})}
                /> 发送完成通知
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button onClick={onBackToMapping} disabled={loading}>
              {t('common.actions.backToMapping', { ns: 'common' })}
            </Button>
            <Button 
              type="primary" 
              size="large" 
              onClick={onExecuteImport}
              loading={loading}
              disabled={!canImport || loading}
              icon={<CheckCircleOutlined />}
            >
              {loading ? (progress ? `${progress.stage}: ${progress.message}` : t('common.actions.importing', { ns: 'common' })) : getImportButtonText()}
            </Button>
          </Space>
          
          {/* 导入进度条 */}
          {loading && progress && (
            <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
              <Progress 
                percent={progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}
                status={progress.stage === 'completed' ? 'success' : 'active'}
                format={(percent) => `${progress.current}/${progress.total} (${percent}%)`}
                strokeColor={{
                  '0%': progress.stage === 'validating' ? '#1890ff' : '#52c41a',
                  '100%': progress.stage === 'validating' ? '#40a9ff' : '#73d13d',
                }}
              />
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: '14px', color: '#666' }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {progress.message}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {progress.stage === 'validating' && '正在验证数据完整性和员工信息...'}
                  {progress.stage === 'importing' && '正在写入数据库，请耐心等待...'}
                  {progress.stage === 'completed' && '处理完成！'}
                  {!progress.stage && '准备中...'}
                </div>
                {progress.total > 100 && (
                  <div style={{ fontSize: '11px', color: '#ccc', marginTop: 4 }}>
                    大批量数据处理可能需要几分钟时间
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 操作提示 */}
          {validationResult.invalid > 0 && importSettings.overwriteMode === OverwriteMode.NONE && (
            <Alert
              type="info"
              showIcon
              message={t('dataPreview.importButton.info.message')}
              description={t('dataPreview.importButton.info.description')}
              style={{ textAlign: 'left' }}
            />
          )}
          
          {validationResult.warnings > 0 && importSettings.overwriteMode !== OverwriteMode.NONE && (
            <Alert
              type="success"
              showIcon
              message={t('dataPreview.importButton.success.message')}
              description={t('dataPreview.importButton.success.description', { count: validationResult.warnings })}
              style={{ textAlign: 'left' }}
            />
          )}
          
          {validationResult.errors && validationResult.errors.length > 0 && (
            <Alert
              type="error"
              showIcon
              message={t('dataPreview.importButton.error.message')}
              description={t('dataPreview.importButton.error.description')}
              style={{ textAlign: 'left' }}
            />
          )}
        </Space>
      </div>
    </Space>
  );
};

export default DataPreview; 