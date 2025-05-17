import React from 'react';
import { Button, Tooltip } from 'antd';
import type { ButtonProps } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components';

interface ActionButtonProps extends ButtonProps {
  actionType?: 'edit' | 'delete' | 'add';
  tooltipTitle?: string;
  danger?: boolean;
}

const StyledButton = styled(Button).attrs({ className: 'action-btn' })`
  &&& {
    width: 32px;
    height: 32px;
    padding: 0;
    min-width: 32px;
    border-radius: 4px;
    transition: all 0.2s;
    
    border-color: ${props => (props.danger ? '#ff4d4f' : '#d9d9d9')} !important;
    color: ${props => (props.danger ? '#ff4d4f' : 'rgba(0, 0, 0, 0.88)')} !important;

    &:hover {
      border-color: ${props => (props.danger ? '#f5222d' : '#40a9ff')} !important;
      color: ${props => (props.danger ? '#f5222d' : '#40a9ff')} !important;
      background-color: ${props => (props.danger ? '#fff1f0' : '#f5f5f5')};
    }
  }
`;

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ actionType, tooltipTitle, danger, ...rest }, ref) => {
    let icon;
    let defaultTooltip;

    switch (actionType) {
      case 'edit':
        icon = <EditOutlined />;
        defaultTooltip = '编辑';
        break;
      case 'delete':
        icon = <DeleteOutlined />;
        defaultTooltip = '删除';
        break;
      case 'add':
        icon = <PlusOutlined />;
        defaultTooltip = '添加';
        break;
      default:
        break;
    }

    return (
      <Tooltip title={tooltipTitle || defaultTooltip}>
        <StyledButton
          ref={ref}
          icon={icon}
          type="default"
          size="small"
          danger={danger}
          {...rest}
        />
      </Tooltip>
    );
  }
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;