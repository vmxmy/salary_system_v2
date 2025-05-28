import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Space } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';

import StandardListPageTemplate from '../../components/common/StandardListPageTemplate';
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
  const { t } = useTranslation(['role', 'pageTitle', 'common']);
  const permissions = useRolePermissions();
  
  // 状态管理
  const [dataSource, setDataSource] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [errorLookups, setErrorLookups] = useState<any>(null);
  
  // 表单模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setErrorLookups(null);
    try {
      const apiResponse = await getRoles();
      setDataSource(apiResponse.data || []);
      setErrorLookups(null); // 确保清除错误状态
    } catch (error) {
      console.error('Failed to fetch roles:', error);
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
    console.log('View role details:', id);
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
        translationNamespaces={['role', 'pageTitle', 'common']}
        pageTitleKey="pageTitle:role_management"
        addButtonTextKey="button.create_role"
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
          titleKey: 'modal.confirm_delete.title',
          contentKey: 'modal.confirm_delete.content',
          okTextKey: 'modal.confirm_delete.ok_text',
          cancelTextKey: 'modal.confirm_delete.cancel_text',
          successMessageKey: 'message.delete_role_success',
          errorMessageKey: 'message.delete_role_error',
        }}
        batchDeleteConfig={{
          enabled: true,
          buttonText: '批量删除',
          confirmTitle: '确认批量删除',
          confirmContent: '确定要删除选中的角色吗？此操作不可撤销。',
          confirmOkText: '确定删除',
          confirmCancelText: '取消',
          successMessage: '批量删除成功',
          errorMessage: '批量删除失败',
          noSelectionMessage: '请选择要删除的角色',
        }}
        exportConfig={{
          filenamePrefix: '角色列表',
          sheetName: '角色',
          buttonText: '导出Excel',
          successMessage: '角色数据导出成功',
        }}
        lookupErrorMessageKey="message.fetch_roles_error"
        lookupLoadingMessageKey="page_title"
        lookupDataErrorMessageKey="message.fetch_roles_error"
        rowKey="id"
      />

      {isModalVisible && (
        <RoleFormModal
          visible={isModalVisible}
          role={currentRole}
          onClose={() => {
            setIsModalVisible(false);
            setCurrentRole(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </PermissionGuard>
  );
};

export default RolesPageV2;