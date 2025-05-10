import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Tooltip, Space, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { EyeOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { AppDispatch } from '../../store';
import {
    fetchEmailSendingTaskHistoryAsync as fetchTaskHistoryAsync, // Use alias
    selectTaskHistoryList,
    selectTaskHistoryTotalCount,
    selectTaskHistoryStatus,
    // setSelectedTaskUuidForDetailsAction, // To be created and used later
} from '../../store/slices/emailSenderSlice';
import type { EmailSendingTaskHistoryItem } from '../../pydantic_models/email_sender';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const { Text } = Typography;

interface TaskListProps {
    onTaskSelect: (taskUuid: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ onTaskSelect }) => {
    const dispatch = useDispatch<AppDispatch>();
    const tasks = useSelector(selectTaskHistoryList);
    const totalCount = useSelector(selectTaskHistoryTotalCount);
    const status = useSelector(selectTaskHistoryStatus);

    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
    });

    useEffect(() => {
        if (totalCount !== undefined) {
            setPagination(prev => ({ ...prev, total: totalCount }));
        }
    }, [totalCount]);

    useEffect(() => {
        const skip = pagination.current && pagination.pageSize ? (pagination.current - 1) * pagination.pageSize : 0;
        const limit = pagination.pageSize || 10;
        dispatch(fetchTaskHistoryAsync({ skip, limit }));
    }, [dispatch, pagination.current, pagination.pageSize]);

    const handleTableChange: TableProps<EmailSendingTaskHistoryItem>['onChange'] = (
        newPagination
    ) => {
        setPagination(prev => ({
            ...prev,
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        }));
    };

    const handleRefresh = () => {
        const skip = pagination.current && pagination.pageSize ? (pagination.current - 1) * pagination.pageSize : 0;
        const limit = pagination.pageSize || 10;
        dispatch(fetchTaskHistoryAsync({ skip, limit }));
    };
    
    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // message.success('已复制到剪贴板'); // Consider adding AntD message for feedback
        }).catch(err => {
            // message.error('复制失败');
            console.error('Failed to copy: ', err);
        });
    };

    const columns: TableProps<EmailSendingTaskHistoryItem>['columns'] = [
        {
            title: '任务 UUID',
            dataIndex: 'task_uuid',
            key: 'task_uuid',
            width: 120,
            render: (uuid: string) => (
                <Tooltip title={uuid}>
                    <Space>
                        <Text style={{ maxWidth: 80 }} ellipsis={{ tooltip: uuid }}>
                            {uuid.substring(0, 8)}...
                        </Text>
                        <Button icon={<CopyOutlined />} size="small" onClick={() => handleCopyToClipboard(uuid)} />
                    </Space>
                </Tooltip>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (statusText: string) => {
                let color = 'default';
                if (statusText === 'completed') color = 'success';
                else if (statusText === 'failed') color = 'error';
                else if (statusText === 'processing') color = 'processing';
                else if (statusText === 'queued') color = 'warning';
                else if (statusText === 'partially_completed') color = 'warning';
                return <Tag color={color}>{statusText}</Tag>;
            },
        },
        { title: '工资周期', dataIndex: 'pay_period', key: 'pay_period', width: 100 },
        {
            title: '开始时间',
            dataIndex: 'started_at',
            key: 'started_at',
            width: 150,
            render: (date: string | null) => date ? formatDistanceToNow(parseISO(date), { addSuffix: true, locale: zhCN }) : '-',
        },
        {
            title: '完成时间',
            dataIndex: 'completed_at',
            key: 'completed_at',
            width: 150,
            render: (date: string | null) => date ? formatDistanceToNow(parseISO(date), { addSuffix: true, locale: zhCN }) : '-',
        },
        { title: '总匹配', dataIndex: 'total_employees_matched', key: 'total_employees_matched', width: 80, align: 'right' },
        { title: '成功', dataIndex: 'total_sent_successfully', key: 'total_sent_successfully', width: 80, align: 'right' },
        { title: '失败', dataIndex: 'total_failed', key: 'total_failed', width: 80, align: 'right' },
        { title: '跳过', dataIndex: 'total_skipped', key: 'total_skipped', width: 80, align: 'right' },
        {
            title: '操作',
            key: 'actions',
            fixed: 'right',
            width: 100,
            align: 'center',
            render: (_, record: EmailSendingTaskHistoryItem) => (
                <Tooltip title="查看详情">
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => onTaskSelect(record.task_uuid)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div>
            <Button
                onClick={handleRefresh}
                icon={<ReloadOutlined />}
                loading={status === 'loading'}
                style={{ marginBottom: 16 }}
            >
                刷新列表
            </Button>
            <Table
                columns={columns}
                rowKey="task_uuid"
                dataSource={tasks}
                loading={status === 'loading'}
                pagination={pagination}
                onChange={handleTableChange}
                scroll={{ x: 1200 }}
                size="small"
            />
        </div>
    );
};

export default TaskList; 