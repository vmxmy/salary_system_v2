import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Input, Space, Tag, Tooltip, Modal, Form, Switch, Select, message } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import type { ColumnType, Key, TablePaginationConfig } from 'antd/lib/table/interface';
import type { FilterValue, SorterResult } from 'antd/lib/table/interface';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { getRoles } from '../../api/roles';
import type { User as ApiUser, Role as ApiRole, ApiResponse, CreateUserPayload, UpdateUserPayload } from '../../api/types';
import { format } from 'date-fns';
import type { TableParams } from '../../types/antd';

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
          roles: apiUser.roles ? apiUser.roles.map((role: ApiRole) => role.name || 'UnknownRole') : [],
          is_active: apiUser.is_active,
          created_at: apiUser.created_at ? format(new Date(apiUser.created_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
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
      message.error('加载角色列表失败');
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

  const getColumnSearchProps = (dataIndex: keyof PageUser): ColumnType<PageUser> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInputRef} // Connect ref
          placeholder={`搜索 ${dataIndex.toString()}`}
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
            搜索
          </Button>
          <Button onClick={() => clearFilters && handleColumnSearchReset(clearFilters)} size="small" style={{ width: 90 }}>
            重置
          </Button>
          <Button type="link" size="small" onClick={() => close()}>
            关闭
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
    userForm.setFieldsValue({ is_active: true, username: '', password: '', confirm_password: '', employee_id: undefined, role_ids: [] });
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
      
      message.success(`用户 "${newUser.username}" 创建成功!`);
      setIsUserModalOpen(false);
      userForm.resetFields();
      // Refresh the user list - fetch with current params, resetting to page 1 might be good UX
      setTableParams(prev => ({ ...prev, pagination: { ...prev.pagination, current: 1 }}));
      fetchUsers({ ...tableParams, pagination: { ...tableParams.pagination, current: 1 } }); // fetch updated list

    } catch (error: any) {
      console.error("创建用户失败:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || '创建用户失败，请检查输入或联系管理员。';
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
      message.success(`用户 "${updatedUser.username}" 更新成功!`);
      setIsUserModalOpen(false);
      fetchUsers(tableParams); // Refresh with current params
    } catch (error: any) {
      console.error("更新用户失败:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || '更新用户失败';
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
      title: `确认删除用户 "${username}"?`,
      content: '此操作无法撤销。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteUser(userId);
          message.success(`用户 "${username}" 已删除。`);
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
          const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || '删除用户失败';
          message.error(errorMsg);
        }
      },
    });
  };

  const columns: ColumnType<PageUser>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id, // Client-side sort
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      ...getColumnSearchProps('username'),
      sorter: (a, b) => a.username.localeCompare(b.username), // Client-side sort
    },
    {
      title: '关联员工ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      render: (id?: number) => id || 'N/A',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <>
          {roles.map(role => (
            <Tag color="blue" key={role}>{role}</Tag>
          ))}
        </>
      ),
      // TODO: Add filter for roles if needed (requires fetching all roles for filter options)
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? '激活' : '禁用'}</Tag>
      ),
      filters: [
        { text: '激活', value: true },
        { text: '禁用', value: false },
      ],
      onFilter: (value, record) => record.is_active === value, // Direct boolean comparison
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(), // Client-side sort
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PageUser) => {
        // Find the original ApiUser object to pass to edit modal
        const apiUserRecord = users.find(u => u.id === record.id) ? 
                              allApiUsersForEdit.find(au => au.id === record.id) : undefined;
        return (
          <Space size="middle">
            <Tooltip title="编辑用户">
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={() => apiUserRecord && showEditUserModal(apiUserRecord)} 
                disabled={!apiUserRecord} // Disable if original record not found (should not happen)
              />
            </Tooltip>
            <Tooltip title="删除用户">
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => handleDeleteUser(record.id, record.username)} 
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateUserModal}>
          新建用户
        </Button>
      </div>
      <Table<PageUser> // Specify generic type for Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="key" // Use key from PageUser
        pagination={tableParams.pagination}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }} // For better responsiveness if many columns
      />
      <Modal
        title={editingUser ? "编辑用户" : "新建用户"}
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
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }, { type: 'string', min: 3, message: '用户名至少需要3个字符'}] }
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: !editingUser, message: '请输入密码!' }, {min: 6, message: '密码至少需要6个字符'}] }
                hasFeedback
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label="确认密码"
                dependencies={['password']}
                hasFeedback
                rules={[
                  { required: !editingUser, message: '请确认密码!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不匹配!'));
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
            label="关联员工 ID (可选)"
            // TODO: Replace with a Select dropdown populated with employees
          >
            <Input type="number" placeholder="输入员工系统ID" />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="状态"
            valuePropName="checked"
            initialValue={true} // Default for new user
          >
            <Switch checkedChildren="激活" unCheckedChildren="禁用" />
          </Form.Item>
          
          <Form.Item
            name="role_ids"
            label="分配角色 (可选)"
          >
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="请选择角色"
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