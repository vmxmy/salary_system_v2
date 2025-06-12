import React, { useState, useEffect, useMemo } from 'react';
import { Select, Spin, Empty, Typography } from 'antd';
import type { SelectProps } from 'antd';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../pages/HRManagement/types';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';
import { employeeManagementApi } from '../../pages/EmployeeManagement/services/employeeManagementApi';

const { Text } = Typography;

// 创建自定义的 SelectOption 类型，扩展DefaultOptionType
interface EmployeeOption {
  label: React.ReactNode;
  value: number;
  key: React.Key;
  employee: Employee;
}

export interface EmployeeSelectProps extends Omit<SelectProps<number, EmployeeOption>, 'onChange' | 'options'> {
  placeholder?: string;
  onChange?: (value: number, employee: Employee) => void;
  disabled?: boolean;
  allowClear?: boolean;
  defaultValue?: number;
  value?: number;
  style?: React.CSSProperties;
  className?: string;
  showEmployeeCode?: boolean;
  size?: 'large' | 'middle' | 'small';
}

const EmployeeSelect: React.FC<EmployeeSelectProps> = ({
  placeholder,
  onChange,
  disabled = false,
  allowClear = true,
  defaultValue,
  value,
  style,
  className,
  showEmployeeCode = false,
  size = 'middle',
  ...restProps
}) => {
  const { t } = useTranslation(['common', 'employee']);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  // 缓存选中的员工数据，用于显示选中值和触发onChange回调
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | any | null>(null);

  // 当value改变时，获取员工详情
  useEffect(() => {
    if (value && (!selectedEmployee || selectedEmployee.id !== value)) {
      const fetchEmployee = async () => {
        try {
          const employee = await employeeManagementApi.getEmployeeById(String(value));
          if (employee) {
            setSelectedEmployee(employee);
          }
        } catch (error) {
          
        }
      };
      fetchEmployee();
    } else if (!value) {
      setSelectedEmployee(null);
    }
  }, [value, selectedEmployee]);

  // 搜索员工函数
  const searchEmployees = async (name: string) => {
    setLoading(true);
    try {
      // 搜索员工 - 如果name为空，则加载前100个员工作为初始选项
      const query = name ? { name, size: 50 } : { size: 100 };
      const response = await employeeService.getEmployees(query);
      
      // 确保每个员工对象都包含必要的信息
      const employeesWithDetails = await Promise.all(
        response.data.map(async (emp) => {
          // 如果员工缺少部门、人员身份或实际任职信息，则尝试获取详情
          if (!emp.departmentName && !(emp as any).department_name && 
              (!emp.personnelCategoryName || !emp.actual_position_name)) {
            try {
              const details = await employeeManagementApi.getEmployeeById(String(emp.id));
              return details || emp;
            } catch (err) {
              return emp;
            }
          }
          return emp;
        })
      );
      
      setEmployees(employeesWithDetails || []);
      console.log(`✅ [EmployeeSelect] 加载员工成功: ${employeesWithDetails?.length || 0} 个员工`);
    } catch (error) {
      console.error('❌ [EmployeeSelect] 加载员工失败:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // 使用 debounce 防止频繁请求
  const debouncedSearch = useMemo(
    () => debounce(searchEmployees, 300),
    []
  );

  // 组件挂载时加载初始数据
  useEffect(() => {
    searchEmployees(''); // 加载初始员工列表
  }, []);

  // 处理搜索输入变化
  const handleSearch = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  // 处理选择员工
  const handleChange = (value: number, option: EmployeeOption) => {
    // 如果有传入的onChange函数，调用它并传递选中的员工数据
    if (onChange && option && option.employee) {
      onChange(value, option.employee);
    }
  };

  // 构建选项
  const options = useMemo(() => {
    return employees.map(employee => {
      const departmentName = employee.departmentName || '';
      const personnelCategoryName = employee.personnelCategoryName || '';
      const positionName = employee.actual_position_name || '';
      
      // 完整的员工信息标签
      const fullName = `${employee.last_name || ''}${employee.first_name || ''}`.trim();
      const employeeCodeDisplay = showEmployeeCode && employee.employee_code ? ` (${employee.employee_code})` : '';
      const employeeIdDisplay = !employee.employee_code ? ` [ID:${employee.id}]` : '';
      
      const label = (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}>
            {fullName || '未知员工'}
            {employeeCodeDisplay}
            {employeeIdDisplay}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {[departmentName, personnelCategoryName, positionName]
              .filter(Boolean)
              .join(' | ') || '无部门信息'}
          </div>
        </div>
      );

      return {
        label,
        value: employee.id,
        key: employee.id,
        employee, // 保存完整的员工对象
      };
    });
  }, [employees, showEmployeeCode]);

  // 自定义下拉内容
  const dropdownRender = (menu: React.ReactElement) => {
    return (
      <div>
        {loading ? (
          <div style={{ padding: '8px', textAlign: 'center' }}>
            <Spin size="small" />
            <div style={{ marginTop: '8px' }}>t('common:status.loading')</div>
          </div>
        ) : employees.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description={searchText ? t('employee:common.no_employee_found') : '暂无员工数据'}
            style={{ padding: '16px' }}
          />
        ) : (
          menu
        )}
      </div>
    );
  };

  // 转换原生Select的onChange事件处理
  const internalChangeHandler: SelectProps<number, EmployeeOption>['onChange'] = (value, option) => {
    if (Array.isArray(option)) {
      // 多选模式，当前组件不支持
      return;
    }
    
    if (option && !Array.isArray(option)) {
      handleChange(value as number, option);
    }
  };

  return (
    <Select<number, EmployeeOption>
      showSearch
      placeholder={placeholder || t('employee:common.select_employee')}
      defaultValue={defaultValue}
      value={value}
      onChange={internalChangeHandler}
      onSearch={handleSearch}
      filterOption={false}
      notFoundContent={null}
      options={options}
      loading={loading}
      disabled={disabled}
      allowClear={allowClear}
      style={{ width: '100%', ...style }}
      className={className}
      size={size}
      optionLabelProp="label"
      dropdownRender={dropdownRender}
      {...restProps}
    />
  );
};

export default EmployeeSelect; 