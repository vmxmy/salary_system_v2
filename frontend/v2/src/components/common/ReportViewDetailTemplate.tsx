/**
 * 报表视图详情页模板组件
 * @description 专门用于显示报表视图数据的通用模板，使用EnhancedProTable并支持request模式
 */

import React, { useMemo, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Typography,
  message,
  Tag,
  Skeleton,
  Tooltip,
  Dropdown,
  Menu,
} from 'antd';
import { useTranslation } from 'react-i18next';
import EnhancedProTable from './EnhancedProTable';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ExportOutlined, RollbackOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons';
import type { ReportViewQueryResponse } from '../../types/reportView';
import type { SortOrder } from 'antd/es/table/interface';
import { useTableExport, useTableSearch } from './TableUtils';
import type { ExportFormat } from './TableUtils';

const { Text, Title } = Typography;

// 报表视图基础信息接口
export interface ReportViewInfo {
  id: number;
  name: string;
  description?: string;
  view_status: 'draft' | 'created' | 'error';
  category?: string;
  usage_count?: number;
  last_used_at?: string;
  created_at: string;
}

// 从API接收的原始列元数据类型
type ReportColumnMeta = ReportViewQueryResponse['columns'][0];

// ProTable request prop 的函数签名
type ProTableRequestFunction = (
  params: { pageSize?: number; current?: number; [key: string]: any },
  sort: Record<string, SortOrder>,
  filter: Record<string, (string | number)[] | null>
) => Promise<{ data: any[]; success: boolean; total?: number }>;

// 更新后的模板属性接口
export interface ReportViewDetailTemplateProps {
  reportViewInfo: ReportViewInfo;
  proTableRequest: ProTableRequestFunction;
  columnsMeta: ReportViewQueryResponse['columns'];
  initialLoading?: boolean;
  onExport?: (format: ExportFormat) => Promise<void>;
  onBack?: () => void;
  extraActions?: React.ReactNode[];
  showExport?: boolean;
  customTitle?: React.ReactNode;
  customStatusRender?: (status: string) => React.ReactNode;
  translationNamespaces?: string[];
}

