import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Result, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MetricCardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('指标卡错误边界捕获到错误:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '24px',
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Result
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="指标卡加载失败"
            subTitle={process.env.NODE_ENV === 'development' ? this.state.error?.message : "组件渲染出现错误"}
            extra={
              <Button type="primary" size="small" onClick={this.handleRetry}>
                重试
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}