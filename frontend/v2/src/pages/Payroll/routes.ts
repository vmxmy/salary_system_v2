import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { AppRouteObject } from '../../router/routes'; // Assuming AppRouteObject is exported from main router
// import i18n from '../../i18n'; // 移除此导入
import PayrollPeriodsPage from './pages/PayrollPeriodsPage';
import PayrollRunsPage from './pages/PayrollRunsPage';
import PayrollRunDetailPage from './pages/PayrollRunDetailPage';
import PayrollEntryPage from './pages/PayrollEntryPage';
import {
  P_PAYROLL_PERIOD_VIEW,
  P_PAYROLL_RUN_VIEW,
  P_PAYROLL_ENTRY_VIEW
} from './constants/payrollPermissions'; // 添加薪资录入查看权限

// Lazy load page components
// const PayrollPeriodsPage = lazy(() => import('./pages/PayrollPeriodsPage'));
// const PayrollRunsPage = lazy(() => import('./pages/PayrollRunsPage'));
// const PayrollEntriesPage = lazy(() => import('./pages/PayrollEntriesPage'));
// const PayrollRunDetailPage = lazy(() => import('./pages/PayrollRunDetailPage'));

// Placeholder for PayrollRunDetailPage until it's created
// const PayrollRunDetailPagePlaceholder: React.FC = () => (
//   React.createElement('div', null, '工资计算批次详情页 (占位符)')
// );

export const payrollRoutes: AppRouteObject[] = [
  {
    index: true, 
    element: React.createElement(Navigate, { to: "periods", replace: true }),
  },
  {
    path: 'periods',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Periods...') }, React.createElement(PayrollPeriodsPage)),
    meta: {
      title: 'pageTitle:payroll_periods', // 修改为使用pageTitle命名空间
      requiredPermissions: [P_PAYROLL_PERIOD_VIEW],
    },
  },
  {
    path: 'runs',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Runs...') }, React.createElement(PayrollRunsPage)),
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
  // {
  //   path: 'entries',
  //   element: <React.Suspense fallback={<div>Loading Payroll Entries...</div>}><PayrollEntriesPage /></React.Suspense>,
  //   meta: {
  //     title: '工资条目管理',
  //     // requiredPermissions: ['P_PAYROLL_ENTRY_VIEW'],
  //   },
  // },
]; 