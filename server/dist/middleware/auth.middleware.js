"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEditPermission = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        // console.log('❌ Auth Middleware: No token provided'); // Reduce log noise in production
        res.sendStatus(401);
        return;
    }
    jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, (err, user) => {
        if (err) {
            console.log('❌ Auth Middleware: Token verification failed:', err.message);
            res.sendStatus(401);
            return;
        }
        // We attach it to req.user which is typed in ../types/express.d.ts
        // Use type assertion to avoid exactOptionalPropertyTypes mismatch if any
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        console.log(`❌ Auth Middleware: Role mismatch. User role: ${req.user?.role}, Required: ${roles.join(',')}`);
        res.sendStatus(403);
        return;
    }
    next();
};
exports.requireRole = requireRole;
const requireEditPermission = (req, res, next) => {
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
exports.requireEditPermission = requireEditPermission;
//# sourceMappingURL=auth.middleware.js.map