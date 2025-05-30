import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Empty,
  message
} from 'antd';
import {
  EyeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { DataPreviewTableProps } from './types';
import { dataSourceAPI } from '../../../../api/reports';

const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  dataSourceId,
  fields
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePreviewData = async () => {
    if (!dataSourceId) {
      message.warning('请先保存数据源');
      return;
    }

    try {
      setLoading(true);
      const response = await dataSourceAPI.previewData(dataSourceId, { limit: 100 });
      setPreviewData(response.data);
    } catch (error) {
      message.error('数据预览失败');
    } finally {
      setLoading(false);
    }
  };

  // 构建表格列
  const columns = fields
    .filter(f => f.is_visible)
    .map(field => ({
      title: field.display_name_zh || field.field_name,
      dataIndex: field.field_name,
      key: field.field_name,
      width: 150,
      ellipsis: true
    }));

  return (
    <Card
      title="数据预览"
      extra={
        <Button
          type="primary"
          icon={<EyeOutlined />}
          loading={loading}
          onClick={handlePreviewData}
        >
          刷新预览
        </Button>
      }
    >
      {previewData.length > 0 ? (
        <Table
          dataSource={previewData}
          columns={columns}
          scroll={{ x: true }}
          pagination={{ pageSize: 10 }}
          size="small"
          loading={loading}
          rowKey={(record, index) => index?.toString() || '0'}
        />
      ) : (
        <Empty description="暂无预览数据" />
      )}
    </Card>
  );
};

export default DataPreviewTable; 