import React, { useState, useEffect, useMemo } from 'react';
import { Select, Spin, Avatar, Tag, Space, App } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import { employeeService } from '../../services/employeeService';
import type { Employee, EmployeeQuery } from '../../pages/HRManagement/types';

const { Option } = Select;

interface EmployeeSelectorProps {
  /** 当前值 */
  value?: number | number[] | null;
  /** 值变化回调 */
  onChange?: (value: number | number[] | null) => void;
  /** 是否多选 */
  multiple?: boolean;
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
  /** 部门过滤 */
  departmentFilter?: number[];
  /** 状态过滤 */
  statusFilter?: number[];
  /** 雇佣类型过滤 */
  employmentTypeFilter?: number[];
  /** 自定义过滤函数 */
  customFilter?: (employee: Employee) => boolean;
  /** 自定义渲染选项 */
  optionRender?: (employee: Employee) => React.ReactNode;
  /** 自定义渲染标签（多选模式） */
  tagRender?: (props: any) => React.ReactNode;
  /** 最大显示选项数 */
  maxOptions?: number;
  /** 搜索防抖延迟（毫秒） */
  searchDelay?: number;
  /** 是否在组件挂载时立即加载数据 */
  autoLoad?: boolean;
  /** 数据加载完成回调 */
  onDataLoaded?: (employees: Employee[]) => void;
  /** 错误处理回调 */
  onError?: (error: Error) => void;
  /** 搜索回调 */
  onSearch?: (searchText: string) => void;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  value,
  onChange,
  multiple = false,
  placeholder,
  allowClear = true,
  disabled = false,
  style,
  className,
  size = 'middle',
  showSearch = true,
  departmentFilter,
  statusFilter,
  employmentTypeFilter,
  customFilter,
  optionRender,
  tagRender,
  maxOptions = 100,
  searchDelay = 300,
  autoLoad = true,
  onDataLoaded,
  onError,
  onSearch,
}) => {
  const { t } = useTranslation(['common', 'hr']);
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchText, setSearchText] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce((text: string) => {
      setSearchText(text);
      setCurrentPage(1);
      onSearch?.(text);
    }, searchDelay),
    [searchDelay, onSearch]
  );
  
  // 构建查询参数
  const buildQuery = (page: number, search: string): EmployeeQuery => {
    const query: EmployeeQuery = {
      page,
      size: 50, // 每页50条
    };
    
    if (search.trim()) {
      // 支持按姓名、员工编号搜索
      if (/^\d+$/.test(search.trim())) {
        query.employee_code = search.trim();
      } else {
        query.name = search.trim();
      }
    }
    
    if (departmentFilter && departmentFilter.length > 0) {
      query.department_id = departmentFilter[0].toString(); // API可能只支持单个部门
    }
    
    if (statusFilter && statusFilter.length > 0) {
      query.status_lookup_value_id = statusFilter[0];
    }
    
    if (employmentTypeFilter && employmentTypeFilter.length > 0) {
      query.employment_type_lookup_value_id = employmentTypeFilter[0];
    }
    
    return query;
  };
  
  // 加载员工数据
  const loadEmployees = async (page: number = 1, search: string = '', append: boolean = false) => {
    setLoading(true);
    try {
      console.log({t('components:auto__employeeselector__f09f94')}, { page, search, append });
      
      const query = buildQuery(page, search);
             const response = await employeeService.getEmployees(query);
      
      console.log({t('components:auto__employeeselector__e29c85')}, {
        page,
        count: response.data.length,
        total: response.meta.total,
        hasMore: page < response.meta.totalPages
      });
      
      let newEmployees = response.data;
      
      // 应用自定义过滤器
      if (customFilter) {
        newEmployees = newEmployees.filter(customFilter);
      }
      
      // 限制最大选项数
      if (!append && newEmployees.length > maxOptions) {
        newEmployees = newEmployees.slice(0, maxOptions);
      }
      
      if (append) {
        setEmployees(prev => [...prev, ...newEmployees]);
      } else {
        setEmployees(newEmployees);
      }
      
      setHasMore(page < response.meta.totalPages);
      setCurrentPage(page);
      onDataLoaded?.(newEmployees);
    } catch (error) {
      console.error({t('components:auto__employeeselector___e29d8c')}, error);
      message.error(t('employee_selector.error.load_failed'));
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };
  
  // 组件挂载时加载数据
  useEffect(() => {
    if (autoLoad) {
      loadEmployees(1, '');
    }
  }, [autoLoad, departmentFilter, statusFilter, employmentTypeFilter]);
  
  // 搜索文本变化时重新加载
  useEffect(() => {
    if (searchText !== '') {
      loadEmployees(1, searchText);
    }
  }, [searchText]);
  
  // 处理搜索
  const handleSearch = (text: string) => {
    debouncedSearch(text);
  };
  
  // 处理值变化
  const handleChange = (newValue: number | number[] | null) => {
    console.log({t('components:auto__employeeselector___f09f8e')}, newValue);
    onChange?.(newValue);
  };
  
  // 处理下拉框滚动到底部
  const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { target } = e;
    const element = target as HTMLDivElement;
    
    if (element.scrollTop + element.offsetHeight === element.scrollHeight) {
      // 滚动到底部，加载更多
      if (hasMore && !loading) {
        loadEmployees(currentPage + 1, searchText, true);
      }
    }
  };
  
  // 默认选项渲染
  const defaultOptionRender = (employee: Employee) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar 
        size="small" 
        src={employee.avatar} 
        icon={<UserOutlined />}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>
          {employee.first_name} {employee.last_name}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <Space size={4}>
            <span>{employee.employee_code}</span>
                         {employee.departmentName && (
               <Tag color="blue">{employee.departmentName}</Tag>
             )}
             {employee.actualPositionName && (
               <Tag color="green">{employee.actualPositionName}</Tag>
             )}
          </Space>
        </div>
      </div>
    </div>
  );
  
  // 默认标签渲染（多选模式）
  const defaultTagRender = (props: any): React.ReactElement => {
    const { label, value, closable, onClose } = props;
    const employee = employees.find(emp => emp.id === value);
    
    if (!employee) {
      return <Tag closable={closable} onClose={onClose}>{label}</Tag>;
    }
    
    return (
      <Tag
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        <Space size={4}>
          <Avatar size={16} src={employee.avatar} icon={<UserOutlined />} />
          <span>{employee.first_name} {employee.last_name}</span>
        </Space>
      </Tag>
    );
  };
  
  // 获取占位符文本
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return multiple 
      ? t('employee_selector.placeholder.multiple', { defaultValue: {t('components:auto_text_e8afb7')} })
      : t('employee_selector.placeholder.single', { defaultValue: {t('components:auto_text_e8afb7')} });
  };
  
  return (
    <Select
      mode={multiple ? 'multiple' : undefined}
      value={value}
      onChange={handleChange}
      placeholder={getPlaceholder()}
      allowClear={allowClear}
      disabled={disabled}
      loading={loading}
      style={style}
      className={className}
      size={size}
      showSearch={showSearch}
      searchValue={undefined} // 让组件自己管理搜索值
      onSearch={handleSearch}
      filterOption={false} // 禁用本地过滤，使用服务端搜索
      notFoundContent={loading ? <Spin size="small" /> : t('employee_selector.no_data')}
      onPopupScroll={handlePopupScroll}
      // tagRender={multiple ? (tagRender || defaultTagRender) : undefined}
      dropdownRender={(menu) => (
        <div>
          {menu}
          {hasMore && (
            <div style={{ 
              textAlign: 'center', 
              padding: '8px', 
              color: '#999',
              fontSize: '12px'
            }}>
              {loading ? {t('components:auto___e58aa0')} : {t('components:auto_text_e6bb9a')}}
            </div>
          )}
        </div>
      )}
    >
      {employees.map(employee => (
        <Option 
          key={employee.id} 
          value={employee.id}
          label={`${employee.first_name} ${employee.last_name}`}
        >
          {optionRender ? optionRender(employee) : defaultOptionRender(employee)}
        </Option>
      ))}
    </Select>
  );
};

export default EmployeeSelector; 