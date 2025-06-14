import React, { useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

const { Dragger } = Upload;

interface UniversalDataUploadProps {
  onDataParsed: (headers: string[], rows: any[][]) => void;
  onLoadingChange: (loading: boolean) => void;
}

const UniversalDataUpload: React.FC<UniversalDataUploadProps> = ({ onDataParsed, onLoadingChange }) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [fileName, setFileName] = useState('');

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx, .xls, .csv',
    beforeUpload: (file) => {
      const isAccepted =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'text/csv';
      if (!isAccepted) {
        message.error(t('payroll:bulk_import.upload.invalid_file_type'));
      }
      return isAccepted || Upload.LIST_IGNORE;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      onLoadingChange(true);
      setFileName((file as File).name);
      try {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            
            if (json.length > 0) {
              const headers = json[0];
              const rows = json.slice(1);
              onDataParsed(headers, rows);
              if (onSuccess) onSuccess('ok');
            } else {
              const errorMsg = t('payroll:bulk_import.upload.empty_file');
              message.error(errorMsg);
              if (onError) onError(new Error(errorMsg));
            }
          } catch (err) {
            console.error('File parsing error:', err);
            const errorMsg = t('payroll:bulk_import.upload.parse_error');
            message.error(errorMsg);
            if(onError) onError(err instanceof Error ? err : new Error(String(err)));
          } finally {
            onLoadingChange(false);
          }
        };
        reader.readAsArrayBuffer(file as Blob);
      } catch (err) {
        console.error('File reading error:', err);
        const errorMsg = t('payroll:bulk_import.upload.read_error');
        message.error(errorMsg);
        if(onError) onError(err instanceof Error ? err : new Error(String(err)));
        onLoadingChange(false);
      }
    },
    onRemove: () => {
      setFileName('');
      onDataParsed([], []); 
    },
    showUploadList: false,
  };

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">{t('payroll:bulk_import.upload.drag_or_click')}</p>
      <p className="ant-upload-hint">
        {t('payroll:bulk_import.upload.hint')}
      </p>
      {fileName && <p style={{ marginTop: '16px', color: '#1890ff' }}>{t('payroll:bulk_import.upload.selected_file')}: {fileName}</p>}
    </Dragger>
  );
};

export default UniversalDataUpload; 