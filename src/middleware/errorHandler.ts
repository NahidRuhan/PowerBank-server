import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { sendError } from '../lib/response.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.errors, err.statusCode);
  }

  // Prisma unique constraint violation
  if ((err as any).code === 'P2002') {
    return sendError(res, 'Unique constraint failed', [], 409);
  }
  
  // Prisma not found error
  if ((err as any).code === 'P2025') {
     return sendError(res, 'Record not found', [], 404);
  }

  return sendError(res, 'Internal server error', [], 500);
};
