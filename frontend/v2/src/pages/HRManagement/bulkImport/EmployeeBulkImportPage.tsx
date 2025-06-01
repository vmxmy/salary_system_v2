import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Alert,
  Typography,
  Table,
  Space,
  Steps,
  Card,
  Input,
  App,
  Tabs,
  Switch,
  Tooltip,
  Result,
  Spin,
  Form
} from 'antd';
import { FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, UserAddOutlined, PlaySquareOutlined, TableOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../../services/employeeService';
import styles from './EmployeeBulkImportPage.module.less';
import type { CreateEmployeePayload } from '../../HRManagement/types';
import { nanoid } from 'nanoid';
import TableTextConverter from './TableTextConverter';

export interface RawEmployeeData extends CreateEmployeePayload {
  _clientId?: string;
  validationErrors?: string[];
  originalIndex?: number;
  _fullname?: string;
}

export interface ValidatedEmployeeData extends RawEmployeeData {}

interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: { record: any; error: string }[];
  createdEmployees?: any[];
}

interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const EmployeeBulkImportPage: React.FC = () => {
  const { t, ready } = useTranslation(['hr', 'common']);
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const textAreaRef = useRef<any>(null);
  const [parsedData, setParsedData] = useState<ValidatedEmployeeData[] | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({ totalRecords: 0, validRecords: 0, invalidRecords: 0 });
  const [activeTab, setActiveTab] = useState<string>('table');
  const [overwriteMode, setOverwriteMode] = useState<boolean>(false);
  const [showDetailedErrors, setShowDetailedErrors] = useState<boolean>(false);

  useEffect(() => {
    if (jsonInput && textAreaRef.current) {
      if (textAreaRef.current.resizableTextArea && textAreaRef.current.resizableTextArea.textArea) {
        textAreaRef.current.resizableTextArea.textArea.focus();
      } else if (typeof textAreaRef.current.focus === 'function') {
        textAreaRef.current.focus();
      }
    }
  }, [jsonInput]);

  // 监听表格转换器的结果事件
  useEffect(() => {
    const handleTableConverterResult = (event: any) => {
      const { jsonData } = event.detail;
      if (jsonData && Array.isArray(jsonData)) {
        // 将转换后的JSON数据设置到输入框
        setJsonInput(JSON.stringify(jsonData, null, 2));
        // 切换到JSON标签页
        setActiveTab('json');
        // 显示成功消息
        message.success(t('hr:auto__jsondata_length__e68890'));
      }
    };

    window.addEventListener('tableConverterResult', handleTableConverterResult);
    return () => {
      window.removeEventListener('tableConverterResult', handleTableConverterResult);
    };
  }, [message, t]); // Add t to dependency array

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    if (parseError) {
      setParseError(null);
    }
  };

  const processAndValidateJsonData = (jsonData: CreateEmployeePayload[]): ValidatedEmployeeData[] => {
    let hasAnyErrorsInBatch = false;
    let localValidRecords = 0;
    let localInvalidRecords = 0;

    const processedAndValidatedData = jsonData.map((rawRecord, index) => {
      const typedRecord: RawEmployeeData = {
        ...rawRecord,
        _clientId: nanoid(),
        originalIndex: index,
      };

      const fieldErrors = validateRecord(typedRecord, index);

      const validatedRecord: ValidatedEmployeeData = {
        ...typedRecord,
        validationErrors: fieldErrors.length > 0 ? fieldErrors : undefined,
      };

      if (fieldErrors.length > 0) {
        hasAnyErrorsInBatch = true;
        localInvalidRecords++;
      } else {
        localValidRecords++;
      }
      return validatedRecord;
    });

    setValidationSummary({
      totalRecords: jsonData.length,
      validRecords: localValidRecords,
      invalidRecords: localInvalidRecords
    });

    if (hasAnyErrorsInBatch) {
      message.warning(t('bulk_import.validation.batch_has_errors'));
    }
    return processedAndValidatedData;
  };

  const validateRecord = (record: RawEmployeeData, index: number): string[] => {
    const errors: string[] = [];
    const recordDescription = `Record ${index} (ID: ${record.id_number || ''}, Name: ${record.last_name || ''}${record.first_name || ''})`;

    // console.log(`[DEBUG ${recordDescription}] Validating:`, JSON.parse(JSON.stringify(record);))

    if (!record.first_name) errors.push(t('bulk_import.validation.first_name_required'));

    if (!record.last_name) errors.push(t('bulk_import.validation.last_name_required'));

    if (!record.id_number) {
      errors.push(t('bulk_import.validation.id_number_required'));
    } else {
      const idRegex = /^\d{17}(\d|X)$/i;
      const idTestFailed = !idRegex.test(String(record.id_number));
      if (idTestFailed) {
        errors.push(t('bulk_import.validation.id_number_invalid'));
      }
    }

    // 入职日期不再是必填项，但如果提供了则检查格式
    if (record.hire_date && String(record.hire_date).trim() !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const dateTestFailed = !dateRegex.test(String(record.hire_date));
      if (dateTestFailed) {
        errors.push(t('bulk_import.validation.hire_date_invalid_format'));
      }
    }

    // 员工状态不再是必填项，默认值会在后续处理中设置

    const dateRegexOptional = /^\d{4}-\d{2}-\d{2}$/;
    if (record.date_of_birth && String(record.date_of_birth).trim() !== '') {
      const dobDateTestFailed = !dateRegexOptional.test(String(record.date_of_birth));
      if (dobDateTestFailed) {
        errors.push(t('bulk_import.validation.date_of_birth_invalid_format'));
      }
    }
    if (record.first_work_date && String(record.first_work_date).trim() !== '') {
      const fwdDateTestFailed = !dateRegexOptional.test(String(record.first_work_date));
      if (fwdDateTestFailed) {
        errors.push(t('bulk_import.validation.first_work_date_invalid_format'));
      }
    }
    if (record.entry_date_to_current_organization && String(record.entry_date_to_current_organization).trim() !== '') {
      const edcoDateTestFailed = !dateRegexOptional.test(String(record.entry_date_to_current_organization));
      if (edcoDateTestFailed) {
        errors.push(t('bulk_import.validation.entry_date_to_current_organization_invalid_format'));
      }
    }

    // if (errors.length > 0) { } // This line was a misplaced curly brace
    return errors;
  };

  const handleParseAndPreview = () => {
    setParseError(null);
    if (!jsonInput.trim()) {
      message.info(t('bulk_import.validation.no_data_to_upload'));
      setParsedData(null);
      setCurrentStep(0);
      return;
    }
    try {
      const jsonData = JSON.parse(jsonInput);
      if (!Array.isArray(jsonData)) {
        throw new Error(t('bulk_import.validation.json_not_array'));
      }
      if (jsonData.length === 0) {
        message.info(t('bulk_import.validation.no_data_to_upload'));
        setParsedData(null);
        setCurrentStep(0);
        return;
      }
      const validatedData = processAndValidateJsonData(jsonData as CreateEmployeePayload[]);
      setParsedData(validatedData);
      setUploadResult(null);
      const invalidCount = validatedData.filter(d => d.validationErrors && d.validationErrors.length > 0).length;
      if (invalidCount > 0) {
        message.warning(t('bulk_import.message.file_parsed_with_errors_summary', { count: validatedData.length, errors: invalidCount }));
      } else {
        message.success(t('bulk_import.message.file_parsed_success', { count: validatedData.length }));
      }
      setCurrentStep(1);
    } catch (error: any) {
      setParseError(error.message || t('bulk_import.validation.json_parse_error'));
      setParsedData(null);
      setCurrentStep(0);
    }
  };

  const handleUpload = async () => {
    if (!parsedData || parsedData.length === 0) {
      message.error(t('bulk_import.validation.no_data_to_upload'));
      return;
    }

    const validRecords = parsedData.filter(record => !record.validationErrors || record.validationErrors.length === 0);

    if (validRecords.length === 0) {
      message.error(t('bulk_import.validation.no_valid_data_to_upload'));
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setCurrentStep(2);

    try {
      const payload = validRecords.map(record => {
        const { _clientId, validationErrors, originalIndex, ...apiPayload } = record;
        return apiPayload as CreateEmployeePayload;
      });

      // 添加详细日志以便调试
      console.log(t('hr:auto__bulk_import_debug___5b4255'),
        validRecords.map(r => ({
          id_number: r.id_number,
          personnel_category_name: r.personnel_category_name,
          position_name: r.position_name
        }))
      );
      // 保存原始名称数据以便后续显示
      const originalNameData = validRecords.reduce((acc, record) => {
        // 使用身份证号码作为唯一标识
        if (record.id_number) {
          acc[record.id_number] = {
            personnel_category_name: record.personnel_category_name || '',
            position_name: record.position_name || ''
          };
        }
        return acc;
      }, {} as Record<string, {personnel_category_name: string, position_name: string}>);

      const response = await employeeService.bulkCreateEmployees(payload, overwriteMode);

      // 新的API响应格式包含详细的成功和失败信息
      if (response && typeof response === 'object' && 'success_count' in response) {
        const {
          success_count = 0,
          failed_count = 0,
          // total_count = 0, // total_count is not used
          created_employees = [],
          failed_records = []
        } = response as any;

        console.log(t('hr:auto__bulk_import_debug_api__5b4255'), {
          success_count,
          failed_count,
          total_count: success_count + failed_count, // Use sum of success and failed for total_count
          created_employees_length: created_employees.length,
          failed_records_length: failed_records.length
        });

        // 显示结果消息
        if (success_count > 0 && failed_count === 0) {
          message.success(t('bulk_import.message.upload_success', { count: success_count }));
        } else if (success_count > 0 && failed_count > 0) {
          message.warning(t('bulk_import.results.partial_success', { success: success_count, error: failed_count }));
        } else if (failed_count > 0) {
          message.error(t('bulk_import.results.all_failed_at_server', { count: failed_count }));
        } else {
          message.error(t('bulk_import.message.upload_failed_no_data_returned'));
        }

        // 合并前端验证错误和后端处理错误
        const allErrors = [
          // 前端验证失败的记录
          ...parsedData.filter(r => r.validationErrors && r.validationErrors.length > 0).map(r => ({
            record: r,
            error: r.validationErrors!.join('; ')
          })),
          // 后端处理失败的记录 - 直接使用新的格式
          ...failed_records.map((item: any) => ({ // Map failed_records to match the error object structure
            record: {
              _clientId: nanoid(), // Add a client ID for keying in table
              id_number: item.id_number,
              first_name: item.first_name,
              last_name: item.last_name,
              // Add other relevant fields from item if needed for display
            },
            error: item.detail || t('common:error.unknown_server_error') // Use detail from backend or a generic error
          }))
        ];

        setUploadResult({
          successCount: success_count,
          errorCount: allErrors.length,
          errors: allErrors,
          createdEmployees: created_employees.map((emp: any, index: number) => {
            // 确保显示原始提交的人员身份和实际任职名称
            const enhancedEmp = {...emp, _clientId: `success_${Date.now()}_${index}`};

            // 通过身份证号匹配原始数据
            if (emp.id_number && originalNameData[emp.id_number]) {
              // 记录匹配过程
              console.log(`[BULK IMPORT DEBUG] 匹配员工数据 ID号: ${emp.id_number},
                后端返回值: [人员身份=${emp.personnel_category_name}, 实际任职=${emp.position_name}],
                原始值: [人员身份=${originalNameData[emp.id_number].personnel_category_name},
                实际任职=${originalNameData[emp.id_number].position_name}]`);

              // 如果后端返回的数据中这些字段为空，使用原始提交的数据
              if (!enhancedEmp.personnel_category_name) {
                enhancedEmp.personnel_category_name = originalNameData[emp.id_number].personnel_category_name;
              }

              if (!enhancedEmp.position_name) {
                enhancedEmp.position_name = originalNameData[emp.id_number].position_name;
              }
            } else {
              // No matching original data, perhaps log or handle
            }

            return enhancedEmp;
          })
        });
      } else {
        // 兼容旧的API响应格式
        let employeesToDisplay: any[] = [];
        if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          employeesToDisplay = (response as any).data;
        }
        else if (response && Array.isArray(response)) {
          employeesToDisplay = response;
        }
        else {
          // No valid data returned, handle accordingly
        }

        if (employeesToDisplay.length > 0) {
          message.success(t('bulk_import.message.upload_success', { count: employeesToDisplay.length }));
        } else if (parsedData.length - validRecords.length > 0) {
          message.warning(t('bulk_import.message.upload_attempted_but_no_valid_records_processed_or_returned'));
        } else {
          message.error(t('bulk_import.message.upload_failed_no_data_returned'));
        }

        setUploadResult({
          successCount: employeesToDisplay.length,
          errorCount: parsedData.length - validRecords.length, // This only accounts for frontend validation errors
          errors: parsedData.filter(r => r.validationErrors && r.validationErrors.length > 0).map(r => ({record: r, error: r.validationErrors!.join('; ')})),
          createdEmployees: employeesToDisplay.map((emp, index) => {
            // 确保显示原始提交的人员身份和实际任职名称
            const enhancedEmp = {...emp, _clientId: `success_${Date.now()}_${index}`};

            // 通过身份证号匹配原始数据
            if (emp.id_number && originalNameData[emp.id_number]) {
              // 记录匹配过程
              console.log(`[BULK IMPORT DEBUG] 匹配员工数据 ID号: ${emp.id_number},
                后端返回值: [人员身份=${emp.personnel_category_name}, 实际任职=${emp.position_name}],
                原始值: [人员身份=${originalNameData[emp.id_number].personnel_category_name},
                实际任职=${originalNameData[emp.id_number].position_name}]`);

              // 如果后端返回的数据中这些字段为空，使用原始提交的数据
              if (!enhancedEmp.personnel_category_name) {
                enhancedEmp.personnel_category_name = originalNameData[emp.id_number].personnel_category_name;
              }

              if (!enhancedEmp.position_name) {
                enhancedEmp.position_name = originalNameData[emp.id_number].position_name;
              }
            } else {
              // No matching original data, perhaps log or handle
            }

            return enhancedEmp;
          })
        });
      }
      setCurrentStep(3);
    } catch (error: any) {
      let extractedErrorMessage = t('common:error.unknown');
      let detailedErrorMessage = '';

      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          extractedErrorMessage = error.response.data.detail;
          detailedErrorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail) && error.response.data.detail.length > 0) {
          // 提取简短摘要
          extractedErrorMessage = `${t('bulk_import.message.upload_failed_with_errors', { count: error.response.data.detail.length })}`;
          // 保存详细错误信息
          detailedErrorMessage = error.response.data.detail
            .map((errItem: any) => errItem.msg || JSON.stringify(errItem))
            .join('\n');
        } else if (typeof error.response.data.detail === 'object') {
          extractedErrorMessage = error.response.data.detail.msg || t('bulk_import.message.upload_failed_with_details');
          detailedErrorMessage = JSON.stringify(error.response.data.detail, null, 2);
        } else {
          extractedErrorMessage = t('bulk_import.message.upload_failed');
          detailedErrorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.message) {
        extractedErrorMessage = error.message;
        detailedErrorMessage = error.message;
      }

      message.error(`${t('bulk_import.message.upload_failed_prefix')} ${extractedErrorMessage}`);

      setUploadResult({
        successCount: 0,
        errorCount: validRecords.length, // Assume all valid records failed for this error type
        errors: validRecords.map(record => ({
          record,
          error: extractedErrorMessage
        })),
        createdEmployees: []
      });
      setCurrentStep(3);
    } finally {
      setUploading(false);
    }
  };

  const renderValidationErrors = (errors?: string[]) => {
    if (!errors || errors.length === 0) return <CheckCircleOutlined className={styles.successIcon} />;
    return (
      <Tooltip
        title={<div className={styles.validationErrorsInTable}><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
        overlayStyle={{ whiteSpace: 'normal', maxWidth: 400 }} // Corrected: use overlayStyle for Tooltip
      >
        <CloseCircleOutlined style={{ color: 'red' }} />
      </Tooltip>
    );
  };

  const columns = [
    { title: t('bulk_import.table_header.employee_code'), dataIndex: 'employee_code', key: 'employee_code', width: 120, render: (text: any) => text || '-' },
    {
      title: t('bulk_import.table_header.fullname'),
      key: 'fullname',
      width: 100,
      render: (_: unknown, record: RawEmployeeData) => {
        return record._fullname || `${record.last_name || ''}${record.first_name || ''}` || '-';
      }
    },
    { title: t('bulk_import.table_header.last_name'), dataIndex: 'last_name', key: 'last_name', width: 80 },
    { title: t('bulk_import.table_header.first_name'), dataIndex: 'first_name', key: 'first_name', width: 80 },
    { title: t('bulk_import.table_header.id_number'), dataIndex: 'id_number', key: 'id_number', width: 180 },
    { title: t('bulk_import.table_header.date_of_birth'), dataIndex: 'date_of_birth', key: 'date_of_birth', width: 120, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.gender_name'), dataIndex: 'gender_lookup_value_name', key: 'gender_lookup_value_name', width: 80, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.ethnicity'), dataIndex: 'ethnicity', key: 'ethnicity', width: 100, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.status_name'), dataIndex: 'status_lookup_value_name', key: 'status_lookup_value_name', width: 100 },
    { title: t('bulk_import.table_header.hire_date'), dataIndex: 'hire_date', key: 'hire_date', width: 120 },
    { title: t('bulk_import.table_header.first_work_date'), dataIndex: 'first_work_date', key: 'first_work_date', width: 120, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.entry_date_to_current_organization'), dataIndex: 'entry_date_to_current_organization', key: 'entry_date_to_current_organization', width: 120, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.employment_type_name'), dataIndex: 'employment_type_lookup_value_name', key: 'employment_type_lookup_value_name', width: 120, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.education_level_name'), dataIndex: 'education_level_lookup_value_name', key: 'education_level_lookup_value_name', width: 120, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.marital_status_name'), dataIndex: 'marital_status_lookup_value_name', key: 'marital_status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.political_status_name'), dataIndex: 'political_status_lookup_value_name', key: 'political_status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.contract_type_name'), dataIndex: 'contract_type_lookup_value_name', key: 'contract_type_lookup_value_name', width: 120, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.department_name'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.position_name'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.personnel_category_name'), dataIndex: 'personnel_category_name', key: 'personnel_category_name', width: 150, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.email'), dataIndex: 'email', key: 'email', width: 180, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.phone_number'), dataIndex: 'phone_number', key: 'phone_number', width: 120, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.bank_name'), dataIndex: 'bank_name', key: 'bank_name', width: 150, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.bank_account_number'), dataIndex: 'bank_account_number', key: 'bank_account_number', width: 150, render: (text: any) => text || '-' },
    {
      title: t('bulk_import.table_header.validation_errors'),
      dataIndex: 'validationErrors',
      key: 'validationErrors',
      width: 200,
      render: renderValidationErrors
    }
  ];

  const resultErrorColumns = [ // Corrected: Array literal needs to be wrapped
    { title: t('bulk_import.results_table.employee_code'), dataIndex: 'employee_code', key: 'code', width: 150, render: (text: any) => text || '-' },
    {
      title: t('bulk_import.results_table.name'),
      key: 'name',
      width: 120,
      render: (_: unknown, item: any) => {
        // New API response format: failed records directly contain name info
        if (item.full_name) {
          return item.full_name;
        }
        // Compatible with old format: get name from record object
        if (item.record) {
          return item.record._fullname || `${item.record.last_name || ''}${item.record.first_name || ''}` || '-';
        }
        // Build name directly from failed record
        return `${item.last_name || ''}${item.first_name || ''}` || '-';
      }
    },
    {
      title: t('bulk_import.results_table.error_message'),
      key: 'error',
      render: (_: unknown, item: any) => { // Corrected: curly brace was misplaced
        // New API response format: errors is an array
        if (Array.isArray(item.errors)) { // Corrected: parenthesis was misplaced
          return item.errors.join('; ');
        }
        // Compatible with old format: error is a string
        return item.error || '-';
      }
    },
  ];

  // 新增: 定义 Tabs 的 items
  const tabItems = [
    {
      key: 'table',
      label: <span><TableOutlined />{t('bulk_import.tabs.table_conversion')}</span>, // Added t()
      children: <TableTextConverter />
    },
    {
      key: 'json',
      label: <span><FileTextOutlined />{t('bulk_import.tabs.json_import')}</span>, // Added t()
      children: (
        <div className={styles.tabContentContainer}>
          <Steps current={currentStep} className={styles.stepsContainer}>
            <Step title={t('bulk_import.steps.input_data')} icon={<FileTextOutlined />} />
            <Step title={t('bulk_import.steps.preview_data')} icon={<PlaySquareOutlined />} />
            <Step title={t('bulk_import.steps.upload_progress')} />
            <Step title={t('bulk_import.steps.results')} />
          </Steps>

          {parseError && (
            <Alert
              message={parseError}
              type="error"
              showIcon
              closable
              onClose={() => setParseError(null)}
            />
          )}

          {currentStep === 0 && (
            <>
              <Form.Item
                label={t('bulk_import.label.json_input')}
                help={parseError ? <Text type="danger">{parseError}</Text> : t('bulk_import.help.json_input')}
                validateStatus={parseError ? 'error' : ''}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                className={styles.centeredFormLabel}
              >
                <Input.TextArea
                  ref={textAreaRef}
                  rows={10}
                  value={jsonInput}
                  onChange={handleJsonInputChange}
                  placeholder={t('bulk_import.placeholder.paste_json_here')}
                  className={styles.jsonInputArea}
                />
              </Form.Item>
              <Button
                type="primary"
                onClick={handleParseAndPreview}
                icon={<PlaySquareOutlined />}
                loading={uploading && currentStep === 0}
                className={styles.uploadButton}
                disabled={!jsonInput.trim()}
              >
                {t('bulk_import.button.parse_and_preview')} {/* Corrected: use {} for translation */}
              </Button>

              <Form.Item
                label={t('bulk_import.label.overwrite_mode')}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                help={t('bulk_import.help.overwrite_mode')}
                className={styles.centeredFormLabel}
              >
                <Switch checked={overwriteMode} onChange={setOverwriteMode} />
              </Form.Item>
            </>
          )}

          {currentStep === 1 && parsedData && (
            <Card title={t('bulk_import.card_title.preview_data_count_summary', {
              count: parsedData.length,
              valid: validationSummary.validRecords,
              invalid: validationSummary.invalidRecords
            })}>
              {validationSummary.invalidRecords > 0 &&
                <Alert
                  message={t('bulk_import.notes.preview_contains_errors', {count: validationSummary.invalidRecords})}
                  type="warning"
                  showIcon
                  style={{marginBottom: 16}}
                />
              }
              {validationSummary.validRecords === 0 && validationSummary.invalidRecords > 0 &&
                <Alert
                  message={t('bulk_import.notes.no_valid_records_to_upload')}
                  type="error"
                  showIcon
                  style={{marginBottom: 16}}
                />
              }
              <Table
                columns={columns}
                dataSource={parsedData}
                rowKey="_clientId"
                scroll={{ x: 'max-content' }}
                size="small"
                bordered
                pagination={{ pageSize: 10, hideOnSinglePage: parsedData.length <= 10 }}
              />
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={handleUpload}
                loading={uploading && currentStep === 1}
                disabled={!parsedData || parsedData.length === 0 || validationSummary.validRecords === 0} /* Changed disabled logic */
                className={styles.uploadButton}
              >
                {t('bulk_import.button.upload_validated_records', { count: validationSummary.validRecords })}
              </Button>
            </Card>
          )}

          {currentStep === 2 && uploading && (
            <Card title={t('bulk_import.card_title.uploading_data')}>
              <Space direction="vertical" align="center" style={{width: '100%'}}>
                <Text>{t('bulk_import.message.upload_in_progress')}</Text> {/* Corrected: use {} for translation */}
                <Spin size="large" /> {/* Added Spin component for visual feedback */}
              </Space>
            </Card>
          )}

          {currentStep === 3 && uploadResult && (
            <Card title={t('bulk_import.card_title.upload_results')}>
              {uploadResult.errorCount === 0 && uploadResult.successCount > 0 ? (
                <Alert
                  message={t('bulk_import.results.all_success', { count: uploadResult.successCount })}
                  type="success"
                  showIcon
                />
              ) : uploadResult.successCount > 0 && uploadResult.errorCount > 0 ? (
                <Alert
                  message={t('bulk_import.results.partial_success', { success: uploadResult.successCount, error: uploadResult.errorCount })}
                  type="warning"
                  showIcon
                />
              ) : uploadResult.errorCount > 0 && uploadResult.successCount === 0 ? (
                <Alert
                  message={t('bulk_import.results.all_failed_at_server', { count: uploadResult.errorCount })}
                  type="error"
                  showIcon
                />
              ) : (
                  <Alert
                    message={t('bulk_import.results.no_records_processed_at_server')}
                    type="info"
                    showIcon
                  />
              )}

              {uploadResult.createdEmployees && uploadResult.createdEmployees.length > 0 && (
                <>
                  <Title level={5} style={{ marginTop: '20px' }}>{t('bulk_import.results_table.title_successfully_imported_records_preview')}</Title> {/* Corrected: use {} for translation */}
                  <Table
                    columns={columns.filter(col => col.key !== 'validationErrors')}
                    dataSource={uploadResult.createdEmployees}
                    rowKey={(record: any) => record.id || record._clientId || record.employee_code || nanoid()}
                    scroll={{ x: 'max-content' }}
                    size="small"
                    bordered
                    pagination={{ pageSize: 10, hideOnSinglePage: uploadResult.createdEmployees.length <= 10 }}
                  />
                </>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <Title level={5}>{t('bulk_import.results_table.title_failed_records_at_server')}</Title> {/* Corrected: use {} for translation */}
                    <Button
                      type="link"
                      onClick={() => setShowDetailedErrors(!showDetailedErrors)}
                    >
                      {showDetailedErrors ? t('bulk_import.button.hide_error_details') : t('bulk_import.button.show_error_details')}
                    </Button>
                  </div>

                  {!showDetailedErrors ? (
                    <Alert
                      message={t('bulk_import.results.error_summary', { count: uploadResult.errors.length })}
                      description={t('bulk_import.results.click_to_view_details')}
                      type="error"
                      showIcon
                      action={
                        <Button size="small" onClick={() => setShowDetailedErrors(true)}>
                          {t('bulk_import.button.view_details')}
                        </Button>
                      }
                    />
                  ) : (
                    <Table
                      columns={resultErrorColumns}
                      dataSource={uploadResult.errors}
                      rowKey={(item, index) => `error_${item.record?.id_number || index}`} /* Use id_number for key if available */
                      size="small"
                      bordered
                      pagination={false}
                    />
                  )}
                </>
              )}
              <Button onClick={() => {
                setCurrentStep(0);
                setJsonInput('');
                setParsedData(null);
                setUploadResult(null);
                setValidationSummary({ totalRecords: 0, validRecords: 0, invalidRecords: 0 });
                setShowDetailedErrors(false);
              }}>
                {t('bulk_import.button.import_another_file')} {/* Corrected: use {} for translation */}
              </Button>
            </Card>
          )}
        </div>
      )
    }
  ];

  if (!ready) {
    return <div>Loading Translations...</div>;
  }

  return (
    <PageHeaderLayout
      pageTitle={t('hr:bulk_import.page_title')}
      actions={
        <Space>
          <Button
            onClick={() => navigate('/hr/employees')}
            shape="round"
            icon={<ArrowLeftOutlined />}
          >
            {t('bulk_import.button.back_to_employees')} {/* Corrected: use {} for translation */}
          </Button>
        </Space>
      }
    >
      <Card className={styles.mainContentCard}>
        <div className={styles.bulkImportContainer}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className={styles.tabsContainer}
            items={tabItems}
          />
        </div>
      </Card>
    </PageHeaderLayout>
  );
};

export default EmployeeBulkImportPage;