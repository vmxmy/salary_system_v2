import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Badge, Space, Statistic, Card, Row, Col, Alert, Switch } from 'antd';
import { BugOutlined, EyeOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { renderMonitor, type RenderStats } from '../../hooks/useRenderCount';

interface RenderMonitorPanelProps {
  /** 是否显示面板 */
  visible: boolean;
  /** 关闭面板回调 */
  onClose: () => void;
  /** 是否自动刷新，默认true */
  autoRefresh?: boolean;
  /** 刷新间隔，毫秒，默认1000ms */
  refreshInterval?: number;
}

/**
 * React渲染监控面板
 * 用于实时显示组件渲染统计和性能指标
 */
export const RenderMonitorPanel: React.FC<RenderMonitorPanelProps> = ({
  visible,
  onClose,
  autoRefresh = true,
  refreshInterval = 1000
}) => {
  const [stats, setStats] = useState<RenderStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);

  // 刷新统计数据
  const refreshStats = () => {
    setLoading(true);
    try {
      const currentStats = renderMonitor.getAllStats();
      setStats([...currentStats]);
    } catch (error) {
      console.error('Failed to refresh render stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    if (!visible || !autoRefreshEnabled) return;

    const interval = setInterval(refreshStats, refreshInterval);
    return () => clearInterval(interval);
  }, [visible, autoRefreshEnabled, refreshInterval]);

  // 面板打开时立即刷新
  useEffect(() => {
    if (visible) {
      refreshStats();
    }
  }, [visible]);

  // 计算汇总统计
  const summary = React.useMemo(() => {
    const totalComponents = stats.length;
    const excessiveComponents = stats.filter(stat => stat.isExcessive).length;
    const totalRenders = stats.reduce((sum, stat) => sum + stat.totalRenders, 0);
    const avgRenderTime = stats.length > 0 
      ? stats.reduce((sum, stat) => sum + stat.averageRenderTime, 0) / stats.length 
      : 0;

    return {
      totalComponents,
      excessiveComponents,
      totalRenders,
      avgRenderTime: avgRenderTime.toFixed(2)
    };
  }, [stats]);

  // 表格列定义
  const columns = [
    {
      title: '组件名称',
      dataIndex: 'componentName',
      key: 'componentName',
      width: 200,
      render: (name: string, record: RenderStats) => (
        <Space>
          <span style={{ fontFamily: 'monospace' }}>{name}</span>
          {record.isExcessive && (
            <Badge status="error" text="异常" />
          )}
        </Space>
      )
    },
    {
      title: '渲染次数',
      dataIndex: 'totalRenders',
      key: 'totalRenders',
      width: 100,
      render: (count: number, record: RenderStats) => (
        <span style={{ 
          color: record.isExcessive ? '#ff4d4f' : '#52c41a',
          fontWeight: record.isExcessive ? 'bold' : 'normal'
        }}>
          {count}
        </span>
      ),
      sorter: (a: RenderStats, b: RenderStats) => a.totalRenders - b.totalRenders,
      defaultSortOrder: 'descend' as const
    },
    {
      title: '警告阈值',
      dataIndex: 'warningThreshold',
      key: 'warningThreshold',
      width: 100,
      render: (threshold: number) => (
        <span style={{ color: '#666' }}>{threshold}</span>
      )
    },
    {
      title: '平均渲染间隔',
      dataIndex: 'averageRenderTime',
      key: 'averageRenderTime',
      width: 130,
      render: (time: number) => (
        <span style={{ 
          color: time < 100 ? '#ff4d4f' : time < 300 ? '#faad14' : '#52c41a',
          fontFamily: 'monospace'
        }}>
          {time.toFixed(2)}ms
        </span>
      ),
      sorter: (a: RenderStats, b: RenderStats) => a.averageRenderTime - b.averageRenderTime
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_: any, record: RenderStats) => (
        <Badge 
          status={record.isExcessive ? 'error' : 'success'} 
          text={record.isExcessive ? '异常' : '正常'} 
        />
      ),
      filters: [
        { text: '正常', value: 'normal' },
        { text: '异常', value: 'excessive' }
      ],
      onFilter: (value: any, record: RenderStats) => 
        value === 'excessive' ? record.isExcessive : !record.isExcessive
    }
  ];

  // 清除所有统计
  const handleClearStats = () => {
    renderMonitor.clearStats();
    setStats([]);
  };

  // 生成报告
  const handleGenerateReport = () => {
    const report = renderMonitor.generateReport();
    console.log(report);
    
    // 可以在这里添加导出功能
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `render-performance-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      title={
        <Space>
          <BugOutlined />
          React渲染监控面板
          <Badge count={summary.excessiveComponents} style={{ backgroundColor: '#ff4d4f' }} />
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          <Switch
            checked={autoRefreshEnabled}
            onChange={setAutoRefreshEnabled}
            checkedChildren="自动刷新"
            unCheckedChildren="手动刷新"
          />
          <Button icon={<ReloadOutlined />} onClick={refreshStats} loading={loading}>
            刷新
          </Button>
          <Button onClick={handleClearStats}>
            清除统计
          </Button>
          <Button onClick={handleGenerateReport}>
            生成报告
          </Button>
          <Button onClick={onClose}>
            关闭
          </Button>
        </Space>
      }
      destroyOnClose
    >
      {/* 汇总统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="监控组件" 
              value={summary.totalComponents}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="异常组件" 
              value={summary.excessiveComponents}
              valueStyle={{ color: summary.excessiveComponents > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="总渲染次数" 
              value={summary.totalRenders}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="平均间隔" 
              value={summary.avgRenderTime}
              suffix="ms"
            />
          </Card>
        </Col>
      </Row>

      {/* 异常警告 */}
      {summary.excessiveComponents > 0 && (
        <Alert
          type="warning"
          message={`检测到 ${summary.excessiveComponents} 个组件渲染异常`}
          description="请检查这些组件的 useEffect、useMemo、useCallback 依赖数组是否正确"
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      {/* 详细统计表格 */}
      <Table
        columns={columns}
        dataSource={stats}
        rowKey="componentName"
        size="small"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 个组件`,
        }}
        rowClassName={(record) => record.isExcessive ? 'excessive-render-row' : ''}
        scroll={{ y: 400 }}
      />

      <style>{`
        .excessive-render-row {
          background-color: #fff2f0 !important;
        }
        .excessive-render-row:hover {
          background-color: #ffe1df !important;
        }
      `}</style>
    </Modal>
  );
};

/**
 * 渲染监控面板的便捷钩子
 * 提供面板的开关控制
 */
export const useRenderMonitorPanel = () => {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);
  const toggle = () => setVisible(prev => !prev);

  return {
    visible,
    show,
    hide,
    toggle,
    RenderMonitorPanel: (props: Omit<RenderMonitorPanelProps, 'visible' | 'onClose'>) => (
      <RenderMonitorPanel
        {...props}
        visible={visible}
        onClose={hide}
      />
    )
  };
};

// 开发环境下的快捷键支持
if (process.env.NODE_ENV === 'development') {
  let panelInstance: { toggle: () => void } | null = null;
  
  // 注册全局快捷键 Ctrl+Shift+R 打开监控面板
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      if (panelInstance) {
        panelInstance.toggle();
      } else {
        console.log('🔧 [DevTools] 渲染监控面板未初始化，请在组件中使用 useRenderMonitorPanel');
      }
    }
  });

  // 暴露到全局对象
  (window as any).__RENDER_MONITOR_PANEL__ = {
    setPanelInstance: (instance: { toggle: () => void }) => {
      panelInstance = instance;
    }
  };
  
  console.log('🔧 [DevTools] 渲染监控面板快捷键: Ctrl+Shift+R');
}