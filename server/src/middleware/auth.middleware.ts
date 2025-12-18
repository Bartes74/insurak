import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Middleware to authenticate requests using JWT.
 * Verifies the token from the 'Authorization' header.
 * Attaches the decoded user payload to `req.user`.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.sendStatus(401); // Unauthorized
    return;
  }

  jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
    if (err) {
      console.warn(`⚠️ Auth Warning: Token verification failed: ${err.message}`);
      res.sendStatus(401); // Unauthorized
      return;
    }

    // Attach user to request object for downstream use.
    // The type for req.user is augmented in types/express.d.ts
    req.user = user as NonNullable<Express.Request['user']>;
    next();
  });
};

/**
 * Middleware factory to authorize requests based on user roles.
 * @param roles Array of allowed roles (e.g. ['ADMIN'])
 */
export const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  if (!roles.includes(req.user.role)) {
    console.warn(`⛔ Access Denied: User role '${req.user.role}' does not match required roles: ${roles.join(', ')}`);
    res.sendStatus(403); // Forbidden
    return;
  }
  next();
};

/**
 * Middleware to check if the user has permission to edit resources.
 * Admins always have access. Regular users need `canEdit` flag.
 */
export const requireEditPermission = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  if (req.user.role === 'ADMIN' || req.user.canEdit) {
    return next();
  }

  console.warn(`⛔ Access Denied: User ${req.user.email} lacks edit permissions.`);
  res.sendStatus(403);
};

