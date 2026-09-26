import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const authUtils = {
  hashPassword: async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  generateAccessToken: (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn'],
    });
  },

  generateRefreshToken: (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRATION as jwt.SignOptions['expiresIn'],
    });
  },

  verifyAccessToken: (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  },

  generateOTP: (): { code: string; expiresAt: Date } => {
    // Generate 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return { code, expiresAt };
  },
};
