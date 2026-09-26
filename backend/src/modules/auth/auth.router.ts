import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../core/middleware/validate';
import { requireAuth } from '../../core/middleware/auth-guard';
import {
  RegisterSchema,
  LoginSchema,
  RequestOTPSchema,
  ResetPasswordOTPSchema,
} from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', validateRequest(RegisterSchema), (req, res, next) =>
  authController.register(req, res, next)
);

authRouter.post('/login', validateRequest(LoginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

authRouter.get('/me', requireAuth, (req, res, next) =>
  authController.getCurrentUser(req, res, next)
);

authRouter.post('/otp/request', validateRequest(RequestOTPSchema), (req, res, next) =>
  authController.requestOTP(req, res, next)
);

authRouter.post('/otp/reset', validateRequest(ResetPasswordOTPSchema), (req, res, next) =>
  authController.resetPasswordWithOTP(req, res, next)
);
