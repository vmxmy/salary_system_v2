import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Space } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';

export const ReactQueryCleaner: React.FC = () => {
  const queryClient = useQueryClient();

  const clearInvalidQueries = () => {
    // 清理 periodId 为 "0" 的无效查询
    queryClient.removeQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        if (Array.isArray(queryKey) && queryKey[0] === 'payrollData') {
          const filters = queryKey[2] as any;
          return filters?.periodId === "0" || filters?.periodId === 0;
        }
        return false;
      }
    });
    
    console.log('🧹 [ReactQueryCleaner] 已清理无效查询');
  };

  const clearAllQueries = () => {
    queryClient.clear();
    console.log('🧹 [ReactQueryCleaner] 已清理所有查询缓存');
  };

  const invalidateAllQueries = () => {
    queryClient.invalidateQueries();
    console.log('🔄 [ReactQueryCleaner] 已使所有查询失效');
  };

  return (
    <Space>
      <Button 
        size="small" 
        icon={<DeleteOutlined />} 
        onClick={clearInvalidQueries}
        title="清理无效查询（periodId=0）"
      >
        清理无效查询
      </Button>
      <Button 
        size="small" 
        icon={<ReloadOutlined />} 
        onClick={invalidateAllQueries}
        title="使所有查询失效并重新获取"
      >
        刷新所有查询
      </Button>
      <Button 
        size="small" 
        danger 
        icon={<DeleteOutlined />} 
        onClick={clearAllQueries}
        title="清理所有查询缓存"
      >
        清空缓存
      </Button>
    </Space>
  );
}; 