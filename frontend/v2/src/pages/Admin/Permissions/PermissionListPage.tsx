import React, { useState } from 'react';
import { Table, Button, Modal, message, Space, Typography, Card } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getPermissions, createPermission, updatePermission, deletePermission } from '../../../api/permissions';
import type { Permission, CreatePermissionPayload, UpdatePermissionPayload } from '../../../api/types';
import PermissionForm from './components/PermissionForm';

const { Title } = Typography;

// Define a type for the variables passed to the update mutation, including the ID
interface UpdatePermissionVariables extends UpdatePermissionPayload {
  id: number;
}

const PermissionListPage: React.FC = () => {
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
      message.success(`权限 "${data.code}" 已成功创建。`);
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      message.error(`创建权限失败: ${error.message}`);
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
      message.success(`权限 "${data.code}" 已成功更新。`);
      setIsModalOpen(false);
      setEditingPermission(null);
    },
    onError: (error: Error) => {
      message.error(`更新权限失败: ${error.message}`);
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
      message.success(`权限 ID ${permissionId} 已成功删除。`);
    },
    onError: (error: Error, permissionId: number) => {
      message.error(`删除权限 ID ${permissionId} 失败: ${error.message}`);
    },
  });

  if (fetchError) {
    message.error(`加载权限列表失败: ${fetchError.message}`);
  }

  const columns: ColumnsType<Permission> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteConfirmation(record)}>
            删除
          </Button>
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
      title: `您确定要删除权限 "${permission.code}" 吗?`,
      content: '此操作无法撤销。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
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
    <Card>
      <Title level={3}>权限管理</Title>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleCreate}
        style={{ marginBottom: 16 }}
      >
        创建权限
      </Button>
      <Table
        columns={columns}
        dataSource={permissions}
        loading={isLoading}
        rowKey="id"
        bordered
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
    </Card>
  );
};

export default PermissionListPage; 