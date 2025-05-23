// Manager Module Routes
import React from 'react';
import type { AppRouteObject } from '../../router/routes';

// Import page components
import SubordinatesPage from './Subordinates';
import LeaveApprovalsPage from './LeaveApprovals';

// Manager module permissions (placeholder for now)
export const P_MANAGER_SUBORDINATES_VIEW = 'P_MANAGER_SUBORDINATES_VIEW';
export const P_MANAGER_LEAVE_APPROVALS_VIEW = 'P_MANAGER_LEAVE_APPROVALS_VIEW';

export const managerRoutes: AppRouteObject[] = [
  {
    index: true,
    element: React.createElement(SubordinatesPage),
    meta: {
      title: 'pageTitle:subordinates',
      requiredPermissions: [P_MANAGER_SUBORDINATES_VIEW],
    },
  },
  {
    path: 'subordinates',
    element: React.createElement(SubordinatesPage),
    meta: {
      title: 'pageTitle:subordinates',
      requiredPermissions: [P_MANAGER_SUBORDINATES_VIEW],
    },
  },
  {
    path: 'leave-approvals',
    element: React.createElement(LeaveApprovalsPage),
    meta: {
      title: 'pageTitle:leave_approvals',
      requiredPermissions: [P_MANAGER_LEAVE_APPROVALS_VIEW],
    },
  },
]; 