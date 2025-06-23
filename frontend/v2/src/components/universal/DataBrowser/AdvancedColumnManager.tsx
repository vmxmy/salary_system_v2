import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Card, Collapse, Switch, Select, InputNumber, Button, Space, Tooltip, Popover, message, Tag, Divider, Row, Col } from 'antd';
import { 
  FilterOutlined, 
  CloseOutlined, 
  PushpinOutlined, 
  PushpinFilled, 
  QuestionCircleOutlined,
  SortAscendingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';

const { Panel } = Collapse;
const { Option } = Select;

// Column sort modes
export type ColumnSortMode = 'byCategory' | 'byAlphabet' | 'byImportance' | 'byDataType' | 'custom';

// Filter configuration interface
export interface ColumnFilterConfig {
  hideJsonbColumns: boolean;
  hideZeroColumns: boolean;
  hideEmptyColumns: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  minValueThreshold: number;
  maxValueThreshold: number;
  showOnlyNumericColumns: boolean;
  columnSortMode?: ColumnSortMode;
  customColumnOrder?: string[];
}

// Default filter configuration
export const defaultColumnFilterConfig: ColumnFilterConfig = {
  hideJsonbColumns: true,
  hideZeroColumns: true,
  hideEmptyColumns: true,
  includePatterns: [],
  excludePatterns: ['*id', '*时间', '*日期'],
  minValueThreshold: 0,
  maxValueThreshold: Infinity,
  showOnlyNumericColumns: false,
  columnSortMode: 'byCategory',
  customColumnOrder: [],
};

interface AdvancedColumnManagerProps<T = any> {
  visible: boolean;
  onClose: () => void;
  filterConfig: ColumnFilterConfig;
  onFilterConfigChange: (config: ColumnFilterConfig) => void;
  dataSource: T[];
  columns?: ProColumns<T>[];
  onColumnsChange?: (columns: ProColumns<T>[]) => void;
}

// Utility function to check if pattern matches
const matchesPattern = (text: string, pattern: string): boolean => {
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(text);
};

// Utility function to determine data type
const getColumnDataType = (data: any[], columnKey: string): 'number' | 'date' | 'boolean' | 'text' => {
  const sample = data.slice(0, 100); // Sample first 100 rows
  const values = sample.map(row => row[columnKey]).filter(val => val != null);
  
  if (values.length === 0) return 'text';
  
  // Check for numbers
  const numericValues = values.filter(val => typeof val === 'number' || !isNaN(Number(val)));
  if (numericValues.length > values.length * 0.8) return 'number';
  
  // Check for dates
  const dateValues = values.filter(val => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  });
  if (dateValues.length > values.length * 0.8) return 'date';
  
  // Check for booleans
  const booleanValues = values.filter(val => typeof val === 'boolean');
  if (booleanValues.length > values.length * 0.8) return 'boolean';
  
  return 'text';
};

