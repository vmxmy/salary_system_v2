import React, { useState } from 'react';
import { Upload, Button, DatePicker, Space, message, Spin, Alert, Checkbox } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import apiClient from '../services/api'; // Assuming apiClient is configured for file upload/download
import { useTranslation } from 'react-i18next'; // Re-add useTranslation import

const FileConverter: React.FC = () => {
    const { t } = useTranslation(); // Re-add the hook call
    const [payPeriod, setPayPeriod] = useState<Dayjs | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [importToDb, setImportToDb] = useState<boolean>(false);

    const handleUpload = async () => {
        if (!payPeriod) {
            message.error('Please select a Pay Period.');
            return;
        }
        if (fileList.length === 0) {
            message.error('Please select an Excel file to upload.');
            return;
        }

        const formData = new FormData();
        // Antd's Upload component puts the raw file in originFileObj
        const fileToUpload = fileList[0]?.originFileObj;

        // --- Start: Add validation for the file object ---
        console.log("Attempting to upload file object:", fileToUpload);
        if (!(fileToUpload instanceof File)) { // Check if it's actually a File object
            message.error('Could not access the selected file. Please try selecting it again.');
            setError('Invalid file object selected.');
            setUploading(false);
            return;
        }
        // --- End: Add validation ---

        formData.append('file', fileToUpload as Blob); 

        setUploading(true);
        setError(null);

        // Construct URL with pay_period and import_to_db as query parameters
        const formattedPayPeriod = payPeriod.format('YYYY-MM');
        const apiUrl = `/api/convert/excel-to-csv?pay_period=${formattedPayPeriod}&import_to_db=${importToDb}`;

        try {
            const response = await apiClient.post(
                // Use the constructed URL
                apiUrl, 
                formData, 
                {
                    responseType: 'blob', // Important to handle file download
                    headers: {
                        // REMOVE the line below - Let Axios set it automatically for FormData
                        // 'Content-Type': 'multipart/form-data',
                    },
                    // Optional: Add progress tracking if needed
                    // onUploadProgress: progressEvent => { ... }
                }
            );

            // Handle successful file download
            const blob = new Blob([response.data], { type: response.headers['content-type'] || 'text/csv' });
            
            // Extract filename from content-disposition header if available
            let filename = `salary_record_${formattedPayPeriod.replace('-','')}.csv`; // Default filename
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]?)(.*?)\2(; |$))/);
                if (filenameMatch && filenameMatch[3]) {
                    filename = filenameMatch[3];
                }
            }

            // Create a link element, set the download attribute, and click it
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Clean up the link and blob URL
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
            
            // --- Display Status Messages --- START
            const importStatus = response.headers['x-import-status']; // Headers are often lowercased
            const importMessage = response.headers['x-import-message'];
            
            if (importToDb && importStatus) { // Check if import was requested and status header exists
                if (importStatus === 'success') {
                    message.success(`File converted, download started. ${importMessage || 'Database import successful.'}`);
                } else if (importStatus === 'failed') {
                    // Use warning because download succeeded, but import failed
                    message.warning(`File converted, download started. Import failed: ${importMessage || 'Unknown reason.'}`);
                    // Optionally show more detail in the error Alert
                    setError(`Database import failed. Details: ${importMessage || 'See backend logs.'}`);
                } else {
                    // Handle unexpected status or if import was skipped on backend unexpectedly
                    message.warning(`File converted, download started. Import status: ${importStatus}.`);
                }
            } else {
                // Default message if import was not requested or status is missing
                message.success('File converted and download started.');
            }
            // --- Display Status Messages --- END
            
            setFileList([]); // Clear file list after successful upload

        } catch (err: any) {
            console.error("File conversion error:", err);
            let errorDetail: string | React.ReactNode = 'File conversion failed.'; 
            
            const formatErrorDetail = (detail: any): string => {
                if (typeof detail === 'string') {
                    return detail;
                }
                try {
                    return JSON.stringify(detail, null, 2); 
                } catch (e) {
                    return 'Could not parse error details.';
                }
            };

            // Try to parse backend error message if it's returned as JSON blob
            if (err.response && err.response.data instanceof Blob && err.response.data.type === 'application/json') {
                try {
                    const errorJson = JSON.parse(await err.response.data.text());
                    errorDetail = formatErrorDetail(errorJson.detail || errorJson);
                } catch (parseError) {
                    console.error("Could not parse error response blob:", parseError);
                    errorDetail = 'Failed to parse error response from server.';
                }
            } else if (err.response?.data?.detail) {
                errorDetail = formatErrorDetail(err.response.data.detail);
            } else if (err.message) {
                errorDetail = err.message;
            }
            
            setError(typeof errorDetail === 'string' ? errorDetail : 'An unknown error occurred.'); 
            message.error(typeof errorDetail === 'string' ? errorDetail : 'File conversion failed.');
        } finally {
            setUploading(false);
        }
    };

    const props: UploadProps = {
        onRemove: file => {
            setFileList(prevList => {
                const index = prevList.indexOf(file);
                const newFileList = prevList.slice();
                newFileList.splice(index, 1);
                return newFileList;
            });
        },
        beforeUpload: (file): false => { // Explicitly type return as false
            // Basic check for Excel files
            const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
            if (!isExcel) {
                message.error(`${file.name} is not an Excel file (.xlsx or .xls)`);
                setFileList([]); // Clear list if invalid file type
                return false; // Indicate upload should be prevented
            }
            
            // Limit to one file & Create a proper UploadFile object
            // Use file.uid if available, otherwise generate a simple one
            const uploadFile: UploadFile = {
                uid: file.uid || `${file.lastModified}-${file.name}`, // Create a semi-unique ID
                name: file.name,
                status: 'done', // Mark as done since we handle upload manually
                originFileObj: file, // Store the original File object here
                size: file.size,
                type: file.type,
            };

            setFileList([uploadFile]); // Set state with the UploadFile object
           
            return false; // Prevent default antd upload behavior
        },
        fileList, // Control the displayed file list
        maxCount: 1, // Limit to one file
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <h2>{t('fileConverter.title')}</h2>
            
            {error && (
                 <Alert 
                    message={t('fileConverter.errorAlertTitle')} 
                    description={error} 
                    type="error" 
                    showIcon 
                    closable 
                    onClose={() => setError(null)} 
                    style={{ marginBottom: 16 }} 
                />
            )}
            
            <Space wrap>
                 <DatePicker 
                    id="file_converter_pay_period" 
                    aria-label={t('fileConverter.selectPayPeriod')}
                    picker="month" 
                    format="YYYY-MM" 
                    placeholder={t('fileConverter.selectPayPeriod')} 
                    onChange={(date) => setPayPeriod(date)} 
                    value={payPeriod}
                    style={{ width: 160 }}
                 />
                <Upload {...props}>
                    <Button icon={<UploadOutlined />}>{t('fileConverter.selectExcelButton')}</Button>
                </Upload>
                <label htmlFor="file_converter_import_db" style={{ cursor: 'pointer' }}> 
                    <Checkbox
                        id="file_converter_import_db" 
                        checked={importToDb}
                        onChange={(e) => setImportToDb(e.target.checked)}
                        style={{ marginRight: 8 }}
                    />
                    {t('fileConverter.importCheckboxLabel')}
                </label>
                <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={fileList.length === 0 || !payPeriod}
                    loading={uploading}
                    style={{ marginTop: 0 }} 
                >
                    {uploading ? t('fileConverter.convertingButton') : t('fileConverter.startButton')}
                </Button>
            </Space>

            {uploading && <Spin tip={t('fileConverter.spinTip')} style={{ display: 'block', marginTop: '20px' }} />}
            
        </Space>
    );
};

export default FileConverter; 