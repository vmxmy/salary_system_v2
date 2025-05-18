import React, { useState } from 'react';
import { Table, Button, Modal, message, Space, Typography, Card } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined } from '@ant-design/icons';
import ActionButton from '../../../components/common/ActionButton';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import type { ColumnsType } from 'antd/es/table';
import { getPermissions, createPermission, updatePermission, deletePermission } from '../../../api/permissions';
import type { Permission, CreatePermissionPayload, UpdatePermissionPayload } from '../../../api/types';
import PermissionForm from './components/PermissionForm';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

// Define a type for the variables passed to the update mutation, including the ID
interface UpdatePermissionVariables extends UpdatePermissionPayload {
  id: number;
}

const PermissionListPage: React.FC = () => {
  const { t } = useTranslation('permission');
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  const { data: permissions, isLoading, error: fetchError } = useQuery<Permission[], Error>({
    queryKey: ['permissions'],
    queryFn: getPermissions,
  });

  const createMutation = useMutation<
    Permission,
    Error,
    CreatePermissionPayload
  >({
    mutationFn: createPermission,
    onSuccess: (data: Permission) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      message.success(t('list_page.message.create_success', { permissionCode: data.code }));
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      message.error(`${t('list_page.message.create_error_prefix')}${error.message}`);
    },
  });

  const updateMutation = useMutation<
    Permission,
    Error,
    UpdatePermissionVariables
  >({
    mutationFn: (variables: UpdatePermissionVariables) => 
      updatePermission(variables.id, { code: variables.code, description: variables.description }),
    onSuccess: (data: Permission) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      message.success(t('list_page.message.update_success', { permissionCode: data.code }));
      setIsModalOpen(false);
      setEditingPermission(null);
    },
    onError: (error: Error) => {
      message.error(`${t('list_page.message.update_error_prefix')}${error.message}`);
    },
  });

  const deleteMutation = useMutation<
    void, // Expected return type from deletePermission is void
    Error, // Error type
    number // Variables type (permissionId)
  >({
    mutationFn: deletePermission,
    onSuccess: (_: void, permissionId: number) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      message.success(t('list_page.message.delete_success', { permissionId }));
    },
    onError: (error: Error, permissionId: number) => {
      message.error(`${t('list_page.message.delete_error_prefix', { permissionId })}${error.message}`);
    },
  });

  if (fetchError) {
    message.error(`${t('list_page.message.load_list_error_prefix')}${fetchError.message}`);
  }

  const columns: ColumnsType<Permission> = [
    {
      title: t('list_page.table.column.id'),
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('list_page.table.column.code'),
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: t('list_page.table.column.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('list_page.table.column.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <ActionButton actionType="edit" onClick={() => handleEdit(record)} tooltipTitle={t('list_page.tooltip.edit_permission')} />
          <ActionButton actionType="delete" danger onClick={() => handleDeleteConfirmation(record)} tooltipTitle={t('list_page.tooltip.delete_permission')} />
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingPermission(null);
    setIsModalOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setIsModalOpen(true);
  };

  const handleDeleteConfirmation = (permission: Permission) => {
    Modal.confirm({
      title: t('list_page.modal.confirm_delete.title', { permissionCode: permission.code }),
      content: t('list_page.modal.confirm_delete.content'),
      okText: t('list_page.modal.confirm_delete.ok_text'),
      okType: 'danger',
      cancelText: t('list_page.modal.confirm_delete.cancel_text'),
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(permission.id);
        } catch (e) {
          // Error is handled by the mutation's onError callback
          console.error("Delete submission error", e)
        }
      },
    });
  };

  const handleFormSubmit = async (values: CreatePermissionPayload | UpdatePermissionPayload) => {
    if (editingPermission) {
      await updateMutation.mutateAsync({ ...values, id: editingPermission.id });
    } else {
      await createMutation.mutateAsync(values as CreatePermissionPayload);
    }
  };

  return (
    <div>
      <PageHeaderLayout>
        <Title level={4} style={{ marginBottom: 0 }}>{t('list_page.title')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          shape="round"
        >
          {t('list_page.button.create_permission')}
        </Button>
      </PageHeaderLayout>
      <Table
        columns={columns}
        dataSource={permissions}
        loading={isLoading}
        rowKey="id"
        bordered
        pagination={{ pageSize: 200, showSizeChanger: false }} // Show all items on one page
      />
      {isModalOpen && (
        <PermissionForm
          visible={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPermission(null);
          }}
          initialData={editingPermission}
          onSubmit={handleFormSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default PermissionListPage; 