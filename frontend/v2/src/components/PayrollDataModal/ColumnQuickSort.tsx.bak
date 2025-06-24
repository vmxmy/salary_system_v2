import React, { useState } from 'react';
import { Button, Dropdown, Space, message, Modal, List, Typography } from 'antd';
import { 
  SortAscendingOutlined, 
  MenuOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ColumnFilterConfig } from '../../hooks/usePayrollDataProcessing';

const { Text } = Typography;

interface ColumnQuickSortProps {
  availableColumns: string[];
  filterConfig: ColumnFilterConfig;
  onFilterConfigChange: (config: ColumnFilterConfig) => void;
}

export const ColumnQuickSort: React.FC<ColumnQuickSortProps> = ({
  availableColumns,
  filterConfig,
  onFilterConfigChange
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [customOrder, setCustomOrder] = useState<string[]>(
    filterConfig.customColumnOrder || []
  );

  // 快速排序菜单项
  const quickSortMenuItems: MenuProps['items'] = [
    {
      key: 'byCategory',
      label: '按类别排序',
      icon: <SortAscendingOutlined />,
      onClick: () => applySortingMode('byCategory')
    },
    {
      key: 'byAlphabet',
      label: '按字母排序',
      icon: <SortAscendingOutlined />,
      onClick: () => applySortingMode('byAlphabet')
    },
    {
      key: 'byImportance',
      label: '按重要性排序',
      icon: <SortAscendingOutlined />,
      onClick: () => applySortingMode('byImportance')
    },
    {
      key: 'byDataType',
      label: '数字列优先',
      icon: <SortAscendingOutlined />,
      onClick: () => applySortingMode('byDataType')
    },
    {
      type: 'divider'
    },
    {
      key: 'custom',
      label: '自定义排序',
      icon: <MenuOutlined />,
      onClick: () => setModalVisible(true)
    }
  ];

  // 应用排序模式
  const applySortingMode = (mode: string) => {
    onFilterConfigChange({
      ...filterConfig,
      columnSortMode: mode as any,
      customColumnOrder: []
    });
    
    const modeNames: Record<string, string> = {
      byCategory: '按类别排序',
      byAlphabet: '按字母排序',
      byImportance: '按重要性排序',
      byDataType: '数字列优先'
    };
    
    message.success(`已应用"${modeNames[mode]}"`);
  };

  // 上移字段
  const moveUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...customOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setCustomOrder(newOrder);
    }
  };

  // 下移字段
  const moveDown = (index: number) => {
    if (index < customOrder.length - 1) {
      const newOrder = [...customOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setCustomOrder(newOrder);
    }
  };

  // 移除字段
  const removeField = (index: number) => {
    const newOrder = customOrder.filter((_, i) => i !== index);
    setCustomOrder(newOrder);
  };

  // 检查是否为员工姓名字段
  const isEmployeeNameField = (fieldName: string): boolean => {
    return fieldName === '员工姓名' || 
           fieldName === 'employee_name' || 
           fieldName.includes('姓名') ||
           fieldName === '姓名';
  };

  // 添加字段
  const addField = (fieldName: string) => {
    // 员工姓名不允许添加到自定义排序中（它总是在最前面）
    if (isEmployeeNameField(fieldName)) {
      message.info('员工姓名已固定在最左侧，无需手动排序');
      return;
    }
    
    if (!customOrder.includes(fieldName)) {
      setCustomOrder([...customOrder, fieldName]);
    }
  };

  // 应用自定义排序
  const applyCustomSorting = () => {
    onFilterConfigChange({
      ...filterConfig,
      columnSortMode: 'custom',
      customColumnOrder: customOrder
    });
    
    setModalVisible(false);
    message.success(`已设置自定义排序，${customOrder.length}个字段优先显示`);
  };

  // 获取当前排序模式的显示名称
  const getCurrentSortModeName = () => {
    const modeNames: Record<string, string> = {
      byCategory: '类别',
      byAlphabet: '字母',
      byImportance: '重要性',
      byDataType: '数字优先',
      custom: '自定义'
    };
    
    return modeNames[filterConfig.columnSortMode || 'byCategory'] || '类别';
  };

  return (
    <>
      <Dropdown 
        menu={{ items: quickSortMenuItems }} 
        placement="bottomLeft"
        trigger={['click']}
      >
        <Button 
          size="small" 
          icon={<MenuOutlined />}
          title={`当前排序: ${getCurrentSortModeName()}`}
        >
          字段排序
        </Button>
      </Dropdown>

      <Modal
        title={
          <Space>
            <SettingOutlined />
            自定义字段排序
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={applyCustomSorting}
        width={600}
        okText="应用排序"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            选择的字段将按顺序显示在表格前面，未选择的字段保持默认排序
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px', color: '#52c41a' }}>
            💡 员工姓名已自动固定在最左侧，无需手动排序
          </Text>
        </div>

        <div style={{ display: 'flex', gap: 16, height: 400 }}>
          {/* 可选字段列表 */}
          <div style={{ flex: 1 }}>
            <Text strong>可选字段</Text>
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: 6, 
              padding: 8,
              marginTop: 8,
              height: 350,
              overflowY: 'auto'
            }}>
              {availableColumns
                .filter(col => !customOrder.includes(col) && !isEmployeeNameField(col))
                .map(col => (
                  <div
                    key={col}
                    style={{
                      padding: '4px 8px',
                      margin: '2px 0',
                      background: '#fafafa',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => addField(col)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e6f7ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                    }}
                  >
                    + {col}
                  </div>
                ))}
            </div>
          </div>

          {/* 已选字段列表 */}
          <div style={{ flex: 1 }}>
            <Text strong>排序字段</Text>
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: 6, 
              padding: 8,
              marginTop: 8,
              height: 350,
              overflowY: 'auto'
            }}>
              {customOrder.map((col, index) => (
                <div
                  key={col}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    margin: '2px 0',
                    background: '#f6ffed',
                    border: '1px solid #d9f7be',
                    borderRadius: 4,
                    fontSize: '12px'
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {index + 1}. {col}
                  </span>
                  <Space size="small">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      onClick={() => moveUp(index)}
                      style={{ padding: '0 4px', minWidth: 'auto' }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowDownOutlined />}
                      disabled={index === customOrder.length - 1}
                      onClick={() => moveDown(index)}
                      style={{ padding: '0 4px', minWidth: 'auto' }}
                    />
                    <Button
                      type="text"
                      size="small"
                      onClick={() => removeField(index)}
                      style={{ padding: '0 4px', minWidth: 'auto', color: '#ff4d4f' }}
                    >
                      ×
                    </Button>
                  </Space>
                </div>
              ))}
              
              {customOrder.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  padding: '20px',
                  fontSize: '12px'
                }}>
                  点击左侧字段添加到排序列表
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};