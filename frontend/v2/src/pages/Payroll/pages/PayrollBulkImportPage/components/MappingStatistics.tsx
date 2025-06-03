import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag
} from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import type { MappingRule } from '../types/index';

interface MappingStatisticsProps {
  mappingRules: MappingRule[];
}

const MappingStatistics: React.FC<MappingStatisticsProps> = ({
  mappingRules
}) => {
  // 计算映射统计
  const categoryStats = mappingRules.reduce((acc, rule) => {
    acc[rule.category] = (acc[rule.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highConfidenceCount = mappingRules.filter(r => r.confidence >= 0.8).length;
  const lowConfidenceCount = mappingRules.filter(r => r.confidence < 0.6).length;

  return (
    <>
      {/* 映射统计 */}
      <Card title="映射分析概况">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总字段数"
              value={mappingRules.length}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="高置信度"
              value={highConfidenceCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="需确认"
              value={lowConfidenceCount}
              valueStyle={{ color: lowConfidenceCount > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<QuestionCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="映射成功率"
              value={Math.round((highConfidenceCount / mappingRules.length) * 100)}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 字段分类统计 */}
      <Card title="字段分类统计">
        <Row gutter={16}>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                {categoryStats.base || 0}
              </div>
              <Tag color="blue">基础信息</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                {categoryStats.earning || 0}
              </div>
              <Tag color="green">收入项</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
                {categoryStats.deduction || 0}
              </div>
              <Tag color="orange">扣除项</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
                {categoryStats.calculated || 0}
              </div>
              <Tag color="purple">计算项</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#13c2c2' }}>
                {categoryStats.stat || 0}
              </div>
              <Tag color="cyan">统计项</Tag>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#eb2f96' }}>
                {categoryStats.other || 0}
              </div>
              <Tag color="magenta">其他</Tag>
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default MappingStatistics; 