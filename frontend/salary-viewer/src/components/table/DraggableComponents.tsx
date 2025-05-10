import React from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuOutlined } from '@ant-design/icons';

// 拖拽手柄组件
export const DragHandle = () => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />;

// 可拖拽的表格包装器
export const DraggableWrapper = (props: any) => {
  const { children, ...restProps } = props;
  
  // 检查 children[1] 是否为数组，因为当 dataSource 为空数组时，antd 会提供 'No Data' 元素
  const items = React.useMemo(() => {
    return children[1] instanceof Array 
      ? children[1].map((child: any) => child.key) 
      : [];
  }, [children]);

  return (
    <SortableContext
      items={items}
      strategy={verticalListSortingStrategy}
    >
      <tbody {...restProps}>
        {children}
      </tbody>
    </SortableContext>
  );
};

// 可拖拽的行
export const DraggableRow = (props: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform ? { ...transform, scaleY: 1 } : null),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999, background: '#fafafa', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } : {}),
  };

  const { children, ...restProps } = props;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...restProps}
    >
      {React.Children.map(children, (child) => {
        if (child && child.key === 'dragHandle') {
          return React.cloneElement(child, {
            children: (
              <div {...listeners} style={{ cursor: 'grab' }}>
                {child.props.children}
              </div>
            ),
          });
        }
        return child;
      })}
    </tr>
  );
};
