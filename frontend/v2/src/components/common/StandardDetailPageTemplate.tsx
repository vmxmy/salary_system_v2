import React from 'react';
import { Spin, Alert, Typography, Breadcrumb, Space, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import styles from './StandardDetailPageTemplate.module.less';

const { Title } = Typography;

export interface BreadcrumbItem {
  path?: string;
  title: React.ReactNode;
  key: string;
}

export interface StandardDetailPageTemplateProps<T> {
  pageTitleKey: string;
  translationNamespaces?: string[];
  isLoading: boolean;
  error?: string | null;
  data?: T | null; // The main data object for the page
  children: React.ReactNode; // Content to render if data is available
  breadcrumbs?: BreadcrumbItem[];
  headerActions?: React.ReactNode;
  showError?: boolean;
  loadingTextKey?: string;
  emptyState?: React.ReactNode; // Custom empty state if data is null and not loading/error
  emptyStateDescriptionKey?: string; // Default empty state description key for translation
}

const StandardDetailPageTemplate = <T extends object | null | undefined>({
  pageTitleKey,
  translationNamespaces = ['common', 'pageTitle'],
  isLoading,
  error,
  data,
  children,
  breadcrumbs,
  headerActions,
  showError = true,
  loadingTextKey = 'common:loading.generic_loading_text',
  emptyState,
  emptyStateDescriptionKey = 'common:noDataAvailable',
}: StandardDetailPageTemplateProps<T>) => {
  const { t } = useTranslation(translationNamespaces);

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { key: 'home', title: <Link to="/"><HomeOutlined /></Link>, path: '/' },
    { key: 'pageTitle', title: t(pageTitleKey) },
  ];

  const currentBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin tip={t(loadingTextKey)} size="large" fullscreen />
      </div>
    );
  }

  if (error && showError) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message={t('common:error.genericTitle', 'Error')}
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }
  
  // Render empty state if data is null/undefined, not loading, and no error
  if (!data && !isLoading && !error) {
    return emptyState || (
      <div className={styles.emptyContainer}>
        <Empty description={t(emptyStateDescriptionKey)} />
      </div>
    );
  }
  
  // Render children if data exists (even if it's an empty object, could be a partially loaded form)
  // or if explicitly told not to show an empty state (e.g. a form page)
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Breadcrumb 
          className={styles.pageBreadcrumb}
          items={currentBreadcrumbs.map(item => ({
            key: item.key,
            title: typeof item.title === 'object' && item.title !== null && 'type' in item.title && item.title.type === Link 
                   ? item.title 
                   : (item.path ? <Link to={item.path}>{item.title}</Link> : item.title),
          }))}
        />
        <div className={styles.headerContent}>
            <Title level={3} className={styles.pageTitle}>{t(pageTitleKey)}</Title>
            {headerActions && <Space className={styles.headerActions}>{headerActions}</Space>}
        </div>
      </div>
      <div className={styles.contentArea}>
        {children}
      </div>
    </div>
  );
};

export default StandardDetailPageTemplate; 