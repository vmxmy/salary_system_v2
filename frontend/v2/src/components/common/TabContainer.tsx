import React from 'react';
import styled from 'styled-components';
import UnifiedTabs from './UnifiedTabs';
import type { UnifiedTabsProps } from './UnifiedTabs';

// 样式化容器
const StyledContainer = styled.div`
  .unified-tabs-container {
    margin-bottom: 16px;
  }
`;

export interface TabContainerProps extends UnifiedTabsProps {
  className?: string;
}

/**
 * 标签页容器组件
 * 提供统一的容器样式，用于包装UnifiedTabs
 */
const TabContainer: React.FC<TabContainerProps> = ({ children, className, ...restProps }) => {
  return (
    <StyledContainer>
      <div className={`unified-tabs-container ${className || ''}`}>
        <UnifiedTabs
          type="line"
          size="large"
          {...restProps}
        >
          {children}
        </UnifiedTabs>
      </div>
    </StyledContainer>
  );
};

export default TabContainer;