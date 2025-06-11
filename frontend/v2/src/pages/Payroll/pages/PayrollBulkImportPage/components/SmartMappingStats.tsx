import React from 'react';
import { Card, Progress, Tag, Space, Statistic, Row, Col } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { SmartMappingResult, SmartMappingConfig } from '../utils/smartMapping';
import { DEFAULT_CONFIG } from '../utils/smartMapping';

interface SmartMappingStatsProps {
  smartResults: SmartMappingResult[];
  mappingRules: Array<{ sourceField: string; targetField: string }>;
  config?: SmartMappingConfig;
}

const SmartMappingStats: React.FC<SmartMappingStatsProps> = ({
  smartResults,
  mappingRules,
  config
}) => {
  if (smartResults.length === 0) {
    return null;
  }

  // 使用配置或默认配置
  const mappingConfig = config || DEFAULT_CONFIG;

  // 使用配置的阈值计算统计数据
  const totalFields = smartResults.length;
  const highConfidenceMatches = smartResults.filter(r => 
    r.bestMatch && r.bestMatch.confidence > mappingConfig.thresholds.highConfidence
  ).length;
  const mediumConfidenceMatches = smartResults.filter(r => 
    r.bestMatch && 
    r.bestMatch.confidence > mappingConfig.thresholds.mediumConfidence && 
    r.bestMatch.confidence <= mappingConfig.thresholds.highConfidence
  ).length;
  const lowConfidenceMatches = smartResults.filter(r => 
    r.bestMatch && 
    r.bestMatch.confidence > mappingConfig.thresholds.minimumRecommend && 
    r.bestMatch.confidence <= mappingConfig.thresholds.mediumConfidence
  ).length;
  const noMatches = smartResults.filter(r => 
    !r.bestMatch || r.bestMatch.confidence <= mappingConfig.thresholds.minimumRecommend
  ).length;

  // 计算已映射字段数量
  const mappedFields = mappingRules.filter(rule => rule.targetField && rule.targetField !== '').length;
  const mappingProgress = totalFields > 0 ? (mappedFields / totalFields) * 100 : 0;

  // 计算智能映射质量分数
  const qualityScore = totalFields > 0 
    ? Math.round(((highConfidenceMatches * 1.0 + mediumConfidenceMatches * 0.6 + lowConfidenceMatches * 0.3) / totalFields) * 100)
    : 0;

  return (
    <Card 
      title="🤖 智能映射分析" 
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="映射进度"
            value={mappingProgress}
            suffix="%"
            precision={1}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          />
          <Progress 
            percent={mappingProgress} 
            size="small" 
            status={mappingProgress === 100 ? 'success' : 'active'}
          />
        </Col>

        <Col span={6}>
          <Statistic
            title="智能质量分"
            value={qualityScore}
            suffix="/100"
            prefix={
              qualityScore >= 80 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
              qualityScore >= 60 ? <ExclamationCircleOutlined style={{ color: '#faad14' }} /> :
              <QuestionCircleOutlined style={{ color: '#ff4d4f' }} />
            }
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            {qualityScore >= 80 ? '质量优秀' : qualityScore >= 60 ? '质量良好' : '需要人工调整'}
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>匹配置信度分布：</span>
          </div>
          <Space wrap>
            <Tag color="green" icon={<CheckCircleOutlined />}>
              高置信度: {highConfidenceMatches}个 (≥{(mappingConfig.thresholds.highConfidence * 100).toFixed(0)}%)
            </Tag>
            <Tag color="orange" icon={<ExclamationCircleOutlined />}>
              中等: {mediumConfidenceMatches}个 ({(mappingConfig.thresholds.mediumConfidence * 100).toFixed(0)}-{(mappingConfig.thresholds.highConfidence * 100).toFixed(0)}%)
            </Tag>
            <Tag color="red" icon={<QuestionCircleOutlined />}>
              低置信度: {lowConfidenceMatches}个 ({(mappingConfig.thresholds.minimumRecommend * 100).toFixed(0)}-{(mappingConfig.thresholds.mediumConfidence * 100).toFixed(0)}%)
            </Tag>
            {noMatches > 0 && (
              <Tag color="default">
                无匹配: {noMatches}个
              </Tag>
            )}
          </Space>
        </Col>
      </Row>

      {/* 映射建议 */}
      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
        <div style={{ fontSize: '13px', color: '#389e0d', marginBottom: 8 }}>
          <strong>💡 映射建议：</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#52c41a', lineHeight: '18px' }}>
          {highConfidenceMatches > 0 && (
            <div>✅ {highConfidenceMatches} 个字段可以直接应用智能推荐</div>
          )}
          {mediumConfidenceMatches > 0 && (
            <div>⚠️ {mediumConfidenceMatches} 个字段建议人工确认后应用</div>
          )}
          {(lowConfidenceMatches > 0 || noMatches > 0) && (
            <div>🔍 {lowConfidenceMatches + noMatches} 个字段需要手动设置映射</div>
          )}
          {qualityScore >= 80 && (
            <div style={{ color: '#389e0d', fontWeight: 'bold' }}>
              🎉 映射质量优秀！可以直接进入下一步
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SmartMappingStats; 