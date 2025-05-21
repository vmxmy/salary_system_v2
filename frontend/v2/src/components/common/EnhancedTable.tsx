import React from 'react';
import { Table } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { 
  FilterValue, 
  SorterResult,
  TableCurrentDataSource
} from 'antd/lib/table/interface';
import styled from 'styled-components';

// 1. 直接样式化 Ant Design 的 Table 组件
const BaseStyledAntDTable = styled(Table)`
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

// 2. (关键步骤) 使用类型断言使其成为一个可接受泛型的组件
const StyledTable = BaseStyledAntDTable as <T extends Record<string, any> = Record<string, any>>(
  props: TableProps<T>
) => React.ReactElement<TableProps<T>>;

interface EnhancedTableProps<T extends Record<string, any>> extends Omit<TableProps<T>, 'onChange'> {
  onParamsChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[],
    extra: TableCurrentDataSource<T>
  ) => void;
}

function EnhancedTable<T extends Record<string, any>>({
  onParamsChange,
  ...restProps
}: EnhancedTableProps<T>) {
  const handleChange: TableProps<T>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    onParamsChange?.(pagination, filters, sorter, extra);
  };

  return (
    // 现在使用类型断言后的 StyledTable
    <StyledTable<T> 
      {...restProps}
      onChange={handleChange}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        ...restProps.pagination,
      }}
    />
  );
}

export default EnhancedTable;