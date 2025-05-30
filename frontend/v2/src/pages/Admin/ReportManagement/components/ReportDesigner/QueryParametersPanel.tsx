import React from 'react';
import {
  Space,
  Button,
  Alert,
  Card,
  Row,
  Col,
  Input,
  Select,
  Switch,
  Tooltip,
  Tag,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { QueryParametersPanelProps, QueryParameter } from './types';

const { Option } = Select;
const { Title } = Typography;

const QueryParametersPanel: React.FC<QueryParametersPanelProps> = ({
  parameters,
  onAdd,
  onRemove,
  onUpdate
}) => {
  const { t } = useTranslation('reportManagement');

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5}>{t('customQuery.queryParameters')}</Title>
        <Button type="dashed" onClick={onAdd}>
          {t('customQuery.addParameter')}
        </Button>
      </div>

      {parameters.length === 0 ? (
        <Alert
          message={t('customQuery.noParameters')}
          description={t('customQuery.addParameterHint')}
          type="info"
          showIcon
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          {parameters.map((param, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={8} align="middle">
                <Col span={5}>
                  <Input
                    size="small"
                    placeholder="参数名"
                    value={param.name}
                    onChange={(e) => onUpdate(index, 'name', e.target.value)}
                    status={!param.name ? 'error' : undefined}
                  />
                </Col>
                <Col span={4}>
                  <Select
                    size="small"
                    value={param.type}
                    onChange={(value) => onUpdate(index, 'type', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="string">字符串</Option>
                    <Option value="number">数字</Option>
                    <Option value="date">日期</Option>
                    <Option value="boolean">布尔</Option>
                  </Select>
                </Col>
                <Col span={5}>
                  <Input
                    size="small"
                    placeholder="默认值"
                    value={param.defaultValue}
                    onChange={(e) => onUpdate(index, 'defaultValue', e.target.value)}
                    status={param.required && !param.defaultValue ? 'error' : undefined}
                  />
                </Col>
                <Col span={3}>
                  <Tooltip title="是否必填">
                    <Space>
                      <span style={{ fontSize: '12px' }}>必填</span>
                      <Switch
                        size="small"
                        checked={param.required}
                        onChange={(checked) => onUpdate(index, 'required', checked)}
                      />
                    </Space>
                  </Tooltip>
                </Col>
                <Col span={3}>
                  {param.required && !param.defaultValue && (
                    <Tooltip title="必填参数缺少默认值">
                      <Tag color="red">
                        <ExclamationCircleOutlined /> 空值
                      </Tag>
                    </Tooltip>
                  )}
                  {!param.required && !param.defaultValue && (
                    <Tooltip title="空值参数将被跳过">
                      <Tag color="orange">
                        跳过
                      </Tag>
                    </Tooltip>
                  )}
                  {param.defaultValue && (
                    <Tooltip title="参数配置完整">
                      <Tag color="green">
                        <CheckCircleOutlined /> 正常
                      </Tag>
                    </Tooltip>
                  )}
                </Col>
                <Col span={4}>
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => onRemove(index)}
                  >
                    删除
                  </Button>
                </Col>
              </Row>
              <Row style={{ marginTop: 8 }}>
                <Col span={24}>
                  <Input
                    size="small"
                    placeholder="参数描述"
                    value={param.description}
                    onChange={(e) => onUpdate(index, 'description', e.target.value)}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      )}
    </Space>
  );
};

export default QueryParametersPanel; 