import React, { useState } from 'react';
import { 
  Card, 
  Slider, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Button, 
  Switch,
  Tooltip,
  Divider,
  InputNumber,
  Alert
} from 'antd';
import { 
  SettingOutlined, 
  ReloadOutlined, 
  InfoCircleOutlined,
  ExperimentOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

// 智能映射配置接口
export interface SmartMappingConfig {
  // 算法权重配置
  weights: {
    levenshtein: number;      // Levenshtein权重 (0-1)
    jaroWinkler: number;      // Jaro-Winkler权重 (0-1)
    contains: number;         // 包含关系权重 (0-1)
    rules: number;            // 规则匹配权重 (0-1)
  };
  
  // 置信度阈值配置
  thresholds: {
    highConfidence: number;   // 高置信度阈值 (0-1)
    mediumConfidence: number; // 中等置信度阈值 (0-1)
    minimumRecommend: number; // 最低推荐阈值 (0-1)
    autoApply: number;        // 自动应用阈值 (0-1)
  };
  
  // 高级配置
  advanced: {
    caseSensitive: boolean;         // 大小写敏感
    enablePrefixBonus: boolean;     // 启用前缀奖励
    prefixBonusWeight: number;      // 前缀奖励权重
    enableRuleBoost: boolean;       // 启用规则提升
    ruleBoostAmount: number;        // 规则提升数值
    maxRecommendations: number;     // 最大推荐数量
  };
}

// 默认配置
const DEFAULT_CONFIG: SmartMappingConfig = {
  weights: {
    levenshtein: 0.3,
    jaroWinkler: 0.3,
    contains: 0.4,
    rules: 0.0  // 规则匹配不参与权重计算，而是作为加分项
  },
  thresholds: {
    highConfidence: 0.7,
    mediumConfidence: 0.4,
    minimumRecommend: 0.3,
    autoApply: 0.8
  },
  advanced: {
    caseSensitive: false,
    enablePrefixBonus: true,
    prefixBonusWeight: 0.1,
    enableRuleBoost: true,
    ruleBoostAmount: 0.2,
    maxRecommendations: 5
  }
};

// 预设配置方案
const PRESET_CONFIGS = {
  balanced: {
    name: '均衡模式',
    description: '平衡各种算法，适合大多数场景',
    config: DEFAULT_CONFIG
  },
  strict: {
    name: '严格模式', 
    description: '提高匹配标准，减少误匹配',
    config: {
      ...DEFAULT_CONFIG,
      weights: { levenshtein: 0.4, jaroWinkler: 0.4, contains: 0.2, rules: 0.0 },
      thresholds: { highConfidence: 0.8, mediumConfidence: 0.6, minimumRecommend: 0.4, autoApply: 0.85 }
    }
  },
  loose: {
    name: '宽松模式',
    description: '降低匹配标准，增加推荐数量',
    config: {
      ...DEFAULT_CONFIG,
      weights: { levenshtein: 0.2, jaroWinkler: 0.2, contains: 0.6, rules: 0.0 },
      thresholds: { highConfidence: 0.6, mediumConfidence: 0.3, minimumRecommend: 0.2, autoApply: 0.7 }
    }
  },
  chinese: {
    name: '中文优化',
    description: '针对中文字段优化，重视包含关系',
    config: {
      ...DEFAULT_CONFIG,
      weights: { levenshtein: 0.2, jaroWinkler: 0.2, contains: 0.6, rules: 0.0 },
      advanced: { 
        ...DEFAULT_CONFIG.advanced, 
        enableRuleBoost: true, 
        ruleBoostAmount: 0.3,
        enablePrefixBonus: true,
        prefixBonusWeight: 0.15
      }
    }
  }
};

interface SmartMappingConfigProps {
  config: SmartMappingConfig;
  onConfigChange: (config: SmartMappingConfig) => void;
  onApplyConfig: () => void;
  visible: boolean;
  onClose: () => void;
}

const SmartMappingConfigPanel: React.FC<SmartMappingConfigProps> = ({
  config,
  onConfigChange,
  onApplyConfig,
  visible,
  onClose
}) => {
  const [localConfig, setLocalConfig] = useState<SmartMappingConfig>(config);

  // 应用预设配置
  const applyPreset = (presetKey: keyof typeof PRESET_CONFIGS) => {
    const preset = PRESET_CONFIGS[presetKey];
    setLocalConfig(preset.config);
    onConfigChange(preset.config);
  };

  // 重置为默认配置
  const resetToDefault = () => {
    setLocalConfig(DEFAULT_CONFIG);
    onConfigChange(DEFAULT_CONFIG);
  };

  // 更新配置
  const updateConfig = (path: string, value: any) => {
    const newConfig = { ...localConfig };
    const keys = path.split('.');
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  // 验证权重总和
  const validateWeights = () => {
    const { levenshtein, jaroWinkler, contains } = localConfig.weights;
    const sum = levenshtein + jaroWinkler + contains;
    return Math.abs(sum - 1.0) < 0.01; // 允许小误差
  };

  if (!visible) return null;

  return (
    <Card 
      title={
        <Space>
          <SettingOutlined />
          <span>智能映射参数配置</span>
          <Tooltip title="调整算法参数以优化匹配效果">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      }
      extra={
        <Space>
          <Button size="small" onClick={resetToDefault} icon={<ReloadOutlined />}>
            重置默认
          </Button>
          <Button size="small" onClick={onClose}>
            关闭
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {/* 预设配置 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>
          <ExperimentOutlined /> 预设方案
        </Title>
        <Row gutter={8}>
          {Object.entries(PRESET_CONFIGS).map(([key, preset]) => (
            <Col span={6} key={key}>
              <Card 
                size="small" 
                hoverable
                onClick={() => applyPreset(key as keyof typeof PRESET_CONFIGS)}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                <div style={{ fontWeight: 'bold' }}>{preset.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  {preset.description}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      {/* 算法权重配置 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>🎯 算法权重配置</Title>
        {!validateWeights() && (
          <Alert 
            message="权重总和应该等于1.0" 
            type="warning" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Levenshtein距离算法: {localConfig.weights.levenshtein.toFixed(2)}</Text>
                <Tooltip title="计算编辑距离，适合检测拼写错误">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                </Tooltip>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={localConfig.weights.levenshtein}
                onChange={(value) => updateConfig('weights.levenshtein', value)}
              />
              
              <div>
                <Text strong>Jaro-Winkler相似度: {localConfig.weights.jaroWinkler.toFixed(2)}</Text>
                <Tooltip title="针对短字符串优化，重视前缀匹配">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                </Tooltip>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={localConfig.weights.jaroWinkler}
                onChange={(value) => updateConfig('weights.jaroWinkler', value)}
              />
            </Space>
          </Col>
          
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>包含关系检查: {localConfig.weights.contains.toFixed(2)}</Text>
                <Tooltip title="检测字符串包含关系，适合业务字段">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                </Tooltip>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={localConfig.weights.contains}
                onChange={(value) => updateConfig('weights.contains', value)}
              />
              
              <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
                <Text>总权重: {(localConfig.weights.levenshtein + localConfig.weights.jaroWinkler + localConfig.weights.contains).toFixed(2)}</Text>
                {validateWeights() ? 
                  <Text style={{ color: '#52c41a', marginLeft: 8 }}>✓ 权重平衡</Text> :
                  <Text style={{ color: '#ff4d4f', marginLeft: 8 }}>⚠ 需要调整</Text>
                }
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* 置信度阈值配置 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>📊 置信度阈值配置</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>高置信度阈值: {(localConfig.thresholds.highConfidence * 100).toFixed(0)}%</Text>
              </div>
              <Slider
                min={0.5}
                max={1.0}
                step={0.05}
                value={localConfig.thresholds.highConfidence}
                onChange={(value) => updateConfig('thresholds.highConfidence', value)}
                marks={{ 0.5: '50%', 0.7: '70%', 0.9: '90%', 1.0: '100%' }}
              />
              
              <div>
                <Text strong>中等置信度阈值: {(localConfig.thresholds.mediumConfidence * 100).toFixed(0)}%</Text>
              </div>
              <Slider
                min={0.2}
                max={0.8}
                step={0.05}
                value={localConfig.thresholds.mediumConfidence}
                onChange={(value) => updateConfig('thresholds.mediumConfidence', value)}
                marks={{ 0.2: '20%', 0.4: '40%', 0.6: '60%', 0.8: '80%' }}
              />
            </Space>
          </Col>
          
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>最低推荐阈值: {(localConfig.thresholds.minimumRecommend * 100).toFixed(0)}%</Text>
              </div>
              <Slider
                min={0.1}
                max={0.6}
                step={0.05}
                value={localConfig.thresholds.minimumRecommend}
                onChange={(value) => updateConfig('thresholds.minimumRecommend', value)}
                marks={{ 0.1: '10%', 0.3: '30%', 0.5: '50%', 0.6: '60%' }}
              />
              
              <div>
                <Text strong>自动应用阈值: {(localConfig.thresholds.autoApply * 100).toFixed(0)}%</Text>
              </div>
              <Slider
                min={0.6}
                max={1.0}
                step={0.05}
                value={localConfig.thresholds.autoApply}
                onChange={(value) => updateConfig('thresholds.autoApply', value)}
                marks={{ 0.6: '60%', 0.8: '80%', 0.9: '90%', 1.0: '100%' }}
              />
            </Space>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* 高级配置 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>⚙️ 高级配置</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>启用规则提升</Text>
                <Switch
                  checked={localConfig.advanced.enableRuleBoost}
                  onChange={(checked) => updateConfig('advanced.enableRuleBoost', checked)}
                />
              </div>
              
              {localConfig.advanced.enableRuleBoost && (
                <div>
                  <Text>规则提升数值: +{(localConfig.advanced.ruleBoostAmount * 100).toFixed(0)}%</Text>
                  <Slider
                    min={0.1}
                    max={0.5}
                    step={0.05}
                    value={localConfig.advanced.ruleBoostAmount}
                    onChange={(value) => updateConfig('advanced.ruleBoostAmount', value)}
                  />
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>启用前缀奖励</Text>
                <Switch
                  checked={localConfig.advanced.enablePrefixBonus}
                  onChange={(checked) => updateConfig('advanced.enablePrefixBonus', checked)}
                />
              </div>
              
              {localConfig.advanced.enablePrefixBonus && (
                <div>
                  <Text>前缀奖励权重: {localConfig.advanced.prefixBonusWeight.toFixed(2)}</Text>
                  <Slider
                    min={0.05}
                    max={0.3}
                    step={0.01}
                    value={localConfig.advanced.prefixBonusWeight}
                    onChange={(value) => updateConfig('advanced.prefixBonusWeight', value)}
                  />
                </div>
              )}
            </Space>
          </Col>
          
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>大小写敏感</Text>
                <Switch
                  checked={localConfig.advanced.caseSensitive}
                  onChange={(checked) => updateConfig('advanced.caseSensitive', checked)}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>最大推荐数量</Text>
                <InputNumber
                  min={1}
                  max={10}
                  value={localConfig.advanced.maxRecommendations}
                  onChange={(value) => updateConfig('advanced.maxRecommendations', value || 5)}
                  style={{ width: 80 }}
                />
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 应用按钮 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button 
          type="primary" 
          size="large"
          onClick={onApplyConfig}
          icon={<ExperimentOutlined />}
        >
          应用配置并重新运行智能映射
        </Button>
      </div>
    </Card>
  );
};

export default SmartMappingConfigPanel;
export { DEFAULT_CONFIG, PRESET_CONFIGS };
export type { SmartMappingConfig }; 