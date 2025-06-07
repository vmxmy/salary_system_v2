import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Table, 
  Typography, 
  Space, 
  Statistic, 
  Progress, 
  Alert,
  Divider,
  Tag,
  Spin
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  DownloadOutlined, 
  ReloadOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMessage } from '../../../hooks/useMessage';
import * as payrollApi from '../services/payrollApi';
import { payrollViewsApi } from '../services/payrollViewsApi';
import {
  performanceMonitor,
  compareApiPerformance,
  type PerformanceComparison
} from '../utils/performanceMonitor';

const { Title, Text, Paragraph } = Typography;

interface TestResult {
  testName: string;
  comparison: PerformanceComparison | null;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

/**
 * 性能测试页面
 * 用于对比原有API与视图API的性能差异
 */
const PerformanceTestPage: React.FC = () => {
  const { t } = useTranslation();
  const appMessage = useMessage();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  // 定义测试用例
  const testCases = [
    {
      name: '薪资周期列表对比',
      originalApiCall: () => payrollApi.getPayrollPeriods({ size: 100 }),
      viewApiCall: () => payrollViewsApi.getPayrollPeriodsDetail({ limit: 100 }),
      originalApiName: 'getPayrollPeriods',
      viewApiName: 'getPayrollPeriodsDetail'
    },
    {
      name: '薪资运行列表对比',
      originalApiCall: () => payrollApi.getPayrollRuns({ size: 100 }),
      viewApiCall: () => payrollViewsApi.getPayrollRunsDetail({ limit: 100 }),
      originalApiName: 'getPayrollRuns',
      viewApiName: 'getPayrollRunsDetail'
    },
    {
      name: '薪资条目列表对比',
      originalApiCall: () => payrollApi.getPayrollEntries({ size: 100 }),
      viewApiCall: () => payrollViewsApi.getPayrollEntriesDetailed({ limit: 100 }),
      originalApiName: 'getPayrollEntries',
      viewApiName: 'getPayrollEntriesDetailed'
    }
  ];

  /**
   * 运行单个测试
   */
  const runSingleTest = async (testCase: any, iterations: number = 3): Promise<TestResult> => {
    const testResult: TestResult = {
      testName: testCase.name,
      comparison: null,
      status: 'running'
    };

    try {
      setCurrentTest(testCase.name);
      
      const { comparison } = await compareApiPerformance(
        testCase.originalApiName,
        testCase.viewApiName,
        testCase.originalApiCall,
        testCase.viewApiCall,
        iterations
      );

      testResult.comparison = comparison;
      testResult.status = 'completed';
      
    } catch (error: any) {
      console.error(`Error running test ${testCase.name}:`, error);
      testResult.status = 'error';
      testResult.error = error.message;
    }

    return testResult;
  };

  /**
   * 运行所有性能测试
   */
  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);
    
