import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // console.log('❌ Auth Middleware: No token provided'); // Reduce log noise in production
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
    if (err) {
      console.log('❌ Auth Middleware: Token verification failed:', err.message);
      res.sendStatus(401);
      return;
    }
    // We attach it to req.user which is typed in ../types/express.d.ts
    // Use type assertion to avoid exactOptionalPropertyTypes mismatch if any
    req.user = user as NonNullable<Express.Request['user']>;
    next();
  });
};

export const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    console.log(`❌ Auth Middleware: Role mismatch. User role: ${req.user?.role}, Required: ${roles.join(',')}`);
    res.sendStatus(403);
    return;
  }
  next();
};

export const requireEditPermission = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }
  if (req.user.role === 'ADMIN') {
    return next();
  }
  if (req.user.canEdit) {
    return next();
  }
  res.sendStatus(403);
};
