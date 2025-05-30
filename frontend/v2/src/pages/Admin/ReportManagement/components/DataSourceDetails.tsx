import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Button,
  Tabs,
  Table,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  Alert,
  Spin
} from 'antd';
import {
  DatabaseOutlined,
  FieldTimeOutlined,
  UserOutlined,
  BarChartOutlined,
  EyeOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ReportDataSource, DataSourceField } from '../types';
import { dataSourceAPI } from '../../../../api/reports';

const { Title, Text } = Typography;

interface DataSourceDetailsProps {
  visible: boolean;
  dataSource: ReportDataSource | null;
  onClose: () => void;
}

const DataSourceDetails: React.FC<DataSourceDetailsProps> = ({
  visible,
  dataSource,
  onClose
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [fields, setFields] = useState<DataSourceField[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && dataSource?.id) {
      loadDataSourceDetails();
    }
  }, [visible, dataSource]);

  const loadDataSourceDetails = async () => {
    if (!dataSource?.id) return;
    
    setLoading(true);
    try {
      // 并行加载字段、统计信息和访问日志
      const [fieldsResponse, statisticsResponse, logsResponse] = await Promise.all([
        dataSourceAPI.getDataSourceFields(dataSource.id),
        dataSourceAPI.getStatistics(dataSource.id),
        dataSourceAPI.getAccessLogs(dataSource.id, { limit: 10 })
      ]);

      setFields(fieldsResponse.data);
      setStatistics(statisticsResponse.data);
      setAccessLogs(logsResponse.data);
    } catch (error) {
      console.error('Failed to load data source details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewData = async () => {
    if (!dataSource?.id) return;
    
    try {
      const response = await dataSourceAPI.previewData(dataSource.id, { limit: 10 });
      console.log('Preview data:', response.data);
      // 这里可以打开一个新的模态框显示预览数据
    } catch (error) {
      console.error('Failed to preview data:', error);
    }
  };

  const handleSyncFields = async () => {
    if (!dataSource?.id) return;
    
    try {
      await dataSourceAPI.syncFields(dataSource.id);
      loadDataSourceDetails(); // 重新加载数据
    } catch (error) {
      console.error('Failed to sync fields:', error);
    }
  };

  const getConnectionTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      postgresql: 'blue',
      mysql: 'orange',
      sqlserver: 'purple',
      oracle: 'red',
      sqlite: 'green',
    };
    return colorMap[type] || 'default';
  };

  const getAccessLevelColor = (level: string) => {
    const colorMap: Record<string, string> = {
      public: 'green',
      private: 'orange',
      restricted: 'red',
    };
    return colorMap[level] || 'default';
  };

  const fieldsColumns = [
    {
      title: t('fieldName'),
      dataIndex: 'field_name',
      key: 'field_name',
      width: 150,
    },
    {
      title: t('fieldType'),
      dataIndex: 'field_type',
      key: 'field_type',
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: t('displayName'),
      key: 'display_name',
      width: 150,
      render: (record: DataSourceField) => 
        record.display_name_zh || record.field_alias || record.field_name,
    },
    {
      title: t('properties'),
      key: 'properties',
      render: (record: DataSourceField) => (
        <Space size={[0, 8]} wrap>
          {record.is_primary_key && <Tag color="red">{t('primaryKey')}</Tag>}
          {record.is_nullable && <Tag color="orange">{t('nullable')}</Tag>}
          {record.is_indexed && <Tag color="green">{t('indexed')}</Tag>}
          {record.is_searchable && <Tag color="blue">{t('searchable')}</Tag>}
        </Space>
      ),
    },
  ];

  const accessLogsColumns = [
    {
      title: t('accessTime'),
      dataIndex: 'accessed_at',
      key: 'accessed_at',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: t('accessType'),
      dataIndex: 'access_type',
      key: 'access_type',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: t('result'),
      dataIndex: 'access_result',
      key: 'access_result',
      width: 100,
      render: (result: string) => (
        <Tag color={result === 'success' ? 'green' : 'red'}>
          {result}
        </Tag>
      ),
    },
    {
      title: t('executionTime'),
      dataIndex: 'execution_time',
      key: 'execution_time',
      width: 120,
      render: (time: number) => time ? `${time}ms` : '-',
    },
  ];

  if (!dataSource) {
    return null;
  }

  // 定义 Tabs 的 items
  const tabItems = [
    {
      key: 'basic',
      label: t('basicInfo'),
      children: (
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('dataSourceCode')} span={2}>
            <Text code>{dataSource.code}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('dataSourceName')} span={2}>
            <Text strong>{dataSource.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('description')} span={2}>
            {dataSource.description || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('category')}>
            <Tag color="blue">{dataSource.category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('connectionType')}>
            <Tag color={getConnectionTypeColor(dataSource.connection_type)}>
              {dataSource.connection_type?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('sourceType')}>
            <Tag color="green">{dataSource.source_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('accessLevel')}>
            <Tag color={getAccessLevelColor(dataSource.access_level || 'public')}>
              {dataSource.access_level || 'public'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('schemaName')}>
            <Text code>{dataSource.schema_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('tableName')}>
            <Text code>{dataSource.table_name || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('status')}>
            <Tag color={dataSource.is_active ? 'green' : 'red'}>
              {dataSource.is_active ? t('active') : t('inactive')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('cacheEnabled')}>
            <Tag color={dataSource.cache_enabled ? 'green' : 'orange'}>
              {dataSource.cache_enabled ? t('enabled') : t('disabled')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('createdAt')}>
            {dataSource.created_at ? new Date(dataSource.created_at).toLocaleString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('updatedAt')}>
            {dataSource.updated_at ? new Date(dataSource.updated_at).toLocaleString() : '-'}
          </Descriptions.Item>
          {dataSource.tags && dataSource.tags.length > 0 && (
            <Descriptions.Item label={t('tags')} span={2}>
              <Space size={[0, 8]} wrap>
                {dataSource.tags.map((tag, index) => (
                  <Tag key={index} color="cyan">{tag}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      )
    },
    {
      key: 'fields',
      label: t('fields'),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleSyncFields}
              loading={loading}
            >
              {t('syncFields')}
            </Button>
          </div>
          <Table
            columns={fieldsColumns}
            dataSource={fields}
            rowKey="field_name"
            size="small"
            pagination={{ pageSize: 10 }}
            loading={loading}
          />
        </div>
      )
    },
    {
      key: 'statistics',
      label: t('statistics'),
      children: (
        <Spin spinning={loading}>
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title={t('totalRecords')}
                  value={statistics?.total_records || 0}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={t('fieldCount')}
                  value={dataSource.field_count || 0}
                  prefix={<FieldTimeOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={t('usageCount')}
                  value={dataSource.usage_count || 0}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={t('lastUsed')}
                  value={dataSource.last_used_at ? new Date(dataSource.last_used_at).toLocaleDateString() : '-'}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          </Row>
          
          {statistics?.data_size && (
            <Card title={t('dataSize')} style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title={t('totalSize')}
                    value={statistics.data_size.total}
                    suffix="MB"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('indexSize')}
                    value={statistics.data_size.index}
                    suffix="MB"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('dataSize')}
                    value={statistics.data_size.data}
                    suffix="MB"
                  />
                </Col>
              </Row>
            </Card>
          )}
        </Spin>
      )
    },
    {
      key: 'logs',
      label: t('accessLogs'),
      children: (
        <Table
          columns={accessLogsColumns}
          dataSource={accessLogs}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      )
    },
    {
      key: 'performance',
      label: t('performanceConfig'),
      children: (
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('cacheEnabled')}>
            <Tag color={dataSource.cache_enabled ? 'green' : 'orange'}>
              {dataSource.cache_enabled ? t('enabled') : t('disabled')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('cacheDuration')}>
            {dataSource.cache_duration ? `${dataSource.cache_duration} ${t('seconds')}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('maxRows')}>
            {dataSource.max_rows || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('lastSync')}>
            {dataSource.last_sync_at ? new Date(dataSource.last_sync_at).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      )
    }
  ];

  return (
    <Drawer
      title={
        <Space>
          <DatabaseOutlined />
          {dataSource.name}
        </Space>
      }
      width={800}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={handlePreviewData}
          >
            {t('previewData')}
          </Button>
        </Space>
      }
    >
      <Tabs defaultActiveKey="basic" items={tabItems} />
    </Drawer>
  );
};

export default DataSourceDetails; 