// 表格列配置生成函数
const generateReportViewTableColumns = (
  t: (key: string, options?: any) => string,
  columnsMeta: ReportColumnMeta[],
  getColumnSearch: (dataIndex: string) => any
): ProColumns<any>[] => {
  if (!columnsMeta || columnsMeta.length === 0) {
    return [];
  }

  return columnsMeta.map((metaCol) => {
    const proColumn: ProColumns<any> = {
      title: metaCol.title,
      dataIndex: metaCol.dataIndex,
      key: metaCol.key || metaCol.dataIndex,
      ellipsis: true,
      sorter: true,
      filters: metaCol.dataType !== 'boolean',

      render: (valueFromCell: any, record: any, index: number) => {
        const actualValue = record && metaCol.dataIndex && typeof metaCol.dataIndex === 'string'
          ? record[metaCol.dataIndex]
          : valueFromCell;

        if (actualValue === null || actualValue === undefined || String(actualValue).trim() === '') {
          return <span style={{ color: '#bfbfbf' }}>-</span>;
        }

        if (typeof actualValue === 'object' && actualValue !== null) {
          if (actualValue instanceof Date) {
            return metaCol.dataType === 'date'
              ? actualValue.toLocaleDateString('zh-CN')
              : actualValue.toLocaleString('zh-CN');
          }
          try {
            const stringified = JSON.stringify(actualValue);
            if (stringified === '{}' || stringified === '[]') return <span style={{ color: '#bfbfbf' }}>-</span>;
            return stringified.length > 30 ? stringified.substring(0, 27) + '...' : stringified;
          } catch (error) {
            return <span style={{ color: '#ff4d4f', fontStyle: 'italic' }}>[渲染错误]</span>;
          }
        }

        try {
          switch (metaCol.dataType) {
            case 'date':
              return actualValue ? new Date(actualValue).toLocaleDateString('zh-CN') : '-';
            case 'datetime':
              return actualValue ? new Date(actualValue).toLocaleString('zh-CN') : '-';
            case 'number':
              const numVal_fixed = Number(actualValue);
              return isNaN(numVal_fixed) ? String(actualValue) : numVal_fixed.toLocaleString('zh-CN');
            case 'currency':
              const currVal_fixed = Number(actualValue);
              return isNaN(currVal_fixed) ? String(actualValue) : `¥${currVal_fixed.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            case 'boolean':
              if (actualValue === true || String(actualValue).toLowerCase() === 'true') return t('common:boolean.true');
              if (actualValue === false || String(actualValue).toLowerCase() === 'false') return t('common:boolean.false');
              return String(actualValue);
            default:
              return String(actualValue);
          }
        } catch (error) {
          return String(actualValue);
        }
      },
      ...getColumnSearch(metaCol.dataIndex),
    };

    switch (metaCol.dataType) {
      case 'date': proColumn.valueType = 'date'; break;
      case 'datetime': proColumn.valueType = 'dateTime'; break;
      case 'number': proColumn.valueType = 'digit'; break;
      case 'currency': proColumn.valueType = 'money'; break;
      case 'boolean':
        proColumn.valueType = 'select';
        proColumn.filters = [
          { text: t('common:boolean.true'), value: 'true' },
          { text: t('common:boolean.false'), value: 'false' },
        ];
        break;
      default: proColumn.valueType = 'text'; break;
    }
    if (metaCol.dataType !== 'boolean') {
      proColumn.filters = true;
    }
    return proColumn;
  });
};

const defaultStatusRender = (status: string, t: (key: string, options?: any) => string) => {
  const statusConfig: Record<string, {color: string, text: string}> = {
    draft: { color: 'default', text: t('components:auto_text_e88d89') },
    created: { color: 'success', text: t('components:auto_text_e5b7b2') },
    error: { color: 'error', text: t('components:auto_text_e99499') },
  };
  const config = statusConfig[status] || { color: 'default', text: status };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const ReportViewDetailTemplate: React.FC<ReportViewDetailTemplateProps> = ({
  reportViewInfo,
  proTableRequest,
  columnsMeta,
  initialLoading,
  onExport,
  onBack,
  extraActions = [],
  showExport = true,
  customTitle,
  customStatusRender: customStatusRenderProp, // Renamed to avoid conflict
  translationNamespaces = ['reportView', 'common', 'components'], // Added 'components' namespace
}) => {
  const { t } = useTranslation(translationNamespaces);
  const actionRef = useRef<ActionType | null>(null);

  // Use the renamed prop or fallback to the defaultStatusRender
  const resolvedCustomStatusRender = useMemo(() => {
    if (customStatusRenderProp) {
      return (status: string) => customStatusRenderProp(status); // Call the prop if it exists
    }
    return (status: string) => defaultStatusRender(status, t); // Pass t to defaultStatusRender
  }, [customStatusRenderProp, t]);

  const { ExportButton } = useTableExport(
    undefined,
    undefined,
    {
      supportedFormats: ['excel', 'csv'],
      onExportRequest: onExport,
      dropdownButtonText: t('common:button.export'),
    }
  );

  const { getColumnSearch } = useTableSearch();

  const tableColumns = useMemo(() => {
    return generateReportViewTableColumns(t, columnsMeta, getColumnSearch);
  }, [t, columnsMeta, getColumnSearch]);

  const BackButton = () => (
    <Button icon={<RollbackOutlined />} onClick={onBack}>
      {t('common:button.backToList')}
    </Button>
  );

  const renderPageHeader = () => (
    <Card style={{ marginBottom: 16, border: 'none', boxShadow: 'none', padding: '0 12px' }}>
      <Row justify="space-between" align="top">
        <Col xs={24} lg={16} style={{ paddingRight: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space align="center" wrap>
              <Title level={4} style={{ margin: 0, marginRight: 8, wordBreak: 'break-all' }}>
                {customTitle || reportViewInfo.name}
              </Title>
              {resolvedCustomStatusRender(reportViewInfo.view_status)}
            </Space>
            {reportViewInfo.description && (
              <Text type="secondary" style={{ wordBreak: 'break-all' }}>{reportViewInfo.description}</Text>
            )}
            <Space size="middle" wrap style={{ fontSize: '12px', color: '#595959', marginTop: '4px' }}>
              {reportViewInfo.category && (
                <span>{t('reportView:field.category')}: <strong>{reportViewInfo.category}</strong></span>
              )}
              {reportViewInfo.usage_count !== undefined && (
                <span>{t('reportView:field.usageCount')}: <strong>{reportViewInfo.usage_count}</strong></span>
              )}
              {reportViewInfo.last_used_at && (
                <span>{t('reportView:field.lastUsedAt')}: <strong>{new Date(reportViewInfo.last_used_at).toLocaleString('zh-CN')}</strong></span>
              )}
              <span>{t('reportView:field.createdAt')}: <strong>{new Date(reportViewInfo.created_at).toLocaleString('zh-CN')}</strong></span>
            </Space>
          </Space>
        </Col>
        <Col xs={24} lg={8} style={{ textAlign: 'right', marginTop: window.innerWidth < 992 ? 16 : 0 }}>
          <Space wrap>
            {onBack && <BackButton />}
            {extraActions}
          </Space>
        </Col>
      </Row>
    </Card>
  );

  // 检查报表视图状态
  if (reportViewInfo.view_status !== 'created') {
    const statusMessages = {
      'draft': {
        title: t('components:auto_text_e8a786'),
        message: t('components:auto____e6ada4'),
        suggestion: t('components:auto_text_e5908c_suggestion'),
      },
      'error': {
        title: t('components:auto_text_e8a786'),
        message: t('components:auto____e695b0'),
        suggestion: t('components:auto_sql___e8afb7')
      }
    };

    const statusInfo = statusMessages[reportViewInfo.view_status as keyof typeof statusMessages] || {
      title: t('components:auto_text_e8a786'),
      message: t('components:auto__reportviewinfo_view_status__e5bd93'),
      suggestion: t('components:auto___e8afb7')
    };

    return (
      <div style={{ padding: '0px 12px 12px 12px' }}>
        {renderPageHeader()}
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', color: '#faad14', marginBottom: '16px' }}>⚠️</div>
            <Title level={3} style={{ color: '#faad14', marginBottom: '8px' }}>
              {statusInfo.title}
            </Title>
            <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: '8px' }}>
              {statusInfo.message}
            </Text>
            <Text style={{ fontSize: '14px', color: '#999', display: 'block', marginBottom: '24px' }}>
              {statusInfo.suggestion}
            </Text>
            {onBack && (
              <Button type="primary" icon={<RollbackOutlined />} onClick={onBack}>
                {t('common:button.backToList')}
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '0px 12px 12px 12px' }}>
      {renderPageHeader()}
      <EnhancedProTable<any>
        columns={tableColumns}
        actionRef={actionRef}
        request={proTableRequest}
        loading={initialLoading}
        rowKey={(record: any) => record.id ?? record.key ?? JSON.stringify(record)}
        search={false}
        options={{
          reload: () => actionRef.current?.reload(),
          density: true,
          setting: true,
          fullScreen: true,
        }}
        dateFormatter="string"
        headerTitle={false}
        toolBarRender={() => {
          const buttons: React.ReactNode[] = [];
          if (showExport && ExportButton) {
            buttons.push(<ExportButton key="export" />);
          }
          return buttons;
        }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100', '200'],
          showTotal: (total: number, range: [number, number]) => `${t('common:table.paginationTotal', { start: range[0], end: range[1], total })}`,
        }}
        bordered
        scroll={{ x: 'max-content' }}
        cardBordered
      />
    </div>
  );
};

export default ReportViewDetailTemplate;