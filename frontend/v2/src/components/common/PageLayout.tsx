import React from 'react';
import { Breadcrumb, Typography, Space, Card } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import styles from './PageLayout.module.less';

const { Title } = Typography;

interface BreadcrumbItem {
  key: string;
  title: React.ReactNode;
  href?: string;
}

interface PageLayoutProps {
  title: string;
  breadcrumbItems?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  showCard?: boolean;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  breadcrumbItems = [],
  actions,
  children,
  showCard = true,
  className
}) => {
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { key: 'home', title: <HomeOutlined />, href: '/' },
    ...breadcrumbItems
  ];

  const content = showCard ? (
    <Card className={styles.pageCard}>
      {children}
    </Card>
  ) : children;

  return (
    <div className={`${styles.pageContainer} ${className || ''}`}>
      {/* 面包屑导航 */}
      <Breadcrumb 
        className={styles.breadcrumb}
        items={defaultBreadcrumbs.map(item => ({
          key: item.key,
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <Title level={2} className={styles.pageTitle}>{title}</Title>
        </div>
        {actions && (
          <div className={styles.pageHeaderRight}>
            <Space size="middle">
              {actions}
            </Space>
          </div>
        )}
      </div>
      
      {/* 页面内容 */}
      <div className={styles.pageContent}>
        {content}
      </div>
    </div>
  );
};

export default PageLayout; 