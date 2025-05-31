import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Spin, Alert, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { employeeService } from '../../../../services/employeeService';
import type { ContractItem, ContractPageResult, CreateContractPayload, UpdateContractPayload } from '../../types';
import { usePermissions } from '../../../../hooks/usePermissions';
import ContractTable from './ContractTable';
import ContractModal from './ContractModal';
import { useTranslation } from 'react-i18next';
import { useLookupMaps } from '../../../../hooks/useLookupMaps';

interface ContractInfoTabProps {
  employeeId: string;
}

const ContractInfoTab: React.FC<ContractInfoTabProps> = ({ employeeId }) => {
  const { t } = useTranslation(['employee', 'common']);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { lookupMaps, loadingLookups } = useLookupMaps();

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
      setTotalRecords(result.meta.total || 0);
      setCurrentPage(result.meta.page);
      setPageSize(result.meta.size);
    } catch (err: any) {
      console.error({t('hr:auto___e88eb7')}, err);
      const errorMessage = err.message || t('employee:detail_page.contracts_tab.message.get_contracts_failed_retry', {t('hr:auto____e88eb7')});
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [employeeId, t]);

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

  const handleDelete = async (recordId: number) => {
    Modal.confirm({
      title: t('common:modal.confirm_delete.title', {t('hr:auto_text_e7a1ae')}),
      content: t('employee:detail_page.contracts_tab.delete_confirm.content', {t('hr:auto____e7a1ae')}),
      okText: t('common:modal.confirm_delete.ok_text', {t('hr:auto_text_e7a1ae')}),
      cancelText: t('common:button.cancel', {t('hr:auto_text_e58f96')}),
      onOk: async () => {
        try {
          setLoading(true);
          await employeeService.deleteContractItem(employeeId, String(recordId));
          message.success(t('employee:detail_page.contracts_tab.message.delete_success', {t('hr:auto_text_e59088')}));
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
          console.error({t('hr:auto___e588a0')}, err);
          const errorMessage = err.message || t('employee:detail_page.contracts_tab.message.delete_failed', {t('hr:auto___e588a0')});
          message.error(errorMessage);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleModalSubmit = async (values: CreateContractPayload | UpdateContractPayload) => {
    try {
      setLoading(true);
      if (modalMode === 'edit' && editingRecord) {
        await employeeService.updateContractItem(employeeId, String(editingRecord.id), values as UpdateContractPayload);
        message.success(t('employee:detail_page.contracts_tab.message.update_success', {t('hr:auto_text_e59088')}));
      } else {
        await employeeService.addContractItem(employeeId, values as CreateContractPayload);
        message.success(t('employee:detail_page.contracts_tab.message.add_success', {t('hr:auto_text_e59088')}));
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
      console.error({t('hr:auto___e4bf9d')}, err);
      const errorMessage = err.message || (modalMode === 'edit' ? t('employee:detail_page.contracts_tab.message.update_failed', {t('hr:auto___e69bb4')}) : t('employee:detail_page.contracts_tab.message.add_failed', {t('hr:auto___e6b7bb')}));
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };


  if (loading && !contracts.length && currentPage === 1) {
    return <div style={{ textAlign: 'center', padding: '20px'}}>
      <Spin>
        <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>{t('employee:detail_page.contracts_tab.loading', {t('hr:auto___e58aa0')})}</div>
      </Spin>
    </div>;
  }

  if (error && !contracts.length) {
    return <Alert message={t('common:status.error', {t('hr:auto_text_e99499')})} description={error} type="error" showIcon style={{ margin: '16px 0'}} />;
  }

  const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / pageSize) : 1;

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
          {t('employee:detail_page.contracts_tab.button_add_contract', {t('hr:auto_text_e6b7bb')})}
        </Button>
      )}
      <ContractTable
        dataSource={contracts}
        loading={loading || loadingLookups }
        lookupMaps={lookupMaps}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {totalRecords > 0 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button onClick={() => fetchContracts(currentPage, pageSize)} disabled={loading} style={{marginRight: 8}}>{t('common:button.refresh', {t('hr:auto_text_e588b7')})}</Button>
          <Button onClick={() => setCurrentPage(prev => Math.max(1, prev -1 ))} disabled={currentPage === 1 || loading}>{t('common:pagination.previous_page', {t('hr:auto_text_e4b88a')})}</Button>
          <span style={{ margin: '0 8px' }}>{t('common:pagination.page_info', {t('hr:auto__currentpage___totalpages__e7acac')}, { currentPage, totalPages })}</span>
          <Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || loading || totalPages === 0}>{t('common:pagination.next_page', {t('hr:auto_text_e4b88b')})}</Button>
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