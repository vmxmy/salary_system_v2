import React from 'react';
import { Space, Alert, Table, Badge } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { QueryResultsPanelProps } from './types';

const QueryResultsPanel: React.FC<QueryResultsPanelProps> = ({
  queryResult,
  queryError,
  executing
}) => {
  const { t } = useTranslation('reportManagement');

  // 生成结果表格列
  const getResultColumns = (): ColumnsType<any> => {
    if (!queryResult) return [];
    
    return queryResult.columns.map((column, index) => ({
      title: column,
      dataIndex: index,
      key: index,
      width: 150,
      ellipsis: true,
      render: (value: any) => {
        if (value === null || value === undefined) {
          return <span style={{ color: '#999', fontStyle: 'italic' }}>NULL</span>;
        }
        return String(value);
      }
    }));
  };

  // 渲染结果表格数据
  const getResultData = () => {
    if (!queryResult) return [];
    
    return queryResult.rows.map((row, index) => {
      // 生成唯一键值：使用索引+时间戳+随机字符串
      const rowKey = `row-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        key: rowKey,
        ...row.reduce((acc, value, colIndex) => {
          acc[colIndex] = value;
          return acc;
        }, {} as any)
      };
    });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {queryError ? (
        <Alert
          message={t('customQuery.queryFailed')}
          description={queryError}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      ) : queryResult ? (
        <>
          <Alert
            message={t('customQuery.querySuccess')}
            description={t('customQuery.queryStats', {
              rowCount: queryResult.rowCount,
              time: queryResult.executionTime
            })}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
          <Table
            columns={getResultColumns()}
            dataSource={getResultData()}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => t('customQuery.totalRows', { total })
            }}
            scroll={{ x: 'max-content', y: 300 }}
            size="small"
          />
        </>
      ) : (
        <Alert
          message={t('customQuery.noResults')}
          description={t('customQuery.executeQueryHint')}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      )}
    </Space>
  );
};

export default QueryResultsPanel; 