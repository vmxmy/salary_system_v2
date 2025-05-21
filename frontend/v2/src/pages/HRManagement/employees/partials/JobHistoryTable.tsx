import React from 'react';
import { Table, Popconfirm, Space, Tag, Tooltip, Button, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import TableActionButton from '../../../../components/common/TableActionButton';
import type { JobHistoryItem } from '../../types'; // Removed EmploymentType as it will be handled by lookupMap
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import type { LookupMaps } from '../../../../hooks/useLookupMaps';
import { useTableSearch, useTableExport, useColumnControl, numberSorter, stringSorter, dateSorter } from '../../../../components/common/TableUtils';
import { SearchOutlined } from '@ant-design/icons';


interface JobHistoryTableProps {
  dataSource: JobHistoryItem[];
  loading: boolean;
  onEdit: (item: JobHistoryItem) => void;
  onDelete: (itemId: number) => void;
  lookupMaps: LookupMaps | null;
}

const JobHistoryTable: React.FC<JobHistoryTableProps> = ({ 
  dataSource,
  loading,
  onEdit,
  onDelete,
  lookupMaps
}) => {
  const { t } = useTranslation(['employee', 'common']);
  const { hasPermission } = usePermissions();
  const canEditJobHistory = hasPermission('employee_job_history:edit');
  const canDeleteJobHistory = hasPermission('employee_job_history:delete');
  const naText = t('employee:detail_page.common_value.na', 'N/A');
  const dashText = t('employee:detail_page.common_value.dash', '-');
  
  // 使用表格搜索功能
  const { getColumnSearch } = useTableSearch();

  const columns: ColumnsType<JobHistoryItem> = [
    {
      title: t('employee:detail_page.job_history_tab.table.column_start_date', '生效日期'),
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      sorter: dateSorter<JobHistoryItem>('effectiveDate'),
      sortDirections: ['descend', 'ascend'],
      render: (text: string) => dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : naText,
      width: 120,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_department', '部门'),
      dataIndex: 'department_id',
      key: 'department_id',
      sorter: (a, b) => {
        const deptA = a.department_id ? (lookupMaps?.departmentMap?.get(String(a.department_id)) || '') : '';
        const deptB = b.department_id ? (lookupMaps?.departmentMap?.get(String(b.department_id)) || '') : '';
        return deptA.localeCompare(deptB);
      },
      sortDirections: ['descend', 'ascend'],
      render: (id?: number) => id ? (lookupMaps?.departmentMap?.get(String(id)) || String(id)) : naText,
      width: 150,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => {
        return (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              placeholder={`搜索${t('employee:detail_page.job_history_tab.table.column_department', '部门')}`}
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                搜索
              </Button>
              <Button
                onClick={() => clearFilters && clearFilters()}
                size="small"
                style={{ width: 90 }}
              >
                重置
              </Button>
            </Space>
          </div>
        );
      },
      onFilter: (value, record) => {
        const deptName = record.department_id ? (lookupMaps?.departmentMap?.get(String(record.department_id)) || '') : '';
        return deptName.toLowerCase().includes((value as string).toLowerCase());
      },
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_job_title', '职位'),
      dataIndex: 'personnel_category_id',
      key: 'personnel_category_id',
      sorter: (a, b) => {
        const catA = a.personnel_category_id ? (lookupMaps?.personnelCategoryMap?.get(String(a.personnel_category_id)) || '') : '';
        const catB = b.personnel_category_id ? (lookupMaps?.personnelCategoryMap?.get(String(b.personnel_category_id)) || '') : '';
        return catA.localeCompare(catB);
      },
      sortDirections: ['descend', 'ascend'],
      render: (id?: number) => id ? (lookupMaps?.personnelCategoryMap?.get(String(id)) || String(id)) : naText,
      width: 150,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => {
        return (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              placeholder={`搜索${t('employee:detail_page.job_history_tab.table.column_job_title', '职位')}`}
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                搜索
              </Button>
              <Button
                onClick={() => clearFilters && clearFilters()}
                size="small"
                style={{ width: 90 }}
              >
                重置
              </Button>
            </Space>
          </div>
        );
      },
      onFilter: (value, record) => {
        const catName = record.personnel_category_id ? (lookupMaps?.personnelCategoryMap?.get(String(record.personnel_category_id)) || '') : '';
        return catName.toLowerCase().includes((value as string).toLowerCase());
      },
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_employment_type', '雇佣类型'),
      dataIndex: 'employment_type_lookup_value_id',
      key: 'employment_type_lookup_value_id',
      filters: lookupMaps?.employmentTypeMap 
        ? Array.from(lookupMaps.employmentTypeMap.entries()).map(([id, name]) => ({ text: name, value: id }))
        : [],
      onFilter: (value, record) => record.employment_type_lookup_value_id === value,
      render: (id?: number) => {
        const typeText = id ? (lookupMaps?.employmentTypeMap?.get(id) || String(id)) : naText;
        return <Tag>{typeText}</Tag>;
      },
      width: 130,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_salary', '薪资'),
      dataIndex: 'salary',
      key: 'salary',
      sorter: numberSorter<JobHistoryItem>('salary'),
      sortDirections: ['descend', 'ascend'],
      align: 'right',
      render: (salary?: number) => salary ? salary.toLocaleString() : naText,
      width: 100,
    },
    {
      title: t('common:label.remarks', '备注'),
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      ...getColumnSearch('remarks'),
      render: (text?: string) => text || dashText,
    },
  ];

  if (canEditJobHistory || canDeleteJobHistory) {
    columns.push({
      title: t('common:label.actions', '操作'),
      key: 'action',
      align: 'center',
      width: 100,
      fixed: 'right',
      render: (_: any, record: JobHistoryItem) => (
        <Space size="small">
          {canEditJobHistory && (
            <TableActionButton
              actionType="edit"
              onClick={() => onEdit(record)}
              tooltipTitle={t('employee:detail_page.job_history_tab.tooltip_edit_history_param', `编辑岗位历史 (ID: ${record.id})`, { id: record.id })}
            />
          )}
          {canDeleteJobHistory && (
            <Popconfirm
              title={t('employee:detail_page.job_history_tab.delete_confirm.content_table', '确定删除这条岗位历史记录吗?')}
              onConfirm={() => onDelete(record.id)}
              okText={t('common:button.confirm', '确定')}
              cancelText={t('common:button.cancel', '取消')}
            >
              <TableActionButton
                actionType="delete"
                danger
                tooltipTitle={t('employee:detail_page.job_history_tab.tooltip_delete_history_param', `删除岗位历史 (ID: ${record.id})`, { id: record.id })}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }
  
  // 添加表格导出功能
  const { ExportButton } = useTableExport(
    dataSource || [], 
    columns, 
    {
      filename: t('employee:detail_page.job_history_tab.export.filename', '岗位历史'),
      sheetName: t('employee:detail_page.job_history_tab.export.sheetName', '岗位历史'),
      buttonText: t('employee:detail_page.job_history_tab.export.buttonText', '导出'),
      successMessage: t('employee:detail_page.job_history_tab.export.successMessage', '岗位历史导出成功')
    }
  );
  
  // 添加列控制功能
  const { visibleColumns, ColumnControl } = useColumnControl(
    columns,
    {
      storageKeyPrefix: 'job_history_table',
      buttonText: t('employee:detail_page.job_history_tab.columnControl.buttonText', '列设置'),
      tooltipTitle: t('employee:detail_page.job_history_tab.columnControl.tooltipTitle', '自定义显示列'),
      dropdownTitle: t('employee:detail_page.job_history_tab.columnControl.dropdownTitle', '列显示'),
      resetText: t('employee:detail_page.job_history_tab.columnControl.resetText', '重置'),
      requiredColumns: ['effectiveDate', 'action'] // 生效日期和操作列必须显示
    }
  );
  
  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          {hasPermission('employee_export') && (
            <Tooltip title={t('employee:detail_page.job_history_tab.export.tooltipTitle', '导出到Excel')}>
              <ExportButton />
            </Tooltip>
          )}
          <ColumnControl />
        </Space>
      </div>
      <Table
        columns={visibleColumns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSizeOptions: ['5', '10', '20'],
          showSizeChanger: true,
          defaultPageSize: 5,
          size: 'small',
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </div>
  );
};

export default JobHistoryTable; 