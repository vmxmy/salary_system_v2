import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { AppRouteObject } from '../../router/routes'; // Assuming AppRouteObject is exported from main router
// import i18n from '../../i18n'; // 移除此导入
import PayrollPeriodsPageV2 from './pages/PayrollPeriodsPageV2';
import PayrollRunsPageV2 from './pages/PayrollRunsPageV2';
import PayrollRunDetailPage from './pages/PayrollRunDetailPage';
import PayrollEntryPage from './pages/PayrollEntryPage';
import PayrollBulkImportPage from './pages/PayrollBulkImportPage';
import PayrollComponentsPage from './pages/PayrollComponentsPage';
import {
  P_PAYROLL_PERIOD_VIEW,
  P_PAYROLL_RUN_VIEW,
  P_PAYROLL_ENTRY_VIEW,
  P_PAYROLL_ENTRY_BULK_IMPORT,
  P_PAYROLL_COMPONENT_VIEW
} from './constants/payrollPermissions'; // 添加薪资字段查看权限

// Lazy load page components
// const PayrollPeriodsPage = lazy(() => import('./pages/PayrollPeriodsPage');
// const PayrollRunsPage = lazy(() => import('./pages/PayrollRunsPage');
// const PayrollEntriesPage = lazy(() => import('./pages/PayrollEntriesPage');
// const PayrollRunDetailPage = lazy(() => import('./pages/PayrollRunDetailPage');

// Placeholder for PayrollRunDetailPage until it's created
// const PayrollRunDetailPagePlaceholder: React.FC = () => (
//   React.createElement('div', null, t('payroll:auto____e896aa')
// );

export const payrollRoutes: AppRouteObject[] = [
  {
    index: true, 
    element: React.createElement(Navigate, { to: "periods", replace: true }),
  },
  {
    path: 'periods',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Periods...') }, React.createElement(PayrollPeriodsPageV2)),
    meta: {
      title: 'pageTitle:payroll_periods', // 修改为使用pageTitle命名空间
      requiredPermissions: [P_PAYROLL_PERIOD_VIEW],
    },
  },
  {
    path: 'runs',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Runs...') }, React.createElement(PayrollRunsPageV2)),
    meta: {
      title: 'payroll:page_title.payroll_runs', // 使用静态翻译键
      requiredPermissions: [P_PAYROLL_RUN_VIEW],
    },
  },
  {
    path: 'runs/:runId',
    element: React.createElement(PayrollRunDetailPage),
    meta: {
      title: 'payroll:page_title.payroll_run_detail', // 使用静态翻译键
      requiredPermissions: [P_PAYROLL_RUN_VIEW], 
    },
  },
  {
    path: 'entry',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Entry...') }, React.createElement(PayrollEntryPage)),
    meta: {
      title: 'payroll:page_title.payroll_entry', // 使用静态翻译键
      requiredPermissions: [P_PAYROLL_ENTRY_VIEW],
    },
  },
  {
    path: 'bulk-import',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Bulk Import...') }, React.createElement(PayrollBulkImportPage)),
    meta: {
      title: 'payroll:batch_import.page_title', // 使用批量导入页面标题翻译键
      requiredPermissions: [P_PAYROLL_ENTRY_BULK_IMPORT],
    },
  },
  {
    path: 'components',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Components...') }, React.createElement(PayrollComponentsPage)),
    meta: {
      title: 'payroll:page_title.payroll_components', // 使用薪资字段管理页面标题翻译键
      requiredPermissions: [P_PAYROLL_COMPONENT_VIEW],
    },
  },
  // {
  //   path: 'entries',
  //   element: <React.Suspense fallback={<div>Loading Payroll Entries...</div>}><PayrollEntriesPage /></React.Suspense>,
  //   meta: {
  //     title: t('payroll:auto_text_e5b7a5'),
  //   },
  // },
]; 