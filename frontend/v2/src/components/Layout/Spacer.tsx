import React from 'react';
import { designTokens } from '../../styles/design-tokens';
import Box from './Box';

export interface SpacerProps {
  // 间距大小
  size?: keyof typeof designTokens.spacing;
  // 方向
  direction?: 'horizontal' | 'vertical';
  // 是否弹性填充剩余空间
  flex?: boolean;
}

/**
 * Spacer 组件 - 间距组件
 * 用于在元素之间创建固定或弹性的间距
 */
const Spacer: React.FC<SpacerProps> = ({
  size = '4',
  direction = 'vertical',
  flex = false,
}) => {
  if (flex) {
    return <Box style={{ flex: 1 }} />;
  }
  
  const spacing = designTokens.spacing[size];
  
  return (
    <Box
      style={{
        width: direction === 'horizontal' ? spacing : undefined,
        height: direction === 'vertical' ? spacing : undefined,
      }}
    />
  );
};

Spacer.displayName = 'Spacer';

export default Spacer;
export { Spacer };
export type { SpacerProps };