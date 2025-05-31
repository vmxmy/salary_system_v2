import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Space } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import { format } from 'date-fns';

import StandardListPageTemplate from '../../components/common/StandardListPageTemplate';
import type { User as ApiUser } from '../../api/types';
import { getUsers, deleteUser } from '../../api/users';
import PermissionGuard from '../../components/common/PermissionGuard';
import { stringSorter, numberSorter, useTableSearch } from '../../components/common/TableUtils';
import TableActionButton from '../../components/common/TableActionButton';
import UserFormModal from './components/UserFormModal';
import { usePermissions } from '../../hooks/usePermissions';

// 页面用户类型
interface PageUser {
  key: React.Key;
  id: number;
  username: string;
  employee_id?: number;
  roles: string[];
  is_active: boolean;
  created_at?: string;
}

// 用户管理权限钩子
const useUserPermissions = () => {
  return useMemo(() => ({
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  }), []);
};

// 生成用户表格列配置的函数
const generateUserTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof PageUser) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (user: PageUser) => void,
  onDelete: (userId: string) => void,
  onViewDetails: (userId: string) => void,
  allApiUsersForEdit: ApiUser[]
): ProColumns<PageUser>[] => {
  const columns: ProColumns<PageUser>[] = [
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
      title: t('table.column.username'),
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
      valueType: 'text',
      ...getColumnSearch('username'),
    },
    {
      title: t('table.column.employee_id'),
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120,
      sorter: (a, b) => (a.employee_id || 0) - (b.employee_id || 0),
      valueType: 'digit',
      search: false,
    },
    {
      title: t('table.column.roles'),
      dataIndex: 'roles',
      key: 'roles',
      search: false,
      render: (_, record) => (
        <div>
          {record.roles.map((role, index) => (
            <Tag color="blue" key={index}>
              {role}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: t('table.column.is_active'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      search: false,
      render: (_, record) => (
        record.is_active ? 
          <Tag color="green">{t('table.value.active')}</Tag> : 
          <Tag color="red">{t('table.value.inactive')}</Tag>
      ),
      filters: [
        { text: t('table.value.active'), value: true },
        { text: t('table.value.inactive'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: t('table.column.created_at'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      search: false,
      valueType: 'dateTime',
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
            onClick={() => {
              const apiUser = allApiUsersForEdit.find(u => u.id === record.id);
              if (apiUser) {
                onEdit(record);
              }
            }}
            tooltipTitle={t('tooltip.edit_user')}
          />
          <TableActionButton
            actionType="delete"
            danger
            onClick={() => onDelete(String(record.id))}
            tooltipTitle={t('tooltip.delete_user')}
          />
        </Space>
      ),
    },
  ];
  return columns;
};

const UsersPageV2: React.FC = () => {
  const { t } = useTranslation(['user', 'pageTitle', 'common']);
  const permissions = useUserPermissions();
  const { userPermissions, userRoleCodes, hasPermission } = usePermissions();
  
  // 状态管理
  const [dataSource, setDataSource] = useState<PageUser[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [allApiUsersForEdit, setAllApiUsersForEdit] = useState<ApiUser[]>([]);
  const [errorLookups, setErrorLookups] = useState<any>(null);
  
  // 表单模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setErrorLookups(null);
    try {
      const apiParams = {
        page: 1,
        size: 100,
      };

      const apiResponse = await getUsers(apiParams);
      
      if (apiResponse && Array.isArray(apiResponse.data)) {
        setAllApiUsersForEdit(apiResponse.data);
        const pageUsers: PageUser[] = apiResponse.data.map((apiUser: ApiUser) => ({
          key: apiUser.id,
          id: apiUser.id,
          username: apiUser.username,
          employee_id: apiUser.employee_id,
          roles: apiUser.roles ? apiUser.roles.map((role) => role.name || t('common:role.unknown')) : [],
          is_active: apiUser.is_active,
          created_at: apiUser.created_at ? format(new Date(apiUser.created_at), 'yyyy-MM-dd HH:mm:ss') : t('table.value.not_applicable'),
        }));
        setDataSource(pageUsers);
        setErrorLookups(null);
      } else {
        setDataSource([]);
      }
    } catch (error) {
      setDataSource([]);
      setErrorLookups(error);
    } finally {
      setLoadingData(false);
    }
  }, [t]);

  // 删除项目
  const deleteItem = useCallback(async (id: string) => {
    await deleteUser(Number(id));
  }, []);

  // 处理新增
  const handleAddClick = useCallback(() => {
    setCurrentUser(null);
    setIsModalVisible(true);
  }, []);

  // 处理编辑
  const handleEditClick = useCallback((user: PageUser) => {
    const apiUser = allApiUsersForEdit.find(u => u.id === user.id);
    if (apiUser) {
      setCurrentUser(apiUser);
      setIsModalVisible(true);
    }
  }, [allApiUsersForEdit]);

  // 处理查看详情
  const handleViewDetailsClick = useCallback((id: string) => {
    // 用户管理通常不需要详情页面，可以留空或实现简单的详情模态框
  }, []);

  // 表单成功回调
  const handleFormSuccess = useCallback(() => {
    setIsModalVisible(false);
    setCurrentUser(null);
    fetchData();
  }, [fetchData]);

  // 初始化数据
  useEffect(() => {
    if (hasPermission('user:view_list')) {
      fetchData();
    }
  }, []); // 移除fetchData依赖，避免无限循环

  // 调试状态信息
  console.log('🔍 [UsersV2] 渲染状态:', {
    dataSourceLength: dataSource.length,
    loadingData,
    errorLookups,
    hasError: !!errorLookups
  });

  return (
    <PermissionGuard requiredPermissions={['user:view_list']} showError={true}>
      <StandardListPageTemplate<PageUser>
        translationNamespaces={['user', 'pageTitle', 'common']}
        pageTitleKey="pageTitle:user_management"
        addButtonTextKey="user_list_page.button.create_user"
        dataSource={dataSource}
        loadingData={loadingData}
        permissions={permissions}
        lookupMaps={{ users: true }}
        loadingLookups={false}
        errorLookups={errorLookups}
        fetchData={fetchData}
        deleteItem={deleteItem}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onViewDetailsClick={handleViewDetailsClick}
        generateTableColumns={(t, getColumnSearch, lookupMaps, permissions, onEdit, onDelete, onViewDetails) =>
          generateUserTableColumns(
            t,
            getColumnSearch,
            lookupMaps,
            permissions,
            onEdit,
            onDelete,
            onViewDetails,
            allApiUsersForEdit
          )
        }
        deleteConfirmConfig={{
          titleKey: 'modal.confirm_delete.title',
          contentKey: 'modal.confirm_delete.content',
          okTextKey: 'modal.confirm_delete.ok_text',
          cancelTextKey: 'modal.confirm_delete.cancel_text',
          successMessageKey: 'message.delete_user_success',
          errorMessageKey: 'message.delete_user_error.default',
        }}
        batchDeleteConfig={{
          enabled: true,
          buttonText: '批量删除',
          confirmTitle: '确认批量删除',
          confirmContent: '确定要删除选中的用户吗？此操作不可撤销。',
          confirmOkText: '确定删除',
          confirmCancelText: '取消',
          successMessage: '批量删除成功',
          errorMessage: '批量删除失败',
          noSelectionMessage: '请选择要删除的用户',
        }}
        exportConfig={{
          filenamePrefix: '用户管理',
          sheetName: '用户',
          buttonText: '导出Excel',
          successMessage: '用户数据导出成功',
        }}
        lookupErrorMessageKey="message.fetch_users_error"
        lookupLoadingMessageKey="user_list_page.loading"
        lookupDataErrorMessageKey="message.fetch_users_error"
        rowKey="key"
      />

      {isModalVisible && (
        <UserFormModal
          visible={isModalVisible}
          user={currentUser}
          onClose={() => {
            setIsModalVisible(false);
            setCurrentUser(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </PermissionGuard>
  );
};

export default UsersPageV2;