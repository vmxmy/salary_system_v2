import React from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';
import type { 
  FilterValue, 
  SorterResult,
  TablePaginationConfig 
} from 'antd/lib/table/interface';
import styled from 'styled-components';

const StyledTable = styled(Table)`
  &&& {
    .ant-table-thead > tr > th {
      background-color: #fafafa;
      font-weight: 500;
    }
    
    .ant-table-tbody > tr > td {
      transition: background-color 0.3s;
    }
    
    .ant-table-tbody > tr:hover > td {
      background-color: #f5f5f5;
    }
  }
`;

interface EnhancedTableProps<T> extends TableProps<T> {
  onParamsChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[]
  ) => void;
}

function EnhancedTable<T extends object>({
  onParamsChange,
  ...props
}: EnhancedTableProps<T>) {
  const handleChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[]
  ) => {
    onParamsChange?.(pagination, filters, sorter);
  };

  return (
    <StyledTable
      {...props}
      onChange={handleChange}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        ...props.pagination
      }}
    />
  );
}

export default EnhancedTable;