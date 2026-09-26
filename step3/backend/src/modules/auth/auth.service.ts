import { prisma } from '../../core/database/prisma';
import { authUtils } from '../../core/security/auth-utils';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../core/errors/app-error';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  UpdateProfileInput,
  RequestOTPInput,
  ResetPasswordOTPInput,
} from './auth.schema';
import { logger } from '../../core/logger/logger';
import { UserRole } from '../../types/shared';

export class AuthService {
  async register(input: RegisterInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists in the system.');
    }

    const passwordHash = await authUtils.hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        role: input.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const accessToken = authUtils.generateAccessToken(user);
    const refreshToken = authUtils.generateRefreshToken(user);
    const permissions = authUtils.getPermissionsForRole(user.role);

    logger.info(`[AUTH] New user registered: ${user.email} (Role: ${user.role})`);

    return {
      user: {
        ...user,
        role: user.role as UserRole,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(input: LoginInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials. Check email and password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact an Administrator.');
    }

    const isMatch = await authUtils.comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials. Check email and password.');
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = authUtils.generateAccessToken(user);
    const refreshToken = authUtils.generateRefreshToken(user);
    const permissions = authUtils.getPermissionsForRole(user.role);

    logger.info(`[AUTH] User authenticated: ${user.email} (Role: ${user.role})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(refreshTokenStr: string) {
    const decoded = authUtils.verifyRefreshToken(refreshTokenStr);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User session expired or account deactivated.');
    }

    // Revoke old refresh token to prevent replay
    authUtils.revokeToken(decoded.jti);

    const newAccessToken = authUtils.generateAccessToken(user);
    const newRefreshToken = authUtils.generateRefreshToken(user);
    const permissions = authUtils.getPermissionsForRole(user.role);

    return {
      user: {
        ...user,
        role: user.role as UserRole,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        permissions,
      },
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  async logout(accessTokenJti?: string, refreshTokenStr?: string) {
    if (accessTokenJti) {
      authUtils.revokeToken(accessTokenJti);
    }

    if (refreshTokenStr) {
      try {
        const decoded = authUtils.verifyRefreshToken(refreshTokenStr);
        if (decoded?.jti) {
          authUtils.revokeToken(decoded.jti);
        }
      } catch {
        // Ignored during logout cleanup
      }
    }

    return { message: 'Successfully logged out. All active session tokens revoked.' };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const permissions = authUtils.getPermissionsForRole(user.role);

    return {
      ...user,
      role: user.role as UserRole,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      permissions,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName && { firstName: input.firstName.trim() }),
        ...(input.lastName && { lastName: input.lastName.trim() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    const permissions = authUtils.getPermissionsForRole(updated.role);

    return {
      ...updated,
      role: updated.role as UserRole,
      lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
      permissions,
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const isMatch = await authUtils.comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('The current password you entered is incorrect.');
    }

    const isSamePassword = await authUtils.comparePassword(input.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestError('New password cannot be identical to your current password.');
    }

    const newHash = await authUtils.hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    logger.info(`[AUTH] Password changed successfully for user: ${user.email}`);

    return { message: 'Password has been updated successfully.' };
  }

  async requestOTP(input: RequestOTPInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Anti-enumeration: Return uniform message whether user exists or not
    if (!user || !user.isActive) {
      return {
        message: 'If an active account exists with this email, an OTP has been dispatched.',
      };
    }

    const { code, expiresAt } = authUtils.generateOTP();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpSecret: code,
        otpExpiresAt: expiresAt,
      },
    });

    logger.info(`[AUTH] Password reset OTP generated for ${user.email}: [${code}] (Expires at: ${expiresAt.toISOString()})`);

    return {
      message: 'If an active account exists with this email, an OTP has been dispatched.',
      ...(process.env.NODE_ENV !== 'production' && { devOtpHint: code }),
    };
  }

  async resetPasswordWithOTP(input: ResetPasswordOTPInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.otpSecret || !user.otpExpiresAt) {
      throw new BadRequestError('No active OTP password reset request found for this email.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestError('The OTP code has expired. Please request a new code.');
    }

    if (user.otpSecret !== input.otp) {
      throw new BadRequestError('Invalid OTP code. Please enter the correct 6-digit code.');
    }

    const passwordHash = await authUtils.hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otpSecret: null,
        otpExpiresAt: null,
      },
    });

    logger.info(`[AUTH] Password reset completed successfully via OTP for: ${user.email}`);

    return { message: 'Password has been successfully reset. You may now log in with your new credentials.' };
  }
}

export const authService = new AuthService();
