import { prisma } from '../../core/database/prisma';
import { authUtils } from '../../core/security/auth-utils';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../core/errors/app-error';
import { RegisterInput, LoginInput, RequestOTPInput, ResetPasswordOTPInput } from './auth.schema';
import { logger } from '../../core/logger/logger';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await authUtils.hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
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

    const accessToken = authUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = authUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, accessToken, refreshToken };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await authUtils.comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = authUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = authUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      accessToken,
      refreshToken,
    };
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
      throw new UnauthorizedError('User session expired or user no longer exists');
    }

    return user;
  }

  async requestOTP(input: RequestOTPInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    // To prevent user enumeration attacks, return success even if user not found
    if (!user) {
      return { message: 'If this email exists in our records, an OTP has been sent' };
    }

    const { code, expiresAt } = authUtils.generateOTP();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpSecret: code,
        otpExpiresAt: expiresAt,
      },
    });

    logger.info(`[AUTH] Password reset OTP generated for ${user.email}: [${code}] (Valid for 10 min)`);

    return {
      message: 'If this email exists in our records, an OTP has been sent',
      // In development mode, return OTP hint to streamline testing
      ...(process.env.NODE_ENV !== 'production' && { devOtpHint: code }),
    };
  }

  async resetPasswordWithOTP(input: ResetPasswordOTPInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.otpSecret || !user.otpExpiresAt) {
      throw new BadRequestError('Invalid or expired OTP session');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestError('OTP has expired. Please request a new one');
    }

    if (user.otpSecret !== input.otp) {
      throw new BadRequestError('Incorrect OTP code');
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

    logger.info(`[AUTH] Password successfully reset for user: ${user.email}`);

    return { message: 'Password has been successfully updated. You may now log in.' };
  }
}

export const authService = new AuthService();
