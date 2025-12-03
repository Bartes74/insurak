import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

export const listUsers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, canEdit: true, createdAt: true },
    orderBy: { id: 'asc' },
  });
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const { email, password, role = 'USER', canEdit = false } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, role, canEdit },
    select: { id: true, email: true, role: true, canEdit: true, createdAt: true },
  });
  res.status(201).json(user);
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, password, role, canEdit } = req.body;
  const data: any = {};
  if (email) data.email = email;
  if (typeof canEdit === 'boolean') data.canEdit = canEdit;
  if (role) data.role = role;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: { id: true, email: true, role: true, canEdit: true, createdAt: true },
  });
  res.json(user);
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id: Number(id) } });
  res.status(204).send();
};

export const getNotificationSettings = async (_req: Request, res: Response) => {
  const settings = await prisma.notificationSetting.findFirst();
  res.json(
    settings || { defaultLeadDays: 30, followUpLeadDays: 10, deadlineLeadDays: 0 }
  );
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  const { defaultLeadDays = 30, followUpLeadDays = 10, deadlineLeadDays = 0 } = req.body;
  const existing = await prisma.notificationSetting.findFirst();
  const data = { defaultLeadDays, followUpLeadDays, deadlineLeadDays };
  const saved = existing
    ? await prisma.notificationSetting.update({ where: { id: existing.id }, data })
    : await prisma.notificationSetting.create({ data });
  res.json(saved);
};

export const listRecipients = async (_req: Request, res: Response) => {
  const recipients = await prisma.notificationRecipient.findMany({
    where: { assetId: null },
    orderBy: { id: 'asc' },
  });
  res.json(recipients);
};

export const addRecipient = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }
  const recipient = await prisma.notificationRecipient.create({ data: { email } });
  res.status(201).json(recipient);
};

export const deleteRecipient = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.notificationRecipient.delete({ where: { id: Number(id) } });
  res.status(204).send();
};
