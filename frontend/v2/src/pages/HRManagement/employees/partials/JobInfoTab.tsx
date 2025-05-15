import React from 'react';
import { Descriptions, Tag, Spin } from 'antd';
import type { Employee } from '../../types'; // Adjusted path
import { EmploymentStatus, EmploymentType } from '../../types'; // Adjusted path
import dayjs from 'dayjs';

interface JobInfoTabProps {
  employee: Employee | null | undefined;
  loading?: boolean;
}

const JobInfoTab: React.FC<JobInfoTabProps> = ({ employee, loading }) => {
  if (loading) {
    return (
      <Spin>
        <div style={{ height: 200, padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>Loading job information...</div>
      </Spin>
    );
  }

  if (!employee) {
    return <p>No employee job data available.</p>;
  }

  // Helper function to calculate seniority (example)
  const calculateSeniority = (hireDate?: string, officialWorkStartDate?: string): string => {
    const startDateToConsider = officialWorkStartDate || hireDate;
    if (!startDateToConsider) return 'N/A';
    const start = dayjs(startDateToConsider);
    const now = dayjs();
    const years = now.diff(start, 'year');
    start.add(years, 'year');
    const months = now.diff(start, 'month');
    return `${years} 年 ${months} 个月`;
  };

  const getEmploymentTypeText = (type?: EmploymentType) => {
    if (!type) return 'N/A';
    switch (type) {
      case EmploymentType.FULL_TIME: return '全职';
      case EmploymentType.PART_TIME: return '兼职';
      case EmploymentType.CONTRACT: return '合同';
      case EmploymentType.INTERN: return '实习';
      default: return 'N/A';
    }
  };

  return (
    <Descriptions title="职位信息" bordered column={2} layout="vertical">
      <Descriptions.Item label="部门">{employee.departmentName || 'N/A'}</Descriptions.Item>
      <Descriptions.Item label="职位">{employee.positionName || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="直属经理">{employee.directManagerName || 'N/A'}</Descriptions.Item>
      <Descriptions.Item label="工作地点">{employee.workLocation || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="入职日期">{employee.hireDate || 'N/A'}</Descriptions.Item>
      <Descriptions.Item label="正式工作开始日期">{employee.officialWorkStartDate || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="当前状态">
        {employee.status ? <Tag color={employee.status === EmploymentStatus.ACTIVE ? 'green' : (employee.status === EmploymentStatus.ON_LEAVE ? 'orange' : 'volcano')}>{employee.status}</Tag> : 'N/A'}
      </Descriptions.Item>
      <Descriptions.Item label="雇佣类型">{getEmploymentTypeText(employee.employmentType) || 'N/A'}
      </Descriptions.Item>

      <Descriptions.Item label="工龄 (司龄)">{calculateSeniority(employee.hireDate, employee.officialWorkStartDate)}</Descriptions.Item>
      <Descriptions.Item label="人员身份">{employee.personnelIdentity || 'N/A'}</Descriptions.Item>
    </Descriptions>
  );
};

export default JobInfoTab;