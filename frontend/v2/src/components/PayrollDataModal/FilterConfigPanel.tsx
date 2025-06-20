import React from 'react';
import { Card, Collapse, Switch, Select, InputNumber, Button, Space } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnFilterConfig } from '../../hooks/usePayrollDataProcessing';

const { Panel } = Collapse;
const { Option } = Select;

// 默认筛选配置
const defaultFilterConfig: ColumnFilterConfig = {
  hideJsonbColumns: true,
  hideZeroColumns: true,
  hideEmptyColumns: true,
  includePatterns: [],
  excludePatterns: ['*id', '*时间', '*日期'],
  minValueThreshold: 0,
  maxValueThreshold: Infinity,
  showOnlyNumericColumns: false,
};

interface FilterConfigPanelProps {
  visible: boolean;
  filterConfig: ColumnFilterConfig;
  onFilterConfigChange: (config: ColumnFilterConfig) => void;
}

export const FilterConfigPanel: React.FC<FilterConfigPanelProps> = ({
  visible,
  filterConfig,
  onFilterConfigChange
}) => {
  const { t } = useTranslation(['payroll', 'common']);

  // 更新筛选配置
  const updateFilterConfig = (updates: Partial<ColumnFilterConfig>) => {
    onFilterConfigChange({ ...filterConfig, ...updates });
  };

  // 自定义标签渲染函数 - 包含模式
  const renderIncludeTag = (props: any) => {
    const { label, closable, onClose } = props;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          margin: '2px',
          backgroundColor: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: '4px',
          fontSize: '12px',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={String(label)}
      >
        {label}
        {closable && (
          <span
            style={{ marginLeft: '4px', cursor: 'pointer' }}
            onClick={onClose}
          >
            ×
          </span>
        )}
      </span>
    );
  };

  // 自定义标签渲染函数 - 排除模式
  const renderExcludeTag = (props: any) => {
    const { label, closable, onClose } = props;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          margin: '2px',
          backgroundColor: '#fff2e8',
          border: '1px solid #ffbb96',
          borderRadius: '4px',
          fontSize: '12px',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={String(label)}
      >
        {label}
        {closable && (
          <span
            style={{ marginLeft: '4px', cursor: 'pointer' }}
            onClick={onClose}
          >
            ×
          </span>
        )}
      </span>
    );
  };

  // 快速预设配置
  const applyPreset = (presetType: string) => {
    switch (presetType) {
      case 'salary':
        updateFilterConfig({
          ...defaultFilterConfig,
          includePatterns: ['*工资*', '*合计', '*金额'],
          excludePatterns: ['*id', '*时间', '*日期', '*编号']
        });
        break;
      case 'insurance':
        updateFilterConfig({
          ...defaultFilterConfig,
          includePatterns: ['*保险*', '*公积金*'],
          excludePatterns: ['*id', '*时间', '*日期']
        });
        break;
      case 'amounts':
        updateFilterConfig({
          ...defaultFilterConfig,
          showOnlyNumericColumns: true,
          excludePatterns: ['*id', '*比例', '*费率']
        });
        break;
      case 'reset':
        updateFilterConfig(defaultFilterConfig);
        break;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          <span>列筛选配置</span>
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Collapse size="small">
        <Panel header="基础筛选" key="basic">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              <Switch
                checked={filterConfig.hideJsonbColumns}
                onChange={(checked) => updateFilterConfig({ hideJsonbColumns: checked })}
              />
              <span>隐藏 JSONB 列（原始数据列）</span>
            </Space>
            <Space wrap>
              <Switch
                checked={filterConfig.hideZeroColumns}
                onChange={(checked) => updateFilterConfig({ hideZeroColumns: checked })}
              />
              <span>隐藏全零列</span>
            </Space>
            <Space wrap>
              <Switch
                checked={filterConfig.hideEmptyColumns}
                onChange={(checked) => updateFilterConfig({ hideEmptyColumns: checked })}
              />
              <span>隐藏空列</span>
            </Space>
            <Space wrap>
              <Switch
                checked={filterConfig.showOnlyNumericColumns}
                onChange={(checked) => updateFilterConfig({ showOnlyNumericColumns: checked })}
              />
              <span>只显示数值列</span>
            </Space>
          </Space>
        </Panel>
        
        <Panel header="模式匹配" key="patterns">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <label>包含模式（支持通配符 * 和 ?）：</label>
              <Select
                mode="tags"
                style={{ 
                  width: '100%',
                  minHeight: '32px'
                }}
                placeholder="例如：*工资*、保险*、*金额"
                value={filterConfig.includePatterns}
                onChange={(patterns) => updateFilterConfig({ includePatterns: patterns })}
                maxTagCount="responsive"
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}项...`}
                allowClear
                showSearch
                filterOption={false}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                tagRender={renderIncludeTag}
              >
                <Option value="*工资*">*工资*</Option>
                <Option value="*保险*">*保险*</Option>
                <Option value="*金额">*金额</Option>
                <Option value="*合计">*合计</Option>
                <Option value="基本*">基本*</Option>
                <Option value="*津贴*">*津贴*</Option>
                <Option value="*补贴*">*补贴*</Option>
                <Option value="*奖金*">*奖金*</Option>
              </Select>
            </div>
            <div>
              <label>排除模式（支持通配符 * 和 ?）：</label>
              <Select
                mode="tags"
                style={{ 
                  width: '100%',
                  minHeight: '32px'
                }}
                placeholder="例如：*id、*时间、*日期"
                value={filterConfig.excludePatterns}
                onChange={(patterns) => updateFilterConfig({ excludePatterns: patterns })}
                maxTagCount="responsive"
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}项...`}
                allowClear
                showSearch
                filterOption={false}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                tagRender={renderExcludeTag}
              >
                <Option value="*id">*id</Option>
                <Option value="*时间">*时间</Option>
                <Option value="*日期">*日期</Option>
                <Option value="*编号">*编号</Option>
              </Select>
            </div>
          </Space>
        </Panel>
        
        <Panel header="数值范围" key="values">
          <Space wrap>
            <span>最小值阈值：</span>
            <InputNumber
              value={filterConfig.minValueThreshold}
              onChange={(value) => updateFilterConfig({ minValueThreshold: value || 0 })}
              placeholder="0"
            />
            <span>最大值阈值：</span>
            <InputNumber
              value={filterConfig.maxValueThreshold === Infinity ? undefined : filterConfig.maxValueThreshold}
              onChange={(value) => updateFilterConfig({ maxValueThreshold: value || Infinity })}
              placeholder="无限制"
            />
          </Space>
        </Panel>
        
        <Panel header="快速预设" key="presets">
          <Space wrap>
            <Button 
              size="small" 
              onClick={() => applyPreset('salary')}
            >
              工资相关
            </Button>
            <Button 
              size="small" 
              onClick={() => applyPreset('insurance')}
            >
              保险公积金
            </Button>
            <Button 
              size="small" 
              onClick={() => applyPreset('amounts')}
            >
              只看金额
            </Button>
            <Button 
              size="small" 
              onClick={() => applyPreset('reset')}
            >
              重置默认
            </Button>
          </Space>
        </Panel>
      </Collapse>
    </Card>
  );
};