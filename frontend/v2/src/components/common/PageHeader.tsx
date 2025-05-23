import React from 'react';
import type { ReactNode } from 'react';
import { Row, Col, Typography, Space } from 'antd';

const { Title } = Typography;

interface PageHeaderProps {
  /**
   * 页面标题
   */
  title: string;
  /**
   * 子标题或描述文本
   */
  subtitle?: string;
  /**
   * 额外操作按钮区域
   */
  extra?: ReactNode;
}

/**
 * 通用页面头部组件，包含标题和操作按钮区域
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
      <Col>
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>{title}</Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </Space>
      </Col>
      {extra && (
        <Col>
          {extra}
        </Col>
      )}
    </Row>
  );
};

export default PageHeader; 