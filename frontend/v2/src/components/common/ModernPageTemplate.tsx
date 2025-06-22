import React from 'react';
import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import './ModernPageTemplate.module.less';

const { Header, Content } = Layout;

export interface ModernPageTemplateProps {
  /** 页面标题 */
  title: string;
  /** 页面副标题/描述 */
  subtitle?: string;
  /** 页面头部的额外内容 */
  headerExtra?: React.ReactNode;
  /** 页面内容 */
  children: React.ReactNode;
  /** 是否显示面包屑导航 */
  showBreadcrumb?: boolean;
  /** 面包屑导航项 */
  breadcrumbItems?: Array<{ title: string; href?: string }>;
  /** 自定义类名 */
  className?: string;
  /** 是否使用全宽布局 */
  fullWidth?: boolean;
}

/**
 * 现代化页面模板组件
 * 基于 SimplePayroll 页面的设计系统，为所有页面提供统一的现代化布局
 */
export const ModernPageTemplate: React.FC<ModernPageTemplateProps> = ({
  title,
  subtitle,
  headerExtra,
  children,
  showBreadcrumb = false,
  breadcrumbItems = [],
  className = '',
  fullWidth = false,
}) => {
  const { t } = useTranslation();

  return (
    <Layout className={`modern-page-container ${className}`}>
      {/* 页面头部 */}
      <Header className="modern-page-header">
        <div className={`header-content ${fullWidth ? 'full-width' : ''}`}>
          {/* 面包屑导航 */}
          {showBreadcrumb && breadcrumbItems.length > 0 && (
            <nav className="breadcrumb-nav">
              {breadcrumbItems.map((item, index) => (
                <span key={index} className="breadcrumb-item">
                  {item.href ? (
                    <a href={item.href} className="breadcrumb-link">
                      {item.title}
                    </a>
                  ) : (
                    <span className="breadcrumb-text">{item.title}</span>
                  )}
                  {index < breadcrumbItems.length - 1 && (
                    <span className="breadcrumb-separator">/</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          
          {/* 页面标题区域 */}
          <div className="title-section">
            <div className="title-content">
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            
            {/* 头部额外内容 */}
            {headerExtra && (
              <div className="header-extra">
                {headerExtra}
              </div>
            )}
          </div>
        </div>
      </Header>

      {/* 主内容区域 */}
      <Content className={`modern-page-content ${fullWidth ? 'full-width' : ''}`}>
        <div className="content-wrapper">
          {children}
        </div>
      </Content>
    </Layout>
  );
};

export default ModernPageTemplate;