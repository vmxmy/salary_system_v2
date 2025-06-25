import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';
import { format } from 'date-fns';
import type { User as ApiUser } from '../../../../api/types';
import { getUsers, deleteUser } from '../../../../api/users';
import { usePermissions } from '../../../../hooks/usePermissions';

// 页面用户类型
export interface PageUser {
  key: React.Key;
  id: number;
  username: string;
  employee_id?: number;
  roles: string[];
  is_active: boolean;
  created_at?: string;
}

/**
 * 用户管理页面的核心业务逻辑 Hook
 */
export const useUserManagementLogic = () => {
  const { t } = useTranslation(['user', 'pageTitle', 'common']);
  const { message } = App.useApp();
  const { hasPermission } = usePermissions();

  // 状态管理
  const [dataSource, setDataSource] = useState<PageUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [allApiUsersForEdit, setAllApiUsersForEdit] = useState<ApiUser[]>([]);
  
  // 表单模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = { page: 1, size: 100 }; // 修改为符合后端限制的大小
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
      } else {
        setDataSource([]);
      }
    } catch (err) {
      setError(err);
      message.error(t('common:message.fetch_failed'));
    } finally {
      setLoading(false);
    }
  }, [t, message]);

  // 删除用户
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteUser(Number(id));
      message.success(t('common:message.delete_success'));
      fetchData(); // 重新获取数据
    } catch (err) {
      message.error(t('common:message.delete_failed'));
    }
  }, [fetchData, message, t]);

  // 处理新增
  const handleAdd = useCallback(() => {
    setCurrentUser(null);
    setIsModalVisible(true);
  }, []);

  // 处理编辑
  const handleEdit = useCallback((user: PageUser) => {
    const apiUser = allApiUsersForEdit.find(u => u.id === user.id);
    if (apiUser) {
      setCurrentUser(apiUser);
      setIsModalVisible(true);
    }
  }, [allApiUsersForEdit]);

  // 表单成功回调
  const handleFormSuccess = useCallback(() => {
    setIsModalVisible(false);
    setCurrentUser(null);
    fetchData();
  }, [fetchData]);

  // 在组件挂载时获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    t,
    loading,
    error,
    dataSource,
    allApiUsersForEdit,
    isModalVisible,
    currentUser,
    permissions: {
      canAdd: hasPermission('user:create'),
      canEdit: hasPermission('user:edit'),
      canDelete: hasPermission('user:delete'),
    },
    handlers: {
      fetchData,
      handleDelete,
      handleAdd,
      handleEdit,
      handleFormSuccess,
      setIsModalVisible,
    },
  };
}; 