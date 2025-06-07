import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Select, Space, Button, message, Spin, Tag, Tabs, DatePicker, Card, Tooltip } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, AppstoreOutlined, PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import GeneratePayrollCard from './components/GeneratePayrollCard';
// import AuditPayrollCard from './components/AuditPayrollCard';
// import GenerateReportsCard from './components/GenerateReportsCard';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { usePayrollPeriods } from './hooks/usePayrollPeriods';
import { usePayrollVersions } from './hooks/usePayrollVersions';
// import { useAuditSummary } from './hooks/useAuditSummary';
import { simplePayrollApi } from './services/simplePayrollApi';
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

  // 版本数据获取
  const {
    versions,
    loading: versionsLoading,
    refetch: refetchVersions
  } = usePayrollVersions(selectedPeriodId);

  // 监控periods数据变化
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] periods数据更新:', {
      count: periods.length,
      loading: periodsLoading,
      firstPeriod: periods[0],
      allPeriods: periods.map(p => ({ id: p.id, name: p.name }))
    });
  }, [periods, periodsLoading]);

  // 监控versions数据变化
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] versions数据更新:', {
      count: versions.length,
      loading: versionsLoading,
      selectedPeriodId,
      firstVersion: versions[0],
      allVersions: versions.map(v => ({ id: v.id, status: v.status_name, version: v.version_number }))
    });
  }, [versions, versionsLoading, selectedPeriodId]);

  // 临时禁用审核功能
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

  // 期间变化时重置版本选择并触发刷新
  useEffect(() => {
    console.log('🎯 [SimplePayrollPage] 期间变化，重置版本选择:', selectedPeriodId);
    setSelectedVersionId(undefined);
    
    // 如果有选中的期间，立即触发版本数据刷新
    if (selectedPeriodId) {
      console.log('🔄 [SimplePayrollPage] 期间切换，触发版本数据刷新');
      // usePayrollVersions hook 会自动根据 selectedPeriodId 的变化重新获取数据
    }
  }, [selectedPeriodId]);

  // 智能版本选择逻辑 - 当版本数据加载完成后自动选择
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] 智能版本选择检查:', {
      versionsLength: versions.length,
      versionsLoading,
      selectedVersionId,
      selectedPeriodId,
      versions: versions.map(v => ({ id: v.id, status: v.status_name, version: v.version_number }))
    });
    
    // 只有在版本数据加载完成、有版本数据、且当前没有选中版本时才进行自动选择
    if (!versionsLoading && versions.length > 0 && !selectedVersionId && selectedPeriodId) {
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
        version: targetVersion.version_number,
        reason: targetVersion.status_name === '已计算' ? '优先选择已计算版本' : 
                targetVersion.status_name === '草稿' ? '选择可编辑的草稿版本' : '选择最新版本'
      });
      
      setSelectedVersionId(targetVersion.id);
    }
  }, [versions, versionsLoading, selectedVersionId, selectedPeriodId]);

  return (
    <Layout className="simple-payroll-layout">
      {/* 标题区 */}
      <div className="title-area">
        <div className="title-content">
          <h2>{t('simplePayroll:title')}</h2>
          <p>{t('simplePayroll:subtitle')}</p>

        </div>
      </div>

      {/* 控件区 */}
      <div className="controls-area">
        <div className="controls-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 工资期间选择 - 月份选择器 */}
                          <div className="control-group">
                <label>工资期间:</label>
                <div className="month-picker-container">
                <DatePicker
                  picker="month"
                  style={{ width: 200 }}
                  placeholder="选择工资期间"
                  value={(() => {
                    if (!selectedPeriodId) {
                      console.log('🔍 [MonthPicker] 没有选中的期间ID');
                      return null;
                    }
                    
                    const period = periods.find(p => p.id === selectedPeriodId);
                    if (!period) {
                      console.log('🔍 [MonthPicker] 未找到对应的期间:', selectedPeriodId);
                      return null;
                    }
                    
                    console.log('🔍 [MonthPicker] 当前选中期间:', {
                      id: period.id,
                      name: period.name,
                      start_date: period.start_date
                    });
                    
                    // 尝试从期间名称解析日期
                    const match = period.name.match(/(\d{4})年(\d{1,2})月/);
                    if (match) {
                      const dateValue = dayjs(`${match[1]}-${match[2].padStart(2, '0')}-01`);
                      console.log('✅ [MonthPicker] 从名称解析日期:', dateValue.format('YYYY-MM'));
                      return dateValue;
                    }
                    
                    // 如果名称解析失败，尝试从start_date解析
                    if (period.start_date) {
                      const dateValue = dayjs(period.start_date);
                      console.log('✅ [MonthPicker] 从start_date解析日期:', dateValue.format('YYYY-MM'));
                      return dateValue;
                    }
                    
                    console.log('❌ [MonthPicker] 无法解析期间日期');
                    return null;
                  })()}
                  onChange={async (date) => {
                    if (!date) {
                      setSelectedPeriodId(undefined);
                      return;
                    }
                    
                    const year = date.year();
                    const month = date.month() + 1; // dayjs月份从0开始
                    const targetName = `${year}年${month.toString().padStart(2, '0')}月`;
                    
                    console.log('🎯 [SimplePayrollPage] 月份选择变化:', { year, month, targetName });
                    
                    // 首先在本地查找匹配的期间
                    let matchedPeriod = periods.find(p => p.name.includes(targetName));
                    
                    if (matchedPeriod) {
                      console.log('✅ [SimplePayrollPage] 找到本地匹配期间:', matchedPeriod);
                      setSelectedPeriodId(matchedPeriod.id);
                    } else {
                      // 如果本地没有找到，调用API查找该年月的期间
                      try {
                        console.log('🔍 [SimplePayrollPage] 本地未找到，调用API查找:', { year, month });
                        
                        const response = await simplePayrollApi.getPayrollPeriods({
                          year,
                          month,
                          page: 1,
                          size: 10
                        });
                        
                        console.log('📡 [SimplePayrollPage] API查找结果:', response);
                        
                        if (response.data && response.data.length > 0) {
                          // 找到了匹配的期间
                          const foundPeriod = response.data[0];
                          console.log('✅ [SimplePayrollPage] API找到匹配期间:', foundPeriod);
                          
                          // 更新本地期间列表
                          const updatedPeriods = [...periods];
                          const existingIndex = updatedPeriods.findIndex(p => p.id === foundPeriod.id);
                          if (existingIndex === -1) {
                            updatedPeriods.unshift(foundPeriod); // 添加到开头
                          }
                          
                          setSelectedPeriodId(foundPeriod.id);
                          // 触发期间列表刷新
                          refetchPeriods();
                          
                          message.success(`找到 ${targetName} 的工资期间`);
                        } else {
                          // API也没有找到，提示用户创建
                          console.log('❌ [SimplePayrollPage] API也未找到期间，提示创建');
                          message.info(`未找到 ${targetName} 的工资期间，请先创建`);
                          setSelectedPeriodId(undefined);
                        }
                      } catch (error: any) {
                        console.error('❌ [SimplePayrollPage] API查找期间失败:', error);
                        message.error('查找工资期间失败');
                        setSelectedPeriodId(undefined);
                      }
                    }
                  }}
                  format="YYYY年MM月"
                  disabled={periodsLoading}
                  cellRender={(current, info) => {
                    if (info.type !== 'month') return info.originNode;
                    
                    // 确保 current 是 Dayjs 对象
                    const currentDate = dayjs(current);
                    
                    // 检查当前月份是否有工资记录
                    const year = currentDate.year();
                    const month = currentDate.month() + 1;
                    const hasRecord = periods.some(period => {
                      // 从期间名称匹配
                      const nameMatch = period.name.match(/(\d{4})年(\d{1,2})月/);
                      if (nameMatch) {
                        return parseInt(nameMatch[1]) === year && parseInt(nameMatch[2]) === month;
                      }
                      // 从start_date匹配
                      if (period.start_date) {
                        const periodDate = dayjs(period.start_date);
                        return periodDate.year() === year && periodDate.month() + 1 === month;
                      }
                      return false;
                    });
                    
                                        // 获取该月份的工资期间信息
                    const monthPeriods = periods.filter(period => {
                      const nameMatch = period.name.match(/(\d{4})年(\d{1,2})月/);
                      if (nameMatch) {
                        return parseInt(nameMatch[1]) === year && parseInt(nameMatch[2]) === month;
                      }
                      if (period.start_date) {
                        const periodDate = dayjs(period.start_date);
                        return periodDate.year() === year && periodDate.month() + 1 === month;
                      }
                      return false;
                    });
                    
                    // 根据期间状态确定CSS类名
                    const getStatusClass = () => {
                      if (!hasRecord) return '';
                      
                      // 检查是否有已支付的期间
                      const hasPaidPeriod = monthPeriods.some(p => p.status_name === '已支付');
                      if (hasPaidPeriod) return 'has-paid-record';
                      
                      // 检查是否有已计算的期间
                      const hasCalculatedPeriod = monthPeriods.some(p => p.status_name === '已计算');
                      if (hasCalculatedPeriod) return 'has-calculated-record';
                      
                      // 默认草稿状态
                      return 'has-draft-record';
                    };
                    
                    const tooltipTitle = hasRecord ? 
                      `${year}年${month.toString().padStart(2, '0')}月 (${monthPeriods.length}个工资期间)` : 
                      `${year}年${month.toString().padStart(2, '0')}月 (无工资记录)`;

                    return (
                      <Tooltip title={tooltipTitle} placement="top">
                        <div 
                          className={`ant-picker-cell-inner ${hasRecord ? `has-payroll-record ${getStatusClass()}` : ''}`}
                        >
                          {info.originNode}
                          {hasRecord && (
                            <div className="payroll-record-indicator" />
                          )}
                        </div>
                      </Tooltip>
                    );
                  }}
                />


              </div>
            </div>

            {/* 工资数据选择 - 卡片选择器 */}
            {selectedPeriodId && (
              <div className="control-group" style={{ width: '100%' }}>
                <label>工资数据:</label>
                <div style={{ marginTop: '8px' }}>
                  {versionsLoading ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '20px',
                      color: '#1890ff'
                    }}>
                      <Spin size="small" style={{ marginRight: '8px' }} />
                      正在加载版本数据...
                    </div>
                  ) : versions.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center',
                      padding: '20px',
                      color: '#999',
                      border: '1px dashed #d9d9d9',
                      borderRadius: '6px'
                    }}>
                      暂无工资数据版本
                    </div>
                  ) : (
                                         <div className="payroll-version-cards">
                       <div className="version-grid" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {versions.map((version, index) => {
                        const isSelected = selectedVersionId === version.id;
                        const isLatest = index === 0;
                        
                        // 智能标签生成
                        const getVersionLabel = () => {
                          if (isLatest) return "最新版本";
                          if (version.status_name === "已支付") return "已发放版本";
                          if (version.status_name === "已计算") return "待审核版本";
                          return `历史版本 ${version.version_number}`;
                        };
                        
                        const getStatusColor = () => {
                          switch (version.status_name) {
                            case '草稿': return '#faad14';
                            case '已计算': return '#1890ff';
                            case '已审核': return '#52c41a';
                            case '已支付': return '#722ed1';
                            default: return '#d9d9d9';
                          }
                        };
                        
                        const getStatusIcon = () => {
                          switch (version.status_name) {
                            case '草稿': return '📝';
                            case '已计算': return '🧮';
                            case '已审核': return '✅';
                            case '已支付': return '💰';
                            default: return '📄';
                          }
                        };

                        return (
                          <Card
                            key={version.id}
                            size="small"
                            hoverable
                            onClick={() => {
                              console.log('🔄 [SimplePayrollPage] 卡片选择版本:', version.id);
                              setSelectedVersionId(version.id);
                            }}
                            style={{
                              cursor: 'pointer',
                              border: isSelected ? `2px solid ${getStatusColor()}` : '1px solid #f0f0f0',
                              backgroundColor: isSelected ? '#f6ffed' : '#fff',
                              transition: 'all 0.3s ease'
                            }}
                            bodyStyle={{ padding: '12px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>
                                {getStatusIcon()}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontWeight: isLatest ? 'bold' : 'normal',
                                  color: isSelected ? getStatusColor() : '#333',
                                  marginBottom: '4px'
                                }}>
                                  {getVersionLabel()}
                                  {isLatest && <span style={{ color: '#52c41a', marginLeft: '4px' }}>●</span>}
                                  {isSelected && <span style={{ color: getStatusColor(), marginLeft: '4px' }}>✓</span>}
                                </div>
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#666',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <span>
                                    {new Date(version.initiated_at).toLocaleDateString()} {new Date(version.initiated_at).toLocaleTimeString('zh-CN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <Tag 
                                    color={getStatusColor()} 
                                    style={{ margin: 0, fontSize: '10px' }}
                                  >
                                    {version.status_name}
                                  </Tag>
                                </div>
                              </div>
                            </div>
                          </Card>
                                                 );
                       })}
                       </div>
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
          </div>
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
                        selectedVersion={currentVersion || null}
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