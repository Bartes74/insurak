"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEditPermission = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
/**
 * Middleware to authenticate requests using JWT.
 * Verifies the token from the 'Authorization' header.
 * Attaches the decoded user payload to `req.user`.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.sendStatus(401); // Unauthorized
        return;
    }
    jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, (err, user) => {
        if (err) {
            console.warn(`⚠️ Auth Warning: Token verification failed: ${err.message}`);
            res.sendStatus(401); // Unauthorized
            return;
        }
        // Attach user to request object for downstream use.
        // The type for req.user is augmented in types/express.d.ts
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware factory to authorize requests based on user roles.
 * @param roles Array of allowed roles (e.g. ['ADMIN'])
 */
const requireRole = (roles) => (req, res, next) => {
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
exports.requireRole = requireRole;
/**
 * Middleware to check if the user has permission to edit resources.
 * Admins always have access. Regular users need `canEdit` flag.
 */
const requireEditPermission = (req, res, next) => {
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
exports.requireEditPermission = requireEditPermission;
//# sourceMappingURL=auth.middleware.js.map