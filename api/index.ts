import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

// Vercel serverless function entrypoint
// Prisma auto-connects on first query, but we can optionally await connect here if needed.
// Exporting the Express app directly for Vercel's Serverless environment.

export default app;
