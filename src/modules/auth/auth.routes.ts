import { Router } from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
      }
      const tokens = await AuthService.generateTokens(req.user);
      // In a real app you might redirect to frontend with tokens, but for API only we return JSON
      return res
        .status(200)
        .json({ success: true, message: 'Google login successful', data: tokens });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
