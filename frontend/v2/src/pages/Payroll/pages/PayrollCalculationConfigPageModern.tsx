import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tabs, 
  message, 
  Spin, 
  Row, 
  Col, 
  Typography,
  Tag,
  Space,
  Button,
} from 'antd';
import { 
  CalculatorOutlined,
  BankOutlined,
  FileTextOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
import ModernCard from '../../../components/common/ModernCard';
import UnifiedTabs from '../../../components/common/UnifiedTabs';
import CalculationRuleSetManager from '../components/CalculationRuleSetManager';
import SocialInsuranceConfigManager from '../components/SocialInsuranceConfigManager';
import TaxConfigManager from '../components/TaxConfigManager';

import { calculationConfigApi } from '../services/calculationConfigApi';
import type { 
  CalculationRuleSet, 
  SocialInsuranceConfig, 
  TaxConfig,
  CreateCalculationRuleSetRequest,
  UpdateCalculationRuleSetRequest,
  CreateSocialInsuranceConfigRequest,
  UpdateSocialInsuranceConfigRequest,
  CreateTaxConfigRequest,
  UpdateTaxConfigRequest
} from '../types/calculationConfig';

const { Title, Text } = Typography;

const PayrollCalculationConfigPageModern: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  
  // 状态管理
  const [ruleSets, setRuleSets] = useState<CalculationRuleSet[]>([]);
  const [socialInsuranceConfigs, setSocialInsuranceConfigs] = useState<SocialInsuranceConfig[]>([]);
  const [taxConfigs, setTaxConfigs] = useState<TaxConfig[]>([]);

  // 加载数据
  const loadRuleSets = async () => {
    try {
      setLoading(true);
      const response = await calculationConfigApi.getRuleSets();
      const data = Array.isArray(response) ? response : (response as any).data || [];
      setRuleSets(data);
    } catch (error) {
      message.error(t('common:error.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const loadSocialInsuranceConfigs = async () => {
    try {
      setLoading(true);
      const response = await calculationConfigApi.getComprehensiveSocialInsuranceConfigs();
      const data = Array.isArray(response) ? response : (response as any).data || [];
      setSocialInsuranceConfigs(data);
    } catch (error) {
      message.error(t('common:error.load_failed'));
      console.error('加载社保配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTaxConfigs = async () => {
    try {
      setLoading(true);
      const response = await calculationConfigApi.getTaxConfigs();
      const data = Array.isArray(response) ? response : (response as any).data || [];
      setTaxConfigs(data);
    } catch (error) {
      message.error(t('common:error.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuleSets();
    loadSocialInsuranceConfigs();
    loadTaxConfigs();
  }, []);

  // 处理规则集操作
  const handleRuleSetCreate = async (data: CreateCalculationRuleSetRequest) => {
    try {
      await calculationConfigApi.createRuleSet(data);
      message.success(t('common:success.create'));
      loadRuleSets();
    } catch (error) {
      message.error(t('common:error.create_failed'));
    }
  };

  const handleRuleSetUpdate = async (id: number, data: UpdateCalculationRuleSetRequest) => {
    try {
      await calculationConfigApi.updateRuleSet(id, data);
      message.success(t('common:success.update'));
      loadRuleSets();
    } catch (error) {
      message.error(t('common:error.update_failed'));
    }
  };

  const handleRuleSetActivate = async (id: number) => {
    try {
      await calculationConfigApi.activateRuleSet(id);
      message.success(t('payroll:calculation_config.rule_set_activated'));
      loadRuleSets();
    } catch (error) {
      message.error(t('common:error.operation_failed'));
    }
  };

  const handleRuleSetDeactivate = async (id: number) => {
    try {
      await calculationConfigApi.deactivateRuleSet(id);
      message.success(t('payroll:calculation_config.rule_set_deactivated'));
      loadRuleSets();
    } catch (error) {
      message.error(t('common:error.operation_failed'));
    }
  };

  // 处理社保配置操作
  const handleSocialInsuranceCreate = async (data: CreateSocialInsuranceConfigRequest) => {
    try {
      await calculationConfigApi.createComprehensiveSocialInsuranceConfig(data);
      message.success(t('common:success.create'));
      loadSocialInsuranceConfigs();
    } catch (error) {
      message.error(t('common:error.create_failed'));
      console.error('创建社保配置失败:', error);
    }
  };

  const handleSocialInsuranceUpdate = async (id: number, data: UpdateSocialInsuranceConfigRequest) => {
    try {
      await calculationConfigApi.updateComprehensiveSocialInsuranceConfig(id, data);
      message.success(t('common:success.update'));
      loadSocialInsuranceConfigs();
    } catch (error) {
      message.error(t('common:error.update_failed'));
      console.error('更新社保配置失败:', error);
    }
  };

  // 处理税务配置操作
  const handleTaxConfigCreate = async (data: CreateTaxConfigRequest) => {
    try {
      await calculationConfigApi.createTaxConfig(data);
      message.success(t('common:success.create'));
      loadTaxConfigs();
    } catch (error) {
      message.error(t('common:error.create_failed'));
    }
  };

  const handleTaxConfigUpdate = async (id: number, data: UpdateTaxConfigRequest) => {
    try {
      await calculationConfigApi.updateTaxConfig(id, data);
      message.success(t('common:success.update'));
      loadTaxConfigs();
    } catch (error) {
      message.error(t('common:error.update_failed'));
    }
  };

  // 统计数据
  const statistics = useMemo(() => {
    const totalRuleSets = ruleSets.length;
    const activeRuleSets = ruleSets.filter((rs: any) => rs.is_active).length;
    const totalSocialConfigs = socialInsuranceConfigs.length;
    const totalTaxConfigs = taxConfigs.length;

    return [
      {
        title: t('payroll:calculation_config.total_rule_sets'),
        value: totalRuleSets,
        icon: <CalculatorOutlined />,
        color: 'var(--color-primary)',
        status: totalRuleSets > 0 ? 'success' : 'default',
      },
      {
        title: t('payroll:calculation_config.active_rule_sets'),
        value: activeRuleSets,
        icon: <CheckCircleOutlined />,
        color: 'var(--color-success)',
        status: activeRuleSets > 0 ? 'success' : 'warning',
      },
      {
        title: t('payroll:calculation_config.social_insurance_configs'),
        value: totalSocialConfigs,
        icon: <BankOutlined />,
        color: 'var(--color-info)',
        status: totalSocialConfigs > 0 ? 'success' : 'default',
      },
      {
        title: t('payroll:calculation_config.tax_configs'),
        value: totalTaxConfigs,
        icon: <FileTextOutlined />,
        color: 'var(--color-warning)',
        status: totalTaxConfigs > 0 ? 'success' : 'default',
      },
    ];
  }, [ruleSets, socialInsuranceConfigs, taxConfigs, t]);

  // 标签页配置
  const tabItems = [
    {
      key: 'rules',
      label: (
        <Space>
          <CalculatorOutlined />
          {t('payroll:calculation_config.rule_sets')}
          <Tag color="blue">{ruleSets.length}</Tag>
        </Space>
      ),
      children: (
        <CalculationRuleSetManager
          ruleSets={ruleSets}
          onCreateRuleSet={handleRuleSetCreate}
          onUpdateRuleSet={handleRuleSetUpdate}
          onActivateRuleSet={handleRuleSetActivate}
          onDeactivateRuleSet={handleRuleSetDeactivate}
        />
      ),
    },
    {
      key: 'social',
      label: (
        <Space>
          <BankOutlined />
          {t('payroll:calculation_config.social_insurance')}
          <Tag color="green">{socialInsuranceConfigs.length}</Tag>
        </Space>
      ),
      children: (
        <SocialInsuranceConfigManager
          configs={socialInsuranceConfigs}
          onCreateConfig={handleSocialInsuranceCreate}
          onUpdateConfig={handleSocialInsuranceUpdate}
        />
      ),
    },
    {
      key: 'tax',
      label: (
        <Space>
          <FileTextOutlined />
          {t('payroll:calculation_config.tax_config')}
          <Tag color="orange">{taxConfigs.length}</Tag>
        </Space>
      ),
      children: (
        <TaxConfigManager
          configs={taxConfigs}
          onCreateConfig={handleTaxConfigCreate}
          onUpdateConfig={handleTaxConfigUpdate}
        />
      ),
    },
  ];

  const handleRefreshAll = () => {
    loadRuleSets();
    loadSocialInsuranceConfigs();
    loadTaxConfigs();
  };

  return (
    <ModernPageTemplate
      title={t('payroll:calculation_config.page_title')}
      headerExtra={
        <Button
          icon={<SettingOutlined />}
          onClick={handleRefreshAll}
          loading={loading}
        >
          {t('common:refresh')}
        </Button>
      }
    >
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statistics.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <ModernCard
              title={stat.title}
              icon={stat.icon}
            >
              <div className="statistic-content">
                <div className="statistic-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="statistic-status">
                  {stat.status === 'success' ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      {t('common:status.normal')}
                    </Tag>
                  ) : stat.status === 'warning' ? (
                    <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                      {t('common:status.needs_attention')}
                    </Tag>
                  ) : (
                    <Tag color="default">
                      {t('common:status.not_configured')}
                    </Tag>
                  )}
                </div>
              </div>
            </ModernCard>
          </Col>
        ))}
      </Row>

      {/* 配置管理标签页 */}
      <ModernCard>
        <Spin spinning={loading}>
          <UnifiedTabs
            items={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            type="card"
          />
        </Spin>
      </ModernCard>
    </ModernPageTemplate>
  );
};

export default PayrollCalculationConfigPageModern;