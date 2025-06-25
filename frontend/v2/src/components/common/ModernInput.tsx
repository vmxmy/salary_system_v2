import React from 'react';
import { Input } from 'antd';
import type { InputProps, PasswordProps } from 'antd/es/input';
import classnames from 'classnames';
import styles from './ModernInput.module.less';

export type ModernInputVariant = 'outlined' | 'filled' | 'borderless';
export type ModernInputSize = 'small' | 'middle' | 'large';

export interface ModernInputProps extends Omit<InputProps, 'size' | 'variant'> {
  /** 输入框变体样式 */
  variant?: ModernInputVariant;
  /** 输入框大小 */
  size?: ModernInputSize;
  /** 是否显示清除按钮 */
  allowClear?: boolean;
  /** 是否启用自动聚焦 */
  autoFocus?: boolean;
  /** 错误状态 */
  error?: boolean;
  /** 错误信息 */
  errorMessage?: string;
}

export interface ModernPasswordProps extends Omit<PasswordProps, 'size' | 'variant'> {
  /** 输入框变体样式 */
  variant?: ModernInputVariant;
  /** 输入框大小 */
  size?: ModernInputSize;
  /** 是否显示清除按钮 */
  allowClear?: boolean;
  /** 是否启用自动聚焦 */
  autoFocus?: boolean;
  /** 错误状态 */
  error?: boolean;
  /** 错误信息 */
  errorMessage?: string;
}

/**
 * 现代化输入框组件
 * 基于统一设计系统的输入框样式
 */
export const ModernInput: React.FC<ModernInputProps> = ({
  variant = 'outlined',
  size = 'middle',
  allowClear = true,
  autoFocus = false,
  error = false,
  errorMessage,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...restProps
}) => {
  // 类型安全验证
  const validVariants: ModernInputVariant[] = ['outlined', 'filled', 'borderless'];
  const validSizes: ModernInputSize[] = ['small', 'middle', 'large'];
  
  const safeVariant = validVariants.includes(variant) ? variant : 'outlined';
  const safeSize = validSizes.includes(size) ? size : 'middle';

  const inputClassName = classnames(
    styles['modern-input'],
    styles[`variant-${safeVariant}`],
    styles[`size-${safeSize}`],
    {
      [styles['error']]: error,
    },
    className
  );

  const errorId = error && errorMessage ? `${restProps.id || 'input'}-error` : undefined;

  return (
    <div className={styles['input-wrapper']}>
      <Input
        {...restProps}
        size={safeSize}
        allowClear={allowClear}
        autoFocus={autoFocus}
        className={inputClassName}
        status={error ? 'error' : undefined}
        aria-label={ariaLabel}
        aria-describedby={error && errorMessage ? `${ariaDescribedBy || ''} ${errorId}`.trim() : ariaDescribedBy}
        aria-invalid={error}
      />
      {error && errorMessage && (
        <div 
          id={errorId}
          className={styles['error-message']}
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};

/**
 * 现代化密码输入框组件
 */
export const ModernPassword: React.FC<ModernPasswordProps> = ({
  variant = 'outlined',
  size = 'middle',
  allowClear = true,
  autoFocus = false,
  error = false,
  errorMessage,
  className,
  ...restProps
}) => {
  const inputClassName = classnames(
    styles['modern-input'],
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    {
      [styles['error']]: error,
    },
    className
  );

  return (
    <div className={styles['input-wrapper']}>
      <Input.Password
        {...restProps}
        size={size}
        allowClear={allowClear}
        autoFocus={autoFocus}
        className={inputClassName}
        status={error ? 'error' : undefined}
      />
      {error && errorMessage && (
        <div className={styles['error-message']}>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default ModernInput;