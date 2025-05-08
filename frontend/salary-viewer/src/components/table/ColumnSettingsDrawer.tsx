import React, { useState, useEffect } from 'react';
import { Drawer, Checkbox, Button, Space, Divider, List, Typography, Tooltip } from 'antd';
import { MenuOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Text } = Typography;

// 定义列配置项接口
export interface ColumnConfig {
  key: string;
  title: string | React.ReactNode;
  visible: boolean;
  fixed?: boolean | 'left' | 'right';
  width?: number;
  dataIndex?: string;
  // 其他可能的列属性
}

interface ColumnSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  columns: TableColumnsType<any>;
  onColumnsChange: (newColumns: ColumnConfig[]) => void;
  defaultVisibleKeys?: string[];
  currentColumnConfigs?: ColumnConfig[]; // 当前列配置，用于同步布局
}

// 可拖拽的列项组件
const SortableItem: React.FC<{
  id: string;
  column: ColumnConfig;
  onVisibleChange: (key: string, visible: boolean) => void;
}> = ({ id, column, onVisibleChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <List.Item>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
          <div {...listeners} style={{ cursor: 'grab', marginRight: 8 }}>
            <MenuOutlined />
          </div>
          <Checkbox
            checked={column.visible}
            onChange={(e) => onVisibleChange(column.key, e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <div style={{ flex: 1 }}>
            {typeof column.title === 'string' ? column.title : column.key}
          </div>
          {column.fixed && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({column.fixed === true ? 'fixed' : column.fixed})
            </Text>
          )}
        </div>
      </List.Item>
    </div>
  );
};

/**
 * 列设置抽屉组件，用于控制表格列的显示/隐藏和排序
 */
const ColumnSettingsDrawer: React.FC<ColumnSettingsDrawerProps> = ({
  open,
  onClose,
  columns,
  onColumnsChange,
  defaultVisibleKeys,
  currentColumnConfigs,
}) => {
  const { t } = useTranslation();

  // 将表格列转换为列配置
  const convertColumnsToConfig = (cols: TableColumnsType<any>): ColumnConfig[] => {
    return cols.map(col => ({
      key: col.key as string,
      title: col.title,
      visible: defaultVisibleKeys ? defaultVisibleKeys.includes(col.key as string) : true,
      fixed: col.fixed,
      width: col.width as number,
      dataIndex: col.dataIndex as string,
    }));
  };

  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);

  // 初始化列配置
  useEffect(() => {
    if (open) {
      if (currentColumnConfigs && currentColumnConfigs.length > 0) {
        // 如果有传入当前列配置，优先使用
        setColumnConfigs([...currentColumnConfigs]);
      } else if (columns.length > 0) {
        // 否则根据columns生成
        setColumnConfigs(convertColumnsToConfig(columns));
      }
    }
  }, [open, columns, currentColumnConfigs]);

  // 设置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理列显示/隐藏变更
  const handleVisibleChange = (key: string, visible: boolean) => {
    const newConfigs = columnConfigs.map(col =>
      col.key === key ? { ...col, visible } : col
    );
    setColumnConfigs(newConfigs);
  };

  // 处理列排序变更
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setColumnConfigs(items => {
        const oldIndex = items.findIndex(i => i.key === active.id);
        const newIndex = items.findIndex(i => i.key === over.id);

        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        return newItems;
      });
    }
  };

  // 应用列设置
  const handleApply = () => {
    onColumnsChange(columnConfigs);
    onClose();
  };

  // 重置列设置
  const handleReset = () => {
    const resetConfigs = convertColumnsToConfig(columns);
    setColumnConfigs(resetConfigs);
  };

  return (
    <Drawer
      title={t('columnSettings.title')}
      placement="right"
      onClose={onClose}
      open={open}
      width={320}
      extra={
        <Tooltip title={t('columnSettings.reset')}>
          <Button icon={<ReloadOutlined />} onClick={handleReset} />
        </Tooltip>
      }
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="primary" onClick={handleApply}>{t('common.apply')}</Button>
          </Space>
        </div>
      }
    >
      <div>
        <Text type="secondary">{t('columnSettings.dragToReorder')}</Text>
        <Divider />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columnConfigs.map(col => col.key)}
            strategy={verticalListSortingStrategy}
          >
            <List
              dataSource={columnConfigs}
              renderItem={item => (
                <SortableItem
                  id={item.key}
                  column={item}
                  onVisibleChange={handleVisibleChange}
                />
              )}
            />
          </SortableContext>
        </DndContext>
      </div>
    </Drawer>
  );
};

export default ColumnSettingsDrawer;
