import React, { useState, useRef, useEffect } from 'react';
import { 
  Input, 
  Select, 
  Space, 
  Tag, 
  Dropdown, 
  Button, 
  Tooltip,
  Badge,
  Typography,
  AutoComplete
} from 'antd';
import { 
  SearchOutlined, 
  ClearOutlined, 
  HistoryOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { SearchMode } from '../../utils/searchUtils';
import { useSearchHistory } from '../../hooks/usePayrollSearch';

const { Text } = Typography;
const { Option } = Select;

// 组件属性接口
export interface GlobalSearchProps {
  value?: string;
  placeholder?: string;
  onSearch: (query: string, mode: SearchMode) => void;
  onClear: () => void;
  suggestions?: string[];
  searchMode?: SearchMode;
  onSearchModeChange?: (mode: SearchMode) => void;
  isSearching?: boolean;
  totalResults?: number;
  searchTime?: number;
  disabled?: boolean;
  showHistory?: boolean;
  showPerformance?: boolean;
  className?: string;
}

// 搜索模式配置
const SEARCH_MODE_CONFIG = {
  [SearchMode.AUTO]: {
    label: '智能搜索',
    icon: <ThunderboltOutlined />,
    color: 'blue',
    description: '自动判断搜索模式'
  },
  [SearchMode.FUZZY]: {
    label: '模糊搜索',
    icon: <SearchOutlined />,
    color: 'green',
    description: '支持拼写错误和部分匹配'
  },
  [SearchMode.EXACT]: {
    label: '精确搜索',
    icon: <FilterOutlined />,
    color: 'orange',
    description: '完全匹配搜索内容'
  }
};

/**
 * 全局搜索组件
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  value = '',
  placeholder = '搜索员工姓名、编号、部门、职位...',
  onSearch,
  onClear,
  suggestions = [],
  searchMode = SearchMode.AUTO,
  onSearchModeChange,
  isSearching = false,
  totalResults = 0,
  searchTime = 0,
  disabled = false,
  showHistory = true,
  showPerformance = true,
  className,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<any>(null);
  
  // 搜索历史管理
  const { 
    history, 
    addToHistory, 
    clearHistory, 
    removeFromHistory 
  } = useSearchHistory();

  // 同步外部 value 变化
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 处理搜索
  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      addToHistory(trimmedQuery);
    }
    onSearch(trimmedQuery, searchMode);
    setShowSuggestions(false);
  };

  // 处理输入变化
  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val.trim()) {
      setShowSuggestions(true);
      onSearch(val, searchMode);
    } else {
      onClear();
      setShowSuggestions(false);
    }
  };

  // 处理清空
  const handleClear = () => {
    setInputValue('');
    setShowSuggestions(false);
    onClear();
    inputRef.current?.focus();
  };

  // 处理搜索模式变化
  const handleSearchModeChange = (mode: SearchMode) => {
    onSearchModeChange?.(mode);
    if (inputValue.trim()) {
      onSearch(inputValue.trim(), mode);
    }
  };

  // 生成搜索建议选项
  const generateOptions = () => {
    const options: any[] = [];

    // 添加搜索历史
    if (showHistory && history.length > 0 && inputValue.trim()) {
      const filteredHistory = history.filter(item => 
        item.toLowerCase().includes(inputValue.toLowerCase())
      );
      
      if (filteredHistory.length > 0) {
        options.push({
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HistoryOutlined style={{ color: '#999' }} />
              <Text type="secondary">搜索历史</Text>
            </div>
          ),
          options: filteredHistory.map(item => ({
            value: item,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item}</span>
                <Button 
                  type="text" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(item);
                  }}
                >
                  ×
                </Button>
              </div>
            )
          }))
        });
      }
    }

    // 添加搜索建议
    if (suggestions.length > 0) {
      options.push({
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SearchOutlined style={{ color: '#999' }} />
            <Text type="secondary">搜索建议</Text>
          </div>
        ),
        options: suggestions.map(item => ({
          value: item,
          label: item
        }))
      });
    }

    return options;
  };

  // 搜索模式选择器
  const searchModeSelector = (
    <Select
      value={searchMode}
      onChange={handleSearchModeChange}
      style={{ width: 120 }}
      size="small"
      disabled={disabled}
    >
      {Object.entries(SEARCH_MODE_CONFIG).map(([mode, config]) => (
        <Option key={mode} value={mode}>
          <Space size={4}>
            {config.icon}
            {config.label}
          </Space>
        </Option>
      ))}
    </Select>
  );

  // 性能信息显示
  const performanceInfo = showPerformance && (totalResults > 0 || searchTime > 0) && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#666' }}>
      <Badge count={totalResults} showZero color="blue" />
      <Text type="secondary">条结果</Text>
      {searchTime > 0 && (
        <>
          <ClockCircleOutlined />
          <Text type="secondary">{searchTime.toFixed(1)}ms</Text>
        </>
      )}
    </div>
  );

  return (
    <div className={className}>
      <Space.Compact style={{ width: '100%' }}>
        {/* 搜索模式选择器 */}
        <Tooltip title={SEARCH_MODE_CONFIG[searchMode].description}>
          {searchModeSelector}
        </Tooltip>

        {/* 搜索输入框 */}
        <AutoComplete
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onSelect={handleSearch}
          options={generateOptions()}
          style={{ flex: 1 }}
          disabled={disabled}
          placeholder={placeholder}
          allowClear={false}
          open={showSuggestions && (suggestions.length > 0 || history.length > 0)}
          onOpenChange={setShowSuggestions}
        >
          <Input
            prefix={isSearching ? <LoadingOutlined style={{ color: '#1890ff' }} /> : <SearchOutlined style={{ color: '#999' }} />}
            suffix={
              <Space size={4}>
                {inputValue && (
                  <Button
                    type="text"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    style={{ color: '#999' }}
                  />
                )}
              </Space>
            }
            onPressEnter={() => handleSearch(inputValue)}
          />
        </AutoComplete>

        {/* 历史清空按钮 */}
        {showHistory && history.length > 0 && (
          <Tooltip title="清空搜索历史">
            <Button
              icon={<HistoryOutlined />}
              onClick={clearHistory}
              disabled={disabled}
            />
          </Tooltip>
        )}
      </Space.Compact>

      {/* 性能信息和搜索模式标签 */}
      {(performanceInfo || searchMode !== SearchMode.AUTO) && (
        <div style={{ 
          marginTop: 8, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          {performanceInfo}
          
          {searchMode !== SearchMode.AUTO && (
            <Tag 
              color={SEARCH_MODE_CONFIG[searchMode].color}
              icon={SEARCH_MODE_CONFIG[searchMode].icon}
            >
              {SEARCH_MODE_CONFIG[searchMode].label}
            </Tag>
          )}
        </div>
      )}

      {/* 快捷搜索标签（可选功能） */}
      {inputValue && suggestions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
            快捷搜索:
          </Text>
          <Space size={4} wrap>
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <Tag
                key={index}
                style={{ cursor: 'pointer', fontSize: 11 }}
                onClick={() => handleSearch(suggestion)}
              >
                {suggestion}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
}; 