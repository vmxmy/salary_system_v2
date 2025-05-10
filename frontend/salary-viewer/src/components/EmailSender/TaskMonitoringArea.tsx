import React, { useState } from 'react'; // Added useState
import { Row, Col, Typography, Card } from 'antd'; // Removed Divider as it's not used
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch } from '../../store';
// import {
//     setSelectedTaskUuidForDetailsAction, // To be created in slice
//     selectSelectedTaskUuidForDetailsSelector // To be created in slice
// } from '../../store/slices/emailSenderSlice';
import TaskList from './TaskList'; // Added import
import TaskDetailsViewer from './TaskDetailsViewer'; // Added import

const { Title } = Typography;

const TaskMonitoringArea: React.FC = () => {
    // const dispatch = useDispatch<AppDispatch>();
    // const selectedTaskUuidFromRedux = useSelector(selectSelectedTaskUuidForDetailsSelector);

    const [selectedTaskUuid, setSelectedTaskUuid] = useState<string | null>(null);

    const handleTaskSelect = (taskUuid: string): void => {
        setSelectedTaskUuid(taskUuid);
        // TODO: Later, this might dispatch an action to Redux as well
        // dispatch(setSelectedTaskUuidForDetailsAction(taskUuid));
    };

    return (
        <div>
            {/* 任务历史列表 - 占据整行 */}
            <Card title="任务历史列表" style={{ marginBottom: '24px' }}>
                <TaskList onTaskSelect={handleTaskSelect} />
            </Card>

            {/* 任务详细信息 - 占据整行 */}
            <Card
                title={
                    <span>
                        任务详细信息 {selectedTaskUuid ? `(ID: ${selectedTaskUuid.substring(0,8)}...)` : ''}
                    </span>
                }
            >
                <TaskDetailsViewer selectedTaskUuid={selectedTaskUuid} />
            </Card>
        </div>
    );
};

export default TaskMonitoringArea;