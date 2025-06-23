import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Space, Button, message, Modal, Input, Select, Row, Col } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { format } from 'date-fns';

// 现代化组件
import ModernPageTemplate from '../../components/common/ModernPageTemplate';
import ModernCard from '../../components/common/ModernCard';
import OrganizationManagementTableTemplate from '../../components/common/OrganizationManagementTableTemplate';
import TableActionButton from '../../components/common/TableActionButton';

// API 和类型
import type { User as ApiUser } from '../../api/types';
import { getUsers, deleteUser } from '../../api/users';
import { stringSorter, numberSorter, useTableSearch, useTableExport } from '../../components/common/TableUtils';
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
    canCreate: true,
    canUpdate: true,
    canDelete: true,
  }), []);
};

/**
 * 现代化用户管理页面
 * 使用统一的现代化设计系统
 */
const UsersModern: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  
  // State management
  const [users, setUsers] = useState<PageUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<PageUser | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Hooks
  const permissions = useUserPermissions();
  const { searchProps } = useTableSearch(['username', 'roles']);
  const { exportToExcel } = useTableExport(users, []);

  // 数据转换
  const transformApiUser = useCallback((apiUser: ApiUser): PageUser => ({
    key: apiUser.id,
    id: apiUser.id,
    username: apiUser.username,
    employee_id: apiUser.employee_id,
    roles: (apiUser.roles || []).map(role => typeof role === 'string' ? role : role.name),
    is_active: apiUser.is_active ?? true,
    created_at: apiUser.created_at,
  }), []);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      const usersData = Array.isArray(response) ? response : response.data || [];
      const transformedUsers = usersData.map(transformApiUser);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error(t('admin:fetchUsersError'));
    } finally {
      setLoading(false);
    }
  }, [transformApiUser, t]);

  // 初始化数据
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 处理用户操作
  const handleCreate = useCallback(() => {
    setEditingUser(null);
    setModalVisible(true);
  }, []);

  const handleEdit = useCallback((record: PageUser) => {
    setEditingUser(record);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback(async (record: PageUser) => {
    Modal.confirm({
      title: t('admin:deleteUserConfirmTitle'),
      content: t('admin:deleteUserConfirmContent', { username: record.username }),
      okText: t('common:confirm'),
      cancelText: t('common:cancel'),
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteUser(record.id);
          message.success(t('admin:deleteUserSuccess'));
          fetchUsers();
        } catch (error) {
          console.error('Delete failed:', error);
          message.error(t('admin:deleteUserError'));
        }
      },
    });
  }, [t, fetchUsers]);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setEditingUser(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setModalVisible(false);
    setEditingUser(null);
    fetchUsers();
  }, [fetchUsers]);

  // 搜索和筛选
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleExport = useCallback(async () => {
    try {
      await exportToExcel();
      message.success(t('common:exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      message.error(t('common:exportError'));
    }
  }, [exportToExcel, t]);

  // 过滤数据
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchText || 
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.roles.some(role => role.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }, [users, searchText, statusFilter]);

  // 表格列定义
  const columns: ProColumns<PageUser>[] = [
    {
      title: t('admin:username'),
      dataIndex: 'username',
      key: 'username',
      width: 150,
      sorter: stringSorter('username'),
      ...searchProps,
      render: (text: any, record: PageUser) => (
        <Space>
          <UserOutlined className="text-accent" />
          <span className="typography-body font-medium">{record.username}</span>
        </Space>
      ),
    },
    {
      title: t('admin:roles'),
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      render: (roles: any, record: PageUser) => (
        <Space wrap>
          {record.roles.map((role) => (
            <Tag key={role} color="blue" className="typography-caption-strong">
              <TeamOutlined className="mr-1" />
              {role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('admin:status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      sorter: (a, b) => Number(a.is_active) - Number(b.is_active),
      render: (isActive: any, record: PageUser) => (
        <Tag 
          color={record.is_active ? 'success' : 'error'} 
          className="typography-caption-strong"
        >
          {record.is_active ? t('admin:active') : t('admin:inactive')}
        </Tag>
      ),
    },
    {
      title: t('admin:createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      sorter: (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
      render: (date: any, record: PageUser) => record.created_at ? format(new Date(record.created_at), 'yyyy-MM-dd') : '-',
    },
    {
      title: t('common:column.actions'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: PageUser) => (
        <Space size="small">
          {permissions.canUpdate && (
            <TableActionButton
              actionType="edit"
              onClick={() => handleEdit(record)}
              size="small"
            />
          )}
          {permissions.canDelete && (
            <TableActionButton
              actionType="delete"
              onClick={() => handleDelete(record)}
              size="small"
            />
          )}
        </Space>
      ),
    },
  ];

  // 页面头部额外内容
  const headerExtra = (
    <Space>
      <Button
        icon={<ReloadOutlined />}
        onClick={handleRefresh}
        loading={loading}
        className="modern-button variant-ghost"
      >
        {t('common:refresh')}
      </Button>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExport}
        className="modern-button variant-secondary"
      >
        {t('common:export.export')}
      </Button>
      {permissions.canCreate && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          className="modern-button variant-primary"
        >
          {t('admin:createUser')}
        </Button>
      )}
    </Space>
  );

  // 面包屑导航
  const breadcrumbItems = [
    { title: t('common:home'), href: '/' },
    { title: t('admin:adminManagement'), href: '/admin' },
    { title: t('admin:userManagement') },
  ];

  return (
    <ModernPageTemplate
      title={t('admin:userManagement')}
      subtitle={t('admin:userManagementDescription')}
      headerExtra={headerExtra}
      showBreadcrumb
      breadcrumbItems={breadcrumbItems}
    >
      {/* 搜索和筛选区域 */}
      <ModernCard
        title={t('common:searchAndFilter')}
        icon={<SearchOutlined />}
        variant="outlined"
        className="mb-6"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input.Search
              placeholder={t('admin:searchUserPlaceholder')}
              allowClear
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch('');
                }
              }}
              className="w-full"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder={t('admin:selectStatus')}
              allowClear
              options={[
                { label: t('admin:active'), value: 'active' },
                { label: t('admin:inactive'), value: 'inactive' },
              ]}
              onChange={setStatusFilter}
              className="w-full"
            />
          </Col>
        </Row>
      </ModernCard>

      {/* 用户表格 */}
      <ModernCard>
        <OrganizationManagementTableTemplate<PageUser>
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
          }}
          scroll={{ x: 800 }}
          size="small"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} ${t('common:of')} ${total} ${t('admin:users')}`,
          }}
        />
      </ModernCard>

      {/* 用户表单模态框 */}
      <UserFormModal
        visible={modalVisible}
        user={editingUser as any}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </ModernPageTemplate>
  );
};

export default UsersModern;