import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { App, Button, Card, Descriptions, Space, Tag, Typography, Breadcrumb, Tabs, Spin } from 'antd';
import type { TabsProps } from 'antd';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import { reportConfigApi } from '../../../api/reportConfigApi';
import type { DataSource, DataSourceField } from '../../../api/reportConfigApi';
import StandardDetailPageTemplate from '../../../components/common/StandardDetailPageTemplate';
import { EditOutlined, SyncOutlined, TableOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { BreadcrumbItem } from '../../../components/common/StandardDetailPageTemplate';

const DataSourceDetailPage: React.FC = () => {
  const { dataSourceId } = useParams<{ dataSourceId: string }>();
  const { t } = useTranslation(['reportManagement', 'common', 'pageTitle']);
  const { message } = App.useApp();

  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDataSource = useCallback(async () => {
    if (dataSourceId) {
      try {
        setLoading(true);
        const data = await reportConfigApi.getDataSource(parseInt(dataSourceId, 10));
        setDataSource(data);
      } catch (error: any) {
        message.error(t('data_source.load_detail_error', { message: error.message }));
      } finally {
        setLoading(false);
      }
    }
  }, [dataSourceId, t, message]);

  useEffect(() => {
    fetchDataSource();
  }, [fetchDataSource]);

  const getRowKey = useCallback((record: any, index?: number) => {
    const pkField = dataSource?.fields?.find(f => f.is_primary_key);
    if (pkField && record[pkField.field_name] !== undefined && record[pkField.field_name] !== null) {
      return record[pkField.field_name];
    }
    return index;
  }, [dataSource]);

  const structureColumns: ProColumns<DataSourceField>[] = [
    { title: t('data_source.field_column.name'), dataIndex: 'field_name', key: 'field_name', render: (text, record) => <Space><Typography.Text strong>{text}</Typography.Text>{record.is_primary_key && <Tag color="gold">PK</Tag>}</Space> },
    { title: t('data_source.field_column.type'), dataIndex: 'data_type', key: 'data_type' },
    { title: t('data_source.field_column.alias'), dataIndex: 'field_alias', key: 'field_alias' },
    { title: t('data_source.field_column.description'), dataIndex: 'description', key: 'description', ellipsis: true },
    { title: t('data_source.field_column.visible'), dataIndex: 'is_visible', key: 'is_visible', render: (visible) => <Tag color={visible ? 'green' : 'red'}>{visible ? t('common:yes') : t('common:no')}</Tag> },
  ];

  const previewColumns: ProColumns<any>[] = useMemo(() => {
    if (!dataSource?.fields) return [];
    return dataSource.fields
      .filter(f => f.is_visible)
      .map(field => ({
        title: field.field_alias || field.field_name,
        dataIndex: field.field_name,
        key: field.field_name,
        sorter: true,
        ellipsis: true,
      }));
  }, [dataSource]);

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => [
    { key: 'report-config', title: <Link to="/admin/report-config">{t('pageTitle:report_config_management')}</Link> },
    { key: 'datasource-detail', title: dataSource?.name || t('data_source.detail_page_title') },
  ], [dataSource, t]);
  
  const tabItems: TabsProps['items'] = [
    {
      key: 'structure',
      label: (
        <span>
          <DatabaseOutlined />
          {t('data_source.tabs.structure', '结构信息')}
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Descriptions title={t('data_source.basic_info_title', '基本信息')} bordered column={2}>
                    <Descriptions.Item label={t('data_source.form.name_label')}>{dataSource?.name}</Descriptions.Item>
                    <Descriptions.Item label={t('data_source.form.code_label')}>{dataSource?.code}</Descriptions.Item>
                    <Descriptions.Item label={t('data_source.form.source_type_label')}>{dataSource?.source_type}</Descriptions.Item>
                    <Descriptions.Item label={t('data_source.form.schema_name_label')}>{dataSource?.schema_name}</Descriptions.Item>
                    <Descriptions.Item label={t('data_source.column.table_name')} span={2}>{dataSource?.table_name || dataSource?.view_name}</Descriptions.Item>
                    <Descriptions.Item label={t('data_source.form.description_label')} span={2}>{dataSource?.description}</Descriptions.Item>
                </Descriptions>
            </Card>
            <ProTable<DataSourceField>
                columns={structureColumns}
                dataSource={dataSource?.fields}
                rowKey="id"
                search={false}
                pagination={{ pageSize: 15 }}
                headerTitle={t('data_source.fields_list_title', '字段列表')}
                toolBarRender={false}
            />
        </Space>
      ),
    },
    {
      key: 'preview',
      label: (
        <span>
          <TableOutlined />
          {t('data_source.tabs.preview', '数据预览')}
        </span>
      ),
      children: (
        previewColumns && previewColumns.length > 0 ? (
          <ProTable
            columns={previewColumns}
            rowKey={getRowKey}
            request={async (params, sorter, filter) => {
              if (!dataSourceId) return { data: [], success: false };
              const { current = 1, pageSize = 15 } = params;
              
              const sorting = Object.entries(sorter)
                .filter(([, order]) => !!order)
                .map(([field, order]) => ({
                  field,
                  direction: order === 'ascend' ? 'asc' : 'desc',
                }));

              try {
                const result = await reportConfigApi.getDataSourcePreview(parseInt(dataSourceId), {
                  skip: (current - 1) * pageSize,
                  limit: pageSize,
                  sorting: sorting.length > 0 ? sorting : undefined,
                  filters: filter,
                });
                return {
                  data: result.items,
                  success: true,
                  total: result.total,
                };
              } catch (error: any) {
                message.error(t('data_source.load_preview_error', { message: error.message }));
                return { data: [], success: false };
              }
            }}
            pagination={{ pageSize: 15 }}
            bordered
            headerTitle={t('data_source.preview_table_title', '数据预览')}
          />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Spin tip={t('data_source.loading_structure', '正在加载表格结构...')} />
          </div>
        )
      ),
    },
  ];

  return (
    <StandardDetailPageTemplate
      pageTitleKey={dataSource?.name || 'data_source.detail_page_title'}
      translationNamespaces={['reportManagement', 'common', 'pageTitle']}
      isLoading={loading}
      data={dataSource}
      breadcrumbs={breadcrumbs}
      headerActions={
        <Space>
            <Button icon={<SyncOutlined />} onClick={fetchDataSource}>
                {t('common:button.sync', '同步')}
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => { /* TODO: Edit Logic */ }}>
                {t('common:button.edit', '编辑')}
            </Button>
        </Space>
      }
    >
        <Tabs defaultActiveKey="structure" items={tabItems} />
    </StandardDetailPageTemplate>
  );
};

export default DataSourceDetailPage; 