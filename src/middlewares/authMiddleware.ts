import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../utils/errors';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AuthenticationError('No token provided'));

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    next();
  } catch {
    next(new AuthenticationError('Invalid token'));
  }
};
