import { Request, Response, NextFunction } from 'express';
import { authUtils, TokenPayload } from '../security/auth-utils';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { PermissionKey, UserRole } from '../../types/shared';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid format. Please provide a Bearer token.');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('Authentication token missing.');
  }

  const payload = authUtils.verifyAccessToken(token);
  req.user = payload;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required.');
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'`
      );
    }

    next();
  };
}

export function requirePermission(permission: PermissionKey) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required.');
    }

    // Admins possess universal superuser privileges
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const hasPermission = req.user.permissions && req.user.permissions.includes(permission);
    if (!hasPermission) {
      throw new ForbiddenError(
        `Access forbidden: missing required permission '${permission}'. Current role '${req.user.role}' does not have this capability.`
      );
    }

    next();
  };
}

export function requireAnyPermission(permissions: PermissionKey[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required.');
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    const hasAny = permissions.some((perm) => req.user?.permissions?.includes(perm));
    if (!hasAny) {
      throw new ForbiddenError(
        `Access forbidden: requires at least one of permissions: [${permissions.join(', ')}].`
      );
    }

    next();
  };
}
