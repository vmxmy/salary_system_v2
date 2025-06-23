import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps, TabPaneProps } from 'antd';
import styled from 'styled-components';

// 增强样式化的Tab组件，确保在所有页面都能统一显示高亮样式
const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 16px;
  }
  
  .ant-tabs-tab {
    padding: 8px 16px;
    font-weight: 500;
    font-size: 16px; /* 统一字体大小 */
    position: relative;
    transition: all 0.3s;
    
    &.ant-tabs-tab-active {
      font-weight: 600;
      
      .ant-tabs-tab-btn {
        color: var(--ant-primary-color, #1890ff) !important; /* 使用 !important 确保样式优先级 */
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background-color: var(--ant-primary-color, #1890ff);
      }
    }
  }
  
  /* 统一标签页字体样式，确保在所有位置显示一致 */
  .ant-tabs-tab-btn {
    font-size: 16px;
    font-family: 'Noto Serif SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', serif;
    line-height: 1.5;
  }
  
  .ant-tabs-ink-bar {
    background: var(--ant-primary-color, #1890ff) !important; /* 使用 !important 确保样式优先级 */
    height: 3px !important; /* 增加高亮条的高度 */
  }
  
  /* 确保卡片类型标签页样式一致 */
  &.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
    border: 1px solid #f0f0f0;
    background: transparent;
    border-bottom: none;
    
    &.ant-tabs-tab-active {
      background: #fff;
      border-color: #f0f0f0;
      border-bottom: 1px solid #fff;
      
      .ant-tabs-tab-btn {
        color: var(--ant-primary-color, #1890ff) !important;
      }
    }
  }
  
  /* 大尺寸标签样式 */
  &.ant-tabs-large .ant-tabs-tab {
    font-size: 16px;
    padding: 12px 20px;
  }
`;

export interface UnifiedTabsProps extends TabsProps {
  // 可以添加额外的自定义属性
  className?: string;
}

/**
 * 统一的标签页组件
 * 使用系统一致的样式来渲染标签页
 */
const UnifiedTabs: React.FC<UnifiedTabsProps> = (props) => {
  return <StyledTabs {...props} />;
};

export default UnifiedTabs;