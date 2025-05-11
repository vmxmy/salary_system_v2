import React, { useState, useCallback } from 'react';
import {
  Upload,
  Button,
  Typography,
  Alert,
  Progress,
  Card,
  Spin,
  Modal,
  List,
  Tag,
  App,
  DatePicker,
  Form,
} from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import apiClient from '../services/api';
import { AxiosProgressEvent } from 'axios';
import { Dayjs } from 'dayjs';

const { Title, Paragraph } = Typography;

const FileConverter: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processResult, setProcessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResultModalVisible, setIsResultModalVisible] = useState<boolean>(false);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<Dayjs | null>(null);

  const handleUpload = useCallback(async () => {
    if (fileList.length === 0) {
      messageApi.error('请先选择一个 Excel 文件!');
      return;
    }

    if (!selectedPayPeriod) {
      messageApi.error('请选择工资发放周期!');
      return;
    }

    const payPeriodString = selectedPayPeriod.format('YYYY-MM');

    setUploading(true);
    setUploadProgress(0);
    setProcessResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', fileList[0]);

    const apiUrl = `/api/convert/excel-to-csv?pay_period=${encodeURIComponent(payPeriodString)}`;

    try {
      const response = await apiClient.post(
        apiUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        }
      );

      setProcessResult(response.data);
      messageApi.success(response.data?.message || '文件处理完成!');
      setIsResultModalVisible(true);

    } catch (err: any) {
      console.error('Upload/Processing Error:', err);
      let errorMessage = '文件上传或处理失败。';
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          if (typeof err.response.data.detail === 'string') {
             errorMessage = `错误: ${err.response.data.detail}`;
          } else if (Array.isArray(err.response.data.detail)) {
             const validationErrors = err.response.data.detail.map((e: any) => `${e.loc.join(' -> ')}: ${e.msg}`).join('; ');
             errorMessage = `请求参数错误: ${validationErrors}`;
          } else {
             errorMessage = `错误: ${JSON.stringify(err.response.data.detail)}`;
          }
        } else if (err.response.data && typeof err.response.data === 'string'){
             errorMessage = `错误: ${err.response.data}`;
        } else {
           errorMessage = `服务器错误: ${err.response.status} ${err.response.statusText}`;
        }
        if (err.response.data?.message) {
             errorMessage = `处理失败: ${err.response.data.message}`;
             setProcessResult(err.response.data);
             setIsResultModalVisible(true);
        }
      } else if (err.request) {
        errorMessage = '无法连接到服务器，请检查网络连接。';
      } else {
        errorMessage = `发生意外错误: ${err.message}`;
      }
      setError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [fileList, messageApi, selectedPayPeriod]);

  const props = {
    onRemove: (file: any) => {
      setFileList((prevList) => {
        const index = prevList.indexOf(file);
        const newFileList = prevList.slice();
        newFileList.splice(index, 1);
        return newFileList;
      });
      setProcessResult(null);
      setError(null);
    },
    beforeUpload: (file: any) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        messageApi.error(`${file.name} 不是一个有效的 Excel 文件`);
        setError(`${file.name} 不是一个有效的 Excel 文件`);
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      setProcessResult(null);
      setError(null);
      return false;
    },
    fileList,
    maxCount: 1,
  };

  const handleModalClose = () => {
      setIsResultModalVisible(false);
  };

  const renderSheetResult = (item: any) => {
      let tagColor = 'default';
      let icon = null;
      if (item.status === 'success') {
          tagColor = 'success';
          icon = <CheckCircleOutlined />;
      } else if (item.status === 'error') {
          tagColor = 'error';
          icon = <CloseCircleOutlined />;
      } else if (item.status === 'warning') {
          tagColor = 'warning';
          icon = <WarningOutlined />;
      }

      return (
          <List.Item>
              <List.Item.Meta
                  avatar={<Tag color={tagColor} icon={icon} style={{ marginRight: 8 }} >{item.status.toUpperCase()}</Tag>}
                  title={`工作表: ${item.sheet}`}
                  description={item.message}
              />
              {item.details && Object.keys(item.details).length > 0 && (
                <div>
                  {item.details.missing_required && item.details.missing_required.length > 0 && (
                    <p><strong>缺少必需列:</strong> {item.details.missing_required.join(', ')}</p>
                  )}
                  {item.details.unexpected_columns && item.details.unexpected_columns.length > 0 && (
                    <p><strong>发现非预期列:</strong> {item.details.unexpected_columns.join(', ')}</p>
                  )}
                  {item.details.missing_employee_ids && item.details.missing_employee_ids.length > 0 && (
                      <p><strong>员工不存在 (ID):</strong> {item.details.missing_employee_ids.join(', ')}</p>
                  )}
                </div>
              )}
          </List.Item>
      );
  };


  return (
    <>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>工资数据导入</Typography.Title>
      <Card variant="borderless">
      <Paragraph>
        请选择包含工资明细的 Excel 文件 (.xlsx 或 .xls) 进行处理和导入。
        系统将自动验证数据、映射字段并将其导入到暂存表中。
      </Paragraph>

      <Form.Item 
        label="工资发放周期"
        required
        style={{ marginBottom: 16 }}
      >
          <DatePicker 
              picker="month" 
              onChange={(date) => setSelectedPayPeriod(date)} 
              value={selectedPayPeriod}
              placeholder="选择月份"
              style={{ width: '200px' }} 
              format="YYYY-MM" 
          />
      </Form.Item>

      <Upload {...props}>
        <Button icon={<UploadOutlined />} disabled={uploading}>
          选择 Excel 文件
        </Button>
      </Upload>

      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0 || uploading || !selectedPayPeriod}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? '正在处理...' : '开始处理与导入'}
      </Button>

      {uploading && (
        <Progress percent={uploadProgress} style={{ marginTop: '16px' }} />
      )}

      {error && !uploading && (
        <Alert message={error} type="error" showIcon style={{ marginTop: '16px' }} />
      )}

      <Modal
          title="文件处理结果"
          open={isResultModalVisible}
          onOk={handleModalClose}
          onCancel={handleModalClose}
          footer={[
              <Button key="back" onClick={handleModalClose}>
                  关闭
              </Button>,
          ]}
          width={700}
       >
            {processResult ? (
                <Spin spinning={uploading}>
                     <Paragraph>{processResult.message}</Paragraph>
                     {processResult.batch_id && <Paragraph>批次 ID: {processResult.batch_id}</Paragraph>}
                     {processResult.sheet_results && processResult.sheet_results.length > 0 && (
                         <>
                             <Title level={5}>各工作表处理详情:</Title>
                             <List
                                 itemLayout="horizontal"
                                 dataSource={processResult.sheet_results}
                                 renderItem={renderSheetResult}
                                 bordered
                                 size="small"
                             />
                         </>
                     )}
                </Spin>
             ) : (
                 <Paragraph>没有可显示的处理结果。</Paragraph>
             )}
       </Modal>

      </Card>
    </>
  );
};

export default FileConverter; 