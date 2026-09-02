import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';

import './config/passport.js'; // Initialize passport

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(globalLimiter);
app.use(passport.initialize());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use(errorHandler);

export default app;
