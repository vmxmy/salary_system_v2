import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Space } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';

import StandardListPageTemplate, { QueryParams } from '../../components/common/StandardListPageTemplate';
import type { Role } from '../../api/types';
import { getRoles, deleteRole } from '../../api/roles';
import PermissionGuard from '../../components/common/PermissionGuard';
import { stringSorter, numberSorter, useTableSearch } from '../../components/common/TableUtils';
import TableActionButton from '../../components/common/TableActionButton';
import RoleFormModal from './components/RoleFormModal';

// 角色管理权限钩子
const useRolePermissions = () => {
  return useMemo(() => ({
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  }), []);
};

// 生成角色表格列配置的函数
const generateRoleTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof Role) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (role: Role) => void,
  onDelete: (roleId: string) => void,
  onViewDetails: (roleId: string) => void
): ProColumns<Role>[] => {
  const columns: ProColumns<Role>[] = [
    {
      title: t('table.column.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      valueType: 'digit',
      search: false,
    },
    {
      title: t('table.column.code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      sorter: (a, b) => a.code.localeCompare(b.code),
      valueType: 'text',
      ...getColumnSearch('code'),
    },
    {
      title: t('table.column.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      valueType: 'text',
      ...getColumnSearch('name'),
    },
    {
      title: t('table.column.permissions'),
      dataIndex: 'permissions',
      key: 'permissions',
      width: 300,
      search: false,
      render: (_, record) => {
        if (!record.permissions || record.permissions.length === 0) return '-';
        return record.permissions.map(p => p.code).join(', ');
      },
    },
    {
      title: t('common:action.title'),
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <TableActionButton
            actionType="edit"
            onClick={() => onEdit(record)}
            tooltipTitle={t('tooltip.edit_role')}
          />
          <TableActionButton
            actionType="delete"
            danger
            onClick={() => onDelete(String(record.id))}
            tooltipTitle={t('tooltip.delete_role')}
          />
        </Space>
      ),
    },
  ];
  return columns;
};

const RolesPageV2: React.FC = () => {
  const { t } = useTranslation(['role', 'common']);
  const permissions = useRolePermissions();
  
  // 状态管理
  const [dataSource, setDataSource] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [errorLookups, setErrorLookups] = useState<any>(null);
  
  // 表单模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 获取数据
  const fetchData = useCallback(async (params?: QueryParams) => {
    setLoadingData(true);
    setErrorLookups(null);
    try {
      const apiResponse = await getRoles();
      setDataSource(apiResponse.data || []);
      setErrorLookups(null); // 确保清除错误状态
    } catch (error) {
      setDataSource([]);
      setErrorLookups(error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // 删除项目
  const deleteItem = useCallback(async (id: string) => {
    await deleteRole(Number(id));
  }, []);

  // 处理新增
  const handleAddClick = useCallback(() => {
    setCurrentRole(null);
    setIsModalVisible(true);
  }, []);

  // 处理编辑
  const handleEditClick = useCallback((role: Role) => {
    setCurrentRole(role);
    setIsModalVisible(true);
  }, []);

  // 处理查看详情
  const handleViewDetailsClick = useCallback((id: string) => {
    // 角色管理通常不需要详情页面，可以留空或实现简单的详情模态框
  }, []);

  // 表单成功回调
  const handleFormSuccess = useCallback(() => {
    setIsModalVisible(false);
    setCurrentRole(null);
    fetchData();
  }, [fetchData]);

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PermissionGuard requiredPermissions={[]} showError={true}>
      <StandardListPageTemplate<Role>
        translationNamespaces={['role', 'common']}
        pageTitleKey="role:title"
        addButtonTextKey="role:button.create_role"
        dataSource={dataSource}
        loadingData={loadingData}
        permissions={permissions}
        lookupMaps={{ roles: true }}
        loadingLookups={false}
        errorLookups={errorLookups}
        fetchData={fetchData}
        deleteItem={deleteItem}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onViewDetailsClick={handleViewDetailsClick}
        generateTableColumns={(t, getColumnSearch, lookupMaps, permissions, onEdit, onDelete, onViewDetails) =>
          generateRoleTableColumns(
            t,
            getColumnSearch,
            lookupMaps,
            permissions,
            onEdit,
            onDelete,
            onViewDetails
          )
        }
        deleteConfirmConfig={{
          titleKey: 'common:modal.confirm_delete.title',
          contentKey: 'common:modal.confirm_delete.content_item',
          okTextKey: 'common:modal.confirm_delete.ok_text',
          cancelTextKey: 'common:modal.confirm_delete.cancel_text',
          successMessageKey: 'role:delete_success',
          errorMessageKey: 'role:delete_failed',
        }}
        batchDeleteConfig={{
          enabled: true,
          buttonText: t('role:batch_delete_button', { count: selectedRowKeys.length }),
          confirmTitle: t('role:batch_delete_confirm_title'),
          confirmContent: t('role:batch_delete_confirm_content', { count: selectedRowKeys.length }),
          confirmOkText: t('common:modal.confirm_delete.ok_text'),
          confirmCancelText: t('common:modal.confirm_delete.cancel_text'),
          successMessage: t('role:batch_delete_success', { count: selectedRowKeys.length }),
          errorMessage: t('role:batch_delete_failed'),
          noSelectionMessage: t('common:message.no_selection_for_batch_delete'),
          onBatchDelete: async (keys: React.Key[]) => {
            try {
              await Promise.all(keys.map(key => deleteRole(Number(key))));
              setSelectedRowKeys([]);
              fetchData();
            } catch (error) {
              console.error("Batch delete failed:", error);
            }
          },
        }}
        exportConfig={{
          filenamePrefix: t('role:export_filename_prefix'),
          sheetName: t('role:export_sheet_name'),
          buttonText: t('common:export.button_text'),
          successMessage: t('common:export.success_message'),
        }}
        lookupErrorMessageKey="common:message.data_loading_error"
        lookupLoadingMessageKey="common:loading.generic_loading_text"
        lookupDataErrorMessageKey="common:message.data_loading_error"
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
        serverSidePagination={false}
        serverSideSorting={false}
        serverSideFiltering={false}
      />

      <RoleFormModal
        visible={isModalVisible}
        role={currentRole}
        onClose={() => {
          setIsModalVisible(false);
          setCurrentRole(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </PermissionGuard>
  );
};

export default RolesPageV2;