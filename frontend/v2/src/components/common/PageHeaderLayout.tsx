import React from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';

const StyledPageHeaderBar = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderActions = styled.div``;

export interface PageHeaderLayoutProps {
  pageTitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const PageHeaderLayout: React.FC<PageHeaderLayoutProps> = ({ pageTitle, icon, actions, children }) => {
  return (
    <div>
      <StyledPageHeaderBar>
        <HeaderContent>
          {icon && <span style={{ marginRight: 12, display: 'flex', alignItems: 'center' }}>{icon}</span>}
          {pageTitle && 
            (typeof pageTitle === 'string' ? 
              <Typography.Title level={4} style={{ marginBottom: 0, lineHeight: 'inherit' }}>{pageTitle}</Typography.Title> 
              : pageTitle
            )
          }
        </HeaderContent>
        <HeaderActions>
          {actions}
        </HeaderActions>
      </StyledPageHeaderBar>
      <div>
        {children}
      </div>
    </div>
  );
};

export default PageHeaderLayout;