import React from 'react';
import { 
  Spin, 
  Progress, 
  Typography, 
  Space,
  Row,
  Col,
  Statistic 
} from 'antd';
import { 
  LoadingOutlined, 
  CloudUploadOutlined,
  DatabaseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { ValidationSummary } from '../hooks/usePayrollImport';
import bulkImportStyles from '../../../../../styles/payroll-bulk-import.module.less';

const { Title, Text } = Typography;

interface ImportProcessStepProps {
  uploading: boolean;
  validationSummary: ValidationSummary;
}

const ImportProcessStep: React.FC<ImportProcessStepProps> = ({
  uploading,
  validationSummary
}) => {
  const { t } = useTranslation(['payroll', 'common']);

  // 自定义加载图标
  const antIcon = <LoadingOutlined className={bulkImportStyles.loadingIcon} spin />;

  // 处理步骤
  const processSteps = [
    {
      key: 'validation',
      title: '数据验证',
      description: '检查数据格式和有效性',
      icon: <CheckCircleOutlined />,
      completed: true
    },
    {
      key: 'upload',
      title: '数据上传',
      description: '将数据传输到服务器',
      icon: <CloudUploadOutlined />,
      completed: false,
      active: uploading
    },
    {
      key: 'database',
      title: '数据入库',
      description: '创建薪资记录到数据库',
      icon: <DatabaseOutlined />,
      completed: false,
      active: uploading
    }
  ];

  return (
    <ProCard>
      {/* 处理进度概览 */}
      <ProCard 
        title="处理进度"
        headerBordered
        className={bulkImportStyles.mb24}
      >
        <div className={`${bulkImportStyles.stepLoading} ${bulkImportStyles.pt32} ${bulkImportStyles.pb32}`}>
          <Spin indicator={antIcon} spinning={uploading}>
            <div className={bulkImportStyles.loadingContent}>
              <Title level={4} className={bulkImportStyles.loadingTitle}>
                {uploading 
                  ? '⏳ 正在处理数据...' 
                  : '✅ 处理完成'
                }
              </Title>
              <Text type="secondary">
                {uploading
                  ? '请耐心等待，系统正在处理您的数据'
                  : '所有数据已成功处理完成'
                }
              </Text>
            </div>
          </Spin>
        </div>
      </ProCard>

      {/* 数据统计 */}
      <ProCard 
        title="处理统计"
        headerBordered
        className={bulkImportStyles.mb24}
      >
        <Row gutter={16}>
          <Col span={8}>
            <ProCard>
              <Statistic
                title="总记录数"
                value={validationSummary.totalRecords}
                prefix={<DatabaseOutlined className={bulkImportStyles.textInfo} />}
              />
            </ProCard>
          </Col>
          <Col span={8}>
            <ProCard>
              <Statistic
                title="处理记录数"
                value={validationSummary.validRecords}
                valueStyle={{ color: '#1890ff' }}
                prefix={<CloudUploadOutlined />}
              />
            </ProCard>
          </Col>
          <Col span={8}>
            <ProCard>
              <Statistic
                title="完成进度"
                value={uploading ? 50 : 100}
                suffix="%"
                valueStyle={{ color: uploading ? '#1890ff' : '#3f8600' }}
                prefix={uploading ? <LoadingOutlined /> : <CheckCircleOutlined />}
              />
            </ProCard>
          </Col>
        </Row>
      </ProCard>

      {/* 处理步骤详情 */}
      <ProCard 
        title="处理步骤"
        headerBordered
        className={bulkImportStyles.mb24}
      >
        <div className={bulkImportStyles.mt16}>
          {processSteps.map((step, index) => (
            <div
              key={step.key}
              className={bulkImportStyles.stepDetails}
            >
              <div className={`${bulkImportStyles.stepIcon} ${step.completed ? 'completed' : step.active ? 'loading' : ''}`}>
                {step.completed ? (
                  <CheckCircleOutlined />
                ) : step.active ? (
                  <LoadingOutlined />
                ) : (
                  React.cloneElement(step.icon, { 
                    style: { color: '#d9d9d9', fontSize: 24 } 
                  })
                )}
              </div>
              
              <div className={bulkImportStyles.stepInfo}>
                <div>
                  <Text className={`${bulkImportStyles.stepTitle} ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''}`}>
                    {step.title}
                  </Text>
                </div>
                <div className={bulkImportStyles.stepDescription}>
                  <Text type="secondary">
                    {step.description}
                  </Text>
                </div>
              </div>
              
              <div>
                {step.completed && (
                  <Text type="success" strong>
                    ✅ 已完成
                  </Text>
                )}
                {step.active && (
                  <Text className={bulkImportStyles.textInfo} strong>
                    ⏳ 处理中
                  </Text>
                )}
                {!step.completed && !step.active && (
                  <Text type="secondary">
                    ⏸️ 等待中
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </ProCard>

      {/* 提示信息 */}
      {uploading && (
        <ProCard 
          title="💡 处理提示"
          headerBordered
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <Text type="secondary">
                  请勿关闭浏览器或刷新页面，以免中断数据处理过程
                </Text>
              </li>
              <li>
                <Text type="secondary">
                  大量数据处理可能需要较长时间，请耐心等待
                </Text>
              </li>
              <li>
                <Text type="secondary">
                  如果处理时间过长，您可以稍后查看导入历史记录
                </Text>
              </li>
            </ul>
          </Space>
        </ProCard>
      )}
    </ProCard>
  );
};

export default ImportProcessStep; 