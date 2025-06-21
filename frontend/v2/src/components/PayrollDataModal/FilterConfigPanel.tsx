import React, { useRef, useEffect } from 'react';
import { Card, Collapse, Switch, Select, InputNumber, Button, Space, Tooltip, Popover, message } from 'antd';
import { FilterOutlined, CloseOutlined, PushpinOutlined, PushpinFilled, QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnFilterConfig } from '../../hooks/usePayrollDataProcessing';
import { matchesPattern } from '../../utils/payrollDataUtils';

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
  onClose: () => void;
  filterConfig: ColumnFilterConfig;
  onFilterConfigChange: (config: ColumnFilterConfig) => void;
  dataSource: any[];
}

export const FilterConfigPanel: React.FC<FilterConfigPanelProps> = ({
  visible,
  onClose,
  filterConfig,
  onFilterConfigChange,
  dataSource
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = React.useState(false);
  const [isCollapsing, setIsCollapsing] = React.useState(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 动态获取所有列名
  const availableColumns = React.useMemo(() => {
    if (!dataSource || dataSource.length === 0) {
      return [];
    }
    
    // 从数据源中提取所有唯一的列名
    const allColumns = new Set<string>();
    dataSource.forEach(item => {
      Object.keys(item).forEach(key => {
        // 过滤掉一些不需要的字段
        if (key !== 'id' && key !== 'key' && !key.startsWith('_')) {
          allColumns.add(key);
        }
      });
    });
    
    return Array.from(allColumns).sort();
  }, [dataSource]);

  // 按类别分组列名
  const groupedColumns = React.useMemo(() => {
    const groups = {
      basic: [] as string[],
      salary: [] as string[],
      insurance: [] as string[],
      deduction: [] as string[],
      others: [] as string[]
    };

    availableColumns.forEach(column => {
      const lowerColumn = column.toLowerCase();
      if (lowerColumn.includes('姓名') || lowerColumn.includes('编号') || lowerColumn.includes('部门') || lowerColumn.includes('职位')) {
        groups.basic.push(column);
      } else if (lowerColumn.includes('工资') || lowerColumn.includes('薪') || lowerColumn.includes('津贴') || lowerColumn.includes('补贴') || lowerColumn.includes('奖金')) {
        groups.salary.push(column);
      } else if (lowerColumn.includes('保险') || lowerColumn.includes('公积金') || lowerColumn.includes('社保')) {
        groups.insurance.push(column);
      } else if (lowerColumn.includes('扣') || lowerColumn.includes('税') || lowerColumn.includes('费')) {
        groups.deduction.push(column);
      } else {
        groups.others.push(column);
      }
    });

    return groups;
  }, [availableColumns]);

  // 更新筛选配置
  const updateFilterConfig = (updates: Partial<ColumnFilterConfig>) => {
    onFilterConfigChange({ ...filterConfig, ...updates });
  };

  // 智能收起逻辑
  const handleMouseLeave = () => {
    if (!isPinned && visible) {
      setIsCollapsing(true);
      collapseTimeoutRef.current = setTimeout(() => {
        onClose();
        setIsCollapsing(false);
      }, 800); // 800ms延迟，给用户重新进入的机会
    }
  };

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      setIsCollapsing(false);
    }
  };

  const handlePinToggle = () => {
    setIsPinned(!isPinned);
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      setIsCollapsing(false);
    }
  };

  const handleManualClose = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    setIsCollapsing(false);
    onClose();
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // ESC键关闭（当未固定时）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible && !isPinned) {
        handleManualClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, isPinned]);

  // 智能收起功能说明内容
  const smartCollapseHelpContent = (
    <div style={{ maxWidth: 280, fontSize: '13px' }}>
      <div style={{ 
        marginBottom: 12, 
        fontWeight: 600, 
        color: '#1890ff', 
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: 6
      }}>
        🎯 智能面板控制
      </div>
      <div style={{ lineHeight: '1.7' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          marginBottom: 8,
          padding: '4px 0'
        }}>
          <span style={{ 
            minWidth: '20px', 
            fontSize: '16px', 
            marginRight: '8px' 
          }}>🖱️</span>
          <div>
            <div style={{ fontWeight: 500, color: '#333' }}>智能收起</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              鼠标离开后 <span style={{ color: '#f5222d', fontWeight: 500 }}>800ms</span> 自动收起
            </div>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          marginBottom: 8,
          padding: '4px 0'
        }}>
          <span style={{ 
            minWidth: '20px', 
            fontSize: '16px', 
            marginRight: '8px' 
          }}>📌</span>
          <div>
            <div style={{ fontWeight: 500, color: '#333' }}>固定模式</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              点击图钉{isPinned && <span style={{ color: '#52c41a', fontWeight: 500 }}> (当前已固定)</span>}
            </div>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          marginBottom: 8,
          padding: '4px 0'
        }}>
          <span style={{ 
            minWidth: '20px', 
            fontSize: '16px', 
            marginRight: '8px' 
          }}>⌨️</span>
          <div>
            <div style={{ fontWeight: 500, color: '#333' }}>快捷键</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              按 <kbd style={{ 
                padding: '1px 4px', 
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)', 
                border: '1px solid #d9d9d9', 
                borderRadius: '3px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}>ESC</kbd> 快速关闭
            </div>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start',
          padding: '4px 0'
        }}>
          <span style={{ 
            minWidth: '20px', 
            fontSize: '16px', 
            marginRight: '8px' 
          }}>✕</span>
          <div>
            <div style={{ fontWeight: 500, color: '#333' }}>手动关闭</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              点击关闭按钮随时关闭
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
    console.log('✅ [FilterConfigPanel] 应用预设:', presetType);
    
    switch (presetType) {
      case 'salary':
        updateFilterConfig({
          ...defaultFilterConfig,
          includePatterns: ['*工资*', '*薪资*', '*薪酬*', '*合计*', '*金额*', '*应发*', '*实发*', '*津贴*', '*补贴*', '*奖金*'],
          excludePatterns: ['*id*', '*时间*', '*日期*', '*编号*']
        });
        message.success('已应用"工资相关"预设');
        break;
      case 'insurance':
        updateFilterConfig({
          ...defaultFilterConfig,
          includePatterns: ['*保险*', '*公积金*', '*社保*', '*医疗*', '*养老*', '*失业*', '*工伤*', '*生育*'],
          excludePatterns: ['*id*', '*时间*', '*日期*']
        });
        message.success('已应用"保险公积金"预设');
        break;
      case 'amounts':
        updateFilterConfig({
          ...defaultFilterConfig,
          showOnlyNumericColumns: true,
          excludePatterns: ['*id*', '*比例*', '*费率*']
        });
        message.success('已应用"只看金额"预设');
        break;
      case 'reset':
        updateFilterConfig(defaultFilterConfig);
        message.success('已重置为默认配置');
        break;
      case 'all':
        updateFilterConfig({
          ...defaultFilterConfig,
          includePatterns: ['*'],
          excludePatterns: []
        });
        message.success('已应用"显示所有列"预设');
        break;
    }
  };

  if (!visible) return null;

  return (
    <Card 
      ref={panelRef}
      title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <FilterOutlined />
            <span>列筛选配置</span>
            <Popover
              content={smartCollapseHelpContent}
              title={null}
              trigger={["hover", "click"]}
              placement="bottomLeft"
              overlayStyle={{ 
                zIndex: 1050,
                maxWidth: 350
              }}
              mouseEnterDelay={0.5}
              mouseLeaveDelay={0.1}
              destroyTooltipOnHide
            >
              <QuestionCircleOutlined 
                style={{ 
                  color: '#999', 
                  fontSize: '14px', 
                  cursor: 'help',
                  marginLeft: '4px',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1890ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#999';
                }}
              />
            </Popover>
            {isCollapsing && <span style={{ color: '#999', fontSize: '12px' }}>即将收起...</span>}
          </Space>
          <Space>
            <Tooltip title={isPinned ? "取消固定" : "固定面板"}>
              <Button
                type="text"
                size="small"
                icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                onClick={handlePinToggle}
                style={{ 
                  color: isPinned ? '#1890ff' : '#999',
                  padding: '0 4px'
                }}
              />
            </Tooltip>
            <Tooltip title="关闭面板 (ESC)">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={handleManualClose}
                style={{ color: '#999', padding: '0 4px' }}
              />
            </Tooltip>
          </Space>
        </Space>
      }
      size="small"
      style={{ 
        marginBottom: 16,
        border: isPinned ? '2px solid #1890ff' : undefined,
        boxShadow: isPinned ? '0 4px 12px rgba(24, 144, 255, 0.2)' : undefined,
        transition: 'all 0.3s ease',
        opacity: isCollapsing ? 0.7 : 1
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
              <label>
                包含模式（支持通配符 * 和 ?）：
                <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                  设置后仅显示匹配的列，例如 "*工资*" 显示所有包含"工资"的列
                </span>
              </label>
              <Select
                mode="tags"
                style={{ 
                  width: '100%',
                  minHeight: '32px'
                }}
                placeholder="例如：*工资*、*保险*、*金额*（使用*通配符）"
                value={filterConfig.includePatterns}
                onChange={(patterns) => {
                  console.log('✅ [FilterConfigPanel] 更新包含模式:', patterns);
                  updateFilterConfig({ includePatterns: patterns });
                }}
                maxTagCount="responsive"
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}项...`}
                allowClear
                showSearch
                tokenSeparators={[',', '，', ';', '；', ' ']}
                filterOption={(input, option) => {
                  const label = typeof option?.children === 'string' ? option.children : String(option?.children || '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                tagRender={renderIncludeTag}
              >
                {/* 常用模式选项 */}
                <Option value="*工资*">*工资*（包含"工资"）</Option>
                <Option value="*保险*">*保险*（包含"保险"）</Option>
                <Option value="*金额*">*金额*（包含"金额"）</Option>
                <Option value="*合计*">*合计*（包含"合计"）</Option>
                <Option value="*津贴*">*津贴*（包含"津贴"）</Option>
                <Option value="*补贴*">*补贴*（包含"补贴"）</Option>
                <Option value="*奖金*">*奖金*（包含"奖金"）</Option>
                <Option value="基本*">基本*（以"基本"开头）</Option>
                <Option value="*费额">*费额（以"费额"结尾）</Option>
                
                {/* 基础信息字段 */}
                {groupedColumns.basic.length > 0 && (
                  <>
                    {groupedColumns.basic.map(columnName => (
                      <Option key={columnName} value={columnName}>
                        {columnName}（精确匹配）
                      </Option>
                    ))}
                    {groupedColumns.basic.map(columnName => (
                      <Option key={`*${columnName}*`} value={`*${columnName}*`}>
                        *{columnName}*（包含匹配）
                      </Option>
                    ))}
                  </>
                )}
                
                {/* 薪资相关字段 */}
                {groupedColumns.salary.length > 0 && (
                  <>
                    {groupedColumns.salary.map(columnName => (
                      <Option key={columnName} value={columnName}>
                        {columnName}（精确匹配）
                      </Option>
                    ))}
                    {groupedColumns.salary.map(columnName => (
                      <Option key={`*${columnName}*`} value={`*${columnName}*`}>
                        *{columnName}*（包含匹配）
                      </Option>
                    ))}
                  </>
                )}
                
                {/* 保险公积金字段 */}
                {groupedColumns.insurance.length > 0 && (
                  <>
                    {groupedColumns.insurance.map(columnName => (
                      <Option key={columnName} value={columnName}>
                        {columnName}（精确匹配）
                      </Option>
                    ))}
                    {groupedColumns.insurance.map(columnName => (
                      <Option key={`*${columnName}*`} value={`*${columnName}*`}>
                        *{columnName}*（包含匹配）
                      </Option>
                    ))}
                  </>
                )}
                
                {/* 扣减相关字段 */}
                {groupedColumns.deduction.length > 0 && (
                  <>
                    {groupedColumns.deduction.map(columnName => (
                      <Option key={columnName} value={columnName}>
                        {columnName}（精确匹配）
                      </Option>
                    ))}
                    {groupedColumns.deduction.map(columnName => (
                      <Option key={`*${columnName}*`} value={`*${columnName}*`}>
                        *{columnName}*（包含匹配）
                      </Option>
                    ))}
                  </>
                )}
                
                {/* 其他字段 */}
                {groupedColumns.others.length > 0 && (
                  <>
                    {groupedColumns.others.map(columnName => (
                      <Option key={columnName} value={columnName}>
                        {columnName}（精确匹配）
                      </Option>
                    ))}
                    {groupedColumns.others.map(columnName => (
                      <Option key={`*${columnName}*`} value={`*${columnName}*`}>
                        *{columnName}*（包含匹配）
                      </Option>
                    ))}
                  </>
                )}
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
                onChange={(patterns) => {
                  console.log('✅ [FilterConfigPanel] 更新排除模式:', patterns);
                  updateFilterConfig({ excludePatterns: patterns });
                }}
                maxTagCount="responsive"
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}项...`}
                allowClear
                showSearch
                tokenSeparators={[',', '，', ';', '；', ' ']}
                filterOption={(input, option) => {
                  const label = typeof option?.children === 'string' ? option.children : String(option?.children || '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                tagRender={renderExcludeTag}
              >
                {/* 常用排除模式 */}
                <Option value="*id">*id</Option>
                <Option value="*时间">*时间</Option>
                <Option value="*日期">*日期</Option>
                <Option value="*编号">*编号</Option>
                
                {/* 动态列名选项 - 按分组显示 */}
                {Object.entries(groupedColumns).map(([groupName, columns]) => 
                  columns.length > 0 ? (
                    <React.Fragment key={groupName}>
                      {columns.map(columnName => (
                        <Option key={`exclude-${columnName}`} value={columnName}>
                          {columnName}（精确排除）
                        </Option>
                      ))}
                      {columns.map(columnName => (
                        <Option key={`exclude-*${columnName}*`} value={`*${columnName}*`}>
                          *{columnName}*（包含排除）
                        </Option>
                      ))}
                    </React.Fragment>
                  ) : null
                )}
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
              type="primary"
              onClick={() => applyPreset('all')}
            >
              显示所有列
            </Button>
            <Button 
              size="small" 
              onClick={() => applyPreset('reset')}
            >
              重置默认
            </Button>
          </Space>
        </Panel>
        
        {/* 调试面板 - 仅在开发环境显示 */}
        {process.env.NODE_ENV === 'development' && (
          <Panel header="调试工具" key="debug">
            <Space wrap>
              <Button 
                size="small" 
                type="dashed"
                onClick={() => {
                  console.log('🔧 [调试] 当前筛选配置:', filterConfig);
                  
                  // 测试通配符匹配
                  const testPatterns = [
                    '*工资*',
                    '工资*',
                    '*工资',
                    '*金额*',
                    '?薪酬',
                    '*'
                  ];
                  
                  const testFields = [
                    '基本工资',
                    '工资合计',
                    '薪酬标准',
                    '实发金额',
                    '个税',
                    '社保'
                  ];
                  
                  console.log('🔧 [调试] 通配符匹配测试:');
                  testPatterns.forEach(pattern => {
                    console.log(`模式: "${pattern}"`);
                    testFields.forEach(field => {
                      // 使用导入的matchesPattern函数
                      const matches = matchesPattern(field, pattern);
                      console.log(`  "${field}" ${matches ? '✅ 匹配' : '❌ 不匹配'}`);
                    });
                  });
                  
                  message.info('调试信息已输出到控制台');
                }}
              >
                测试通配符匹配
              </Button>
              
              <Button 
                size="small" 
                type="dashed"
                onClick={() => {
                  // 测试包含模式
                  updateFilterConfig({
                    ...filterConfig,
                    includePatterns: ['*工资*'],
                    excludePatterns: []
                  });
                  message.info('已设置包含模式: *工资*');
                }}
              >
                测试包含模式
              </Button>
            </Space>
          </Panel>
        )}
      </Collapse>
    </Card>
  );
};