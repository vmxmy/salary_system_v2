import React, { useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, Select, Tooltip, Input } from 'antd';
import { SearchOutlined, DownOutlined, UpOutlined, ClearOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { SearchMode } from '../../../utils/searchUtils';

const { Option } = Select;

interface SmartSearchPanelProps<T = any> {
  // Search state
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  searchMode: SearchMode;
  suggestions: string[];
  totalResults: number;
  searchTime: number;
  isEmptyQuery: boolean;
  hasResults: boolean;
  performance: {
    isOptimal: boolean;
  };
  
  // Event handlers
  onSearch: (query: string) => void;
  onClear: () => void;
  onSearchModeChange: (mode: SearchMode) => void;
  
  // Configuration
  placeholder?: string;
  showPerformance?: boolean;
  searchModes?: SearchMode[];
  supportExpressions?: boolean;
  collapsible?: boolean;
  showTips?: boolean;
}

const SEARCH_MODE_OPTIONS = [
  { value: SearchMode.AUTO, label: '智能搜索', tip: '自动选择最佳搜索模式' },
  { value: SearchMode.EXACT, label: '精确匹配', tip: '完全匹配搜索内容' },
  { value: SearchMode.FUZZY, label: '模糊搜索', tip: '支持近似匹配和拼写纠错' },
  { value: SearchMode.REGEX, label: '正则表达式', tip: '支持正则表达式匹配' },
  { value: SearchMode.SMART, label: '智能建议', tip: '基于历史和内容的智能建议' },
];

export const SmartSearchPanel: React.FC<SmartSearchPanelProps> = ({
  searchQuery,
  searchResults,
  isSearching,
  searchMode,
  suggestions,
  totalResults,
  searchTime,
  isEmptyQuery,
  hasResults,
  performance,
  onSearch,
  onClear,
  onSearchModeChange,
  placeholder = "输入搜索关键词...",
  showPerformance = true,
  searchModes = [SearchMode.AUTO, SearchMode.EXACT, SearchMode.FUZZY, SearchMode.SMART],
  supportExpressions = true,
  collapsible = true,
  showTips = true
}) => {
  const { t } = useTranslation(['common']);
  const [searchCardCollapsed, setSearchCardCollapsed] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setLocalSearchQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setLocalSearchQuery('');
    onClear();
  };

  const getSearchModeDisplay = () => {
    const mode = SEARCH_MODE_OPTIONS.find(option => option.value === searchMode);
    return mode ? mode.label : '智能搜索';
  };

  const renderSearchTips = () => {
    if (!showTips || !isEmptyQuery) return null;

    const tips = [
      '💡 支持多关键词搜索，用空格分隔',
    ];

    if (supportExpressions) {
      tips.push('🔢 支持条件表达式，如: salary>10000');
    }

    return (
      <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
        <Space direction="vertical" size={0}>
          {tips.map((tip, index) => (
            <span key={index}>{tip}</span>
          ))}
        </Space>
      </div>
    );
  };

  const renderPerformanceIndicator = () => {
    if (!showPerformance || isEmptyQuery) return null;

    return (
      <Space size={4}>
        <Tag color="blue" style={{ margin: 0 }}>
          {totalResults} 条结果
          {performance.isOptimal && <span style={{ color: '#52c41a' }}> ⚡</span>}
        </Tag>
        {searchTime > 0 && (
          <Tag color="default" style={{ margin: 0, fontSize: '11px' }}>
            {searchTime}ms
          </Tag>
        )}
      </Space>
    );
  };

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0 || !isEmptyQuery) return null;

    return (
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: '12px', color: '#666', marginRight: 8 }}>建议搜索:</span>
        <Space size={4} wrap>
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <Tag
              key={index}
              style={{ cursor: 'pointer', margin: '2px 0' }}
              onClick={() => handleSearch(suggestion)}
            >
              {suggestion}
            </Tag>
          ))}
        </Space>
      </div>
    );
  };

  return (
    <Card 
      title={
        <Row justify="space-between" align="middle" wrap={false}>
          <Col flex="auto">
            <Space wrap size={4} align="center">
              <SearchOutlined />
              <span>{t('search.title', { defaultValue: '智能搜索' })}</span>
              {renderPerformanceIndicator()}
            </Space>
          </Col>
          {collapsible && (
            <Col flex="none">
              <Button 
                type="text" 
                size="small"
                onClick={() => setSearchCardCollapsed(!searchCardCollapsed)}
                icon={searchCardCollapsed ? <DownOutlined /> : <UpOutlined />}
                style={{ 
                  fontSize: '12px',
                  padding: '0 4px',
                  height: '24px',
                  lineHeight: '22px'
                }}
              />
            </Col>
          )}
        </Row>
      }
      size="small"
      style={{ 
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e8e8e8'
      }}
      bodyStyle={{
        padding: searchCardCollapsed ? 0 : 16,
        display: searchCardCollapsed ? 'none' : 'block'
      }}
    >
      <Row gutter={[12, 8]} align="middle">
        <Col flex="auto">
          <Input.Search
            placeholder={placeholder}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onSearch={handleSearch}
            loading={isSearching}
            allowClear
            onClear={handleClear}
            style={{ width: '100%' }}
            suffix={
              <Space size={4}>
                {searchQuery && (
                  <Button
                    type="text"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    style={{ fontSize: '12px', padding: 0, width: 16, height: 16 }}
                  />
                )}
              </Space>
            }
          />
        </Col>
        
        <Col flex="none">
          <Space size={8}>
            <Select
              value={searchMode}
              onChange={onSearchModeChange}
              size="small"
              style={{ width: 120 }}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <QuestionCircleOutlined style={{ marginRight: 4 }} />
                      选择合适的搜索模式
                    </div>
                  </div>
                </div>
              )}
            >
              {SEARCH_MODE_OPTIONS
                .filter(option => searchModes.includes(option.value))
                .map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tooltip title={option.tip} placement="left">
                      {option.label}
                    </Tooltip>
                  </Option>
                ))}
            </Select>
            
            <div style={{ fontSize: '12px', color: '#666', minWidth: 80 }}>
              {getSearchModeDisplay()}
            </div>
          </Space>
        </Col>
      </Row>

      {/* Search tips when no query */}
      {renderSearchTips()}

      {/* Search suggestions */}
      {renderSuggestions()}

      {/* Search results summary */}
      {!isEmptyQuery && hasResults && (
        <div style={{ 
          marginTop: 12, 
          padding: '8px 12px', 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: 4,
          fontSize: '12px'
        }}>
          <Space align="center">
            <span style={{ color: '#52c41a' }}>✓</span>
            <span>
              找到 {totalResults} 条匹配结果
              {searchTime > 0 && ` (${searchTime}ms)`}
              {performance.isOptimal && (
                <span style={{ color: '#52c41a', marginLeft: 4 }}>
                  ⚡ 性能优化
                </span>
              )}
            </span>
          </Space>
        </div>
      )}

      {/* No results message */}
      {!isEmptyQuery && !hasResults && !isSearching && (
        <div style={{ 
          marginTop: 12, 
          padding: '8px 12px', 
          backgroundColor: '#fff2e8', 
          border: '1px solid #ffd591',
          borderRadius: 4,
          fontSize: '12px'
        }}>
          <Space align="center">
            <span style={{ color: '#fa8c16' }}>⚠</span>
            <span>
              未找到匹配的结果，请尝试:
            </span>
          </Space>
          <div style={{ marginTop: 4, paddingLeft: 20 }}>
            • 检查关键词拼写<br />
            • 使用更简短的关键词<br />
            • 尝试不同的搜索模式
          </div>
        </div>
      )}
    </Card>
  );
};

export default SmartSearchPanel;