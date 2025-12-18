"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const mailer_1 = require("../lib/mailer");
const config_1 = require("../config");
const auth_schema_1 = require("../schemas/auth.schema");
const RESET_EXPIRY_MINUTES = 60;
/**
 * Signs a JWT token with user details.
 * @param payload Object containing minimal user info (id, email, role)
 */
const signToken = (payload) => jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: '24h' });
/**
 * Registers a new user.
 *
 * Logic:
 * 1. Validates input using Zod.
 * 2. Checks if this is the FIRST user (bootstrapping). If so, allows registration without admin rights.
 * 3. If users exist, enforces ADMIN role for creating new users.
 * 4. Checks for email uniqueness.
 * 5. Hashes password and creates user.
 */
const register = async (req, res) => {
    try {
        const validation = auth_schema_1.registerSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ message: 'Validation error', errors: validation.error.format() });
            return;
        }
        const { email, password, role = 'USER', canEdit = false } = validation.data;
        const userCount = await prisma_1.default.user.count();
        // Bootstrapping: allow first user without auth; afterwards only ADMIN can add users.
        if (userCount > 0) {
            const requester = req.user;
            if (!requester || requester.role !== 'ADMIN') {
                res.status(403).json({ message: 'Only admins can create new users' });
                return;
            }
        }
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ message: 'User already exists' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                role: role,
                canEdit,
            },
        });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                canEdit: user.canEdit,
            },
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.register = register;
/**
 * Authenticates a user and returns a JWT.
 */
const login = async (req, res) => {
    try {
        const validation = auth_schema_1.loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ message: 'Validation error', errors: validation.error.format() });
            return;
        }
        const { email, password } = validation.data;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = signToken({ userId: user.id, email: user.email, role: user.role, canEdit: user.canEdit });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                canEdit: user.canEdit,
                mustChangePassword: user.mustChangePassword,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.login = login;
/**
 * Initiates the password reset flow.
 * usage: Sends an email with a reset token if the user exists.
 * Security: Always returns success to prevent email enumeration.
 */
const forgotPassword = async (req, res) => {
    const validation = auth_schema_1.forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ message: 'Validation error', errors: validation.error.format() });
        return;
    }
    const { email } = validation.data;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        // Return success to avoid leaking which emails exist in the DB
        res.status(200).json({ message: 'If the email exists, a reset link will be sent.' });
        return;
    }
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);
    await prisma_1.default.passwordResetToken.create({
        data: {
            token,
            userId: user.id,
            expiresAt,
        },
    });
    await (0, mailer_1.sendResetEmail)({
        to: email,
        token,
        expiresAt,
    });
    res.status(200).json({ message: 'If the email exists, a reset link will be sent.' });
};
exports.forgotPassword = forgotPassword;
/**
 * Resets user password using a valid token.
 */
const resetPassword = async (req, res) => {
    const validation = auth_schema_1.resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ message: 'Validation error', errors: validation.error.format() });
        return;
    }
    const { token, password } = validation.data;
    const record = await prisma_1.default.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
        res.status(400).json({ message: 'Invalid or expired token' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    // Transaction: Update password AND mark token as used
    await prisma_1.default.$transaction([
        prisma_1.default.user.update({ where: { id: record.userId }, data: { passwordHash } }),
        prisma_1.default.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);
    res.status(200).json({ message: 'Password updated successfully' });
};
exports.resetPassword = resetPassword;
/**
 * Allows an authenticated user to change their own password.
 * Typically used to enforce "Change Password on First Login" or voluntary updates.
 */
const changePassword = async (req, res) => {
    const validation = auth_schema_1.changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ message: 'Validation error', errors: validation.error.format() });
        return;
    }
    const { newPassword } = validation.data;
    if (!req.user || !req.user.userId) {
        res.sendStatus(401);
        return;
    }
    const userId = req.user.userId;
    const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: {
            passwordHash,
            mustChangePassword: false, // Clear flag if it was set
        },
    });
    res.json({ message: 'Password changed successfully' });
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.controller.js.map