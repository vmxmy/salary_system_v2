import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTour } from '../../context/TourContext';

interface TourButtonProps {
  /**
   * 引导的唯一标识符
   */
  tourId: string;
  /**
   * 自定义按钮文本，默认为"功能引导"
   */
  buttonText?: string;
  /**
   * 自定义按钮图标，默认为 QuestionCircleOutlined
   */
  icon?: React.ReactNode;
  /**
   * 自定义按钮类型，默认为 "default"
   */
  type?: "primary" | "default" | "dashed" | "link" | "text";
  /**
   * 自定义按钮大小，默认为 "middle"
   */
  size?: "large" | "middle" | "small";
  /**
   * 点击按钮时的回调函数
   */
  onClick?: () => void;
  /**
   * 自定义按钮样式
   */
  style?: React.CSSProperties;
  /**
   * 自定义按钮类名
   */
  className?: string;
  /**
   * 是否显示为图标按钮，默认为 false
   */
  iconOnly?: boolean;
  /**
   * 提示文本，当 iconOnly 为 true 时显示
   */
  tooltip?: string;
}

/**
 * 引导按钮组件
 * 用于触发页面引导
 */
const TourButton: React.FC<TourButtonProps> = ({
  tourId,
  buttonText,
  icon = <QuestionCircleOutlined />,
  type = "default",
  size = "middle",
  onClick,
  style,
  className,
  iconOnly = false,
  tooltip,
}) => {
  const { t } = useTranslation();
  const { resetTour } = useTour();
  
  const handleClick = () => {
    // 重置引导状态，以便重新显示
    resetTour(tourId);
    
    // 调用自定义点击回调
    if (onClick) {
      onClick();
    }
  };

  // 图标按钮
  if (iconOnly) {
    return (
      <Tooltip title={tooltip || t('common.tour.startTour')}>
        <Button
          type={type}
          icon={icon}
          onClick={handleClick}
          size={size}
          style={style}
          className={className}
        />
      </Tooltip>
    );
  }

  // 普通按钮
  return (
    <Button
      type={type}
      icon={icon}
      onClick={handleClick}
      size={size}
      style={style}
      className={className}
    >
      {buttonText || t('common.tour.startTour')}
    </Button>
  );
};

export default TourButton;
