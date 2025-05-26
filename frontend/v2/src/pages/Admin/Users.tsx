import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Input, Space, Tag, Tooltip, Modal, Form, Switch, Select, message, Typography, App } from 'antd';
import { SearchOutlined, PlusOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import TableActionButton from '../../components/common/TableActionButton';
import PageLayout from '../../components/common/PageLayout';
import type { InputRef } from 'antd';
import type { ColumnType, TablePaginationConfig } from 'antd/lib/table/interface';
import type { FilterValue, SorterResult } from 'antd/lib/table/interface';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { getRoles } from '../../api/roles';
import type { User as ApiUser, Role as ApiRole, ApiResponse, CreateUserPayload, UpdateUserPayload } from '../../api/types';
import { format } from 'date-fns';
import type { TableParams } from '../../types/antd';
import { useTranslation } from 'react-i18next';
import { useTableSearch, useTableExport, useColumnControl, numberSorter, stringSorter, dateSorter } from '../../components/common/TableUtils';
import type { ColumnsType } from 'antd/lib/table';
import styles from './Users.module.less';

const { Title } = Typography;
const { Option } = Select;

// Interface for form values when creating a user, including confirm_password
interface UserFormCreationValues extends CreateUserPayload {
  confirm_password?: string;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_id_card?: string;
}

// Interface for form values when updating a user
// For editing, password fields are not present. username is usually not editable directly in this form.
interface UserFormUpdateValues extends Omit<UpdateUserPayload, 'role_ids'> { // Omit role_ids if handled by assignRolesToUser separately
  username?: string; // Display purposes, usually disabled
  employee_first_name?: string; // Added
  employee_last_name?: string; // Added
  employee_id_card?: string; // Added
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
  const { t } = useTranslation(['user', 'common']);
  const [users, setUsers] = useState<PageUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  // 使用通用表格搜索工具
  const { getColumnSearch } = useTableSearch();

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
          roles: apiUser.roles ? apiUser.roles.map((role: ApiRole) => role.name || t('common:role.unknown')) : [],
          is_active: apiUser.is_active,
          created_at: apiUser.created_at ? format(new Date(apiUser.created_at), 'yyyy-MM-dd HH:mm:ss') : t('table.value.not_applicable'),
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
      message.error(t('message.fetch_roles_error'));
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
    
    fetchUsers({ 
        pagination: newPagination,
        filters,
        sortField: sort.field as string,
        sortOrder: sort.order as string,
    });
  };

  const showCreateUserModal = () => {
    setEditingUser(null);
    userForm.resetFields();
    userForm.setFieldsValue({
      is_active: true,
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
      const { confirm_password, employee_id, ...apiValues } = values as UserFormCreationValues & { employee_id?: any };
      
      const payloadForApi: CreateUserPayload = {
        username: apiValues.username,
        password: apiValues.password as string,
        is_active: apiValues.is_active === undefined ? true : apiValues.is_active,
        role_ids: apiValues.role_ids?.map(id => Number(id)) || [],
        employee_first_name: apiValues.employee_first_name,
        employee_last_name: apiValues.employee_last_name,
        employee_id_card: apiValues.employee_id_card,
      };
      
      const cleanedPayloadForApi = Object.fromEntries(
        Object.entries(payloadForApi).filter(([_, v]) => v !== undefined)
      ) as CreateUserPayload;

      console.log("Submitting for create: ", cleanedPayloadForApi);
      const newUser = await createUser(cleanedPayloadForApi);
      
      message.success(t('message.create_user_success', { username: newUser.username }));
      setIsUserModalOpen(false);
      userForm.resetFields();
      setTableParams(prev => ({ ...prev, pagination: { ...prev.pagination, current: 1 }}));
      fetchUsers({ ...tableParams, pagination: { ...tableParams.pagination, current: 1 } });

    } catch (error: any) {
      console.error("创建用户失败:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || t('message.create_user_error.default');
      message.error(errorMsg);
    } finally {
      setUserModalLoading(false);
    }
  };

  const showEditUserModal = (userToEdit: ApiUser) => {
    setEditingUser(userToEdit);
    userForm.setFieldsValue({
      username: userToEdit.username,
      employee_first_name: userToEdit.employee?.first_name || '', 
      employee_last_name: userToEdit.employee?.last_name || '',
      employee_id_card: userToEdit.employee?.id_number || '',
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
      // Construct payload based on new fields from UserFormUpdateValues
      const payload: UpdateUserPayload = {
        is_active: values.is_active,
        role_ids: values.role_ids?.map(id => Number(id)),
        employee_first_name: values.employee_first_name,
        employee_last_name: values.employee_last_name,
        employee_id_card: values.employee_id_card,
      };
      
      // Filter out undefined fields, except for is_active which can be false
      // and employee association fields which can be null/undefined to signal unbinding (if backend expects them)
      // Backend is set to handle unbinding if all three (first_name, last_name, id_card) are null and were part of the request.
      // So, we should send them if they were part of the form submission (even if undefined).
      // The 'UpdateUserPayload' type should reflect this (all Optional).
      
      // Let's assume UpdateUserPayload in api/types.ts will be updated to include these optional fields.
      // The current UpdateUserPayload might not have them yet.
      // For now, we construct it and it will be an issue if updateUser API function doesn't expect them.
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([key, v]) => {
          if (key === 'is_active') return true; // always include is_active
          if (['employee_first_name', 'employee_last_name', 'employee_id_card'].includes(key)) return true; // send them even if undefined/null
          return v !== undefined;
        })
      ) as UpdateUserPayload;

      const updatedUser = await updateUser(editingUser.id, cleanedPayload); // updateUser will need to be adapted
      message.success(t('message.update_user_success', { username: updatedUser.username }));
      setIsUserModalOpen(false);
      fetchUsers(tableParams); // Refresh with current params
    } catch (error: any) {
      console.error("更新用户失败:", error);
      let errorMsg = t('message.update_user_error.default');

      // Attempt to get detailed message from backend
      const backendError = error.response?.data; // The full error response object
      if (backendError) {
        if (backendError.detail?.details && typeof backendError.detail.details === 'string') { // Assuming error is nested in detail.details
            errorMsg = backendError.detail.details;
        } else if (backendError.detail && typeof backendError.detail === 'string') { // Or directly in detail
            errorMsg = backendError.detail;
        } else if (backendError.error?.details && typeof backendError.error.details === 'string') { // Common structure { error: { details: "..."}}
             errorMsg = backendError.error.details;
        } else if (backendError.error?.message && typeof backendError.error.message === 'string') {
             errorMsg = backendError.error.message;
        } else if (typeof backendError === 'string') { // If the data itself is a string message
             errorMsg = backendError;
        }
      }
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
      title: t('modal.confirm_delete.title', { username }),
      content: t('modal.confirm_delete.content'),
      okText: t('modal.confirm_delete.ok_text'),
      okType: 'danger',
      cancelText: t('modal.confirm_delete.cancel_text'),
      onOk: async () => {
        try {
          await deleteUser(userId);
          message.success(t('message.delete_user_success', { username }));
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
          const errorMsg = error.response?.data?.detail || error.response?.data?.error?.message || t('message.delete_user_error.default');
          message.error(errorMsg);
        }
      },
    });
  };

  // 使用通用表格工具定义列
  const initialColumns: ColumnsType<PageUser> = [
    {
      title: t('table.column.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: numberSorter<PageUser>('id'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('id'),
    },
    {
      title: t('table.column.username'),
      dataIndex: 'username',
      key: 'username',
      sorter: stringSorter<PageUser>('username'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('username'),
    },
    {
      title: t('table.column.employee_id'),
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120,
      sorter: numberSorter<PageUser>('employee_id'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('employee_id'),
    },
    {
      title: t('table.column.roles'),
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <div className={styles.roleTagsContainer}>
          {roles.map((role, index) => (
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
      render: (isActive: boolean) => (
        isActive ? 
          <Tag color="green">{t('table.value.active')}</Tag> : 
          <Tag color="red">{t('table.value.inactive')}</Tag>
      ),
    },
    {
      title: t('table.column.created_at'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      sorter: dateSorter<PageUser>('created_at'),
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: t('table.column.actions'),
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <TableActionButton
            actionType="edit"
            onClick={() => {
              const apiUser = allApiUsersForEdit.find(u => u.id === record.id);
              if (apiUser) {
                showEditUserModal(apiUser);
              } else {
                message.error(t('message.user_not_found_for_edit'));
              }
            }}
            tooltipTitle={t('tooltip.edit_user')}
          />
          <TableActionButton
            actionType="delete"
            danger
            onClick={() => handleDeleteUser(record.id, record.username)}
            tooltipTitle={t('tooltip.delete_user')}
          />
        </Space>
      ),
    },
  ];

  // 使用表格导出功能
  const { ExportButton } = useTableExport(
    users,
    initialColumns,
    {
      filename: t('user:user_list_page.export.filename'),
      sheetName: t('user:user_list_page.export.sheet_name'),
      buttonText: t('common:action.export'),
    }
  );

  // 使用列设置功能
  const { ColumnControl, visibleColumns } = useColumnControl(
    initialColumns,
    {
      storageKeyPrefix: 'user_list_table',
      buttonText: t('common:action.columns'),
      tooltipTitle: t('common:tooltip.column_settings')
    }
  );



  return (
    <PageLayout
      title={t('user_list_page.title')}
      actions={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateUserModal}
            shape="round"
          >
            {t('user_list_page.button.create_user')}
          </Button>
          {ExportButton && <ExportButton />}
          {ColumnControl && <ColumnControl />}
        </Space>
      }
    >
      <div className={styles.tableContainer}>
        <Table
        columns={visibleColumns}
        dataSource={users}
        loading={loading}
        onChange={handleTableChange}
        pagination={tableParams.pagination}
        rowKey="key"
      />
      <Modal
        title={editingUser ? t('modal.title.edit_user') : t('modal.title.create_user')}
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
            label={t('form.username.label')}
            rules={[{ required: true, message: t('form.username.validation.required') }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <>
              <Form.Item
                name="password"
                label={t('form.password.label')}
                rules={[{ required: true, message: t('form.password.validation.required') }]}
                hasFeedback
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label={t('form.confirm_password.label')}
                dependencies={['password']}
                hasFeedback
                rules={[
                  { required: true, message: t('form.confirm_password.validation.required') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('form.confirm_password.validation.match')));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Typography.Text strong className={styles.formSectionHeader}>
            {t('form.section.employee_association')}
          </Typography.Text>
          <Form.Item
            name="employee_last_name"
            label={t('form.label.employee_last_name')}
          >
            <Input placeholder={t('form.placeholder.employee_last_name')} />
          </Form.Item>
          <Form.Item
            name="employee_first_name"
            label={t('form.label.employee_first_name')}
          >
            <Input placeholder={t('form.placeholder.employee_first_name')} />
          </Form.Item>
          <Form.Item
            name="employee_id_card"
            label={t('form.label.employee_id_card')}
            tooltip={t('form.tooltip.employee_id_card_for_association')}
          >
            <Input placeholder={t('form.placeholder.employee_id_card')} />
          </Form.Item>
          
          <Form.Item
            name="role_ids"
            label={t('form.roles.label')}
            rules={[{ required: true, message: t('form.roles.validation.required') }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder={t('form.roles.placeholder')}
              options={allRoles.map(role => ({ label: role.name, value: role.id }))}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label={t('form.status.label')}
            valuePropName="checked"
          >
            <Switch 
              checkedChildren={t('form.status_switch.active')} 
              unCheckedChildren={t('form.status_switch.inactive')}
            />
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </PageLayout>
  );
};

export default UserListPage;