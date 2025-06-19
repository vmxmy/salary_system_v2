import React, { type ReactNode } from 'react';
import { 
  Row, 
  Col, 
  Space, 
  Typography, 
  Badge,
  Card
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { 
  ProCard, 
  ProDescriptions
} from '@ant-design/pro-components';

import ActionButton from '../common/ActionButton';
import { MetricCardGroup, type MetricCardProps } from '../common/MetricCard';

const { Text } = Typography;

export interface OrganizationManagementTemplateProps {
  // 指标卡配置
  metrics: MetricCardProps[];
  metricsLoading?: boolean;
  
  // 左侧树形结构配置
  treeConfig: {
    title: string;
    icon: ReactNode;
    badge?: number;
    badgeColor?: string;
    onAdd?: () => void;
    addButtonText?: string;
    loading?: boolean;
    height?: string | number;
    children: ReactNode;
  };
  
  // 右侧详情配置
  detailConfig: {
    title: string;
    icon: ReactNode;
    selectedItem: any;
    emptyText?: string;
    emptyIcon?: ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    onAddChild?: () => void;
    editButtonText?: string;
    deleteButtonText?: string;
    addChildButtonText?: string;
    height?: string | number;
    columns: any[];
    loading?: boolean;
  };
  
  // 整体配置
  gutter?: [number, number];
  className?: string;
  style?: React.CSSProperties;
}

const OrganizationManagementTemplate: React.FC<OrganizationManagementTemplateProps> = ({
  metrics,
  metricsLoading = false,
  treeConfig,
  detailConfig,
  gutter = [24, 24],
  className,
  style
}) => {
  const {
    title: treeTitle,
    icon: treeIcon,
    badge,
    badgeColor = '#1890ff',
    onAdd,
    addButtonText = '新建',
    loading: treeLoading = false,
    height: treeHeight = '600px',
    children: treeChildren
  } = treeConfig;

  const {
    title: detailTitle,
    icon: detailIcon,
    selectedItem,
    emptyText = '请选择项目查看详情',
    emptyIcon,
    onEdit,
    onDelete,
    onAddChild,
    editButtonText = '编辑',
    deleteButtonText = '删除',
    addChildButtonText = '添加子项',
    height: detailHeight = '600px',
    columns,
    loading: detailLoading = false
  } = detailConfig;

  return (
    <div className={className} style={style}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 统计指标卡区域 */}
        {metrics && metrics.length > 0 && (
          <MetricCardGroup 
            metrics={metrics} 
            loading={metricsLoading}
            direction="row"
          />
        )}

        {/* 主要内容区域 */}
        <Row gutter={gutter}>
          {/* 左侧：树形结构 */}
          <Col xs={24} lg={12}>
            <ProCard
              bordered
              title={
                <Space>
                  {treeIcon}
                  <span>{treeTitle}</span>
                  {badge !== undefined && (
                    <Badge count={badge} showZero color={badgeColor} />
                  )}
                </Space>
              }
              extra={
                onAdd && (
                  <ActionButton
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onAdd}
                    size="small"
                  >
                    {addButtonText}
                  </ActionButton>
                )
              }
              loading={treeLoading}
              style={{ height: treeHeight }}
              bodyStyle={{ padding: '16px', overflow: 'auto' }}
            >
              {treeChildren}
            </ProCard>
          </Col>

          {/* 右侧：详情展示 */}
          <Col xs={24} lg={12}>
            {selectedItem ? (
              <ProCard
                bordered
                title={
                  <Space>
                    {detailIcon}
                    <span>{detailTitle}</span>
                  </Space>
                }
                extra={
                  <Space>
                    {onEdit && (
                      <ActionButton
                        icon={<EditOutlined />}
                        onClick={onEdit}
                        size="small"
                      >
                        {editButtonText}
                      </ActionButton>
                    )}
                    {onAddChild && (
                      <ActionButton
                        icon={<PlusOutlined />}
                        onClick={onAddChild}
                        size="small"
                      >
                        {addChildButtonText}
                      </ActionButton>
                    )}
                    {onDelete && (
                      <ActionButton
                        icon={<DeleteOutlined />}
                        onClick={onDelete}
                        size="small"
                        danger
                      >
                        {deleteButtonText}
                      </ActionButton>
                    )}
                  </Space>
                }
                style={{ height: detailHeight }}
                bodyStyle={{ padding: '16px', overflow: 'auto' }}
                loading={detailLoading}
              >
                <ProDescriptions
                  column={1}
                  size="small"
                  dataSource={selectedItem}
                  columns={columns}
                />
              </ProCard>
            ) : (
              <ProCard
                bordered
                style={{ height: detailHeight }}
                bodyStyle={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#999'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  {emptyIcon && (
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                      {emptyIcon}
                    </div>
                  )}
                  <div>{emptyText}</div>
                </div>
              </ProCard>
            )}
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default OrganizationManagementTemplate; 