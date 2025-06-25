import React from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import { useUserManagementLogic } from './UsersV2/hooks/useUserManagementLogic';
import UsersTable from './UsersV2/components/UsersTable';
import UserFormModal from './components/UserFormModal';

const UsersPageV2: React.FC = () => {
  const {
    t,
    loading,
    dataSource,
    isModalVisible,
    currentUser,
    permissions,
    handlers,
  } = useUserManagementLogic();

  const pageActions = (
    <Space>
      <Button icon={<ReloadOutlined />} onClick={handlers.fetchData}>
        {t('common:action.refresh')}
      </Button>
      {permissions.canAdd && (
        <Button type="primary" icon={<PlusOutlined />} onClick={handlers.handleAdd}>
          {t('common:action.create')}
        </Button>
      )}
    </Space>
  );

  return (
    <StandardPageLayout
      title={t('pageTitle:user_management')}
      subtitle={t('user:subtitle')}
      actions={pageActions}
      isLoading={loading}
    >
      <UsersTable
        loading={loading}
        dataSource={dataSource}
        permissions={permissions}
        onEdit={handlers.handleEdit}
        onDelete={handlers.handleDelete}
        t={t}
      />
      <UserFormModal
        visible={isModalVisible}
        onClose={() => handlers.setIsModalVisible(false)}
        onSuccess={handlers.handleFormSuccess}
        user={currentUser}
      />
    </StandardPageLayout>
  );
};

export default UsersPageV2;