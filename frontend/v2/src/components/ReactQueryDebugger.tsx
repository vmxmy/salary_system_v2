import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, Descriptions, Tag, Space } from 'antd';

export const ReactQueryDebugger: React.FC = () => {
  const queryClient = useQueryClient();
  
  // 获取所有查询
  const queries = queryClient.getQueryCache().getAll();
  
  // 统计查询状态
  const stats = queries.reduce((acc, query) => {
    const state = query.state;
    const status = state.status;
    
    acc.total++;
    acc[status] = (acc[status] || 0) + 1;
    
    if (state.isStale) acc.stale++;
    if (state.isFetching) acc.fetching++;
    if (state.isPaused) acc.paused++;
    if (!query.getObserversCount()) acc.inactive++;
    
    return acc;
  }, {
    total: 0,
    success: 0,
    error: 0,
    pending: 0,
    stale: 0,
    fetching: 0,
    paused: 0,
    inactive: 0,
  } as Record<string, number>);

  return (
    <Card 
      title="React Query 调试信息" 
      size="small" 
      style={{ margin: '16px 0', fontSize: '12px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Descriptions size="small" column={4}>
          <Descriptions.Item label="总查询数">{stats.total}</Descriptions.Item>
          <Descriptions.Item label="成功">{stats.success}</Descriptions.Item>
          <Descriptions.Item label="错误">{stats.error}</Descriptions.Item>
          <Descriptions.Item label="进行中">{stats.pending}</Descriptions.Item>
        </Descriptions>
        
        <Descriptions size="small" column={4}>
          <Descriptions.Item label="过期">{stats.stale}</Descriptions.Item>
          <Descriptions.Item label="获取中">{stats.fetching}</Descriptions.Item>
          <Descriptions.Item label="暂停">{stats.paused}</Descriptions.Item>
          <Descriptions.Item label="非活跃">{stats.inactive}</Descriptions.Item>
        </Descriptions>

        <div>
          <strong>查询详情:</strong>
          {queries.map((query, index) => {
            const state = query.state;
            const queryKey = JSON.stringify(query.queryKey);
            
            return (
              <div key={index} style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <div><strong>查询键:</strong> {queryKey}</div>
                <div>
                  <strong>状态:</strong> 
                  <Tag color={state.status === 'success' ? 'green' : state.status === 'error' ? 'red' : 'blue'}>
                    {state.status}
                  </Tag>
                  {state.isStale && <Tag color="orange">过期</Tag>}
                  {state.isFetching && <Tag color="blue">获取中</Tag>}
                  {state.isPaused && <Tag color="purple">暂停</Tag>}
                  {!query.getObserversCount() && <Tag color="gray">非活跃</Tag>}
                </div>
                <div><strong>观察者数量:</strong> {query.getObserversCount()}</div>
                <div><strong>最后更新:</strong> {state.dataUpdatedAt ? new Date(state.dataUpdatedAt).toLocaleString() : '未更新'}</div>
                {state.error && <div><strong>错误:</strong> {String(state.error)}</div>}
              </div>
            );
          })}
        </div>
      </Space>
    </Card>
  );
}; 