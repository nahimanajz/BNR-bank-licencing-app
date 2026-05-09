import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../utils/errors';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError('Forbidden'));
    }
    next();
  };
};
