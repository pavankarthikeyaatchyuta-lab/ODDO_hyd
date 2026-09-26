import { Request, Response, NextFunction } from 'express';
import { authUtils, TokenPayload } from '../security/auth-utils';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid format');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authUtils.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
}
