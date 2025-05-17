export interface AppRouteObject extends Omit<RouteObject, 'children' | 'index' | 'path'> {
  // Allow undefined path for errorElement.
  path?: string;
  index?: boolean;
  children?: AppRouteObject[];
  meta?: AppRouteObjectMeta;
  element?: React.ReactNode; // Ensure element is compatible
}

export interface AppRouteObjectMeta {
  title?: string;
  icon?: React.ReactNode;
  roles?: string[]; // Roles that can access this route
  requiresAuth?: boolean; // Does this route require authentication?
  hideInMenu?: boolean; // Should this route be hidden in the menu?
  hideInBreadcrumbIfParentOfNext?: boolean; // Should this route segment be hidden in breadcrumbs if it's a parent of the next active segment?
} 