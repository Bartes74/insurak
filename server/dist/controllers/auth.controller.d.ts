import { Request, Response } from 'express';
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
export declare const register: (req: Request, res: Response) => Promise<void>;
/**
 * Authenticates a user and returns a JWT.
 */
export declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * Initiates the password reset flow.
 * usage: Sends an email with a reset token if the user exists.
 * Security: Always returns success to prevent email enumeration.
 */
export declare const forgotPassword: (req: Request, res: Response) => Promise<void>;
/**
 * Resets user password using a valid token.
 */
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
/**
 * Allows an authenticated user to change their own password.
 * Typically used to enforce "Change Password on First Login" or voluntary updates.
 */
export declare const changePassword: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map