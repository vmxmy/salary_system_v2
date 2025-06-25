import React, { ReactNode } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Spin, Empty, Button } from 'antd';
import { useTranslation } from 'react-i18next';

export interface StandardPageLayoutProps {
  /** 页面主标题 */
  title: string;
  /** 页面副标题 */
  subtitle?: string;
  /** 是否显示加载中状态 */
  isLoading?: boolean;
  /** 是否为空状态 */
  isEmpty?: boolean;
  /** 空状态的描述文本 */
  emptyDescription?: string;
  /** 空状态下的操作按钮 */
  emptyAction?: () => void;
  /** 空状态按钮的文本 */
  emptyActionText?: string;
  /** 页面右上角的操作按钮 */
  actions?: ReactNode;
  /** 位于标题下方的附加工具栏 */
  toolbar?: ReactNode;
  /** 页面核心内容 */
  children: ReactNode;
}

/**
 * 标准化页面布局组件
 * 提供了统一的标题、面包屑、加载状态、空状态和操作区
 */
const StandardPageLayout: React.FC<StandardPageLayoutProps> = ({
  title,
  subtitle,
  isLoading = false,
  isEmpty = false,
  emptyDescription,
  emptyAction,
  emptyActionText,
  actions,
  toolbar,
  children,
}) => {
  const { t } = useTranslation('common');

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (isEmpty) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Empty
            description={emptyDescription || t('message.no_data')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {emptyAction && (
              <Button type="primary" onClick={emptyAction}>
                {emptyActionText || t('action.create')}
              </Button>
            )}
          </Empty>
        </div>
      );
    }

    return children;
  };

  return (
    <PageContainer
      title={title}
      subTitle={subtitle}
      extra={actions}
      footer={toolbar ? [toolbar] : undefined}
      token={{
        paddingInlinePageContainerContent: 24,
      }}
    >
      {renderContent()}
    </PageContainer>
  );
};

export default StandardPageLayout; 