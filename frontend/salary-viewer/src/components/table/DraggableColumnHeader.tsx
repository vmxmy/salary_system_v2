import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuOutlined } from '@ant-design/icons';

interface DraggableHeaderCellProps {
  title: React.ReactNode;
  id: string;
  index: number;
}

export const DraggableHeaderCell: React.FC<DraggableHeaderCellProps> = ({ title, id, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    cursor: 'move',
    transform: CSS.Transform.toString(transform ? { ...transform, scaleX: 1 } : null),
    transition,
    ...(isDragging ? { 
      position: 'relative', 
      zIndex: 9999, 
      background: '#fafafa', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      opacity: 0.8,
    } : {}),
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <MenuOutlined style={{ marginRight: 8, color: '#999' }} />
      {title}
    </div>
  );
};

export default DraggableHeaderCell;
