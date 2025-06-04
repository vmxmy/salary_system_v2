import React, { ReactNode, useCallback } from 'react';
import { Tree, Space, Typography, Tag, Badge, Empty } from 'antd';
import { AntTreeNodeProps } from 'antd/es/tree';

const { Text } = Typography;
const { DirectoryTree } = Tree;

// 通用树节点接口
export interface TreeNodeData {
  id: number | string;
  key: string;
  name: string;
  code?: string;
  is_active?: boolean;
  parent_id?: number | string | null;
  children?: TreeNodeData[];
  level?: number;
  [key: string]: any; // 允许扩展其他属性
}

// 树节点渲染配置
export interface TreeNodeRenderConfig {
  showCode?: boolean; // 是否显示编码
  showBadge?: boolean; // 是否显示徽章
  badgeKey?: string; // 徽章数据的键名
  badgeColor?: string; // 徽章颜色
  showStatus?: boolean; // 是否显示状态标签
  statusKey?: string; // 状态数据的键名
  activeText?: string; // 启用状态文本
  inactiveText?: string; // 停用状态文本
  customRender?: (node: TreeNodeData) => ReactNode; // 自定义渲染函数
}

// 组件属性接口
export interface OrganizationTreeProps {
  // 数据相关
  data: TreeNodeData[];
  loading?: boolean;
  
  // 选择相关
  selectedKeys?: React.Key[];
  onSelect?: (keys: React.Key[], info: any) => void;
  
  // 渲染配置
  renderConfig?: TreeNodeRenderConfig;
  
  // 树组件配置
  showIcon?: boolean;
  blockNode?: boolean;
  multiple?: boolean;
  checkable?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandedKeys?: React.Key[];
  
  // 样式
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  
  // 空状态
  emptyText?: string;
  emptyIcon?: ReactNode;
}

// 构建树形数据的工具函数
export const buildTreeData = <T extends TreeNodeData>(
  flatData: T[],
  renderConfig: TreeNodeRenderConfig = {},
  parentId: number | string | null = null,
  level: number = 0
): T[] => {
  const {
    showCode = true,
    showBadge = false,
    badgeKey = 'count',
    badgeColor = '#52c41a',
    showStatus = true,
    statusKey = 'is_active',
    activeText = '启用',
    inactiveText = '停用',
    customRender
  } = renderConfig;

  const children = flatData
    .filter(item => item.parent_id === parentId)
    .map(item => {
      const childNodes = buildTreeData(flatData, renderConfig, item.id, level + 1);
      
      const nodeWithChildren = {
        ...item,
        key: item.key || item.id.toString(),
        level,
        children: childNodes,
        title: customRender ? customRender(item) : (
          <div className="tree-node-title">
            <Space>
              <Text strong={level === 0}>{item.name}</Text>
              {showCode && item.code && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ({item.code})
                </Text>
              )}
              {showBadge && item[badgeKey] !== undefined && item[badgeKey] > 0 && (
                <Badge 
                  count={item[badgeKey]} 
                  size="small" 
                  style={{ backgroundColor: badgeColor }}
                />
              )}
              {showStatus && item[statusKey] !== undefined && !item[statusKey] && (
                <Tag color="red">{inactiveText}</Tag>
              )}
            </Space>
          </div>
        )
      };

      return nodeWithChildren as T;
    });

  return children;
};

// 计算树的最大深度
export const calculateMaxDepth = <T extends TreeNodeData>(
  flatData: T[],
  parentId: number | string | null = null,
  depth: number = 0
): number => {
  const children = flatData.filter(item => item.parent_id === parentId);
  if (children.length === 0) return depth;
  return Math.max(...children.map(child => calculateMaxDepth(flatData, child.id, depth + 1)));
};

// 获取所有叶子节点
export const getLeafNodes = <T extends TreeNodeData>(treeData: T[]): T[] => {
  const leafNodes: T[] = [];
  
  const traverse = (nodes: T[]) => {
    nodes.forEach(node => {
      if (!node.children || node.children.length === 0) {
        leafNodes.push(node);
      } else {
        traverse(node.children as T[]);
      }
    });
  };
  
  traverse(treeData);
  return leafNodes;
};

// 根据ID查找节点
export const findNodeById = <T extends TreeNodeData>(
  treeData: T[],
  id: number | string
): T | null => {
  for (const node of treeData) {
    if (node.id === id) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children as T[], id);
      if (found) return found;
    }
  }
  return null;
};

// 主组件
const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  data,
  loading = false,
  selectedKeys = [],
  onSelect,
  renderConfig = {},
  showIcon = false,
  blockNode = true,
  multiple = false,
  checkable = false,
  defaultExpandAll = false,
  defaultExpandedKeys,
  height = '400px',
  className,
  style,
  emptyText = '暂无数据',
  emptyIcon
}) => {
  // 构建树形数据
  const treeData = useCallback(() => {
    if (!data || data.length === 0) return [];
    return buildTreeData(data, renderConfig);
  }, [data, renderConfig]);

  const handleSelect = useCallback((keys: React.Key[], info: any) => {
    onSelect?.(keys, info);
  }, [onSelect]);

  // 如果没有数据，显示空状态
  if (!data || data.length === 0) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          ...style 
        }}
        className={className}
      >
        <Empty
          image={emptyIcon || Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyText}
        />
      </div>
    );
  }

  const processedTreeData = treeData();

  return (
    <div 
      style={{ height, overflow: 'auto', ...style }} 
      className={className}
    >
      <DirectoryTree
        treeData={processedTreeData}
        selectedKeys={selectedKeys}
        onSelect={handleSelect}
        showIcon={showIcon}
        blockNode={blockNode}
        multiple={multiple}
        checkable={checkable}
        defaultExpandAll={defaultExpandAll}
        defaultExpandedKeys={defaultExpandedKeys}
      />
    </div>
  );
};

export default OrganizationTree; 