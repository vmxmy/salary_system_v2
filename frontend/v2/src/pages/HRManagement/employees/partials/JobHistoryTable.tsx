import React from 'react';
import { Table, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ActionButton from '../../../../components/common/ActionButton';
import type { JobHistoryItem } from '../../types'; // Removed EmploymentType as it will be handled by lookupMap
import dayjs from 'dayjs';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import type { LookupMaps } from '../../../../hooks/useLookupMaps';

const { Text } = Typography;

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

  const columns: ColumnsType<JobHistoryItem> = [
    {
      title: t('employee:detail_page.job_history_tab.table.column_start_date', '生效日期'),
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      sorter: (a, b) => dayjs(a.effectiveDate).valueOf() - dayjs(b.effectiveDate).valueOf(),
      render: (text: string) => dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : naText,
      width: 120,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_department', '部门'),
      dataIndex: 'department_id',
      key: 'department_id',
      sorter: true,
      render: (id?: number) => id ? (lookupMaps?.departmentMap?.get(id) || String(id)) : naText,
      width: 150,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_job_title', '职位'),
      dataIndex: 'job_title_id',
      key: 'job_title_id',
      sorter: true,
      render: (id?: number) => id ? (lookupMaps?.jobTitleMap?.get(id) || String(id)) : naText,
      width: 150,
    },
    {
      title: t('employee:detail_page.job_history_tab.table.column_employment_type', '雇佣类型'),
      dataIndex: 'employment_type_lookup_value_id',
      key: 'employment_type_lookup_value_id',
      sorter: true,
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
      sorter: true,
      align: 'right',
      render: (salary?: number) => salary ? salary.toLocaleString() : naText,
      width: 100,
    },
    {
      title: t('common:label.remarks', '备注'),
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (text?: string) => text || dashText,
    },
  ];

  if (canEditJobHistory || canDeleteJobHistory) {
    columns.push({
      title: t('common:label.actions', '操作'),
      key: 'action',
      align: 'center',
      width: 100,
      render: (_: any, record: JobHistoryItem) => (
        <Space size="small">
          {canEditJobHistory && (
            <ActionButton
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
              <ActionButton
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

  return (
    <Table
      columns={columns}
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
  );
};

export default JobHistoryTable; 