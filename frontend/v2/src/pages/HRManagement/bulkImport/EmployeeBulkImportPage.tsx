import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Button,
  Alert,
  Typography,
  Table,
  Space,
  Steps,
  Card,
  Input,
  App,
  type UploadFile
} from 'antd';
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, UserAddOutlined, PlaySquareOutlined, InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../../services/employeeService'; 
import styles from './EmployeeBulkImportPage.module.less';
import type { CreateEmployeePayload } from '../../HRManagement/types';
import { nanoid } from 'nanoid';

export interface RawEmployeeData extends CreateEmployeePayload { 
  _clientId?: string; 
  validationErrors?: string[];
  originalIndex?: number;
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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [parsedData, setParsedData] = useState<ValidatedEmployeeData[] | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const textAreaRef = useRef<any>(null); 
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({ totalRecords: 0, validRecords: 0, invalidRecords: 0 });

  useEffect(() => {
    if (jsonInput && textAreaRef.current) {
      if (textAreaRef.current.resizableTextArea && textAreaRef.current.resizableTextArea.textArea) {
        textAreaRef.current.resizableTextArea.textArea.focus();
      } else if (typeof textAreaRef.current.focus === 'function') {
        textAreaRef.current.focus();
      }
    }
  }, [jsonInput]); 

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

    console.log(`[DEBUG ${recordDescription}] hire_date: '${record.hire_date}', typeof: ${typeof record.hire_date}, empty: ${!record.hire_date}`);
    if (!record.hire_date) {
      errors.push(t('bulk_import.validation.hire_date_required'));
    } else { 
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const dateTestFailed = !dateRegex.test(String(record.hire_date)); 
      console.log(`[DEBUG ${recordDescription}] hire_date regex test (${dateRegex}) on '${record.hire_date}': failed: ${dateTestFailed}`);
      if (dateTestFailed) {
        errors.push(t('bulk_import.validation.hire_date_invalid_format'));
      }
    }
    
    console.log(`[DEBUG ${recordDescription}] status_lookup_value_name: '${record.status_lookup_value_name}', typeof: ${typeof record.status_lookup_value_name}, empty: ${!record.status_lookup_value_name}`);
    if (!record.status_lookup_value_name) errors.push(t('bulk_import.validation.status_required'));

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

