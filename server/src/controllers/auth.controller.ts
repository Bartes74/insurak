import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { sendResetEmail } from '../lib/mailer';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const RESET_EXPIRY_MINUTES = 60;

const signToken = (payload: any) => jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role = 'USER', canEdit = false } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const userCount = await prisma.user.count();

    // Bootstrapping: allow first user without auth; afterwards only ADMIN can add users.
    if (userCount > 0) {
      const requester = (req as any).user;
      if (!requester || requester.role !== 'ADMIN') {
        res.status(403).json({ message: 'Only admins can create new users' });
        return;
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
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
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

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
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Do not leak existence
    res.status(200).json({ message: 'If the email exists, a reset link will be sent.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  await sendResetEmail({
    to: email,
    token,
    expiresAt,
  });

  res.status(200).json({ message: 'If the email exists, a reset link will be sent.' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ message: 'Token and new password are required' });
    return;
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.used || record.expiresAt < new Date()) {
    res.status(400).json({ message: 'Invalid or expired token' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  res.status(200).json({ message: 'Password updated successfully' });
};
