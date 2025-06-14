/**
 * 导入模式选择器组件
 * 支持多种导入模式：薪资数据、员工信息等
 */

import React from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Divider,
  Tag,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { ImportModeSelectorProps } from '../types/universal';

const { Title, Paragraph, Text } = Typography;

const ImportModeSelector: React.FC<ImportModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  availableModes,
}) => {

  return (
    <div style={{ marginBottom: 24 }}>
      <Card title="选择导入模式" className="mode-selector-card">
        <Paragraph type="secondary">
          请选择您要导入的数据类型。不同的导入模式支持不同的字段和验证规则。
        </Paragraph>
        
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          {availableModes.map((mode) => (
            <Col key={mode.clientId || mode.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                className={`import-mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
                onClick={() => onModeChange(mode.id)}
                style={{
                  height: '100%',
                  border: selectedMode === mode.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                styles={{ body: { padding: '20px 16px' } }}
              >
                <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <div style={{ fontSize: 48, color: selectedMode === mode.id ? '#1890ff' : '#8c8c8c' }}>
                      {mode.icon}
                    </div>
                    {selectedMode === mode.id && (
                      <CheckCircleOutlined
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          fontSize: 20,
                          color: '#52c41a',
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                  </div>

                  <Title 
                    level={4} 
                    style={{ 
                      marginBottom: 8, 
                      color: selectedMode === mode.id ? '#1890ff' : 'inherit',
                      minHeight: 32
                    }}
                  >
                    {mode.name}
                  </Title>

                  <Paragraph 
                    type="secondary" 
                    style={{ 
                      marginBottom: 16, 
                      fontSize: 13,
                      lineHeight: '1.4',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {mode.description}
                  </Paragraph>

                  <div style={{ marginTop: 'auto' }}>
                    <Space size={8}>
                      <Tag key={`${mode.id}-required`} color="blue" style={{ fontSize: 11 }}>
                        必填 {mode.requiredFields.length}
                      </Tag>
                      <Tag key={`${mode.id}-optional`} color="green" style={{ fontSize: 11 }}>
                        可选 {mode.optionalFields.length}
                      </Tag>
                    </Space>
                  </div>

                  {mode.helpDocUrl && (
                    <div style={{ marginTop: 8 }}>
                      <Tooltip title="查看详细说明">
                        <Button 
                          type="link" 
                          icon={<InfoCircleOutlined />} 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(mode.helpDocUrl, '_blank');
                          }}
                        >
                          帮助
                        </Button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {selectedMode && (
          <React.Fragment key="selected-mode-details">
            <Divider />
            
            <div style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                {availableModes.find(m => m.id === selectedMode)?.name} - 字段说明
              </Title>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="必填字段" styles={{ header: { fontSize: 14 } }}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      {availableModes
                        .find(m => m.id === selectedMode)
                        ?.requiredFields.map(field => (
                          <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 13 }}>{field.name}</Text>
                            <Tag color="red">必填</Tag>
                          </div>
                        ))}
                    </Space>
                  </Card>
                </Col>
                
                <Col xs={24} md={12}>
                  <Card size="small" title="可选字段" styles={{ header: { fontSize: 14 } }}>
                    <Space direction="vertical" size={4} style={{ width: '100%', maxHeight: 200, overflowY: 'auto' }}>
                      {availableModes
                          .find(m => m.id === selectedMode)
                        ?.optionalFields.slice(0, 8)
                        .map(field => (
                            <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 13 }}>{field.name}</Text>
                              <Tag color="blue">可选</Tag>
                            </div>
                        ))}
                      {(availableModes.find(m => m.id === selectedMode)?.optionalFields?.length || 0) > 8 && (
                          <Text key="more-fields-hint" type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                            还有 {(availableModes.find(m => m.id === selectedMode)?.optionalFields?.length || 0) - 8} 个可选字段...
                          </Text>
                      )}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          </React.Fragment>
        )}
      </Card>
      
      <style>{`
        .import-mode-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .import-mode-card.selected {
          background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
        }
        
        .mode-selector-card .ant-card-head-title {
          font-size: 18px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ImportModeSelector; 