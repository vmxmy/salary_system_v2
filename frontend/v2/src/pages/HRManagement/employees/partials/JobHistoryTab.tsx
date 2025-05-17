import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Spin, Alert, Modal, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ActionButton from '../../../../components/common/ActionButton';
import { employeeService } from '../../../services/employeeService';
import type { JobHistoryItem, JobHistoryPageResult } from '../../types';
import { usePermissions } from '../../../../hooks/usePermissions';
import JobHistoryTable from './JobHistoryTable';
import JobHistoryModal from './JobHistoryModal';

interface JobHistoryTabProps {
  employeeId: string;
}

const JobHistoryTab: React.FC<JobHistoryTabProps> = ({ employeeId }) => {
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
      const result: JobHistoryPageResult = await employeeService.getEmployeeJobHistory(employeeId, { page: 1, pageSize: 1000 });
      setJobHistory(result.data);
    } catch (err: any) {
      console.error('获取岗位历史失败:', err);
      setError('获取岗位历史失败，请稍后重试。');
      message.error(err.message || '获取岗位历史失败!');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

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
      title: '确认删除',
      content: '确定要删除这条岗位历史记录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await employeeService.deleteJobHistoryItem(id);
          message.success('岗位历史记录删除成功');
          fetchJobHistory(); // Refresh data
        } catch (error: any) {
          message.error(error.message || '删除失败');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleModalSubmit = async (values: Omit<JobHistoryItem, 'id' | 'employeeId' | 'departmentName' | 'positionName'>) => {
    try {
      setLoading(true); // Handled by modal, but good for tab context too
      if (modalMode === 'add') {
        await employeeService.addJobHistoryItem(employeeId, values);
        message.success('岗位历史添加成功');
      } else if (editingRecord) {
        await employeeService.updateJobHistoryItem(editingRecord.id, values);
        message.success('岗位历史更新成功');
      }
      setIsModalVisible(false);
      setEditingRecord(null);
      fetchJobHistory(); // Refresh data
    } catch (error: any) {
      // Error message is shown by modal usually, but can have a fallback here
      message.error(error.message || '操作失败，请重试');
      // Do not close modal on error, let user correct it
      // setIsModalVisible(false);
    } finally {
      // setLoading(false); // Modal handles its own internal loading state for submission
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
            加载岗位历史中...
          </div>
        </Spin>
      </div>
    );
  }

  if (error && !jobHistory.length) { // Show error only if there's no data to display
    return <Alert message="错误" description={error} type="error" showIcon style={{ margin: '16px 0'}} />;
  }

  return (
    <div>
      {canAddJobHistory && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ marginBottom: 16 }}
          disabled={loading} // Disable add button while tab is loading data
        >
          添加岗位历史
        </Button>
      )}
      {error && jobHistory.length > 0 && (
         <Alert message="错误" description={error} type="warning" showIcon closable style={{ marginBottom: '16px' }} />
      )}
      <JobHistoryTable
        dataSource={jobHistory}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        // The edit and delete buttons are rendered within JobHistoryTable, so no direct replacement here
      />
      {isModalVisible && (
        <JobHistoryModal
          visible={isModalVisible}
          mode={modalMode}
          initialData={editingRecord || undefined} // Pass undefined if null
          employeeId={employeeId}
          onSubmit={handleModalSubmit} // Modal will handle its own loading state for submission
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
};

export default JobHistoryTab;