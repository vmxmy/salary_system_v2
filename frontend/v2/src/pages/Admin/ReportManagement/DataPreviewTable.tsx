import React from 'react';
import { Table, Spin, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PreviewData } from './types';

interface Props {
  data: PreviewData[];
  loading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  currentPage: number;
  pageSize: number;
  total: number;
}

const DataPreviewTable: React.FC<Props> = ({
  data,
  loading,
  onPageChange,
  currentPage,
  pageSize,
  total,
}) => {
  // Dynamically generate columns based on data keys
  const columns: ColumnsType<PreviewData> = React.useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    const firstItem = data[0];
    return Object.keys(firstItem).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
      className: 'data-cell', // Apply data-cell class
    }));
  }, [data]);

  return (
    <Spin spinning={loading}>
      {data && data.length > 0 ? (
        <Table
          className="preview-table" // Apply preview-table class
          dataSource={data}
          columns={columns}
          rowKey={(record, index) => index as React.Key} // Use index as key if no unique ID
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: onPageChange,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 'max-content' }} // Enable horizontal scrolling for many columns
        />
      ) : (
        !loading && <Empty description="暂无数据可预览" />
      )}
    </Spin>
  );
};

export default DataPreviewTable;