"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEditPermission = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log('❌ Auth Middleware: No token provided');
        res.sendStatus(401);
        return;
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Auth Middleware: Token verification failed:', err.message);
            res.sendStatus(401); // Changed from 403 to 401 for invalid token
            return;
        }
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