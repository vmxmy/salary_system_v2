import React, { useRef } from 'react';
import { Space, Spin, Empty } from 'antd';
import { ProTable, ProCard } from '@ant-design/pro-components';
import { TableOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ActionType } from '@ant-design/pro-components';
import ReportStatistics from './ReportStatistics';
import type { ReportDataDisplayProps } from './types';

const ReportDataDisplay: React.FC<ReportDataDisplayProps> = ({
  reportData,
  selectedTemplate,
  loading,
  isMobile = false
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const actionRef = useRef<ActionType>(null);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip={t('generatingReport', '正在生成报表...')} />
        </div>
      );
    }

    if (!reportData) {
      return (
        <Empty
          description={t('selectReportTemplate', '请从左侧选择一个报表模板')}
          style={{ padding: '100px 0' }}
        />
      );
    }

    return (
      <>
        {/* 统计信息卡片 */}
        {reportData.summary && (
          <ReportStatistics summary={reportData.summary} />
        )}

        {/* 数据表格 */}
        <ProTable
          columns={reportData.columns}
          dataSource={reportData.data}
          search={false}
          pagination={{
            total: reportData.total,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: !isMobile,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total}`,
            size: isMobile ? 'small' : 'default'
          }}
          scroll={{ x: 'max-content' }}
          size={isMobile ? 'small' : 'middle'}
          rowKey="key"
          options={{
            density: !isMobile,
            fullScreen: !isMobile,
            setting: !isMobile
          }}
          actionRef={actionRef}
        />
      </>
    );
  };

  return (
    <ProCard
      title={selectedTemplate ? (
        <Space>
          <TableOutlined />
          <span>{selectedTemplate.title || selectedTemplate.name}</span>
        </Space>
      ) : t('selectReport', '请选择报表')}
      style={{ height: isMobile ? 'auto' : '100%' }}
    >
      {renderContent()}
    </ProCard>
  );
};

export default ReportDataDisplay; 