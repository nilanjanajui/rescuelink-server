import { Request, Response, NextFunction } from 'express';
import { Role } from '../lib/auth';

/**
 * Restricts a route to one or more roles. Must run after verifyJWT,
 * since it reads req.user set by that middleware.
 *
 * Usage: router.post('/', verifyJWT, requireRole('user', 'admin'), handler)
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'Insufficient permissions for this action' });
    }

    next();
  };
};
