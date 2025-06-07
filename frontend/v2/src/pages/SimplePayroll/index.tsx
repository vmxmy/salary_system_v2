import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Select, Space, Button, message, Spin, Tag, Tabs } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, AppstoreOutlined, PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import GeneratePayrollCard from './components/GeneratePayrollCard';
// import AuditPayrollCard from './components/AuditPayrollCard';
// import GenerateReportsCard from './components/GenerateReportsCard';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { usePayrollPeriods } from './hooks/usePayrollPeriods';
// import { usePayrollVersions } from './hooks/usePayrollVersions';
// import { useAuditSummary } from './hooks/useAuditSummary';
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
  const [createPeriodModalVisible, setCreatePeriodModalVisible] = useState(false);

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

  // 临时禁用版本和审核功能
  const versions: any[] = [];
  const versionsLoading = false;
  const refetchVersions = () => {};
  const auditSummary = null;
  const refetchAuditSummary = () => {};

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

  // 处理创建新薪资周期
  const handleCreateNewPeriod = () => {
    setCreatePeriodModalVisible(true);
  };

  // 快速创建当月薪资周期
  const handleQuickCreateCurrentMonth = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const monthStr = month.toString().padStart(2, '0');
      
      // 这里应该调用创建薪资周期的API
      // 暂时用message提示
      message.success(`正在创建 ${year}年${monthStr}月 薪资周期...`);
      
      // 刷新期间列表
      handleRefresh();
    } catch (error) {
      message.error('创建薪资周期失败');
    }
  };

  // 期间变化时重置版本选择
  useEffect(() => {
    console.log('🎯 [SimplePayrollPage] 期间变化，重置版本选择:', selectedPeriodId);
    setSelectedVersionId(undefined);
  }, [selectedPeriodId]);

  // 智能版本选择逻辑
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] 智能版本选择检查:', {
      versionsLength: versions.length,
      selectedVersionId,
      versions: versions.map(v => ({ id: v.id, status: v.status_name }))
    });
    
    if (versions.length > 0 && !selectedVersionId) {
      // 智能选择逻辑：优先级排序
      let targetVersion = null;
      
      // 1. 优先选择"已计算"状态的版本（最常用的工作状态）
      targetVersion = versions.find(v => v.status_name === '已计算');
      
      // 2. 如果没有"已计算"，选择"草稿"状态（可以继续编辑）
      if (!targetVersion) {
        targetVersion = versions.find(v => v.status_name === '草稿' || v.status_name === 'DRAFT');
      }
      
      // 3. 如果都没有，选择最新的版本（第一个）
      if (!targetVersion) {
        targetVersion = versions[0];
      }
      
      console.log('✅ [SimplePayrollPage] 智能选择版本:', {
        selectedId: targetVersion.id,
        status: targetVersion.status_name,
        reason: targetVersion.status_name === '已计算' ? '优先选择已计算版本' : 
                targetVersion.status_name === '草稿' ? '选择可编辑的草稿版本' : '选择最新版本'
      });
      
      setSelectedVersionId(targetVersion.id);
    }
  }, [versions.length, selectedVersionId]);

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
                  if (typeof value === 'string' && value === 'CREATE_NEW') {
                    handleCreateNewPeriod();
                    return;
                  }
                  setSelectedPeriodId(value as number);
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
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        style={{ width: '100%', textAlign: 'left' }}
                        onClick={handleCreateNewPeriod}
                      >
                        创建新薪资周期
                      </Button>
                    </div>
                  </>
                )}
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

            {/* 智能版本选择 */}
            {selectedPeriodId && (
              <div className="control-group">
                <label>工资数据:</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Select
                    style={{ width: 280 }}
                    placeholder="选择工资数据版本"
                    value={selectedVersionId}
                    onChange={setSelectedVersionId}
                    loading={versionsLoading}
                    allowClear
                  >
                    {versions.map((version, index) => {
                      // 智能标签生成
                      const getVersionLabel = () => {
                        if (index === 0) return "最新版本";
                        if (version.status_name === "已支付") return "已发放版本";
                        if (version.status_name === "已计算") return "待审核版本";
                        return `历史版本 ${version.version_number}`;
                      };
                      
                      const getVersionDescription = () => {
                        const date = new Date(version.initiated_at).toLocaleDateString();
                        const time = new Date(version.initiated_at).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        return `${date} ${time} · ${version.status_name}`;
                      };

                      return (
                        <Select.Option key={version.id} value={version.id}>
                          <div style={{ maxWidth: '250px' }}>
                            <div style={{ 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              fontWeight: index === 0 ? 'bold' : 'normal'
                            }}>
                              {getVersionLabel()}
                              {index === 0 && <span style={{ color: '#52c41a', marginLeft: '4px' }}>●</span>}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666',
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis'
                            }}>
                              {getVersionDescription()}
                            </div>
                          </div>
                        </Select.Option>
                      );
                    })}
                  </Select>
                  
                  {/* 快捷切换按钮 */}
                  {versions.length > 1 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {/* 切换到最新版本 */}
                      {selectedVersionId !== versions[0]?.id && (
                        <Button
                          size="small"
                          type="link"
                          onClick={() => setSelectedVersionId(versions[0].id)}
                          title="切换到最新版本"
                        >
                          最新
                        </Button>
                      )}
                      
                      {/* 切换到已发放版本 */}
                      {(() => {
                        const paidVersion = versions.find(v => v.status_name === '已支付');
                        return paidVersion && selectedVersionId !== paidVersion.id ? (
                          <Button
                            size="small"
                            type="link"
                            onClick={() => setSelectedVersionId(paidVersion.id)}
                            title="切换到已发放版本"
                          >
                            已发放
                          </Button>
                        ) : null;
                      })()}
                      
                      {/* 切换到待审核版本 */}
                      {(() => {
                        const calculatedVersion = versions.find(v => v.status_name === '已计算');
                        return calculatedVersion && selectedVersionId !== calculatedVersion.id ? (
                          <Button
                            size="small"
                            type="link"
                            onClick={() => setSelectedVersionId(calculatedVersion.id)}
                            title="切换到待审核版本"
                          >
                            待审核
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 智能版本状态指示器 */}
            {currentVersion && (
              <div style={{ 
                marginTop: '16px',
                padding: '12px 16px',
                background: '#fafafa',
                borderRadius: '6px',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px' }}>
                    {(() => {
                      switch (currentVersion.status_name) {
                        case '草稿': return '📝';
                        case '已计算': return '🧮';
                        case '已审核': return '✅';
                        case '已支付': return '💰';
                        default: return '📄';
                      }
                    })()}
                  </span>
                  <div>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: (() => {
                        switch (currentVersion.status_name) {
                          case '草稿': return '#faad14';
                          case '已计算': return '#1890ff';
                          case '已审核': return '#52c41a';
                          case '已支付': return '#722ed1';
                          default: return '#d9d9d9';
                        }
                      })()
                    }}>
                      当前版本：{currentVersion.status_name}
                    </span>
                    <span style={{ marginLeft: '12px', color: '#666', fontSize: '12px' }}>
                      创建于 {new Date(currentVersion.initiated_at).toLocaleString()}
                    </span>
                  </div>
                  {currentVersion.status_name === '已计算' && (
                    <div style={{ 
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      background: '#e6f7ff',
                      color: '#1890ff',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      可以进行审核和发放
                    </div>
                  )}
                  {currentVersion.status_name === '草稿' && (
                    <div style={{ 
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      background: '#fff7e6',
                      color: '#faad14',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      可以编辑和计算
                    </div>
                  )}
                  {currentVersion.status_name === '已支付' && (
                    <div style={{ 
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      background: '#f6ffed',
                      color: '#52c41a',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      已完成发放
                    </div>
                  )}
                </div>
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

            {/* 创建新期间按钮 */}
            {periods.length > 0 && (
              <Button 
                icon={<PlusOutlined />} 
                onClick={handleCreateNewPeriod}
                type="dashed"
              >
                新建期间
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
                        selectedPeriod={currentPeriod || null}
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

                    {/* 审核工资卡片 - 临时禁用 */}
                    {/* <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                      <AuditPayrollCard
                        selectedPeriod={currentPeriod}
                        selectedVersion={currentVersion}
                        onRefresh={handleRefresh}
                      />
                    </Col> */}

                    {/* 一键报表卡片 - 临时禁用 */}
                    {/* <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                      <GenerateReportsCard
                        selectedPeriod={currentPeriod}
                        selectedVersion={currentVersion}
                      />
                    </Col> */}
                  </Row>
                )
              }
            ]}
          />

          {/* 状态提示 */}
          {!selectedPeriodId && (
            <div className="status-hint">
              {periods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <h3 style={{ color: '#666', marginBottom: '8px' }}>还没有薪资周期</h3>
                  <p style={{ color: '#999', marginBottom: '24px' }}>
                    开始使用前，需要先创建一个薪资周期
                  </p>
                  <Space size="middle">
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={handleQuickCreateCurrentMonth}
                      size="large"
                    >
                      创建本月薪资周期
                    </Button>
                    <Button 
                      icon={<CalendarOutlined />}
                      onClick={handleCreateNewPeriod}
                      size="large"
                    >
                      自定义创建
                    </Button>
                  </Space>
                </div>
              ) : (
                <div>
                  <p>{t('simplePayroll:hints.selectPeriod')}</p>
                  {activeTab === 'workflow' && (
                    <p style={{ color: '#1890ff', marginTop: '8px' }}>
                      💡 选择工资期间后，智能流程引导将为您显示具体的操作步骤
                    </p>
                  )}
                </div>
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