  const handleFileChange = (info: any) => {
    const { file } = info;
    setParseError(null);

    if (file && file.originFileObj) {
      if (file.type !== 'application/json' && file.status !== 'removed') {
        message.error(t('bulk_import.validation.json_only'));
        setJsonInput('');
        setParsedData(null);
        setFileList([]); 
        return;
      }

      if (file.status === 'removed') { 
        setJsonInput('');
        setParsedData(null);
        setFileList([]);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonInput(content);
      };
      reader.readAsText(file.originFileObj);
      setFileList([file as UploadFile]);
    } else if (info.fileList.length === 0) { 
        setJsonInput('');
        setParsedData(null);
        setFileList([]);
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

      const response = await employeeService.bulkCreateEmployees(payload); 
      
      console.log("[BULK IMPORT DEBUG] Raw API Response from service in handleUpload:", response);
      
      let employeesToDisplay: any[] = [];
      if (response && response.data && Array.isArray(response.data)) { 
        employeesToDisplay = response.data;
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
        createdEmployees: employeesToDisplay.map((emp, index) => ({...emp, _clientId: `success_${Date.now()}_${index}`}))
      });
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Bulk upload failed:", error.response?.data || error);
      
      let extractedErrorMessage = t('common:error.unknown');
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          extractedErrorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail) && error.response.data.detail.length > 0) {
          extractedErrorMessage = error.response.data.detail
            .map((errItem: any) => errItem.msg || JSON.stringify(errItem))
            .join('; ');
        } else if (typeof error.response.data.detail === 'object') {
            extractedErrorMessage = error.response.data.detail.msg || JSON.stringify(error.response.data.detail);
        } else {
            extractedErrorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.message) {
        extractedErrorMessage = error.message;
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

  const columns = [
    { title: t('bulk_import.table_header.employee_code'), dataIndex: 'employee_code', key: 'employee_code', width: 120, render: (text: any) => text || '-' },
    { title: t('bulk_import.table_header.last_name'), dataIndex: 'last_name', key: 'last_name', width: 100 },
    { title: t('bulk_import.table_header.first_name'), dataIndex: 'first_name', key: 'first_name', width: 100 },
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
    {
      title: t('bulk_import.table_header.validation_errors'),
      dataIndex: 'validationErrors',
      key: 'validationErrors',
      width: 200,
      render: (errors: string[] | undefined) => {
        if (!errors || errors.length === 0) return <CheckCircleOutlined style={{ color: 'green' }} />;
        return (
          <ul style={{ margin: 0, paddingLeft: 15 }}>
            {errors.map((err, i) => <li key={i}><Text type="danger">{err}</Text></li>)}
          </ul>
        );
      }
    }
  ];

  const resultErrorColumns = [
    { title: t('bulk_import.results_table.employee_code'), dataIndex: ['record', 'employee_code'], key: 'code', width: 150, render: (text: any, item:any) => item.record?.employee_code || '-' },
    { title: t('bulk_import.results_table.name'), key: 'name', render: (_: any, item: any) => `${item.record?.last_name || ''}${item.record?.first_name || ''}` || '-' },
    { title: t('bulk_import.results_table.error_message'), dataIndex: 'error', key: 'error' },
  ];

   if (!ready) {
    return <div>Loading Translations...</div>; 
  }

  return (
    <PageHeaderLayout pageTitle={t('hr:bulk_import.page_title')} icon={<UserAddOutlined />}>
      <div className={styles.bulkImportContainer}>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title={t('bulk_import.steps.input_data')} icon={<FileTextOutlined />} />
          <Step title={t('bulk_import.steps.preview_data')} icon={<UploadOutlined />} />
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
          <Card title={t('bulk_import.card_title.select_or_paste_json')}>
            <Upload.Dragger
              name="file"
              multiple={false}
              accept=".json"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={handleFileChange}
              style={{ minHeight: '120px' }}
            >
              <Input.TextArea
                ref={textAreaRef}
                value={jsonInput}
                onChange={handleJsonInputChange}
                onClick={(e) => { e.stopPropagation(); }}
                placeholder={t('bulk_import.placeholder.drag_paste_or_type')}
                rows={6}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '120px',
                  resize: 'vertical',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  padding: '12px',
                }}
              />
            </Upload.Dragger>
            <Button
              type="primary"
              onClick={handleParseAndPreview}
              disabled={!jsonInput.trim()}
              icon={<PlaySquareOutlined />}
              style={{ marginTop: 16 }}
            >
              {t('bulk_import.button.parse_and_preview')}
            </Button>
            <Paragraph type="secondary" style={{ marginTop: 24 }}>
              {t('bulk_import.notes.json_format_intro')}
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
          </Card>
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
              icon={<UploadOutlined />} 
              onClick={handleUpload} 
              loading={uploading} 
              style={{ marginTop: '20px' }}
              disabled={uploading || validationSummary.validRecords === 0}
            >
              {t('bulk_import.button.start_upload_count', {count: validationSummary.validRecords})}
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
                <Title level={5} style={{ marginTop: '20px' }}>{t('bulk_import.results_table.title_failed_records_at_server')}</Title>
                <Table
                  columns={resultErrorColumns}
                  dataSource={uploadResult.errors}
                  rowKey={(item, index) => `error_${index}`}
                  size="small"
                  bordered
                  pagination={false}
                />
              </>
            )}
            <Button onClick={() => { setCurrentStep(0); setJsonInput(''); setFileList([]); setParsedData(null); setUploadResult(null); setValidationSummary({ totalRecords: 0, validRecords: 0, invalidRecords: 0 }); }}>
              {t('bulk_import.button.import_another_file')}
            </Button>
          </Card>
        )}
      </div>
    </PageHeaderLayout>
  );
};

export default EmployeeBulkImportPage;