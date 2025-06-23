import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Space, 
  Tag, 
  Button,
  message,
  App,
  Typography,
  Row,
  Col,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  SafetyOutlined,
  KeyOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';

import ModernPageTemplate from '../../components/common/ModernPageTemplate';
import ModernCard from '../../components/common/ModernCard';
import TableActionButton from '../../components/common/TableActionButton';
import RoleFormModal from './components/RoleFormModal';

import type { Role } from '../../api/types';
import { getRoles, deleteRole } from '../../api/roles';

const { Title, Text } = Typography;

// 角色管理权限钩子
const useRolePermissions = () => {
  return useMemo(() => ({
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  }), []);
};

const RolesModern: React.FC = () => {
  const { t } = useTranslation(['role', 'common']);
  const { message: messageApi, modal } = App.useApp();
  const permissions = useRolePermissions();

  // 状态管理
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // 表格列定义
  const columns: ProColumns<Role>[] = useMemo(() => [
    {
      title: t('table.column.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      search: false,
      render: (_, record) => (
        <Text strong className="typography-caption">#{record.id}</Text>
      ),
    },
    {
      title: t('table.column.code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (_, record) => (
        <Tag color="blue" icon={<KeyOutlined />}>
          {record.code}
        </Tag>
      ),
    },
    {
      title: t('table.column.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <Text strong>{record.name}</Text>
      ),
    },
    {
      title: t('table.column.permissions'),
      dataIndex: 'permissions',
      key: 'permissions',
      width: 300,
      search: false,
      render: (_, record) => {
        const permissions = record.permissions || [];
        const displayCount = 3;
        const visiblePermissions = permissions.slice(0, displayCount);
        const remainingCount = permissions.length - displayCount;

        return (
          <Space wrap>
            {visiblePermissions.map((permission: any, index: number) => (
              <Tag key={index} color="green">
                {permission.name || permission.code}
              </Tag>
            ))}
            {remainingCount > 0 && (
              <Tag color="default">
                +{remainingCount} 更多
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: t('table.column.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      search: false,
      render: (_, record) => (
        <Text type="secondary">
          {(record as any).description || t('common:no_description')}
        </Text>
      ),
    },
    {
      title: t('table.column.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      search: false,
      render: (_, record) => (
        <Tag color={(record as any).is_active ? 'success' : 'default'}>
          {(record as any).is_active ? t('common:active') : t('common:inactive')}
        </Tag>
      ),
    },
    {
      title: t('table.column.actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space size="small">
          {permissions.canUpdate && (
            <TableActionButton
              actionType="edit"
              onClick={() => handleEdit(record)}
              tooltipTitle={t('common:edit')}
            />
          )}
          {permissions.canDelete && (
            <TableActionButton
              actionType="delete"
              onClick={() => handleDelete(record.id.toString())}
              tooltipTitle={t('common:delete')}
              danger
            />
          )}
        </Space>
      ),
    },
  ], [t, permissions]);

  // 数据加载
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRoles();
      const data = Array.isArray(response) ? response : (response as any).data || [];
      setRoles(data);
    } catch (error: any) {
      messageApi.error(t('common:errors.fetch_failed'));
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  }, [messageApi, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 事件处理函数
  const handleCreate = () => {
    setEditingRole(null);
    setModalVisible(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setModalVisible(true);
  };

  const handleDelete = (roleId: string) => {
    modal.confirm({
      title: t('common:confirm_delete'),
      content: t('role:confirm_delete_role'),
      onOk: async () => {
        try {
          await deleteRole(parseInt(roleId));
          messageApi.success(t('common:delete_success'));
          loadData();
        } catch (error: any) {
          messageApi.error(t('common:delete_failed'));
        }
      },
    });
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    loadData();
  };

  // 统计数据
  const statistics = useMemo(() => {
    const total = roles.length;
    const active = roles.filter(role => (role as any).is_active).length;
    const inactive = total - active;
    const totalPermissions = roles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0);

    return [
      {
        title: t('role:total_roles'),
        value: total,
        icon: <TeamOutlined />,
        color: 'var(--color-primary)',
      },
      {
        title: t('role:active_roles'),
        value: active,
        icon: <UserOutlined />,
        color: 'var(--color-success)',
      },
      {
        title: t('role:inactive_roles'),
        value: inactive,
        icon: <SafetyOutlined />,
        color: 'var(--color-warning)',
      },
      {
        title: t('role:total_permissions'),
        value: totalPermissions,
        icon: <KeyOutlined />,
        color: 'var(--color-info)',
      },
    ];
  }, [roles, t]);

  return (
    <ModernPageTemplate
      title={t('role:page_title')}
      headerExtra={
        permissions.canCreate ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="modern-button"
          >
            {t('role:create_role')}
          </Button>
        ) : undefined
      }
    >
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statistics.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <ModernCard
              title={stat.title}
              icon={stat.icon}
            >
              <div className="statistic-content">
                <div className="statistic-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            </ModernCard>
          </Col>
        ))}
      </Row>

      {/* 主表格 */}
      <ModernCard>
        <ProTable<Role>
          columns={columns}
          dataSource={roles}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total} ${t('common:items')}`,
          }}
          scroll={{ x: 1200 }}
          search={false}
          options={{
            reload: loadData,
            density: true,
            fullScreen: true,
            setting: true,
          }}
          toolBarRender={() => [
            <Button
              key="refresh"
              onClick={loadData}
              icon={<SettingOutlined />}
            >
              {t('common:refresh')}
            </Button>,
          ]}
        />
      </ModernCard>

      {/* 创建/编辑模态框 */}
      <RoleFormModal
        visible={modalVisible}
        role={editingRole}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
      />
    </ModernPageTemplate>
  );
};

export default RolesModern;