import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import zoneRoutes from './modules/zone/zone.routes.js';
import substationRoutes from './modules/substation/substation.routes.js';
import feederRoutes from './modules/feeder/feeder.routes.js';
import areaRoutes from './modules/area/area.routes.js';
import quotaRoutes from './modules/quota/quota.routes.js';
import scheduleRoutes from './modules/schedule/schedule.routes.js';
import incidentRoutes from './modules/incident/incident.routes.js';
import billRoutes from './modules/bill/bill.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

import './config/passport.js'; // Initialize passport

const app = express();

app.use(helmet());
app.use(cors());

// Stripe Webhook needs the raw body to verify signatures.
// Must be mounted BEFORE express.json()
import { PaymentController } from './modules/payment/payment.controller.js';
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.webhook,
);

app.use(express.json());
app.use(globalLimiter);
app.use(passport.initialize());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/zones', zoneRoutes);
app.use('/api/v1/substations', substationRoutes);
app.use('/api/v1/feeders', feederRoutes);
app.use('/api/v1/areas', areaRoutes);
app.use('/api/v1/quotas', quotaRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// Simple frontend redirect routes for Stripe Checkout
app.get('/payment-success', (req, res) => {
    res.send(`
        <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #4CAF50;">✅ Payment Successful!</h1>
                <p>Your electricity bill has been paid.</p>
                <p style="color: gray; font-size: 0.9em;">Session ID: ${req.query.session_id}</p>
                <p>You can close this window and check Postman.</p>
            </body>
        </html>
    `);
});

app.get('/payment-cancel', (req, res) => {
    res.send(`
        <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #F44336;">❌ Payment Cancelled</h1>
                <p>You cancelled the checkout process. Your bill is still UNPAID.</p>
                <p>You can close this window.</p>
            </body>
        </html>
    `);
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use(errorHandler);

export default app;
