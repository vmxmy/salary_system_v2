/**
 * 员工基本信息卡片组件
 */
import React from 'react';
import { Card, Avatar, Tag, Space, Progress } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import TableActionButton from '../../../../components/common/TableActionButton';
import { formatEmployeeName, formatDate, formatStatusTag } from '../utils/formatters';
import { DEFAULT_AVATAR } from '../constants/employeeConstants.tsx';
import type { MyEmployeeInfo } from '../types/employee';
import styles from '../MyInfo.module.less';

interface BasicInfoCardProps {
  /** 员工信息 */
  employeeInfo: MyEmployeeInfo;
  /** 是否加载中 */
  loading?: boolean;
  /** 信息完整度 */
  completeness?: {
    isComplete: boolean;
    completeness?: number;
    missingFields: string[];
  };
  /** 是否可以编辑 */
  canEdit?: boolean;
  /** 编辑按钮点击事件 */
  onEdit?: () => void;
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({
  employeeInfo,
  loading = false,
  completeness,
  canEdit = false,
  onEdit,
}) => {
  const { t } = useTranslation(['myInfo', 'common']);

  // 获取员工状态标签
  const getStatusTag = () => {
    if (!employeeInfo) return null;
    
    // 这里需要根据实际的lookup数据来显示状态
    // 临时使用is_active字段
    if (employeeInfo.is_active ?? true) {
      return <Tag color="success">在职</Tag>;
    } else {
      return <Tag color="error">离职</Tag>;
    }
  };

  // 获取进度条颜色
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#52c41a'; // 绿色
    if (percentage >= 60) return '#faad14'; // 橙色
    return '#ff4d4f'; // 红色
  };

  return (
    <Card
      className={styles.basicInfoCard}
      loading={loading}
      extra={
        canEdit && (
          <TableActionButton
            actionType="edit"
            onClick={onEdit}
            tooltipTitle={t('common:button.edit')}
          >
            {t('edit')}
          </TableActionButton>
        )
      }
      title={
        <Space>
          <UserOutlined />
          {t('basicInfo')}
        </Space>
      }
    >
      <div className={styles.cardContent}>
        {/* 头像区域 */}
        <div className={styles.avatarSection}>
          <Avatar
            size={100}
            src={DEFAULT_AVATAR}
            icon={<UserOutlined />}
            className={styles.avatar}
          />
        </div>

        {/* 信息区域 */}
        <div className={styles.infoSection}>
          <div className={styles.infoGrid}>
            {/* 姓名 */}
            <div className={styles.infoItem}>
              <div className={styles.label}>{t('fields.name')}</div>
              <div className={styles.value}>
                {formatEmployeeName(employeeInfo.first_name || '', employeeInfo.last_name || '')}
              </div>
            </div>

            {/* 员工编号 */}
            <div className={styles.infoItem}>
              <div className={styles.label}>{t('fields.employeeCode')}</div>
              <div className={styles.value}>
                {employeeInfo.employee_code || '--'}
              </div>
            </div>

            {/* 部门 */}
            <div className={styles.infoItem}>
              <div className={styles.label}>{t('fields.department')}</div>
              <div className={styles.value}>
                {employeeInfo.departmentName || '--'}
              </div>
            </div>

            {/* 职位 */}
            <div className={styles.infoItem}>
              <div className={styles.label}>{t('fields.position')}</div>
              <div className={styles.value}>
                {employeeInfo.actual_position_name || '--'}
              </div>
            </div>

            {/* 入职日期 */}
            <div className={styles.infoItem}>
              <div className={styles.label}>{t('fields.hireDate')}</div>
              <div className={styles.value}>
                {formatDate(employeeInfo.hire_date)}
              </div>
            </div>

            {/* 状态 */}
            <div className={styles.infoItem}>
              <div className={styles.label}>{t('fields.status')}</div>
              <div className={styles.value}>
                {getStatusTag()}
              </div>
            </div>
          </div>

          {/* 信息完整度指示器 */}
          {completeness && completeness.completeness !== undefined && (
            <div className={styles.completenessIndicator} style={{ marginTop: 16 }}>
              <Progress
                percent={Math.round(completeness.completeness)}
                strokeColor={getProgressColor(completeness.completeness)}
                size="small"
                className={styles.progressBar}
              />
              <div className={styles.progressText}>
                <span>{t('completeness.title')}</span>
                <span className={styles.percentage}>
                  {Math.round(completeness.completeness)}%
                </span>
              </div>
              {!completeness.isComplete && completeness.missingFields.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#faad14' }}>
                  {t('completeness.missing')}: {completeness.missingFields.length} {t('completeness.fields')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BasicInfoCard; 