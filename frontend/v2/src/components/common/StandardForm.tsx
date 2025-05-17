import React from 'react';
import { Form } from 'antd';
import type { FormProps } from 'antd';
import styled from 'styled-components';

const StyledForm = styled(Form)`
  &&& {
    .ant-form-item {
      margin-bottom: 16px;
    }
    
    .ant-form-item-label > label {
      font-weight: 500;
    }
    
    .ant-form-item-explain-error {
      font-size: 12px;
    }
  }
`;

interface StandardFormProps extends FormProps {
  children?: React.ReactNode;
}

function StandardForm({ children, ...props }: StandardFormProps) {
  return (
    <StyledForm
      layout="vertical"
      {...props}
    >
      {children}
    </StyledForm>
  );
}

export default StandardForm;