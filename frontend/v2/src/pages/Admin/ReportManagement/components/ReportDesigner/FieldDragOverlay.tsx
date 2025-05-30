import React from 'react';
import { Tag } from 'antd';
import { DatabaseOutlined, CalculatorOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import type { FieldItem } from './types';

const OverlayContainer = styled.div`
  padding: 8px 12px;
  background: white;
  border: 2px solid #1890ff;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: grabbing;
  opacity: 0.9;
`;

const FieldName = styled.span`
  font-size: 13px;
  color: #262626;
  font-weight: 500;
`;

interface FieldDragOverlayProps {
  field: FieldItem;
}

const FieldDragOverlay: React.FC<FieldDragOverlayProps> = ({ field }) => {
  const fieldTypeMap: Record<string, { color: string; label: string }> = {
    string: { color: 'blue', label: '文本' },
    number: { color: 'green', label: '数字' },
    date: { color: 'orange', label: '日期' },
    boolean: { color: 'purple', label: '布尔' },
    json: { color: 'gold', label: 'JSON' }
  };

  const typeConfig = fieldTypeMap[field.field_type] || { color: 'default', label: field.field_type };

  return (
    <OverlayContainer>
      {field.is_calculated ? (
        <CalculatorOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
      ) : (
        <DatabaseOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
      )}
      <FieldName>{field.field_alias || field.field_name}</FieldName>
      <Tag color={typeConfig.color} style={{ margin: 0, fontSize: '11px' }}>
        {typeConfig.label}
      </Tag>
    </OverlayContainer>
  );
};

export default FieldDragOverlay; 