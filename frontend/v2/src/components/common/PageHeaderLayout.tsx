import React from 'react';
import styled from 'styled-components';

const StyledPageHeader = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface PageHeaderLayoutProps {
  children: React.ReactNode;
}

const PageHeaderLayout: React.FC<PageHeaderLayoutProps> = ({ children }) => {
  return (
    <StyledPageHeader>
      {children}
    </StyledPageHeader>
  );
};

export default PageHeaderLayout;