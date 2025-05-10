import React, { useEffect, useState } from 'react';
import {
    Descriptions,
    Table,
    Tag,
    Spin,
    Alert,
    Typography,
    Empty,
    Button,
    Tooltip,
    Space,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { CopyOutlined } from '@ant-design/icons';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { AppDispatch } from '../../store';
import {
    fetchEmailSendingTaskDetailAsync as fetchTaskDetailsAsync, // Use alias
    fetchEmailLogsForTaskAsync as fetchTaskLogsAsync,    // Use alias
    selectCurrentTaskDetail,
    selectCurrentTaskDetailStatus,
    selectCurrentTaskLogs,
    selectCurrentTaskLogsTotalCount,
    selectCurrentTaskLogsStatus,
    clearCurrentTaskDetails, // 添加这个导入
} from '../../store/slices/emailSenderSlice';
import type {
    EmailSendingTaskResponse,
    EmailLogResponse,
} from '../../pydantic_models/email_sender';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const { Title, Text, Paragraph } = Typography;

interface TaskDetailsViewerProps {
    selectedTaskUuid: string | null;
}

const TaskDetailsViewer: React.FC<TaskDetailsViewerProps> = ({ selectedTaskUuid }) => {
    const dispatch = useDispatch<AppDispatch>();

    const taskDetail = useSelector(selectCurrentTaskDetail);
    const detailStatus = useSelector(selectCurrentTaskDetailStatus);
    const logs = useSelector(selectCurrentTaskLogs);
    const logsTotalCount = useSelector(selectCurrentTaskLogsTotalCount);
    const logsStatus = useSelector(selectCurrentTaskLogsStatus);

    const [logsPagination, setLogsPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
    });

    useEffect(() => {
        if (selectedTaskUuid) {
            console.log(`Selected task UUID changed to: ${selectedTaskUuid}`);
            dispatch(fetchTaskDetailsAsync(selectedTaskUuid));
            // Reset logs pagination and fetch first page of logs for the new task
            setLogsPagination(prev => ({ ...prev, current: 1, total: 0 }));

            // 确保使用正确的参数格式获取日志
            const pageSize = logsPagination.pageSize || 10;
            console.log(`Fetching logs for task ${selectedTaskUuid} with pageSize ${pageSize}`);
            dispatch(fetchTaskLogsAsync({
                taskUuid: selectedTaskUuid,
                params: {
                    skip: 0,
                    limit: pageSize
                }
            }));
        } else {
            // 如果没有选择任务，清除当前任务详情
            dispatch(clearCurrentTaskDetails());
        }
    }, [dispatch, selectedTaskUuid]);

    useEffect(() => {
        // This effect handles fetching logs when pagination changes for an already selected task
        if (selectedTaskUuid && logsPagination.current && logsPagination.pageSize) {
            const skip = (logsPagination.current - 1) * logsPagination.pageSize;
            console.log(`Pagination changed: page=${logsPagination.current}, pageSize=${logsPagination.pageSize}, skip=${skip}`);
            dispatch(fetchTaskLogsAsync({
                taskUuid: selectedTaskUuid,
                params: {
                    skip,
                    limit: logsPagination.pageSize
                }
            }));
        }
    }, [dispatch, selectedTaskUuid, logsPagination.current, logsPagination.pageSize]);

    useEffect(() => {
        if (logsTotalCount !== undefined) {
            setLogsPagination(prev => ({ ...prev, total: logsTotalCount }));
        }
    }, [logsTotalCount]);

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // message.success('已复制到剪贴板');
        }).catch(err => {
            // message.error('复制失败');
            console.error('Failed to copy: ', err);
        });
    };

    const emailLogsColumns: TableProps<EmailLogResponse>['columns'] = [
        {
            title: '收件人姓名',
            dataIndex: 'recipient_name',
            key: 'recipient_name',
            width: 120,
            render: (name: string | null) => name || '-'
        },
        {
            title: '收件人邮箱',
            dataIndex: 'recipient_emails',
            key: 'recipient_emails',
            width: 200,
            render: (emails: string[]) => emails && emails.length > 0 ? emails[0] : '-'
        },
        {
            title: '主题',
            dataIndex: 'subject',
            key: 'subject',
            width: 250,
            ellipsis: true,
            render: (text: string) => <Tooltip title={text}>{text}</Tooltip>
        },
        {
            title: '发送状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => {
                let color = 'default';
                let displayText = status;

                if (status === 'sent' || status === 'success') {
                    color = 'success';
                    displayText = '发送成功';
                } else if (status === 'failed') {
                    color = 'error';
                    displayText = '发送失败';
                } else if (status.startsWith('skipped')) {
                    color = 'warning';
                    displayText = status.includes('no_email') ? '跳过(无邮箱)' : '跳过(无数据)';
                }

                return <Tag color={color}>{displayText}</Tag>;
            },
        },
        {
            title: '发送时间',
            dataIndex: 'sent_at',
            key: 'sent_at',
            width: 180,
            render: (date: string | null) => date ? format(parseISO(date), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '-',
        },
        {
            title: '错误信息',
            dataIndex: 'error_message',
            key: 'error_message',
            ellipsis: true,
            render: (text: string | null) => text ? <Tooltip title={text}><Text>{text}</Text></Tooltip> : '-',
        },
    ];

    const handleLogsTableChange: TableProps<EmailLogResponse>['onChange'] = (
        newPagination
    ) => {
        setLogsPagination(prev => ({
            ...prev,
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        }));
    };

    if (!selectedTaskUuid) {
        return (
            <Empty description="请从左侧列表选择一个任务以查看详细信息。" style={{ marginTop: '20px' }} />
        );
    }

    if (detailStatus === 'loading') {
        return <Spin tip="正在加载任务详情..." style={{ display: 'block', marginTop: '20px' }} />;
    }

    if (detailStatus === 'failed' || !taskDetail) {
        return <Alert message="错误" description="无法加载任务详情，请稍后重试或选择其他任务。" type="error" showIcon style={{ marginTop: '20px' }} />;
    }

    const descriptionItems = [
        { key: '1', label: '任务 UUID', children: <Space>{taskDetail.task_uuid} <Button icon={<CopyOutlined />} size="small" onClick={() => handleCopyToClipboard(taskDetail.task_uuid)} /></Space> },
        { key: '2', label: '状态', children: <Tag color={taskDetail.status === 'completed' ? 'success' : taskDetail.status === 'failed' ? 'error' : 'processing'}>{taskDetail.status}</Tag> },
        { key: '3', label: '工资周期', children: taskDetail.pay_period },
        { key: '4', label: '邮件配置ID', children: taskDetail.email_config_id },
        { key: '5', label: '创建用户ID', children: taskDetail.requested_by_user_id },
        { key: '6', label: '开始时间', children: taskDetail.started_at ? format(parseISO(taskDetail.started_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '-' },
        { key: '7', label: '完成时间', children: taskDetail.completed_at ? format(parseISO(taskDetail.completed_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '-' },
        { key: '8', label: '匹配员工数', children: taskDetail.total_employees_matched },
        { key: '9', label: '成功发送数', children: taskDetail.total_sent_successfully },
        { key: '10', label: '发送失败数', children: taskDetail.total_failed },
        { key: '11', label: '跳过发送数', children: taskDetail.total_skipped },
        { key: '12', label: '最后错误信息', children: <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '更多' }}>{taskDetail.last_error_message || '无'}</Paragraph>, span: 2 },
        { key: '13', label: '筛选条件', children: <pre style={{ maxHeight: '100px', overflowY: 'auto', background: '#f5f5f5', padding: '8px' }}>{JSON.stringify(taskDetail.filters_applied, null, 2)}</pre>, span: 3 },
        { key: '14', label: '邮件主题模板', children: <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '更多' }}>{taskDetail.subject_template}</Paragraph>, span: 3 },
    ];

    return (
        <div>
            <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }} items={descriptionItems} />

            <div style={{ marginTop: '24px' }}>
                <Title level={5} style={{ marginBottom: '16px' }}>邮件发送日志 (共 {logsTotalCount || 0} 条)</Title>
                <Table
                    columns={emailLogsColumns}
                    rowKey={(record) => `${record.id}`}
                    dataSource={logs}
                    loading={logsStatus === 'loading'}
                    pagination={logsPagination}
                    onChange={handleLogsTableChange}
                    scroll={{ x: 800 }}
                    size="small"
                    locale={{ emptyText: '暂无邮件发送记录' }}
                />
            </div>
        </div>
    );
};

export default TaskDetailsViewer;