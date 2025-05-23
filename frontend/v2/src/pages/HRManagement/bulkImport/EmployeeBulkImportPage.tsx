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
import { FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, UserAddOutlined, PlaySquareOutlined, TableOutlined } from '@ant-design/icons';
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
        message.success(`成功从表格转换了 ${jsonData.length} 条员工记录`);
      }
    };

    window.addEventListener('tableConverterResult', handleTableConverterResult);
    return () => {
      window.removeEventListener('tableConverterResult', handleTableConverterResult);
    };
  }, [message]);

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
      // message.warning(t('bulk_import.validation.batch_has_errors'));
    }
    return processedAndValidatedData;
  };

  const validateRecord = (record: RawEmployeeData, index: number): string[] => {
    const errors: string[] = [];
    const recordDescription = `Record ${index} (ID: ${record.id_number || 'N/A'}, Name: ${record.last_name || ''}${record.first_name || ''})`;

    // console.log(`[DEBUG ${recordDescription}] Validating:`, JSON.parse(JSON.stringify(record)));

    console.log(`[DEBUG ${recordDescription}] first_name: '${record.first_name}', typeof: ${typeof record.first_name}, empty: ${!record.first_name}`);
    if (!record.first_name) errors.push(t('bulk_import.validation.first_name_required'));
    
    console.log(`[DEBUG ${recordDescription}] last_name: '${record.last_name}', typeof: ${typeof record.last_name}, empty: ${!record.last_name}`);
    if (!record.last_name) errors.push(t('bulk_import.validation.last_name_required'));
    
    console.log(`[DEBUG ${recordDescription}] id_number: '${record.id_number}', typeof: ${typeof record.id_number}, empty: ${!record.id_number}`);
    if (!record.id_number) {
      errors.push(t('bulk_import.validation.id_number_required'));
    } else {
      const idRegex = /^\d{17}(\d|X)$/i;
      const idTestFailed = !idRegex.test(String(record.id_number)); 
      console.log(`[DEBUG ${recordDescription}] id_number regex test (${idRegex}) on '${record.id_number}': failed: ${idTestFailed}`);
      if (idTestFailed) {
        errors.push(t('bulk_import.validation.id_number_invalid'));
      }
    }

    // 入职日期不再是必填项，但如果提供了则检查格式
    console.log(`[DEBUG ${recordDescription}] hire_date: '${record.hire_date}', typeof: ${typeof record.hire_date}, empty: ${!record.hire_date}`);
    if (record.hire_date && String(record.hire_date).trim() !== '') { 
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const dateTestFailed = !dateRegex.test(String(record.hire_date)); 
      console.log(`[DEBUG ${recordDescription}] hire_date regex test (${dateRegex}) on '${record.hire_date}': failed: ${dateTestFailed}`);
      if (dateTestFailed) {
        errors.push(t('bulk_import.validation.hire_date_invalid_format'));
      }
    }
    
    // 员工状态不再是必填项，默认值会在后续处理中设置

    const dateRegexOptional = /^\d{4}-\d{2}-\d{2}$/;
    if (record.date_of_birth && String(record.date_of_birth).trim() !== '') { 
        const dobDateTestFailed = !dateRegexOptional.test(String(record.date_of_birth)); 
        console.log(`[DEBUG ${recordDescription}] date_of_birth: '${record.date_of_birth}', regex test (${dateRegexOptional}): failed: ${dobDateTestFailed}`);
        if (dobDateTestFailed) {
          errors.push(t('bulk_import.validation.date_of_birth_invalid_format'));
        }
    }
    if (record.first_work_date && String(record.first_work_date).trim() !== '') {
        const fwdDateTestFailed = !dateRegexOptional.test(String(record.first_work_date)); 
        console.log(`[DEBUG ${recordDescription}] first_work_date: '${record.first_work_date}', regex test (${dateRegexOptional}): failed: ${fwdDateTestFailed}`);
        if (fwdDateTestFailed) {
          errors.push(t('bulk_import.validation.first_work_date_invalid_format'));
        }
    }
     if (record.entry_date_to_current_organization && String(record.entry_date_to_current_organization).trim() !== '') {
        const edcoDateTestFailed = !dateRegexOptional.test(String(record.entry_date_to_current_organization)); 
        console.log(`[DEBUG ${recordDescription}] entry_date_to_current_organization: '${record.entry_date_to_current_organization}', regex test (${dateRegexOptional}): failed: ${edcoDateTestFailed}`);
        if (edcoDateTestFailed) {
          errors.push(t('bulk_import.validation.entry_date_to_current_organization_invalid_format'));
        }
    }
    
    if (errors.length > 0) {
      console.log(`[DEBUG ${recordDescription}] Final errors for this record:`, JSON.stringify(errors));
    }
    return errors;
  };

  const handleParseAndPreview = () => {
    console.log("[BULK IMPORT DEBUG] handleParseAndPreview called");
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
      console.error("[BULK IMPORT DEBUG] Error parsing JSON:", error);
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
      console.log("[BULK IMPORT DEBUG] 原始提交数据中的人员身份和实际任职字段:", 
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
      
      console.log("[BULK IMPORT DEBUG] Raw API Response from service in handleUpload:", response);
      
      // 新的API响应格式包含详细的成功和失败信息
      if (response && typeof response === 'object' && 'success_count' in response) {
        const {
          success_count = 0,
          failed_count = 0,
          total_count = 0,
          created_employees = [],
          failed_records = []
        } = response as any;

        console.log("[BULK IMPORT DEBUG] 解析API响应:", {
          success_count,
          failed_count,
          total_count,
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
          ...failed_records
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
                console.log(`[BULK IMPORT DEBUG] 使用原始人员身份: ${enhancedEmp.personnel_category_name}`);
              }
              
              if (!enhancedEmp.position_name) {
                enhancedEmp.position_name = originalNameData[emp.id_number].position_name;
                console.log(`[BULK IMPORT DEBUG] 使用原始实际任职: ${enhancedEmp.position_name}`);
              }
            } else {
              console.log(`[BULK IMPORT DEBUG] 无法匹配员工数据，ID号: ${emp.id_number}`);
            }
            
            return enhancedEmp;
          })
        });
      } else {
        // 兼容旧的API响应格式
        let employeesToDisplay: any[] = [];
        if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) { 
          employeesToDisplay = (response as any).data;
          console.log("[BULK IMPORT DEBUG] Successfully extracted employee array from response.data:", employeesToDisplay);
        } 
        else if (response && Array.isArray(response)) { 
          employeesToDisplay = response;
          console.warn("[BULK IMPORT DEBUG] API Response was a direct array. Using direct array:", employeesToDisplay);
        } 
        else {
          console.error("[BULK IMPORT DEBUG] API Response format is not as expected (expected {data: Array} or Array). Received:", response);
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
          errorCount: parsedData.length - validRecords.length,
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
                console.log(`[BULK IMPORT DEBUG] 使用原始人员身份: ${enhancedEmp.personnel_category_name}`);
              }
              
              if (!enhancedEmp.position_name) {
                enhancedEmp.position_name = originalNameData[emp.id_number].position_name;
                console.log(`[BULK IMPORT DEBUG] 使用原始实际任职: ${enhancedEmp.position_name}`);
              }
            } else {
              console.log(`[BULK IMPORT DEBUG] 无法匹配员工数据，ID号: ${emp.id_number}`);
            }
            
            return enhancedEmp;
          })
        });
      }
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Bulk upload failed:", error.response?.data || error);
      
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
        errorCount: validRecords.length,
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
        overlayInnerStyle={{ whiteSpace: 'normal', maxWidth: 400 }}
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

  const resultErrorColumns = [
    { title: t('bulk_import.results_table.employee_code'), dataIndex: 'employee_code', key: 'code', width: 150, render: (text: any) => text || '-' },
    { 
      title: t('bulk_import.results_table.name'), 
      key: 'name', 
      width: 120,
      render: (_: unknown, item: any) => {
        // 新的API响应格式：失败记录直接包含姓名信息
        if (item.full_name) {
          return item.full_name;
        }
        // 兼容旧格式：从record对象中获取姓名
        if (item.record) {
          return item.record._fullname || `${item.record.last_name || ''}${item.record.first_name || ''}` || '-';
        }
        // 直接从失败记录中构建姓名
        return `${item.last_name || ''}${item.first_name || ''}` || '-';
      }
    },
    { 
      title: t('bulk_import.results_table.error_message'), 
      key: 'error',
      render: (_: unknown, item: any) => {
        // 新的API响应格式：errors是数组
        if (Array.isArray(item.errors)) {
          return item.errors.join('; ');
        }
        // 兼容旧格式：error是字符串
        return item.error || '-';
      }
    },
  ];

  // 新增: 定义 Tabs 的 items
  const tabItems = [
    {
      key: 'table',
      label: <span><TableOutlined />表格转换</span>,
      children: <TableTextConverter />
    },
    {
      key: 'json',
      label: <span><FileTextOutlined />JSON导入</span>,
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
                {t('bulk_import.button.parse_and_preview')}
              </Button>
              <Paragraph type="secondary" className={styles.helperText}>
                {t('bulk_import.help.data_format_guidance_intro')}
                <pre>
                  {`[
  {
    "employee_code": "E001",
    "first_name": "张",
    "last_name": "三",
    "id_number": "11010119900101001X",
    "hire_date": "2024-01-15",
    "status_lookup_value_name": "在职",
    "email": "zhangsan@example.com",
    // ... other necessary and optional fields based on CreateEmployeePayload in types.ts
  },
  // ...more employee records
]`}
                </pre>
                {t('bulk_import.notes.refer_to_documentation_for_fields')}
              </Paragraph>
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
                disabled={!parsedData || parsedData.length === 0 || validationSummary.invalidRecords > 0}
                className={styles.uploadButton}
              >
                {t('bulk_import.button.upload_validated_records', { count: validationSummary.validRecords })}
              </Button>
            </Card>
          )}

          {currentStep === 2 && uploading && (
            <Card title={t('bulk_import.card_title.uploading_data')}>
              <Space direction="vertical" align="center" style={{width: '100%'}}>
                <Text>{t('bulk_import.message.upload_in_progress')}</Text>
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
                  <Title level={5} style={{ marginTop: '20px' }}>{t('bulk_import.results_table.title_successfully_imported_records_preview')}</Title>
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
                    <Title level={5}>{t('bulk_import.results_table.title_failed_records_at_server')}</Title>
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
                      rowKey={(item, index) => `error_${index}`}
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
                {t('bulk_import.button.import_another_file')}
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
    <PageHeaderLayout pageTitle={t('hr:bulk_import.page_title')} icon={<UserAddOutlined />}>
      <div className={styles.bulkImportContainer}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          className={styles.tabsContainer}
          items={tabItems}
        /> 
      </div>
    </PageHeaderLayout>
  );
};

export default EmployeeBulkImportPage;