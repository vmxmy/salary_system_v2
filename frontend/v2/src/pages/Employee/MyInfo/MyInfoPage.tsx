/**
 * 员工个人信息主页面
 */
import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Space, Button, Spin, Alert, Result, Card } from 'antd';
import { UserOutlined, EditOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import BasicInfoCard from './components/BasicInfoCard';
import DetailInfoTabs from './components/DetailInfoTabs';
import { useMyEmployeeInfo, useEmployeePermissions } from './hooks';
import styles from './MyInfo.module.less';
import { useAuthStore } from '../../../store/authStore';

const MyInfoPage: React.FC = () => {
  const { t } = useTranslation(['myInfo', 'common']);
  const navigate = useNavigate();
  
  // 获取员工信息
  const {
    employeeInfo,
    isLoading,
    isError,
    error,
    refreshEmployeeInfo,
    infoCompleteness,
    hasEmployeeInfo,
  } = useMyEmployeeInfo();

  // 获取权限
  const { canUpdate: canEdit } = useEmployeePermissions();

  // 添加认证状态调试
  const { currentUser, currentUserNumericId, authToken } = useAuthStore();

  // 处理编辑按钮点击
  const handleEdit = () => {
    navigate('/employee-info/my-info/edit');
  };

  // 处理刷新
  const handleRefresh = () => {
    refreshEmployeeInfo();
  };

  // 渲染加载状态
  if (isLoading) {
    return (
      <PageContainer
        title={
          <Space>
            <UserOutlined />
            {t('title')}
          </Space>
        }
      >
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <Spin size="large" />
            <div className={styles.loadingText}>
              {t('loading')}
            </div>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
              <h4>🔍 调试信息 (开发环境)</h4>
              <ul>
                <li><strong>用户名:</strong> {currentUser?.username || '未知'}</li>
                <li><strong>用户ID:</strong> {currentUser?.id || '未知'}</li>
                <li><strong>关联员工ID:</strong> {currentUser?.employee_id || '未设置'}</li>
                <li><strong>认证token:</strong> {authToken ? '存在' : '不存在'}</li>
              </ul>
            </div>
          )}
        </div>
      </PageContainer>
    );
  }

  // 渲染认证调试信息（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 MyInfoPage 认证状态:', {
      currentUser,
      currentUserNumericId,
      authToken: authToken ? '存在' : '不存在',
      localStorage: localStorage.getItem('auth-storage'),
    });
  }

  // 渲染错误状态
  if (isError || !hasEmployeeInfo) {
    return (
      <PageContainer
        title={
          <Space>
            <UserOutlined />
            {t('title')}
          </Space>
        }
      >
        <div className={styles.errorContainer}>
          <Result
            status="error"
            title={t('error')}
            subTitle={
              error?.message || t('error')
            }
            extra={[
              <Button 
                key="refresh" 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                {t('common:button.retry')}
              </Button>,
              <Button 
                key="back"
                onClick={() => navigate('/')}
              >
                {t('common:button.backHome')}
              </Button>,
            ]}
          />
        </div>
      </PageContainer>
    );
  }

  // 渲染主要内容
  return (
    <PageContainer
      title={
        <Space>
          <UserOutlined />
          {t('title')}
        </Space>
      }
      subTitle={t('subtitle')}
      extra={[
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
        >
          {t('common:button.refresh')}
        </Button>,
        ...(canEdit ? [
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            {t('edit')}
          </Button>
        ] : []),
      ]}
      className={styles.myInfoContainer}
    >
      {/* 开发环境显示成功加载的调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <Card style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
          <h4>✅ 成功加载员工信息 (开发环境调试)</h4>
          <ul>
            <li><strong>员工ID:</strong> {employeeInfo?.id}</li>
            <li><strong>员工姓名:</strong> {employeeInfo?.last_name}{employeeInfo?.first_name}</li>
            <li><strong>用户关联:</strong> admin用户(ID:{currentUser?.id}) → 员工ID:{currentUser?.employee_id}</li>
          </ul>
        </Card>
      )}

      {/* 信息完整度提醒 */}
      {infoCompleteness && !infoCompleteness.isComplete && (
        <Alert
          message={t('completeness.warning')}
          description={
            t('completeness.description', {
              percentage: Math.round(infoCompleteness.completeness || 0),
              missing: infoCompleteness.missingFields.length,
            })
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 24 }}
          action={
            canEdit ? (
              <Button size="small" type="primary" onClick={handleEdit}>
                {t('completeness.action')}
              </Button>
            ) : null
          }
        />
      )}

      {/* 基本信息卡片 */}
      <BasicInfoCard
        employeeInfo={employeeInfo!}
        completeness={infoCompleteness}
        canEdit={canEdit}
        onEdit={handleEdit}
      />

      {/* 详细信息标签页 */}
      <DetailInfoTabs
        employeeInfo={employeeInfo!}
      />
    </PageContainer>
  );
};

export default MyInfoPage; 