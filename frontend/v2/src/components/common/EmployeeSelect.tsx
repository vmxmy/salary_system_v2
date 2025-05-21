import React, { useState, useEffect, useMemo } from 'react';
import { Select, Spin, Empty, Typography } from 'antd';
import type { SelectProps } from 'antd';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../pages/HRManagement/types';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  // 缓存选中的员工数据，用于显示选中值和触发onChange回调
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // 当value改变时，获取员工详情
  useEffect(() => {
    if (value && (!selectedEmployee || selectedEmployee.id !== value)) {
      const fetchEmployee = async () => {
        try {
          const employee = await employeeService.getEmployeeById(String(value));
          if (employee) {
            setSelectedEmployee(employee);
          }
        } catch (error) {
          console.error('获取员工详情失败:', error);
        }
      };
      fetchEmployee();
    } else if (!value) {
      setSelectedEmployee(null);
    }
  }, [value, selectedEmployee]);

  // 搜索员工函数
  const searchEmployees = async (name: string) => {
    if (!name) {
      setEmployees([]);
      return;
    }

    setLoading(true);
    try {
      // 通过姓名搜索员工
      const response = await employeeService.getEmployees({ name, pageSize: 20 });
      console.log('搜索员工结果:', JSON.stringify(response.data, null, 2));
      
      // 确保每个员工对象都包含必要的信息
      const employeesWithDetails = await Promise.all(
        response.data.map(async (emp) => {
          // 如果员工缺少部门、人员身份或实际任职信息，则尝试获取详情
          if (!emp.departmentName && !(emp as any).department_name && 
              (!emp.personnel_category_name || !emp.actual_position_name)) {
            try {
              const details = await employeeService.getEmployeeById(String(emp.id));
              console.log(`获取员工 ${emp.id} 的详细信息:`, details);
              return details || emp;
            } catch (err) {
              console.error(`获取员工 ${emp.id} 详情失败:`, err);
              return emp;
            }
          }
          return emp;
        })
      );
      
      setEmployees(employeesWithDetails || []);
    } catch (error) {
      console.error('搜索员工失败:', error);
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
      const personnelCategoryName = employee.personnel_category_name || '';
      const positionName = employee.actual_position_name || '';
      
      // 完整的员工信息标签
      const label = (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}>
            {`${employee.last_name || ''}${employee.first_name || ''}`}
            {showEmployeeCode && employee.employee_code && ` (${employee.employee_code})`}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {[departmentName, personnelCategoryName, positionName]
              .filter(Boolean)
              .join(' | ')}
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
            <div style={{ marginTop: '8px' }}>{t('common:status.loading')}</div>
          </div>
        ) : employees.length === 0 && searchText ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description={t('employee:common.no_employee_found')}
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
      console.warn('EmployeeSelect: 多选模式未实现');
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