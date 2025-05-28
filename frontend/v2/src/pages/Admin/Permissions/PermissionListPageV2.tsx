import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Space } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';

import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { Permission } from '../../../api/types';
import { getPermissions, deletePermission } from '../../../api/permissions';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { stringSorter, numberSorter, useTableSearch } from '../../../components/common/TableUtils';
import TableActionButton from '../../../components/common/TableActionButton';
import PermissionFormModal from '../components/PermissionFormModal';

// 权限管理权限钩子
const usePermissionPermissions = () => {
  return useMemo(() => ({
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  }), []);
};

// 生成权限表格列配置的函数
const generatePermissionTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof Permission) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (permission: Permission) => void,
  onDelete: (permissionId: string) => void,
  onViewDetails: (permissionId: string) => void
): ProColumns<Permission>[] => {
  const columns: ProColumns<Permission>[] = [
    {
      title: t('list_page.table.column.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      valueType: 'digit',
      search: false,
    },
    {
      title: t('list_page.table.column.code'),
      dataIndex: 'code',
      key: 'code',
      width: 200,
      sorter: (a, b) => a.code.localeCompare(b.code),
      valueType: 'text',
      ...getColumnSearch('code'),
    },
    {
      title: t('list_page.table.column.description'),
      dataIndex: 'description',
      key: 'description',
      valueType: 'text',
      ellipsis: true,
      ...getColumnSearch('description'),
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
            tooltipTitle={t('list_page.tooltip.edit_permission')}
          />
          <TableActionButton
            actionType="delete"
            danger
            onClick={() => onDelete(String(record.id))}
            tooltipTitle={t('list_page.tooltip.delete_permission')}
          />
        </Space>
      ),
    },
  ];
  return columns;
};

const PermissionListPageV2: React.FC = () => {
  const { t } = useTranslation(['permission', 'pageTitle', 'common']);
  const permissions = usePermissionPermissions();
  
  // 状态管理
  const [dataSource, setDataSource] = useState<Permission[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [errorLookups, setErrorLookups] = useState<any>(null);
  
  // 表单模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<Permission | null>(null);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setErrorLookups(null);
    try {
      const permissionsArray = await getPermissions();
      setDataSource(permissionsArray || []);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setDataSource([]);
      setErrorLookups(error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // 删除项目
  const deleteItem = useCallback(async (id: string) => {
    await deletePermission(Number(id));
  }, []);

  // 处理新增
  const handleAddClick = useCallback(() => {
    setCurrentPermission(null);
    setIsModalVisible(true);
  }, []);

  // 处理编辑
  const handleEditClick = useCallback((permission: Permission) => {
    setCurrentPermission(permission);
    setIsModalVisible(true);
  }, []);

  // 处理查看详情
  const handleViewDetailsClick = useCallback((id: string) => {
    // 权限管理通常不需要详情页面，可以留空或实现简单的详情模态框
    console.log('View permission details:', id);
  }, []);

  // 表单成功回调
  const handleFormSuccess = useCallback(() => {
    setIsModalVisible(false);
    setCurrentPermission(null);
    fetchData();
  }, [fetchData]);

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PermissionGuard requiredPermissions={[]} showError={true}>
      <StandardListPageTemplate<Permission>
        translationNamespaces={['permission', 'pageTitle', 'common']}
        pageTitleKey="pageTitle:permission_management"
        addButtonTextKey="list_page.button.create_permission"
        dataSource={dataSource}
        loadingData={loadingData}
        permissions={permissions}
        lookupMaps={{ permissions: true }}
        loadingLookups={false}
        errorLookups={errorLookups}
        fetchData={fetchData}
        deleteItem={deleteItem}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onViewDetailsClick={handleViewDetailsClick}
        generateTableColumns={(t, getColumnSearch, lookupMaps, permissions, onEdit, onDelete, onViewDetails) =>
          generatePermissionTableColumns(
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
          titleKey: 'list_page.modal.confirm_delete.title',
          contentKey: 'list_page.modal.confirm_delete.content',
          okTextKey: 'list_page.modal.confirm_delete.ok_text',
          cancelTextKey: 'list_page.modal.confirm_delete.cancel_text',
          successMessageKey: 'list_page.message.delete_success',
          errorMessageKey: 'list_page.message.delete_error_prefix',
        }}
        batchDeleteConfig={{
          enabled: true,
          buttonText: '批量删除',
          confirmTitle: '确认批量删除',
          confirmContent: '确定要删除选中的权限吗？此操作不可撤销。',
          confirmOkText: '确定删除',
          confirmCancelText: '取消',
          successMessage: '批量删除成功',
          errorMessage: '批量删除失败',
          noSelectionMessage: '请选择要删除的权限',
        }}
        exportConfig={{
          filenamePrefix: '权限列表',
          sheetName: '权限',
          buttonText: '导出Excel',
          successMessage: '权限数据导出成功',
        }}
        lookupErrorMessageKey="list_page.message.load_list_error_prefix"
        lookupLoadingMessageKey="list_page.title"
        lookupDataErrorMessageKey="list_page.message.load_list_error_prefix"
        rowKey="id"
      />

      {isModalVisible && (
        <PermissionFormModal
          visible={isModalVisible}
          permission={currentPermission}
          onClose={() => {
            setIsModalVisible(false);
            setCurrentPermission(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </PermissionGuard>
  );
};

export default PermissionListPageV2;