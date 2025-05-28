import React from 'react';
import { Row, Col, Card, List, Tag, Button, Space, Typography, Badge, Progress, Tooltip } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  AuditOutlined,
  FileTextOutlined,
  AlertOutlined,
  RightOutlined
} from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';

const { Text, Title } = Typography;

interface ManagementEfficiencySectionProps {
  recentPayrollRuns: any[];
  payrollStatus: any[];
  timeDimension: string;
  riskFocused?: boolean;
}

const ManagementEfficiencySection: React.FC<ManagementEfficiencySectionProps> = ({
  recentPayrollRuns,
  payrollStatus,
  timeDimension,
  riskFocused = false
}) => {
  // 模拟待处理任务数据
  const pendingTasks = [
    {
      id: 1,
      title: '薪资调整审批',
      description: '技术部门薪资调整申请',
      priority: 'high',
      dueDate: '2024-05-30',
      type: 'approval'
    },
    {
      id: 2,
      title: '考勤异常处理',
      description: '张三 5月份加班时长异常',
      priority: 'medium',
      dueDate: '2024-05-29',
      type: 'attendance'
    },
    {
      id: 3,
      title: '薪资发放确认',
      description: '5月份薪资发放最终确认',
      priority: 'high',
      dueDate: '2024-05-28',
      type: 'payroll'
    }
  ];

  // 模拟异常预警数据
  const alerts = [
    {
      id: 1,
      type: 'overtime',
      title: '加班成本预警',
      description: '本月加班成本超出预算15%',
      level: 'warning',
      count: 8
    },
    {
      id: 2,
      type: 'attendance',
      title: '考勤异常',
      description: '未打卡员工数量异常',
      level: 'error',
      count: 12
    },
    {
      id: 3,
      type: 'contract',
      title: '合同到期提醒',
      description: '30天内到期合同',
      level: 'info',
      count: 5
    }
  ];

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  // 获取预警级别颜色
  const getAlertColor = (level: string) => {
    switch (level) {
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info': return '#1890ff';
      default: return '#999';
    }
  };

  // 计算薪资发放进度
  const calculatePayrollProgress = () => {
    const total = recentPayrollRuns.length;
    const completed = recentPayrollRuns.filter(run => run.status === '已完成').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const payrollProgress = calculatePayrollProgress();

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 待处理任务 */}
        <Col xs={24} lg={riskFocused ? 24 : 12}>
          <Card 
            title={
              <Space>
                <AuditOutlined style={{ color: '#1890ff' }} />
                <span>📋 待处理任务</span>
                <Badge count={pendingTasks.length} style={{ backgroundColor: '#ff4d4f' }} />
              </Space>
            }
            extra={
              <Button type="link" size="small">
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <ProList<any>
              dataSource={pendingTasks}
              rowKey="id"
              showActions="hover"
              showExtra="hover"
              metas={{
                title: {
                  dataIndex: 'title',
                  render: (_, record) => (
                    <Space>
                      <Text strong>{record.title}</Text>
                      <Tag color={getPriorityColor(record.priority)}>
                        {record.priority === 'high' ? '高' : record.priority === 'medium' ? '中' : '低'}
                      </Tag>
                    </Space>
                  ),
                },
                description: {
                  dataIndex: 'description',
                },
                extra: {
                  render: (_, record) => (
                    <Space direction="vertical" align="end">
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        截止: {record.dueDate}
                      </Text>
                      <Button size="small" type="primary">
                        处理
                      </Button>
                    </Space>
                  ),
                },
              }}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 薪资发放状态 */}
        <Col xs={24} lg={riskFocused ? 24 : 12}>
          <Card 
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>💰 薪资发放状态</span>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 发放进度 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong>当期薪资发放进度</Text>
                  <Text>{payrollProgress}%</Text>
                </div>
                <Progress 
                  percent={payrollProgress} 
                  status={payrollProgress === 100 ? 'success' : 'active'}
                  strokeColor={payrollProgress === 100 ? '#52c41a' : '#1890ff'}
                />
              </div>

              {/* 发放统计 */}
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                      {recentPayrollRuns.filter(run => run.status === '已完成').length}
                    </div>
                    <Text type="secondary">已完成</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                      {recentPayrollRuns.filter(run => run.status === '进行中').length}
                    </div>
                    <Text type="secondary">进行中</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                      {recentPayrollRuns.filter(run => run.status === '待审批').length}
                    </div>
                    <Text type="secondary">待审批</Text>
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 异常预警区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title={
              <Space>
                <AlertOutlined style={{ color: '#ff4d4f' }} />
                <span>⚠️ 异常预警</span>
                <Badge count={alerts.length} style={{ backgroundColor: '#ff4d4f' }} />
              </Space>
            }
            extra={
              <Button type="link" size="small">
                查看详情 <RightOutlined />
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {alerts.map(alert => (
                <Col xs={24} sm={12} md={8} key={alert.id}>
                  <Card 
                    size="small" 
                    style={{ 
                      borderLeft: `4px solid ${getAlertColor(alert.level)}`,
                      height: '100%'
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: getAlertColor(alert.level) }}>
                          {alert.title}
                        </Text>
                        <Badge 
                          count={alert.count} 
                          style={{ backgroundColor: getAlertColor(alert.level) }}
                        />
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {alert.description}
                      </Text>
                      <Button size="small" type="link" style={{ padding: 0, height: 'auto' }}>
                        立即处理
                      </Button>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近薪资审核记录 */}
      {!riskFocused && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#722ed1' }} />
                  <span>📄 最近薪资审核记录</span>
                </Space>
              }
              extra={
                <Button type="link" size="small">
                  查看更多 <RightOutlined />
                </Button>
              }
            >
              <List
                dataSource={recentPayrollRuns.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button key="view" type="link" size="small">查看</Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{item.periodName}</span>
                          <Tag color={
                            item.status === '已完成' ? 'success' :
                            item.status === '进行中' ? 'processing' :
                            item.status === '待审批' ? 'warning' : 'default'
                          }>
                            {item.status}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
                          <span>总金额: {(item.totalAmount / 10000).toFixed(2)}万元</span>
                          <span>员工数: {item.employeeCount}人</span>
                          <span>创建时间: {item.createdAt}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ManagementEfficiencySection;
