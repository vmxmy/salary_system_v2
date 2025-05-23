import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Spin, Alert, Modal, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TableActionButton from '../../../../components/common/TableActionButton';
import { employeeService } from '../../../../services/employeeService';
import type { JobHistoryItem, JobHistoryPageResult, CreateJobHistoryPayload, UpdateJobHistoryPayload } from '../../types';
import { usePermissions } from '../../../../hooks/usePermissions';
import JobHistoryTable from './JobHistoryTable';
import JobHistoryModal from './JobHistoryModal';
import { useTranslation } from 'react-i18next';
import { useLookupMaps, type LookupMaps } from '../../../../hooks/useLookupMaps';
import dayjs from 'dayjs';

interface JobHistoryTabProps {
  employeeId: string;
}

const JobHistoryTab: React.FC<JobHistoryTabProps> = ({ employeeId }) => {
  const { t } = useTranslation(['employee', 'common']);
  const { lookupMaps, loadingLookups, errorLookups } = useLookupMaps();
  const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<JobHistoryItem | null>(null);

  const { hasPermission } = usePermissions();
  const canAddJobHistory = hasPermission('employee_job_history:add');
  // Permissions for edit/delete are handled within JobHistoryTable

  // Pagination state - JobHistoryTable handles its own pagination display
  // but we might need to manage it here if fetching is paged. The mock service supports it.
  // For simplicity with the current JobHistoryTable, we'll fetch all and let table paginate client-side.
  // If server-side pagination is strictly needed by JobHistoryTable, this needs adjustment.
  // The mock service getEmployeeJobHistory supports pagination, but JobHistoryTable currently does not request paged data.
  // Let's assume for now the mock service is flexible and can return all if no page params are given,
  // or we fetch with a large page size initially.
  // For now, let's stick to simpler client-side pagination by fetching all job history items.

  const fetchJobHistory = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch all records for client-side pagination in JobHistoryTable by not passing page/pageSize
      // Or pass very large page size if API requires it for "all"
      const result: JobHistoryPageResult = await employeeService.getEmployeeJobHistory(employeeId, { page: 1, pageSize: 100 });
      setJobHistory(result.data);
    } catch (err: any) {
      console.error(t('employee:detail_page.job_history_tab.message.get_history_failed', '获取岗位历史失败:'), err);
      setError(t('employee:detail_page.job_history_tab.message.get_history_failed_retry', '获取岗位历史失败，请稍后重试。'));
      message.error(err.message || t('employee:detail_page.job_history_tab.message.get_history_failed', '获取岗位历史失败!'));
    } finally {
      setLoading(false);
    }
  }, [employeeId, t]);

  useEffect(() => {
    fetchJobHistory();
  }, [fetchJobHistory]);

  const handleAdd = () => {
    setModalMode('add');
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: JobHistoryItem) => {
    setModalMode('edit');
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: t('common:modal.confirm_delete.title', '确认删除'),
      content: t('employee:detail_page.job_history_tab.delete_confirm.content', '确定要删除这条岗位历史记录吗？'),
      okText: t('common:button.confirm', '确认'),
      cancelText: t('common:button.cancel', '取消'),
      onOk: async () => {
        try {
          setLoading(true);
          await employeeService.deleteJobHistoryItem(employeeId, String(id));
          message.success(t('employee:detail_page.job_history_tab.message.delete_success', '岗位历史记录删除成功'));
          fetchJobHistory();
        } catch (error: any) {
          message.error(error.message || t('employee:detail_page.job_history_tab.message.delete_failed', '删除失败'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleModalSubmit = async (formValues: Omit<JobHistoryItem, 'id' | 'employee_id' | 'created_at' | 'updated_at' | 'departmentName' | 'job_title_name'>) => {
    try {
      setLoading(true);
      if (modalMode === 'add') {
        const createPayload: CreateJobHistoryPayload = {
          ...formValues,
          effectiveDate: dayjs(formValues.effectiveDate).isValid() ? dayjs(formValues.effectiveDate).format('YYYY-MM-DD') : '',
        };
        await employeeService.addJobHistoryItem(employeeId, createPayload);
        message.success(t('employee:detail_page.job_history_tab.message.add_success', '岗位历史添加成功'));
      } else if (editingRecord) {
        const updatePayload: UpdateJobHistoryPayload = {
          ...formValues,
          id: editingRecord.id,
          effectiveDate: dayjs(formValues.effectiveDate).isValid() ? dayjs(formValues.effectiveDate).format('YYYY-MM-DD') : undefined,
        };
        await employeeService.updateJobHistoryItem(employeeId, String(editingRecord.id), updatePayload);
        message.success(t('employee:detail_page.job_history_tab.message.update_success', '岗位历史更新成功'));
      }
      setIsModalVisible(false);
      setEditingRecord(null);
      fetchJobHistory();
    } catch (error: any) {
      message.error(error.message || t('common:message.operation_failed_default_retry', '操作失败，请重试'));
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  if (loading && !jobHistory.length) {
    return (
      <div style={{ textAlign: 'center', padding: '20px'}}>
        <Spin>
          <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>
            {t('employee:detail_page.job_history_tab.loading_history', '加载岗位历史中...')}
          </div>
        </Spin>
      </div>
    );
  }

  if (error && !jobHistory.length) {
    return <Alert message={t('common:status.error', '错误')} description={error} type="error" showIcon style={{ margin: '16px 0'}} />;
  }

  return (
    <div>
      {canAddJobHistory && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ marginBottom: 16 }}
          disabled={loading}
        >
          {t('employee:detail_page.job_history_tab.button_add_history', '添加岗位历史')}
        </Button>
      )}
      {error && jobHistory.length > 0 && (
         <Alert message={t('common:status.error', '错误')} description={error} type="warning" showIcon closable style={{ marginBottom: '16px' }} />
      )}
      <JobHistoryTable
        dataSource={jobHistory}
        loading={loading || loadingLookups}
        onEdit={handleEdit}
        onDelete={handleDelete}
        lookupMaps={lookupMaps}
      />
      {isModalVisible && (
        <JobHistoryModal
          visible={isModalVisible}
          mode={modalMode}
          initialData={editingRecord || undefined}
          employeeId={employeeId}
          onSubmit={handleModalSubmit}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
};

export default JobHistoryTab;