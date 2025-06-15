import React, { useState, useEffect } from 'react';
import { 
  QueryFilter,
  ProFormText,
  ProFormSelect,
  ProFormDateRangePicker,
  ProFormDigitRange,
  ProFormDependency
} from '@ant-design/pro-components';
import { 
  Space, 
  Tag, 
  Button, 
  Tooltip,
  Badge,
  Typography,
  AutoComplete,
  Form,
  Card
} from 'antd';
import { 
  SearchOutlined, 
  ClearOutlined, 
  HistoryOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { SearchMode } from '../../utils/searchUtils';
import { useSearchHistory } from '../../hooks/usePayrollSearch';

const { Text } = Typography;

// 高级搜索表单属性接口
export interface AdvancedSearchFormProps {
  onSearch: (values: any) => void;
  onReset: () => void;
  loading?: boolean;
  totalResults?: number;
  searchTime?: number;
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// 搜索模式配置
const SEARCH_MODE_OPTIONS = [
  { label: '智能搜索', value: 'auto', icon: <ThunderboltOutlined /> },
  { label: '模糊搜索', value: 'fuzzy', icon: <SearchOutlined /> },
  { label: '精确搜索', value: 'exact', icon: <FilterOutlined /> }
];

// 部门选项（示例数据，实际应该从API获取）
const DEPARTMENT_OPTIONS = [
  { label: '人事部', value: '人事部' },
  { label: '财务部', value: '财务部' },
  { label: '技术部', value: '技术部' },
  { label: '市场部', value: '市场部' },
  { label: '运营部', value: '运营部' }
];

// 职位选项（示例数据）
const POSITION_OPTIONS = [
  { label: '经理', value: '经理' },
  { label: '主管', value: '主管' },
  { label: '专员', value: '专员' },
  { label: '助理', value: '助理' }
];

// 人员类别选项
const PERSONNEL_CATEGORY_OPTIONS = [
  { label: '正式员工', value: '正式员工' },
  { label: '合同工', value: '合同工' },
  { label: '临时工', value: '临时工' },
  { label: '实习生', value: '实习生' }
];

/**
 * 高级搜索表单组件
 */
export const AdvancedSearchForm: React.FC<AdvancedSearchFormProps> = ({
  onSearch,
  onReset,
  loading = false,
  totalResults = 0,
  searchTime = 0,
  className,
  collapsed = false,
  onCollapsedChange
}) => {
  const [form] = Form.useForm();
  const { history, addToHistory } = useSearchHistory();

  // 处理搜索提交
  const handleFinish = async (values: any) => {
    console.log('🔍 [AdvancedSearchForm] 搜索参数:', values);
    
    // 记录搜索历史
    if (values.keyword?.trim()) {
      addToHistory(values.keyword.trim());
    }
    
    // 过滤空值
    const filteredValues = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) return acc;
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    onSearch(filteredValues);
    return Promise.resolve();
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  // 生成关键词搜索建议
  const generateKeywordOptions = (inputValue: string) => {
    if (!inputValue?.trim()) return [];
    
    const filteredHistory = history.filter(item => 
      item.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    return filteredHistory.map(item => ({
      value: item,
      label: (
        <Space>
          <HistoryOutlined style={{ color: '#999' }} />
          <span>{item}</span>
        </Space>
      )
    }));
  };

  return (
    <div className={className}>
      <QueryFilter
        form={form}
        onFinish={handleFinish}
        onReset={handleReset}
        submitter={{
          searchConfig: {
            resetText: '重置',
            submitText: '搜索'
          },
          resetButtonProps: {
            icon: <ClearOutlined />
          },
          submitButtonProps: {
            icon: <SearchOutlined />,
            loading: loading
          }
        }}
        collapsed={collapsed}
        onCollapse={onCollapsedChange}
        defaultCollapsed={false}
        labelWidth="auto"
        span={6}
        split
      >
        {/* 关键词搜索 */}
        <ProFormText
          name="keyword"
          label="关键词"
          placeholder="搜索员工姓名、编号、部门、职位..."
          fieldProps={{
            prefix: <SearchOutlined style={{ color: '#999' }} />,
            allowClear: true
          }}
          // 简化为普通输入框
          fieldProps={{
            prefix: <SearchOutlined style={{ color: '#999' }} />,
            allowClear: true,
            placeholder: "搜索员工姓名、编号、部门、职位...",
            style: { width: '100%' }
          }}
        />

        {/* 搜索模式 */}
        <ProFormSelect
          name="searchMode"
          label="搜索模式"
          options={SEARCH_MODE_OPTIONS}
          initialValue="auto"
          fieldProps={{
            optionRender: (option) => (
              <Space>
                {option.data.icon}
                {option.data.label}
              </Space>
            )
          }}
        />

        {/* 部门筛选 */}
        <ProFormSelect
          name="department"
          label="部门"
          options={DEPARTMENT_OPTIONS}
          fieldProps={{
            mode: 'multiple',
            placeholder: '选择部门',
            allowClear: true,
            maxTagCount: 2
          }}
        />

        {/* 职位筛选 */}
        <ProFormSelect
          name="position"
          label="职位"
          options={POSITION_OPTIONS}
          fieldProps={{
            mode: 'multiple',
            placeholder: '选择职位',
            allowClear: true,
            maxTagCount: 2
          }}
        />

        {/* 人员类别 */}
        <ProFormSelect
          name="personnelCategory"
          label="人员类别"
          options={PERSONNEL_CATEGORY_OPTIONS}
          fieldProps={{
            mode: 'multiple',
            placeholder: '选择人员类别',
            allowClear: true
          }}
        />

        {/* 薪资范围 */}
        <ProFormDigitRange
          name="salaryRange"
          label="薪资范围"
          fieldProps={{
            placeholder: ['最低薪资', '最高薪资'],
            precision: 2,
            formatter: (value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            parser: (value) => parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0
          }}
        />

        {/* 入职日期范围 */}
        <ProFormDateRangePicker
          name="hireDateRange"
          label="入职日期"
          fieldProps={{
            placeholder: ['开始日期', '结束日期'],
            format: 'YYYY-MM-DD'
          }}
        />

        {/* 薪资期间 */}
        <ProFormText
          name="payrollPeriod"
          label="薪资期间"
          placeholder="如：2024年1月"
          fieldProps={{
            allowClear: true
          }}
        />
      </QueryFilter>

      {/* 搜索结果统计 */}
      {(totalResults > 0 || searchTime > 0) && (
        <Card 
          size="small" 
          style={{ 
            marginTop: 16, 
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef'
          }}
          bodyStyle={{ padding: '8px 16px' }}
        >
          <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
            <Space>
              <Badge count={totalResults} showZero color="blue" />
              <Text type="secondary">条搜索结果</Text>
            </Space>
            
            {searchTime > 0 && (
              <Space>
                <ClockCircleOutlined style={{ color: '#999' }} />
                <Text type="secondary">耗时 {searchTime.toFixed(1)}ms</Text>
                {searchTime < 100 && (
                  <Tag color="success" style={{ margin: 0 }}>高效</Tag>
                )}
              </Space>
            )}
            
            <Space>
              <SettingOutlined style={{ color: '#999' }} />
              <Text type="secondary">
                {collapsed ? '简化模式' : '高级模式'}
              </Text>
            </Space>
          </Space>
        </Card>
      )}

      {/* 表单依赖示例：根据搜索模式显示不同提示 */}
      <ProFormDependency name={['searchMode']}>
        {({ searchMode }) => (
          searchMode && searchMode !== 'auto' && (
            <div style={{ 
              marginTop: 8, 
              padding: '8px 12px', 
              backgroundColor: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '6px',
              fontSize: 12
            }}>
              <Space>
                {searchMode === 'fuzzy' && <SearchOutlined />}
                {searchMode === 'exact' && <FilterOutlined />}
                <Text type="secondary">
                  {searchMode === 'fuzzy' && '模糊搜索：支持拼写错误和部分匹配'}
                  {searchMode === 'exact' && '精确搜索：完全匹配搜索内容'}
                </Text>
              </Space>
            </div>
          )
        )}
      </ProFormDependency>
    </div>
  );
}; 