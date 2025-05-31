// 动态表格渲染组件
// 由 PayrollBulkImportPage 拆分

import React, { useMemo } from 'react';
import { Table, Tooltip, Tag, Typography } from 'antd';
import type { DynamicTableProps } from './types';

const { Title } = Typography;

const renderValidationErrors = (errors?: string[]) => {
  if (!errors || errors.length === 0) return <Tag color="green">✔</Tag>;
  return (
    <Tooltip title={<ul style={{margin:0,padding:0}}>{errors.map((e, i) => <li key={i}>{typeof e === 'string' ? e : JSON.stringify(e)}</li>)}</ul>}>
      <Tag color="red">✖</Tag>
    </Tooltip>
  );
};

const DynamicTable: React.FC<DynamicTableProps> = ({ data, getComponentName, t }) => {
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    // 基础列
    const baseColumns = [
      { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
      { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
      { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
      { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
    ];
    // 收集所有收入项字段
    const earningsFields = new Set<string>();
    const deductionsFields = new Set<string>();
    data.forEach(record => {
      if (record.earnings_details) {
        Object.keys(record.earnings_details).forEach(key => earningsFields.add(key));
      }
      if (record.deductions_details) {
        Object.keys(record.deductions_details).forEach(key => deductionsFields.add(key));
      }
    });
    // 安全的数字格式化函数
    const formatCurrency = (value: any): string => {
      if (value == null || value === '') return '-';
      const num = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(num) ? '-' : `¥${num.toFixed(2)}`;
    };
    // 生成收入项列
    const earningsColumns = Array.from(earningsFields).map(field => ({
      title: getComponentName(field, 'earnings'),
      dataIndex: ['earnings_details', field, 'amount'],
      key: `earnings_${field}`,
      width: 120,
      render: (text: any) => formatCurrency(text)
    }));
    // 生成扣除项列
    const deductionsColumns = Array.from(deductionsFields).map(field => ({
      title: getComponentName(field, 'deductions'),
      dataIndex: ['deductions_details', field, 'amount'],
      key: `deductions_${field}`,
      width: 120,
      render: (text: any) => formatCurrency(text)
    }));
    // 汇总列
    const summaryColumns = [
      { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: any) => formatCurrency(text) },
      { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: any) => formatCurrency(text) },
      { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: any) => formatCurrency(text) },
    ];
    // 其他列
    const otherColumns = [
      { title: t('batch_import.table_header.status'), dataIndex: 'status_lookup_value_name', key: 'status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
      { title: t('batch_import.table_header.remarks'), dataIndex: 'remarks', key: 'remarks', width: 200, render: (text: any) => text || '-' },
      {
        title: t('batch_import.table_header.validation_errors'),
        dataIndex: 'validationErrors',
        key: 'validationErrors',
        width: 200,
        render: renderValidationErrors
      }
    ];
    return [...baseColumns, ...earningsColumns, ...deductionsColumns, ...summaryColumns, ...otherColumns];
  }, [data, getComponentName, t]);

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey={record => record._clientId || record.employee_id || Math.random()}
      size="small"
      pagination={false}
      scroll={{ x: 'max-content' }}
      rowClassName={record => record.validationErrors && record.validationErrors.length > 0 ? 'invalidRow' : ''}
    />
  );
};

export default DynamicTable; 