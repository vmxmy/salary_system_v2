import React from 'react';
import { Space, DatePicker, Typography } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { ControlOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { PayrollPeriodResponse } from '../types/simplePayroll';

const { Text } = Typography;

interface PayrollControlsProps {
  currentPeriod?: PayrollPeriodResponse | null;
  handleDateChange: (year: number, month: number) => void;
}

export const PayrollControls: React.FC<PayrollControlsProps> = ({
  currentPeriod,
  handleDateChange
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);

  return (
    <ProCard
      title={
        <Space>
          <ControlOutlined />
          {t('simplePayroll:controls.title')}
        </Space>
      }
      bordered
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 工资期间选择 */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('simplePayroll:controls.period')}
          </Text>
          <DatePicker
            picker="month"
            value={currentPeriod ? dayjs(currentPeriod.start_date) : dayjs()}
            onChange={(date) => {
              if (date) {
                handleDateChange(date.year(), date.month() + 1);
              }
            }}
            style={{ width: '100%' }}
            size="large"
            format="YYYY年MM月"
            placeholder={t('simplePayroll:controls.selectPeriod')}
            allowClear={false}
            className="custom-date-picker"
          />
        </div>
      </Space>
    </ProCard>
  );
}; 