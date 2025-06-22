import React, { useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import type { UploadProps } from 'antd';
// ExcelJS将通过动态导入使用
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
        // 动态导入ExcelJS
        const ExcelJS = await import('exceljs');
        
        const fileObj = file as File;
        let json: any[][] = [];
        
        // 判断文件类型
        if (fileObj.type === 'text/csv' || fileObj.name.toLowerCase().endsWith('.csv')) {
          // CSV文件处理
          const text = await fileObj.text();
          const lines = text.split('\n').filter(line => line.trim());
          json = lines.map(line => {
            // 简单的CSV解析，支持逗号和制表符分隔
            if (line.includes('\t')) {
              return line.split('\t');
            } else {
              return line.split(',');
            }
          });
        } else {
          // Excel文件处理
          const workbook = new ExcelJS.Workbook();
          const arrayBuffer = await fileObj.arrayBuffer();
          await workbook.xlsx.load(arrayBuffer);
          
          // 获取第一个工作表
          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) {
            throw new Error('Excel文件中没有找到工作表');
          }
          
          // 将工作表转换为JSON数组
          json = [];
          worksheet.eachRow((row, rowNumber) => {
            const rowData = row.values as any[];
            // ExcelJS的row.values第一个元素是undefined，需要去掉
            json.push(rowData.slice(1));
          });
        }
        
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
        console.error('File processing error:', err);
        const errorMsg = t('payroll:bulk_import.upload.parse_error');
        message.error(errorMsg);
        if(onError) onError(err instanceof Error ? err : new Error(String(err)));
      } finally {
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