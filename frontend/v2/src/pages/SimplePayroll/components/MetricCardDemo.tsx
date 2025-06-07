import React from 'react';
import { Card, Divider, Row, Col } from 'antd';
import { 
  UserOutlined, 
  DollarOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import '../styles.less';

/**
 * 指标卡演示组件
 * 展示如何使用统一的指标卡样式模板
 */
export const MetricCardDemo: React.FC = () => {
  return (
    <div style={{ padding: '24px', background: '#f5f5f5' }}>
      <h2 className="typography-title-secondary" style={{ marginBottom: '24px' }}>
        📊 指标卡样式模板演示
      </h2>
      
      <Row gutter={[16, 16]}>
        {/* 基础信息指标卡 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card-template metric-card-basic">
            <div className="metric-card-header">
              <div className="metric-card-title">
                <UserOutlined className="metric-icon" />
                基础信息
              </div>
            </div>
            <div className="metric-card-body">
              <div className="metric-main-value">
                <span className="metric-number">81</span>
                <span className="metric-unit">人</span>
              </div>
              <Divider className="metric-divider" />
              <div className="metric-details">
                <div className="metric-detail-item">
                  <span className="metric-detail-label">期间:</span>
                  <span className="metric-detail-value">2025-05</span>
                </div>
                <div className="metric-detail-item status-success">
                  <span className="metric-detail-label">状态:</span>
                  <span className="metric-detail-value">活动</span>
                </div>
                <div className="metric-detail-item">
                  <span className="metric-detail-label">版本:</span>
                  <span className="metric-detail-value">v1 (1个)</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 财务信息指标卡 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card-template metric-card-financial">
            <div className="metric-card-header">
              <div className="metric-card-title">
                <DollarOutlined className="metric-icon" />
                财务信息
              </div>
            </div>
            <div className="metric-card-body">
              <div className="metric-main-value">
                <span className="metric-number">¥833,271.29</span>
              </div>
              <Divider className="metric-divider" />
              <div className="metric-details">
                <div className="metric-detail-item status-success">
                  <span className="metric-detail-label">应发:</span>
                  <span className="metric-detail-value">¥1,156,725.00</span>
                </div>
                <div className="metric-detail-item status-error">
                  <span className="metric-detail-label">扣发:</span>
                  <span className="metric-detail-value">¥323,453.71</span>
                </div>
                <div className="metric-detail-item">
                  <span className="metric-detail-label">人均:</span>
                  <span className="metric-detail-value">¥10,287</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 版本状态指标卡 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card-template metric-card-status">
            <div className="metric-card-header">
              <div className="metric-card-title">
                <CheckCircleOutlined className="metric-icon" />
                版本状态
              </div>
            </div>
            <div className="metric-card-body">
              <div className="metric-main-value">
                <span className="metric-number">审核中</span>
              </div>
              <Divider className="metric-divider" />
              <div className="metric-details">
                <div className="metric-detail-item">
                  <span className="metric-detail-label">创建:</span>
                  <span className="metric-detail-value">06-04 03:10</span>
                </div>
                <div className="metric-detail-item">
                  <span className="metric-detail-label">创建人:</span>
                  <span className="metric-detail-value">系统</span>
                </div>
                <div className="metric-detail-item">
                  <span className="metric-detail-label">频率:</span>
                  <span className="metric-detail-value">月度</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 审核状态指标卡 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card-template metric-card-audit">
            <div className="metric-card-header">
              <div className="metric-card-title">
                <ExclamationCircleOutlined className="metric-icon" />
                审核状态
              </div>
            </div>
            <div className="metric-card-body">
              <div className="metric-main-value">
                <span className="metric-number">待审核</span>
              </div>
              <Divider className="metric-divider" />
              <div className="metric-details">
                <div className="metric-detail-item status-success">
                  <span className="metric-detail-label">错误:</span>
                  <span className="metric-detail-value">0 个</span>
                </div>
                <div className="metric-detail-item status-success">
                  <span className="metric-detail-label">警告:</span>
                  <span className="metric-detail-value">0 个</span>
                </div>
                <div className="metric-detail-item status-success">
                  <span className="metric-detail-label">可修复:</span>
                  <span className="metric-detail-value">0 个</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card style={{ marginTop: '24px' }}>
        <h3 className="typography-title-tertiary">📝 使用说明</h3>
        <div className="typography-body-primary">
          <p><strong>基础用法：</strong></p>
          <pre style={{ background: '#f6f8fa', padding: '12px', borderRadius: '6px', fontSize: '12px' }}>
{`<Card className="metric-card-template metric-card-basic">
  <div className="metric-card-header">
    <div className="metric-card-title">
      <UserOutlined className="metric-icon" />
      基础信息
    </div>
  </div>
  <div className="metric-card-body">
    <div className="metric-main-value">
      <span className="metric-number">81</span>
      <span className="metric-unit">人</span>
    </div>
    <Divider className="metric-divider" />
    <div className="metric-details">
      <div className="metric-detail-item">
        <span className="metric-detail-label">期间:</span>
        <span className="metric-detail-value">2025-05</span>
      </div>
    </div>
  </div>
</Card>`}
          </pre>
          
          <p><strong>可用主题：</strong></p>
          <ul>
            <li><code>metric-card-basic</code> - 基础信息主题（绿蓝渐变）</li>
            <li><code>metric-card-financial</code> - 财务信息主题（橙绿渐变）</li>
            <li><code>metric-card-status</code> - 状态信息主题（蓝色渐变）</li>
            <li><code>metric-card-audit</code> - 审核信息主题（橙色渐变）</li>
          </ul>
          
          <p><strong>状态颜色类：</strong></p>
          <ul>
            <li><code>status-success</code> - 成功状态（绿色）</li>
            <li><code>status-warning</code> - 警告状态（橙色）</li>
            <li><code>status-error</code> - 错误状态（红色）</li>
            <li><code>status-info</code> - 信息状态（蓝色）</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}; 