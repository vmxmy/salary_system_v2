import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Progress, 
  Modal, 
  message, 
  Statistic, 
  Row, 
  Col,
  Tooltip,
  Dropdown,
  Menu,
  Typography,
  Card,
  Divider
} from 'antd';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  batchReportsApi,
  type BatchReportTask
} from '../../../api/batchReports';
import BatchReportExport from '../../../components/BatchReportExport';
import styles from '../../../styles/reportConfig.module.css';

const { Text, Title } = Typography;

const BatchReportsManagement: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const queryClient = useQueryClient();

  // 获取任务列表
  const { data: tasksData, isLoading, refetch } = useQuery({
    queryKey: ['batchReportTasks'],
    queryFn: () => batchReportsApi.getTasks(),
    refetchInterval: 5000, // 每5秒刷新一次
  });

  // 删除任务
  const deleteMutation = useMutation({
    mutationFn: batchReportsApi.deleteTask,
    onSuccess: () => {
      message.success('任务删除成功');
      queryClient.invalidateQueries({ queryKey: ['batchReportTasks'] });
      setSelectedRowKeys([]);
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message}`);
    },
  });

  // 下载文件
  const handleDownload = async (taskId: number) => {
    try {
      const downloadInfo = await batchReportsApi.getTaskDownloadInfo(taskId);
      const blob = await batchReportsApi.downloadTask(taskId);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadInfo.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('下载开始');
    } catch (error: any) {
      message.error(`下载失败: ${error.message}`);
    }
  };

  // 删除任务
  const handleDelete = (taskId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个批量报表任务吗？此操作不可恢复。',
      onOk: () => deleteMutation.mutate(taskId),
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的任务');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个任务吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map(taskId => batchReportsApi.deleteTask(taskId as number))
          );
          message.success('批量删除成功');
          queryClient.invalidateQueries({ queryKey: ['batchReportTasks'] });
          setSelectedRowKeys([]);
        } catch (error: any) {
          message.error(`批量删除失败: ${error.message}`);
        }
      },
    });
  };

  // 状态标签
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'blue', text: '等待中' },
      running: { color: 'orange', text: '执行中' },
      completed: { color: 'green', text: '已完成' },
      failed: { color: 'red', text: '失败' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 操作菜单
  const getActionMenu = (record: BatchReportTask) => (
    <Menu>
      <Menu.Item 
        key="download" 
        icon={<DownloadOutlined />}
        disabled={record.status !== 'completed' || record.completed_reports === 0}
        onClick={() => handleDownload(record.id)}
      >
        下载文件
      </Menu.Item>
      <Menu.Item 
        key="delete" 
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDelete(record.id)}
      >
        删除任务
      </Menu.Item>
    </Menu>
  );

  // 表格列定义
  const columns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: BatchReportTask) => (
        <div className={styles.width100}>
          <Progress 
            percent={progress} 
            size="small" 
            status={record.status === 'failed' ? 'exception' : undefined}
          />
        </div>
      ),
    },
    {
      title: '报表统计',
      key: 'reports',
      render: (record: BatchReportTask) => (
        <Space direction="vertical" size="small">
          <Text>总数: {record.total_reports}</Text>
          <Text>完成: {record.completed_reports}</Text>
          {record.failed_reports > 0 && (
            <Text type="danger">失败: {record.failed_reports}</Text>
          )}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: BatchReportTask) => (
        <Space size="small">
          <Tooltip title="下载文件">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              disabled={record.status !== 'completed' || record.completed_reports === 0}
              onClick={() => handleDownload(record.id)}
            />
          </Tooltip>
          <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
            <Button type="link" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = tasksData ? {
    total: tasksData.length,
    pending: tasksData.filter((t: BatchReportTask) => t.status === 'pending').length,
    running: tasksData.filter((t: BatchReportTask) => t.status === 'running').length,
    completed: tasksData.filter((t: BatchReportTask) => t.status === 'completed').length,
    failed: tasksData.filter((t: BatchReportTask) => t.status === 'failed').length,
  } : { total: 0, pending: 0, running: 0, completed: 0, failed: 0 };

  return (
    <div className={styles.padding24}>
      <Card>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardTitleLeft}>
              <Title level={4} className={styles.cardTitleText}>
                <ExportOutlined /> 批量报表管理
              </Title>
            </div>
            <div className={styles.cardTitleRight}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setShowExportModal(true)}
                className={styles.primaryButton}
              >
                新建任务
              </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetch()}
              loading={isLoading}
                className={styles.secondaryButton}
            >
              刷新
            </Button>
            </div>
          </div>
        </div>

        <Divider />

        {/* 统计信息 */}
        <Row gutter={16} className={styles.marginBottom16}>
          <Col span={4}>
            <Statistic title="总任务数" value={stats.total} className={styles.statisticCard} />
          </Col>
          <Col span={4}>
            <Statistic 
              title="等待中" 
              value={stats.pending} 
              valueStyle={{ color: '#1890ff' }}
              className={styles.statisticCard}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="执行中" 
              value={stats.running} 
              valueStyle={{ color: '#fa8c16' }}
              className={styles.statisticCard}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="已完成" 
              value={stats.completed} 
              valueStyle={{ color: '#52c41a' }}
              className={styles.statisticCard}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="失败" 
              value={stats.failed} 
              valueStyle={{ color: '#ff4d4f' }}
              className={styles.statisticCard}
            />
        </Col>
      </Row>

      {/* 操作栏 */}
        <div className={styles.marginBottom16}>
        <Space>
          <Button 
            danger
            disabled={selectedRowKeys.length === 0}
            onClick={handleBatchDelete}
            loading={deleteMutation.isPending}
          >
            批量删除 ({selectedRowKeys.length})
          </Button>
        </Space>
      </div>

      {/* 任务列表 */}
      <Table
        columns={columns}
        dataSource={tasksData || []}
        rowKey="id"
        loading={isLoading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
      />
      </Card>

      {/* 新建任务模态框 */}
      <Modal
        title="创建批量报表任务"
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <BatchReportExport
          onSuccess={() => {
            setShowExportModal(false);
            refetch();
          }}
          onCancel={() => setShowExportModal(false)}
        />
      </Modal>
    </div>
  );
};

export default BatchReportsManagement; 