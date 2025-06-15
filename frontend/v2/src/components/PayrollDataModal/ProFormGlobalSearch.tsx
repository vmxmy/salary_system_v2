import React, { useState, useRef, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { 
  ProForm,
  ProFormText,
  ProFormSelect
} from '@ant-design/pro-components';
import { 
  Space, 
  Tag, 
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
import styles from './ProFormGlobalSearch.module.css';

const { Text } = Typography;

// 组件属性接口
export interface ProFormGlobalSearchProps {
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
 * ProForm 全局搜索组件
 */
export const ProFormGlobalSearch: React.FC<ProFormGlobalSearchProps> = ({
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const formRef = useRef<any>();
  
  // 搜索历史管理
  const { 
    history, 
    addToHistory, 
    clearHistory, 
    removeFromHistory 
  } = useSearchHistory();

  // 创建防抖搜索函数
  const debouncedSearch = useCallback(
    debounce((query: string, mode: SearchMode) => {
      if (query.trim()) {
        onSearch(query.trim(), mode);
      }
    }, 300), // 300ms 防抖延迟
    [onSearch]
  );

  // 组件卸载时清理防抖函数
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // 处理表单提交（搜索）
  const handleFinish = async (values: any) => {
    const { searchQuery, searchMode: mode } = values;
    const trimmedQuery = searchQuery?.trim() || '';
    
    if (trimmedQuery) {
      addToHistory(trimmedQuery);
    }
    
    onSearch(trimmedQuery, mode || SearchMode.AUTO);
    setShowSuggestions(false);
    
    return Promise.resolve();
  };

  // 处理值变化 - 移除实时搜索，避免循环刷新
  const handleValuesChange = (changedValues: any, allValues: any) => {
    const { searchQuery, searchMode: mode } = allValues;
    
    // 搜索模式变化
    if (changedValues.searchMode && onSearchModeChange) {
      onSearchModeChange(changedValues.searchMode);
      // 只有在有搜索内容时才重新搜索
      if (searchQuery?.trim()) {
        onSearch(searchQuery.trim(), changedValues.searchMode);
      }
    }
    
    // 搜索内容变化 - 使用防抖搜索
    if (changedValues.searchQuery !== undefined) {
      const query = changedValues.searchQuery?.trim() || '';
      if (query) {
        setShowSuggestions(true);
        // 使用防抖搜索，避免频繁触发
        debouncedSearch(query, mode || SearchMode.AUTO);
      } else {
        setShowSuggestions(false);
        // 取消防抖搜索
        debouncedSearch.cancel();
        // 只有在清空时才调用 onClear
        if (changedValues.searchQuery === '') {
          onClear();
        }
      }
    }
  };

  // 处理清空
  const handleClear = () => {
    formRef.current?.setFieldsValue({ searchQuery: '' });
    setShowSuggestions(false);
    onClear();
  };

  // 生成搜索建议选项
  const generateOptions = (inputValue: string) => {
    const options: any[] = [];

    // 添加搜索历史
    if (showHistory && history.length > 0 && inputValue?.trim()) {
      const filteredHistory = history.filter(item => 
        item.toLowerCase().includes(inputValue.toLowerCase())
      );
      
      if (filteredHistory.length > 0) {
        options.push(...filteredHistory.map(item => ({
          value: item,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <HistoryOutlined style={{ color: '#999' }} />
                <span>{item}</span>
              </Space>
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
        })));
      }
    }

    // 添加搜索建议
    if (suggestions.length > 0) {
      options.push(...suggestions.map(item => ({
        value: item,
        label: (
          <Space>
            <SearchOutlined style={{ color: '#999' }} />
            <span>{item}</span>
          </Space>
        )
      })));
    }

    return options;
  };

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

  // 使用 useMemo 确保 initialValues 只在必要时重新计算
  const initialValues = React.useMemo(() => ({
    searchQuery: value,
    searchMode: searchMode
  }), []); // 空依赖数组，只在组件首次渲染时计算

  // 使用 useEffect 来同步外部 props 到表单
  useEffect(() => {
    if (formRef.current) {
      formRef.current.setFieldsValue({
        searchQuery: value,
        searchMode: searchMode
      });
    }
  }, [value, searchMode]);

  return (
    <div className={`${className} search-form-controls`}>
      <ProForm
        formRef={formRef}
        layout="horizontal"
        submitter={false}
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        initialValues={initialValues}
        autoFocusFirstInput={false}
        preserve={false}
      >
        <div className={styles.searchContainer}>
          {/* 搜索模式选择器 */}
          <div style={{ flexShrink: 0 }}>
            <ProFormSelect
              name="searchMode"
              width={120}
              options={Object.entries(SEARCH_MODE_CONFIG).map(([mode, config]) => ({
                label: (
                  <Space size={4} style={{ height: '20px', lineHeight: '20px' }}>
                    <span style={{ fontSize: '12px', lineHeight: '20px' }}>{config.icon}</span>
                    <span style={{ fontSize: '14px', lineHeight: '20px' }}>{config.label}</span>
                  </Space>
                ),
                value: mode
              }))}
              fieldProps={{
                size: 'middle',
                disabled: disabled,
                style: { 
                  minWidth: 120,
                  maxHeight: '32px',
                  overflow: 'hidden'
                },
                optionLabelProp: 'label'
              }}
              tooltip={SEARCH_MODE_CONFIG[searchMode].description}
            />
          </div>

          {/* 搜索输入框 */}
          <div style={{ flex: 1 }}>
            <ProFormText
              name="searchQuery"
              placeholder={placeholder}
              fieldProps={{
                size: 'middle',
                style: { width: '100%' },
                disabled: disabled,
                prefix: isSearching ? 
                  <LoadingOutlined style={{ color: '#1890ff' }} /> : 
                  <SearchOutlined style={{ color: '#999' }} />,
                suffix: (
                  <Space size={4}>
                    <Button
                      type="text"
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={handleClear}
                      style={{ color: '#999' }}
                    />
                  </Space>
                ),
                onPressEnter: () => {
                  const values = formRef.current?.getFieldsValue();
                  if (values) {
                    handleFinish(values);
                  }
                },
                autoComplete: 'off'
              }}
            />
          </div>

          {/* 历史清空按钮 */}
          {showHistory && history.length > 0 && (
            <div style={{ flexShrink: 0 }}>
              <Tooltip title="清空搜索历史">
                <Button
                  icon={<HistoryOutlined />}
                  onClick={clearHistory}
                  disabled={disabled}
                />
              </Tooltip>
            </div>
          )}
        </div>
      </ProForm>

      {/* 性能信息和搜索模式标签 */}
      {(performanceInfo || searchMode !== SearchMode.AUTO) && (
        <div style={{ 
          marginTop: 8, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8
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

      {/* 快捷搜索标签 */}
      {formRef.current?.getFieldValue('searchQuery') && suggestions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
            快捷搜索:
          </Text>
          <Space size={4} wrap>
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <Tag
                key={index}
                style={{ cursor: 'pointer', fontSize: 11 }}
                onClick={() => {
                  formRef.current?.setFieldsValue({ searchQuery: suggestion });
                  handleFinish({ searchQuery: suggestion, searchMode });
                }}
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