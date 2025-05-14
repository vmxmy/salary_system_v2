import React, { useCallback, useState } from 'react';
import { Table, Typography, Button, Space, Form, Popconfirm } from 'antd';
import { DndContext, PointerSensor, closestCenter, useSensors, useSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableWrapper } from '../table/DraggableComponents';
import DraggableHeaderCell from '../table/DraggableColumnHeader';
import { useSalaryContext, SalaryRecord } from './SalaryContext';
import { convertConfigToColumns } from '../../utils/tableUtils';
import EditableCell from './EditableCell';
import EditableRow from './EditableRow';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { SalaryRecordUpdateData } from '../../services/api';

const { Title } = Typography;

/**
 * 薪资数据表格组件
 */
const SalaryTable: React.FC = () => {
    const {
        filteredData,
        loading,
        pagination,
        columnConfigs,
        advancedFilters,
        currentLayoutName,
        isColumnDraggable,
        setPagination,
        setColumnConfigs,
    } = useSalaryContext();

    const [form] = Form.useForm();

    // 配置拖拽传感器
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 需要移动8像素才会触发拖拽
            },
        })
    );

    // 处理列拖拽结束
    const handleDragEnd = useCallback((event: any) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            // 找到拖拽的列和目标列的索引
            const activeIndex = columnConfigs.findIndex(col => col.key === active.id);
            const overIndex = columnConfigs.findIndex(col => col.key === over.id);

            if (activeIndex !== -1 && overIndex !== -1) {
                // 创建新的列配置数组，交换列的位置
                const newColumnConfigs = [...columnConfigs];
                const [movedColumn] = newColumnConfigs.splice(activeIndex, 1);
                newColumnConfigs.splice(overIndex, 0, movedColumn);

                // 更新列配置
                setColumnConfigs(newColumnConfigs);
            }
        }
    }, [columnConfigs, setColumnConfigs]);

    // 处理表格变化事件（排序、筛选、分页）
    const handleTableChange = useCallback((pagination: any) => {
        // 更新分页
        setPagination(prev => ({
            ...prev,
            current: pagination.current || 1,
            pageSize: pagination.pageSize || 10
        }));
    }, [setPagination]);

    // 生成表格列
    console.log("SalaryTable rendering with:", {
        dataLength: filteredData.length,
        columnsLength: columnConfigs.length,
        loading,
        paginationInfo: {
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total
        }
    });

    // 生成基础列
    const baseColumns = convertConfigToColumns(columnConfigs);
    console.log(`Generated ${baseColumns.length} table columns`);

    if (baseColumns.length > 0) {
        console.log("First column:", baseColumns[0]);
    }

    // 合并列 (不再需要操作列)
    const columns = baseColumns;

    // 如果启用了列拖拽，使用可拖拽的表头
    const tableColumns = isColumnDraggable
        ? columns.map(col => ({
            ...col,
            onHeaderCell: () => ({
                // Return empty object as DraggableHeaderCell receives column props directly
            }),
        }))
        : columns;

    // 表格组件 (移除EditableRow和EditableCell)
    const components = {
        header: {
            cell: isColumnDraggable ? DraggableHeaderCell : undefined,
        },
    };

    return (
        <div>
            {isColumnDraggable ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={columnConfigs.map(col => col.key)}
                        strategy={horizontalListSortingStrategy}
                    >
                        <DraggableWrapper>
                            <Table
                                    components={components}
                                    dataSource={filteredData}
                                    columns={tableColumns}
                                    pagination={{
                                        ...pagination,
                                        total: filteredData.length
                                    }}
                                    onChange={handleTableChange}
                                    loading={loading}
                                    scroll={{ x: 'max-content', y: 600 }}
                                    bordered
                                    size="small"
                                    className="zebra-striped-table"
                                    sticky
                                    locale={{
                                        emptyText: advancedFilters.length > 0
                                            ? '没有符合筛选条件的数据'
                                            : '暂无数据'
                                    }}
                                    title={() => (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 8px',
                                            borderBottom: '1px solid #e8e8e8',
                                            backgroundColor: '#fafafa'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                {currentLayoutName && (
                                                    <Title level={3} style={{
                                                        margin: 0,
                                                        fontSize: '22px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {currentLayoutName}
                                                    </Title>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    rowKey="_consolidated_data_id"
                                />
                        </DraggableWrapper>
                    </SortableContext>
                </DndContext>
            ) : (
                // 移除Form wrapper
                <Table
                    components={components}
                    dataSource={filteredData}
                    columns={tableColumns}
                    pagination={{
                        ...pagination,
                        total: filteredData.length
                    }}
                    onChange={handleTableChange}
                    loading={loading}
                    scroll={{ x: 'max-content', y: 600 }}
                    bordered
                    size="small"
                    className="zebra-striped-table"
                    sticky
                    locale={{
                        emptyText: advancedFilters.length > 0
                            ? '没有符合筛选条件的数据'
                            : '暂无数据'
                    }}
                    title={() => (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 8px',
                            borderBottom: '1px solid #e8e8e8',
                            backgroundColor: '#fafafa'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {currentLayoutName && (
                                    <Title level={3} style={{
                                        margin: 0,
                                        fontSize: '22px',
                                        fontWeight: 'bold'
                                    }}>
                                        {currentLayoutName}
                                    </Title>
                                )}
                            </div>
                        </div>
                    )}
                    rowKey="_consolidated_data_id"
                />
            )}
        </div>
    );
};

export default SalaryTable;