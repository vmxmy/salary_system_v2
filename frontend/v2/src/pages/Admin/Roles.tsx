import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Input, Space, Typography, message, Form, Modal, Transfer, Tooltip } from 'antd';
import { PlusOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import TableActionButton from '../../components/common/TableActionButton';
import PageHeaderLayout from '../../components/common/PageHeaderLayout';
import type { ColumnsType } from 'antd/lib/table';
import { getRoles, createRole, updateRole, deleteRole } from '../../api/roles';
import { getPermissions as apiGetPermissions } from '../../api/permissions';
import type { Role, Permission, CreateRolePayload, UpdateRolePayload } from '../../api/types';
import { useTranslation } from 'react-i18next';
import { useTableSearch, numberSorter, stringSorter, useTableExport, useColumnControl } from '../../components/common/TableUtils';

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

  // 使用通用表格搜索钩子
  const { getColumnSearch } = useTableSearch();

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

  // Table columns definition
  const columns: ColumnsType<Role> = [
    {
      title: t('table.column.id'),
      dataIndex: 'id',
      key: 'id',
      sorter: numberSorter<Role>('id'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('id'),
      width: 80,
    },
    {
      title: t('table.column.code'),
      dataIndex: 'code',
      key: 'code',
      sorter: stringSorter<Role>('code'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('code'),
      width: 150,
    },
    {
      title: t('table.column.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: stringSorter<Role>('name'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('name'),
      width: 200,
    },
    {
      title: t('table.column.permissions'),
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: Permission[]) => {
        if (!permissions || permissions.length === 0) return '-';
        return permissions.map(p => p.code).join(', ');
      },
      width: 300,
    },
    {
      title: t('table.column.actions'),
      key: 'actions',
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
      width: 120,
    },
  ];

  // 添加表格导出功能
  const { ExportButton } = useTableExport(
    roles || [], 
    columns, 
    {
      filename: '角色列表', 
      sheetName: '角色数据',
      buttonText: t('button.export_excel'),
      successMessage: t('message.export_success')
    }
  );
  
  // 添加列控制功能
  const { visibleColumns, ColumnControl } = useColumnControl(
    columns,
    {
      storageKeyPrefix: 'roles_table',
      buttonText: t('button.column_control'),
      tooltipTitle: t('tooltip.column_control'),
      dropdownTitle: t('dropdown.column_control_title'),
      resetText: t('button.reset'),
      requiredColumns: ['id', 'actions'] // ID和操作列始终显示
    }
  );

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
    <div>
      <PageHeaderLayout
        pageTitle={<Title level={2}>{t('page_title')}</Title>}
        actions={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              {t('button.create_role')}
            </Button>
            <Tooltip title={t('tooltip.export_excel')}>
              <ExportButton />
            </Tooltip>
            <ColumnControl />
          </Space>
        }
      >
        <></>
      </PageHeaderLayout>
      <Table
        columns={visibleColumns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={{ 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total) => t('pagination.total', { total }), 
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        bordered
        scroll={{ x: 'max-content' }}
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
              listStyle={{
                width: '100%',
                height: 300,
              }}
              disabled={loadingPermissions}
              showSearch
            />
          </Form.Item>
          
          <Form.Item name="permission_ids" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleListPage;