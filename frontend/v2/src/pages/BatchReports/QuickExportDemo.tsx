import React from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Alert,
  Tag
} from 'antd';
import {
  FileZipOutlined,
  RocketOutlined,
  SettingOutlined,
  DownloadOutlined
} from '@ant-design/icons';

import BatchReportExport from '../../components/BatchReportExport';

const { Title, Paragraph, Text } = Typography;

const QuickExportDemo: React.FC = () => {
  const handleExportSuccess = (taskId: number) => {
    console.log('导出任务创建成功，任务ID:', taskId);
  };

  const handleExportError = (error: any) => {
    console.error('导出任务创建失败:', error);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <FileZipOutlined style={{ marginRight: '8px' }} />
          一键导出报表演示
        </Title>
        <Paragraph type="secondary">
          展示批量报表导出功能的不同使用方式和配置选项
        </Paragraph>
      </div>

      <Alert
        message="功能说明"
        description="一键导出功能支持批量生成多种报表类型，自动打包下载。生成过程在后台异步执行，完成后可在批量报表管理页面查看和下载。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[24, 24]}>
        {/* 基础一键导出 */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <RocketOutlined />
                基础一键导出
              </Space>
            }
            extra={<Tag color="blue">推荐</Tag>}
          >
            <Paragraph>
              最简单的使用方式，点击按钮后弹出配置对话框，用户可以选择薪资期间和报表类型。
            </Paragraph>
            
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <BatchReportExport
                buttonText="一键导出所有报表"
                onSuccess={handleExportSuccess}
                onError={handleExportError}
              />
            </div>
          </Card>
        </Col>

        {/* 自定义按钮样式 */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <SettingOutlined />
                自定义样式
              </Space>
            }
          >
            <Paragraph>
              可以自定义按钮的样式、大小和文本，适应不同的界面设计需求。
            </Paragraph>
            
            <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
              <BatchReportExport
                buttonType="dashed"
                buttonSize="large"
                buttonText="大号虚线按钮"
                onSuccess={handleExportSuccess}
                onError={handleExportError}
              />
              
              <BatchReportExport
                buttonType="link"
                buttonSize="small"
                buttonText="小号链接按钮"
                showIcon={false}
                onSuccess={handleExportSuccess}
                onError={handleExportError}
              />
            </Space>
          </Card>
        </Col>

        {/* 预设配置 */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <DownloadOutlined />
                预设配置
              </Space>
            }
          >
            <Paragraph>
              可以预设薪资期间、部门和报表类型，实现真正的"一键"导出，无需用户额外配置。
            </Paragraph>
            
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <BatchReportExport
                buttonText="预设配置导出"
                defaultPeriodId={1} // 假设期间ID为1
                defaultDepartmentIds={[1, 2]} // 假设部门ID为1和2
                defaultReportTypes={[
                  'payroll_summary',
                  'payroll_detail',
                  'tax_report'
                ]}
                onSuccess={handleExportSuccess}
                onError={handleExportError}
              />
            </div>
            
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
              <div>• 预设期间：当前期间</div>
              <div>• 预设部门：财务部、人事部</div>
              <div>• 预设报表：薪资汇总、明细、个税</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[24, 24]}>
        {/* 功能特性 */}
        <Col span={12}>
          <Card title="功能特性" size="small">
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>支持多种报表类型批量生成</li>
              <li>异步后台处理，不阻塞用户操作</li>
              <li>自动文件打包和压缩</li>
              <li>实时进度跟踪和状态更新</li>
              <li>灵活的筛选条件配置</li>
              <li>自动文件清理和生命周期管理</li>
              <li>完善的错误处理和重试机制</li>
              <li>支持多种导出格式（Excel、CSV、PDF）</li>
            </ul>
          </Card>
        </Col>

        {/* 使用场景 */}
        <Col span={12}>
          <Card title="使用场景" size="small">
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li><strong>月末结算：</strong>一次性生成所有薪资报表</li>
              <li><strong>年度报告：</strong>批量导出年度统计数据</li>
              <li><strong>审计准备：</strong>快速生成审计所需报表</li>
              <li><strong>数据备份：</strong>定期导出重要数据</li>
              <li><strong>部门报告：</strong>按部门批量生成报表</li>
              <li><strong>合规申报：</strong>生成税务和社保申报表</li>
              <li><strong>管理分析：</strong>导出数据用于深度分析</li>
              <li><strong>系统迁移：</strong>批量导出历史数据</li>
            </ul>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="技术架构" size="small">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#1890ff' }}>🎯</div>
              <div style={{ fontWeight: 500, marginTop: '8px' }}>前端组件</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                React + Ant Design<br/>
                TypeScript + React Query
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#52c41a' }}>⚡</div>
              <div style={{ fontWeight: 500, marginTop: '8px' }}>API接口</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                FastAPI + Pydantic<br/>
                RESTful API设计
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#fa8c16' }}>🔄</div>
              <div style={{ fontWeight: 500, marginTop: '8px' }}>后台服务</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                异步任务处理<br/>
                进度跟踪管理
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#722ed1' }}>💾</div>
              <div style={{ fontWeight: 500, marginTop: '8px' }}>数据存储</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                PostgreSQL数据库<br/>
                文件系统管理
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default QuickExportDemo; 