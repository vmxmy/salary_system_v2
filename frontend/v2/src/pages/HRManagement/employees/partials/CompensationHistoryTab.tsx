import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Alert, Modal, Pagination } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { employeeService } from '../../../../services/employeeService';
import type { CompensationItem, CompensationPageResult, CreateCompensationPayload, UpdateCompensationPayload } from '../../types';
import { usePermissions } from '../../../../hooks/usePermissions';
import CompensationTable from './CompensationTable';
import CompensationModal from './CompensationModal';
import { useTranslation } from 'react-i18next';
import { useLookupMaps } from '../../../../hooks/useLookupMaps';

// const { Title } = Typography; // This line will be removed

interface CompensationHistoryTabProps {
  employeeId: string;
}

const DEFAULT_PAGE_SIZE = 5;

const CompensationHistoryTab: React.FC<CompensationHistoryTabProps> = ({ employeeId }) => {
  const { t } = useTranslation(['employee', 'common']);
  const { lookupMaps, loadingLookups } = useLookupMaps();
  const [compensations, setCompensations] = useState<CompensationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<CompensationItem | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const { hasPermission } = usePermissions();
  const canAdd = hasPermission('employee_compensation:add');

  const fetchCompensations = useCallback(async (page: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: CompensationPageResult = await employeeService.getEmployeeCompensationHistory(employeeId, { page, pageSize: size });
      setCompensations(result.data);
      setTotalRecords(result.meta.total || 0);
      setCurrentPage(result.meta.page);
      setPageSize(result.meta.size);
    } catch (err: any) {
      setError(err.message || t('employee:detail_page.compensation_tab.message.get_history_failed_retry', 'Failed to fetch compensation history. Please try again.'));
      setCompensations([]); // Clear data on error
      setTotalRecords(0);
    }
    setLoading(false);
  }, [employeeId, t]);

  useEffect(() => {
    fetchCompensations(currentPage, pageSize);
  }, [fetchCompensations, currentPage, pageSize]);

  const handleAdd = () => {
    if (!canAdd) {
        message.warning(t('employee:detail_page.compensation_tab.message.add_permission_denied', "You don't have permission to add compensation records."));
        return;
    }
    setModalMode('add');
    setEditingRecord(undefined);
    setIsModalVisible(true);
  };

  const handleEdit = (record: CompensationItem) => {
    setModalMode('edit');
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: t('common:modal.confirm_delete.title', 'Confirm Delete'),
      content: t('employee:detail_page.compensation_tab.delete_confirm.content', 'Are you sure you want to delete this compensation record?'),
      okText: t('common:button.delete', 'Delete'),
      okType: 'danger',
      cancelText: t('common:button.cancel', 'Cancel'),
      onOk: async () => {
        try {
          setLoading(true);
          await employeeService.deleteCompensationItem(employeeId, String(id));
          message.success(t('employee:detail_page.compensation_tab.message.delete_success', 'Compensation record deleted successfully!'));
          fetchCompensations(currentPage, pageSize);
        } catch (deleteError: any) {
          message.error(deleteError.message || t('employee:detail_page.compensation_tab.message.delete_failed', 'Failed to delete compensation record.'));
          setLoading(false);
        }
      },
    });
  };

  const handleModalSubmit = async (values: CreateCompensationPayload | UpdateCompensationPayload) => {
    try {
      if (modalMode === 'add') {
        await employeeService.addCompensationItem(employeeId, values as CreateCompensationPayload);
        message.success(t('employee:detail_page.compensation_tab.message.add_success', 'Compensation record added successfully!'));
      } else if (editingRecord) {
        await employeeService.updateCompensationItem(employeeId, String(editingRecord.id), values as UpdateCompensationPayload);
        message.success(t('employee:detail_page.compensation_tab.message.update_success', 'Compensation record updated successfully!'));
      }
      setIsModalVisible(false);
      fetchCompensations(1, pageSize);
    } catch (submitError: any) {
      message.error(submitError.message || t('employee:detail_page.compensation_tab.message.save_failed', 'Failed to save compensation record.'));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(undefined);
  };

  const handlePageChange = (page: number, newPageSize: number) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  if (error) {
    return <Alert message={t('common:status.error', 'Error')} description={error} type="error" showIcon closable onClose={() => setError(null)} />;
  }

  return (
    <div style={{ padding: '1px' }}> {/* Reduced padding */} 
      {canAdd && (
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd} 
          style={{ marginBottom: 16 }}
        >
          {t('employee:detail_page.compensation_tab.button_add_record', 'Add Compensation Record')}
        </Button>
      )}
      {/* <Title level={5} style={{ marginBottom: 16 }}>Compensation History</Title> */} {/* Optional title */}
      <CompensationTable
        dataSource={compensations}
        loading={loading || loadingLookups}
        onEdit={handleEdit}
        onDelete={handleDelete}
        lookupMaps={lookupMaps}
        // The edit and delete buttons are rendered within CompensationTable, so no direct replacement here
      />
      {totalRecords > 0 && (
          <Pagination 
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['5', '10', '20', '50']}
            style={{ marginTop: 16, textAlign: 'right' }}
            size="small"
          />
      )}
      {isModalVisible && (
        <CompensationModal
          visible={isModalVisible}
          mode={modalMode}
          initialData={editingRecord}
          employeeId={employeeId}
          onSubmit={handleModalSubmit}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
};

export default CompensationHistoryTab; 