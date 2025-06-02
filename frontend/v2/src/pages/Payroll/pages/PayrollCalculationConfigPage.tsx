import React, { useState, useEffect } from 'react';
import { Card, Tabs, message, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
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

const { TabPane } = Tabs;

const PayrollCalculationConfigPage: React.FC = () => {
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
      setRuleSets(response.data);
    } catch (error) {
      message.error(t('common:error.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const loadSocialInsuranceConfigs = async () => {
    try {
      setLoading(true);
      const response = await calculationConfigApi.getSocialInsuranceConfigs();
      setSocialInsuranceConfigs(response.data);
    } catch (error) {
      message.error(t('common:error.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const loadTaxConfigs = async () => {
    try {
      setLoading(true);
      const response = await calculationConfigApi.getTaxConfigs();
      setTaxConfigs(response.data);
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
      await calculationConfigApi.createSocialInsuranceConfig(data);
      message.success(t('common:success.create'));
      loadSocialInsuranceConfigs();
    } catch (error) {
      message.error(t('common:error.create_failed'));
    }
  };

  const handleSocialInsuranceUpdate = async (id: number, data: UpdateSocialInsuranceConfigRequest) => {
    try {
      await calculationConfigApi.updateSocialInsuranceConfig(id, data);
      message.success(t('common:success.update'));
      loadSocialInsuranceConfigs();
    } catch (error) {
      message.error(t('common:error.update_failed'));
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

  return (
    <div className="payroll-calculation-config-page">
      <Card title={t('payroll:calculation_config.page_title')}>
        <Spin spinning={loading}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane 
              tab={t('payroll:calculation_config.rule_sets')} 
              key="rules"
            >
              <CalculationRuleSetManager
                ruleSets={ruleSets}
                onCreateRuleSet={handleRuleSetCreate}
                onUpdateRuleSet={handleRuleSetUpdate}
                onActivateRuleSet={handleRuleSetActivate}
                onDeactivateRuleSet={handleRuleSetDeactivate}
              />
            </TabPane>
            
            <TabPane 
              tab={t('payroll:calculation_config.social_insurance')} 
              key="social"
            >
              <SocialInsuranceConfigManager
                configs={socialInsuranceConfigs}
                onCreateConfig={handleSocialInsuranceCreate}
                onUpdateConfig={handleSocialInsuranceUpdate}
              />
            </TabPane>
            
            <TabPane 
              tab={t('payroll:calculation_config.tax_config')} 
              key="tax"
            >
              <TaxConfigManager
                configs={taxConfigs}
                onCreateConfig={handleTaxConfigCreate}
                onUpdateConfig={handleTaxConfigUpdate}
              />
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
    </div>
  );
};

export default PayrollCalculationConfigPage; 