import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Spin, Alert, Modal, Table, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { employeeService } from '../../services/employeeService';
import type { ContractItem, ContractPageResult, CreateContractPayload, UpdateContractPayload } from '../../types';
import { usePermissions } from '../../../../hooks/usePermissions';
import ContractTable from './ContractTable';
import ContractModal from './ContractModal';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

interface ContractInfoTabProps {
  employeeId: string;
}

const ContractInfoTab: React.FC<ContractInfoTabProps> = ({ employeeId }) => {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<ContractItem | null>(null);

  const { hasPermission } = usePermissions();
  const canAddContract = hasPermission('employee_contract:add');
  // Permissions for edit/delete will be checked within ContractTable based on props

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5); // Smaller page size for sub-tabs
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const fetchContracts = useCallback(async (page: number, size: number) => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const result: ContractPageResult = await employeeService.getEmployeeContracts(employeeId, { page, pageSize: size });
      setContracts(result.data);
      setTotalRecords(result.total);
      setCurrentPage(result.page);
      setPageSize(result.pageSize);
    } catch (err: any) {
      console.error('获取合同信息失败:', err);
      const errorMessage = err.message || '获取合同信息失败，请稍后重试。';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchContracts(currentPage, pageSize);
  }, [fetchContracts, currentPage, pageSize]);

  const handleAdd = () => {
    setModalMode('add');
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: ContractItem) => {
    setModalMode('edit');
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (recordId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这份合同记录吗？此操作无法撤销。',
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await employeeService.deleteContractItem(recordId);
          message.success('合同记录删除成功');
          // Refresh data, go to previous page if current page becomes empty
          const newTotalRecords = totalRecords - 1;
          const newTotalPages = Math.ceil(newTotalRecords / pageSize);
          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
          } else if (newTotalRecords === 0) {
            setCurrentPage(1); // Reset to first page if no records left
            setContracts([]);
            setTotalRecords(0);
          } else {
            fetchContracts(currentPage, pageSize); // Refresh current page
          }
        } catch (err: any) {
          console.error('删除合同记录失败:', err);
          const errorMessage = err.message || '删除合同记录失败!';
          message.error(errorMessage);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleModalSubmit = async (values: CreateContractPayload | UpdateContractPayload) => {
    try {
      setLoading(true); // Consider a different loading state for the modal if main table also has one
      if (modalMode === 'edit' && editingRecord) {
        await employeeService.updateContractItem(editingRecord.id, values as UpdateContractPayload);
        message.success('合同信息更新成功');
      } else {
        await employeeService.addContractItem(employeeId, values as CreateContractPayload);
        message.success('合同信息添加成功');
      }
      setIsModalVisible(false);
      setEditingRecord(null);
      // Refresh data - go to first page on add, or stay on current for edit
      if (modalMode === 'add') {
        fetchContracts(1, pageSize); // Go to first page to see new item
        setCurrentPage(1);
      } else {
        fetchContracts(currentPage, pageSize);
      }
    } catch (err: any) {
      console.error('保存合同信息失败:', err);
      const errorMessage = err.message || (modalMode === 'edit' ? '更新失败!' : '添加失败!');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  const handleTableChange = (pagination: any) => {
    // Called by AntD table when pagination changes
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    // fetchContracts will be called by useEffect due to currentPage/pageSize change
  };

  if (loading && !contracts.length && currentPage === 1) {
    return <div style={{ textAlign: 'center', padding: '20px'}}>
      <Spin>
        <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>加载合同信息中...</div>
      </Spin>
    </div>;
  }

  if (error && !contracts.length) {
    return <Alert message="错误" description={error} type="error" showIcon style={{ margin: '16px 0'}} />;
  }

  return (
    <div>
      {canAddContract && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ marginBottom: 16 }}
          disabled={loading} // Disable add button while main table is loading
        >
          添加合同
        </Button>
      )}
      <ContractTable
        dataSource={contracts}
        loading={loading}
        onEdit={handleEdit} // Permission for edit button itself is handled inside ContractTable
        onDelete={handleDelete} // Permission for delete button itself is handled inside ContractTable
        // Pass pagination props if ContractTable is to handle it
        // For now, ContractTable pagination is false, parent handles data fetching based on its state
      />
      {totalRecords > 0 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button onClick={() => fetchContracts(currentPage, pageSize)} disabled={loading} style={{marginRight: 8}}>刷新</Button>
          <Button onClick={() => setCurrentPage(prev => Math.max(1, prev -1 ))} disabled={currentPage === 1 || loading}>上一页</Button>
          <span style={{ margin: '0 8px' }}>第 {currentPage} 页 / 共 {Math.ceil(totalRecords / pageSize)} 页</span>
          <Button onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalRecords / pageSize), prev + 1))} disabled={currentPage === Math.ceil(totalRecords / pageSize) || loading}>下一页</Button>
        </div>
      )}

      {isModalVisible && (
        <ContractModal
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

export default ContractInfoTab;