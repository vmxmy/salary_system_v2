import React from 'react';
import { Descriptions, Tag, Spin } from 'antd';
import type { Employee } from '../../types'; // Adjusted path
import { Gender, EmploymentStatus } from '../../types'; // Adjusted path

interface BasicInfoTabProps {
  employee: Employee | null | undefined;
  loading?: boolean;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ employee, loading }) => {
  if (loading) {
    return (
      <Spin>
        <div style={{ height: 200, padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>Loading basic information...</div>
      </Spin>
    );
  }

  if (!employee) {
    return <p>No employee data available.</p>;
  }

  const getGenderText = (gender?: Gender) => {
    if (!gender) return 'N/A';
    switch (gender) {
      case Gender.MALE: return '男';
      case Gender.FEMALE: return '女';
      case Gender.OTHER: return '其他';
      default: return 'N/A';
    }
  };

  return (
    <Descriptions title="基本信息" bordered column={2} layout="vertical">
      <Descriptions.Item label="姓名">{employee.name || 'N/A'}</Descriptions.Item>
      <Descriptions.Item label="员工工号">{employee.employeeId || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="身份证号">{employee.idCardNumber || 'N/A'}</Descriptions.Item>
      <Descriptions.Item label="出生日期">{employee.dateOfBirth || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="性别">{getGenderText(employee.gender)}</Descriptions.Item>
      <Descriptions.Item label="民族/国籍">{employee.nationality || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="最高学历">{employee.educationLevel || 'N/A'}</Descriptions.Item>
      <Descriptions.Item label="电话号码">{employee.phone || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="电子邮箱" span={2}>{employee.email || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="居住地址" span={2}>{employee.residentialAddress || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="开户行">{employee.bankName || 'N/A'}</Descriptions.Item>
      <Descriptions.Item label="银行账号">{employee.bankAccountNumber || 'N/A'}</Descriptions.Item>

      <Descriptions.Item label="员工状态">
        {employee.status ? <Tag color={employee.status === EmploymentStatus.ACTIVE ? 'green' : 'volcano'}>{employee.status}</Tag> : 'N/A'}
      </Descriptions.Item>
      <Descriptions.Item label="备注" span={2}>{employee.notes || 'N/A'}</Descriptions.Item>
    </Descriptions>
  );
};

export default BasicInfoTab;