export const AdvancedColumnManager: React.FC<AdvancedColumnManagerProps> = ({
  visible,
  onClose,
  filterConfig,
  onFilterConfigChange,
  dataSource,
  columns = [],
  onColumnsChange
}) => {
  const { t } = useTranslation(['common']);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get all available columns from data source
  const availableColumns = useMemo(() => {
    if (!dataSource || dataSource.length === 0) {
      return [];
    }
    
    // Extract all unique column names from data source
    const allColumns = new Set<string>();
    dataSource.forEach(item => {
      Object.keys(item).forEach(key => {
        // Filter out unnecessary fields
        if (key !== 'id' && key !== 'key' && !key.startsWith('_')) {
          allColumns.add(key);
        }
      });
    });
    
    return Array.from(allColumns).sort();
  }, [dataSource]);

  // Group columns by category
  const groupedColumns = useMemo(() => {
    const groups = {
      basic: [] as string[],
      contact: [] as string[],
      position: [] as string[],
      salary: [] as string[],
      others: [] as string[]
    };

    availableColumns.forEach(column => {
      const lowerColumn = column.toLowerCase();
      if (lowerColumn.includes('姓名') || lowerColumn.includes('name') || 
          lowerColumn.includes('编号') || lowerColumn.includes('code') ||
          lowerColumn.includes('性别') || lowerColumn.includes('age')) {
        groups.basic.push(column);
      } else if (lowerColumn.includes('电话') || lowerColumn.includes('phone') ||
                 lowerColumn.includes('邮箱') || lowerColumn.includes('email') ||
                 lowerColumn.includes('地址') || lowerColumn.includes('address')) {
        groups.contact.push(column);
      } else if (lowerColumn.includes('部门') || lowerColumn.includes('department') ||
                 lowerColumn.includes('职位') || lowerColumn.includes('position') ||
                 lowerColumn.includes('岗位') || lowerColumn.includes('job')) {
        groups.position.push(column);
      } else if (lowerColumn.includes('工资') || lowerColumn.includes('salary') ||
                 lowerColumn.includes('薪') || lowerColumn.includes('wage') ||
                 lowerColumn.includes('津贴') || lowerColumn.includes('bonus')) {
        groups.salary.push(column);
      } else {
        groups.others.push(column);
      }
    });

    return groups;
  }, [availableColumns]);

  // Calculate column statistics
  const columnStats = useMemo(() => {
    const stats: Record<string, { 
      type: string;
      emptyCount: number;
      zeroCount: number;
      totalCount: number;
      hasValues: boolean;
    }> = {};

    availableColumns.forEach(column => {
      const values = dataSource.map(row => row[column]);
      const emptyCount = values.filter(val => val == null || val === '').length;
      const zeroCount = values.filter(val => val === 0 || val === '0').length;
      const hasValues = values.some(val => val != null && val !== '' && val !== 0 && val !== '0');
      
      stats[column] = {
        type: getColumnDataType(dataSource, column),
        emptyCount,
        zeroCount,
        totalCount: values.length,
        hasValues
      };
    });

    return stats;
  }, [availableColumns, dataSource]);

  // Handle mouse events for auto-collapse
  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsCollapsing(false);
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsCollapsing(true);
      collapseTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = (key: keyof ColumnFilterConfig, value: any) => {
    onFilterConfigChange({
      ...filterConfig,
      [key]: value
    });
  };

  const handleResetFilters = () => {
    onFilterConfigChange(defaultColumnFilterConfig);
    message.success(t('filter.reset_success', { defaultValue: '筛选条件已重置' }));
  };

  const renderColumnPresets = () => {
    const presets = [
      {
        name: t('filter.presets.basic_info', { defaultValue: '基本信息' }),
        description: t('filter.presets.basic_info_desc', { defaultValue: '显示姓名、编号、部门等基本信息' }),
        config: {
          includePatterns: ['*姓名*', '*name*', '*编号*', '*code*', '*部门*', '*department*'],
          excludePatterns: [],
          hideEmptyColumns: true
        }
      },
      {
        name: t('filter.presets.contact_info', { defaultValue: '联系信息' }),
        description: t('filter.presets.contact_info_desc', { defaultValue: '显示联系方式相关字段' }),
        config: {
          includePatterns: ['*电话*', '*phone*', '*邮箱*', '*email*', '*地址*', '*address*'],
          excludePatterns: [],
          hideEmptyColumns: true
        }
      },
      {
        name: t('filter.presets.salary_info', { defaultValue: '薪资信息' }),
        description: t('filter.presets.salary_info_desc', { defaultValue: '显示薪资相关字段' }),
        config: {
          includePatterns: ['*工资*', '*salary*', '*薪*', '*wage*', '*津贴*', '*bonus*'],
          excludePatterns: [],
          showOnlyNumericColumns: false
        }
      },
      {
        name: t('filter.presets.numeric_only', { defaultValue: '仅数值列' }),
        description: t('filter.presets.numeric_only_desc', { defaultValue: '仅显示数值类型的列' }),
        config: {
          showOnlyNumericColumns: true,
          hideZeroColumns: true
        }
      }
    ];

    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 500 }}>
          {t('filter.quick_presets', { defaultValue: '快速预设' })}
        </div>
        <Space wrap>
          {presets.map((preset, index) => (
            <Tooltip key={index} title={preset.description}>
              <Button
                size="small"
                onClick={() => {
                  onFilterConfigChange({
                    ...filterConfig,
                    ...preset.config
                  });
                  message.success(`${t('filter.preset_applied', { defaultValue: '已应用预设' })}: ${preset.name}`);
                }}
              >
                {preset.name}
              </Button>
            </Tooltip>
          ))}
        </Space>
      </div>
    );
  };

  const renderColumnStats = () => {
    const hiddenByEmpty = availableColumns.filter(col => 
      filterConfig.hideEmptyColumns && !columnStats[col]?.hasValues
    ).length;
    
    const hiddenByZero = availableColumns.filter(col => 
      filterConfig.hideZeroColumns && columnStats[col]?.zeroCount === columnStats[col]?.totalCount
    ).length;

    const visibleColumns = availableColumns.filter(col => {
      const stats = columnStats[col];
      if (!stats) return true;
      
      // Check empty columns filter
      if (filterConfig.hideEmptyColumns && !stats.hasValues) return false;
      
      // Check zero columns filter
      if (filterConfig.hideZeroColumns && stats.zeroCount === stats.totalCount) return false;
      
      // Check numeric only filter
      if (filterConfig.showOnlyNumericColumns && stats.type !== 'number') return false;
      
      // Check include patterns
      if (filterConfig.includePatterns.length > 0) {
        const matches = filterConfig.includePatterns.some(pattern => matchesPattern(col, pattern));
        if (!matches) return false;
      }
      
      // Check exclude patterns
      if (filterConfig.excludePatterns.length > 0) {
        const matches = filterConfig.excludePatterns.some(pattern => matchesPattern(col, pattern));
        if (matches) return false;
      }
      
      return true;
    });

    return (
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                {availableColumns.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('filter.stats.total_columns', { defaultValue: '总列数' })}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                {visibleColumns.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('filter.stats.visible_columns', { defaultValue: '可见列数' })}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                {hiddenByEmpty}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('filter.stats.hidden_empty', { defaultValue: '隐藏空列' })}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f5222d' }}>
                {hiddenByZero}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('filter.stats.hidden_zero', { defaultValue: '隐藏零值列' })}
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        top: '20%',
        right: isCollapsing ? '-280px' : '20px',
        width: '300px',
        maxHeight: '60vh',
        zIndex: 1001,
        transition: 'right 0.3s ease-in-out',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Card
        title={
          <Space>
            <FilterOutlined />
            {t('filter.title', { defaultValue: '列管理' })}
            {isCollapsing && (
              <Tag color="orange">
                {t('filter.auto_closing', { defaultValue: '即将收起' })}
              </Tag>
            )}
          </Space>
        }
        size="small"
        extra={
          <Space>
            <Tooltip title={isPinned ? t('filter.unpin', { defaultValue: '取消固定' }) : t('filter.pin', { defaultValue: '固定面板' })}>
              <Button
                type="text"
                size="small"
                icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                onClick={() => setIsPinned(!isPinned)}
              />
            </Tooltip>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </Space>
        }
        bodyStyle={{ 
          maxHeight: '50vh', 
          overflowY: 'auto',
          padding: '12px'
        }}
      >
        {/* Column Statistics */}
        {renderColumnStats()}
        
        <Divider style={{ margin: '12px 0' }} />
        
        {/* Quick Presets */}
        {renderColumnPresets()}
        
        <Divider style={{ margin: '12px 0' }} />

        <Collapse size="small" ghost>
          {/* Basic Filters Panel */}
          <Panel 
            header={t('filter.basic_filters', { defaultValue: '基础筛选' })} 
            key="basic"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Switch
                  size="small"
                  checked={filterConfig.hideEmptyColumns}
                  onChange={(checked) => handleFilterChange('hideEmptyColumns', checked)}
                />
                <span style={{ marginLeft: 8, fontSize: '13px' }}>
                  {t('filter.hide_empty_columns', { defaultValue: '隐藏空列' })}
                </span>
              </div>
              
              <div>
                <Switch
                  size="small"
                  checked={filterConfig.hideZeroColumns}
                  onChange={(checked) => handleFilterChange('hideZeroColumns', checked)}
                />
                <span style={{ marginLeft: 8, fontSize: '13px' }}>
                  {t('filter.hide_zero_columns', { defaultValue: '隐藏零值列' })}
                </span>
              </div>
              
              <div>
                <Switch
                  size="small"
                  checked={filterConfig.showOnlyNumericColumns}
                  onChange={(checked) => handleFilterChange('showOnlyNumericColumns', checked)}
                />
                <span style={{ marginLeft: 8, fontSize: '13px' }}>
                  {t('filter.numeric_only', { defaultValue: '仅显示数值列' })}
                </span>
              </div>
            </Space>
          </Panel>

          {/* Pattern Filters Panel */}
          <Panel 
            header={t('filter.pattern_filters', { defaultValue: '模式筛选' })} 
            key="patterns"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <div style={{ fontSize: '13px', marginBottom: 4 }}>
                  {t('filter.include_patterns', { defaultValue: '包含模式' })}
                  <Tooltip title={t('filter.pattern_help', { defaultValue: '使用*作为通配符，如: *name*, salary*' })}>
                    <QuestionCircleOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
                  </Tooltip>
                </div>
                <Select
                  mode="tags"
                  size="small"
                  style={{ width: '100%' }}
                  placeholder={t('filter.pattern_placeholder', { defaultValue: '输入模式，如: *name*' })}
                  value={filterConfig.includePatterns}
                  onChange={(value) => handleFilterChange('includePatterns', value)}
                />
              </div>
              
              <div>
                <div style={{ fontSize: '13px', marginBottom: 4 }}>
                  {t('filter.exclude_patterns', { defaultValue: '排除模式' })}
                </div>
                <Select
                  mode="tags"
                  size="small"
                  style={{ width: '100%' }}
                  placeholder={t('filter.exclude_placeholder', { defaultValue: '输入要排除的模式' })}
                  value={filterConfig.excludePatterns}
                  onChange={(value) => handleFilterChange('excludePatterns', value)}
                />
              </div>
            </Space>
          </Panel>

          {/* Column Groups Panel */}
          <Panel 
            header={t('filter.column_groups', { defaultValue: '列分组' })} 
            key="groups"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {Object.entries(groupedColumns).map(([groupName, columns]) => (
                columns.length > 0 && (
                  <div key={groupName}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: 4 }}>
                      {t(`filter.groups.${groupName}`, { defaultValue: groupName })} ({columns.length})
                    </div>
                    <div style={{ paddingLeft: 8 }}>
                      {columns.slice(0, 3).map(column => (
                        <Tag key={column} style={{ margin: '1px' }}>
                          {column.length > 12 ? `${column.substring(0, 12)}...` : column}
                        </Tag>
                      ))}
                      {columns.length > 3 && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          +{columns.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )
              ))}
            </Space>
          </Panel>
        </Collapse>
        
        <Divider style={{ margin: '12px 0' }} />
        
        {/* Action Buttons */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={handleResetFilters}
          >
            {t('filter.reset', { defaultValue: '重置' })}
          </Button>
          <Button 
            size="small" 
            type="primary"
            onClick={onClose}
          >
            {t('filter.apply', { defaultValue: '应用' })}
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default AdvancedColumnManager;