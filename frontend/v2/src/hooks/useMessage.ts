import { message } from 'antd';

/**
 * 消息提示Hook
 * 封装Ant Design的message API
 */
export const useMessage = () => {
  return {
    success: (content: string) => message.success(content),
    error: (content: string) => message.error(content),
    warning: (content: string) => message.warning(content),
    info: (content: string) => message.info(content),
    loading: (content: string, duration?: number) => message.loading(content, duration),
    destroy: () => message.destroy(),
  };
};