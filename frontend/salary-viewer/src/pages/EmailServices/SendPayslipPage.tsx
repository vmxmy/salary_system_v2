import React, { useEffect } from 'react';
import { Layout, Row, Col, Typography, Divider, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store'; // Corrected path
import {
    fetchPayPeriodOptionsAsync,
    fetchEmailServerConfigOptionsAsync,
    fetchUnitOptionsAsync,
    selectPayPeriodsLoadingStatus,
    selectEmailServerConfigsLoadingStatus,
    selectUnitsLoadingStatus,
} from '../../store/slices/emailSenderSlice'; // Corrected path
import EmailSenderForm from '../../components/EmailSender/EmailSenderForm'; // Path relative to pages/EmailServices/
import TaskSubmissionFeedback from '../../components/EmailSender/TaskSubmissionFeedback'; // Added import
import TaskMonitoringArea from '../../components/EmailSender/TaskMonitoringArea'; // Added import

const { Title } = Typography;

const SendPayslipPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const payPeriodsLoading = useSelector(selectPayPeriodsLoadingStatus) === 'loading';
    const emailServerConfigsLoading = useSelector(selectEmailServerConfigsLoadingStatus) === 'loading';
    const unitsLoading = useSelector(selectUnitsLoadingStatus) === 'loading';

    const isLoading = payPeriodsLoading || emailServerConfigsLoading || unitsLoading;

    useEffect(() => {
        // Dispatch actions to load initial options for the form
        dispatch(fetchPayPeriodOptionsAsync());
        dispatch(fetchEmailServerConfigOptionsAsync());
        dispatch(fetchUnitOptionsAsync());
    }, [dispatch]);

    return (
        <Layout style={{ padding: '24px' }}>
            <Title level={2}>工资单邮件发送服务</Title>
            <Divider />
            <Spin spinning={isLoading} tip="正在加载配置数据..." size="large">
                <Row gutter={[24, 24]}>
                    {/* 发送配置部分 - 占据整行 */}
                    <Col span={24}>
                        <Title level={4} style={{ marginBottom: '16px' }}>1. 发送配置</Title>
                        <EmailSenderForm />
                    </Col>

                    {/* 任务提交状态部分 - 占据整行 */}
                    <Col span={24}>
                        <Title level={4} style={{ marginBottom: '16px' }}>2. 任务提交状态</Title>
                        <TaskSubmissionFeedback />
                    </Col>

                    {/* 任务历史与监控部分 - 占据整行 */}
                    <Col span={24}>
                        <Title level={4} style={{ marginBottom: '16px' }}>3. 任务历史与监控</Title>
                        <TaskMonitoringArea />
                    </Col>
                </Row>
            </Spin>
        </Layout>
    );
};

export default SendPayslipPage;