// Manager Module Routes
import React from 'react';
import type { AppRouteObject } from '../../router/routes';

// Import page components
import SubordinatesPage from './Subordinates';
import LeaveApprovalsPage from './LeaveApprovals';

// Manager module permissions (updated to match database)
export const P_MANAGER_SUBORDINATES_VIEW = 'manager:view_subordinates';
export const P_MANAGER_LEAVE_APPROVALS_VIEW = 'manager:view_leave_approvals';

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