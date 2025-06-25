import React from 'react';
import { Breadcrumb, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import Container from './Container';
import FlexLayout from './FlexLayout';
import Box from './Box';
import './PageLayout.less';

const { Title } = Typography;

export interface BreadcrumbItem {
  key: string;
  title: React.ReactNode;
  href?: string;
}

export interface PageLayoutProps {
  // 页面标题
  title: string;
  // 副标题
  subtitle?: string;
  // 面包屑项
  breadcrumbItems?: BreadcrumbItem[];
  // 页面操作按钮
  actions?: React.ReactNode;
  // 页面内容
  children: React.ReactNode;
  // 是否显示背景卡片
  showCard?: boolean;
  // 容器大小
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  // 是否全宽
  fullWidth?: boolean;
  // 自定义类名
  className?: string;
  // 是否加载中
  loading?: boolean;
  // 额外的头部内容
  headerExtra?: React.ReactNode;
}

/**
 * PageLayout 组件 - 统一的页面布局容器
 * 提供标准的页面结构：面包屑、标题、操作区和内容区
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  breadcrumbItems = [],
  actions,
  children,
  showCard = true,
  containerSize = 'xl',
  fullWidth = false,
  className,
  loading = false,
  headerExtra,
}) => {
  // 构建面包屑
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { key: 'home', title: <HomeOutlined />, href: '/' },
    ...breadcrumbItems,
  ];
  
  const classes = classNames(
    'page-layout',
    {
      'page-layout--loading': loading,
      'page-layout--full-width': fullWidth,
    },
    className
  );
  
  return (
    <div className={classes}>
      <Container size={fullWidth ? 'full' : containerSize} centered={!fullWidth}>
        {/* 面包屑导航 */}
        {breadcrumbItems.length > 0 && (
          <Box mb="4" className="page-layout__breadcrumb">
            <Breadcrumb
              items={defaultBreadcrumbs.map(item => ({
                key: item.key,
                title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title,
              }))}
            />
          </Box>
        )}
        
        {/* 页面头部 */}
        <FlexLayout
          justify="space-between"
          align="flex-start"
          wrap="wrap"
          gap="4"
          mb="6"
          className="page-layout__header"
        >
          <Box className="page-layout__header-content">
            <Title level={2} className="page-layout__title">
              {title}
            </Title>
            {subtitle && (
              <Typography.Text className="page-layout__subtitle" type="secondary">
                {subtitle}
              </Typography.Text>
            )}
            {headerExtra}
          </Box>
          
          {actions && (
            <FlexLayout gap="3" wrap="wrap" className="page-layout__actions">
              {actions}
            </FlexLayout>
          )}
        </FlexLayout>
        
        {/* 页面内容 */}
        <Box
          className="page-layout__content"
          bg={showCard ? 'primary' : undefined}
          p={showCard ? '6' : undefined}
          borderRadius={showCard ? 'lg' : undefined}
          shadow={showCard ? 'base' : undefined}
        >
          {children}
        </Box>
      </Container>
    </div>
  );
};

export default PageLayout;
export { PageLayout };
export type { PageLayoutProps };