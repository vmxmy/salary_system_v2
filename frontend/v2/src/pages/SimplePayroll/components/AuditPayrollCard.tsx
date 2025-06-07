import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Statistic, 
  Badge, 
  Modal, 
  Table, 
  Tag, 
  Tooltip,
  message,
  Alert,
  Progress,
  Row,
  Col,
  Switch,
  Input
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  BugOutlined, 
  EyeOutlined,
  ToolOutlined,
  CheckOutlined,
  CloseOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollPeriodResponse, PayrollRunResponse, AuditSummary, AuditAnomaly } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';
import { BatchAdjustmentModal } from './BatchAdjustmentModal';

const { Title, Text } = Typography;
const { Column } = Table;

interface AuditPayrollCardProps {
  selectedPeriod: PayrollPeriodResponse | null;
  selectedVersion: PayrollRunResponse | null;
  onRefresh: () => void;
}

const AuditPayrollCard: React.FC<AuditPayrollCardProps> = ({
  selectedPeriod,
  selectedVersion,
  onRefresh
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  
  // 状态管理
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [batchAdjustModalVisible, setBatchAdjustModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [anomalies, setAnomalies] = useState<AuditAnomaly[]>([]);
  const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>([]);
  const [autoFixing, setAutoFixing] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [calculationEngineLoading, setCalculationEngineLoading] = useState(false);

  // 获取审核汇总信息
  const loadAuditSummary = async () => {
    if (!selectedVersion) return;

    try {
      const response = await simplePayrollApi.getAuditSummary(selectedVersion.id);
      setAuditSummary(response.data);
    } catch (error) {
      console.error('Failed to load audit summary:', error);
    }
  };

  // 获取异常列表
  const loadAnomalies = async () => {
    if (!selectedVersion) return;

    try {
      const response = await simplePayrollApi.getAuditAnomalies({
        payroll_run_id: selectedVersion.id,
        severity: showOnlyErrors ? ['error'] : undefined,
        page: 1,
        size: 100
      });
      setAnomalies(response.data);
    } catch (error) {
      console.error('Failed to load anomalies:', error);
    }
  };

  // 当版本变化时重新加载数据
  useEffect(() => {
    if (selectedVersion) {
      // 自动执行审核检查和异常检测
      autoRunAuditCheck();
    } else {
      setAuditSummary(null);
      setAnomalies([]);
    }
  }, [selectedVersion]);

  // 自动执行审核检查
  const autoRunAuditCheck = async () => {
    if (!selectedVersion) return;

    console.log('🔍 [AuditPayrollCard] 自动执行审核检查，版本ID:', selectedVersion.id);
    
    try {
      // 首先尝试获取现有的审核汇总
      await loadAuditSummary();
      
      // 如果没有审核数据或者审核数据过期，自动执行审核检查
      const shouldRunAudit = !auditSummary || auditSummary.total_anomalies === 0;
      
      if (shouldRunAudit) {
        console.log('🚀 [AuditPayrollCard] 执行自动审核检查...');
        setLoading(true);
        
        const response = await simplePayrollApi.runAuditCheck(selectedVersion.id);
        setAuditSummary(response.data);
        
        // 自动加载异常列表
        await loadAnomalies();
        
        console.log('✅ [AuditPayrollCard] 自动审核检查完成:', response.data);
        
        // 如果发现异常，显示提示
        if (response.data.total_anomalies > 0) {
          message.info(`审核完成：发现 ${response.data.total_anomalies} 个异常，其中 ${response.data.error_count} 个错误`);
        } else {
          message.success('审核完成：未发现异常');
        }
      } else {
        // 如果已有审核数据，只加载异常列表
        await loadAnomalies();
        console.log('ℹ️ [AuditPayrollCard] 使用现有审核数据');
      }
    } catch (error) {
      console.error('❌ [AuditPayrollCard] 自动审核检查失败:', error);
      // 失败时仍尝试加载现有数据
      await loadAuditSummary();
    } finally {
      setLoading(false);
    }
  };

  // 执行审核检查
  const handleRunAudit = async () => {
    if (!selectedVersion) return;

    setLoading(true);
    try {
      const response = await simplePayrollApi.runAuditCheck(selectedVersion.id);
      setAuditSummary(response.data);
      await loadAnomalies();
      message.success(t('simplePayroll:audit.checkCompleted'));
    } catch (error) {
      message.error(t('simplePayroll:audit.checkFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 运行简化版计算引擎
  const handleRunCalculationEngine = async () => {
    if (!selectedVersion) return;

    setCalculationEngineLoading(true);
    try {
      const response = await simplePayrollApi.runSimpleCalculationEngine({
        payroll_run_id: selectedVersion.id,
        recalculate_all: true
      });

      // 显示计算结果
      Modal.success({
        title: '计算引擎执行完成',
        width: 700,
        content: (
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {/* 工资运行状态信息 */}
            {response.data.status_info && (
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>🔄 状态变更：</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px' }}>
                  <Tag color="orange">{response.data.status_info.previous_status}</Tag>
                  <span>→</span>
                  <Tag color="green">{response.data.status_info.new_status}</Tag>
                </div>
                {response.data.warning && (
                  <div style={{ marginTop: 8, color: '#faad14', fontSize: '13px' }}>
                    {response.data.warning}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <strong>📊 处理结果：</strong>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f0f9ff', borderRadius: 4 }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    {response.data.total_processed}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>总处理条目</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f6ffed', borderRadius: 4 }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    {response.data.success_count}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>成功计算</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#fff2f0', borderRadius: 4 }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {response.data.error_count}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>计算失败</div>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <strong>💰 计算汇总：</strong>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ padding: 12, backgroundColor: '#f0f9ff', borderRadius: 6, border: '1px solid #d6f7ff' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>应发合计</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff', wordBreak: 'break-all' }}>
                    ¥{response.data.calculation_summary.total_gross_pay.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: 12, backgroundColor: '#fff7e6', borderRadius: 6, border: '1px solid #ffd591' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>扣发合计</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16', wordBreak: 'break-all' }}>
                    ¥{response.data.calculation_summary.total_deductions.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: 12, backgroundColor: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>实发合计</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a', wordBreak: 'break-all' }}>
                    ¥{response.data.calculation_summary.total_net_pay.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {response.data.errors && response.data.errors.length > 0 && (
              <div>
                <strong style={{ color: '#ff4d4f' }}>❌ 计算错误：</strong>
                <div style={{ 
                  maxHeight: 200, 
                  overflow: 'auto', 
                  marginTop: 8, 
                  border: '1px solid #ffccc7', 
                  borderRadius: 6,
                  backgroundColor: '#fff2f0'
                }}>
                  {response.data.errors?.map((error: any, index: number) => (
                    <div key={index} style={{ 
                      padding: 12, 
                      borderBottom: index < (response.data.errors?.length || 0) - 1 ? '1px solid #ffccc7' : 'none'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#ff4d4f', marginBottom: 4 }}>
                        {error.employee_name}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666', 
                        wordBreak: 'break-word',
                        lineHeight: '1.4'
                      }}>
                        {error.error_message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
        onOk: () => {
          // 只刷新审核汇总数据，不触发整个页面刷新
          loadAuditSummary();
        }
      });

      message.success(`计算引擎执行完成，成功处理 ${response.data.success_count} 条记录`);
    } catch (error: any) {
      message.error(error.message || '计算引擎执行失败');
    } finally {
      setCalculationEngineLoading(false);
    }
  };

  // 执行高级审核检查
  const handleRunAdvancedAudit = async () => {
    if (!selectedVersion) return;

    setLoading(true);
    try {
      const response = await simplePayrollApi.runAdvancedAuditCheck(selectedVersion.id);
      
      // 显示高级审核结果
      Modal.info({
        title: '高级审核检查完成',
        width: 800,
        content: (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>基础审核：</strong>
              <ul>
                <li>总条目数：{response.data.basic_audit.total_entries}</li>
                <li>异常总数：{response.data.basic_audit.total_anomalies}</li>
                <li>错误数：{response.data.basic_audit.error_count}</li>
                <li>警告数：{response.data.basic_audit.warning_count}</li>
              </ul>
            </div>
            
            <div>
              <strong>高级检查结果：</strong>
              {response.data.advanced_checks.map((check: any, index: number) => (
                <div key={index} style={{ marginTop: 12, padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{check.name}</div>
                  {check.results.error && (
                    <div style={{ color: '#ff4d4f' }}>错误：{check.results.error}</div>
                  )}
                  {check.results.summary && (
                    <div>
                      <div>检查项目：{check.results.total_checked || check.results.total_analyzed || '未知'}</div>
                      <div>发现问题：{check.results.issues_found || check.results.anomalies_detected || 0}</div>
                    </div>
                  )}
                  {check.results.message && (
                    <div style={{ color: '#faad14' }}>{check.results.message}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ),
        onOk: () => {
          // 刷新基础审核数据
          loadAuditSummary();
          loadAnomalies();
        }
      });
      
      message.success('高级审核检查完成');
    } catch (error: any) {
      message.error(error.message || '高级审核检查失败');
    } finally {
      setLoading(false);
    }
  };

  // 自动修复异常
  const handleAutoFix = async () => {
    if (!selectedVersion || selectedAnomalies.length === 0) return;

    setAutoFixing(true);
    try {
      const response = await simplePayrollApi.autoFixAnomalies({
        payroll_run_id: selectedVersion.id,
        anomaly_ids: selectedAnomalies
      });

      message.success(
        t('simplePayroll:audit.autoFixSuccess', {
          fixed: response.data.fixed_count,
          failed: response.data.failed_count
        })
      );

      // 重新加载数据
      await loadAuditSummary();
      await loadAnomalies();
      setSelectedAnomalies([]);
      onRefresh();
    } catch (error) {
      message.error(t('simplePayroll:audit.autoFixFailed'));
    } finally {
      setAutoFixing(false);
    }
  };

  // 忽略异常
  const handleIgnoreAnomalies = async (anomalyIds: string[], reason: string) => {
    try {
      await simplePayrollApi.ignoreAnomalies({
        anomaly_ids: anomalyIds,
        reason
      });

      message.success(t('simplePayroll:audit.ignoreSuccess'));
      await loadAnomalies();
    } catch (error) {
      message.error(t('simplePayroll:audit.ignoreFailed'));
    }
  };

  // 更新审核状态
  const handleUpdateStatus = async (status: string) => {
    if (!selectedVersion) return;

    try {
      await simplePayrollApi.updateAuditStatus({
        payroll_run_id: selectedVersion.id,
        status: status as any
      });

      message.success(t('simplePayroll:audit.statusUpdated'));
      onRefresh();
    } catch (error) {
      message.error(t('simplePayroll:audit.statusUpdateFailed'));
    }
  };

  // 打开审核详情模态框
  const handleOpenAuditModal = async () => {
    setAuditModalVisible(true);
    await loadAnomalies();
  };

  // 获取严重性颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  // 获取严重性标签
  const getSeverityTag = (severity: string) => {
    const color = getSeverityColor(severity);
    return (
      <Tag color={color}>
        {t(`simplePayroll:audit.severity.${severity}`)}
      </Tag>
    );
  };

  return (
    <Card
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#1890ff' }} />
          <span>{t('simplePayroll:audit.title')}</span>
        </Space>
      }
      style={{ minHeight: '400px', height: 'auto' }}
      bodyStyle={{ padding: '16px' }}
      hoverable
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 功能描述 */}
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            {t('simplePayroll:audit.description')}
          </Text>
        </div>

        {/* 审核状态概览 */}
        {auditSummary && (
          <Alert
            message={
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title={t('simplePayroll:audit.totalEntries')}
                    value={auditSummary.total_entries}
                    suffix={t('simplePayroll:common.entries')}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('simplePayroll:audit.anomalies')}
                    value={auditSummary.total_anomalies}
                    suffix={
                      <Badge
                        count={auditSummary.error_count}
                        style={{ backgroundColor: '#ff4d4f' }}
                      />
                    }
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('simplePayroll:audit.autoFixable')}
                    value={auditSummary.auto_fixable_count}
                    valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                  />
                </Col>
              </Row>
            }
            type={auditSummary.error_count > 0 ? 'error' : auditSummary.warning_count > 0 ? 'warning' : 'success'}
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* 功能按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          <Button
            type="primary"
            icon={<BugOutlined />}
            onClick={handleRunAudit}
            loading={loading}
            disabled={!selectedVersion}
            block
            size="small"
          >
            {t('simplePayroll:audit.runCheck')}
          </Button>

          <Button
            icon={<EyeOutlined />}
            onClick={handleOpenAuditModal}
            disabled={!selectedVersion || !auditSummary}
            block
            size="small"
          >
            {t('simplePayroll:audit.viewDetails')}
          </Button>

          <Button
            icon={<CalculatorOutlined />}
            onClick={() => setBatchAdjustModalVisible(true)}
            disabled={!selectedVersion}
            block
            size="small"
          >
            {t('simplePayroll:batchAdjust.title')}
          </Button>

          <Button
            type="dashed"
            icon={<BugOutlined />}
            onClick={handleRunAdvancedAudit}
            loading={loading}
            disabled={!selectedVersion}
            block
            size="small"
          >
            高级审核
          </Button>

          <Button
            type="default"
            icon={<CalculatorOutlined />}
            onClick={handleRunCalculationEngine}
            loading={calculationEngineLoading}
            disabled={!selectedVersion}
            block
            size="small"
            style={{ 
              borderColor: '#1890ff', 
              color: '#1890ff',
              backgroundColor: '#f6ffed'
            }}
          >
            运行计算引擎
          </Button>

          {selectedVersion?.status_name === 'DRAFT' && (
            <Button
              type="dashed"
              icon={<CheckOutlined />}
              onClick={() => handleUpdateStatus('IN_REVIEW')}
              disabled={!auditSummary || auditSummary.error_count > 0}
              block
              size="small"
            >
              {t('simplePayroll:audit.submitForReview')}
            </Button>
          )}
        </div>

        {/* 状态提示 */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
          {!selectedVersion ? (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('simplePayroll:audit.selectVersionHint')}
            </Text>
          ) : !auditSummary ? (
            <Text type="warning" style={{ fontSize: '12px' }}>
              ⚠️ {t('simplePayroll:audit.noAuditData')}
            </Text>
          ) : auditSummary.error_count === 0 && auditSummary.warning_count === 0 ? (
            <Text type="success" style={{ fontSize: '12px' }}>
              ✅ {t('simplePayroll:audit.allClear')}
            </Text>
          ) : (
            <Text type="danger" style={{ fontSize: '12px' }}>
              ❌ {t('simplePayroll:audit.hasIssues')}
            </Text>
          )}
        </div>
      </div>

      {/* 审核详情模态框 */}
      <Modal
        title={t('simplePayroll:audit.detailModal.title')}
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        width={1200}
        footer={
          <Space>
            <Switch
              checked={showOnlyErrors}
              onChange={setShowOnlyErrors}
              checkedChildren={t('simplePayroll:audit.showOnlyErrors')}
              unCheckedChildren={t('simplePayroll:audit.showAll')}
            />
            <Button
              type="primary"
              icon={<ToolOutlined />}
              onClick={handleAutoFix}
              loading={autoFixing}
              disabled={selectedAnomalies.length === 0}
            >
              {t('simplePayroll:audit.autoFix')} ({selectedAnomalies.length})
            </Button>
            <Button onClick={() => setAuditModalVisible(false)}>
              {t('common:close')}
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={anomalies}
          rowKey="id"
          size="small"
          scroll={{ y: 400 }}
          rowSelection={{
            selectedRowKeys: selectedAnomalies,
            onChange: (selectedRowKeys) => setSelectedAnomalies(selectedRowKeys as string[]),
            getCheckboxProps: (record) => ({
              disabled: !record.can_auto_fix || record.is_ignored
            })
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => t('simplePayroll:audit.totalAnomalies', { total })
          }}
        >
          <Column
            title={t('simplePayroll:audit.employee')}
            dataIndex="employee_name"
            key="employee"
            width={120}
            render={(text, record: AuditAnomaly) => (
              <Space direction="vertical" size={0}>
                <Text strong style={{ fontSize: '13px' }}>{text}</Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {record.employee_code}
                </Text>
              </Space>
            )}
          />

          <Column
            title={t('simplePayroll:audit.anomalyType')}
            dataIndex="anomaly_type"
            key="type"
            width={180}
            render={(type) => (
              <Tag style={{ fontSize: '11px', padding: '2px 6px' }}>
                {t(`simplePayroll:audit.types.${type}`)}
              </Tag>
            )}
          />

          <Column
            title={t('simplePayroll:audit.severity')}
            dataIndex="severity"
            key="severity"
            width={80}
            render={(severity) => getSeverityTag(severity)}
          />

          <Column
            title={t('simplePayroll:audit.message')}
            dataIndex="message"
            key="message"
            width={300}
            render={(text, record: AuditAnomaly) => (
              <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                <Tooltip title={record.details} placement="topLeft">
                  <Text style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    {text}
                  </Text>
                </Tooltip>
              </div>
            )}
          />

          <Column
            title={t('simplePayroll:audit.status')}
            key="status"
            width={120}
            render={(_, record: AuditAnomaly) => (
              <Space direction="vertical" size={2}>
                {record.can_auto_fix && (
                  <Tag color="green" style={{ fontSize: '10px', margin: 0 }}>
                    {t('simplePayroll:audit.autoFixable')}
                  </Tag>
                )}
                {record.is_ignored && (
                  <Tag color="default" style={{ fontSize: '10px', margin: 0 }}>
                    {t('simplePayroll:audit.ignored')}
                  </Tag>
                )}
              </Space>
            )}
          />

          <Column
            title={t('common:actions')}
            key="actions"
            width={80}
            fixed="right"
            render={(_, record: AuditAnomaly) => (
              <Space size="small">
                {!record.is_ignored && (
                  <Button
                    size="small"
                    type="link"
                    icon={<CloseOutlined />}
                    style={{ padding: '2px 4px', fontSize: '11px' }}
                    onClick={() => {
                      Modal.confirm({
                        title: t('simplePayroll:audit.ignoreConfirm'),
                        content: (
                          <Input.TextArea
                            placeholder={t('simplePayroll:audit.ignoreReason')}
                            onChange={(e) => {
                              const reason = e.target.value;
                              if (reason.trim()) {
                                handleIgnoreAnomalies([record.id], reason);
                              }
                            }}
                          />
                        )
                      });
                    }}
                  >
                    {t('simplePayroll:audit.ignore')}
                  </Button>
                )}
              </Space>
            )}
          />
        </Table>
      </Modal>

      {/* 批量调整模态框 */}
      {selectedVersion && (
        <BatchAdjustmentModal
          visible={batchAdjustModalVisible}
          onCancel={() => setBatchAdjustModalVisible(false)}
          onSuccess={() => {
            setBatchAdjustModalVisible(false);
            onRefresh();
            loadAuditSummary();
          }}
          payrollRun={selectedVersion}
        />
      )}
    </Card>
  );
};

export default AuditPayrollCard; 