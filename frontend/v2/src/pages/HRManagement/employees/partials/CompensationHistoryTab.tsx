import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Spin, Alert, Modal, Pagination, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { employeeService } from '../../../../services/employeeService';
import type { CompensationItem, CompensationPageResult, CreateCompensationPayload, UpdateCompensationPayload } from '../../types';
import { usePermissions } from '../../../../hooks/usePermissions';
import CompensationTable from './CompensationTable';
import CompensationModal from './CompensationModal';

const { Title } = Typography;

interface CompensationHistoryTabProps {
  employeeId: string;
}

const DEFAULT_PAGE_SIZE = 5;

const CompensationHistoryTab: React.FC<CompensationHistoryTabProps> = ({ employeeId }) => {
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
      setTotalRecords(result.total);
      setCurrentPage(result.page);
      setPageSize(result.pageSize);
    } catch (err: any) {
      console.error('Error fetching compensation history:', err);
      setError(err.message || 'Failed to fetch compensation history. Please try again.');
      setCompensations([]); // Clear data on error
      setTotalRecords(0);
    }
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    fetchCompensations(currentPage, pageSize);
  }, [fetchCompensations, currentPage, pageSize]);

  const handleAdd = () => {
    if (!canAdd) {
        message.warning("You don't have permission to add compensation records.");
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

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this compensation record?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true); // Show loading on table while deleting
          await employeeService.deleteCompensationItem(id);
          message.success('Compensation record deleted successfully!');
          fetchCompensations(currentPage, pageSize); // Refresh data
        } catch (deleteError: any) {
          message.error(deleteError.message || 'Failed to delete compensation record.');
          console.error('Delete compensation error:', deleteError);
          setLoading(false); // Stop loading on error
        }
      },
    });
  };

  const handleModalSubmit = async (values: CreateCompensationPayload | UpdateCompensationPayload) => {
    try {
      if (modalMode === 'add') {
        await employeeService.addCompensationItem(employeeId, values as CreateCompensationPayload);
        message.success('Compensation record added successfully!');
      } else if (editingRecord) {
        await employeeService.updateCompensationItem(editingRecord.id, values as UpdateCompensationPayload);
        message.success('Compensation record updated successfully!');
      }
      setIsModalVisible(false);
      fetchCompensations(1, pageSize); // Refresh and go to first page after add/edit
    } catch (submitError: any) {
      message.error(submitError.message || 'Failed to save compensation record.');
      console.error('Submit compensation error:', submitError);
      // Keep modal open on error so user can retry or check inputs
      // setLoading(false) is handled in CompensationModal for its own button
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
    return <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} />;
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
          Add Compensation Record
        </Button>
      )}
      {/* <Title level={5} style={{ marginBottom: 16 }}>Compensation History</Title> */} {/* Optional title */} 
      <CompensationTable
        dataSource={compensations}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
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