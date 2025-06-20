import React, { useState } from 'react';
import { Card, Row, Col, Space, Tag, Button } from 'antd';
import { SearchOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ProFormGlobalSearch } from './ProFormGlobalSearch';
import { SearchMode } from '../../utils/searchUtils';

interface SearchPanelProps {
  // 搜索状态
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
  
  // 事件处理
  onSearch: (query: string) => void;
  onClear: () => void;
  onSearchModeChange: (mode: SearchMode) => void;
  
  // 配置
  placeholder?: string;
  showPerformance?: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
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
  placeholder = "搜索员工姓名、编号、部门、职位...",
  showPerformance = true
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [searchCardCollapsed, setSearchCardCollapsed] = useState(false);

  return (
    <Card 
      title={
        <Row justify="space-between" align="middle" wrap={false}>
          <Col flex="auto">
            <Space wrap size={4} align="center">
              <SearchOutlined />
              <span>智能搜索</span>
              {!isEmptyQuery && (
                <Tag color="blue" style={{ margin: 0 }}>
                  {totalResults} 条结果
                  {performance.isOptimal && <span style={{ color: '#52c41a' }}> ⚡</span>}
                </Tag>
              )}
              {isEmptyQuery && (
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '2px' }}>
                  💡 支持多关键词搜索，用空格分隔
                </span>
              )}
            </Space>
          </Col>
          <Col flex="none">
            <Button 
              type="text" 
              size="small"
              onClick={() => setSearchCardCollapsed(!searchCardCollapsed)}
              icon={searchCardCollapsed ? <DownOutlined /> : <UpOutlined />}
              style={{ 
                padding: '2px 6px',
                height: 'auto',
                lineHeight: 1
              }}
            >
              <span 
                style={{ fontSize: '12px' }}
                className="search-card-toggle-text"
              >
                {searchCardCollapsed ? '展开' : '收起'}
              </span>
            </Button>
          </Col>
        </Row>
      }
      size="small"
      style={{ 
        marginBottom: 16,
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}
      styles={{ 
        header: {
          padding: '6px 12px',
          minHeight: 'auto',
          borderBottom: searchCardCollapsed ? '0px' : '1px solid #f0f0f0'
        },
        body: {
          padding: searchCardCollapsed ? 0 : '6px 8px',
          backgroundColor: '#fafafa'
        }
      }}
    >
      {!searchCardCollapsed && (
        <Row style={{ margin: 0 }}>
          <Col span={24} style={{ padding: 0 }}>
            <ProFormGlobalSearch
              value={searchQuery}
              onSearch={onSearch}
              onClear={onClear}
              suggestions={suggestions}
              searchMode={searchMode}
              onSearchModeChange={onSearchModeChange}
              isSearching={isSearching}
              totalResults={totalResults}
              searchTime={searchTime}
              showPerformance={showPerformance}
              placeholder={placeholder}
            />
          </Col>
        </Row>
      )}
    </Card>
  );
};