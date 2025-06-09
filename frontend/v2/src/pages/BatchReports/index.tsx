import React, { useState, useEffect } from 'react';
import { 
  Card, 
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
  Menu
} from 'antd';
import styles from '../../styles/reportConfig.module.css';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  batchReportsApi,
  type BatchReportTask
} from '../../api/batchReports';
import BatchReportExport from '../../components/BatchReportExport';

const BatchReportsPage: React.FC = () => {
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
        disabled={record.status !== 'completed'}
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
        <div style={{ width: 100 }}>
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
          <span>总数: {record.total_reports}</span>
          <span>完成: {record.completed_reports}</span>
          {record.failed_reports > 0 && (
            <span style={{ color: '#ff4d4f' }}>失败: {record.failed_reports}</span>
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
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (record: BatchReportTask) => (
        <Space size="small">
          <Tooltip title="下载文件">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              disabled={record.status !== 'completed'}
              onClick={() => handleDownload(record.id)}
              size="small"
            />
          </Tooltip>
          <Dropdown overlay={getActionMenu(record)} trigger={['click']} placement="bottomRight">
            <Button type="link" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = tasksData ? {
    total: tasksData.length,
    running: tasksData.filter((t: BatchReportTask) => t.status === 'running').length,
    completed: tasksData.filter((t: BatchReportTask) => t.status === 'completed').length,
    failed: tasksData.filter((t: BatchReportTask) => t.status === 'failed').length,
  } : { total: 0, running: 0, completed: 0, failed: 0 };

  return (
    <div className={styles.pageContainer}>
      {/* 统计卡片 */}
      <Row gutter={16} className={styles.marginBottom16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card size="small" className={styles.statsCard}>
            <Statistic title="总任务数" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card size="small" className={styles.statsCard}>
            <Statistic 
              title="执行中" 
              value={stats.running} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card size="small" className={styles.statsCard}>
            <Statistic 
              title="已完成" 
              value={stats.completed} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card size="small" className={styles.statsCard}>
            <Statistic 
              title="失败" 
              value={stats.failed} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容卡片 */}
      <Card
        title="批量报表任务管理"
        extra={
          <Space wrap>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetch()}
              loading={isLoading}
              size="small"
              className={styles.roundButtonSmall}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<ExportOutlined />}
              onClick={() => setShowExportModal(true)}
              size="small"
              className={styles.roundButtonSmall}
            >
              新建批量导出
            </Button>
          </Space>
        }
      >
        {/* 批量操作栏 */}
        {selectedRowKeys.length > 0 && (
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            background: '#f5f5f5', 
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <span style={{ fontWeight: 500 }}>已选择 {selectedRowKeys.length} 项</span>
            <Space wrap>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
                size="small"
              >
                批量删除
              </Button>
              <Button onClick={() => setSelectedRowKeys([])} size="small">
                取消选择
              </Button>
            </Space>
          </div>
        )}

        {/* 任务列表表格 */}
        <Table
          columns={columns}
          dataSource={tasksData || []}
          rowKey="id"
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            responsive: true,
          }}
        />
      </Card>

      {/* 新建导出模态框 */}
      <Modal
        title="新建批量报表导出"
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        footer={null}
        width={1200}
      >
        <BatchReportExport
          onSuccess={() => {
            setShowExportModal(false);
            refetch(); // 刷新任务列表
          }}
          onCancel={() => setShowExportModal(false)}
        />
      </Modal>
    </div>
  );
};

export default BatchReportsPage; 