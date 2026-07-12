import { ApiError } from '../utils/apiError.js';

// ─── Role-Based Access Control ────────────────────────────────────────────────
//
// Role hierarchy (higher index = more access):
//   0: EMPLOYEE
//   1: DEPARTMENT_HEAD
//   2: ASSET_MANAGER
//   3: ADMIN
//
// Always use requireRole() with authenticate() before it in the middleware chain.

const ROLE_HIERARCHY = {
  EMPLOYEE: 0,
  DEPARTMENT_HEAD: 1,
  ASSET_MANAGER: 2,
  ADMIN: 3,
};

/**
 * requireRole(...roles) — Gate middleware: allows only users whose role is
 * in the provided list. Must be used AFTER authenticate().
 *
 * Usage:
 *   router.patch('/:id/role', authenticate, requireRole('ADMIN'), updateRole);
 *   router.post('/', authenticate, requireRole('ASSET_MANAGER', 'ADMIN'), createAsset);
 *
 * @param {...string} roles - One or more Role enum values
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return next(
        new ApiError(
          403,
          `Access denied. Required role(s): ${roles.join(' or ')}. Your role: ${userRole}`
        )
      );
    }

    next();
  };
};

/**
 * requireMinRole(minRole) — Gate middleware: allows users at or above a
 * minimum role level in the hierarchy.
 *
 * Usage:
 *   router.get('/reports', authenticate, requireMinRole('ASSET_MANAGER'), getReports);
 *
 * @param {string} minRole - Minimum Role enum value
 */
export const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
    const minLevel = ROLE_HIERARCHY[minRole] ?? 999;

    if (userLevel < minLevel) {
      return next(
        new ApiError(
          403,
          `Access denied. Minimum required role: ${minRole}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
};
