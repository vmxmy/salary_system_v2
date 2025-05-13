import React, { useState } from 'react';
import { Button, Modal, List, Typography, Switch, Space, Divider } from 'antd';
import { QuestionCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTour } from '../../context/TourContext';

const { Title, Text } = Typography;

// 定义系统中所有可用的引导
export const AVAILABLE_TOURS = {
  SALARY_VIEWER: 'salary_viewer',
  FILE_CONVERTER: 'file_converter',
  MAPPING_CONFIGURATOR: 'mapping_configurator',
  EMPLOYEE_MANAGER: 'employee_manager',
  DEPARTMENT_MANAGER: 'department_manager',
  MONTHLY_SALARY_REPORT: 'monthly_salary_report',
  EMAIL_CONFIG: 'email_config',
  SEND_PAYSLIP: 'send_payslip',
};

// 引导信息
interface TourInfo {
  id: string;
  name: string;
  description: string;
  path: string;
}

// 所有引导的信息
const TOUR_INFO: TourInfo[] = [
  {
    id: AVAILABLE_TOURS.SALARY_VIEWER,
    name: '工资数据查看器',
    description: '了解如何查看、筛选和导出工资数据',
    path: '/viewer',
  },
  {
    id: AVAILABLE_TOURS.FILE_CONVERTER,
    name: '文件导入',
    description: '了解如何导入工资数据文件',
    path: '/data-import/converter',
  },
  {
    id: AVAILABLE_TOURS.MAPPING_CONFIGURATOR,
    name: '字段映射配置',
    description: '了解如何配置字段映射规则',
    path: '/config/mappings',
  },
  {
    id: AVAILABLE_TOURS.EMPLOYEE_MANAGER,
    name: '员工管理',
    description: '了解如何管理员工信息',
    path: '/admin/employees',
  },
  {
    id: AVAILABLE_TOURS.DEPARTMENT_MANAGER,
    name: '部门管理',
    description: '了解如何管理部门信息',
    path: '/admin/departments',
  },
  {
    id: AVAILABLE_TOURS.MONTHLY_SALARY_REPORT,
    name: '月度工资报表',
    description: '了解如何查看和导出月度工资报表',
    path: '/reports/monthly-salary',
  },
  {
    id: AVAILABLE_TOURS.EMAIL_CONFIG,
    name: '邮件服务器配置',
    description: '了解如何配置邮件服务器',
    path: '/config/email-server',
  },
  {
    id: AVAILABLE_TOURS.SEND_PAYSLIP,
    name: '工资单发送',
    description: '了解如何发送工资单邮件',
    path: '/email-services/send-payslip',
  },
];

interface TourManagerProps {
  /**
   * 是否显示模态框
   */
  visible: boolean;
  /**
   * 关闭模态框的回调
   */
  onClose: () => void;
}

/**
 * 引导管理器组件
 * 用于管理所有引导的状态
 */
const TourManager: React.FC<TourManagerProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { isTourCompleted, resetTour, resetAllTours, getCompletedTours } = useTour();
  const [autoStartTours, setAutoStartTours] = useState<boolean>(
    localStorage.getItem('autoStartTours') !== 'false'
  );

  // 切换自动启动引导的状态
  const toggleAutoStartTours = (checked: boolean) => {
    setAutoStartTours(checked);
    localStorage.setItem('autoStartTours', checked.toString());
  };

  // 获取已完成的引导
  const completedTours = getCompletedTours();

  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined />
          {t('tourManager.title', '功能引导管理')}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="reset" danger icon={<ReloadOutlined />} onClick={resetAllTours}>
          {t('tourManager.resetAll', '重置所有引导')}
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          {t('common.close', '关闭')}
        </Button>,
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text>{t('tourManager.autoStart', '自动启动引导')}:</Text>
            <Switch checked={autoStartTours} onChange={toggleAutoStartTours} />
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            {t('tourManager.autoStartHint', '启用后，首次访问页面时将自动显示引导')}
          </Text>
        </div>

        <Divider />

        <Title level={5}>{t('tourManager.availableTours', '可用引导')}</Title>
        <List
          itemLayout="horizontal"
          dataSource={TOUR_INFO}
          renderItem={(item) => {
            const isCompleted = completedTours.includes(item.id);
            return (
              <List.Item
                actions={[
                  <Button
                    key="reset"
                    type="link"
                    onClick={() => resetTour(item.id)}
                    disabled={!isCompleted}
                  >
                    {t('tourManager.reset', '重置')}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {item.name}
                      {isCompleted && (
                        <Text type="success">
                          ({t('tourManager.completed', '已完成')})
                        </Text>
                      )}
                    </Space>
                  }
                  description={item.description}
                />
              </List.Item>
            );
          }}
        />
      </Space>
    </Modal>
  );
};

export default TourManager;
