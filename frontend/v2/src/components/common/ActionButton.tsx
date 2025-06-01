import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip, theme } from 'antd';
import type { ButtonProps } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

interface ActionButtonProps extends ButtonProps {
  actionType?: 'edit' | 'delete' | 'add' | 'view';
  tooltipTitle?: string;
  danger?: boolean;
}

// 为StyledButton定义扩展的属性类型
interface StyledButtonProps extends ButtonProps {
  $customBorderColor?: string;
  $customTextColor?: string;
  $customHoverBorderColor?: string;
  $customHoverTextColor?: string;
  $customHoverBgColor?: string;
}

// 使用前缀$的属性名称避免传递给DOM元素
const StyledButton = styled(Button)<StyledButtonProps>`
  &&& {
    /* 通用样式，不管什么type都应用 */
    width: 32px;
    height: 32px;
    padding: 0;
    min-width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    /* 隐藏文本内容，只显示图标 */
    .ant-btn-icon + span {
      display: none;
    }
    
    /* 仅应用于type="default"时的自定义样式，避免覆盖primary等样式 */
    ${props => props.type === 'default' && `
      border-color: ${props.$customBorderColor || '#d9d9d9'};
      color: ${props.$customTextColor || 'rgba(0, 0, 0, 0.88)'};

      &:hover {
        border-color: ${props.$customHoverBorderColor || '#40a9ff'};
        color: ${props.$customHoverTextColor || '#40a9ff'};
        background-color: ${props.$customHoverBgColor || '#f5f5f5'};
      }
    `}
  }
`;

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ actionType, tooltipTitle, danger, type = 'default', children, ...rest }, ref) => {
    const { t } = useTranslation();
    // 获取当前主题 token
    const { token } = theme.useToken();
    
    let icon;
    let defaultTooltip;

    switch (actionType) {
      case 'edit':
        icon = <EditOutlined />;
        defaultTooltip = t('components:auto_text_e7bc96');
        break;
      case 'delete':
        icon = <DeleteOutlined />;
        defaultTooltip = t('components:auto_text_e588a0');
        break;
      case 'add':
        icon = <PlusOutlined />;
        defaultTooltip = t('components:auto_text_e6b7bb');
        break;
      case 'view':
        icon = <EyeOutlined />;
        defaultTooltip = t('components:auto_text_e69fa5');
        break;
      default:
        break;
    }

    // 使用 children 作为 tooltip 文本如果未提供 tooltipTitle
    const finalTooltipTitle = tooltipTitle || (typeof children === 'string' ? children : defaultTooltip);

    // 基于主题和 danger 属性计算样式变量
    const customBorderColor = danger ? token.colorError : token.colorBorder;
    const customTextColor = danger ? token.colorError : token.colorText;
    const customHoverBorderColor = danger ? token.colorErrorHover : token.colorPrimary;
    const customHoverTextColor = danger ? token.colorErrorHover : token.colorPrimary;
    const customHoverBgColor = danger ? token.colorErrorBg : token.colorBgTextHover;

    return (
      <Tooltip title={finalTooltipTitle}>
        <StyledButton
          ref={ref}
          icon={icon}
          type={type}
          size="small"
          danger={danger}
          $customBorderColor={customBorderColor}
          $customTextColor={customTextColor}
          $customHoverBorderColor={customHoverBorderColor}
          $customHoverTextColor={customHoverTextColor}
          $customHoverBgColor={customHoverBgColor}
          className="action-btn"
          {...rest}
        >
          {children}
        </StyledButton>
      </Tooltip>
    );
  }
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;