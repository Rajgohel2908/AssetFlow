import { ROLES } from '../data/mockData';

/**
 * Returns true if `userRole` is allowed.
 * Access matrix matches PRD role-based UI rules.
 */
const ACCESS = {
  dashboard:   [ROLES.EMPLOYEE, ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN],
  allocations: [ROLES.EMPLOYEE, ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN],
  booking:     [ROLES.EMPLOYEE, ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN],
  maintenance: [ROLES.EMPLOYEE, ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN],
  assets:      [ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN],
  allocation_mgmt: [ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN],
  audit:       [ROLES.ASSET_MANAGER, ROLES.ADMIN],
  reports:     [ROLES.ASSET_MANAGER, ROLES.ADMIN],
  logs:        [ROLES.ASSET_MANAGER, ROLES.ADMIN],
  org_setup:   [ROLES.ADMIN],
};

export function canAccess(route, role) {
  return ACCESS[route]?.includes(role) ?? false;
}

export { ACCESS };
