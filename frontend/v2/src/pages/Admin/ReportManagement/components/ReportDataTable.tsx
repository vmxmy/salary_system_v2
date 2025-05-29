import React, { useState, useEffect } from 'react';
import { Space, Tag, Tooltip, Button, Popconfirm, Card, Row, Col, Typography, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined, ShareAltOutlined } from '@ant-design/icons';
import { DataTable } from '../../../../components/common';
import type { DataTableColumn, ExportFormat } from '../../../../components/common/DataTable';

const { Text, Title } = Typography;

export interface ReportDataTableProps<T = any> {
  /** 数据源 */
  dataSource: T[];
  /** 表格类型 */
  type: 'templates' | 'calculatedFields' | 'dataSources';
  /** 加载状态 */
  loading?: boolean;
  /** 操作回调 */
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
  onCopy?: (record: T) => void;
  onShare?: (record: T) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 导出回调 */
  onExport?: (format: ExportFormat, data: T[]) => void;
}

const ReportDataTable = <T extends Record<string, any>>({
  dataSource,
  type,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onCopy,
  onShare,
  onRefresh,
  onExport,
}: ReportDataTableProps<T>) => {
  const [isMobile, setIsMobile] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 移动端卡片渲染
  const renderMobileCard = (record: T, index: number) => {
    const actionButtons = (
      <Space size="small">
        {onView && (
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
        )}
        {onEdit && (
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
        )}
        {onCopy && (
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => onCopy(record)} />
        )}
        {onShare && (
          <Button type="text" size="small" icon={<ShareAltOutlined />} onClick={() => onShare(record)} />
        )}
        {onDelete && (
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => onDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </Space>
    );

    switch (type) {
      case 'templates':
        return (
          <Card key={record.id || index} size="small" style={{ marginBottom: 8 }}>
            <Row justify="space-between" align="top">
              <Col span={18}>
                <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                  {record.name}
                </Title>
                {record.description && (
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                    {record.description}
                  </Text>
                )}
                <Space size="small" wrap>
                  <Tag color="blue">{record.category}</Tag>
                  <Tag color={record.is_active ? 'success' : 'default'}>
                    {record.is_active ? '启用' : '禁用'}
                  </Tag>
                  <Tag color={record.is_public ? 'green' : 'orange'}>
                    {record.is_public ? '公开' : '私有'}
                  </Tag>
                </Space>
                <Divider style={{ margin: '8px 0' }} />
                <Row gutter={16}>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>字段数量</Text>
                    <div>{record.field_count}</div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>创建者</Text>
                    <div>{record.creator_name}</div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>更新时间</Text>
                    <div style={{ fontSize: '12px' }}>{new Date(record.updated_at).toLocaleString()}</div>
                  </Col>
                </Row>
              </Col>
              <Col span={6} style={{ textAlign: 'right' }}>
                {actionButtons}
              </Col>
            </Row>
          </Card>
        );

      case 'calculatedFields':
        return (
          <Card key={record.id || index} size="small" style={{ marginBottom: 8 }}>
            <Row justify="space-between" align="top">
              <Col span={18}>
                <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                  {record.name}
                </Title>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                  别名: {record.alias}
                </Text>
                {record.description && (
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                    {record.description}
                  </Text>
                )}
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: '12px' }}>公式: </Text>
                  <code style={{ fontSize: '11px', backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>
                    {record.formula.length > 50 ? `${record.formula.substring(0, 50)}...` : record.formula}
                  </code>
                </div>
                <Space size="small" wrap>
                  <Tag color="purple">{record.return_type}</Tag>
                  <Tag color="blue">{record.category}</Tag>
                  <Tag color={record.is_global ? 'success' : 'default'}>
                    {record.is_global ? '全局' : '私有'}
                  </Tag>
                  <Tag color={record.is_active ? 'success' : 'default'}>
                    {record.is_active ? '启用' : '禁用'}
                  </Tag>
                </Space>
              </Col>
              <Col span={6} style={{ textAlign: 'right' }}>
                {actionButtons}
              </Col>
            </Row>
          </Card>
        );

      case 'dataSources':
        return (
          <Card key={record.id || index} size="small" style={{ marginBottom: 8 }}>
            <Row justify="space-between" align="top">
              <Col span={18}>
                <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                  {record.name}
                </Title>
                {record.description && (
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                    {record.description}
                  </Text>
                )}
                <div style={{ marginBottom: 8 }}>
                  <code style={{ fontSize: '12px' }}>{record.schema_name}.{record.table_name}</code>
                </div>
                <Space size="small" wrap>
                  <Tag color="blue">{record.connection_type?.toUpperCase()}</Tag>
                  <Tag color={record.is_active ? 'success' : 'default'}>
                    {record.is_active ? '启用' : '禁用'}
                  </Tag>
                </Space>
                <Divider style={{ margin: '8px 0' }} />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  字段数: {record.field_count || 0}
                </Text>
              </Col>
              <Col span={6} style={{ textAlign: 'right' }}>
                {actionButtons}
              </Col>
            </Row>
          </Card>
        );

      default:
        return null;
    }
  };
  
  // 根据类型生成不同的列配置
  const getColumns = (): DataTableColumn<T>[] => {
    const commonActions = (record: T) => (
      <Space size="small">
        {onView && (
          <Tooltip title="查看">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
        )}
        {onCopy && (
          <Tooltip title="复制">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => onCopy(record)}
            />
          </Tooltip>
        )}
        {onShare && (
          <Tooltip title="分享">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={() => onShare(record)}
            />
          </Tooltip>
        )}
        {onDelete && (
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => onDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        )}
      </Space>
    );

    switch (type) {
      case 'templates':
        return [
          {
            title: '报表名称',
            dataIndex: 'name',
            key: 'name',
            width: isMobile ? 200 : undefined,
            render: (dom: React.ReactNode, record: any) => (
              <div>
                <div style={{ fontWeight: 'bold' }}>{record.name}</div>
                {record.description && !isMobile && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {record.description}
                  </div>
                )}
              </div>
            ),
          },
          {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            hideInTable: isMobile,
            render: (dom: React.ReactNode, record: any) => record.category && <Tag color="blue">{record.category}</Tag>,
          },
          {
            title: '字段数量',
            dataIndex: 'field_count',
            key: 'field_count',
            align: 'center',
            width: 80,
            hideInTable: isMobile,
          },
          {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 80,
            statusConfig: {
              type: 'active',
              colorMap: { true: 'success', false: 'default' }
            }
          },
          {
            title: '可见性',
            dataIndex: 'is_public',
            key: 'is_public',
            width: 80,
            hideInTable: isMobile,
            render: (dom: React.ReactNode, record: any) => (
              <Tag color={record.is_public ? 'green' : 'orange'}>
                {record.is_public ? '公开' : '私有'}
              </Tag>
            ),
          },
          {
            title: '创建者',
            dataIndex: 'creator_name',
            key: 'creator_name',
            width: 100,
            hideInTable: isMobile,
          },
          {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 150,
            hideInTable: isMobile,
            render: (dom: React.ReactNode, record: any) => new Date(record.updated_at).toLocaleString(),
          },
          {
            title: '操作',
            key: 'actions',
            fixed: 'right',
            width: isMobile ? 120 : 200,
            render: (_: any, record: T) => commonActions(record),
          },
        ];

      case 'calculatedFields':
        return [
          {
            title: '字段名称',
            dataIndex: 'name',
            key: 'name',
            width: isMobile ? 150 : undefined,
            render: (dom: React.ReactNode, record: any) => (
              <div>
                <div style={{ fontWeight: 'bold' }}>{record.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  别名: {record.alias}
                </div>
              </div>
            ),
          },
          {
            title: '计算公式',
            dataIndex: 'formula',
            key: 'formula',
            width: isMobile ? 200 : 300,
            render: (dom: React.ReactNode, record: any) => (
              <code style={{ fontSize: '12px' }}>
                {isMobile && record.formula.length > 30 
                  ? `${record.formula.substring(0, 30)}...`
                  : record.formula
                }
              </code>
            ),
          },
          {
            title: '返回类型',
            dataIndex: 'return_type',
            key: 'return_type',
            width: 100,
            hideInTable: isMobile,
            render: (dom: React.ReactNode, record: any) => <Tag color="purple">{record.return_type}</Tag>,
          },
          {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            hideInTable: isMobile,
            render: (dom: React.ReactNode, record: any) => record.category && <Tag color="blue">{record.category}</Tag>,
          },
          {
            title: '全局可用',
            dataIndex: 'is_global',
            key: 'is_global',
            width: 80,
            hideInTable: isMobile,
            render: (dom: React.ReactNode, record: any) => record.is_global ? '是' : '否',
          },
          {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 80,
            statusConfig: {
              type: 'active',
              colorMap: { true: 'success', false: 'default' }
            }
          },
          {
            title: '创建者',
            dataIndex: 'creator_name',
            key: 'creator_name',
            width: 100,
            hideInTable: isMobile,
          },
          {
            title: '操作',
            key: 'actions',
            fixed: 'right',
            width: isMobile ? 80 : 120,
            render: (_: any, record: T) => commonActions(record),
          },
        ];

      case 'dataSources':
        return [
          {
            title: '数据源名称',
            dataIndex: 'name',
            key: 'name',
            width: isMobile ? 150 : undefined,
            render: (dom: React.ReactNode, record: any) => (
              <div>
                <div style={{ fontWeight: 'bold' }}>{record.name}</div>
                {record.description && !isMobile && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {record.description}
                  </div>
                )}
              </div>
            ),
          },
          {
            title: '表信息',
            key: 'table_info',
            width: isMobile ? 150 : 200,
            render: (_: any, record: any) => (
              <div>
                <code style={{ fontSize: isMobile ? '10px' : '12px' }}>
                  {record.schema_name}.{record.table_name}
                </code>
                {!isMobile && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    字段数: {record.field_count}
                  </div>
                )}
              </div>
            ),
          },
          {
            title: '连接类型',
            dataIndex: 'connection_type',
            key: 'connection_type',
            width: 100,
            hideInTable: isMobile,
            render: (dom: React.ReactNode, record: any) => <Tag color="blue">{record.connection_type?.toUpperCase()}</Tag>,
          },
          {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 80,
            statusConfig: {
              type: 'active',
              colorMap: { true: 'success', false: 'default' }
            }
          },
          {
            title: '操作',
            key: 'actions',
            fixed: 'right',
            width: isMobile ? 120 : 200,
            render: (_: any, record: T) => commonActions(record),
          },
        ];

      default:
        return [];
    }
  };

  // 移动端渲染卡片，桌面端渲染表格
  if (isMobile) {
    return (
      <div>
        {dataSource.map((record, index) => renderMobileCard(record, index))}
        {dataSource.length === 0 && !loading && (
          <Card style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">暂无数据</Text>
          </Card>
        )}
      </div>
    );
  }

  return (
    <DataTable
      columns={getColumns()}
      dataSource={dataSource}
      loading={loading}
      showIndex
      bordered
      size="middle"
      toolbar={{
        showRefresh: true,
        showExport: true,
        showColumnSetting: true,
        showDensity: true,
        showFullscreen: true,
      }}
      onRefresh={onRefresh}
      onExport={(format: ExportFormat, data: T[]) => onExport?.(format, data)}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number, range: [number, number]) =>
          `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
      }}
      scroll={{ x: isMobile ? 800 : 1200 }}
    />
  );
};

export default ReportDataTable; 