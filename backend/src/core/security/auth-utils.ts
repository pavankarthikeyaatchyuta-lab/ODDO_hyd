import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { UserRole, PermissionKey, RolePermissionsMap } from '../../types/shared';
import { UnauthorizedError } from '../errors/app-error';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: PermissionKey[];
  jti: string;
}

// In-memory blacklist for revoked JWT tokens (e.g., on logout)
const revokedTokens = new Set<string>();

export const authUtils = {
  hashPassword: async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  getPermissionsForRole: (role: string): PermissionKey[] => {
    const typedRole = role as UserRole;
    return RolePermissionsMap[typedRole] || [];
  },

  generateAccessToken: (user: { id: string; email: string; role: string }): string => {
    const permissions = authUtils.getPermissionsForRole(user.role);
    const jti = crypto.randomUUID();
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      permissions,
      jti,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn'],
    });
  },

  generateRefreshToken: (user: { id: string; email: string; role: string }): string => {
    const jti = crypto.randomUUID();
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role, jti },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRATION as jwt.SignOptions['expiresIn'] }
    );
  },

  verifyAccessToken: (token: string): TokenPayload => {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
      if (revokedTokens.has(decoded.jti)) {
        throw new UnauthorizedError('Session has been revoked. Please log in again.');
      }
      return decoded;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) throw err;
      const jwtErr = err as { name?: string; message?: string };
      if (jwtErr.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Authentication session has expired. Please refresh your token or log in again.');
      }
      throw new UnauthorizedError('Invalid authentication token');
    }
  },

  verifyRefreshToken: (token: string): { userId: string; email: string; role: string; jti: string } => {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        userId: string;
        email: string;
        role: string;
        jti: string;
      };
      if (revokedTokens.has(decoded.jti)) {
        throw new UnauthorizedError('Refresh token has been revoked. Please log in again.');
      }
      return decoded;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) throw err;
      const jwtErr = err as { name?: string };
      if (jwtErr.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired. Please log in again.');
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  },

  revokeToken: (jti: string): void => {
    revokedTokens.add(jti);
  },

  generateOTP: (): { code: string; expiresAt: Date } => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    return { code, expiresAt };
  },
};
