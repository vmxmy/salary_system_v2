import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { AppRouteObject } from '../../router/routes'; // Assuming AppRouteObject is exported from main router
import i18n from '../../i18n'; // Added
import PayrollPeriodsPage from './pages/PayrollPeriodsPage';
import PayrollRunsPage from './pages/PayrollRunsPage';
import PayrollRunDetailPage from './pages/PayrollRunDetailPage';
import {
  P_PAYROLL_PERIOD_VIEW,
  P_PAYROLL_RUN_VIEW
} from './constants/payrollPermissions'; // Corrected import path

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
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, i18n.t('common.loading_payroll_periods')) }, React.createElement(PayrollPeriodsPage)),
    meta: {
      title: i18n.t('page_title.payroll_periods'),
      requiredPermissions: [P_PAYROLL_PERIOD_VIEW],
    },
  },
  {
    path: 'runs',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, i18n.t('common.loading_payroll_runs')) }, React.createElement(PayrollRunsPage)),
    meta: {
      title: i18n.t('page_title.payroll_runs'),
      requiredPermissions: [P_PAYROLL_RUN_VIEW],
    },
  },
  {
    path: 'runs/:runId',
    element: React.createElement(PayrollRunDetailPage),
    meta: {
      title: i18n.t('page_title.payroll_run_detail'),
      requiredPermissions: [P_PAYROLL_RUN_VIEW], 
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