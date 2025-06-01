import React, { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next'; // Import useTranslation

import ReportViewDetailTemplate from '../common/ReportViewDetailTemplate';
import type {
  ReportViewInfo,
} from '../common/ReportViewDetailTemplate';
import { reportViewAPI } from '../../api/reportView';
import type {
  ReportView,
  ReportViewQueryRequest,
  ReportViewQueryResponse
} from '../../types/reportView';
import type { SortOrder } from 'antd/es/table/interface';

interface ReportViewDataProps {
  reportView: ReportView;
  onBack?: () => void;
}

const ReportViewData: React.FC<ReportViewDataProps> = ({
  reportView,
  onBack,
}) => {
  const { t } = useTranslation(['components', 'common', 'reportView']); // Initialize useTranslation hook
  // columnsMeta 状态用于存储从API获取的原始列定义
  const [columnsMeta, setColumnsMeta] = useState<ReportViewQueryResponse['columns']>([]);
  const [initialLoading, setInitialLoading] = useState(true); // 用于首次加载列元数据
  const latestTableParamsRef = useRef<any>({}); // Ref to store latest table params for export

  // 使用 useEffect 来处理 reportView prop 变化时的状态重置
  useEffect(() => {
    // 当 reportView ID 变化时，我们认为是一个新的报表，需要重置状态
    setColumnsMeta([]);
    setInitialLoading(true);
    latestTableParamsRef.current = {}; // 清空旧的表格参数
    // 注意：ProTable 自身可能会在 reportView.id 变化时通过其内部机制或 key 的变化来重新请求数据
    // 这里主要是确保我们组件内部的状态得到同步重置
  }, [reportView.id]); // 仅在 reportView.id 变化时触发

  // 转换报表视图信息格式 (这部分可以保留，用于页面标题等)
  const reportViewInfo: ReportViewInfo = {
    id: reportView.id,
    name: reportView.name,
    description: reportView.description,
    view_status: reportView.view_status,
    category: reportView.category,
    usage_count: reportView.usage_count,
    last_used_at: reportView.last_used_at,
    created_at: reportView.created_at,
  };

  // ProTable 'request' prop 的实现
  const proTableRequest = useCallback(
    async (
      params: { pageSize?: number; current?: number; keyword?: string; [key: string]: any }, // Added keyword for global search explicitly
      sort: Record<string, SortOrder>,
      filter: Record<string, (string | number)[] | null>
    ): Promise<{ data: any[]; success: boolean; total?: number }> => {
      latestTableParamsRef.current = { params, sort, filter }; // Store for export

      // 1. 视图状态检查
      if (reportView.view_status !== 'created') {
        const statusMessages: Record<string, string> = {
          draft: t('reportView:status_draft_message', 'Report is in draft status. Data cannot be displayed.'),
          error: t('reportView:status_error_message', 'SQL execution failed. Data cannot be displayed.'),
        };
        const errorMessage =
          statusMessages[reportView.view_status] ||
          t('reportView:unknown_status_message', 'Report view status is abnormal. Data cannot be displayed.');

        message.error(errorMessage);
        if (initialLoading) setInitialLoading(false);
        return { data: [], success: false, total: 0 };
      }

      // 2. 构建 API 请求参数
      const apiFilters: Record<string, any> = {};

      // 处理 ProTable 列头筛选 (filter object)
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value && value.length > 0) {
            // 后端期望单个值还是数组？假设单个值优先，如果是多选筛选则为数组
            apiFilters[key] = value.length === 1 ? value[0] : value;
          }
        });
      }

      // 处理 ProTable 搜索条件 (来自 params)
      // params 中除了 pageSize 和 current，其余都可能是搜索条件
      Object.keys(params).forEach(key => {
        if (key !== 'current' && key !== 'pageSize' && params[key] !== undefined && params[key] !== '') {
          if (key === 'keyword') { // ProTable 默认的全局搜索参数名
            if (params.keyword) apiFilters['_global_search'] = params.keyword.trim();
          } else {
            // 特定列的搜索条件 (如果ProTable的列配置了搜索并且用户输入了值)
            // 或其他通过 ProForm 提交的表单项
            apiFilters[key] = typeof params[key] === 'string' ? params[key].trim() : params[key];
          }
        }
      });

      const apiSorting: ReportViewQueryRequest['sorting'] = [];
      if (sort) {
        Object.entries(sort).forEach(([field, order]) => {
          if (order) { // 仅当 'order' (ascend/descend) 存在时添加
            apiSorting.push({ field, direction: order === 'ascend' ? 'asc' : 'desc' });
          }
        });
      }

      const queryParamsForAPI: ReportViewQueryRequest = {
        filters: apiFilters,
        sorting: apiSorting,
        page: params.current || 1,
        page_size: params.pageSize || 20,
      };

      try {
        const response = await reportViewAPI.queryReportViewData(reportView.id, queryParamsForAPI);

        // 统一处理响应，包括可能被 Axios 等库包装的情况
        let actualResponseData: ReportViewQueryResponse | null = null;
        if (response && typeof response === 'object') {
          if ('data' in response && 'columns' in response) { // Directly ReportViewQueryResponse
            actualResponseData = response as ReportViewQueryResponse;
          } else if (
            (response as any).data &&
            typeof (response as any).data === 'object' &&
            'data' in (response as any).data &&
            'columns' in (response as any).data
          ) { // Axios style wrapper
            actualResponseData = (response as any).data as ReportViewQueryResponse;
          }
        }

        if (actualResponseData) {
          const { data = [], columns = [], total } = actualResponseData;
          const calculatedTotal = total !== undefined ? total : data.length;

          // Only update column definitions on initial load or if not set yet
          if (initialLoading || columnsMeta.length === 0) {
            setColumnsMeta(columns);
          }
          if (initialLoading) setInitialLoading(false);

          return {
            data: data,
            success: true,
            total: calculatedTotal,
          };
        }

        // If response format is unexpected
        message.error(t('components:unexpected_response_format', 'Unexpected response format from server.'));
        if (initialLoading) setInitialLoading(false);
        return { data: [], success: false, total: 0 };

      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.message || t('common:error_unknown', 'Unknown error occurred.');
        message.error(t('components:data_fetch_failed', { message: errorMsg, defaultValue: `Failed to load data: ${errorMsg}` }));
        if (initialLoading) setInitialLoading(false);
        return { data: [], success: false, total: 0 };
      }
    },
    [reportView.id, reportView.view_status, initialLoading, columnsMeta.length, t] // Added t to dependencies
  );

  // 导出函数 - 支持当前的筛选和排序条件
  const handleExport = useCallback(async (format: 'excel' | 'csv' | 'pdf') => {
    const { params: proTableParams, sort: proTableSort, filter: proTableFilter } = latestTableParamsRef.current;

    if (!proTableParams) {
      message.warning(t('components:no_table_params_for_export', 'No table parameters available for export. Please load data first.'));
      return;
    }

    try {
      const apiFilters: Record<string, any> = {};
      // Logic to process filters similar to proTableRequest
      if (proTableFilter) {
        Object.entries(proTableFilter).forEach(([key, value]) => {
          if (value && Array.isArray(value) && value.length > 0) {
            apiFilters[key] = value.length === 1 ? value[0] : value;
          }
        });
      }

      if (proTableParams) {
        Object.keys(proTableParams).forEach(key => {
          if (key !== 'current' && key !== 'pageSize' && proTableParams[key] !== undefined && proTableParams[key] !== '') {
            if (key === 'keyword') {
              if (proTableParams.keyword) apiFilters['_global_search'] = proTableParams.keyword.trim();
            } else if (!apiFilters[key]) { // Avoid overwriting keys already set from proTableFilter
              apiFilters[key] = typeof proTableParams[key] === 'string' ? proTableParams[key].trim() : proTableParams[key];
            }
          }
        });
      }

      const apiSorting: ReportViewQueryRequest['sorting'] = [];
      if (proTableSort) {
        Object.entries(proTableSort).forEach(([field, order]) => {
          if (order) { // Only add when 'order' (ascend/descend) exists
            apiSorting.push({ field, direction: order === 'ascend' ? 'asc' : 'desc' });
          }
        });
      }

      const queryParamsForExport: ReportViewQueryRequest = {
        filters: apiFilters,
        sorting: apiSorting,
        page: 1, // Export all data
        page_size: 10000, // Use a very large positive integer to get all data (adjust as per API limits)
      };

      message.loading({ content: t('components:export_loading', { format: format.toUpperCase(), defaultValue: `Exporting to ${format.toUpperCase()}...` }), key: 'exporting' });

      const blob = await reportViewAPI.exportReportViewData(
        reportView.id,
        queryParamsForExport,
        format
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const extension = format === 'excel' ? 'xlsx' : format; // .csv and .pdf are already direct extensions
      link.download = `${reportView.name || 'report'}_${timestamp}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: t('components:export_success', 'Export successful!'), key: 'exporting' });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || t('common:error_unknown', 'Unknown error occurred.');
      message.error({ content: t('components:export_failed', { message: errorMsg, defaultValue: `Export failed: ${errorMsg}` }), key: 'exporting' });
    }
  }, [reportView.id, reportView.name, t]); // Added t to dependencies

  return (
    <ReportViewDetailTemplate
      reportViewInfo={reportViewInfo}
      proTableRequest={proTableRequest}
      columnsMeta={columnsMeta}
      initialLoading={initialLoading} // Pass initial loading state for skeleton or loading indicator
      onExport={handleExport}
      onBack={onBack}
      showExport={true}
      // ProTable key, ensure ProTable fully re-renders and fetches data when switching between reports
      // This is crucial for ensuring ProTable's internal state is also reset
      key={reportView.id}
      translationNamespaces={['reportView', 'common', 'components']} // Ensure all relevant namespaces are included
    />
  );
};

export default ReportViewData;