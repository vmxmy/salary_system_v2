import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { AppRouteObject } from '../../router/routes'; // Assuming AppRouteObject is exported from main router
// import i18n from '../../i18n'; // 移除此导入
import PayrollPeriodsPageV2 from './pages/PayrollPeriodsPageV2';
import PayrollPeriodsPageModern from './pages/PayrollPeriodsPageModern';
import PayrollRunsPageV2 from './pages/PayrollRunsPageV2';
import PayrollRunsPageModern from './pages/PayrollRunsPageModern';
import PayrollRunDetailPage from './pages/PayrollRunDetailPage';
import PayrollRunDetailPageModern from './pages/PayrollRunDetailPageModern';
import PayrollCalculationConfigPageModern from './pages/PayrollCalculationConfigPageModern';
import PayrollEntryPage from './pages/PayrollEntryPage';

import UniversalImportPage from './pages/PayrollBulkImportPage/UniversalImportPage';
import PayrollComponentsPage from './pages/PayrollComponentsPage';
import PayrollCalculationConfigPage from './pages/PayrollCalculationConfigPage';
import AttendanceManagementPage from './pages/AttendanceManagementPage';
import PayrollPeriodDetailPage from './pages/PayrollPeriodDetailPage';
import CalculationLogsPage from './pages/CalculationLogsPage';
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
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Periods...') }, React.createElement(PayrollPeriodsPageModern)),
    meta: {
      title: 'pageTitle:payroll_periods', // 修改为使用pageTitle命名空间
      requiredPermissions: [P_PAYROLL_PERIOD_VIEW],
    },
  },
  {
    path: 'periods/:periodId',
    element: React.createElement(PayrollPeriodDetailPage),
    meta: {
      title: 'pageTitle:payroll_period_detail', // New translation key for payroll period detail
      requiredPermissions: [P_PAYROLL_PERIOD_VIEW], 
    },
  },
  {
    path: 'runs',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Payroll Runs...') }, React.createElement(PayrollRunsPageModern)),
    meta: {
      title: 'payroll:page_title.payroll_runs', // 使用静态翻译键
      requiredPermissions: [P_PAYROLL_RUN_VIEW],
    },
  },
  {
    path: 'runs/:runId',
    element: React.createElement(PayrollRunDetailPageModern),
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
    path: 'universal-import',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Universal Import...') }, React.createElement(UniversalImportPage)),
    meta: {
      title: '通用批量导入', // 通用导入页面标题
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
  {
    path: 'calculation-config',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Calculation Config...') }, React.createElement(PayrollCalculationConfigPageModern)),
    meta: {
      title: 'payroll:calculation_config.page_title', // 薪资计算配置页面标题
      requiredPermissions: [P_PAYROLL_COMPONENT_VIEW], // 暂时使用组件查看权限，后续可以添加专门的权限
    },
  },
  {
    path: 'attendance',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Attendance Management...') }, React.createElement(AttendanceManagementPage)),
    meta: {
      title: 'payroll:attendance.page_title', // 考勤管理页面标题
      requiredPermissions: [P_PAYROLL_COMPONENT_VIEW], // 暂时使用组件查看权限，后续可以添加专门的权限
    },
  },
  {
    path: 'calculation-logs',
    element: React.createElement(React.Suspense, { fallback: React.createElement('div', null, 'Loading Calculation Logs...') }, React.createElement(CalculationLogsPage)),
    meta: {
      title: 'payroll:calculation_logs.page_title', // 计算日志页面标题
      requiredPermissions: [P_PAYROLL_RUN_VIEW], // 使用薪资运行查看权限
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