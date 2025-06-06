import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Select, Space, Button, message, Spin, Tag, Tabs } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import GeneratePayrollCard from './components/GeneratePayrollCard';
import AuditPayrollCard from './components/AuditPayrollCard';
import GenerateReportsCard from './components/GenerateReportsCard';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { usePayrollPeriods } from './hooks/usePayrollPeriods';
import { usePayrollVersions } from './hooks/usePayrollVersions';
import { useAuditSummary } from './hooks/useAuditSummary';
import type { PayrollPeriodResponse, PayrollRunResponse } from './types/simplePayroll';
import './styles.less';

const { Header, Content } = Layout;

const SimplePayrollPage: React.FC = () => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const navigate = useNavigate();
  
  // 状态管理
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>();
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('workflow');

  // 数据获取
  const {
    periods,
    loading: periodsLoading,
    refetch: refetchPeriods
  } = usePayrollPeriods();

  // 监控periods数据变化
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] periods数据更新:', {
      count: periods.length,
      loading: periodsLoading,
      firstPeriod: periods[0],
      allPeriods: periods.map(p => ({ id: p.id, name: p.name }))
    });
  }, [periods, periodsLoading]);

  const {
    versions,
    loading: versionsLoading,
    refetch: refetchVersions
  } = usePayrollVersions(selectedPeriodId);

  // 获取审核摘要数据
  const {
    auditSummary,
    loading: auditLoading,
    refetch: refetchAuditSummary
  } = useAuditSummary(selectedVersionId);

  // 强制版本选择 - 当版本加载完成且没有选中版本时
  useEffect(() => {
    if (!versionsLoading && versions.length > 0 && !selectedVersionId) {
      console.log('🚀 [SimplePayrollPage] 强制选择第一个版本:', versions[0].id);
      setSelectedVersionId(versions[0].id);
    }
  }, [versionsLoading, versions.length, selectedVersionId]);

  // 当前选中的期间和版本
  const currentPeriod = periods.find(p => p.id === selectedPeriodId);
  const currentVersion = versions.find(v => v.id === selectedVersionId);

  // 刷新数据
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetchPeriods();
    if (selectedPeriodId) {
      refetchVersions();
    }
    if (selectedVersionId) {
      refetchAuditSummary();
    }
  };

  // 导航到批量导入页面
  const handleNavigateToBulkImport = () => {
    navigate('/payroll/bulk-import');
  };

  // 期间变化时重置版本选择
  useEffect(() => {
    console.log('🎯 [SimplePayrollPage] 期间变化，重置版本选择:', selectedPeriodId);
    setSelectedVersionId(undefined);
  }, [selectedPeriodId]);

  // 版本数据更新时自动选择最新版本
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] 版本自动选择检查:', {
      versionsLength: versions.length,
      selectedVersionId,
      firstVersionId: versions[0]?.id
    });
    
    if (versions.length > 0 && !selectedVersionId) {
      console.log('✅ [SimplePayrollPage] 自动选择版本:', versions[0].id);
      setSelectedVersionId(versions[0].id);
    }
  }, [versions.length, selectedVersionId]); // 修改依赖数组，避免versions对象引用变化导致的问题

  return (
    <Layout className="simple-payroll-layout">
      {/* 标题区 */}
      <div className="title-area">
        <div className="title-content">
          <h2>{t('simplePayroll:title')}</h2>
          <p>{t('simplePayroll:subtitle')}</p>
          {activeTab === 'workflow' && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px 12px', 
              background: '#f6ffed', 
              borderRadius: '6px', 
              border: '1px solid #b7eb8f',
              fontSize: '13px',
              color: '#52c41a'
            }}>
              💡 <strong>智能流程引导</strong>：系统会根据当前工资运行状态，自动显示对应的操作步骤和可用功能
            </div>
          )}
        </div>
      </div>

      {/* 控件区 */}
      <div className="controls-area">
        <div className="controls-content">
          <Space size="large">
            {/* 期间选择 */}
            <div className="control-group">
              <label>{t('simplePayroll:controls.period')}:</label>
              <Select
                style={{ width: 280 }}
                placeholder={t('simplePayroll:controls.selectPeriod')}
                value={selectedPeriodId}
                onChange={(value) => {
                  console.log('🎯 [SimplePayrollPage] 期间选择变化:', value);
                  setSelectedPeriodId(value);
                }}
                loading={periodsLoading}
                showSearch
                optionFilterProp="label"
                onDropdownVisibleChange={(open) => {
                  console.log('📋 [SimplePayrollPage] 下拉框状态:', {
                    open,
                    periodsCount: periods.length,
                    loading: periodsLoading
                  });
                }}
              >
                {periods.map(period => {
                  console.log('🔄 [SimplePayrollPage] 渲染期间选项:', {
                    id: period.id,
                    name: period.name,
                    status: period.status_name
                  });
                  return (
                    <Select.Option 
                      key={period.id} 
                      value={period.id}
                      label={period.name}
                    >
                      <div style={{ maxWidth: '250px' }}>
                        <div style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {period.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis'
                        }}>
                          状态: {period.status_name}, 版本数: {period.runs_count}
                        </div>
                      </div>
                    </Select.Option>
                  );
                })}
              </Select>
            </div>

            {/* 版本选择 */}
            {selectedPeriodId && (
              <div className="control-group">
                <label>{t('simplePayroll:controls.version')}:</label>
                <Select
                  style={{ width: 280 }}
                  placeholder={t('simplePayroll:controls.selectVersion')}
                  value={selectedVersionId}
                  onChange={setSelectedVersionId}
                  loading={versionsLoading}
                  allowClear
                >
                  {versions.map(version => (
                    <Select.Option key={version.id} value={version.id}>
                      <div style={{ maxWidth: '250px' }}>
                        <div style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          版本 {version.version_number}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis'
                        }}>
                          {version.initiated_at && new Date(version.initiated_at).toLocaleString()}
                        </div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>
            )}

            {/* 工资运行状态标签 */}
            {currentVersion && (
              <div className="control-group">
                <label>当前状态:</label>
                <Tag 
                  color={
                    currentVersion.status_name === '已计算' ? 'green' :
                    currentVersion.status_name === '待计算' ? 'orange' :
                    currentVersion.status_name === '已支付' ? 'blue' :
                    'default'
                  }
                  style={{ 
                    fontSize: '13px',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {currentVersion.status_name || '未知状态'}
                </Tag>
              </div>
            )}

            {/* 快速切换到流程引导 */}
            {activeTab !== 'workflow' && currentVersion && (
              <Button 
                type="primary"
                icon={<ClockCircleOutlined />} 
                onClick={() => setActiveTab('workflow')}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                智能引导
              </Button>
            )}

            {/* 刷新按钮 */}
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={periodsLoading || versionsLoading}
            >
              {t('common:refresh')}
            </Button>
          </Space>
        </div>
      </div>

      {/* 主要内容区 */}
      <Content className="cards-area">
        <Spin spinning={periodsLoading}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'workflow',
                label: (
                  <Space>
                    <ClockCircleOutlined />
                    智能流程引导
                  </Space>
                ),
                children: (
                  <Row gutter={[24, 24]}>
                    <Col span={24}>
                      <EnhancedWorkflowGuide
                        selectedVersion={currentVersion}
                        auditSummary={auditSummary}
                        onRefresh={handleRefresh}
                        onNavigateToBulkImport={handleNavigateToBulkImport}
                      />
                    </Col>
                  </Row>
                )
              },
              {
                key: 'cards',
                label: (
                  <Space>
                    <AppstoreOutlined />
                    功能卡片
                  </Space>
                ),
                children: (
                  <Row gutter={[24, 24]} justify="start" align="top">
                    {/* 生成工资卡片 */}
                    <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                      <GeneratePayrollCard
                        currentPeriod={currentPeriod}
                        onRefresh={handleRefresh}
                      />
                    </Col>

                    {/* 审核工资卡片 */}
                    <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                      <AuditPayrollCard
                        selectedPeriod={currentPeriod}
                        selectedVersion={currentVersion}
                        onRefresh={handleRefresh}
                      />
                    </Col>

                    {/* 一键报表卡片 */}
                    <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                      <GenerateReportsCard
                        selectedPeriod={currentPeriod}
                        selectedVersion={currentVersion}
                      />
                    </Col>
                  </Row>
                )
              }
            ]}
          />

          {/* 状态提示 */}
          {!selectedPeriodId && (
            <div className="status-hint">
              <p>{t('simplePayroll:hints.selectPeriod')}</p>
              {activeTab === 'workflow' && (
                <p style={{ color: '#1890ff', marginTop: '8px' }}>
                  💡 选择工资期间后，智能流程引导将为您显示具体的操作步骤
                </p>
              )}
            </div>
          )}

          {selectedPeriodId && !selectedVersionId && (
            <div className="status-hint">
              <p>{t('simplePayroll:hints.noVersions')}</p>
              {activeTab === 'workflow' && (
                <p style={{ color: '#1890ff', marginTop: '8px' }}>
                  💡 选择工资运行版本后，系统将根据当前状态为您提供智能操作引导
                </p>
              )}
            </div>
          )}

          {/* 工作流引导特殊提示 */}
          {activeTab === 'workflow' && selectedVersionId && currentVersion && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#f0f7ff', 
              borderRadius: '6px', 
              border: '1px solid #91d5ff',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#1890ff', fontSize: '14px' }}>
                🎯 当前状态：<strong>{currentVersion.status_name}</strong> | 
                系统已为您准备好相应的操作步骤，请按照引导完成工资处理流程
              </p>
            </div>
          )}
        </Spin>
      </Content>
    </Layout>
  );
};

export default SimplePayrollPage; 