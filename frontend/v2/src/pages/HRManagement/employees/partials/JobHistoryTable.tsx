import React from 'react';
import { Popconfirm, Space, Tag, Tooltip, Button, Input } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../../../../components/common/EnhancedProTable';
import TableActionButton from '../../../../components/common/TableActionButton';
import type { JobHistoryItem } from '../../types';
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import type { LookupMaps } from '../../../../hooks/useLookupMaps';
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
  const naText = '';
  const dashText = t('employee:detail_page.common_value.dash', '-');

  const columns: ProColumns<JobHistoryItem>[] = [
    {
      title: t('employee:detail_page.job_history_tab.table.column_start_date'),
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      sorter: (a, b) => dayjs(a.effectiveDate).unix() - dayjs(b.effectiveDate).unix(),
      render: (_, record, index) => dayjs(record.effectiveDate).isValid() ? dayjs(record.effectiveDate).format('YYYY-MM-DD'): naText,
      width: 120,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_department'),
      dataIndex: 'department_id',
      key: 'department_id',
      sorter: (a, b) => {
        const deptA = a.department_id ? (lookupMaps?.departmentMap?.get(String(a.department_id)) || '') : '';
        const deptB = b.department_id ? (lookupMaps?.departmentMap?.get(String(b.department_id)) || '') : '';
        return deptA.localeCompare(deptB);
      },
      render: (_, record, index) => record.department_id ? (lookupMaps?.departmentMap?.get(String(record.department_id)) || String(record.department_id)) : naText,
      width: 150,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_job_title'),
      dataIndex: 'personnel_category_id',
      key: 'personnel_category_id',
      sorter: (a, b) => {
        const catA = a.personnel_category_id ? (lookupMaps?.personnelCategoryMap?.get(String(a.personnel_category_id)) || '') : '';
        const catB = b.personnel_category_id ? (lookupMaps?.personnelCategoryMap?.get(String(b.personnel_category_id)) || '') : '';
        return catA.localeCompare(catB);
      },
      render: (_, record, index) => record.personnel_category_id ? (lookupMaps?.personnelCategoryMap?.get(String(record.personnel_category_id)) || String(record.personnel_category_id)) : naText,
      width: 150,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_employment_type'),
      dataIndex: 'employment_type_lookup_value_id',
      key: 'employment_type_lookup_value_id',
      valueType: 'select',
      valueEnum: lookupMaps?.employmentTypeMap 
        ? Object.fromEntries(Array.from(lookupMaps.employmentTypeMap.entries()).map(([id, name]) => [id, { text: name }]))
        : {},
      render: (_, record, index) => {
        const typeText = record.employment_type_lookup_value_id ? (lookupMaps?.employmentTypeMap?.get(record.employment_type_lookup_value_id) || String(record.employment_type_lookup_value_id)) : naText;
        return <Tag>{typeText}</Tag>;
      },
      width: 130,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_salary'),
      dataIndex: 'salary',
      key: 'salary',
      sorter: (a, b) => (a.salary || 0) - (b.salary || 0),
      align: 'right',
      render: (_, record, index) => record.salary ? record.salary.toLocaleString() : naText,
      width: 100,
    },
    {
      title: t('common:label.remarks'),
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (_, record, index) => record.remarks || dashText,
    },
  ];

  if (canEditJobHistory || canDeleteJobHistory) {
    columns.push({
      title: t('common:label.actions'),
      key: 'action',
      align: 'center',
      width: 100,
      fixed: 'right',
      render: (_, record, index) => (
        <Space size="small">
          {canEditJobHistory && (
            <TableActionButton
              actionType="edit"
              onClick={() => onEdit(record)}
              tooltipTitle={t('employee:detail_page.job_history_tab.tooltip_edit_history_param', { id: record.id })}
            />
          )}
          {canDeleteJobHistory && (
            <Popconfirm
              title={t('employee:detail_page.job_history_tab.delete_confirm.content_table')}
              onConfirm={() => onDelete(record.id)}
              okText={t('common:button.confirm')}
              cancelText={t('common:button.cancel')}
            >
              <TableActionButton
                actionType="delete"
                danger
                tooltipTitle={t('employee:detail_page.job_history_tab.tooltip_delete_history_param', { id: record.id })}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return (
    <EnhancedProTable<JobHistoryItem>
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content' }}
      size="small"
      enableAdvancedFeatures={true}
      showToolbar={true}
      search={false}
      title={t('employee:detail_page.job_history_tab.table_title')}
    />
  );
};

export default JobHistoryTable; 