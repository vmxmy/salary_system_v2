import React, { useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, Select, Input } from 'antd';
import { SearchOutlined, DownOutlined, UpOutlined, ClearOutlined, CheckOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { SearchMode } from '../../../utils/searchUtils';
import styles from './SmartSearchPanel.module.less';

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
      '支持多关键词搜索，用空格分隔'
    ];

    if (supportExpressions) {
      tips.push('支持条件表达式，如: salary>10000');
    }

    return (
      <div className={styles.searchTips}>
        <div className={styles.tipsList}>
          {tips.map((tip, index) => (
            <div key={index} className={styles.tipItem}>
              <span className={styles.tipEmoji}>💡</span>
              {tip}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPerformanceIndicator = () => {
    if (!showPerformance || isEmptyQuery) return null;

    return (
      <div className={styles.performanceIndicator}>
        <Tag className={styles.resultTag}>
          {totalResults} 条结果
          {performance.isOptimal && <span className={styles.performanceIcon}> ⚡</span>}
        </Tag>
        {searchTime > 0 && (
          <Tag className={styles.timeTag}>
            {searchTime}ms
          </Tag>
        )}
      </div>
    );
  };

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0 || !isEmptyQuery) return null;

    return (
      <div className={styles.suggestions}>
        <span className={styles.suggestionLabel}>热门搜索:</span>
        <div className={styles.suggestionTags}>
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <Tag
              key={index}
              onClick={() => handleSearch(suggestion)}
            >
              {suggestion}
            </Tag>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card 
      className={`${styles.smartSearchCard} ${searchCardCollapsed ? styles.collapsed : ''} ${isSearching ? styles.loading : ''}`}
      title={
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <SearchOutlined className={styles.searchIcon} />
            <h4 className={styles.title}>
              {t('search.title', { defaultValue: '智能搜索' })}
            </h4>
            {renderPerformanceIndicator()}
          </div>
          {collapsible && (
            <div className={styles.collapseButton}>
              <Button 
                type="text" 
                size="small"
                onClick={() => setSearchCardCollapsed(!searchCardCollapsed)}
                icon={searchCardCollapsed ? <DownOutlined /> : <UpOutlined />}
              />
            </div>
          )}
        </div>
      }
      size="small"
    >
      <div className={styles.searchContent}>
        <div className={styles.searchInputWrapper}>
          <div className={styles.searchInputContainer}>
            <Input.Search
              placeholder={placeholder}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              onSearch={handleSearch}
              loading={isSearching}
              allowClear
              onClear={handleClear}
              size="small"
              enterButton={<SearchOutlined />}
            />
          </div>
          {renderSuggestions()}
          {renderSearchTips()}
        </div>
        
        <div className={styles.searchControls}>
          <div className={styles.searchModeSelector}>
            <Select
              value={searchMode}
              onChange={onSearchModeChange}
              size="small"
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <div className={styles.searchModeTip}>
                    <div className={styles.tipContent}>
                      <InfoCircleOutlined className={styles.tipIcon} />
                      选择合适的搜索模式
                    </div>
                  </div>
                </div>
              )}
            >
              {SEARCH_MODE_OPTIONS
                .filter(option => searchModes.includes(option.value))
                .map(option => (
                  <Option key={option.value} value={option.value} title={option.tip}>
                    {option.label}
                  </Option>
                ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Search results summary */}
      {!isEmptyQuery && hasResults && (
        <div className={`${styles.searchResult} ${styles.success}`}>
          <div className={styles.resultContent}>
            <CheckOutlined className={styles.resultIcon} />
            <div className={styles.resultText}>
              找到 <span className={styles.resultCount}>{totalResults}</span> 条匹配结果
              {searchTime > 0 && (
                <span className={styles.resultTime}>
                  ({searchTime}ms)
                </span>
              )}
              {performance.isOptimal && (
                <span className={styles.performanceText}>
                  <span className={styles.performanceIcon}>⚡</span>
                  性能优化
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No results message */}
      {!isEmptyQuery && !hasResults && !isSearching && (
        <div className={`${styles.searchResult} ${styles.noResults}`}>
          <div className={styles.noResultsContent}>
            <div className={styles.noResultsHeader}>
              <InfoCircleOutlined className={styles.warningIcon} />
              <span>未找到匹配的结果，请尝试:</span>
            </div>
            <ul className={styles.suggestionsList}>
              <li>检查关键词拼写</li>
              <li>使用更简短的关键词</li>
              <li>切换不同的搜索模式</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SmartSearchPanel;