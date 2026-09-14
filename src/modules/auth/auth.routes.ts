import { Router } from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { validate } from '../../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err: any, user: any, info: any) => {
    try {
      if (err) {
        return next(err);
      }
      if (!user) {
        // This catches the custom error we throw in passport.ts (e.g., "User not found. Please register...")
        return res.status(401).json({
          success: false,
          message: info?.message || 'Authentication failed',
        });
      }

      const tokens = await AuthService.generateTokens(user as import('@prisma/client').User);
      // In a real app you might redirect to frontend with tokens, but for API only we return JSON
      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: tokens,
      });
    } catch (e) {
      next(e);
    }
  })(req, res, next);
});

export default router;
