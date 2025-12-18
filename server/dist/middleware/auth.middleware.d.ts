import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to authenticate requests using JWT.
 * Verifies the token from the 'Authorization' header.
 * Attaches the decoded user payload to `req.user`.
 */
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware factory to authorize requests based on user roles.
 * @param roles Array of allowed roles (e.g. ['ADMIN'])
 */
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if the user has permission to edit resources.
 * Admins always have access. Regular users need `canEdit` flag.
 */
export declare const requireEditPermission: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map