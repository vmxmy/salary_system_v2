import React, { useEffect, useState } from 'react';
import { Tag, Tooltip, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Employee } from '../../pages/HRManagement/types';
import employeeCacheService from '../../services/employeeCacheService';
import { employeeService } from '../../services/employeeService';
import '../../styles/utils/employeeName.css';

interface EmployeeNameProps {
  employeeId: number | string | null;
  employeeName?: string | null;
  showId?: boolean;
  showLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 员工姓名显示组件
 * 根据配置自动处理名称显示、ID显示和加载状态
 */
const EmployeeName: React.FC<EmployeeNameProps> = ({
  employeeId,
  employeeName,
  showId = true,
  showLoading = true,
  className = '',
  style
}) => {
  const { t } = useTranslation(['common', 'employee']);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string | null>(employeeName || null);

  useEffect(() => {
    // 如果已经有名称，直接使用
    if (employeeName) {
      setName(employeeName);
      return;
    }

    // 如果没有员工ID，无法获取名称
    if (!employeeId) {
      setName(null);
      return;
    }

    const idString = String(employeeId);

    // 尝试从缓存获取员工名称
    const cachedName = employeeCacheService.getEmployeeNameById(idString);
    if (cachedName) {
      setName(cachedName);
      return;
    }

    // 如果缓存中没有，则从API获取
    const fetchEmployeeData = async () => {
      if (!showLoading) return; // 如果不显示加载状态，则不自动获取数据
      
      setLoading(true);
      try {
        const employee = await employeeService.getEmployeeByIdFromView(idString);
        if (employee) {
          // 缓存员工信息
          employeeCacheService.saveEmployee(employee as any);
          // 更新名称状态
          setName(employeeCacheService.getEmployeeFullName(employee as any));
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId, employeeName, showLoading]);

  // 渲染员工名称或ID或占位符
  const renderContent = () => {
    if (loading) {
      return <Spin size="small" />;
    }

    if (name) {
      return (
        <span className="employee-name">
          {name}
          {showId && employeeId && (
            <span className="employee-id">({employeeId})</span>
          )}
        </span>
      );
    }

    if (employeeId) {
      return <span>{t('employee:employee_id_format', { id: employeeId })}</span>;
    }

    return <Tag>{t('common:unavailable')}</Tag>;
  };

  return (
    <div className={`employee-name-component ${className}`} style={style}>
      {renderContent()}
    </div>
  );
};

export default EmployeeName; 