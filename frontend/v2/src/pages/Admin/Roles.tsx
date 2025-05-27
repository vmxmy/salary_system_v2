import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Space, Typography, message, Form, Modal, Transfer, Tooltip } from 'antd';
import { PlusOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import TableActionButton from '../../components/common/TableActionButton';
import PageLayout from '../../components/common/PageLayout';
import EnhancedProTable from '../../components/common/EnhancedProTable';
import type { ProColumns } from '@ant-design/pro-components';
import { getRoles, createRole, updateRole, deleteRole } from '../../api/roles';
import { getPermissions as apiGetPermissions } from '../../api/permissions';
import type { Role, Permission, CreateRolePayload, UpdateRolePayload } from '../../api/types';
import { useTranslation } from 'react-i18next';
import styles from './Roles.module.less'; // 导入样式

const { Title } = Typography;

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
  const [form] = Form.useForm<RoleFormValues>();



  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // Permissions states
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState<boolean>(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

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

  // Effect for initializing/resetting form when modal opens/closes or editingRole changes
  useEffect(() => {
    if (isModalOpen) {
      if (editingRole) {
        // Editing existing role
        const currentPermissionIdsAsStrings = (editingRole.permissions || []).map(p => p.id.toString());
        setSelectedPermissions(currentPermissionIdsAsStrings);
        form.setFieldsValue({
          name: editingRole.name,
          code: editingRole.code,
          permission_ids: currentPermissionIdsAsStrings,
        });
      } else {
        // Creating new role
        setSelectedPermissions([]);
        form.setFieldsValue({ name: '', code: '', permission_ids: [] });
      }
    } else {
      // Modal is closed
      setSelectedPermissions([]);
      form.resetFields();
    }
  }, [isModalOpen, editingRole, form]);

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

  // Modal Actions
  const showCreateModal = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const showEditModal = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: RoleFormValues) => {
    console.log('Form submitted with raw values:', values); // Log raw form values
    setModalLoading(true);
    const submissionPermissionIds = selectedPermissions.map(idStr => parseInt(idStr, 10));
    console.log('Submission permission IDs (numbers):', submissionPermissionIds); // Log numeric IDs

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
        
        console.log('Cleaned payload to be sent to API:', cleanedPayload); // Log the payload
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

  // ProTable 列定义
  const columns: ProColumns<Role>[] = [
    {
      title: t('table.column.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      valueType: 'digit',
    },
    {
      title: t('table.column.code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      sorter: (a, b) => a.code.localeCompare(b.code),
      valueType: 'text',
    },
    {
      title: t('table.column.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      valueType: 'text',
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
      title: t('table.column.actions'),
      key: 'actions',
      width: 120,
      search: false,
      render: (_, record) => (
        <Space size="middle">
          <TableActionButton
            actionType="edit"
            onClick={() => showEditModal(record)}
            tooltipTitle={t('tooltip.edit_role')}
          />
          <TableActionButton
            actionType="delete"
            danger
            onClick={() => showDeleteConfirm(record)}
            tooltipTitle={t('tooltip.delete_role')}
          />
        </Space>
      ),
    },
  ];

  const handleRefresh = async () => {
    await fetchRoles();
  };

  // 显示删除确认对话框
  const showDeleteConfirm = (role: Role) => {
    Modal.confirm({
      title: t('modal.confirm_delete.title'),
      content: t('modal.confirm_delete.content', { roleName: role.name }),
      okText: t('modal.confirm_delete.ok_text'),
      okType: 'danger',
      cancelText: t('modal.confirm_delete.cancel_text'),
      onOk: () => handleDeleteRole(role.id),
    });
  };

  return (
    <PageLayout
      title={t('page_title')}
      actions={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
            shape="round"
          >
            {t('button.create_role')}
          </Button>
        </Space>
      }
    >
      <div className={styles.tableContainer}>
        <EnhancedProTable<Role>
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          enableAdvancedFeatures={true}
          showToolbar={true}
          search={false}
          title={t('page_title')}
          onRefresh={handleRefresh}
          customToolbarButtons={[
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              {t('button.create_role')}
            </Button>
          ]}
        />
      </div>
      <Modal
        title={editingRole 
          ? t('modal.role_form.title.edit') 
          : t('modal.role_form.title.create')}
        open={isModalOpen}
        onOk={form.submit}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading}
        destroyOnHidden
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          name="roleForm"
          onFinish={handleFormSubmit}
          onValuesChange={(changedValues, allValues) => {
            console.log('Form values changed by Transfer:', changedValues, allValues);
          }}
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
            label={t('modal.role_form.label.permissions')}
          >
            <Transfer
              className={styles.customTransfer}
              dataSource={allPermissions.map(p => ({
                key: p.id.toString(),
                title: p.code,
                description: p.description || p.code,
              }))}
              targetKeys={selectedPermissions}
              onChange={(nextTargetKeys) => {
                setSelectedPermissions(nextTargetKeys as string[]);
                form.setFieldsValue({ permission_ids: nextTargetKeys as string[] });
              }}
              render={item => `${item.title} (${item.description})`}
              disabled={loadingPermissions}
              showSearch
            />
          </Form.Item>
          
          <Form.Item name="permission_ids" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  );
};

export default RoleListPage;