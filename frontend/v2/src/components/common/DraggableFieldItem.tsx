import React from 'react';
import { Space, Tag, Tooltip, Typography } from 'antd';
import { DragOutlined, CalculatorOutlined, DatabaseOutlined } from '@ant-design/icons';
// @ts-ignore
import { useDrag } from 'react-dnd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

type DragSourceMonitor = any;

// 数据源字段接口
export interface DataSourceField {
  field_name: string;
  field_type: string;
  is_nullable: boolean;
  comment?: string;
  display_name_zh?: string;
  display_name_en?: string;
}

// 计算字段接口
export interface CalculatedField {
  id?: number;
  name: string;
  alias: string;
  formula: string;
  return_type: string;
  description?: string;
  is_global: boolean;
  is_active: boolean;
  category?: string;
  display_name_zh?: string;
  display_name_en?: string;
}

// 拖拽项目类型
export const ItemTypes = {
  FIELD: 'field',
  REPORT_FIELD: 'report_field'
};

// 组件属性接口
export interface DraggableFieldItemProps {
  field: DataSourceField | CalculatedField;
  type: 'data' | 'calculated';
  onDragStart?: () => void;
  onDragEnd?: () => void;
  style?: React.CSSProperties;
  size?: 'small' | 'medium' | 'large';
}

// 可拖拽的字段组件
const DraggableFieldItem: React.FC<DraggableFieldItemProps> = ({ 
  field, 
  type, 
  onDragStart, 
  onDragEnd, 
  style = {},
  size = 'small'
}) => {
  const { i18n } = useTranslation();
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FIELD,
    item: { field, type },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    begin: () => {
      onDragStart?.();
    },
    end: () => {
      onDragEnd?.();
    }
  });

  // 获取字段显示名称
  const getFieldDisplayName = () => {
    if (type === 'calculated') {
      const calcField = field as CalculatedField;
      if (i18n.language === 'zh-CN') {
        return calcField.display_name_zh || calcField.name || calcField.alias;
      } else {
        return calcField.display_name_en || calcField.name || calcField.alias;
      }
    } else {
      const dataField = field as DataSourceField;
      if (i18n.language === 'zh-CN') {
        return dataField.display_name_zh || dataField.comment || dataField.field_name;
      } else {
        return dataField.display_name_en || dataField.field_name;
      }
    }
  };

  // 根据尺寸获取样式配置
  const getSizeConfig = () => {
    switch (size) {
      case 'large':
        return {
          padding: '8px 12px',
          minHeight: '32px',
          fontSize: '14px',
          iconSize: '14px',
          textSize: '13px',
          tagHeight: '20px',
          maxWidth: '160px'
        };
      case 'medium':
        return {
          padding: '6px 10px',
          minHeight: '28px',
          fontSize: '12px',
          iconSize: '12px',
          textSize: '12px',
          tagHeight: '18px',
          maxWidth: '140px'
        };
      case 'small':
      default:
        return {
          padding: '4px 8px',
          minHeight: '24px',
          fontSize: '11px',
          iconSize: '10px',
          textSize: '11px',
          tagHeight: '16px',
          maxWidth: '120px'
        };
    }
  };

  const sizeConfig = getSizeConfig();

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: sizeConfig.padding,
        margin: '2px 0',
        border: '1px solid #d9d9d9',
        borderRadius: '12px',
        backgroundColor: type === 'calculated' ? '#f6ffed' : '#fafafa',
        fontSize: sizeConfig.fontSize,
        lineHeight: '1.2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: sizeConfig.minHeight,
        transition: 'all 0.2s ease',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <Space size={4}>
        <DragOutlined style={{ fontSize: sizeConfig.iconSize }} />
        {type === 'calculated' ? (
          <CalculatorOutlined style={{ color: '#52c41a', fontSize: sizeConfig.iconSize }} />
        ) : (
          <DatabaseOutlined style={{ color: '#1890ff', fontSize: sizeConfig.iconSize }} />
        )}
        <Text 
          strong 
          style={{ 
            fontSize: sizeConfig.textSize, 
            lineHeight: '1.2',
            maxWidth: sizeConfig.maxWidth,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {getFieldDisplayName()}
        </Text>
      </Space>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Tag 
          color={type === 'calculated' ? 'green' : 'blue'}
          style={{ 
            fontSize: '9px', 
            lineHeight: '1.1',
            margin: 0,
            padding: '0 4px',
            height: sizeConfig.tagHeight,
            borderRadius: '8px',
            minWidth: 'auto'
          }}
        >
          {('field_type' in field ? field.field_type : field.return_type).substring(0, 4).toUpperCase()}
        </Tag>
        {'comment' in field && field.comment && (
          <Tooltip title={field.comment}>
            <div style={{ 
              fontSize: '10px', 
              color: '#999',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              ℹ️
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default DraggableFieldItem; 