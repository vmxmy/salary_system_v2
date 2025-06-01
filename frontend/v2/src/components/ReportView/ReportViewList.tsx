/**
 * 报表视图列表组件
 * @description 显示报表视图列表，支持搜索、筛选、分页等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Tooltip,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SyncOutlined,
  SearchOutlined,
  ReloadOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { reportViewAPI } from '../../api/reportView';
import type { ReportViewListItem, SearchParams, PaginationParams } from '../../types/reportView';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface ReportViewListProps {
  onEdit?: (record: ReportViewListItem) => void;
  onView?: (record: ReportViewListItem) => void;
  onCreate?: () => void;
  onRefresh?: () => void;
}

const ReportViewList: React.FC<ReportViewListProps> = ({
  onEdit,
  onView,
  onCreate,
  onRefresh,
}) => {
  const { t } = useTranslation(['reportView', 'common']);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<ReportViewListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    page_size: 20,
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await reportViewAPI.getReportViews({
        ...pagination,
        ...searchParams,
      });
      
      // 后端直接返回数组
      setDataSource(response);
      setTotal(response.length);
    } catch (error: any) {
      message.error(t('components:auto__error_message__e58aa0'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagination, searchParams]);

  // 处理搜索
  const handleSearch = (keyword: string) => {
    setSearchParams(prev => ({ ...prev, keyword }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 处理筛选
  const handleFilter = (key: keyof SearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 处理删除
  const handleDelete = async (record: ReportViewListItem) => {
    try {
      await reportViewAPI.deleteReportView(record.id);
      message.success(t('components:auto_text_e588a0'));
      loadData();
    } catch (error: any) {
      message.error(t('components:auto__error_message__e588a0'));
    }
  };

  // 处理刷新
  const handleRefresh = () => {
    loadData();
    onRefresh?.();
  };

  // 渲染状态标签
  const renderStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', text: t('components:auto_text_e88d89') },
      created: { color: 'success', text: t('components:auto_text_e5b7b2') },
      error: { color: 'error', text: t('components:auto_text_e99499') },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<ReportViewListItem> = [
    {
      title: t('components:auto_text_e68aa5'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text, record) => (
        <div>
          <Space>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            <Text strong>{text}</Text>
          </Space>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('components:auto_text_e58886'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: t('components:auto_text_e78ab6'),
      dataIndex: 'view_status',
      key: 'view_status',
      width: 100,
      render: renderStatusTag,
    },
    {
      title: t('components:auto_text_e4bdbf'),
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 100,
      align: 'center',
      render: (count) => <Text type="secondary">{count || 0}</Text>,
    },
    {
      title: t('components:auto_text_e69c80'),
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      width: 150,
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: t('components:auto_text_e5889b'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: t('components:auto_text_e6938d'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('components:auto_text_e69fa5')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView?.(record)}
            />
          </Tooltip>
          <Tooltip title={t('components:auto_text_e7bc96')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('components:auto_text_e7a1ae')}
            description={`确定要删除报表视图"${record.name}"吗？`}
            onConfirm={() => handleDelete(record)}
            okText={t('components:auto_text_e7a1ae')}
            cancelText={t('components:auto_text_e58f96')}
          >
            <Tooltip title={t('components:auto_text_e588a0')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      {/* 搜索和筛选栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Search
            placeholder={t('components:auto_text_e6909c')}
            allowClear
            onSearch={handleSearch}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder={t('components:auto_text_e98089')}
            allowClear
            style={{ width: '100%' }}
            onChange={(value) => handleFilter('category', value)}
          >
            <Option value={t('components:auto_text_e5b7a5')}>工资报表</Option>
            <Option value={t('components:auto_text_e88083')}>考勤报表</Option>
            <Option value={t('components:auto_text_e4baba')}>人事报表</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder={t('components:auto_text_e98089')}
            allowClear
            style={{ width: '100%' }}
            onChange={(value) => handleFilter('view_status', value)}
          >
            <Option value="draft">草稿</Option>
            <Option value="created">已创建</Option>
            <Option value="error">错误</Option>
          </Select>
        </Col>
        <Col span={8}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreate}
            >
              新增报表
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.page_size,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => t('components:auto__range_0_range_1___total__e7acac'),
          onChange: (page, pageSize) => {
            setPagination({ page, page_size: pageSize || 20 });
          },
        }}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default ReportViewList; 