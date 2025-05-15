import React, { useEffect } from 'react';
import { Card, Typography, Button, Space, List, Spin } from 'antd';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import {
  fetchEmailServerConfigOptionsAsync,
  selectEmailServerConfigOptions,
  selectEmailServerConfigsLoadingStatus
} from '../../store/slices/emailSenderSlice';

const { Title, Text } = Typography;

const ReduxExample: React.FC = () => {
  const dispatch = useAppDispatch();

  // 使用selector从Redux store获取数据
  const emailServerConfigs = useAppSelector(selectEmailServerConfigOptions);
  const loadingStatus = useAppSelector(selectEmailServerConfigsLoadingStatus);

  // 组件加载时获取数据
  useEffect(() => {
    // 只有在状态为idle时才加载数据，避免重复加载
    if (loadingStatus === 'idle') {
      dispatch(fetchEmailServerConfigOptionsAsync());
    }
  }, [dispatch, loadingStatus]);

  // 手动刷新数据
  const handleRefresh = () => {
    dispatch(fetchEmailServerConfigOptionsAsync());
  };

  return (
    <Card title="Redux使用示例">
      <Title level={4}>邮件服务器配置列表</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            onClick={handleRefresh}
            loading={loadingStatus === 'loading'}
          >
            刷新数据
          </Button>
        </div>

        {loadingStatus === 'loading' ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin>
              <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>加载中...</div>
            </Spin>
          </div>
        ) : loadingStatus === 'failed' ? (
          <Text type="danger">加载失败，请重试</Text>
        ) : (
          <List
            bordered
            dataSource={emailServerConfigs}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.server_name}
                  description={`发件人邮箱: ${item.sender_email}`}
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无数据' }}
          />
        )}
      </Space>
    </Card>
  );
};

export default ReduxExample;
