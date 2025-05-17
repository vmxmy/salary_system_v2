import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Input, Space, Tag, Tooltip, Modal, Form, Switch, Select, message, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ActionButton from '../../components/common/ActionButton';
import PageHeaderLayout from '../../components/common/PageHeaderLayout';
import type { InputRef } from 'antd';
import type { ColumnType, Key, TablePaginationConfig } from 'antd/lib/table/interface';
import type { FilterValue, SorterResult } from 'antd/lib/table/interface';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { getRoles } from '../../api/roles';
import type { User as ApiUser, Role as ApiRole, ApiResponse, CreateUserPayload, UpdateUserPayload } from '../../api/types';
import { format } from 'date-fns';
import type { TableParams } from '../../types/antd';
import { useTranslation } from 'react-i18next';

// Interface for form values when creating a user, including confirm_password
interface UserFormCreationValues extends CreateUserPayload {
  confirm_password?: string;
}

// Interface for form values when updating a user
// For editing, password fields are not present. username is usually not editable directly in this form.
interface UserFormUpdateValues extends Omit<UpdateUserPayload, 'role_ids'> { // Omit role_ids if handled by assignRolesToUser separately
  username?: string; // Display purposes, usually disabled
  role_ids?: number[]; // For the Select component in the form
}

// Combined type for the form to handle both creation and update
type UserFormValues = UserFormCreationValues | UserFormUpdateValues;

// Page User type
interface PageUser {
  key: React.Key; // for table row key
  id: number;
  username: string;
  employee_id?: number;
  roles: string[];
  is_active: boolean; // Keep as boolean for direct use
  created_at?: string;
}

const UserListPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<PageUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  // Search related states for column search
  const [columnSearchText, setColumnSearchText] = useState('');
  const [searchedTableColumn, setSearchedTableColumn] = useState('');
  const searchInputRef = useRef<InputRef>(null);

  // Modal states for Create/Edit User
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [userModalLoading, setUserModalLoading] = useState<boolean>(false);
  const [userForm] = Form.useForm<UserFormValues>(); // Use combined form values type

  // Data for select/transfer components in modal
  const [allRoles, setAllRoles] = useState<ApiRole[]>([]);
  // const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // TODO: Fetch employees

  // Store original ApiUser records separately if needed for passing to edit modal, 
  // as PageUser might have transformed/missing data.
  // This assumes fetchUsers makes original ApiUsers available or we store them.
  // For simplicity now, we will refetch user for edit if needed, or assume PageUser is sufficient
  // For now, let's add a temporary state to hold the full ApiUser objects from the last fetch
  const [allApiUsersForEdit, setAllApiUsersForEdit] = useState<ApiUser[]>([]);

  const fetchUsers = async (params: TableParams = tableParams) => {
    setLoading(true);
    try {
      const apiParams: { page?: number; size?: number; sort?: string; [key: string]: any } = {
        page: params.pagination?.current,
        size: params.pagination?.pageSize,
      };

      const apiResponse: ApiResponse<ApiUser[]> = await getUsers(apiParams);

      if (apiResponse && Array.isArray(apiResponse.data)) {
        setAllApiUsersForEdit(apiResponse.data);
        const pageUsers: PageUser[] = apiResponse.data.map((apiUser: ApiUser) => ({
          key: apiUser.id,
          id: apiUser.id,
          username: apiUser.username,
          employee_id: apiUser.employee_id,
          roles: apiUser.roles ? apiUser.roles.map((role: ApiRole) => role.name || t('common.role.unknown')) : [],
          is_active: apiUser.is_active,
          created_at: apiUser.created_at ? format(new Date(apiUser.created_at), 'yyyy-MM-dd HH:mm:ss') : t('user_management_page.table.value.not_applicable'),
        }));
        setUsers(pageUsers);
        setTableParams({
          ...params,
          pagination: {
            ...params.pagination,
            total: apiResponse.meta?.total || 0,
          },
        });
      } else {
        console.error('getUsers response data is not an array or response is invalid:', apiResponse);
        setUsers([]);
        setTableParams(prev => ({
          ...prev,
          pagination: {
            ...prev.pagination,
            total: 0,
            current: 1,
          }
        }));
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setUsers([]);
      setTableParams(prev => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          total: 0,
          current: 1,
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoles = async () => {
    try {
      // Use page and size, with size <= 100 as per backend constraint
      const rolesResponse = await getRoles({ page: 1, size: 100 }); 
      if (rolesResponse && rolesResponse.data) {
        setAllRoles(rolesResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      message.error(t('user_management_page.message.fetch_roles_error'));
    }
  };

  useEffect(() => {
    fetchUsers(tableParams);
    fetchAllRoles(); // Fetch roles for the modal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableParams.pagination?.current, tableParams.pagination?.pageSize]);

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<PageUser> | SorterResult<PageUser>[],
  ) => {
    const sort = Array.isArray(sorter) ? sorter[0] : sorter;
    setTableParams(prev => ({
      ...prev,
      pagination: newPagination,
      filters,
      sortField: sort.field as string,
      sortOrder: sort.order as string,
    }));
    // Fetch users will be triggered by useEffect if current/pageSize changed, 
    // or we can call fetchUsers explicitly here if filters/sorter are also backend-driven.
    // For now, assuming fetchUsers is called if current/pageSize changes in tableParams.pagination
    // If filters/sorters are backend-driven, add them to useEffect dependencies or call fetchUsers here.
    fetchUsers({ // Explicitly call if filters/sorters are to be sent to backend
        pagination: newPagination,
        filters,
        sortField: sort.field as string,
        sortOrder: sort.order as string,
    });
  };

  const handleColumnSearch = (
    selectedKeys: string[], 
    confirm: () => void, 
    dataIndex: keyof PageUser
  ) => {
    confirm();
    setColumnSearchText(selectedKeys[0]);
    setSearchedTableColumn(dataIndex as string);
    // For client-side search, antd table handles it if onFilter is defined.
    // For server-side search on a specific column:
    // setTableParams(prev => ({ ...prev, searchColumn: dataIndex, searchText: selectedKeys[0], pagination: {...prev.pagination, current: 1} }));
    // And then fetchUsers(tableParams) would be called by useEffect or directly.
  };

  const handleColumnSearchReset = (clearFilters: () => void) => {
    clearFilters();
    setColumnSearchText('');
    setSearchedTableColumn('');
    // For server-side search reset:
    // setTableParams(prev => ({ ...prev, searchColumn: undefined, searchText: undefined, pagination: {...prev.pagination, current: 1} }));
    // fetchUsers(tableParams);
  };

  const getColumnSearchProps = (dataIndex: keyof PageUser, columnName?: string): ColumnType<PageUser> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInputRef} // Connect ref
          placeholder={t('user_management_page.table.search.placeholder_prefix') + (columnName || dataIndex.toString())}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleColumnSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleColumnSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {t('user_management_page.table.search.button_search')}
          </Button>
          <Button onClick={() => clearFilters && handleColumnSearchReset(clearFilters)} size="small" style={{ width: 90 }}>
            {t('user_management_page.table.search.button_reset')}
          </Button>
          <Button type="link" size="small" onClick={() => close()}>
            {t('user_management_page.table.search.button_close')}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      return recordValue ? recordValue.toString().toLowerCase().includes((value as string).toLowerCase()) : '' === (value as string).toLowerCase();
    },
    filterDropdownProps: {
      onOpenChange: visible => {
        if (visible) {
          setTimeout(() => searchInputRef.current?.select(), 100);
        }
      }
    },
  });

  const showCreateUserModal = () => {
    setEditingUser(null);
    userForm.resetFields();
    userForm.setFieldsValue({ 
      is_active: true, 
      username: '', 
      password: '',
      confirm_password: '', 
      employee_id: undefined, 
      role_ids: [] 
    });
    setIsUserModalOpen(true);
  };

  const handleUserModalCancel = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
    userForm.resetFields();
  };

  const handleCreateUserSubmit = async (values: UserFormCreationValues) => {
    setUserModalLoading(true);
    try {
      const { confirm_password, ...payloadForApi } = values;
      
      if (payloadForApi.employee_id && typeof payloadForApi.employee_id === 'string') {
        payloadForApi.employee_id = parseInt(payloadForApi.employee_id, 10);
        if (isNaN(payloadForApi.employee_id)) {
          delete payloadForApi.employee_id;
        }
      }
      // No need to check for empty string as employee_id type is number | undefined
      // if (payloadForApi.employee_id === null || payloadForApi.employee_id === undefined ){
      //   delete payloadForApi.employee_id; 
      // }

      if (payloadForApi.role_ids) {
        payloadForApi.role_ids = payloadForApi.role_ids.map(id => Number(id));
      }

      if (payloadForApi.is_active === undefined) {
        payloadForApi.is_active = true;
      }

      console.log("Submitting for create: ", payloadForApi);
      // Ensure payloadForApi matches CreateUserPayload (it should after stripping confirm_password)
      const newUser = await createUser(payloadForApi as CreateUserPayload); // Corrected to createUser
      
      message.success(t('user_management_page.message.create_user_success', { username: newUser.username }));
      setIsUserModalOpen(false);
      userForm.resetFields();
      // Refresh the user list - fetch with current params, resetting to page 1 might be good UX
      setTableParams(prev => ({ ...prev, pagination: { ...prev.pagination, current: 1 }}));
      fetchUsers({ ...tableParams, pagination: { ...tableParams.pagination, current: 1 } }); // fetch updated list

    } catch (error: any) {
      console.error("创建用户失败:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || t('user_management_page.message.create_user_error.default');
      message.error(errorMsg);
    } finally {
      setUserModalLoading(false);
    }
  };

  const showEditUserModal = (userToEdit: ApiUser) => {
    setEditingUser(userToEdit);
    userForm.setFieldsValue({
      username: userToEdit.username,
      employee_id: userToEdit.employee_id,
      is_active: userToEdit.is_active,
      role_ids: userToEdit.roles?.map(role => role.id) || [],
      // Password fields are not set for editing
    });
    setIsUserModalOpen(true);
  };

  const handleUpdateUserSubmit = async (values: UserFormUpdateValues) => {
    if (!editingUser) return;
    setUserModalLoading(true);
    try {
      const payload: UpdateUserPayload = {
        employee_id: values.employee_id,
        is_active: values.is_active,
        role_ids: values.role_ids?.map(id => Number(id)), // Ensure role_ids are numbers
      };
      
      // Filter out undefined fields, except for is_active which can be false
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([key, v]) => key === 'is_active' || v !== undefined)
      ) as UpdateUserPayload;

      const updatedUser = await updateUser(editingUser.id, cleanedPayload);
      message.success(t('user_management_page.message.update_user_success', { username: updatedUser.username }));
      setIsUserModalOpen(false);
      fetchUsers(tableParams); // Refresh with current params
    } catch (error: any) {
      console.error("更新用户失败:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || t('user_management_page.message.update_user_error.default');
      message.error(errorMsg);
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleUserFormSubmit = async (values: UserFormValues) => {
    if (editingUser) {
      await handleUpdateUserSubmit(values as UserFormUpdateValues);
    } else {
      await handleCreateUserSubmit(values as UserFormCreationValues);
    }
  };

  const handleDeleteUser = (userId: number, username: string) => {
    Modal.confirm({
      title: t('user_management_page.modal.confirm_delete.title', { username }),
      content: t('user_management_page.modal.confirm_delete.content'),
      okText: t('user_management_page.modal.confirm_delete.ok_text'),
      okType: 'danger',
      cancelText: t('user_management_page.modal.confirm_delete.cancel_text'),
      onOk: async () => {
        try {
          await deleteUser(userId);
          message.success(t('user_management_page.message.delete_user_success', { username }));
          // Refresh users list - fetch with current params, or reset to page 1 if current page might be empty
          const newTotal = tableParams.pagination?.total ? tableParams.pagination.total - 1 : 0;
          const newCurrentPage = (users.length === 1 && (tableParams.pagination?.current || 1) > 1) ? 
                                 (tableParams.pagination?.current || 1) - 1 : 
                                 (tableParams.pagination?.current || 1);

          const newTableParams = {
            ...tableParams, 
            pagination: {
              ...tableParams.pagination, 
              total: newTotal,
              current: newCurrentPage
            }
          };
          fetchUsers(newTableParams);
        } catch (error: any) {
          console.error("删除用户失败:", error);
          const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || t('user_management_page.message.delete_user_error.default');
          message.error(errorMsg);
        }
      },
    });
  };

  const columns: ColumnType<PageUser>[] = [
    {
      title: t('user_management_page.table.column.id'),
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('user_management_page.table.column.username'),
      dataIndex: 'username',
      key: 'username',
      ...getColumnSearchProps('username', t('user_management_page.table.column.username')),
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: t('user_management_page.table.column.employee_id'),
      dataIndex: 'employee_id',
      key: 'employee_id',
      render: (employeeId?: number) => employeeId || t('user_management_page.table.value.not_applicable'),
      sorter: (a, b) => (a.employee_id || 0) - (b.employee_id || 0),
    },
    {
      title: t('user_management_page.table.column.roles'),
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => roles.join(', ') || t('user_management_page.table.value.not_applicable'),
      // Note: Filtering/searching on roles might need a custom approach if roles is an array
    },
    {
      title: t('user_management_page.table.column.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? t('user_management_page.table.status.active') : t('user_management_page.table.status.inactive')}
        </Tag>
      ),
      filters: [
        { text: t('user_management_page.table.status.active'), value: true },
        { text: t('user_management_page.table.status.inactive'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
      sorter: (a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1),
    },
    {
      title: t('user_management_page.table.column.created_at'),
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
    },
    {
      title: t('user_management_page.table.column.actions'),
      key: 'action',
      render: (_, record: PageUser) => {
        const userToEdit = allApiUsersForEdit.find(u => u.id === record.id); // Find full ApiUser for editing
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Tooltip title={t('user_management_page.tooltip.edit_user')}>
              <ActionButton
                actionType="edit"
                onClick={() => userToEdit && showEditUserModal(userToEdit)}
                disabled={!userToEdit}
              />
            </Tooltip>
            <Tooltip title={t('user_management_page.tooltip.delete_user')}>
              <ActionButton
                actionType="delete"
                onClick={() => handleDeleteUser(record.id, record.username)}
                danger
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeaderLayout>
        <Typography.Title level={4} style={{ marginBottom: 0 }}>{t('user_management_page.title')}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateUserModal} shape="round">
          {t('user_management_page.button.create_user')}
        </Button>
      </PageHeaderLayout>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        onChange={handleTableChange}
        pagination={tableParams.pagination}
        rowKey="key" // Ensure rowKey is set
      />
      <Modal
        title={editingUser ? t('user_management_page.modal.title.edit_user') : t('user_management_page.modal.title.create_user')}
        open={isUserModalOpen}
        onCancel={handleUserModalCancel}
        onOk={() => userForm.submit()}
        confirmLoading={userModalLoading}
        destroyOnHidden
        width={600}
      >
        <Form
          form={userForm}
          layout="vertical"
          name="userForm"
          onFinish={handleUserFormSubmit}
        >
          <Form.Item
            name="username"
            label={t('user_management_page.form.username.label')}
            rules={[{ required: true, message: t('user_management_page.form.username.validation.required') }, { type: 'string', min: 3, message: t('user_management_page.form.username.validation.min_length', { count: 3 }) }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <>
              <Form.Item
                name="password"
                label={t('user_management_page.form.password.label')}
                rules={[{ required: !editingUser, message: t('user_management_page.form.password.validation.required') }, {min: 6, message: t('user_management_page.form.password.validation.min_length', { count: 6 })}] }
                hasFeedback
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label={t('user_management_page.form.confirm_password.label')}
                dependencies={['password']}
                hasFeedback
                rules={[
                  { required: !editingUser, message: t('user_management_page.form.confirm_password.validation.required') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('user_management_page.form.confirm_password.validation.match')));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="employee_id"
            label={t('user_management_page.form.employee_id.label')}
            // TODO: Replace with a Select dropdown populated with employees
          >
            <Input type="number" placeholder={t('user_management_page.form.employee_id.placeholder')} />
          </Form.Item>

          <Form.Item
            name="is_active"
            label={t('user_management_page.form.status.label')}
            valuePropName="checked"
            initialValue={true} // Default for new user
          >
            <Switch checkedChildren={t('user_management_page.form.status.active')} unCheckedChildren={t('user_management_page.form.status.inactive')} />
          </Form.Item>
          
          <Form.Item
            name="role_ids"
            label={t('user_management_page.form.roles.label')}
          >
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder={t('user_management_page.form.roles.placeholder')}
              options={allRoles.map(role => ({ label: role.name, value: role.id }))}
              loading={allRoles.length === 0} // Show loading if roles are not yet fetched
            />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default UserListPage;