    try {
      const results: TestResult[] = [];
      
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        setProgress(((i) / testCases.length) * 100);
        
        const result = await runSingleTest(testCase, 3);
        results.push(result);
        setTestResults([...results]);
        
        // 短暂延迟避免过快的请求
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setProgress(100);
      appMessage.success('所有性能测试完成！');
      
    } catch (error: any) {
      console.error('Error running performance tests:', error);
      appMessage.error('性能测试执行失败');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  /**
   * 清除测试结果
   */
  const clearResults = () => {
    setTestResults([]);
    performanceMonitor.clearMetrics();
    setProgress(0);
    appMessage.info('测试结果已清除');
  };

  /**
   * 导出测试结果
   */
  const exportResults = () => {
    const report = performanceMonitor.generatePerformanceReport();
    const exportData = {
      timestamp: new Date().toISOString(),
      testResults,
      performanceReport: report
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-performance-test-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    appMessage.success('测试结果已导出');
  };

  // 测试结果表格列定义
  const columns = [
    {
      title: '测试项目',
      dataIndex: 'testName',
      key: 'testName',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'default', icon: <ClockCircleOutlined />, text: '待执行' },
          running: { color: 'processing', icon: <Spin size="small" />, text: '执行中' },
          completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
          error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '失败' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '原始API耗时',
      key: 'originalDuration',
      width: 120,
      render: (record: TestResult) => {
        if (!record.comparison) return '-';
        return `${record.comparison.originalApi.duration.toFixed(2)}ms`;
      }
    },
    {
      title: '视图API耗时',
      key: 'viewDuration',
      width: 120,
      render: (record: TestResult) => {
        if (!record.comparison) return '-';
        return `${record.comparison.viewApi.duration.toFixed(2)}ms`;
      }
    },
    {
      title: '性能提升',
      key: 'improvement',
      width: 150,
      render: (record: TestResult) => {
        if (!record.comparison) return '-';
        const { improvement } = record.comparison;
        const isImprovement = improvement.percentageImprovement > 0;
        return (
          <Space>
            <Text type={isImprovement ? 'success' : 'danger'}>
              {improvement.percentageImprovement > 0 ? '+' : ''}
              {improvement.percentageImprovement.toFixed(1)}%
            </Text>
            <Text type="secondary">
              ({improvement.durationImprovement > 0 ? '+' : ''}
              {improvement.durationImprovement.toFixed(2)}ms)
            </Text>
          </Space>
        );
      }
    },
    {
      title: '数据量对比',
      key: 'dataSize',
      width: 120,
      render: (record: TestResult) => {
        if (!record.comparison) return '-';
        const originalSize = record.comparison.originalApi.recordCount || 0;
        const viewSize = record.comparison.viewApi.recordCount || 0;
        return `${originalSize} / ${viewSize}`;
      }
    }
  ];

  // 计算总体统计
  const completedTests = testResults.filter(r => r.status === 'completed' && r.comparison);
  const totalImprovement = completedTests.length > 0 
    ? completedTests.reduce((sum, r) => sum + (r.comparison?.improvement.percentageImprovement || 0), 0) / completedTests.length
    : 0;
  const successfulTests = completedTests.length;
  const failedTests = testResults.filter(r => r.status === 'error').length;

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>
            <ThunderboltOutlined /> API性能测试对比
          </Title>
          <Text type="secondary">对比原有API与视图API的性能差异</Text>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={runAllTests}
              loading={isRunning}
              disabled={isRunning}
            >
              开始测试
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={clearResults}
              disabled={isRunning}
            >
              清除结果
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={exportResults}
              disabled={testResults.length === 0}
            >
              导出结果
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 测试进度 */}
      {isRunning && (
        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>测试进度</Text>
            <Progress 
              percent={progress} 
              status={progress === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            {currentTest && (
              <Text type="secondary">当前测试: {currentTest}</Text>
            )}
          </Space>
        </Card>
      )}

      {/* 总体统计 */}
      {testResults.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="成功测试"
                value={successfulTests}
                suffix={`/ ${testResults.length}`}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="失败测试"
                value={failedTests}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="平均性能提升"
                value={totalImprovement}
                precision={1}
                suffix="%"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: totalImprovement > 0 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="测试完成度"
                value={(testResults.filter(r => r.status !== 'pending').length / testCases.length) * 100}
                precision={0}
                suffix="%"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 测试说明 */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>测试说明</Title>
        <Paragraph>
          本测试将对比以下API的性能差异：
        </Paragraph>
        <ul>
          <li><strong>薪资周期列表</strong>：对比 <code>getPayrollPeriods</code> 与 <code>getPayrollPeriodsDetail</code></li>
          <li><strong>薪资运行列表</strong>：对比 <code>getPayrollRuns</code> 与 <code>getPayrollRunsDetail</code></li>
          <li><strong>薪资条目列表</strong>：对比 <code>getPayrollEntries</code> 与 <code>getPayrollEntriesDetailed</code></li>
        </ul>
        <Paragraph>
          每个测试将执行3次迭代，取平均值进行对比。视图API通过数据库视图预计算，应该具有更好的性能表现。
        </Paragraph>
      </Card>

      {/* 测试结果表格 */}
      <Card title="测试结果">
        <Table
          columns={columns}
          dataSource={testResults}
          rowKey="testName"
          pagination={false}
          loading={isRunning}
          locale={{
            emptyText: '暂无测试结果，点击"开始测试"执行性能对比'
          }}
        />
      </Card>

      {/* 性能建议 */}
      {completedTests.length > 0 && (
        <Card title="性能分析建议" style={{ marginTop: '24px' }}>
          {completedTests.map((result, index) => {
            if (!result.comparison) return null;
            
            const { improvement } = result.comparison;
            let alertType: 'success' | 'warning' | 'error' = 'success';
            let message = '';
            
            if (improvement.percentageImprovement > 20) {
              alertType = 'success';
              message = `🚀 ${result.testName}: 视图API性能提升显著 (${improvement.percentageImprovement.toFixed(1)}%)，建议优先使用`;
            } else if (improvement.percentageImprovement > 0) {
              alertType = 'success';
              message = `✅ ${result.testName}: 视图API性能略有提升 (${improvement.percentageImprovement.toFixed(1)}%)，可以安全切换`;
            } else if (improvement.percentageImprovement > -10) {
              alertType = 'warning';
              message = `⚠️ ${result.testName}: 性能差异较小 (${improvement.percentageImprovement.toFixed(1)}%)，需要进一步优化`;
            } else {
              alertType = 'error';
              message = `❌ ${result.testName}: 视图API性能下降 (${Math.abs(improvement.percentageImprovement).toFixed(1)}%)，需要检查视图查询优化`;
            }
            
            return (
              <Alert
                key={index}
                message={message}
                type={alertType}
                showIcon
                style={{ marginBottom: '8px' }}
              />
            );
          })}
        </Card>
      )}
    </div>
  );
};

export default PerformanceTestPage; 