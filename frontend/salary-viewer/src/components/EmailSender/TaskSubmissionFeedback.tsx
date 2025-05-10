import React from 'react';
import { Spin, Alert, Typography } from 'antd';
import { useSelector } from 'react-redux';
import {
    selectSendTaskStatus,
    selectSendTaskResponse,
    selectSendTaskError
} from '../../store/slices/emailSenderSlice';
import type { SendPayslipResponse } from '../../pydantic_models/email_sender';

const { Text } = Typography;

const TaskSubmissionFeedback: React.FC = () => {
    const taskStatus = useSelector(selectSendTaskStatus);
    const taskResponse = useSelector(selectSendTaskResponse) as SendPayslipResponse | null; // Explicitly type for safety
    const taskError = useSelector(selectSendTaskError);

    if (taskStatus === 'loading') {
        return (
            <div style={{ display: 'block', marginTop: '20px', textAlign: 'center' }}>
                <Spin />
                <div style={{ marginTop: '8px' }}>正在提交发送请求...</div>
            </div>
        );
    }

    if (taskStatus === 'succeeded' && taskResponse) {
        return (
            <Alert
                message="工资单发送任务已启动"
                description={
                    <>
                        {taskResponse.message && <div><Text strong>消息:</Text> {taskResponse.message}</div>}
                        {taskResponse.task_uuid && <div><Text strong>任务ID:</Text> {taskResponse.task_uuid}</div>}
                        <div>请稍后在下方任务历史区查看详细状态。</div>
                    </>
                }
                type="success"
                showIcon
                style={{ marginTop: '20px' }}
                closable // Allow user to close the alert
            />
        );
    }

    if (taskStatus === 'failed' && taskError) {
        return (
            <Alert
                message="发送请求失败"
                description={taskError}
                type="error"
                showIcon
                style={{ marginTop: '20px' }}
                closable
            />
        );
    }

    return null; // Don't render anything if status is idle or no relevant data
};

export default TaskSubmissionFeedback;