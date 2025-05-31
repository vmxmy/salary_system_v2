/**
 * 报表视图数据查看组件
 * @description 使用ReportViewDetailTemplate模板显示报表视图的数据，支持服务器端排序、筛选、搜索
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'; // Added useEffect
import { message } from 'antd';

import ReportViewDetailTemplate from '../common/ReportViewDetailTemplate';
import type {
  ReportViewInfo,
  // ReportViewColumn, // 旧类型，将被 columnsMeta 替代
  // ReportViewQueryParams // 旧类型，将被 ProTable request 参数替代
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
  // columnsMeta 状态用于存储从API获取的原始列定义
  const [columnsMeta, setColumnsMeta] = useState<ReportViewQueryResponse['columns']>([]);
  const [initialLoading, setInitialLoading] = useState(true); // 用于首次加载列元数据
  const latestTableParamsRef = useRef<any>({}); // Ref to store latest table params for export

  // 使用 useEffect 来处理 reportView prop 变化时的状态重置
  useEffect(() => {
    // 当 reportView ID 变化时，我们认为是一个新的报表，需要重置状态
    console.log('[ReportViewData] ReportView prop changed, resetting states.', { newId: reportView.id });
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
        const statusMessages = {
          draft: {t('components:auto____e68aa5')},
          error: {t('components:auto__sql__e68aa5')},
        };
        const errorMessage =
          statusMessages[reportView.view_status as keyof typeof statusMessages] ||
          {t('components:auto__reportview_view_status___e68aa5')};
        
        console.warn('[ReportViewData] View status check failed:', {
          viewId: reportView.id,
          viewName: reportView.name,
          status: reportView.view_status,
          syncError: reportView.sync_error,
        });
        
        message.error(errorMessage);
        if (initialLoading) setInitialLoading(false);
        return { data: [], success: false, total: 0 };
      }

      console.log('[ReportViewData] proTableRequest - Input - Params:', JSON.stringify(params, null, 2));
      console.log('[ReportViewData] proTableRequest - Input - Sort:', JSON.stringify(sort, null, 2));
      console.log('[ReportViewData] proTableRequest - Input - Filter:', JSON.stringify(filter, null, 2));

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

      console.log('[ReportViewData] Fetching data with API request (proTableRequest):', JSON.stringify(queryParamsForAPI, null, 2));

      try {
        const response = await reportViewAPI.queryReportViewData(reportView.id, queryParamsForAPI);
        
        console.log('[ReportViewData] Raw API response:', response);
        
        // 统一处理响应，包括可能被 Axios 等库包装的情况
        let actualResponseData: ReportViewQueryResponse | null = null;
        if (response && typeof response === 'object') {
          if ('data' in response && 'columns' in response) { // 直接是 ReportViewQueryResponse
            actualResponseData = response as ReportViewQueryResponse;
          } else if ((response as any).data && typeof (response as any).data === 'object' && 
                     'data' in (response as any).data && 'columns' in (response as any).data) { // Axios 风格包装
            actualResponseData = (response as any).data as ReportViewQueryResponse;
            console.log('[ReportViewData] Detected Axios-style wrapped response.');
          }
        }

        if (actualResponseData) {
            const { data = [], columns = [], total } = actualResponseData;
            const calculatedTotal = total !== undefined ? total : data.length;
            
            console.log('[ReportViewData] Processed response:', {
              dataLength: data.length,
              columnsLength: columns.length,
              total: calculatedTotal,
            });
            
            // 仅在首次加载数据或 columnsMeta 未设置时更新列定义
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
        
        // 如果响应格式不符合预期
        console.error('Unexpected API response format after attempting to unwrap:', response);
        message.error({t('components:auto____e88eb7')});
        if (initialLoading) setInitialLoading(false);
        return { data: [], success: false, total: 0 };

      } catch (error: any) {
        console.error('Failed to load report data (proTableRequest):', error);
        const errorMsg = error?.response?.data?.message || error?.message || {t('components:auto_text_e69caa')};
        message.error({t('components:auto__errormsg__e58aa0')});
        if (initialLoading) setInitialLoading(false);
        return { data: [], success: false, total: 0 };
      }
    },
    // 依赖项应包含所有在回调函数外部定义并在其内部使用的变量
    // reportView 本身是 props，如果其内部字段（如 id, view_status）可能变化并影响逻辑，也应考虑
    // 但由于 reportView 是对象，直接放入依赖数组可能导致不必要的重渲染
    // 更精细的做法是仅依赖 reportView.id 和 reportView.view_status
    // initialLoading 和 columnsMeta.length 也是此回调依赖的状态，但它们的变化通常是此回调执行的结果，
    // 或者在 reportView.id 变化时通过 useEffect 重置，从而间接触发 proTableRequest 的重新评估（如果 ProTable 重新请求）
    // 因此，主要外部依赖是 reportView.id 和 reportView.view_status
    [reportView.id, reportView.view_status]
  );

  // 导出函数 - 支持当前的筛选和排序条件
  const handleExport = useCallback(async (format: 'excel' | 'csv' | 'pdf') => {
    const { params: proTableParams, sort: proTableSort, filter: proTableFilter } = latestTableParamsRef.current;

    if (!proTableParams) {
      message.warning( {t('components:auto____e697a0')});
      return;
    }
    
    console.log('[ReportViewData] handleExport - Input - ProTable Params:', JSON.stringify(proTableParams, null, 2));
    console.log('[ReportViewData] handleExport - Input - ProTable Sort:', JSON.stringify(proTableSort, null, 2));
    console.log('[ReportViewData] handleExport - Input - ProTable Filter:', JSON.stringify(proTableFilter, null, 2));

    try {
      const apiFilters: Record<string, any> = {};
      // 与 proTableRequest 中类似的逻辑处理筛选条件
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
            } else if (!apiFilters[key]) { // 避免覆盖已从 proTableFilter 中设置的同名键
              apiFilters[key] = typeof proTableParams[key] === 'string' ? proTableParams[key].trim() : proTableParams[key];
            }
          }
        });
      }
      
      const apiSorting: ReportViewQueryRequest['sorting'] = [];
      if (proTableSort) {
        Object.entries(proTableSort).forEach(([field, order]) => {
          if (order) { // 仅当 'order' (ascend/descend) 存在时添加
            apiSorting.push({ field, direction: order === 'ascend' ? 'asc' : 'desc' });
          }
        });
      }
      
      const queryParamsForExport: ReportViewQueryRequest = {
        filters: apiFilters,
        sorting: apiSorting,
        page: 1, // 导出所有数据
        page_size: 1000, // 使用一个非常大的正整数以获取所有数据
      };

      console.log('[ReportViewData] Exporting data with API request params:', JSON.stringify(queryParamsForExport, null, 2));

      message.loading({ content: {t('components:auto__format_touppercase___e6ada3')}, key: 'exporting' });

      const blob = await reportViewAPI.exportReportViewData(
        reportView.id,
        queryParamsForExport,
        format
      );

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const extension = format === 'excel' ? 'xlsx' : format;
      link.download = `${reportView.name || 'report'}_${timestamp}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: {t('components:auto_text_e5afbc')}, key: 'exporting' });
    } catch (error: any) {
      console.error('Export failed:', error);
      const errorMsg = error?.response?.data?.message || error?.message || {t('components:auto_text_e69caa')};
      message.error({ content: {t('components:auto__errormsg__e5afbc')}, key: 'exporting' });
    }
  }, [reportView.id, reportView.name]); // reportView.name 用于文件名, reportView.id 用于 API 调用

  return (
    <ReportViewDetailTemplate
      reportViewInfo={reportViewInfo}
      // dataSource, columns, loading, total, onFetchData 将由 ProTable 的 request 模式处理
      // 我们传递 request 函数和列的元数据
      proTableRequest={proTableRequest}
      columnsMeta={columnsMeta}
      initialLoading={initialLoading} // 传递初始加载状态，用于显示骨架屏或加载指示
      onExport={handleExport}
      onBack={onBack}
      showExport={true}
      // showSearch and showPagination are now implicitly handled by ProTable or its column/pagination props
      // // 启用服务器端功能 // These props are also not needed for ReportViewDetailTemplate anymore
      // serverSidePagination={true}
      // serverSideSorting={true}
      // serverSideFiltering={true} // This prop is removed from ReportViewDetailTemplateProps
      // ProTable key，确保在切换不同报表时，ProTable能完全重新渲染和获取数据
      // 这是确保 ProTable 内部状态也得到重置的关键
      key={reportView.id}
      translationNamespaces={['reportView', 'common']}
    />
  );
};

export default ReportViewData; 