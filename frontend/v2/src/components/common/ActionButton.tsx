import React from 'react';
import { Button, Tooltip } from 'antd';
import type { ButtonProps } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';

interface ActionButtonProps extends ButtonProps {
  actionType?: 'edit' | 'delete';
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



const ActionButton: React.FC<ActionButtonProps> = ({ actionType, tooltipTitle, danger, ...rest }) => {
  const icon = actionType === 'edit' ? <EditOutlined /> : <DeleteOutlined />;
  const defaultTooltip = actionType === 'edit' ? '编辑' : '删除';

  return (
    <Tooltip title={tooltipTitle || defaultTooltip}>
      <StyledButton
        icon={icon}
        type="default" // 使用 default 类型以应用描边样式
        size="small" // 保持小尺寸
        danger={danger}
        {...rest}
      />
    </Tooltip>
  );
};

export default ActionButton;