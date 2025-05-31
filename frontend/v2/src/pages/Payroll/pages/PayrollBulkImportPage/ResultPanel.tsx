// 结果展示组件
// 由 PayrollBulkImportPage 拆分

import React from 'react';
import { Result, Button, Alert, Table, Typography } from 'antd';
import type { ResultPanelProps } from './types.ts';

const { Title } = Typography;

const ResultPanel: React.FC<ResultPanelProps> = ({ uploadResult, columns, t, showDetailedErrors, setShowDetailedErrors, handleStartAgain }) => {
  if (!uploadResult) return null;
  const isAllSuccess = uploadResult.successCount > 0 && uploadResult.errorCount === 0;
  const isPartialSuccess = uploadResult.successCount > 0 && uploadResult.errorCount > 0;
  const isAllFailed = uploadResult.successCount === 0 && uploadResult.errorCount > 0;
  let title, icon;
  if (isAllSuccess) {
    title = t('batch_import.results.all_success', { count: uploadResult.successCount });
    icon = '✅';
  } else if (isPartialSuccess) {
    title = t('batch_import.results.partial_success', { success: uploadResult.successCount, error: uploadResult.errorCount });
    icon = '⚠️';
  } else if (isAllFailed) {
    title = t('batch_import.results.all_failed', { count: uploadResult.errorCount });
    icon = '❌';
  } else {
    title = t('batch_import.results.no_records_processed');
    icon = '⚠️';
  }
  return (
    <Result
      status={isAllSuccess ? 'success' : isPartialSuccess ? 'warning' : 'error'}
      title={title}
      icon={icon}
      extra={[
        <Button type="primary" key="import-another" onClick={handleStartAgain}>重新导入</Button>
      ]}
    >
      {uploadResult.errors.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Button type="link" onClick={() => setShowDetailedErrors(!showDetailedErrors)} style={{ marginBottom: 16 }}>
            {showDetailedErrors ? t('batch_import.button.hide_error_details') : t('batch_import.button.show_error_details')}
          </Button>
          {showDetailedErrors && (
            <div>
              <Title level={5}>''</Title>
              <Table
                dataSource={uploadResult.errors}
                columns={columns}
                rowKey={(record, index) => `error_${index}`}
                size="small"
                pagination={false}
                scroll={{ x: 'max-content' }}
                rowClassName={() => 'invalidRow'}
              />
            </div>
          )}
        </div>
      )}
      {uploadResult.createdEntries && uploadResult.createdEntries.length > 0 && showDetailedErrors && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>''</Title>
          <Table
            dataSource={uploadResult.createdEntries.slice(0, 100)}
            columns={columns.filter(col => col.key !== 'validationErrors')}
            rowKey="_clientId"
            size="small"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </div>
      )}
    </Result>
  );
};

export default ResultPanel; 