import React, { useMemo } from 'react';
import {
  Card,
  Alert,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  List,
  Collapse,
  Space,
  Button,
  Tooltip
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { ValidatedPayrollEntryData } from '../../../types/payrollTypes';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ImportImpactSummaryProps {
  parsedData: ValidatedPayrollEntryData[];
  payrollPeriodName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ImpactAnalysis {
  newEmployees: ValidatedPayrollEntryData[];
  existingEmployees: ValidatedPayrollEntryData[];
  totalAmount: {
    grossPay: number;
    netPay: number;
    deductions: number;
  };
  fieldUpdates: {
    employeeId: number;
    employeeName: string;
    updates: Array<{
      field: string;
      fieldName: string;
      oldValue: any;
      newValue: any;
    }>;
  }[];
}

export const ImportImpactSummary: React.FC<ImportImpactSummaryProps> = ({
  parsedData,
  payrollPeriodName,
  onConfirm,
  onCancel
}) => {
  // 分析本次导入的影响
  const impactAnalysis = useMemo<ImpactAnalysis>(() => {
    const newEmployees: ValidatedPayrollEntryData[] = [];
    const existingEmployees: ValidatedPayrollEntryData[] = [];
    const fieldUpdates: ImpactAnalysis['fieldUpdates'] = [];
    
    let totalGrossPay = 0;
    let totalNetPay = 0;
    let totalDeductions = 0;

    parsedData.forEach(record => {
      // 累计金额
      totalGrossPay += Number(record.gross_pay) || 0;
      totalNetPay += Number(record.net_pay) || 0;
      totalDeductions += Number(record.total_deductions) || 0;

      if (record.__isNew) {
        newEmployees.push(record);
      } else {
        existingEmployees.push(record);
        
        // 分析字段更新（如果有字段冲突信息）
        if (record.field_conflicts && record.field_conflicts.length > 0) {
          fieldUpdates.push({
            employeeId: record.employee_id,
            employeeName: record.employee_name || record.employee_full_name || '未知',
            updates: record.field_conflicts.map(conflict => ({
              field: conflict.field,
              fieldName: conflict.fieldName,
              oldValue: conflict.currentValue,
              newValue: conflict.newValue
            }))
          });
        }
      }
    });

    return {
      newEmployees,
      existingEmployees,
      totalAmount: {
        grossPay: totalGrossPay,
        netPay: totalNetPay,
        deductions: totalDeductions
      },
      fieldUpdates
    };
  }, [parsedData]);

  // 格式化货币
  const formatCurrency = (amount: number): string => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 渲染新增员工列表
  const renderNewEmployeesList = (employees: ValidatedPayrollEntryData[]) => (
    <List
      size="small"
      dataSource={employees}
      renderItem={(employee) => (
        <List.Item>
          <Space>
            <UserAddOutlined style={{ color: '#52c41a' }} />
            <Text strong>{employee.employee_name || employee.employee_full_name}</Text>
            <Text type="secondary">({employee.id_number})</Text>
            <Tag color="green">应发: {formatCurrency(Number(employee.gross_pay) || 0)}</Tag>
            <Tag color="blue">实发: {formatCurrency(Number(employee.net_pay) || 0)}</Tag>
          </Space>
        </List.Item>
      )}
    />
  );

  // 渲染更新员工列表
  const renderExistingEmployeesList = (employees: ValidatedPayrollEntryData[]) => (
    <List
      size="small"
      dataSource={employees}
      renderItem={(employee) => (
        <List.Item>
          <Space>
            <EditOutlined style={{ color: '#1890ff' }} />
            <Text strong>{employee.employee_name || employee.employee_full_name}</Text>
            <Text type="secondary">({employee.id_number})</Text>
            <Tag color="orange">更新记录</Tag>
            <Tag color="green">应发: {formatCurrency(Number(employee.gross_pay) || 0)}</Tag>
            <Tag color="blue">实发: {formatCurrency(Number(employee.net_pay) || 0)}</Tag>
          </Space>
        </List.Item>
      )}
    />
  );

  // 渲染字段更新详情
  const renderFieldUpdates = (updates: ImpactAnalysis['fieldUpdates']) => (
    <List
      size="small"
      dataSource={updates}
      renderItem={(update) => (
        <List.Item>
          <div style={{ width: '100%' }}>
            <div style={{ marginBottom: 8 }}>
              <Space>
                <UserOutlined />
                <Text strong>{update.employeeName}</Text>
                <Tag color="processing">{update.updates.length} 个字段将被更新</Tag>
              </Space>
            </div>
            <div style={{ paddingLeft: 24 }}>
              {update.updates.map((fieldUpdate, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  <Space>
                    <Text type="secondary">{fieldUpdate.fieldName}:</Text>
                    <Text delete style={{ color: '#ff4d4f' }}>
                      {fieldUpdate.oldValue || '(空)'}
                    </Text>
                    <Text>→</Text>
                    <Text strong style={{ color: '#52c41a' }}>
                      {fieldUpdate.newValue || '(空)'}
                    </Text>
                  </Space>
                </div>
              ))}
            </div>
          </div>
        </List.Item>
      )}
    />
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>
            <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            导入操作预览确认
          </Title>
          <Paragraph type="secondary">
            请仔细检查以下操作内容，确认无误后执行导入
          </Paragraph>
        </div>

        {/* 基本信息 */}
        <Alert
          message={
            <Space>
              <strong>目标薪资周期:</strong>
              <Tag color="blue">{payrollPeriodName}</Tag>
              <strong>导入模式:</strong>
              <Tag color="green">智能合并</Tag>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 统计概览 */}
        <Card title="📊 操作统计概览" size="small" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="新增员工"
                value={impactAnalysis.newEmployees.length}
                prefix={<UserAddOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="更新员工"
                value={impactAnalysis.existingEmployees.length}
                prefix={<EditOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总应发金额"
                value={impactAnalysis.totalAmount.grossPay}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总实发金额"
                value={impactAnalysis.totalAmount.netPay}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 详细操作内容 */}
        <Collapse defaultActiveKey={['new', 'existing']} style={{ marginBottom: 24 }}>
          {/* 新增员工 */}
          {impactAnalysis.newEmployees.length > 0 && (
            <Panel
              header={
                <Space>
                  <UserAddOutlined style={{ color: '#52c41a' }} />
                  <Text strong>新增员工薪资记录 ({impactAnalysis.newEmployees.length} 人)</Text>
                  <Tag color="green">这些员工将被添加到薪资系统中</Tag>
                </Space>
              }
              key="new"
            >
              {renderNewEmployeesList(impactAnalysis.newEmployees)}
            </Panel>
          )}

          {/* 更新员工 */}
          {impactAnalysis.existingEmployees.length > 0 && (
            <Panel
              header={
                <Space>
                  <EditOutlined style={{ color: '#1890ff' }} />
                  <Text strong>更新员工薪资记录 ({impactAnalysis.existingEmployees.length} 人)</Text>
                  <Tag color="orange">这些员工的薪资记录将被智能更新</Tag>
                </Space>
              }
              key="existing"
            >
              {renderExistingEmployeesList(impactAnalysis.existingEmployees)}
            </Panel>
          )}

          {/* 字段更新详情 */}
          {impactAnalysis.fieldUpdates.length > 0 && (
            <Panel
              header={
                <Space>
                  <WarningOutlined style={{ color: '#fa8c16' }} />
                  <Text strong>字段更新详情 ({impactAnalysis.fieldUpdates.length} 人)</Text>
                  <Tag color="warning">以下字段将被覆盖更新</Tag>
                </Space>
              }
              key="updates"
            >
              {renderFieldUpdates(impactAnalysis.fieldUpdates)}
            </Panel>
          )}
        </Collapse>

        {/* 重要提醒 */}
        <Alert
          message="⚠️ 重要提醒"
          description={
            <div>
              <Paragraph>
                <strong>智能合并规则:</strong>
              </Paragraph>
              <ul>
                <li><strong>新员工:</strong> 直接添加完整的薪资记录</li>
                <li><strong>已存在员工:</strong> 只更新Excel中有数据的字段，保留数据库中其他字段的原值</li>
                <li><strong>金额字段:</strong> 应发、实发、扣除等金额字段会被完整更新</li>
                <li><strong>明细字段:</strong> 收入明细和扣除明细会进行智能合并</li>
              </ul>
              <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
                <Text type="danger">
                  <strong>此操作不可撤销，请确认上述信息无误后再执行导入！</strong>
                </Text>
              </Paragraph>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button size="large" onClick={onCancel}>
              取消导入
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={onConfirm}
              style={{ minWidth: 120 }}
            >
              确认执行导入
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ImportImpactSummary;