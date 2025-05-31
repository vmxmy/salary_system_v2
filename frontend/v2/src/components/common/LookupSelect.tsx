import React, { useState, useEffect } from 'react';
import { Select, Spin, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { lookupService } from '../../services/lookupService';
import type { LookupItem, Department, PersonnelCategory } from '../../pages/HRManagement/types';

const { Option } = Select;

// 支持的查找类型
export type LookupType = 
  | 'employee_status'
  | 'gender'
  | 'education_level'
  | 'employment_type'
  | 'contract_type'
  | 'marital_status'
  | 'political_status'
  | 'department'
  | 'personnel_category'
  | 'position';

// 查找类型配置
const LOOKUP_CONFIG = {
  employee_status: {
    service: 'getEmployeeStatusesLookup',
    placeholder: 'lookup_select.placeholder.employee_status',
    allowClear: true,
    isTree: false,
  },
  gender: {
    service: 'getGenderLookup',
    placeholder: 'lookup_select.placeholder.gender',
    allowClear: true,
    isTree: false,
  },
  education_level: {
    service: 'getEducationLevelsLookup',
    placeholder: 'lookup_select.placeholder.education_level',
    allowClear: true,
    isTree: false,
  },
  employment_type: {
    service: 'getEmploymentTypesLookup',
    placeholder: 'lookup_select.placeholder.employment_type',
    allowClear: true,
    isTree: false,
  },
  contract_type: {
    service: 'getContractTypesLookup',
    placeholder: 'lookup_select.placeholder.contract_type',
    allowClear: true,
    isTree: false,
  },
  marital_status: {
    service: 'getMaritalStatusesLookup',
    placeholder: 'lookup_select.placeholder.marital_status',
    allowClear: true,
    isTree: false,
  },
  political_status: {
    service: 'getPoliticalStatusesLookup',
    placeholder: 'lookup_select.placeholder.political_status',
    allowClear: true,
    isTree: false,
  },
  department: {
    service: 'getDepartmentsLookup',
    placeholder: 'lookup_select.placeholder.department',
    allowClear: true,
    isTree: true,
  },
  personnel_category: {
    service: 'getPersonnelCategoriesLookup',
    placeholder: 'lookup_select.placeholder.personnel_category',
    allowClear: true,
    isTree: true,
  },
  position: {
    service: 'getPositionsLookup',
    placeholder: 'lookup_select.placeholder.position',
    allowClear: true,
    isTree: true,
  },
} as const;

interface LookupSelectProps {
  /** 查找类型 */
  lookupType: LookupType;
  /** 当前值 */
  value?: number | null;
  /** 值变化回调 */
  onChange?: (value: number | null) => void;
  /** 自定义占位符 */
  placeholder?: string;
  /** 是否允许清空 */
  allowClear?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 选择器样式 */
  style?: React.CSSProperties;
  /** 选择器类名 */
  className?: string;
  /** 选择器大小 */
  size?: 'small' | 'middle' | 'large';
  /** 是否显示搜索 */
  showSearch?: boolean;
  /** 过滤函数 */
  filterOption?: (input: string, option?: any) => boolean;
  /** 自定义渲染选项 */
  optionRender?: (item: LookupItem | Department | PersonnelCategory) => React.ReactNode;
  /** 是否在组件挂载时立即加载数据 */
  autoLoad?: boolean;
  /** 数据加载完成回调 */
  onDataLoaded?: (data: any[]) => void;
  /** 错误处理回调 */
  onError?: (error: Error) => void;
}

const LookupSelect: React.FC<LookupSelectProps> = ({
  lookupType,
  value,
  onChange,
  placeholder,
  allowClear,
  disabled = false,
  style,
  className,
  size = 'middle',
  showSearch = true,
  filterOption,
  optionRender,
  autoLoad = true,
  onDataLoaded,
  onError,
}) => {
  const { t } = useTranslation(['common', 'hr']);
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  
  // 获取配置
  const config = LOOKUP_CONFIG[lookupType];
  
  // 加载数据
  const loadData = async () => {
    if (!config) {
      const error = new Error(`Unsupported lookup type: ${lookupType}`);
      console.error('❌ LookupSelect:', error.message);
      onError?.(error);
      return;
    }
    
    setLoading(true);
    try {
      console.log({t('components:auto__lookupselect__lookuptype__f09f94')});
      
      // 调用对应的服务方法
      const serviceMethod = lookupService[config.service as keyof typeof lookupService] as () => Promise<any[]>;
      const data = await serviceMethod();
      
      console.log({t('components:auto__lookupselect_lookuptype__e29c85')}, {
        count: data.length,
        sample: data.slice(0, 3)
      });
      
      setOptions(data);
      onDataLoaded?.(data);
    } catch (error) {
      console.error({t('components:auto__lookupselect_lookuptype___e29d8c')}, error);
      message.error(t('lookup_select.error.load_failed', { type: lookupType }));
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };
  
  // 组件挂载时加载数据
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [lookupType, autoLoad]);
  
  // 处理值变化
  const handleChange = (newValue: number | null) => {
    console.log({t('components:auto__lookupselect_lookuptype___f09f8e')}, newValue);
    onChange?.(newValue);
  };
  
  // 默认过滤函数
  const defaultFilterOption = (input: string, option?: any) => {
    const searchText = input.toLowerCase();
    const label = option?.label?.toLowerCase() || '';
    const code = option?.code?.toLowerCase() || '';
    return label.includes(searchText) || code.includes(searchText);
  };
  
  // 渲染树形选项（用于部门、人员类别等）
  const renderTreeOptions = (items: any[], level = 0): React.ReactNode[] => {
    return items.map(item => {
      const indent = '　'.repeat(level); // 使用全角空格缩进
      const label = `${indent}${item.name || item.label}`;
      
      const optionNode = (
        <Option key={item.id || item.value} value={item.id || item.value} label={label}>
          {optionRender ? optionRender(item) : label}
        </Option>
      );
      
      // 如果有子项，递归渲染
      const childNodes = item.children && item.children.length > 0 
        ? renderTreeOptions(item.children, level + 1)
        : [];
      
      return [optionNode, ...childNodes];
    }).flat();
  };
  
  // 渲染普通选项
  const renderFlatOptions = (items: any[]): React.ReactNode[] => {
    return items.map(item => (
      <Option 
        key={item.id || item.value} 
        value={item.id || item.value}
        label={item.name || item.label}
      >
        {optionRender ? optionRender(item) : (item.name || item.label)}
      </Option>
    ));
  };
  
  // 获取占位符文本
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return t(config.placeholder, { defaultValue: {t('components:auto__lookuptype__e8afb7')} });
  };
  
  return (
    <Select
      value={value}
      onChange={handleChange}
      placeholder={getPlaceholder()}
      allowClear={allowClear ?? config.allowClear}
      disabled={disabled}
      loading={loading}
      style={style}
      className={className}
      size={size}
      showSearch={showSearch}
      filterOption={filterOption || defaultFilterOption}
      notFoundContent={loading ? <Spin size="small" /> : t('lookup_select.no_data')}
    >
      {config.isTree ? renderTreeOptions(options) : renderFlatOptions(options)}
    </Select>
  );
};

export default LookupSelect; 