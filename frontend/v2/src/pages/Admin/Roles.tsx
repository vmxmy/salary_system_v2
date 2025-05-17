import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Input, Space, Typography, message, Tag, Form, Modal, Switch, Transfer } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import ActionButton from '../../components/common/ActionButton';
import type { InputRef } from 'antd';
import type { ColumnType, ColumnsType } from 'antd/lib/table';
import type { FilterConfirmProps } from 'antd/lib/table/interface';
import { getRoles, createRole, updateRole, deleteRole } from '../../api/roles';
import { getPermissions as apiGetPermissions } from '../../api/permissions';
import type { Role, Permission, CreateRolePayload, UpdateRolePayload } from '../../api/types';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

// Correctly define DataIndex as a type alias for keyof Role
type DataIndex = keyof Role;

// Define a type for the form values to accurately reflect field types, esp. permission_ids as string[]
interface RoleFormValues {
  name: string;
  code: string;
  permission_ids?: string[]; 
}

const RoleListPage: React.FC = () => {
  const { t } = useTranslation('role');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState<DataIndex | '' >('');
  const [form] = Form.useForm<RoleFormValues>(); // Use the dedicated form values type

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // Permissions states
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState<boolean>(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const apiResponse = await getRoles(); 
      setRoles(apiResponse.data || []); 
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      message.error(t('message.fetch_roles_error'));
      setRoles([]); 
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
    fetchAllPermissions();
  }, []);

  // Fetch all permissions
  const fetchAllPermissions = async () => {
    setLoadingPermissions(true);
    try {
      // getPermissions from api/permissions.ts is defined as: export const getPermissions = async (): Promise<Permission[]> => { ... return response.data.data; }
      // This means it already extracts the Permission[] array.
      const permissionsArray = await apiGetPermissions(); // No arguments needed
      setAllPermissions(permissionsArray || []); // Directly use the returned array
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      message.error(t('message.fetch_permissions_error'));
      setAllPermissions([]);
    }
    setLoadingPermissions(false);
  };

  const searchInput = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: DataIndex
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex); 
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn(''); 
  };

  // Modal Actions
  const showCreateModal = () => {
    setEditingRole(null);
    form.resetFields(); 
    // Explicitly set default values according to RoleFormValues
    form.setFieldsValue({ name: '', code: '', permission_ids: [] });
    setIsModalOpen(true);
  };

  const showEditModal = (role: Role) => {
    setEditingRole(role);
    const currentPermissionIdsAsStrings = (role.permissions || []).map(p => p.id.toString());
    form.setFieldsValue({
      name: role.name,
      code: role.code,
      permission_ids: currentPermissionIdsAsStrings,
    });
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: RoleFormValues) => {
    setModalLoading(true);
    const submissionPermissionIds = (values.permission_ids || []).map(idStr => parseInt(idStr, 10));

    try {
      if (editingRole) {
        const payload: UpdateRolePayload = { 
          name: values.name !== editingRole.name ? values.name : undefined,
          code: values.code !== editingRole.code ? values.code : undefined, 
          permission_ids: submissionPermissionIds, 
        };
        const cleanedPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined)
        ) as UpdateRolePayload;
        
        await updateRole(editingRole.id, cleanedPayload);
        message.success(t('message.update_role_success'));
      } else {
        if (!values.name || !values.code) {
          message.error(t('message.create_role_error_name_code_required'));
          setModalLoading(false);
          return;
        }
        const payload: CreateRolePayload = {
          name: values.name,
          code: values.code,
          permission_ids: submissionPermissionIds,
        };
        await createRole(payload);
        message.success(t('message.create_role_success'));
      }
      setIsModalOpen(false);
      setEditingRole(null);
      form.resetFields();
      fetchRoles(); // Refresh the roles list
    } catch (error: any) {
      console.error("Role operation failed:", error);
      
      let errorToDisplay: string = editingRole 
        ? t('message.update_role_error') 
        : t('message.create_role_error'); 

      if (error.response?.data) {
        const serverErrorData = error.response.data;
        const detail = serverErrorData.detail;

        if (typeof detail === 'string') {
          errorToDisplay = detail;
        } else if (typeof detail === 'object' && detail !== null) {
          // Try to extract common error message patterns from object 'detail'
          if (typeof detail.message === 'string') { // e.g. { message: "..." }
            errorToDisplay = detail.message;
          } else if (Array.isArray(detail) && detail.length > 0 && typeof detail[0].msg === 'string') { // FastAPI validation detail
            errorToDisplay = detail[0].msg;
          } else if (detail.error && typeof detail.error.message === 'string') { // e.g. { error: { message: "..."} }
             errorToDisplay = detail.error.message;
          } else if (typeof detail.error === 'string') { // e.g. { error: "..." }
             errorToDisplay = detail.error;
          }
          // If detail is an object but no known message structure is found, the default message will be used.
        } else if (serverErrorData.error) {
           // Fallback to other common error structures if detail is not the primary source
           if (typeof serverErrorData.error === 'string') {
             errorToDisplay = serverErrorData.error;
           } else if (typeof serverErrorData.error === 'object' && serverErrorData.error !== null && typeof serverErrorData.error.message === 'string') {
             errorToDisplay = serverErrorData.error.message;
           }
        } else if (Array.isArray(serverErrorData.errors) && serverErrorData.errors.length > 0 && typeof serverErrorData.errors[0].message === 'string') {
            // Handle cases like { errors: [{ field: "f", message: "m" }] }
            errorToDisplay = serverErrorData.errors[0].message;
        }

        // For 500 errors, also log the full response data for easier debugging
        if (error.response.status === 500) {
          console.error("Server 500 error response data:", serverErrorData);
        }
      }
      message.error(errorToDisplay);
    }
    setModalLoading(false);
  };

  const getColumnSearchProps = (dataIndex: DataIndex): ColumnType<Role> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`${t('table.search.placeholder_prefix')}${String(dataIndex)}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {t('table.search.button_search')}
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            {t('table.search.button_reset')}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            {t('table.search.button_filter')}
          </Button>
          <Button type="link" size="small" onClick={() => close()}>
            {t('table.search.button_close')}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      if (recordValue !== undefined && recordValue !== null) { 
        return recordValue.toString().toLowerCase().includes((value as string).toLowerCase());
      }
      return false;
    },
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      }
    },
  });

  const handleDeleteRole = async (roleId: number) => {
    try {
      await deleteRole(roleId);
      message.success(t('message.delete_role_success'));
      fetchRoles();
    } catch (error: any) {
      console.error("Failed to delete role:", error);
      const errorMsg = error.response?.data?.detail || t('message.delete_role_error');
      message.error(errorMsg);
    }
  };

  const columns: ColumnsType<Role> = [
    {
      title: t('table.column.id'),
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('table.column.code'),
      dataIndex: 'code',
      key: 'code',
      ...getColumnSearchProps('code'),
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: t('table.column.name'),
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('table.column.actions'),
      key: 'action',
      width: 180,
      render: (_: any, record: Role) => (
        <Space size="middle">
          <ActionButton actionType="edit" onClick={() => showEditModal(record)} tooltipTitle={t('tooltip.edit_role')} />
          <ActionButton
            actionType="delete"
            danger
            onClick={() => Modal.confirm({
              title: t('modal.confirm_delete.title'),
              content: t('modal.confirm_delete.content', { roleName: record.name }),
              okText: t('modal.confirm_delete.ok_text'),
              okType: 'danger',
              cancelText: t('modal.confirm_delete.cancel_text'),
              onOk: () => handleDeleteRole(record.id),
            })}
            tooltipTitle={t('tooltip.delete_role')}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ marginBottom: 0 }}>{t('title')}</Title> 
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
          shape="round"
        >
          {t('button.create_role')}
        </Button>
      </div>
      <Table 
        columns={columns}
        dataSource={roles.map(role => ({ ...role, key: role.id }))} 
        loading={loading} 
        rowKey="id" 
      />
      <Modal
        title={editingRole 
          ? t('modal.role_form.title.edit') 
          : t('modal.role_form.title.create')}
        open={isModalOpen}
        onOk={form.submit}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          name="roleForm"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            name="name"
            label={t('modal.role_form.label.name')}
            rules={[{ required: true, message: t('modal.role_form.validation.name_required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label={t('modal.role_form.label.code')}
            rules={[{ required: true, message: t('modal.role_form.validation.code_required') }]}
          >
            <Input disabled={!!editingRole} />
          </Form.Item>
          <Form.Item
            name="permission_ids"
            label={t('modal.role_form.label.permissions')}
          >
            <Transfer
              dataSource={allPermissions.map(p => ({
                key: p.id.toString(),
                title: p.code,
                description: p.description || p.code,
              }))}
              render={item => `${item.title} (${item.description})`}
              listStyle={{
                width: '100%',
                height: 300,
              }}
              disabled={loadingPermissions}
              showSearch
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleListPage;